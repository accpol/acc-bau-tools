/**
 * Wejście dla systemu firmowego ACC BAU (moduł Faktury): lista pojazdów oraz dopisanie
 * wpisu z fakturą do historii pojazdu.
 *
 * - Działa tylko z tajnym kluczem FLEET_IMPORT_SECRET (min. 32 znaki) w nagłówku Authorization.
 *   Bez tej zmiennej adres odpowiada SETUP_REQUIRED i niczego nie czyta ani nie zapisuje.
 * - Nie używa sesji ani ciasteczek użytkowników Tools i niczego w nich nie zmienia.
 * - Zapisuje wyłącznie tą samą drogą co ekran Pojazdy: prepareCommand + acc_fleet_apply_command.
 *   Obowiązują więc te same reguły (przebieg, daty, wersja pojazdu, historia tylko dopisywana).
 * - Niczego nie usuwa i nie edytuje istniejących wpisów ani plików.
 */
import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { assert, FleetError, numberOrNull, prepareCommand, text, uuid } from "@/lib/fleet/domain";
import { BUCKET, checkDb, commandHash, db, EVENT_COLUMNS, getVehicle, rows } from "@/lib/fleet/server";
import type { FleetCommand, FleetEvent, FleetMember, Vehicle } from "@/lib/fleet/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BODY = 6_000_000; // base64 pliku do ok. 4 MB
const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };
const CURRENCIES = ["EUR", "PLN", "SEK", "DKK", "CZK", "GBP", "USD"];
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" } });

function failure(e: unknown) {
  if (e instanceof FleetError) return json({ error: e.code }, e.status);
  console.error("system fleet import failed", e instanceof Error ? e.message : "unknown");
  return json({ error: "SERVER_ERROR" }, 500);
}
function authorize(req: NextRequest): void {
  const secret = process.env.FLEET_IMPORT_SECRET || "";
  assert(secret.length >= 32, "SETUP_REQUIRED", "SETUP_REQUIRED", 503);
  const given = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const a = createHash("sha256").update(given).digest(), b = createHash("sha256").update(secret).digest();
  assert(given.length > 0 && timingSafeEqual(a, b), "FORBIDDEN", "FORBIDDEN", 403);
}
function magicOk(mime: string, bytes: Buffer): boolean {
  return mime === "application/pdf" ? bytes.subarray(0, 5).toString() === "%PDF-" :
    mime === "image/jpeg" ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff :
    mime === "image/png" ? bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" :
    bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
}
const summary = (v: Vehicle) => ({ id: v.id, plate: v.data.plate, name: v.data.name, make: v.data.make, model: v.data.model,
  year: v.data.year, category: v.data.category, mileage: v.data.mileage, mileageDate: v.data.mileageDate });

/** Lista aktywnych pojazdów do wyboru przy fakturze. */
export async function GET(req: NextRequest) {
  try {
    authorize(req);
    const vehicles = await rows<Vehicle>(db(), "acc_fleet_vehicles", "*");
    return json({ vehicles: vehicles.filter(v => !v.data.archived).map(summary) });
  } catch (e) { return failure(e); }
}

