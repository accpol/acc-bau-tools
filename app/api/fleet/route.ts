import { createHash } from "node:crypto";
import { z } from "zod";
import { buildMutation, FleetError, publicEvent, publicVehicle } from "@/lib/fleet/domain";
import { commandSchema, type Event, type Vehicle } from "@/lib/fleet/schema";
import { authenticate, dbError, fail, fileFromRow, getEvents, getMembers, getVehicle, readJson, response, vehicleFromRow } from "@/lib/fleet/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const { db, me } = await authenticate(request);
    const id = new URL(request.url).searchParams.get("vehicleId");
    if (id) {
      if (!z.string().uuid().safeParse(id).success) throw new FleetError("Nieprawidłowy identyfikator pojazdu.");
      const [vehicle, events] = await Promise.all([getVehicle(db, id), getEvents(db, id)]);
      if (!vehicle) throw new FleetError("Nie znaleziono pojazdu.", 404);
      const files = [];
      for (let start = 0; ; start += 500) {
        let query = db.from("acc_fleet_files").select("id,vehicle_id,name,mime,bytes,kind,created_at,created_by,event_id,ready")
          .eq("vehicle_id", id).eq("ready", true).not("event_id", "is", null).order("created_at", { ascending: false }).order("id").range(start, start + 499);
        if (me.role !== "admin") query = query.in("kind", ["photo", "damage"]);
        const { data, error } = await query;
        if (error) throw error;
        files.push(...(data || []).map(fileFromRow));
        if (!data || data.length < 500) break;
      }
      const ids = new Set(files.map((file) => file.id));
      return response({ vehicle: publicVehicle(vehicle, me), events: events.map((event) => publicEvent(event, me, ids)), files });
    }
    const members = await getMembers(db);
    const vehicles: Vehicle[] = [];
    for (let start = 0; ; start += 500) {
      const { data, error } = await db.from("acc_fleet_vehicles").select("*").order("updated_at", { ascending: false }).order("id").range(start, start + 499);
      if (error) throw error;
      vehicles.push(...(data || []).map((row) => publicVehicle(vehicleFromRow(row), me)));
      if (!data || data.length < 500) break;
    }
    return response({ me, members: members.filter((m) => m.active || me.role === "admin"), vehicles });
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    const { db, me } = await authenticate(request);
    const raw = await readJson(request);
    const parsed = commandSchema.safeParse(raw);
    if (!parsed.success) throw new FleetError(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n"));
    const command = parsed.data;
    const { data: existing, error: existingError } = await db.from("acc_fleet_events").select("data").eq("id", command.operationId).maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      const event = existing.data as Event;
      const hash = createHash("sha256").update(JSON.stringify(command)).digest("hex");
      if (event.actorId !== me.userId || event.vehicleId !== command.vehicleId || event.requestHash !== hash) throw new FleetError("Ten identyfikator zapisu został już użyty. Odśwież dane.", 409);
      const vehicle = await getVehicle(db, command.vehicleId);
      return response({ vehicle: vehicle ? publicVehicle(vehicle, me) : null, saved: true });
    }
    const [current, events, members] = await Promise.all([
      getVehicle(db, command.vehicleId), getEvents(db, command.vehicleId), getMembers(db),
    ]);
    const built = buildMutation(command, me, current, events, members);
    const { data, error } = await db.rpc("acc_fleet_commit", {
      p_vehicle_id: command.vehicleId, p_expected_version: command.expectedVersion,
      p_data: built.data, p_event: built.event, p_actor_id: me.userId,
      p_operation_id: command.operationId, p_void_id: built.voidId,
    });
    if (error) dbError(error);
    return response({ vehicle: publicVehicle(vehicleFromRow(data), me), saved: true });
  } catch (error) { return fail(error); }
}
