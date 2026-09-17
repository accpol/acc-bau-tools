"use client";
import { createClient } from "@supabase/supabase-js";
import type { FileCategory, FleetFile } from "./types";
export class ApiError extends Error { constructor(public code: string, public status: number) { super(code); } }
export async function api<T>(path: string, input?: unknown): Promise<T> {
  const controller = new AbortController(); const timer = window.setTimeout(() => controller.abort(), 65_000);
  try {
    const response = await fetch(`/api/fleet/${path}`, { method: input === undefined ? "GET" : "POST", credentials: "same-origin", cache: "no-store", signal: controller.signal, ...(input === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }) });
    const json = await response.json().catch(() => ({ error: "SERVER_ERROR" }));
    if (!response.ok) throw new ApiError(json.error || "SERVER_ERROR", response.status);
    return json as T;
  } catch (e) { if (e instanceof ApiError) throw e; throw new ApiError("NETWORK_ERROR", 0); }
  finally { window.clearTimeout(timer); }
}
export async function preparePhoto(original: File, category: FileCategory): Promise<File> {
  if (original.size > 20 * 1024 * 1024) throw new ApiError("FILE_TYPE_SIZE", 400);
  if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(original.type)) throw new ApiError("FILE_TYPE_SIZE", 400);
  if (category !== "photo") return original; // Never degrade invoice scans or PDFs.
  if (!original.type.startsWith("image/")) throw new ApiError("FILE_TYPE_SIZE", 400);
  const url = URL.createObjectURL(original);
  try {
    const image = await new Promise<HTMLImageElement>((resolve,reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url; });
    if (Math.max(image.width, image.height) <= 1920 && original.size < 2 * 1024 * 1024) return original;
    const scale = Math.min(1, 1920 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas"); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    const ctx = canvas.getContext("2d"); if (!ctx) throw new ApiError("FILE_ERROR", 400);
    ctx.fillStyle = "white"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(image,0,0,canvas.width,canvas.height);
    const blob = await new Promise<Blob>((resolve,reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("IMAGE")), "image/jpeg", 0.86));
    return new File([blob], original.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } finally { URL.revokeObjectURL(url); }
}
export async function uploadFile(vehicleId: string, id: string, file: File, category: FileCategory): Promise<FleetFile> {
  const info = await api<{ ready?: boolean; file?: FleetFile; path: string; token: string; bucket: string }>("uploads", { id, vehicleId, name: file.name, mime: file.type, size: file.size, category });
  if (info.ready && info.file) return info.file;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new ApiError("SETUP_REQUIRED", 503);
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.storage.from(info.bucket).uploadToSignedUrl(info.path, info.token, file, { contentType: file.type, cacheControl: "3600" });
  // A retry may encounter an already uploaded object. Finalization is idempotent.
  if (error) {
    try { return (await api<{ file: FleetFile }>(`uploads/${id}/complete`, {})).file; }
    catch { throw new ApiError("UPLOAD_ERROR", 503); }
  }
  return (await api<{ file: FleetFile }>(`uploads/${id}/complete`, {})).file;
}
export function downloadText(name: string, text: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
}
