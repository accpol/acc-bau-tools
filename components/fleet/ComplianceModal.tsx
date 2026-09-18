"use client";
import React, { useRef, useState } from "react";
import { api } from "@/lib/fleet/client";
import { complianceCheck, compliancePlans } from "@/lib/fleet/compliance";
import { ct } from "@/lib/fleet/compliance-i18n";
import { tr } from "@/lib/fleet/i18n";
import type { ComplianceKind, FleetCommand, VehicleDetail } from "@/lib/fleet/types";
import { Btn, Check, Dialog, ErrorBanner, FormFooter, Input, Pick, Textarea, Uploader, errorCode } from "./common";

export default function ComplianceModal({ kind, detail, lang, people, onClose, onSaved, onRefresh }: {
  kind: ComplianceKind; detail: VehicleDetail; lang: string; people: string[];
  onClose: () => void; onSaved: (detail: VehicleDetail) => void; onRefresh: () => Promise<void>;
}) {
  const data = detail.vehicle.data;
  const initialCheck = useRef(complianceCheck(data, kind));
  const previous = initialCheck.current.record;
  const newPlanId = useRef(crypto.randomUUID());
  const plans = compliancePlans(data, kind);
  const [planId, setPlanId] = useState(() => plans.find(plan => plan.id === previous.planId)?.id || plans[0]?.id || newPlanId.current);
  const [requirement, setRequirement] = useState(initialCheck.current.requirement === "not_required" ? "not_required" : "required");
  const [dueDate, setDueDate] = useState(() => plans.find(plan => plan.id === planId)?.dueDate || "");
  const [responsible, setResponsible] = useState(data.compliance?.responsible || "");
  const [insurer, setInsurer] = useState(data.insurer), [policyNumber, setPolicyNumber] = useState(data.policyNumber);
  const [udtNumber, setUdtNumber] = useState(data.compliance?.udtNumber || ""), [reason, setReason] = useState(previous.reason || ""), [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<string[]>(() => (previous.fileIds || []).filter(id => detail.files.some(file => file.id === id && file.category === "document")));
  const [newIds, setNewIds] = useState<string[]>([]), [uploading, setUploading] = useState(false), [incomplete, setIncomplete] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [confirmReuse, setConfirmReuse] = useState(false);
  const command = useRef<FleetCommand | null>(null), saveLock = useRef(false);
  const docIds = Array.from(new Set([...selected, ...newIds]));
  const reuseNeeded = kind !== "registration" && dueDate !== previous.documentDueDate && selected.some(id => (previous.fileIds || []).includes(id));
  function changed() { command.current = null; }
  function changeDate(value: string) {
    changed(); setDueDate(value); setConfirmReuse(false);
    // Old scan is retained in History/Documents, but not automatically applied to a renewal.
    if (kind !== "registration" && value !== previous.documentDueDate) setSelected(ids => ids.filter(id => !(previous.fileIds || []).includes(id)));
  }
  function close() { if (!busy && !uploading && window.confirm(tr(lang, "dirtyClose"))) onClose(); }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saveLock.current || uploading || incomplete) return;
    saveLock.current = true; setBusy(true); setError("");
    try {
      if (!command.current) {
        const unlinkedSelected = selected.filter(id => detail.files.some(file => file.id === id && !file.event_id));
        const fileIds = Array.from(new Set([...newIds, ...unlinkedSelected]));
        command.current = { commandId: crypto.randomUUID(), vehicleId: detail.vehicle.id,
          expectedVersion: detail.vehicle.version, type: "compliance_save", fileIds,
          payload: { kind, requirement, planId, dueDate, responsible, insurer, policyNumber,
            udtNumber, reason, notes, documentIds: docIds, confirmReuse } };
      }
      const result = await api<VehicleDetail>("commands", command.current); onSaved(result);
    } catch (e) { setError(errorCode(e)); } finally { saveLock.current = false; setBusy(false); }
  }
  return <Dialog title={`${ct(lang, kind)} · ${data.plate}`} onClose={close} busy={busy || uploading} wide>
    <form onSubmit={save}><fieldset disabled={busy} className="space-y-5 p-4 sm:p-6">
      <ErrorBanner lang={lang} error={error} />
      {error === "CONFLICT" && <Btn onClick={async () => { try { await onRefresh(); command.current = null; setError(""); } catch (e) { setError(errorCode(e)); } }}>{tr(lang, "reloadDraft")}</Btn>}
      <p className="rounded-xl bg-orange-50 p-3 text-sm text-orange-900">{ct(lang, "keepHistory")}</p>
      <Pick label={ct(lang, "applicability")} value={requirement} onChange={e => { changed(); setRequirement(e.target.value); }} options={[{ value: "required", label: ct(lang, "required") }, { value: "not_required", label: ct(lang, "not_required") }]} />
      {kind === "udt" && <p className="text-xs text-zinc-500">{ct(lang, "chooseRequired")}</p>}
      {requirement === "not_required" && plans.length > 0 && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{tr(lang, "error_COMPLIANCE_ACTIVE_PLAN")}</p>}
      {requirement === "required" && kind !== "registration" && <>
        {plans.length > 1 && <><p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{ct(lang, "duplicateHint")}</p><Pick label={ct(lang, "schedule")} value={planId} onChange={e => { setPlanId(e.target.value); changeDate(plans.find(plan => plan.id === e.target.value)?.dueDate || ""); }} options={plans.map(plan => ({ value: plan.id, label: `${plan.label} · ${plan.dueDate || ct(lang, "dateMissing")}` }))} /></>}
        <Input label={ct(lang, kind === "insurance" ? "expiry" : "nextInspection")} type="date" value={dueDate} required min="1900-01-01" max="2200-12-31" onChange={e => changeDate(e.target.value)} />
        <p className="text-xs text-zinc-500">{ct(lang, "attentionHint")}</p>
      </>}
      <div className="grid gap-4 sm:grid-cols-2">
        {kind === "insurance" && <><Input label={ct(lang, "insurer")} value={insurer} maxLength={200} onChange={e => { changed(); setInsurer(e.target.value); }} /><Input label={ct(lang, "policyNumber")} value={policyNumber} maxLength={200} onChange={e => { changed(); setPolicyNumber(e.target.value); }} /></>}
        {kind === "udt" && <Input label={ct(lang, "udtNumber")} value={udtNumber} maxLength={160} onChange={e => { changed(); setUdtNumber(e.target.value); }} />}
        <Input label={ct(lang, "responsible")} value={responsible} list="fleet-compliance-people" maxLength={160} onChange={e => { changed(); setResponsible(e.target.value); }} />
      </div>
      <datalist id="fleet-compliance-people">{Array.from(new Set(people)).map(person => <option key={person} value={person} />)}</datalist>
      <p className="text-xs text-zinc-500">{ct(lang, "responsibleHint")}</p>
      {requirement === "not_required" && <Textarea label={ct(lang, "reason")} value={reason} required maxLength={2000} onChange={e => { changed(); setReason(e.target.value); }} />}
      {requirement === "required" && <>
        <p className="text-sm text-zinc-600">{ct(lang, kind === "registration" ? "regHint" : "renewalHint")}</p>
        <Uploader vehicleId={detail.vehicle.id} lang={lang} admin fileIds={newIds} onIds={ids => { changed(); setNewIds(ids); }} existing={[]} onBusy={setUploading} onIncomplete={setIncomplete} defaultCategory="document" lockedCategory="document" />
        {incomplete && !uploading && <p role="alert" className="text-sm font-semibold text-red-800">{ct(lang, "failedUpload")}</p>}
        <details open={selected.length > 0}><summary className="cursor-pointer text-sm font-bold">{ct(lang, "chooseExisting")} ({selected.length})</summary><p className="my-2 text-xs text-zinc-500">{ct(lang, "existingHint")}</p><div className="max-h-64 space-y-2 overflow-auto rounded-xl border p-3">{detail.files.filter(file => file.category === "document").map(file => <Check key={file.id} label={file.name} checked={selected.includes(file.id)} disabled={newIds.includes(file.id)} onChange={e => { changed(); setConfirmReuse(false); setSelected(ids => e.target.checked ? [...ids, file.id] : ids.filter(id => id !== file.id)); }} />)}</div></details>
        {reuseNeeded && <Check label={ct(lang, "confirmReuse")} required checked={confirmReuse} onChange={e => { changed(); setConfirmReuse(e.target.checked); }} />}
      </>}
      <details><summary className="cursor-pointer text-sm font-bold text-zinc-600">{ct(lang, "optionalNotes")}</summary><div className="mt-3 space-y-3">
        {requirement !== "not_required" && <Textarea label={ct(lang, "reason")} value={reason} maxLength={2000} onChange={e => { changed(); setReason(e.target.value); }} />}
        <Textarea label={tr(lang, "notes")} value={notes} maxLength={3000} onChange={e => { changed(); setNotes(e.target.value); }} />
      </div></details>
    </fieldset><FormFooter lang={lang} busy={busy || uploading || incomplete || (requirement === "not_required" && plans.length > 0)} onClose={close} /></form>
  </Dialog>;
}
