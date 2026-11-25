"use client";
/*
 * Nowy widok modułu Pojazdy – wygląd jak w systemie firmowym ACC BAU.
 * To jest WYŁĄCZNIE warstwa wyglądu. Dane, logowanie, formularze, zapisy i API są te same,
 * co w starym widoku (FleetPage.tsx) – ten plik niczego nie zapisuje sam.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { downloadText } from "@/lib/fleet/client";
import { COMPLIANCE_KINDS, complianceCheck, complianceSeverityRank, vehicleCompliance, type ComplianceCheck, type ComplianceSeverity } from "@/lib/fleet/compliance";
import { ct } from "@/lib/fleet/compliance-i18n";
import { costTotals, csvCell, dayDifference, effectiveEventMileage, localToday, planAlert, vehicleAlerts } from "@/lib/fleet/domain";
import { fleetLocale, tr } from "@/lib/fleet/i18n";
import { printVehicle } from "@/lib/fleet/print";
import type { ComplianceKind, FleetFile, FleetMember, PlanAlert, Vehicle, VehicleDetail } from "@/lib/fleet/types";
import type { ModalSpec } from "./forms";
import { DateText, ErrorBanner, FileTiles, PrivateImage, num } from "./common";

export interface NewViewProps {
  lang: string; member: FleetMember; admin: boolean; vehicles: Vehicle[]; today: string;
  loading: boolean; loadedAt: string; listError: boolean; error: string; toast: string;
  selected: string; detail: VehicleDetail | null; detailLoading: boolean; actionBusy: boolean;
  onRefresh: () => unknown; onSignOut: () => void; onMembers: () => void; onClassic: () => void;
  onOpen: (id: string) => void; onBack: () => void; onModal: (spec: ModalSpec) => void;
  onCompliance: (kind: ComplianceKind) => void; onOpenCompliance: (id: string, kind: ComplianceKind) => void;
  onFile: (file: FleetFile) => void; onQuick: (type: string, payload: Record<string, unknown>) => void; onError: (code: string) => void;
}

/* Teksty, których nie ma w słownikach modułu (PL / EN / DE). */
const TEXT: Record<string, [string, string, string]> = {
  classic: ["Stary widok", "Classic view", "Alte Ansicht"],
  newLook: ["Nowy widok", "New view", "Neue Ansicht"],
  hint: ["Kliknij kafel, żeby zobaczyć tylko te pojazdy. Wymagające uwagi są zawsze na górze.", "Click a tile to show only those vehicles. Vehicles needing attention are always on top.", "Kachel anklicken, um nur diese Fahrzeuge zu sehen. Fahrzeuge mit Handlungsbedarf stehen immer oben."],
  allSub: ["bez archiwum", "without archive", "ohne Archiv"],
  attentionSub: ["coś jest do zrobienia", "something to do", "etwas ist zu erledigen"],
  deadlinesSub: ["po terminie albo blisko terminu", "overdue or due soon", "überfällig oder bald fällig"],
  defectsSub: ["zgłoszone, niezamknięte", "reported, not closed", "gemeldet, nicht geschlossen"],
  immobilizedSub: ["nie jeżdżą", "not in operation", "nicht im Einsatz"],
  todo: ["Do zrobienia", "To do", "Zu erledigen"],
  more: ["i jeszcze", "and more:", "und weitere:"],
  back: ["← Wszystkie pojazdy", "← All vehicles", "← Alle Fahrzeuge"],
  moreFilters: ["Więcej filtrów", "More filters", "Weitere Filter"],
  lessFilters: ["Mniej filtrów", "Fewer filters", "Weniger Filter"],
  clear: ["Wyczyść filtry", "Clear filters", "Filter zurücksetzen"],
  shown: ["Pokazano", "Showing", "Angezeigt"],
  of: ["z", "of", "von"],
  controlCsv: ["Eksport terminów (CSV)", "Export deadlines (CSV)", "Termine exportieren (CSV)"],
  data: ["Dane pojazdu", "Vehicle data", "Fahrzeugdaten"],
  vehicle: ["Pojazd", "Vehicle", "Fahrzeug"],
  userSite: ["Użytkownik / budowa", "User / site", "Nutzer / Baustelle"],
  noMileage: ["Brak wpisanego przebiegu", "No mileage recorded", "Kein Kilometerstand erfasst"],
  addDocument: ["Dodaj dokument / zdjęcie", "Add document / photo", "Dokument / Foto hinzufügen"],
  stale: ["Nie udało się odświeżyć listy – liczby mogą być nieaktualne.", "The list could not be refreshed – the numbers may be out of date.", "Die Liste konnte nicht aktualisiert werden – die Zahlen können veraltet sein."],
};
export const viewText = (lang: string, key: string): string => TEXT[key]?.[lang === "de" ? 2 : lang === "en" ? 1 : 0] ?? key;

const nt = viewText;

/* Wygląd – te same kolory, co w systemie firmowym. */
const FONT = { fontFamily: '"Open Sans", var(--font-geist-sans), system-ui, sans-serif' };
const FOCUS = "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#F07B2E]";
const BTN_LINE = `inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-[#D9DCE0] bg-white px-4 py-2 text-sm font-semibold text-[#2B2B2B] transition hover:border-[#3A3A3A] disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;
const BTN_MAIN = `inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#3A3A3A] px-5 py-3 text-base font-bold text-white transition hover:bg-[#2B2B2B] disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;
const BTN_ALERT = `inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-[1.5px] border-[#9B1C12] bg-white px-5 py-3 text-base font-bold text-[#9B1C12] transition hover:bg-[#FEE4E2] disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;
const FIELD = "min-h-12 w-full rounded-[10px] border-[1.5px] border-[#D9DCE0] bg-white px-3 py-2.5 text-base font-normal text-[#2B2B2B] outline-none focus:border-[#3A3A3A]";
const LAB = "text-xs font-bold uppercase tracking-[0.08em] text-[#4B5563]";
const H2 = "text-[22px] font-extrabold tracking-tight text-[#2B2B2B]";
type Tone = "ok" | "soon" | "late" | "na";
const PILL: Record<Tone, string> = { ok: "bg-[#E7F6EC] text-[#05603A]", soon: "bg-[#FFF1DC] text-[#7A3E00]", late: "bg-[#FEE4E2] text-[#9B1C12]", na: "bg-[#F1F2F4] text-[#4B5563]" };
const toneOf = (severity: ComplianceSeverity | PlanAlert["severity"]): Tone => severity === "overdue" ? "late" : severity === "ok" ? "ok" : severity === "na" ? "na" : "soon";
function Pill({ tone, big = false, children }: { tone: Tone; big?: boolean; children: React.ReactNode }) {
  return <span className={`inline-block rounded-lg font-bold leading-snug ${big ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"} ${PILL[tone]}`}>{children}</span>;
}
function dateText(date: string, lang: string): string {
  const d = new Date(date + "T12:00:00Z");
  return Number.isNaN(d.getTime()) ? date : new Intl.DateTimeFormat(fleetLocale(lang)).format(d);
}

