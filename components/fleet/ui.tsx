"use client";
import React, { useEffect, useId, useRef, useState } from "react";
import { Camera, FileText, Loader2, Paperclip, X } from "lucide-react";
import { api, type PendingFile } from "@/lib/fleet/client";
import { fmtDate, fmtNumber, planDue } from "@/lib/fleet/logic";
import type { FleetFile, Plan, Vehicle } from "@/lib/fleet/schema";

export const labels = {
  kind: { car: "Osobowy", van: "Dostawczy / bus", truck: "Ciężarowy", trailer: "Przyczepa / naczepa", crane: "Dźwig", machine: "Maszyna", other: "Inny" },
  status: { available: "Dostępny", in_use: "W użytkowaniu", in_service: "W serwisie", out_of_service: "Wyłączony z użytkowania", archived: "Archiwum" },
  fuel: { diesel: "Diesel", petrol: "Benzyna", hybrid: "Hybryda", electric: "Elektryczny", lpg: "LPG", other: "Inne", none: "Nie dotyczy" },
  meter: { km: "Kilometry", hours: "Motogodziny", both: "Kilometry i motogodziny", none: "Bez licznika" },
  ownership: { owned: "Własność", leased: "Leasing", rented: "Wynajem" },
  plan: { inspection: "Badanie techniczne", insurance: "Ubezpieczenie", oil: "Olej", filter: "Filtr", service: "Serwis", tyres: "Opony", warranty: "Gwarancja", other: "Inne" },
  event: { created: "Dodanie", edited: "Zmiana danych", mileage: "Licznik", meter_correction: "Korekta licznika", service: "Serwis", repair: "Naprawa", inspection: "Badanie techniczne", insurance: "Ubezpieczenie", fuel: "Tankowanie / ładowanie", assignment: "Przekazanie / zwrot", defect: "Usterka", defect_resolved: "Zamknięcie usterki", plans: "Harmonogram", archived: "Archiwizacja", restored: "Przywrócenie", documents: "Dokumenty", note: "Notatka", void: "Unieważnienie" },
  file: { photo: "Zdjęcie pojazdu", damage: "Zdjęcie uszkodzenia", invoice: "Faktura (tylko admin)", document: "Dokument (tylko admin)" },
};
export const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100";
export function Action({ children, onClick, variant = "primary", disabled = false, type = "button", title, className = "" }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "danger"; disabled?: boolean; type?: "button" | "submit"; title?: string; className?: string;
}) {
  return <button type={type} title={title} onClick={onClick} disabled={disabled} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${variant === "primary" ? "bg-slate-900 text-white hover:bg-slate-700" : variant === "danger" ? "bg-red-50 text-red-800 ring-1 ring-inset ring-red-200 hover:bg-red-100" : "bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"} ${className}`}>{children}</button>;
}
export function Field({ label, value, onChange, type = "text", required = false, disabled = false, step, min, max, placeholder, autoComplete }: {
  label: string; value: string | number | null; onChange: (value: string) => void; type?: string; required?: boolean; disabled?: boolean; step?: string; min?: number | string; max?: number | string; placeholder?: string; autoComplete?: string;
}) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}{required ? " *" : ""}</span><input className={inputClass} value={value ?? ""} onChange={(e) => onChange(e.target.value)} type={type} required={required} disabled={disabled} step={step} min={min} max={max} placeholder={placeholder} autoComplete={autoComplete} /></label>;
}
export function Pick({ label, value, onChange, options, disabled = false }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; disabled?: boolean }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span><select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
}
export function TextArea({ label, value, onChange, required = false, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}{required ? " *" : ""}</span><textarea className={`${inputClass} min-h-24`} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} /></label>;
}
export function options(map: Record<string, string>): { value: string; label: string }[] { return Object.entries(map).map(([value, label]) => ({ value, label })); }
export function number(value: string): number | null { return value.trim() === "" ? null : Number(value.replace(",", ".")); }
export function ErrorBox({ children }: { children: React.ReactNode }) { return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm whitespace-pre-line text-red-800">{children}</div>; }
export function Hint({ children }: { children: React.ReactNode }) { return <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{children}</div>; }
export function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="space-y-4"><h3 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-900">{title}</h3>{children}</section>; }
export function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "red" | "amber" | "green" }) {
  const cls = { neutral: "bg-slate-100 text-slate-700", red: "bg-red-100 text-red-800", amber: "bg-amber-100 text-amber-900", green: "bg-emerald-100 text-emerald-800" }[tone];
  return <span className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}
export function PlanStatus({ plan, vehicle }: { plan: Plan; vehicle: Vehicle }) {
  const due = planDue(plan, vehicle);
  const text = { ok: "Termin w porządku", soon: "Zbliża się termin", due: "Termin osiągnięty / przekroczony", missing: "Uzupełnij termin / licznik", disabled: "Nie dotyczy" }[due.level];
  return <div className="space-y-1.5"><Chip tone={due.level === "due" ? "red" : ["soon", "missing"].includes(due.level) ? "amber" : due.level === "ok" ? "green" : "neutral"}>{text}</Chip>
    {plan.disabled ? <p className="text-xs text-slate-500">{plan.disabledReason}</p> : <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
      {plan.dueDate && <span>{fmtDate(plan.dueDate)} • {due.days === 0 ? "dzisiaj" : due.days! > 0 ? `za ${due.days} dni` : `${-due.days!} dni po terminie`}</span>}
      {plan.dueKm !== null && <span>{fmtNumber(plan.dueKm)} km {due.km === null ? "• brak odczytu" : due.km >= 0 ? `• zostało ${fmtNumber(due.km)} km` : `• przekroczono o ${fmtNumber(-due.km)} km`}</span>}
      {plan.dueHours !== null && <span>{fmtNumber(plan.dueHours, 1)} h {due.hours === null ? "• brak odczytu" : due.hours >= 0 ? `• zostało ${fmtNumber(due.hours, 1)} h` : `• przekroczono o ${fmtNumber(-due.hours, 1)} h`}</span>}
    </div>}
  </div>;
}
export function Dialog({ title, subtitle, children, onClose, onSubmit, busy = false, error = "", progress = "", submitLabel = "Zapisz", wide = false }: {
  title: string; subtitle?: string; children: React.ReactNode; onClose: () => void; onSubmit?: () => Promise<void> | void;
  busy?: boolean; error?: string; progress?: string; submitLabel?: string; wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null); const id = useId();
  useEffect(() => { const el = ref.current; if (el && !el.open) el.showModal(); return () => el?.close(); }, []);
  return <dialog ref={ref} aria-labelledby={id} onCancel={(e) => { e.preventDefault(); if (!busy) onClose(); }} className={`m-auto max-h-[92dvh] w-[calc(100%_-_1.5rem)] overflow-auto rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-slate-950/60 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>
    <form onSubmit={(e) => { e.preventDefault(); if (onSubmit && !busy) void onSubmit(); }}>
      <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4"><div><h2 id={id} className="text-lg font-bold text-slate-900">{title}</h2>{subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}</div><button aria-label="Zamknij" type="button" disabled={busy} className="rounded-lg p-2 hover:bg-slate-100" onClick={onClose}><X size={20} /></button></header>
      <fieldset disabled={busy} className="space-y-5 p-5">{children}</fieldset>
      {(error || progress) && <div className="px-5 pb-4">{error && <ErrorBox>{error}</ErrorBox>}{progress && <p role="status" className="mt-2 text-sm text-slate-600">{progress}</p>}</div>}
      <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4"><Action variant="secondary" onClick={onClose} disabled={busy}>{onSubmit ? "Anuluj" : "Zamknij"}</Action>{onSubmit && <Action type="submit" disabled={busy}>{busy && <Loader2 size={16} className="animate-spin" />}{busy ? "Zapisywanie…" : submitLabel}</Action>}</footer>
    </form>
  </dialog>;
}
export function FilePicker({ files, setFiles, kind = "invoice" }: { files: PendingFile[]; setFiles: React.Dispatch<React.SetStateAction<PendingFile[]>>; kind?: FleetFile["kind"] }) {
  const input = useRef<HTMLInputElement>(null); const camera = useRef<HTMLInputElement>(null); const [error, setError] = useState("");
  function add(list: FileList | null) {
    if (!list) return; setError("");
    const incoming = Array.from(list);
    if (files.length + incoming.length > 12) { setError("Maksymalnie 12 plików w jednym wpisie."); return; }
    if (incoming.some((f) => !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(f.type) || f.size <= 0 || f.size > 12 * 1024 * 1024)) {
      setError("Wybierz JPG, PNG, WEBP lub PDF do 12 MB. Zdjęcia HEIC z iPhone’a zapisz najpierw jako JPG."); return;
    }
    if (["photo", "damage"].includes(kind) && incoming.some((f) => !f.type.startsWith("image/"))) { setError("W tym miejscu dodaj zdjęcia. PDF dodasz w Dokumentach."); return; }
    setFiles((current) => [...current, ...incoming.map((file) => ({ key: crypto.randomUUID(), file, kind }))]);
    if (input.current) input.current.value = ""; if (camera.current) camera.current.value = "";
  }
  return <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
    <div className="flex flex-wrap items-center gap-2"><Action variant="secondary" onClick={() => input.current?.click()}><Paperclip size={16} />Dodaj {kind === "invoice" ? "fakturę / załącznik" : "pliki"}</Action><Action variant="secondary" onClick={() => camera.current?.click()}><Camera size={16} />Zrób zdjęcie</Action></div>
    <input ref={input} type="file" className="hidden" accept={["photo", "damage"].includes(kind) ? "image/jpeg,image/png,image/webp" : "image/jpeg,image/png,image/webp,application/pdf"} multiple onChange={(e) => add(e.target.files)} />
    <input ref={camera} type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => add(e.target.files)} />
    <p className="text-xs text-slate-500">JPG, PNG, WEBP, PDF • do 12 MB/plik • zapis po zatwierdzeniu formularza. Oryginały faktur nie są kompresowane.</p>
    {files.map((item) => <div key={item.key} className="flex items-center justify-between gap-2 rounded-lg bg-white p-2 text-sm"><span className="min-w-0 truncate"><FileText size={14} className="mr-2 inline" />{item.file.name} <span className="text-xs text-slate-400">({(item.file.size / 1024 / 1024).toFixed(1)} MB){item.ready ? " • wysłano" : ""}</span></span><button type="button" aria-label={`Usuń ${item.file.name}`} onClick={() => { if (item.prepared) { setError("Plik został już wysłany. Anuluj formularz, aby usunąć pliki robocze, lub dokończ zapis."); return; } setFiles((all) => all.filter((f) => f.key !== item.key)); }} className="rounded-lg p-1.5 hover:bg-red-50"><X size={16} /></button></div>)}
    {error && <ErrorBox>{error}</ErrorBox>}
  </div>;
}
export function FilePreview({ file, onClose }: { file: FleetFile; onClose: () => void }) {
  const [url, setUrl] = useState(""); const [error, setError] = useState("");
  useEffect(() => { let active = true; void api<{ url: string }>(`/files?id=${file.id}`).then((r) => { if (active) setUrl(r.url); }).catch((e) => { if (active) setError(String(e.message)); }); return () => { active = false; }; }, [file.id]);
  return <Dialog wide title={file.name} subtitle="Prywatny podgląd • link ważny przez 2 minuty" onClose={onClose} error={error}>
    {!url && !error && <p className="p-8 text-center">Otwieranie pliku…</p>}
    {url && <>{file.mime === "application/pdf" ? <iframe title={file.name} src={url} className="h-[65vh] w-full rounded-xl border" /> : <img src={url} alt={file.name} className="max-h-[65vh] w-full rounded-xl object-contain" />}<a href={url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-semibold text-orange-700 underline">Otwórz w nowej karcie</a></>}
  </Dialog>;
}
