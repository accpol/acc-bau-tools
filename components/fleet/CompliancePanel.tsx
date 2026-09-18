"use client";
import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileText, ShieldCheck } from "lucide-react";
import { csvCell } from "@/lib/fleet/domain";
import { downloadText } from "@/lib/fleet/client";
import { COMPLIANCE_KINDS, complianceCheck, fleetCompliance, type ComplianceCheck, type ComplianceIssue, type ComplianceSeverity } from "@/lib/fleet/compliance";
import { ct } from "@/lib/fleet/compliance-i18n";
import { tr } from "@/lib/fleet/i18n";
import type { ComplianceKind, FleetFile, Vehicle, VehicleDetail } from "@/lib/fleet/types";
import { Badge, Btn, DateText, FileTiles, Input, Panel, Pick, PrivateImage, num } from "./common";

export const complianceTone = (severity: ComplianceSeverity): "red" | "amber" | "green" | "neutral" =>
  severity === "overdue" ? "red" : severity === "ok" ? "green" : severity === "na" ? "neutral" : "amber";
function Deadline({ check, lang }: { check: ComplianceCheck; lang: string }) {
  if (check.requirement === "not_required") return <Badge>{ct(lang, "na")}</Badge>;
  return <div className="space-y-1">
    {check.kind !== "registration" && <p className="whitespace-nowrap font-bold">{check.dueDate ? <DateText date={check.dueDate} lang={lang} /> : ct(lang, check.requirement === "unconfirmed" ? "unknown" : "dateMissing")}</p>}
    <Badge tone={complianceTone(check.severity)}>{ct(lang, check.severity)}</Badge>
    {check.days !== null && <p className={`text-xs ${check.days < 0 ? "font-bold text-red-700" : "text-zinc-500"}`}>
      {check.days === 0 ? ct(lang, "today") : `${ct(lang, check.days < 0 ? "daysOverdue" : "daysLeft")}: ${Math.abs(check.days)}`}
    </p>}
    {check.issues.filter(i => !["deadline", "expired", "requirementUnknown"].includes(i.code)).map((i, index) => <p key={index} className="text-xs text-amber-800">{ct(lang, i.code)}</p>)}
  </div>;
}
function IssueText({ issue, lang }: { issue: ComplianceIssue; lang: string }) {
  return <><b>{ct(lang, issue.kind)}:</b> {ct(lang, issue.code)}{issue.dueDate && <> — <DateText date={issue.dueDate} lang={lang} />{issue.days === 0 ? ` (${ct(lang, "today")})` : ` (${ct(lang, (issue.days || 0) < 0 ? "daysOverdue" : "daysLeft")}: ${Math.abs(issue.days || 0)})`}</>}</>;
}
export function ComplianceAttention({ vehicles, today, lang, loadedAt, error, onOpen }: {
  vehicles: Vehicle[]; today: string; lang: string; loadedAt: string; error: boolean;
  onOpen: (id: string, kind: ComplianceKind) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const summaries = useMemo(() => fleetCompliance(vehicles, today), [vehicles, today]);
  const attention = summaries.filter(summary => summary.issues.length);
  const totalIssues = attention.reduce((sum, item) => sum + item.issues.length, 0);
  return <Panel className={error || attention.length ? "border-amber-300 bg-amber-50/30" : "border-zinc-200"}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3"><span className={`mt-1 rounded-xl p-2 ${attention.length || error ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-600"}`}><AlertTriangle className="h-5 w-5" /></span><div>
        <h3 className="text-xl font-black">{ct(lang, "attention")}{loadedAt && attention.length > 0 && <span className="ml-2 text-base text-amber-800">{tr(lang, "vehicles")}: {attention.length} · {ct(lang, "issuesCount")}: {totalIssues}</span>}</h3>
        <p className="mt-1 max-w-4xl text-sm leading-relaxed text-zinc-600">{ct(lang, "attentionHint")}</p>
      </div></div>
      {loadedAt && <p className="text-xs text-zinc-500">{ct(lang, "fetched")}: <DateText date={loadedAt} lang={lang} /></p>}
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{ct(lang, "staleData")}</p>}
    {!loadedAt ? <p className="mt-4 text-sm text-zinc-500">{ct(lang, "notLoaded")}</p> : <>
      {!attention.length && !error && <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-5 w-5" />{summaries.length ? ct(lang, "allRecorded") : tr(lang, "firstVehicle")}</p>}
      <div className="mt-4 space-y-2">{(expanded ? attention : attention.slice(0, 3)).map(item => <article key={item.vehicle.id} className={`rounded-2xl border bg-white p-3 ${item.severity === "overdue" ? "border-red-300" : "border-amber-200"}`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><button onClick={() => onOpen(item.vehicle.id, item.issues[0].kind)} className="font-black text-orange-800 underline-offset-2 hover:underline">{item.vehicle.data.plate} · {item.vehicle.data.make} {item.vehicle.data.model}</button>
          <span className="text-xs text-zinc-600">{ct(lang, "responsible")}: <b>{item.vehicle.data.compliance?.responsible || ct(lang, "unassigned")}</b></span></div>
        <div className="flex flex-wrap gap-2">{item.issues.map((issue, index) => <button key={index} onClick={() => onOpen(item.vehicle.id, issue.kind)} className={`rounded-lg px-2 py-1.5 text-left text-xs ${issue.severity === "overdue" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"}`}><IssueText issue={issue} lang={lang} /></button>)}</div>
      </article>)}</div>
      {attention.length > 3 && <Btn className="mt-3" onClick={() => setExpanded(value => !value)}>{ct(lang, expanded ? "showLess" : "showAll")} ({attention.length})</Btn>}
    </>}
  </Panel>;
}

