"use client";
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, Download, FileText, ImageIcon, LoaderCircle, Upload, X } from "lucide-react";
import { api, ApiError, preparePhoto, uploadFile } from "@/lib/fleet/client";
import { errorText, fleetLocale, tr } from "@/lib/fleet/i18n";
import type { FileCategory, FleetFile } from "@/lib/fleet/types";

export const control = "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-zinc-100";
export function Btn({ tone = "light", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "light" | "primary" | "danger" }) {
  return <button type="button" {...props} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${tone === "primary" ? "border-orange-600 bg-orange-600 text-white hover:bg-orange-700" : tone === "danger" ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"} ${className}`} />;
}
export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <section className={`rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 ${className}`}>{children}</section>; }
export function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId(); return <label className="block min-w-0" htmlFor={id}><span className="mb-1.5 block text-xs font-bold text-zinc-600">{label}{props.required ? " *" : ""}</span><input id={id} {...props} className={control} /></label>;
}
export function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const id = useId(); return <label className="block" htmlFor={id}><span className="mb-1.5 block text-xs font-bold text-zinc-600">{label}{props.required ? " *" : ""}</span><textarea id={id} rows={3} {...props} className={control} /></label>;
}
export function Pick({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string }[] }) {
  const id = useId(); return <label className="block min-w-0" htmlFor={id}><span className="mb-1.5 block text-xs font-bold text-zinc-600">{label}</span><select id={id} {...props} className={control}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
}
export function Check({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label className="flex cursor-pointer items-start gap-2 text-sm"><input type="checkbox" {...props} className="mt-1 h-4 w-4 accent-orange-600" /><span>{label}</span></label>; }
export function Info({ label, value }: { label: string; value: React.ReactNode }) { return <div className="min-w-0 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"><dt className="text-xs text-zinc-500">{label}</dt><dd className="mt-1 break-words whitespace-pre-wrap text-sm font-semibold">{value === "" || value == null ? "—" : value}</dd></div>; }
export function ErrorBanner({ lang, error }: { lang: string; error: string }) { return error ? <div role="alert" className="my-3 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{errorText(lang, error)}</div> : null; }
export function errorCode(e: unknown): string { return e instanceof ApiError ? e.code : "SERVER_ERROR"; }
export function DateText({ date, lang }: { date: string | null | undefined; lang: string }) {
  if (!date) return <>—</>;
  const d = new Date(date.length === 10 ? date + "T12:00:00Z" : date); return <>{Number.isNaN(d.getTime()) ? date : new Intl.DateTimeFormat(fleetLocale(lang),date.length>10?{dateStyle:"short",timeStyle:"short"}:undefined).format(d)}</>;
}
export function num(value: number | null | undefined, lang: string): string { return value == null ? "—" : value.toLocaleString(fleetLocale(lang)); }
export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "red" | "amber" }) {
  const styles = { neutral: "bg-zinc-100 text-zinc-700", green: "bg-emerald-50 text-emerald-800", red: "bg-red-50 text-red-800", amber: "bg-amber-50 text-amber-800" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${styles[tone]}`}>{children}</span>;
}
export function Dialog({ title, children, onClose, busy = false, wide = false }: { title: string; children: React.ReactNode; onClose: () => void; busy?: boolean; wide?: boolean }) {
  const root = useRef<HTMLDivElement>(null); const heading = useId(); const onCloseRef = useRef(onClose); onCloseRef.current = onClose;
  useEffect(() => {
    const old = document.body.style.overflow; const prior = document.activeElement as HTMLElement | null; document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => root.current?.querySelector<HTMLElement>("input,select,textarea,button")?.focus(), 20);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) { e.preventDefault(); e.stopPropagation(); onCloseRef.current(); }
      if (e.key === "Tab") {
        const nodes = Array.from(root.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"]') || []).filter(el => el.getClientRects().length);
        const first = nodes[0], last = nodes.at(-1); if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", key);
    return () => { window.clearTimeout(timer); document.removeEventListener("keydown", key); document.body.style.overflow = old; prior?.focus(); };
  }, [busy]);
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-5"><div ref={root} role="dialog" aria-modal="true" aria-labelledby={heading} className={`max-h-[94dvh] w-full overflow-auto rounded-3xl bg-white text-zinc-950 shadow-2xl ${wide ? "max-w-5xl" : "max-w-3xl"}`}><div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white p-4 sm:px-6"><h2 id={heading} className="text-lg font-black">{title}</h2><Btn aria-label="Close / Zamknij / Schließen" onClick={onClose} disabled={busy}><X className="h-4 w-4" /></Btn></div>{children}</div></div>;
}
export function FormFooter({ lang, busy, onClose }: { lang: string; busy: boolean; onClose: () => void }) { return <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white p-4 sm:px-6"><Btn onClick={onClose} disabled={busy}>{tr(lang,"cancel")}</Btn><Btn type="submit" tone="primary" disabled={busy}>{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}{tr(lang,busy ? "saving" : "save")}</Btn></div>; }

export function PrivateImage({ id, alt, className = "", fit = "cover" }: { id?: string; alt: string; className?: string; fit?: "cover" | "contain" }) {
  const [url,setUrl] = useState(""); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!id) return; let alive = true; let timer: ReturnType<typeof setInterval> | undefined;
    const load = () => api<{ url: string }>(`files/${id}/view`).then(r => { if (alive) setUrl(r.url); }).catch(() => {});
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { void load(); timer = setInterval(load, 270000); observer.disconnect(); } });
    if (ref.current) observer.observe(ref.current);
    return () => { alive = false; observer.disconnect(); if (timer) clearInterval(timer); };
  }, [id]);
  return <div ref={ref} className={`flex items-center justify-center overflow-hidden bg-zinc-100 ${className}`}>{url ? <img loading="lazy" decoding="async" src={url} alt={alt} className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`} /> : <ImageIcon className="h-8 w-8 text-zinc-300" />}</div>;
}
export function FileViewer({ file, lang, onClose }: { file: FleetFile; lang: string; onClose: () => void }) {
  const [url,setUrl] = useState(""); const [error,setError] = useState("");
  useEffect(() => { let alive = true; const load = () => api<{url:string}>(`files/${file.id}/view`).then(r => { if (alive) setUrl(r.url); }).catch(e => { if(alive) setError(errorCode(e)); }); void load(); const timer=setInterval(load,270000); return () => {alive=false;clearInterval(timer);}; }, [file.id]);
  async function download() {
    const tab = window.open("about:blank", "_blank"); if (tab) tab.opener = null;
    try { const r = await api<{url:string}>(`files/${file.id}/view?download=1`); if (tab) tab.location.href=r.url; else { const a=document.createElement("a"); a.href=r.url; a.download=file.name; a.click(); } }
    catch(e) {tab?.close(); setError(errorCode(e));}
  }
  return <Dialog title={file.name} onClose={onClose} wide><div className="p-4"><ErrorBanner lang={lang} error={error} />{!url ? <p>{tr(lang,"loading")}</p> : file.mime === "application/pdf" ? <iframe title={file.name} src={url} className="h-[70dvh] w-full rounded-xl border" sandbox="allow-scripts allow-same-origin" /> : <img src={url} alt={file.name} className="mx-auto max-h-[70dvh] max-w-full rounded-xl object-contain" />}<div className="mt-4 flex justify-end"><Btn onClick={download}><Download className="h-4 w-4" />{tr(lang,"download")}</Btn></div></div></Dialog>;
}
export function FileTiles({ files, lang, onView }: { files: FleetFile[]; lang: string; onView: (f:FleetFile) => void }) {
  return <div className="flex flex-wrap gap-2">{files.map(f => <button key={f.id} onClick={() => onView(f)} className="flex max-w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left text-xs hover:border-orange-400">{f.mime.startsWith("image/") ? <ImageIcon className="h-4 w-4 shrink-0 text-orange-600" /> : <FileText className="h-4 w-4 shrink-0 text-orange-600" />}<span className="max-w-52 truncate">{f.name}</span><span className="text-zinc-400">{tr(lang,f.category)}</span></button>)}</div>;
}
interface Staged { id: string; file: File; prepared?: File; category: FileCategory; state: "busy" | "ready" | "error"; error?: string }
export function Uploader({ vehicleId, lang, admin, fileIds, onIds, existing, onBusy, defaultCategory = "photo", lockedCategory, onIncomplete }: { vehicleId:string;lang:string;admin:boolean;fileIds:string[];onIds:(ids:string[])=>void;existing:FleetFile[];onBusy:(b:boolean)=>void;defaultCategory?:FileCategory;lockedCategory?:FileCategory;onIncomplete?:(b:boolean)=>void }) {
  const [category,setCategory] = useState<FileCategory>(admin ? (lockedCategory || defaultCategory) : "photo"); const [items,setItems] = useState<Staged[]>([]);
  const [error,setError] = useState(""); const [busy,setBusy] = useState(false); const idsRef=useRef(fileIds); idsRef.current=fileIds;
  const regular=useRef<HTMLInputElement>(null), camera=useRef<HTMLInputElement>(null);
  useEffect(() => { onIncomplete?.(items.some(item => item.state !== "ready")); }, [items, onIncomplete]);
  const process = async (entry:Staged) => {
    setItems(prev => prev.map(e => e.id===entry.id ? {...e,state:"busy",error:""} : e));
    try {
      const prepared=entry.prepared || await preparePhoto(entry.file,entry.category);
      setItems(prev => prev.map(e => e.id===entry.id ? {...e,prepared} : e));
      const result=await uploadFile(vehicleId,entry.id,prepared,entry.category);
      setItems(prev => prev.map(e => e.id===entry.id ? {...e,state:"ready"} : e));
      const next=Array.from(new Set([...idsRef.current,result.id])); idsRef.current=next; onIds(next);
    } catch(e) {setItems(prev=>prev.map(i=>i.id===entry.id ? {...i,state:"error",error:errorCode(e)}:i));}
  };
  const add=async (files:FileList|null) => {
    if(!files?.length || busy) return;
    if(items.length+files.length>20 || idsRef.current.length+files.length>20) {setError("INVALID_FILES");return;}
    const fresh=Array.from(files).map(file=>({id:crypto.randomUUID(),file,category,state:"busy" as const})); setItems(prev=>[...prev,...fresh]);
    setBusy(true);onBusy(true);setError("");
    try { for(const entry of fresh) await process(entry); } finally {setBusy(false);onBusy(false);}
  };
  const retry=async (entry:Staged) => {setBusy(true);onBusy(true);try{await process(entry);}finally{setBusy(false);onBusy(false);}};
  return <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4"><h3 className="text-sm font-black">{tr(lang,"attachments")}</h3><p className="text-xs leading-relaxed text-zinc-500">{tr(lang,"fileHint")}</p>
    <div className="flex flex-wrap items-end gap-2">{admin && !lockedCategory && <div className="min-w-36"><Pick label={tr(lang,"kind")} value={category} onChange={e=>setCategory(e.target.value as FileCategory)} disabled={busy} options={["photo","invoice","document"].map(value=>({value,label:tr(lang,value)}))}/></div>}<Btn onClick={()=>regular.current?.click()} disabled={busy}><Upload className="h-4 w-4" />{tr(lang,"upload")}</Btn><Btn onClick={()=>camera.current?.click()} disabled={busy}><Camera className="h-4 w-4" />{tr(lang,"camera")}</Btn></div>
    <input ref={regular} type="file" hidden multiple accept={category==="photo"?"image/jpeg,image/png,image/webp":"image/jpeg,image/png,image/webp,application/pdf"} onChange={e=>{void add(e.target.files);e.target.value="";}} />
    <input ref={camera} type="file" hidden capture="environment" accept="image/*" onChange={e=>{void add(e.target.files);e.target.value="";}} />
    <ErrorBanner lang={lang} error={error}/>
    {items.map(entry=><div key={entry.id} className="rounded-xl border bg-white p-3 text-xs"><div className="flex items-center gap-2">{entry.state==="busy"?<LoaderCircle className="h-4 w-4 animate-spin"/>:entry.state==="ready"?<CheckCircle2 className="h-4 w-4 text-emerald-600"/>:<AlertTriangle className="h-4 w-4 text-red-600"/>}<span className="min-w-0 flex-1 truncate">{entry.file.name}</span><span>{tr(lang,entry.state==="busy"?"uploading":entry.state==="ready"?"uploaded":"retry")}</span>{entry.state==="error"&&<><Btn disabled={busy} onClick={()=>retry(entry)}>{tr(lang,"retry")}</Btn>{onIncomplete&&<Btn disabled={busy} onClick={()=>setItems(prev=>prev.filter(item=>item.id!==entry.id))}>{tr(lang,"skipFailedUpload")}</Btn>}</>}</div>{entry.error&&<p className="mt-2 text-red-700">{errorText(lang,entry.error)}</p>}</div>)}
    {existing.some(f=>!f.event_id&&(admin||f.category==="photo"))&&<details><summary className="cursor-pointer text-xs font-bold">{tr(lang,"existingFiles")}</summary><div className="mt-2 space-y-2">{existing.filter(f=>!f.event_id&&(admin||f.category==="photo")).map(f=><Check key={f.id} label={f.name} checked={fileIds.includes(f.id)} disabled={busy} onChange={e=>onIds(e.target.checked?[...fileIds,f.id]:fileIds.filter(id=>id!==f.id))}/>)}</div></details>}
  </div>;
}
