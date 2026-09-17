import { randomUUID } from "node:crypto";
import { z } from "zod";
import { canOperate, FleetError } from "@/lib/fleet/domain";
import { sniffMime } from "@/lib/fleet/logic";
import { uploadSchema } from "@/lib/fleet/schema";
import { authenticate, BUCKET, fail, getVehicle, readJson, response } from "@/lib/fleet/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const idSchema = z.string().uuid();

export async function GET(request: Request) {
  try {
    const { db, me } = await authenticate(request);
    const id = new URL(request.url).searchParams.get("id");
    if (!idSchema.safeParse(id).success) throw new FleetError("Nieprawidłowy identyfikator pliku.");
    const { data: file, error } = await db.from("acc_fleet_files").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!file || !file.ready || !file.event_id) throw new FleetError("Plik nie jest dostępny.", 404);
    if (me.role !== "admin" && !["photo", "damage"].includes(file.kind)) throw new FleetError("Dokumenty i faktury są dostępne tylko administratorowi.", 403);
    const signed = await db.storage.from(BUCKET).createSignedUrl(file.storage_path, 120);
    if (signed.error) throw signed.error;
    return response({ url: signed.data.signedUrl, expiresIn: 120 });
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    const { db, me } = await authenticate(request);
    const raw = await readJson(request);
    const body = z.object({ action: z.enum(["prepare", "complete", "discard"]), data: z.unknown() }).strict().safeParse(raw);
    if (!body.success) throw new FleetError("Nieprawidłowe żądanie pliku.");
    if (body.data.action === "prepare") {
      const parsed = uploadSchema.safeParse(body.data.data);
      if (!parsed.success) throw new FleetError("Dozwolone są JPG, PNG, WEBP i PDF do 12 MB.");
      const upload = parsed.data;
      const vehicle = await getVehicle(db, upload.vehicleId);
      if (!vehicle || vehicle.status === "archived" || !canOperate(me, vehicle)) throw new FleetError("Brak dostępu do dodawania plików tego pojazdu.", 403);
      if (me.role !== "admin" && !["photo", "damage"].includes(upload.kind)) throw new FleetError("Faktury i dokumenty dodaje administrator.", 403);
      if (["photo", "damage"].includes(upload.kind) && !upload.mime.startsWith("image/")) throw new FleetError("Wybierz zdjęcie JPG, PNG lub WEBP.");
      const recent = await db.from("acc_fleet_files").select("id", { count: "exact", head: true }).eq("created_by", me.userId).is("event_id", null)
        .gte("created_at", new Date(Date.now() - 24 * 3600_000).toISOString());
      if (recent.error) throw recent.error;
      if ((recent.count || 0) >= 36) throw new FleetError("Jest zbyt wiele niedokończonych załączników. Zamknij otwarte formularze lub poproś administratora o usunięcie plików roboczych.", 429);
      const id = randomUUID();
      const ext = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[upload.mime];
      const path = `${upload.vehicleId}/${id}.${ext}`;
      const inserted = await db.from("acc_fleet_files").insert({ id, vehicle_id: upload.vehicleId, storage_path: path,
        name: upload.name.replace(/[\u0000-\u001f\u007f/\\]/g, "_"), kind: upload.kind, mime: upload.mime, bytes: upload.bytes, created_by: me.userId });
      if (inserted.error) throw inserted.error;
      const signed = await db.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: false });
      if (signed.error) { await db.from("acc_fleet_files").delete().eq("id", id); throw signed.error; }
      // File bytes go directly to Storage, not through a Vercel Function's request body.
      return response({ id, path, token: signed.data.token });
    }
    const parsed = z.object({ id: idSchema }).strict().safeParse(body.data.data);
    if (!parsed.success) throw new FleetError("Nieprawidłowy identyfikator pliku.");
    const { data: file, error } = await db.from("acc_fleet_files").select("*").eq("id", parsed.data.id).maybeSingle();
    if (error) throw error;
    if (!file || file.created_by !== me.userId || file.event_id) throw new FleetError("Załącznik nie jest Twoim plikiem roboczym.", 403);
    const vehicle = await getVehicle(db, file.vehicle_id);
    if (!vehicle || !canOperate(me, vehicle)) throw new FleetError("Brak uprawnień do tego pojazdu.", 403);
    if (body.data.action === "discard") {
      // Delete the unlinked row first. A concurrent commit locks/links this row; in that case
      // nothing is deleted and, crucially, we do not remove a now-permanent invoice from Storage.
      const result = await db.from("acc_fleet_files").delete().eq("id", file.id).is("event_id", null).select("id");
      if (result.error) throw result.error;
      if (!result.data?.length) throw new FleetError("Plik został już dołączony do wpisu. Nie usunięto go.", 409);
      const removed = await db.storage.from(BUCKET).remove([file.storage_path]);
      if (removed.error) console.error("fleet: orphaned storage object after discard", file.storage_path, removed.error.message);
      return response({ ok: true });
    }
    if (file.ready) return response({ id: file.id, ready: true });
    const download = await db.storage.from(BUCKET).download(file.storage_path);
    if (download.error || !download.data) throw new FleetError("Plik nie dotarł do magazynu. Ponów wysyłanie.");
    const blob = download.data;
    const actual = sniffMime(new Uint8Array(await blob.slice(0, 16).arrayBuffer()));
    if (blob.size !== file.bytes || blob.size > 12 * 1024 * 1024 || actual !== file.mime) {
      await db.storage.from(BUCKET).remove([file.storage_path]);
      await db.from("acc_fleet_files").delete().eq("id", file.id);
      throw new FleetError("Zawartość lub rozmiar pliku nie odpowiada zadeklarowanemu formatowi. Zapisz go jako prawidłowy JPG/PNG/WEBP/PDF.");
    }
    const saved = await db.from("acc_fleet_files").update({ ready: true }).eq("id", file.id).is("event_id", null);
    if (saved.error) throw saved.error;
    return response({ id: file.id, ready: true });
  } catch (error) { return fail(error); }
}