export function ComplianceTable({ vehicles, today, lang, admin, onOpen, onEdit }: {
  vehicles: Vehicle[]; today: string; lang: string; admin: boolean;
  onOpen: (id: string) => void; onEdit: (id: string, kind: ComplianceKind) => void;
}) {
  const [query, setQuery] = useState(""), [onlyAttention, setOnlyAttention] = useState(false), [responsible, setResponsible] = useState("");
  const summaries = useMemo(() => fleetCompliance(vehicles, today), [vehicles, today]);
  const shown = summaries.filter(item => {
    const data = item.vehicle.data;
    const matches = [data.plate, data.make, data.model, data.name, data.driver, data.project, data.compliance?.responsible].join(" ").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
    return matches && (!onlyAttention || item.issues.length > 0) && (!responsible || data.compliance?.responsible === responsible);
  });
  function exportControl() {
    const headings = [tr(lang, "plate"), tr(lang, "make"), tr(lang, "model"), tr(lang, "driver"), ct(lang, "responsible"), tr(lang, "mileage"), ct(lang, "insurance"), ct(lang, "inspection"), ct(lang, "udt"), ct(lang, "attention")];
    const rows = shown.map(item => {
      const d = item.vehicle.data;
      return [d.plate, d.make, d.model, d.driver, d.compliance?.responsible || "", d.mileage,
        ...(["insurance", "inspection", "udt"] as const).map(kind => { const c = item.checks.find(x => x.kind === kind)!; return c.requirement === "not_required" ? ct(lang, "na") : c.dueDate || ct(lang, "dateMissing"); }),
        item.issues.map(i => `${ct(lang, i.kind)}: ${ct(lang, i.code)}${i.dueDate ? " " + i.dueDate : ""}`).join(" | ")];
    });
    downloadText(`ACC-BAU-kontrola-floty-${today}.csv`, "\uFEFF" + [headings, ...rows].map(row => row.map(csvCell).join(";")).join("\r\n"), "text/csv;charset=utf-8");
  }
  return <Panel>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-black">{ct(lang, "control")}</h3><p className="mt-1 max-w-4xl text-sm text-zinc-500">{ct(lang, "controlHint")}</p></div>{admin && <Btn onClick={exportControl}><Download className="h-4 w-4" />{tr(lang, "exportCsv")}</Btn>}</div>
    <div className="mt-4 grid items-end gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(200px,0.5fr)_auto]">
      <Input label={tr(lang, "search")} placeholder={ct(lang, "search")} value={query} onChange={e => setQuery(e.target.value)} />
      <Pick label={ct(lang, "responsible")} value={responsible} onChange={e => setResponsible(e.target.value)} options={[{ value: "", label: ct(lang, "allPeople") }, ...Array.from(new Set(summaries.map(item => item.vehicle.data.compliance?.responsible).filter((name): name is string => !!name))).sort().map(value => ({ value, label: value }))]} />
      <Btn tone={onlyAttention ? "primary" : "light"} onClick={() => setOnlyAttention(value => !value)}>{ct(lang, onlyAttention ? "allVehicles" : "onlyAttention")}</Btn>
    </div>
    <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm">
      <caption className="sr-only">{ct(lang, "control")}</caption><thead className="border-b-2 border-zinc-200 bg-zinc-50 text-xs text-zinc-600"><tr>{["vehicles", "driver", "responsible", "insurance", "inspection", "udt", "registration"].map(key => <th key={key} scope="col" className="p-3 align-top">{["vehicles", "driver"].includes(key) ? tr(lang, key) : ct(lang, key)}</th>)}</tr></thead>
      <tbody>{shown.map(item => { const d = item.vehicle.data; return <tr key={item.vehicle.id} className={`border-b border-zinc-200 align-top ${item.severity === "overdue" ? "bg-red-50/40" : item.issues.length ? "bg-amber-50/20" : "bg-white"}`}>
        <td className="p-3"><button onClick={() => onOpen(item.vehicle.id)} className="text-lg font-black text-orange-800 hover:underline">{d.plate}</button><p>{d.make} {d.model}</p>{d.name && <p className="text-xs text-zinc-500">{d.name}</p>}<p className="mt-1 text-xs text-zinc-500">{num(d.mileage, lang)} km</p><div className="mt-2"><Badge tone={complianceTone(item.severity)}>{ct(lang, item.issues.length ? "attention" : "ok")}</Badge></div></td>
        <td className="p-3"><p className="font-semibold">{d.driver || tr(lang, "noDriver")}</p><p className="mt-1 text-xs text-zinc-500">{d.project}</p></td>
        <td className="p-3"><p className="font-semibold">{d.compliance?.responsible || ct(lang, "unassigned")}</p></td>
        {(["insurance", "inspection", "udt", "registration"] as const).map(kind => { const c = item.checks.find(check => check.kind === kind)!; return <td key={kind} className="min-w-40 p-3"><Deadline check={c} lang={lang} />{c.record.updatedBy && <p className="mt-2 text-[11px] text-zinc-500">{ct(lang, "updatedBy")}: {c.record.updatedBy}</p>}<button className="mt-2 block text-xs font-bold text-orange-800 hover:underline" onClick={() => admin ? onEdit(item.vehicle.id, kind) : onOpen(item.vehicle.id)}>{admin ? ct(lang, "change") : ct(lang, "openVehicle")}</button></td>; })}
      </tr>; })}</tbody>
    </table></div>
    {!shown.length && <p className="py-8 text-center text-sm text-zinc-500">{ct(lang, "allClearFiltered")}</p>}
    <p className="mt-3 text-xs text-zinc-500">{ct(lang, "registerOnly")}</p>
  </Panel>;
}