/* Te same zasady, co w starym widoku. */
const stale = (v: Vehicle) => v.data.mileage == null || !v.data.mileageDate || dayDifference(v.data.mileageDate) < -30;
const immobilized = (v: Vehicle) => ["service", "out_of_service"].includes(v.data.status);
const statusTone = (v: Vehicle): Tone => v.data.archived || v.data.status === "sold" ? "na" : immobilized(v) ? "late" : v.data.status === "available" ? "ok" : "na";
const needsAttention = (v: Vehicle, today: string) => !v.data.archived && (v.data.openDefects > 0 || stale(v) || !v.data.plans.some(p => !p.archived) || vehicleAlerts(v, today).some(a => a.severity !== "ok") || vehicleCompliance(v, today).issues.length > 0);

interface Todo { tone: Tone; text: string }
interface Row { v: Vehicle; checks: ComplianceCheck[]; attention: boolean; dated: boolean; rank: number; todo: Todo[] }
function daysNote(days: number | null | undefined, lang: string): string {
  if (days == null) return "";
  return days === 0 ? ` (${ct(lang, "today")})` : ` (${ct(lang, days < 0 ? "daysOverdue" : "daysLeft")}: ${Math.abs(days)})`;
}
function buildRow(v: Vehicle, today: string, lang: string): Row {
  const compliance = vehicleCompliance(v, today);
  const tracked = new Set(compliance.checks.flatMap(check => check.plans.map(p => p.id)));
  const alerts = v.data.archived ? [] : vehicleAlerts(v, today).filter(a => !tracked.has(a.plan.id) && a.severity !== "ok");
  const todo: Todo[] = [];
  for (const issue of compliance.issues) todo.push({ tone: toneOf(issue.severity),
    text: `${ct(lang, issue.kind)}: ${ct(lang, issue.code)}${issue.dueDate ? ` — ${dateText(issue.dueDate, lang)}${daysNote(issue.days, lang)}` : ""}` });
  for (const a of alerts) todo.push({ tone: toneOf(a.severity),
    text: `${a.plan.label}: ${ct(lang, a.severity === "overdue" ? "expired" : a.severity === "soon" ? "deadline" : "dateMissing")}${a.plan.dueDate ? ` — ${dateText(a.plan.dueDate, lang)}${daysNote(a.days, lang)}` : ""}${a.km != null ? ` · ${tr(lang, "remaining")}: ${num(a.km, lang)} km` : ""}` });
  if (!v.data.archived) {
    if (v.data.openDefects > 0) todo.push({ tone: "late", text: `${tr(lang, "defects")}: ${v.data.openDefects}` });
    if (stale(v)) todo.push({ tone: "soon", text: v.data.mileage == null ? nt(lang, "noMileage") : tr(lang, "lastMileageOld") });
    if (!v.data.plans.some(p => !p.archived)) todo.push({ tone: "soon", text: tr(lang, "noPlans") });
  }
  const dated = compliance.issues.some(i => i.severity !== "missing") || alerts.some(a => a.severity !== "missing");
  const rank = todo.some(t => t.tone === "late") ? 0 : todo.length ? 1 : 2;
  return { v, checks: compliance.checks, attention: needsAttention(v, today), dated, rank, todo };
}
function termPill(check: ComplianceCheck, lang: string): { tone: Tone; text: string } {
  if (check.requirement === "not_required") return { tone: "na", text: ct(lang, "na") };
  const tone = toneOf(check.severity), d = check.days;
  if (check.severity !== "missing" && d !== null) return { tone, text: d === 0 ? ct(lang, "today") : `${ct(lang, d < 0 ? "daysOverdue" : "daysLeft")}: ${Math.abs(d)}` };
  return { tone, text: ct(lang, check.severity) };
}
function TermDate({ check, lang }: { check: ComplianceCheck; lang: string }) {
  if (check.requirement === "not_required") return <>—</>;
  if (check.kind === "registration") return null; // dowód nie ma daty – stan pokazuje sama etykieta
  return check.dueDate ? <DateText date={check.dueDate} lang={lang} /> : <>{ct(lang, check.requirement === "unconfirmed" ? "unknown" : "dateMissing")}</>;
}
function TodoBox({ items, lang, limit }: { items: Todo[]; lang: string; limit?: number }) {
  if (!items.length) return null;
  const late = items.some(i => i.tone === "late"), shown = limit ? items.slice(0, limit) : items;
  return <div className={`rounded-[10px] px-3.5 py-2 text-sm font-semibold ${late ? "bg-[#FEE4E2] text-[#9B1C12]" : "bg-[#FFF4E5] text-[#7A3E00]"}`}>
    <span className="font-extrabold">{nt(lang, "todo")}:</span> {shown.map(i => i.text).join(" · ")}{shown.length < items.length ? ` · ${nt(lang, "more")} ${items.length - shown.length}` : ""}
  </div>;
}
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0"><dt className={LAB}>{label}</dt><dd className="mt-0.5 break-words whitespace-pre-wrap text-base font-semibold">{children === "" || children == null ? "—" : children}</dd></div>;
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <label className="block min-w-0 text-[13px] font-semibold"><span className="mb-1 block">{label}</span>
    <select value={value} onChange={e => onChange(e.target.value)} className={FIELD}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
}

