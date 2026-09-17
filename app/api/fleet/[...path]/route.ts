import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { assert, FleetError, integerOrNull, prepareCommand, text, uuid } from "@/lib/fleet/domain";
import { adminOnly, body, BUCKET, canView, checkDb, clearSession, commandHash, db, EVENT_COLUMNS, FILE_COLUMNS, getDetail, getVehicle, hashPin, login, publicVehicle, rows, safeMember, session } from "@/lib/fleet/server";
import type { FleetCommand, FleetEvent, FleetFile, FleetMember, Vehicle } from "@/lib/fleet/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
type Context = { params: Promise<{ path: string[] }> };
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" } });
function failure(e: unknown) {
  if (e instanceof FleetError) return json({ error: e.code }, e.status);
  console.error("fleet request failed", e instanceof Error ? e.message : "unknown");
  return json({ error: "SERVER_ERROR" }, 500);
}
export async function GET(req: NextRequest, context: Context) {
  try {
    const path = (await context.params).path; const client = db(); const member = await session(client);
    if (path[0] === "session" && path.length === 1) return json({ member });
    if (path[0] === "vehicles" && path.length === 1) {
      const vehicles = await rows<Vehicle>(client, "acc_fleet_vehicles", "*");
      return json({ vehicles: vehicles.filter(v => member.role === "admin" || (!v.data.archived && v.data.driver === member.name)).map(v => publicVehicle(v, member)) });
    }
    if (path[0] === "vehicles" && path.length === 2) return json(await getDetail(client, uuid(path[1]), member));
    if (path[0] === "members" && path.length === 1) {
      adminOnly(member);
      return json({ members: await rows<FleetMember>(client, "acc_fleet_members", "id,name,role,active,auth_version") });
    }
    if (path[0] === "files" && path.length === 3 && path[2] === "view") {
      const { data: file, error } = await client.from("acc_fleet_files").select("*").eq("id", uuid(path[1])).maybeSingle(); checkDb(error);
      assert(file && file.state === "ready", "NOT_FOUND", "NOT_FOUND", 404);
      const vehicle = await getVehicle(client, file.vehicle_id); assert(vehicle, "NOT_FOUND", "NOT_FOUND", 404); canView(member, vehicle);
      assert(member.role === "admin" || file.category === "photo", "FORBIDDEN", "FORBIDDEN", 403);
      const { data, error: signedError } = await client.storage.from(BUCKET).createSignedUrl(file.path, 300, req.nextUrl.searchParams.get("download") === "1" ? { download: file.name } : undefined);
      checkDb(signedError); assert(data?.signedUrl, "FILE_ERROR", "FILE_ERROR", 503);
      return json({ url: data.signedUrl, expiresIn: 300 });
    }
    return json({ error: "NOT_FOUND" }, 404);
  } catch (e) { return failure(e); }
}
export async function POST(req: NextRequest, context: Context) {
  try {
    const path = (await context.params).path; const input = await body(req);
    if (path[0] === "logout" && path.length === 1) { await clearSession(); return json({ ok: true }); }
    const client = db();
    if (path[0] === "login" && path.length === 1) return json({ member: await login(req, client, input) });
    const member = await session(client);
    if (path[0] === "commands" && path.length === 1) {
      assert(typeof input.type === "string" && input.payload && typeof input.payload === "object" && !Array.isArray(input.payload), "INVALID_PAYLOAD");
      const cmd: FleetCommand = { commandId: uuid(input.commandId), vehicleId: uuid(input.vehicleId), expectedVersion: Number(input.expectedVersion), type: input.type, payload: input.payload as Record<string, unknown>, fileIds: [] };
      assert(input.fileIds == null || Array.isArray(input.fileIds), "INVALID_FILES");
      cmd.fileIds = ((input.fileIds || []) as unknown[]).map(uuid);
      assert(cmd.fileIds.length <= 20 && new Set(cmd.fileIds).size === cmd.fileIds.length, "INVALID_FILES");
      const fingerprint = commandHash(cmd);
      const { data: prior, error: priorError } = await client.from("acc_fleet_events").select("vehicle_id,command_hash,created_by").eq("id", cmd.commandId).maybeSingle(); checkDb(priorError);
      if (prior) {
        assert(prior.vehicle_id === cmd.vehicleId && prior.command_hash === fingerprint && prior.created_by === member.name, "IDEMPOTENCY_MISMATCH", "IDEMPOTENCY_MISMATCH", 409);
        return json(await getDetail(client, cmd.vehicleId, member));
      }
      const current = await getVehicle(client, cmd.vehicleId);
      if (current) canView(member, current); else adminOnly(member);
      const events = current ? await rows<FleetEvent>(client, "acc_fleet_events", EVENT_COLUMNS, cmd.vehicleId) : [];
      if (cmd.fileIds.length) {
        const { data: files, error } = await client.from("acc_fleet_files").select("id,vehicle_id,state,event_id,category,created_by").in("id", cmd.fileIds); checkDb(error);
        assert(files?.length === cmd.fileIds.length && files.every(f => f.vehicle_id === cmd.vehicleId && f.state === "ready" && !f.event_id && (member.role === "admin" || (f.category === "photo" && f.created_by === member.name))), "INVALID_FILES");
      }
      const prepared = prepareCommand(cmd, current, events, member);
      if (cmd.type === "cover") {
        const { data: cover, error } = await client.from("acc_fleet_files").select("vehicle_id,category,state").eq("id", prepared.data.coverFileId).maybeSingle(); checkDb(error);
        assert(cover && cover.vehicle_id === cmd.vehicleId && cover.category === "photo" && cover.state === "ready", "INVALID_FILES");
      }
      if (!prepared.data.coverFileId && cmd.fileIds.length) {
        const { data: photos, error } = await client.from("acc_fleet_files").select("id").in("id", cmd.fileIds).eq("category", "photo").limit(1); checkDb(error);
        if (photos?.[0]) prepared.data.coverFileId = photos[0].id;
      }
      const { error } = await client.rpc("acc_fleet_apply_command", {
        p_vehicle_id: cmd.vehicleId, p_expected_version: cmd.expectedVersion, p_command_id: cmd.commandId,
        p_kind: prepared.event.kind, p_happened_on: prepared.event.happened_on, p_event_data: prepared.event.data,
        p_vehicle_data: prepared.data, p_actor: member.name, p_command_hash: fingerprint, p_file_ids: cmd.fileIds,
      }); checkDb(error);
      return json(await getDetail(client, cmd.vehicleId, member));
    }
    if (path[0] === "members" && path.length === 1) {
      adminOnly(member);
      const id = input.id ? uuid(input.id) : null; const name = text(input.name, 160, true); const pin = text(input.pin, 128);
      assert(input.role === "admin" || input.role === "worker", "INVALID_ROLE"); assert(typeof input.active === "boolean", "INVALID_PAYLOAD");
      assert(id !== member.id || (input.active && input.role === "admin"), "SELF_DEACTIVATION");
      const { data, error } = await client.rpc("acc_fleet_save_member", { p_id: id, p_name: name, p_hash: pin ? await hashPin(pin) : null, p_role: input.role, p_active: input.active, p_actor: member.name }); checkDb(error);
      return json({ member: safeMember(data as FleetMember), reLogin: id === member.id });
    }
    if (path[0] === "uploads" && path.length === 1) {
      const vehicleId = uuid(input.vehicleId), id = uuid(input.id);
      const vehicle = await getVehicle(client, vehicleId); assert(vehicle && !vehicle.data.archived, "NOT_FOUND", "NOT_FOUND", 404); canView(member, vehicle);
      const name = text(input.name, 200, true), mime = text(input.mime, 100, true), category = text(input.category, 20, true), size = integerOrNull(input.size, 20 * 1024 * 1024);
      assert(size && ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(mime), "FILE_TYPE_SIZE");
      assert(["photo", "invoice", "document"].includes(category), "INVALID_FILES");
      assert(category !== "photo" || mime.startsWith("image/"), "FILE_TYPE_SIZE");
      assert(member.role === "admin" || category === "photo", "FORBIDDEN", "FORBIDDEN", 403);
      const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };
      const storagePath = `${vehicleId}/${id}.${extensions[mime]}`;
      const { data: existing, error: lookupError } = await client.from("acc_fleet_files").select("*").eq("id", id).maybeSingle(); checkDb(lookupError);
      if (existing) {
        assert(existing.vehicle_id === vehicleId && existing.name === name && existing.mime === mime && existing.size === size && existing.category === category && existing.created_by === member.name, "IDEMPOTENCY_MISMATCH", "IDEMPOTENCY_MISMATCH", 409);
        if (existing.state === "ready") return json({ ready: true, file: existing as FleetFile });
      } else {
        const { error } = await client.from("acc_fleet_files").insert({ id, vehicle_id: vehicleId, path: storagePath, name, mime, size, category, created_by: member.name }); checkDb(error);
      }
      const { data, error } = await client.storage.from(BUCKET).createSignedUploadUrl(storagePath, { upsert: false }); checkDb(error);
      assert(data, "FILE_ERROR", "FILE_ERROR", 503);
      return json({ id, path: data.path, token: data.token, bucket: BUCKET });
    }
    if (path[0] === "uploads" && path.length === 3 && path[2] === "complete") {
      const id = uuid(path[1]);
      const { data: file, error } = await client.from("acc_fleet_files").select("*").eq("id", id).maybeSingle(); checkDb(error);
      assert(file, "NOT_FOUND", "NOT_FOUND", 404);
      const vehicle = await getVehicle(client, file.vehicle_id); assert(vehicle, "NOT_FOUND", "NOT_FOUND", 404); canView(member, vehicle);
      assert(member.role === "admin" || (file.category === "photo" && file.created_by === member.name), "FORBIDDEN", "FORBIDDEN", 403);
      if (file.state !== "ready") {
        const { data: blob, error: downloadError } = await client.storage.from(BUCKET).download(file.path); checkDb(downloadError);
        assert(blob && blob.size === file.size, "FILE_TYPE_SIZE");
        const bytes = Buffer.from(await blob.arrayBuffer());
        const magic = file.mime === "application/pdf" ? bytes.subarray(0, 5).toString() === "%PDF-" :
          file.mime === "image/jpeg" ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff :
          file.mime === "image/png" ? bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" :
          bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
        assert(magic, "FILE_TYPE_SIZE");
        const hash = createHash("sha256").update(bytes).digest("hex");
        const { error: saveError } = await client.from("acc_fleet_files").update({ state: "ready", sha256: hash }).eq("id", id).eq("state", "pending"); checkDb(saveError);
      }
      const { data: ready, error: readError } = await client.from("acc_fleet_files").select(FILE_COLUMNS).eq("id", id).single(); checkDb(readError);
      return json({ file: ready });
    }
    return json({ error: "NOT_FOUND" }, 404);
  } catch (e) { return failure(e); }
}