export function VehicleComplianceCards({ detail, today, lang, admin, onEdit, onView }: {
  detail: VehicleDetail; today: string; lang: string; admin: boolean;
  onEdit: (kind: ComplianceKind) => void; onView: (file: FleetFile) => void;
}) {
  const data = detail.vehicle.data;
  return <Panel><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h4 className="flex items-center gap-2 text-lg font-black"><ShieldCheck className="h-5 w-5 text-orange-600" />{tr(lang, "compliance")}</h4><p className="text-xs text-zinc-500">{ct(lang, "responsible")}: <b>{data.compliance?.responsible || ct(lang, "unassigned")}</b></p></div>
    <div className="grid gap-4 lg:grid-cols-2">{COMPLIANCE_KINDS.map(kind => {
      const check = complianceCheck(data, kind, today);
      const files = check.fileIds.map(id => detail.files.find(file => file.id === id)).filter((file): file is FleetFile => !!file);
      const image = files.find(file => file.mime.startsWith("image/"));
      return <article key={kind} className={`flex flex-col rounded-2xl border p-4 ${check.severity === "overdue" ? "border-red-200 bg-red-50/30" : "border-zinc-200 bg-zinc-50/40"}`}>
        <div className="mb-3 flex items-start justify-between gap-2"><h5 className="font-black">{ct(lang, kind)}</h5><FileText className="h-5 w-5 shrink-0 text-zinc-400" /></div>
        {image && <button type="button" aria-label={image.name} onClick={() => onView(image)} className="mb-3 overflow-hidden rounded-xl border bg-white"><PrivateImage id={image.id} alt={image.name} className="h-36 w-full" fit="contain" /></button>}
        <Deadline check={check} lang={lang} />
        <p className="my-3 text-xs leading-relaxed text-zinc-500">{ct(lang, kind === "registration" ? "regHint" : kind === "insurance" ? "policyHint" : kind === "udt" ? "udtHint" : "inspectionHint")}</p>
        {kind === "insurance" && <p className="mb-2 text-xs text-zinc-600">{data.insurer}{admin && data.policyNumber ? ` · ${data.policyNumber}` : ""}</p>}
        {kind === "udt" && data.compliance?.udtNumber && <p className="mb-2 text-xs text-zinc-600">{ct(lang, "udtNumber")}: {data.compliance.udtNumber}</p>}
        {check.requirement === "not_required" && check.record.reason && <p className="mb-2 text-xs text-zinc-600">{ct(lang, "reason")}: {check.record.reason}</p>}
        {admin ? <FileTiles files={files} lang={lang} onView={onView} /> : check.fileIds.length > 0 && <p className="text-xs text-zinc-500">{ct(lang, "documentAccess")}</p>}
        {admin && !files.length && check.requirement !== "not_required" && <p className="text-xs text-zinc-500">{ct(lang, "noFiles")}</p>}
        <div className="mt-auto pt-3">{check.record.updatedBy && <p className="mb-2 text-[11px] text-zinc-500">{ct(lang, "updatedBy")}: {check.record.updatedBy} · <DateText date={check.record.updatedAt} lang={lang} /></p>}{admin && !data.archived && <Btn onClick={() => onEdit(kind)}>{ct(lang, "change")}</Btn>}</div>
      </article>;
    })}</div>
  </Panel>;
}
