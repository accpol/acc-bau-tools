import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { FleetError } from "./domain";
import type { Event, FleetFile, Member, Vehicle, VehicleData } from "./schema";

export const BUCKET = "acc-fleet-private";
let client: SupabaseClient | null = null;
export function adminDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new FleetError("Moduł Pojazdy nie jest jeszcze skonfigurowany. Uzupełnij zmienne środowiskowe i migrację zgodnie z plikiem START-POJAZDY.md.", 503);
  if (!client) client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  return client;
}
export async function authenticate(request: Request): Promise<{ db: SupabaseClient; me: Member }> {
  const match = request.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9_.-]+)$/);
  if (!match) throw new FleetError("Zaloguj się do modułu Pojazdy.", 401);
  const db = adminDb();
  const { data, error } = await db.auth.getUser(match[1]);
  if (error || !data.user || data.user.is_anonymous) throw new FleetError("Sesja wygasła. Zaloguj się ponownie.", 401);
  const response = await db.from("acc_fleet_members").select("user_id,display_name,role,active").eq("user_id", data.user.id).maybeSingle();
  if (response.error) throw new FleetError("Brakuje tabel modułu Pojazdy lub baza jest niedostępna. Sprawdź migrację i konfigurację.", 503);
  if (!response.data || !response.data.active) throw new FleetError("Konto nie ma aktywnego dostępu do floty. Administrator musi dodać je do acc_fleet_members.", 403);
  return { db, me: memberFromRow(response.data) };
}
export function memberFromRow(row: Record<string, unknown>): Member {
  return { userId: String(row.user_id), displayName: String(row.display_name), role: row.role === "admin" ? "admin" : "worker", active: row.active === true };
}
export function vehicleFromRow(row: Record<string, unknown>): Vehicle {
  return { ...(row.data as VehicleData), id: String(row.id), version: Number(row.version), createdAt: String(row.created_at), updatedAt: String(row.updated_at) };
}
export function fileFromRow(row: Record<string, unknown>): FleetFile {
  return { id: String(row.id), vehicleId: String(row.vehicle_id), name: String(row.name), mime: String(row.mime), bytes: Number(row.bytes),
    kind: row.kind as FleetFile["kind"], createdAt: String(row.created_at), createdBy: String(row.created_by || ""), eventId: row.event_id ? String(row.event_id) : null, ready: row.ready === true };
}
export function response(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
export function fail(error: unknown): NextResponse {
  if (error instanceof FleetError) return response({ error: error.message }, error.status);
  console.error("Fleet API error", error instanceof Error ? error.message : "database request failed");
  return response({ error: "Nie udało się wykonać operacji. Dane formularza zostały zachowane. Sprawdź połączenie i spróbuj ponownie." }, 500);
}
export async function readJson(request: Request): Promise<unknown> {
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > 512_000) throw new FleetError("Dane formularza są zbyt duże. Pliki przesyłaj przez przycisk załączników.", 413);
  try { return JSON.parse(raw); } catch { throw new FleetError("Nieprawidłowe dane żądania."); }
}
export async function getVehicle(db: SupabaseClient, id: string): Promise<Vehicle | null> {
  const { data, error } = await db.from("acc_fleet_vehicles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? vehicleFromRow(data) : null;
}
export async function getEvents(db: SupabaseClient, vehicleId: string): Promise<Event[]> {
  const events: Event[] = [];
  // Never silently truncate a vehicle's history to the PostgREST default of 1000 rows.
  for (let start = 0; ; start += 500) {
    const { data, error } = await db.from("acc_fleet_events").select("data").eq("vehicle_id", vehicleId)
      .order("occurred_on", { ascending: false }).order("created_at", { ascending: false }).order("id", { ascending: false }).range(start, start + 499);
    if (error) throw error;
    events.push(...(data || []).map((r) => r.data as Event));
    if (!data || data.length < 500) break;
    if (start >= 50_000) throw new FleetError("Historia jest bardzo duża. Skontaktuj się z administratorem w sprawie archiwalnego eksportu.", 413);
  }
  return events;
}
export async function getMembers(db: SupabaseClient): Promise<Member[]> {
  const result: Member[] = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await db.from("acc_fleet_members").select("user_id,display_name,role,active").order("display_name").order("user_id").range(start, start + 499);
    if (error) throw error;
    result.push(...(data || []).map(memberFromRow));
    if (!data || data.length < 500) break;
  }
  return result;
}
export function dbError(error: { message: string; code?: string }): never {
  if (error.code === "23505") throw new FleetError("Pojazd o tej rejestracji, numerze VIN lub numerze flotowym już istnieje.", 409);
  if (/FLEET_(CONFLICT|OPERATION_CONFLICT|VOID_CONFLICT)/.test(error.message)) throw new FleetError("Dane zmieniły się w międzyczasie. Odśwież pojazd i spróbuj ponownie.", 409);
  if (/FLEET_FORBIDDEN/.test(error.message)) throw new FleetError("Brak uprawnień do tej operacji.", 403);
  if (/FLEET_FILE_CONFLICT/.test(error.message)) throw new FleetError("Załącznik nie został ukończony albo jest już powiązany z innym wpisem. Sprawdź pliki i ponów zapis.", 409);
  throw error;
}
