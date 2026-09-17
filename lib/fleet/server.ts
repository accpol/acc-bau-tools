// Server only: never import this file from a Client Component.
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual, randomBytes, scrypt as scryptCallback, createHash } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { FleetError, assert, text, uuid } from "./domain";
import type { FleetMember, Vehicle, FleetEvent, FleetFile } from "./types";

export const BUCKET = "acc-fleet-private-v1";
export const COOKIE = "acc_fleet_session_v1";
const TTL = 8 * 3600;
const scrypt = promisify(scryptCallback);
export const configMissing = (): string[] => ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "FLEET_SESSION_SECRET"].filter(k => !process.env[k]);
export function db(): SupabaseClient {
  assert(configMissing().length === 0, "SETUP_REQUIRED", "SETUP_REQUIRED", 503);
  assert((process.env.FLEET_SESSION_SECRET || "").length >= 32, "SECRET_TOO_SHORT", "SECRET_TOO_SHORT", 503);
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function checkDb(error: { code?: string; message?: string } | null): void {
  if (!error) return;
  if (["42P01", "PGRST202", "PGRST205"].includes(error.code || "")) throw new FleetError("MIGRATION_REQUIRED", "MIGRATION_REQUIRED", 503);
  if (error.code === "23505") throw new FleetError("DUPLICATE", "DUPLICATE", 409);
  const message = error.message || "";
  if (message.includes("CONFLICT")) throw new FleetError("CONFLICT", "CONFLICT", 409);
  if (message.includes("LAST_ADMIN")) throw new FleetError("LAST_ADMIN", "LAST_ADMIN", 400);
  if (message.includes("INVALID_FILES")) throw new FleetError("INVALID_FILES", "INVALID_FILES", 400);
  console.error("fleet database error", error.code, message);
  throw new FleetError("DATABASE_ERROR", "DATABASE_ERROR", 503);
}
export async function rows<T>(client: SupabaseClient, table: string, columns: string, vehicleId?: string, batch = 500): Promise<T[]> {
  const all: T[] = [];
  for (let offset = 0; ; offset += batch) {
    let q = client.from(table).select(columns).order("id").range(offset, offset + batch - 1);
    if (vehicleId) q = q.eq("vehicle_id", vehicleId);
    const { data, error } = await q; checkDb(error);
    const page = (data || []) as unknown as T[]; all.push(...page);
    if (page.length < batch) break;
    assert(all.length <= 100_000, "DATASET_TOO_LARGE", "DATASET_TOO_LARGE", 413);
  }
  return all;
}
export async function getVehicle(client: SupabaseClient, id: string): Promise<Vehicle | null> {
  const { data, error } = await client.from("acc_fleet_vehicles").select("*").eq("id", uuid(id)).maybeSingle(); checkDb(error); return data as Vehicle | null;
}
export const EVENT_COLUMNS = "id,vehicle_id,kind,happened_on,data,created_by,created_at";
export const FILE_COLUMNS = "id,vehicle_id,event_id,name,mime,size,category,state,created_by,created_at";
export async function getDetail(client: SupabaseClient, id: string, member: FleetMember) {
  const vehicle = await getVehicle(client, id); assert(vehicle, "NOT_FOUND", "NOT_FOUND", 404);
  canView(member, vehicle);
  const [events, files] = await Promise.all([
    rows<FleetEvent>(client, "acc_fleet_events", EVENT_COLUMNS, id),
    rows<FleetFile>(client, "acc_fleet_files", FILE_COLUMNS, id),
  ]);
  // Driver sees operational history/photos, not commercial terms or invoice metadata.
  const safeEvents = member.role === "admin" ? events : events.filter(e => !["document", "documents_added", "updated", "created"].includes(e.kind)).map(e => {
    const d = { ...e.data }; delete d.cost; delete d.costBasis; delete d.currency; delete d.invoiceNumber; delete d.before; delete d.after;
    d.fileIds = (d.fileIds || []).filter(id => files.some(f => f.id === id && f.category === "photo"));
    return { ...e, data: d };
  });
  return { vehicle: publicVehicle(vehicle, member), events: safeEvents.sort((a,b) => b.happened_on.localeCompare(a.happened_on) || b.created_at.localeCompare(a.created_at)), files: files.filter(f => f.state === "ready" && (member.role === "admin" || f.category === "photo")) };
}
export function publicVehicle(v: Vehicle, m: FleetMember): Vehicle {
  if (m.role === "admin") return v;
  return { ...v, data: { ...v.data, purchasePrice: "", purchaseCurrency: "", purchaseDate: "", policyNumber: "", leasingUntil: "" } };
}
export function canView(m: FleetMember, v: Vehicle): void {
  assert(m.role === "admin" || (!v.data.archived && v.data.driver === m.name), "FORBIDDEN", "FORBIDDEN", 403);
}
export function adminOnly(m: FleetMember): void { assert(m.role === "admin", "FORBIDDEN", "FORBIDDEN", 403); }
export function checkOrigin(req: NextRequest): void {
  const origin = req.headers.get("origin");
  assert(origin, "BAD_ORIGIN", "BAD_ORIGIN", 403);
  let source: URL; try { source = new URL(origin); } catch { throw new FleetError("BAD_ORIGIN", "BAD_ORIGIN", 403); }
  assert(source.host === req.headers.get("host") && ["http:", "https:"].includes(source.protocol), "BAD_ORIGIN", "BAD_ORIGIN", 403);
  assert(req.headers.get("content-type")?.startsWith("application/json"), "JSON_REQUIRED", "JSON_REQUIRED", 415);
}
export async function body(req: NextRequest): Promise<Record<string, unknown>> {
  checkOrigin(req);
  const limit = 150_000; assert(Number(req.headers.get("content-length") || "0") <= limit, "PAYLOAD_TOO_LARGE", "PAYLOAD_TOO_LARGE", 413);
  const reader = req.body?.getReader(); assert(reader, "INVALID_PAYLOAD");
  let bytes = 0; const chunks: Uint8Array[] = [];
  while (true) { const r = await reader.read(); if (r.done) break; bytes += r.value.byteLength; if (bytes > limit) { await reader.cancel(); throw new FleetError("PAYLOAD_TOO_LARGE", "PAYLOAD_TOO_LARGE", 413); } chunks.push(r.value); }
  let value: unknown; try { value = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new FleetError("INVALID_PAYLOAD", "INVALID_PAYLOAD"); }
  assert(value && typeof value === "object" && !Array.isArray(value), "INVALID_PAYLOAD");
  return value as Record<string, unknown>;
}
export async function hashPin(pin: string): Promise<string> {
  assert(pin.length >= 8 && pin.length <= 128, "PIN_LENGTH");
  const salt = randomBytes(16); const key = await scrypt(pin, salt, 32) as Buffer;
  return `scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`;
}
export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  try {
    const [method, s, h] = stored.split("$"); if (method !== "scrypt" || !s || !h) return false;
    const salt = Buffer.from(s, "base64url"), hash = Buffer.from(h, "base64url"); if (salt.length !== 16 || hash.length !== 32) return false;
    const key = await scrypt(pin, salt, 32) as Buffer; return timingSafeEqual(hash, key);
  } catch { return false; }
}
function signature(s: string): string { return createHmac("sha256", process.env.FLEET_SESSION_SECRET!).update(s).digest("base64url"); }
function secureEqual(a: string, b: string): boolean { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }
export function safeMember(value: FleetMember): FleetMember {
  return { id: value.id, name: value.name, role: value.role, active: value.active, auth_version: value.auth_version };
}
export async function setSession(m: FleetMember): Promise<void> {
  const p = Buffer.from(JSON.stringify({ id: m.id, v: m.auth_version, exp: Math.floor(Date.now()/1000) + TTL, n: randomBytes(16).toString("hex") })).toString("base64url");
  (await cookies()).set(COOKIE, `${p}.${signature(p)}`, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: TTL, path: "/api/fleet" });
}
export async function clearSession(): Promise<void> {
  (await cookies()).set(COOKIE, "", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 0, path: "/api/fleet" });
}
export async function session(client: SupabaseClient): Promise<FleetMember> {
  const raw = (await cookies()).get(COOKIE)?.value; assert(raw && raw.length < 2000, "LOGIN_REQUIRED", "LOGIN_REQUIRED", 401);
  const parts = raw.split("."); const [p, sig] = parts; assert(parts.length === 2 && p && sig && secureEqual(sig, signature(p)), "LOGIN_REQUIRED", "LOGIN_REQUIRED", 401);
  let payload: { id: string; v: number; exp: number };
  try { payload = JSON.parse(Buffer.from(p, "base64url").toString("utf8")); } catch { throw new FleetError("LOGIN_REQUIRED", "LOGIN_REQUIRED", 401); }
  assert(payload.exp > Date.now()/1000 && payload.exp <= Date.now()/1000 + TTL + 60, "LOGIN_REQUIRED", "LOGIN_REQUIRED", 401);
  const { data, error } = await client.from("acc_fleet_members").select("id,name,role,active,auth_version").eq("id", uuid(payload.id)).maybeSingle(); checkDb(error);
  assert(data && data.active && data.auth_version === payload.v, "LOGIN_REQUIRED", "LOGIN_REQUIRED", 401);
  return safeMember(data as FleetMember);
}
export async function login(req: NextRequest, client: SupabaseClient, input: Record<string, unknown>): Promise<FleetMember> {
  const name = text(input.name, 160, true), pin = text(input.pin, 128, true);
  const nameKey = name.toLowerCase();
  // Counters live in PostgreSQL, not in one Vercel function instance.
  const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown").split(",")[0].trim();
  for (const [value, limit] of [[`ip:${ip}`, 40], [`name:${nameKey}`, 10]] as const) {
    const key = createHmac("sha256", process.env.FLEET_SESSION_SECRET!).update(value).digest("hex");
    const { data, error } = await client.rpc("acc_fleet_take_login_attempt", { p_key: key, p_limit: limit }); checkDb(error); assert(data === true, "RATE_LIMIT", "RATE_LIMIT", 429);
  }
  const { data, error } = await client.from("acc_fleet_members").select("*").eq("name_key", nameKey).maybeSingle(); checkDb(error);
  let member = data;
  if (!member) {
    const bootstrapName = process.env.FLEET_BOOTSTRAP_USER?.trim() || "";
    const bootstrapPin = process.env.FLEET_BOOTSTRAP_PIN || "";
    const matches = bootstrapName.toLowerCase() === nameKey && bootstrapPin.length >= 8 && secureEqual(pin, bootstrapPin);
    if (matches) {
      const { data: count, error: countError } = await client.from("acc_fleet_members").select("id").limit(1); checkDb(countError);
      if (!count?.length) {
        const { data: created, error: createError } = await client.rpc("acc_fleet_bootstrap_member", { p_name: bootstrapName, p_hash: await hashPin(pin) }); checkDb(createError);
        member = created;
      }
    }
  }
  // Same expensive verification for unknown accounts avoids an obvious timing oracle.
  const dummy = "scrypt$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const ok = await verifyPin(pin, member?.pin_hash || dummy);
  assert(member && member.active && ok, "WRONG_LOGIN", "WRONG_LOGIN", 401);
  await setSession(member as FleetMember); return safeMember(member as FleetMember);
}
export function commandHash(value: unknown): string {
  const sort = (v: unknown): unknown => Array.isArray(v) ? v.map(sort) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).sort(([a],[b]) => a.localeCompare(b)).map(([k,x]) => [k,sort(x)])) : v;
  return createHash("sha256").update(JSON.stringify(sort(value))).digest("hex");
}