export default function NewFleetView(p: NewViewProps) {
  const { lang, admin, vehicles, today } = p;
  const [tile, setTile] = useState("all"), [extra, setExtra] = useState(""), [query, setQuery] = useState("");
  const [driver, setDriver] = useState(""), [category, setCategory] = useState(""), [status, setStatus] = useState(""), [responsible, setResponsible] = useState("");
  const [moreFilters, setMoreFilters] = useState(false), [mode, setMode] = useState("list");
  const root = useRef<HTMLDivElement>(null), listScroll = useRef(0);
  const detail = p.detail?.vehicle.id === p.selected ? p.detail : null;
  const card = !!p.selected;
  // Karta zaczyna się od góry; po powrocie lista wraca w to samo miejsce.
  useEffect(() => {
    if (card) root.current?.scrollIntoView({ block: "start" });
    else if (listScroll.current) window.scrollTo(0, listScroll.current);
  }, [card]);

  const rows = useMemo(() => vehicles.map(v => buildRow(v, today, lang)), [vehicles, today, lang]);
  const activeRows = rows.filter(r => !r.v.data.archived);
  const tiles = [
    { key: "all", label: tr(lang, "fleetCount"), sub: nt(lang, "allSub"), count: activeRows.length },
    { key: "attention", label: ct(lang, "attention"), sub: nt(lang, "attentionSub"), count: activeRows.filter(r => r.attention).length },
    { key: "deadlines", label: tr(lang, "deadlines"), sub: nt(lang, "deadlinesSub"), count: activeRows.filter(r => r.dated).length },
    { key: "defects", label: tr(lang, "defects"), sub: nt(lang, "defectsSub"), count: activeRows.reduce((n, r) => n + r.v.data.openDefects, 0) },
    { key: "immobilized", label: tr(lang, "immobilized"), sub: nt(lang, "immobilizedSub"), count: activeRows.filter(r => immobilized(r.v)).length },
  ];
  const needle = query.trim().toLocaleLowerCase();
  const filtered = rows.filter(r => {
    const d = r.v.data;
    if (extra === "archived" ? !d.archived : d.archived) return false;
    if (extra !== "archived") {
      if (tile === "attention" && !r.attention) return false;
      if (tile === "deadlines" && !r.dated) return false;
      if (tile === "defects" && !(d.openDefects > 0)) return false;
      if (tile === "immobilized" && !immobilized(r.v)) return false;
      if (extra === "noDriver" && d.driver) return false;
      if (extra === "noMileage" && !stale(r.v)) return false;
    }
    if (status && (status === "immobilized" ? !immobilized(r.v) : d.status !== status)) return false;
    if (driver && d.driver !== driver) return false;
    if (category && d.category !== category) return false;
    if (responsible && d.compliance?.responsible !== responsible) return false;
    return !needle || [d.plate, d.name, d.make, d.model, d.vin, d.driver, d.project, d.location, d.company, d.compliance?.responsible].join(" ").toLocaleLowerCase().includes(needle);
  }).sort((a, b) => a.rank - b.rank || a.v.data.plate.localeCompare(b.v.data.plate));
  const filtersOn = tile !== "all" || !!(extra || query || driver || category || status || responsible);
  function clearFilters() { setTile("all"); setExtra(""); setQuery(""); setDriver(""); setCategory(""); setStatus(""); setResponsible(""); }
  const alerts = useMemo(() => vehicles.filter(v => !v.data.archived).flatMap(v => vehicleAlerts(v, today).map(a => ({ ...a, vehicle: v })))
    .sort((a, b) => ({ overdue: 0, soon: 1, missing: 2, ok: 3 }[a.severity] - { overdue: 0, soon: 1, missing: 2, ok: 3 }[b.severity]) || ((a.days ?? 99999) - (b.days ?? 99999))), [vehicles, today]);
  const names = (pick: (v: Vehicle) => string | undefined) => Array.from(new Set(vehicles.map(pick).filter((name): name is string => !!name))).sort().map(value => ({ value, label: value }));

  function open(id: string) { try { listScroll.current = window.scrollY || 0; } catch { listScroll.current = 0; } p.onOpen(id); }
  function exportCsv() {
    const keys = ["plate", "make", "model", "vin", "driver", "project", "mileage", "mileageDate", "status"] as const;
    const lines = [keys.map(k => csvCell(tr(lang, k))).join(";"), ...filtered.map(r => keys.map(k => csvCell(k === "status" ? tr(lang, r.v.data.status) : r.v.data[k])).join(";"))];
    downloadText(`ACC-BAU-pojazdy-${localToday()}.csv`, "﻿" + lines.join("\r\n"), "text/csv;charset=utf-8");
  }
  function exportControl() {
    const headings = [tr(lang, "plate"), tr(lang, "make"), tr(lang, "model"), tr(lang, "driver"), ct(lang, "responsible"), tr(lang, "mileage"), ct(lang, "insurance"), ct(lang, "inspection"), ct(lang, "udt"), ct(lang, "attention")];
    const lines = filtered.map(r => {
      const d = r.v.data;
      return [d.plate, d.make, d.model, d.driver, d.compliance?.responsible || "", d.mileage,
        ...(["insurance", "inspection", "udt"] as const).map(kind => { const c = r.checks.find(x => x.kind === kind)!; return c.requirement === "not_required" ? ct(lang, "na") : c.dueDate || ct(lang, "dateMissing"); }),
        r.checks.flatMap(c => r.v.data.archived ? [] : c.issues).map(i => `${ct(lang, i.kind)}: ${ct(lang, i.code)}${i.dueDate ? " " + i.dueDate : ""}`).join(" | ")];
    });
    downloadText(`ACC-BAU-kontrola-floty-${today}.csv`, "﻿" + [headings, ...lines].map(line => line.map(csvCell).join(";")).join("\r\n"), "text/csv;charset=utf-8");
  }

  const header = <header className="flex flex-wrap items-center justify-between gap-3">
    <div className="text-[26px] font-bold text-[#3A3A3A]">ACC BAU <span className="text-[#F07B2E]">•</span> <span className="text-[15px] font-medium text-[#4B5563]">{tr(lang, "vehicles")}</span></div>
    <div className="flex flex-wrap items-center gap-2 text-sm text-[#4B5563]">
      <span className="mr-1">{p.member.name} · {tr(lang, p.member.role)}</span>
      <button type="button" className={BTN_LINE} onClick={p.onRefresh} disabled={p.loading || p.detailLoading}>{tr(lang, "refresh")}</button>
      {admin && <button type="button" className={BTN_LINE} onClick={p.onMembers}>{tr(lang, "members")}</button>}
      <button type="button" className={BTN_LINE} onClick={p.onClassic}>{nt(lang, "classic")}</button>
      <button type="button" className={BTN_LINE} onClick={p.onSignOut}>{tr(lang, "logout")}</button>
    </div>
  </header>;
  const notices = <>
    <ErrorBanner lang={lang} error={p.error} />
    {p.toast && <div role="status" className="rounded-[10px] bg-[#E7F6EC] px-4 py-3 text-sm font-bold text-[#05603A]">{p.toast}</div>}
    {p.listError && <div role="alert" className="rounded-[10px] bg-[#FEE4E2] px-4 py-3 text-sm font-bold text-[#9B1C12]">{nt(lang, "stale")} {ct(lang, "staleData")}</div>}
  </>;

  return <div ref={root} style={FONT} className="scroll-mt-4 rounded-[28px] bg-white px-4 py-6 text-[#2B2B2B] shadow-2xl sm:px-8 sm:py-8">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&display=swap" />
    <div className="flex flex-col gap-7">
      {header}
      {notices}
      {card ? <VehicleCard key={p.selected} p={p} detail={detail} /> : <>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[46px]">{tr(lang, "vehicles")}</h2>
            <p className="mt-2 max-w-2xl text-[15px] text-[#4B5563]">{nt(lang, "hint")}</p>
          </div>
          {admin && <div className="flex flex-wrap gap-2">
            <button type="button" className={`${BTN_MAIN} min-h-12`} onClick={() => p.onModal({ type: "create" })}>+ {tr(lang, "addVehicle")}</button>
            <button type="button" className={BTN_LINE} onClick={exportCsv}>{tr(lang, "exportCsv")}</button>
            <button type="button" className={BTN_LINE} onClick={exportControl}>{nt(lang, "controlCsv")}</button>
          </div>}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
          {tiles.map(t => <button type="button" key={t.key} aria-pressed={tile === t.key && extra !== "archived"} onClick={() => { setTile(t.key); if (extra === "archived") setExtra(""); setMode("list"); }}
            className={`flex min-h-[124px] flex-col gap-1.5 rounded-[20px] bg-[#3A3A3A] p-4 text-left text-white transition hover:bg-[#2B2B2B] sm:p-5 ${FOCUS} ${tile === t.key && extra !== "archived" ? "outline outline-4 outline-offset-2 outline-[#F07B2E]" : ""}`}>
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#F9A36B] sm:text-xs">{t.label}</span>
            <span className="text-[40px] font-extrabold leading-none">{p.loadedAt ? t.count : "…"}</span>
            <span className="mt-auto text-[13px] text-[#E5E7EB]">{t.sub}</span>
          </button>)}
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid items-end gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <label className="block text-[13px] font-semibold"><span className="mb-1 block">{ct(lang, "search")}</span>
              <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={tr(lang, "search")} className={FIELD} /></label>
            <Select label={tr(lang, "driver")} value={driver} onChange={setDriver} options={[{ value: "", label: tr(lang, "all") }, ...names(v => v.data.driver)]} />
            <Select label={tr(lang, "category")} value={category} onChange={setCategory} options={[{ value: "", label: tr(lang, "all") }, ...["car", "van", "truck", "trailer", "crane", "telehandler", "machine", "other"].map(value => ({ value, label: tr(lang, value) }))]} />
          </div>
          {moreFilters && <div className="grid items-end gap-3 md:grid-cols-2">
            <Select label={tr(lang, "status")} value={status} onChange={setStatus} options={[{ value: "", label: tr(lang, "all") }, ...["immobilized", "available", "in_use", "service", "out_of_service", "sold"].map(value => ({ value, label: tr(lang, value) }))]} />
            <Select label={ct(lang, "responsible")} value={responsible} onChange={setResponsible} options={[{ value: "", label: ct(lang, "allPeople") }, ...names(v => v.data.compliance?.responsible)]} />
          </div>}
          <div className="flex flex-wrap items-center gap-2">
            {["noDriver", "noMileage", "archived"].map(key => <button type="button" key={key} aria-pressed={extra === key} onClick={() => { setExtra(extra === key ? "" : key); setMode("list"); }}
              className={`min-h-11 rounded-full border-[1.5px] px-4 py-2 text-sm font-semibold transition ${FOCUS} ${extra === key ? "border-[#3A3A3A] bg-[#3A3A3A] text-white" : "border-[#D9DCE0] bg-white text-[#2B2B2B] hover:border-[#3A3A3A]"}`}>{tr(lang, key)}</button>)}
            <button type="button" className={BTN_LINE} onClick={() => setMoreFilters(!moreFilters)}>{nt(lang, moreFilters ? "lessFilters" : "moreFilters")}</button>
            {filtersOn && <button type="button" className={BTN_LINE} onClick={clearFilters}>{nt(lang, "clear")}</button>}
            <span className="ml-auto flex flex-wrap gap-2">
              <button type="button" aria-pressed={mode === "list"} className={`${BTN_LINE} ${mode === "list" ? "border-[#3A3A3A]" : ""}`} onClick={() => setMode("list")}>{tr(lang, "dashboard")}</button>
              <button type="button" aria-pressed={mode === "calendar"} className={`${BTN_LINE} ${mode === "calendar" ? "border-[#3A3A3A]" : ""}`} onClick={() => setMode("calendar")}>{tr(lang, "calendar")}</button>
            </span>
          </div>
        </div>

        {mode === "calendar" ? <section className="flex flex-col gap-3">
          <h3 className={H2}>{tr(lang, "calendar")}</h3>
          <p className="text-sm text-[#4B5563]">{tr(lang, "firstDue")} {tr(lang, "calendarHint")}</p>
          {vehicles.filter(v => !v.data.archived && !v.data.plans.some(pl => !pl.archived)).map(v => <button type="button" key={v.id} onClick={() => open(v.id)} className={`rounded-[10px] bg-[#FFF4E5] px-3.5 py-2.5 text-left text-sm font-semibold text-[#7A3E00] ${FOCUS}`}><b>{v.data.plate}</b> — {tr(lang, "noPlans")}</button>)}
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-[15px]">
            <thead><tr className="border-b-2 border-[#2B2B2B]">{["vehicles", "label", "dueDate", "dueMileage", "status"].map(k => <th key={k} scope="col" className={`px-3 py-2.5 ${LAB}`}>{tr(lang, k)}</th>)}</tr></thead>
            <tbody>{alerts.map(a => <tr key={`${a.vehicle.id}-${a.plan.id}`} className="border-b border-[#D9DCE0] align-top">
              <td className="px-3 py-3"><button type="button" className={`text-lg font-extrabold hover:text-[#9A4A0F] ${FOCUS}`} onClick={() => open(a.vehicle.id)}>{a.vehicle.data.plate}</button><div className="text-sm text-[#4B5563]">{a.vehicle.data.driver || "—"}</div></td>
              <td className="px-3 py-3 font-semibold">{a.plan.label}</td>
              <td className="px-3 py-3 whitespace-nowrap"><DateText date={a.plan.dueDate} lang={lang} /></td>
              <td className="px-3 py-3 whitespace-nowrap">{num(a.plan.dueMileage, lang)}{a.km != null && <div className="text-sm text-[#4B5563]">{tr(lang, "remaining")}: {num(a.km, lang)} km</div>}</td>
              <td className="px-3 py-3"><Pill tone={toneOf(a.severity)}>{tr(lang, a.severity)}</Pill></td>
            </tr>)}</tbody>
          </table></div>
        </section> : <section className="flex flex-col">
          <div className="hidden gap-4 border-b-2 border-[#2B2B2B] px-1 pb-2.5 lg:grid lg:grid-cols-[1.8fr_1.3fr_0.9fr_1.1fr_1.1fr_1.1fr_1.1fr]">
            {[nt(lang, "vehicle"), nt(lang, "userSite"), tr(lang, "mileage"), ct(lang, "insurance"), ct(lang, "inspection"), ct(lang, "udt"), ct(lang, "registration")].map(label => <span key={label} className={LAB}>{label}</span>)}
          </div>
          {!p.loadedAt && <p className="py-10 text-center text-[#4B5563]">{ct(lang, "notLoaded")}</p>}
          {!!p.loadedAt && !filtered.length && <p className="rounded-[14px] border-[1.5px] border-dashed border-[#D9DCE0] p-8 text-center text-[#4B5563]">{tr(lang, vehicles.length ? "empty" : "firstVehicle")}</p>}
          {filtered.map(r => { const d = r.v.data; return <article key={r.v.id} className="flex flex-col gap-2.5 border-b border-[#D9DCE0] px-1 py-4">
            <div className="grid gap-x-4 gap-y-3 lg:grid-cols-[1.8fr_1.3fr_0.9fr_1.1fr_1.1fr_1.1fr_1.1fr]">
              <div className="min-w-0">
                <button type="button" onClick={() => open(r.v.id)} className={`text-left text-[22px] font-extrabold tracking-[0.02em] hover:text-[#9A4A0F] ${FOCUS}`}>{d.plate}</button>
                <div className="text-sm text-[#4B5563]">{d.make} {d.model}{d.name ? ` · ${d.name}` : ""}</div>
                <div className="mt-1"><Pill tone={statusTone(r.v)}>{tr(lang, d.archived ? "archived" : d.status)}</Pill></div>
              </div>
              <div className="min-w-0"><div className="font-semibold">{d.driver || tr(lang, "noDriver")}</div><div className="text-sm text-[#4B5563]">{d.project}</div></div>
              <div className="min-w-0"><div className="font-semibold">{num(d.mileage, lang)} km</div><div className="text-[13px] text-[#4B5563]"><DateText date={d.mileageDate} lang={lang} /></div></div>
              <div className="col-span-full grid grid-cols-2 items-start gap-3 lg:col-span-4 lg:grid-cols-4 lg:gap-4">
                {(["insurance", "inspection", "udt", "registration"] as const).map(kind => { const check = r.checks.find(c => c.kind === kind)!, pill = termPill(check, lang);
                  return <button type="button" key={kind} aria-label={`${d.plate}: ${ct(lang, kind)}`} onClick={() => admin && !d.archived ? p.onOpenCompliance(r.v.id, kind) : open(r.v.id)} className={`min-w-0 rounded-lg text-left ${FOCUS}`}>
                    <span className={`block lg:hidden ${LAB}`}>{ct(lang, kind)}</span>
                    <span className="block text-sm font-semibold"><TermDate check={check} lang={lang} /></span>
                    <Pill tone={pill.tone}>{pill.text}</Pill>
                  </button>; })}
              </div>
            </div>
            <TodoBox items={r.todo} lang={lang} limit={3} />
          </article>; })}
          {!!p.loadedAt && <p className="mt-4 text-[13px] text-[#4B5563]">{nt(lang, "shown")} {filtered.length} {nt(lang, "of")} {vehicles.length}. {ct(lang, "fetched")}: <DateText date={p.loadedAt} lang={lang} />. {ct(lang, "registerOnly")}</p>}
        </section>}
        <p className="border-t border-[#D9DCE0] pt-4 text-[13px] text-[#4B5563]">{tr(lang, "retained")}</p>
      </>}
    </div>
  </div>;
}