/** Dopisuje jeden wpis (serwis, naprawa albo sam dokument) z opcjonalnym plikiem faktury. */
export async function POST(req: NextRequest) {
  try {
    authorize(req);
    assert(req.headers.get("content-type")?.startsWith("application/json"), "JSON_REQUIRED", "JSON_REQUIRED", 415);
    const raw = await req.text(); assert(raw.length <= MAX_BODY, "PAYLOAD_TOO_LARGE", "PAYLOAD_TOO_LARGE", 413);
    let input: Record<string, unknown>;
    try { input = JSON.parse(raw); } catch { throw new FleetError("INVALID_PAYLOAD", "INVALID_PAYLOAD"); }
    assert(input && typeof input === "object" && !Array.isArray(input), "INVALID_PAYLOAD");

    const vehicleId = uuid(input.vehicleId), commandId = uuid(input.commandId);
    const type = text(input.type, 20, true); assert(["service", "repair", "document"].includes(type), "UNKNOWN_COMMAND");
    const actor = text(input.actor, 120, true);
    // Wpis jest podpisany jako pochodzący z systemu firmowego – widać, kto go dodał i skąd.
    const member: FleetMember = { id: commandId, name: `System firmowy · ${actor}`.slice(0, 160), role: "admin", active: true, auth_version: 1 };
    const client = db();

    const fileInput = input.file == null ? null : input.file as Record<string, unknown>;
    assert(fileInput === null || (typeof fileInput === "object" && !Array.isArray(fileInput)), "INVALID_FILES");
    const fileId = fileInput ? uuid(fileInput.id) : null;

    const currency = (text(input.currency, 3) || "PLN").toUpperCase();
    const cost = numberOrNull(input.cost, 100_000_000);
    const payload: Record<string, unknown> = type === "document"
      ? { title: text(input.title, 160, true), notes: text(input.notes, 3000) }
      : { date: input.date, mileage: input.mileage, title: text(input.title, 160, true), notes: text(input.notes, 6000),
          workshop: text(input.workshop, 200), invoiceNumber: text(input.invoiceNumber, 100),
          cost: CURRENCIES.includes(currency) ? cost : null, currency: CURRENCIES.includes(currency) ? currency : "PLN",
          costBasis: "gross", completions: [] };

    for (let attempt = 0; ; attempt++) {
      const vehicle = await getVehicle(client, vehicleId);
      assert(vehicle, "NOT_FOUND", "NOT_FOUND", 404);
      const cmd: FleetCommand = { commandId, vehicleId, expectedVersion: vehicle.version, type, payload, fileIds: fileId ? [fileId] : [] };

      // Ten sam wpis wysłany drugi raz (np. po zerwanym połączeniu) nie tworzy duplikatu.
      const { data: prior, error: priorError } = await client.from("acc_fleet_events").select("vehicle_id,kind").eq("id", commandId).maybeSingle(); checkDb(priorError);
      if (prior) {
        assert(prior.vehicle_id === vehicleId, "IDEMPOTENCY_MISMATCH", "IDEMPOTENCY_MISMATCH", 409);
        return json({ ok: true, already: true, eventId: commandId, kind: prior.kind, vehicle: summary(vehicle) });
      }

      // Najpierw pełna walidacja wpisu (bez zapisu), dopiero potem plik – błędny wpis nie zostawia pliku.
      const events = await rows<FleetEvent>(client, "acc_fleet_events", EVENT_COLUMNS, vehicleId);
      const prepared = prepareCommand(cmd, vehicle, events, member);

      if (fileInput && fileId) {
        const name = text(fileInput.name, 200, true), mime = text(fileInput.mime, 100, true);
        assert(EXTENSIONS[mime], "FILE_TYPE_SIZE");
        assert(typeof fileInput.data === "string" && /^[A-Za-z0-9+/]+=*$/.test(fileInput.data), "INVALID_FILES");
        const bytes = Buffer.from(fileInput.data as string, "base64");
        assert(bytes.length > 0 && bytes.length <= 20 * 1024 * 1024 && magicOk(mime, bytes), "FILE_TYPE_SIZE");
        const storagePath = `${vehicleId}/${fileId}.${EXTENSIONS[mime]}`;
        const { data: existing, error: lookupError } = await client.from("acc_fleet_files").select("*").eq("id", fileId).maybeSingle(); checkDb(lookupError);
        if (existing) {
          assert(existing.vehicle_id === vehicleId && existing.size === bytes.length && existing.mime === mime && existing.category === "invoice" && !existing.event_id, "IDEMPOTENCY_MISMATCH", "IDEMPOTENCY_MISMATCH", 409);
        } else {
          const { error } = await client.from("acc_fleet_files").insert({ id: fileId, vehicle_id: vehicleId, path: storagePath, name, mime, size: bytes.length, category: "invoice", created_by: member.name }); checkDb(error);
        }
        if (!existing || existing.state !== "ready") {
          const { error: uploadError } = await client.storage.from(BUCKET).upload(storagePath, bytes, { contentType: mime, upsert: false });
          assert(!uploadError || /exists|duplicate/i.test(uploadError.message || ""), "FILE_ERROR", "FILE_ERROR", 503);
          const hash = createHash("sha256").update(bytes).digest("hex");
          const { error: saveError } = await client.from("acc_fleet_files").update({ state: "ready", sha256: hash }).eq("id", fileId).eq("state", "pending"); checkDb(saveError);
        }
      }

      const { error } = await client.rpc("acc_fleet_apply_command", {
        p_vehicle_id: vehicleId, p_expected_version: cmd.expectedVersion, p_command_id: commandId,
        p_kind: prepared.event.kind, p_happened_on: prepared.event.happened_on, p_event_data: prepared.event.data,
        p_vehicle_data: prepared.data, p_actor: member.name, p_command_hash: commandHash(cmd), p_file_ids: cmd.fileIds,
      });
      // Ktoś zapisał zmianę w pojeździe w tej samej chwili: czytamy pojazd jeszcze raz i ponawiamy jeden raz.
      if (error && (error.message || "").includes("CONFLICT") && attempt === 0) continue;
      checkDb(error);
      return json({ ok: true, eventId: commandId, kind: prepared.event.kind, vehicle: summary(vehicle) });
    }
  } catch (e) { return failure(e); }
}
