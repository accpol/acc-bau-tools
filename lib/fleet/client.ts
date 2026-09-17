"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Command, FleetFile, UploadRequest } from "./schema";
let client: SupabaseClient | null = null;
export function fleetClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Brakuje konfiguracji Supabase. Zobacz START-POJAZDY.md.");
  if (!client) client = createClient(url, key, { auth: { storageKey: "acc-fleet-auth-v1", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return client;
}
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); this.name = "ApiError"; }
}
export async function api<T>(path = "", init: RequestInit = {}): Promise<T> {
  const { data: { session } } = await fleetClient().auth.getSession();
  if (!session) throw new ApiError("Zaloguj się do modułu Pojazdy.", 401);
  let result: Response;
  try {
    result = await fetch(`/api/fleet${path}`, { ...init, cache: "no-store", headers: {
      ...init.headers, "Authorization": `Bearer ${session.access_token}`, ...(init.body ? { "Content-Type": "application/json" } : {}),
    } });
  } catch { throw new ApiError("Brak połączenia. Zmiany nie zostały potwierdzone. Zachowaj formularz i spróbuj ponownie.", 0); }
  const data = await result.json().catch(() => ({ error: "Serwer nie zwrócił poprawnej odpowiedzi." }));
  if (!result.ok) throw new ApiError(data.error || `Błąd serwera (${result.status}).`, result.status);
  return data as T;
}
export async function send(command: Command): Promise<void> {
  await api("", { method: "POST", body: JSON.stringify(command) });
}
export type PendingFile = {
  key: string; file: File; kind: FleetFile["kind"];
  prepared?: { id: string; path: string; token: string };
  ready?: boolean;
};
export async function uploadFiles(vehicleId: string, files: PendingFile[], onUpdate: (key: string, patch: Partial<PendingFile>) => void, onProgress: (message: string) => void): Promise<string[]> {
  const ids: string[] = [];
  for (const [index, item] of files.entries()) {
    onProgress(`Plik ${index + 1}/${files.length}: ${item.file.name}`);
    if (item.ready && item.prepared) { ids.push(item.prepared.id); continue; }
    const data: UploadRequest = { vehicleId, name: item.file.name, mime: item.file.type as UploadRequest["mime"], bytes: item.file.size, kind: item.kind };
    const prepared = item.prepared || await api<{ id: string; path: string; token: string }>("/files", { method: "POST", body: JSON.stringify({ action: "prepare", data }) });
    // Also retain in the in-flight array, so a failure never discards the upload identifier.
    item.prepared = prepared; onUpdate(item.key, { prepared });
    const uploaded = await fleetClient().storage.from("acc-fleet-private").uploadToSignedUrl(prepared.path, prepared.token, item.file, { contentType: item.file.type });
    // If the upload was already accepted before a lost network reply, completion is authoritative.
    try {
      await api("/files", { method: "POST", body: JSON.stringify({ action: "complete", data: { id: prepared.id } }) });
    } catch (error) {
      if (uploaded.error) throw new Error(`Nie udało się wysłać ${item.file.name}: ${uploaded.error.message}`);
      throw error;
    }
    item.ready = true; onUpdate(item.key, { ready: true }); ids.push(prepared.id);
  }
  onProgress("");
  return ids;
}
export async function discardFiles(files: PendingFile[]): Promise<void> {
  await Promise.allSettled(files.filter((f) => f.prepared).map((f) => api("/files", { method: "POST", body: JSON.stringify({ action: "discard", data: { id: f.prepared!.id } }) })));
}
