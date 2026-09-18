import { dayDifference, localToday } from "./domain";
import type { ComplianceKind, ComplianceRecord, ServicePlan, Vehicle, VehicleData } from "./types";

export const COMPLIANCE_KINDS: ComplianceKind[] = ["registration", "insurance", "inspection", "udt"];
export const COMPLIANCE_WARNING_DAYS = 30;
export type ComplianceSeverity = "overdue" | "soon" | "missing" | "ok" | "na";
export interface ComplianceIssue {
  kind: ComplianceKind;
  code: "expired" | "deadline" | "dateMissing" | "documentMissing" | "documentOutdated" | "requirementUnknown" | "multiplePlans";
  severity: "overdue" | "soon" | "missing";
  dueDate?: string | null;
  days?: number | null;
  planId?: string;
}
export interface ComplianceCheck {
  kind: ComplianceKind;
  requirement: "required" | "not_required" | "unconfirmed";
  severity: ComplianceSeverity;
  dueDate: string | null;
  days: number | null;
  issues: ComplianceIssue[];
  plan: ServicePlan | null;
  plans: ServicePlan[];
  fileIds: string[];
  documentsCurrent: boolean;
  record: ComplianceRecord;
}
export const complianceSeverityRank: Record<ComplianceSeverity, number> = { overdue: 0, soon: 1, missing: 2, ok: 3, na: 4 };
const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Recognize old UDT plans saved as "other"; do not move or delete them. */
export function compliancePlans(data: VehicleData, kind: ComplianceKind): ServicePlan[] {
  if (kind === "registration") return [];
  return (data.plans || []).filter(p => !p.archived &&
    (p.kind === kind || (kind === "udt" && p.kind === "other" && /\budt\b/i.test(p.label))));
}
export function complianceRequirement(data: VehicleData, kind: ComplianceKind): ComplianceCheck["requirement"] {
  const explicit = data.compliance?.[kind]?.requirement;
  // An active plan must never disappear just because someone set "not applicable".
  if (compliancePlans(data, kind).length) return "required";
  if (explicit === "required" || explicit === "not_required") return explicit;
  if (kind !== "udt") return "required";
  const description = normalized([data.category, data.make, data.model, data.name].join(" "));
  if (["crane", "telehandler"].includes(data.category) || /manitou|manitue|dzwig|zuraw|telehandler|teleskopow/.test(description)) return "required";
  if (["machine", "other"].includes(data.category)) return "unconfirmed";
  return "not_required";
}
function validDate(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T12:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
export function complianceCheck(data: VehicleData, kind: ComplianceKind, today = localToday()): ComplianceCheck {
  const record = data.compliance?.[kind] || {};
  const plans = compliancePlans(data, kind).slice().sort((a, b) => {
    if (!validDate(a.dueDate)) return validDate(b.dueDate) ? -1 : a.id.localeCompare(b.id);
    if (!validDate(b.dueDate)) return 1;
    return a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id);
  });
  const requirement = complianceRequirement(data, kind);
  // Missing dates take priority in the table, while overdue dates stay in the issue list.
  const plan = plans[0] || null;
  const dueDate = validDate(plan?.dueDate) ? plan.dueDate : null;
  const days = dueDate ? dayDifference(dueDate, today) : null;
  const fileIds = Array.from(new Set(record.fileIds || []));
  const documentsCurrent = fileIds.length > 0 && (kind === "registration" ||
    !!plan && record.planId === plan.id && !!dueDate && record.documentDueDate === dueDate);
  const issues: ComplianceIssue[] = [];
  if (requirement === "unconfirmed") issues.push({ kind, code: "requirementUnknown", severity: "missing" });
  if (requirement === "required") {
    if (kind !== "registration") {
      if (!plans.length) issues.push({ kind, code: "dateMissing", severity: "missing" });
      for (const p of plans) {
        if (!validDate(p.dueDate)) issues.push({ kind, code: "dateMissing", severity: "missing", planId: p.id });
        else {
          const remaining = dayDifference(p.dueDate, today);
          if (remaining < 0) issues.push({ kind, code: "expired", severity: "overdue", dueDate: p.dueDate, days: remaining, planId: p.id });
          else if (remaining <= Math.max(COMPLIANCE_WARNING_DAYS, p.warnDays || 0)) issues.push({ kind, code: "deadline", severity: "soon", dueDate: p.dueDate, days: remaining, planId: p.id });
        }
      }
      if (plans.length > 1) issues.push({ kind, code: "multiplePlans", severity: "missing" });
    }
    // Inspection report optional. Registration, policy and UDT decision are explicitly tracked.
    if (kind !== "inspection" && !documentsCurrent) issues.push({ kind,
      code: fileIds.length ? "documentOutdated" : "documentMissing", severity: "missing" });
  }
  const severity = requirement === "not_required" ? "na" : issues.length
    ? issues.reduce<ComplianceSeverity>((worst, issue) => complianceSeverityRank[issue.severity] < complianceSeverityRank[worst] ? issue.severity : worst, "ok") : "ok";
  return { kind, requirement, severity, dueDate, days, issues, plan, plans, fileIds, documentsCurrent, record };
}
export function vehicleCompliance(vehicle: Vehicle, today = localToday()) {
  const checks = COMPLIANCE_KINDS.map(kind => complianceCheck(vehicle.data, kind, today));
  const issues = vehicle.data.archived ? [] : checks.flatMap(check => check.issues);
  const severity = issues.reduce<ComplianceSeverity>((worst, issue) => complianceSeverityRank[issue.severity] < complianceSeverityRank[worst] ? issue.severity : worst, "ok");
  return { vehicle, checks, issues, severity };
}
export function fleetCompliance(vehicles: Vehicle[], today = localToday()) {
  return vehicles.filter(v => !v.data.archived).map(v => vehicleCompliance(v, today))
    .sort((a, b) => complianceSeverityRank[a.severity] - complianceSeverityRank[b.severity] || a.vehicle.data.plate.localeCompare(b.vehicle.data.plate));
}