function VehicleCard({ p, detail }: { p: NewViewProps; detail: VehicleDetail | null }) {
  const { lang, admin, today } = p;
  const [historyType, setHistoryType] = useState(""), [historyAll, setHistoryAll] = useState(false);
  const back = <button type="button" className={`${BTN_LINE} self-start`} onClick={p.onBack}>{nt(lang, "back")}</button>;
  if (!detail) return <>{back}<p className="py-16 text-center text-[#4B5563]">{p.detailLoading ? tr(lang, "loading") : tr(lang, "choose")}</p></>;
  const v = detail.vehicle, d = v.data, row = buildRow(v, today, lang);
  const jump = (id: string) => () => { try { document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); } catch { /* brak przewijania nie blokuje pracy */ } };
  const events = detail.events.filter(e => !historyType || e.kind === historyType), shownEvents = historyAll ? events : events.slice(0, 8);
  const fields = ["category", "vin", "company", "project", "location", "year", "country", "fuel", "transmission", "firstRegistration", "engine", "power", "maxMass", "payload", "seats", "tyreSize", "insurer", "assistancePhone", ...(admin ? ["ownership", "purchaseDate", "purchasePrice", "purchaseCurrency", "leasingUntil", "policyNumber"] : [])];
  return <>
    {back}
    <section className="flex flex-col gap-6 md:flex-row">
      <PrivateImage id={d.coverFileId} alt={d.plate} className="h-52 w-full shrink-0 rounded-[18px] md:w-72" />
      <div className="flex min-w-0 flex-1 flex-col gap-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[44px] font-extrabold leading-none tracking-[0.01em] sm:text-[52px]">{d.plate}</h2>
          <Pill big tone={statusTone(v)}>{tr(lang, d.archived ? "archived" : d.status)}</Pill>
          {row.attention && <Pill big tone={row.rank === 0 ? "late" : "soon"}>{ct(lang, "attention")}</Pill>}
        </div>
        <p className="text-lg text-[#4B5563]">{d.make} {d.model}{d.name ? ` · ${d.name}` : ""}{d.year ? ` · ${d.year}` : ""}</p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-4">
          <Fact label={tr(lang, "driver")}>{d.driver || tr(lang, "noDriver")}</Fact>
          <Fact label={tr(lang, "project")}>{d.project}</Fact>
          <Fact label={tr(lang, "mileage")}>{num(d.mileage, lang)} km<span className="block text-[13px] font-normal text-[#4B5563]">{tr(lang, "mileageDate")}: <DateText date={d.mileageDate} lang={lang} /></span></Fact>
          <Fact label={ct(lang, "responsible")}>{d.compliance?.responsible || ct(lang, "unassigned")}</Fact>
        </dl>
        <TodoBox items={row.todo} lang={lang} />
      </div>
    </section>

    <section className="flex flex-col gap-3">
      {!d.archived && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <button type="button" className={BTN_MAIN} onClick={() => p.onModal({ type: "mileage" })}>{tr(lang, "addMileage")}</button>
        {admin && <button type="button" className={BTN_MAIN} onClick={() => p.onModal({ type: "service" })}>{tr(lang, "newService")}</button>}
        <button type="button" className={BTN_ALERT} onClick={() => p.onModal({ type: "defect" })}>{tr(lang, "defect")}</button>
        {admin && <button type="button" className={BTN_MAIN} onClick={() => p.onModal({ type: "assignment" })}>{tr(lang, "assign")}</button>}
        <button type="button" className={BTN_MAIN} onClick={() => p.onModal({ type: "document" })}>{nt(lang, "addDocument")}</button>
      </div>}
      {admin && <div className="flex flex-wrap gap-2">
        {!d.archived && <button type="button" className={BTN_LINE} onClick={() => p.onModal({ type: "update" })}>{tr(lang, "editVehicle")}</button>}
        <button type="button" className={BTN_LINE} onClick={() => { if (!printVehicle(detail, lang)) p.onError("POPUP_BLOCKED"); }}>{tr(lang, "print")}</button>
        <button type="button" className={BTN_LINE} onClick={() => downloadText(`ACC-BAU-${d.plate}-${localToday()}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), format: "acc-fleet-v1", includesFileContents: false, ...detail }, null, 2), "application/json")}>{tr(lang, "exportJson")}</button>
        <button type="button" className={BTN_LINE} onClick={() => p.onModal({ type: d.archived ? "restore" : "archive" })}>{tr(lang, d.archived ? "restore" : "archive")}</button>
      </div>}
      <nav className="flex flex-wrap gap-2 border-t border-[#D9DCE0] pt-3">
        {[["fl-terminy", tr(lang, "compliance")], ["fl-plan", tr(lang, "plans")], ["fl-historia", tr(lang, "history")], ["fl-dokumenty", tr(lang, "documents")], ["fl-dane", nt(lang, "data")]].map(([id, label]) =>
          <button type="button" key={id} onClick={jump(id)} className={`min-h-11 rounded-full bg-[#F1F2F4] px-4 py-2 text-sm font-semibold text-[#2B2B2B] hover:bg-[#E5E7EB] ${FOCUS}`}>{label}</button>)}
      </nav>
    </section>

    <section id="fl-terminy" className="flex scroll-mt-4 flex-col gap-3.5">
      <h3 className={H2}>{tr(lang, "compliance")}</h3>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {COMPLIANCE_KINDS.map(kind => {
          const check = complianceCheck(d, kind, today), pill = termPill(check, lang);
          const files = check.fileIds.map(id => detail.files.find(file => file.id === id)).filter((file): file is FleetFile => !!file);
          const image = files.find(file => file.mime.startsWith("image/"));
          return <article key={kind} className={`flex flex-col gap-2 rounded-[18px] border-[1.5px] p-5 ${check.severity === "overdue" ? "border-[#9B1C12]" : "border-[#D9DCE0]"}`}>
            <h4 className={LAB}>{ct(lang, kind)}</h4>
            <div className="text-2xl font-extrabold">{kind === "registration" && check.requirement !== "not_required" ? pill.text : <TermDate check={check} lang={lang} />}</div>
            {(kind !== "registration" || check.requirement === "not_required") && <div><Pill tone={pill.tone}>{pill.text}</Pill></div>}
            {check.issues.filter(i => !["deadline", "expired"].includes(i.code)).map((i, index) => <p key={index} className="text-[13px] font-semibold text-[#7A3E00]">{ct(lang, i.code)}</p>)}
            {image && <button type="button" aria-label={image.name} onClick={() => p.onFile(image)} className={`overflow-hidden rounded-xl border border-[#D9DCE0] ${FOCUS}`}><PrivateImage id={image.id} alt={image.name} className="h-32 w-full" fit="contain" /></button>}
            {kind === "insurance" && (d.insurer || (admin && d.policyNumber)) && <p className="text-[13px] text-[#4B5563]">{d.insurer}{admin && d.policyNumber ? ` · ${d.policyNumber}` : ""}</p>}
            {kind === "udt" && d.compliance?.udtNumber && <p className="text-[13px] text-[#4B5563]">{ct(lang, "udtNumber")}: {d.compliance.udtNumber}</p>}
            {check.requirement === "not_required" && check.record.reason && <p className="text-[13px] text-[#4B5563]">{ct(lang, "reason")}: {check.record.reason}</p>}
            {admin ? <FileTiles files={files} lang={lang} onView={p.onFile} /> : check.fileIds.length > 0 && <p className="text-[13px] text-[#4B5563]">{ct(lang, "documentAccess")}</p>}
            {admin && !files.length && check.requirement !== "not_required" && <p className="text-[13px] text-[#4B5563]">{ct(lang, "noFiles")}</p>}
            <div className="mt-auto pt-2">
              {check.record.updatedBy && <p className="mb-2 text-xs text-[#4B5563]">{ct(lang, "updatedBy")}: {check.record.updatedBy} · <DateText date={check.record.updatedAt} lang={lang} /></p>}
              {admin && !d.archived && <button type="button" className={BTN_LINE} onClick={() => p.onCompliance(kind)}>{ct(lang, "change")}</button>}
            </div>
          </article>;
        })}
      </div>
    </section>

    <section id="fl-plan" className="flex scroll-mt-4 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={H2}>{tr(lang, "plans")}</h3>
        {admin && !d.archived && <button type="button" className={BTN_LINE} onClick={() => p.onModal({ type: "plan_add" })}>+ {tr(lang, "addPlan")}</button>}
      </div>
      <p className="text-[13px] text-[#4B5563]">{tr(lang, "firstDue")}</p>
      {!d.plans.length && <p className="rounded-[10px] bg-[#FFF4E5] px-3.5 py-2.5 text-sm font-semibold text-[#7A3E00]">{tr(lang, "noPlans")}</p>}
      {d.plans.map(plan => { const a = planAlert(plan, d.mileage, today); return <div key={plan.id} className={`flex flex-col gap-2 border-b border-[#D9DCE0] py-3.5 ${plan.archived ? "opacity-60" : ""}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-bold">{plan.label}</div>
            <div className="text-sm text-[#4B5563]">{tr(lang, "dueDate")}: <b className="text-[#2B2B2B]"><DateText date={plan.dueDate} lang={lang} /></b> · {tr(lang, "dueMileage")}: <b className="text-[#2B2B2B]">{num(plan.dueMileage, lang)}</b></div>
            <div className="flex flex-wrap gap-x-4 text-[13px] text-[#4B5563]">
              {a.days != null && <span>{tr(lang, "remaining")}: {a.days} {tr(lang, "days")}</span>}
              {a.km != null && <span>{tr(lang, "remaining")}: {num(a.km, lang)} km</span>}
              {plan.lastDoneDate && <span>{tr(lang, "lastDone")}: <DateText date={plan.lastDoneDate} lang={lang} /></span>}
            </div>
            {plan.notes && <p className="mt-1 whitespace-pre-wrap text-[13px] text-[#4B5563]">{plan.notes}</p>}
          </div>
          <Pill tone={plan.archived ? "na" : toneOf(a.severity)}>{tr(lang, plan.archived ? "archived" : a.severity)}</Pill>
        </div>
        {admin && !plan.archived && !d.archived && <div className="flex flex-wrap gap-2">
          <button type="button" className={BTN_LINE} onClick={() => p.onModal({ type: "service", plan })}>{tr(lang, "newService")}</button>
          <button type="button" className={BTN_LINE} onClick={() => p.onModal({ type: "plan_update", plan })}>{tr(lang, "editPlan")}</button>
          <button type="button" className={BTN_LINE} onClick={() => p.onModal({ type: "plan_archive", plan })}>{tr(lang, "planArchive")}</button>
        </div>}
      </div>; })}
    </section>

    <section id="fl-historia" className="flex scroll-mt-4 flex-col gap-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h3 className={H2}>{tr(lang, "history")}</h3>
        <div className="w-full sm:w-64"><Select label={tr(lang, "kind")} value={historyType} onChange={setHistoryType} options={[{ value: "", label: tr(lang, "all") }, ...["service", "repair", "inspection", "mileage", "assignment", "defect", "mileage_correction"].map(value => ({ value, label: tr(lang, value) }))]} /></div>
      </div>
      {shownEvents.map(e => {
        const reading = effectiveEventMileage(e, detail.events), corrected = reading != null && reading !== e.data.mileage;
        const closed = detail.events.some(r => r.kind === "defect_closed" && r.data.resolvedId === e.id);
        return <article key={e.id} className="grid gap-x-5 gap-y-1 border-b border-[#D9DCE0] py-3.5 sm:grid-cols-[110px_minmax(0,1fr)]">
          <div className="text-sm font-bold"><DateText date={e.happened_on} lang={lang} /></div>
          <div className="min-w-0">
            <Pill tone={e.kind === "defect" && !closed ? "late" : "na"}>{tr(lang, e.kind)}{closed ? " ✓" : ""}</Pill>
            {e.data.title && <h4 className="mt-1.5 text-base font-bold">{e.data.title}</h4>}
            {e.data.from || e.data.to ? <p className="mt-1 text-sm font-bold text-[#9A4A0F]">{e.data.from || "—"} → {e.data.to || "—"}</p> : null}
            {e.data.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-[#4B5563]">{e.data.notes}</p>}
            {e.data.reason && <p className="mt-1 text-sm"><b>{tr(lang, "reason")}:</b> {e.data.reason}</p>}
            {e.kind === "mileage_correction" && <p className="mt-1 text-sm"><b>{tr(lang, "correctedMileage")}:</b> {num(e.data.correctedMileage, lang)} km</p>}
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#4B5563]">
              {e.data.mileage != null && <span>{tr(lang, "mileage")}: <b>{num(reading, lang)} km</b>{corrected && <span> ({tr(lang, "original")}: {num(e.data.mileage, lang)} km)</span>}</span>}
              {e.data.workshop && <span>{tr(lang, "workshop")}: {e.data.workshop}</span>}
              {admin && e.data.cost != null && <span><b>{num(e.data.cost, lang)} {e.data.currency} {tr(lang, e.data.costBasis || "gross")}</b></span>}
              {admin && e.data.invoiceNumber && <span>{tr(lang, "invoiceNumber")}: {e.data.invoiceNumber}</span>}
            </div>
            {e.data.complianceKind && <p className="mt-1 text-[13px] text-[#4B5563]"><b>{ct(lang, e.data.complianceKind)}</b> • {e.data.previousDueDate || "—"} → {e.data.dueDate || "—"}</p>}
            {e.data.plan && <p className="mt-1 text-[13px] text-[#4B5563]">{tr(lang, "dueDate")}: {e.data.previousPlan?.dueDate || "—"} → {e.data.plan.dueDate || "—"} • {tr(lang, "dueMileage")}: {num(e.data.previousPlan?.dueMileage, lang)} → {num(e.data.plan.dueMileage, lang)}</p>}
            {e.data.completedPlans?.length ? <p className="mt-1 text-[13px] text-[#4B5563]">{tr(lang, "completedPlans")}: {e.data.completedPlans.map(id => d.plans.find(plan => plan.id === id)?.label || id).join(", ")}</p> : null}
            {admin && e.data.changedFields && <details className="mt-2 text-[13px]"><summary className="cursor-pointer font-bold">{tr(lang, "updated")}</summary><div className="mt-1 space-y-1">{e.data.changedFields.map(k => <p key={k}><b>{tr(lang, k)}:</b> {String((e.data.before as Record<string, unknown>)?.[k] ?? "—")} → {String((e.data.after as Record<string, unknown>)?.[k] ?? "—")}</p>)}</div></details>}
            <div className="mt-2"><FileTiles files={detail.files.filter(f => f.event_id === e.id || e.data.documentIds?.includes(f.id) || detail.events.some(a => a.id === f.event_id && a.data.relatedEventId === e.id))} lang={lang} onView={p.onFile} /></div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-[#4B5563]">{tr(lang, "by")}: {e.created_by} • <DateText date={e.created_at} lang={lang} /></span>
              {admin && !d.archived && <div className="flex flex-wrap gap-2">
                {["service", "repair", "inspection", "assignment", "defect"].includes(e.kind) && <button type="button" className={BTN_LINE} onClick={() => p.onModal({ type: "document_attach", event: e })}>{tr(lang, "attachToRecord")}</button>}
                {e.data.mileage != null && e.kind !== "mileage_correction" && <button type="button" className={BTN_LINE} onClick={() => p.onModal({ type: "mileage_correction", event: e })}>{tr(lang, "correctMileage")}</button>}
                {e.kind === "defect" && !closed && <button type="button" className={BTN_LINE} onClick={() => p.onModal({ type: "defect_close", event: e })}>{tr(lang, "defectClose")}</button>}
              </div>}
            </div>
          </div>
        </article>;
      })}
      {events.length > 8 && <button type="button" className={`${BTN_LINE} mt-2 self-start`} onClick={() => setHistoryAll(!historyAll)}>{ct(lang, historyAll ? "showLess" : "showAll")} ({events.length})</button>}
    </section>

    <section id="fl-dokumenty" className="flex scroll-mt-4 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={H2}>{tr(lang, "documents")}</h3>
        {!d.archived && <button type="button" className={BTN_LINE} onClick={() => p.onModal({ type: "document" })}>+ {tr(lang, "newDocuments")}</button>}
      </div>
      <p className="text-[13px] text-[#4B5563]">{tr(lang, "fileHint")}</p>
      {!detail.files.length && <p className="py-6 text-center text-sm text-[#4B5563]">{tr(lang, "noFiles")}</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {detail.files.map(f => <div key={f.id} className="overflow-hidden rounded-[14px] border-[1.5px] border-[#D9DCE0]">
          {f.mime.startsWith("image/") && <button type="button" aria-label={f.name} onClick={() => p.onFile(f)} className="block w-full"><PrivateImage id={f.id} alt={f.name} className="h-36 w-full" /></button>}
          <div className="flex flex-col gap-1.5 p-3.5">
            <span className={LAB}>{tr(lang, f.category)}</span>
            <p className="break-words text-sm font-bold">{f.name}</p>
            <p className="text-xs text-[#4B5563]">{(f.size / 1024 / 1024).toFixed(2)} MB • <DateText date={f.created_at} lang={lang} /></p>
            {!f.event_id && <p className="text-xs font-semibold text-[#7A3E00]">{tr(lang, "unlinked")}</p>}
            <div className="mt-1 flex flex-wrap gap-2">
              <button type="button" className={BTN_LINE} onClick={() => p.onFile(f)}>{tr(lang, "preview")}</button>
              {admin && f.category === "photo" && !d.archived && d.coverFileId !== f.id && <button type="button" className={BTN_LINE} disabled={p.actionBusy} onClick={() => p.onQuick("cover", { id: f.id })}>{tr(lang, "cover")}</button>}
            </div>
          </div>
        </div>)}
      </div>
    </section>

    <section id="fl-dane" className="flex scroll-mt-4 flex-col gap-3.5">
      <h3 className={H2}>{nt(lang, "data")}</h3>
      <dl className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map(k => { const value = d[k as keyof typeof d] as string; return <Fact key={k} label={tr(lang, k)}>{k === "category" && value ? tr(lang, value) : value}</Fact>; })}
      </dl>
      {d.notes && <p className="whitespace-pre-wrap rounded-[10px] bg-[#F1F2F4] p-3.5 text-sm">{d.notes}</p>}
      {admin && <div className="border-t border-[#D9DCE0] pt-3.5">
        <h4 className="text-base font-bold">{tr(lang, "costSummary")}</h4>
        <div className="mt-2 flex flex-wrap gap-2">{Object.entries(costTotals(detail.events)).map(([key, total]) => <Pill key={key} tone="na">{total.toLocaleString(fleetLocale(lang), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {key.split(" ")[0]} {tr(lang, key.split(" ")[1])}</Pill>)}</div>
        <p className="mt-2 text-[13px] text-[#4B5563]">{tr(lang, "costHint")}</p>
      </div>}
    </section>
    {back}
  </>;
}
