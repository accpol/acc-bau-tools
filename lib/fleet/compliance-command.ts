import { assert, dateOrNull, localToday, text, uuid } from "./domain";
import { COMPLIANCE_KINDS, compliancePlans } from "./compliance";
import type { ComplianceKind, ComplianceRecord, FleetCommand, FleetFile, FleetMember, PreparedCommand, ServicePlan, Vehicle } from "./types";

const LABELS: Record<ComplianceKind, string> = { registration: "Dowód rejestracyjny", insurance: "Ubezpieczenie", inspection: "Przegląd techniczny", udt: "Badanie / decyzja UDT" };

/** Pure command preparation. Database transaction and optimistic versioning remain unchanged. */
export function prepareComplianceCommand(cmd: FleetCommand, current: Vehicle | null, member: FleetMember): PreparedCommand {
  uuid(cmd.commandId); uuid(cmd.vehicleId);
  assert(member.role === "admin", "FORBIDDEN", "FORBIDDEN", 403);
  assert(current && current.id === cmd.vehicleId, "NOT_FOUND", "NOT_FOUND", 404);
  assert(Number.isInteger(cmd.expectedVersion) && current.version === cmd.expectedVersion, "CONFLICT", "CONFLICT", 409);
  assert(!current.data.archived, "ARCHIVED");
  assert(cmd.type === "compliance_save" && cmd.payload && typeof cmd.payload === "object" && !Array.isArray(cmd.payload), "INVALID_PAYLOAD");
  const p = cmd.payload, kind = p.kind as ComplianceKind;
  assert(COMPLIANCE_KINDS.includes(kind), "INVALID_COMPLIANCE");
  assert(p.requirement === "required" || p.requirement === "not_required", "INVALID_COMPLIANCE");
  assert(Array.isArray(p.documentIds) && p.documentIds.length <= 20, "INVALID_FILES");
  const documentIds = p.documentIds.map(uuid);
  assert(new Set(documentIds).size === documentIds.length, "INVALID_FILES");
  assert((cmd.fileIds || []).every(id => documentIds.includes(id)), "INVALID_FILES");
  const reason = text(p.reason, 2000, p.requirement === "not_required");
  const data = structuredClone(current.data);
  const compliance = { ...data.compliance };
  const previousRecord = compliance[kind] || {};
  const activePlans = compliancePlans(data, kind);
  let plan: ServicePlan | undefined;
  let previousDueDate: string | null = null;
  const dueDate = kind !== "registration" && p.requirement === "required" ? dateOrNull(p.dueDate) : null;
  if (p.requirement === "not_required") {
    // Nothing archived automatically. An exemption cannot hide a live schedule.
    assert(activePlans.length === 0, "COMPLIANCE_ACTIVE_PLAN");
  } else if (kind !== "registration") {
    assert(dueDate, "COMPLIANCE_DATE_REQUIRED");
    const planId = uuid(p.planId);
    plan = data.plans.find(item => item.id === planId);
    if (plan) {
      assert(!plan.archived && activePlans.some(item => item.id === planId), "INVALID_PLAN");
      previousDueDate = plan.dueDate;
      // Keep interval, history, notes, additional fields and every other schedule intact.
      plan.dueDate = dueDate; plan.warnDays = Math.max(30, plan.warnDays || 0);
    } else {
      assert(activePlans.length === 0, "COMPLIANCE_SELECT_PLAN");
      plan = { id: planId, kind, label: LABELS[kind], dueDate, dueMileage: null, intervalMonths: null,
        intervalKm: null, warnDays: 30, warnKm: 1500, lastDoneDate: null, lastDoneMileage: null, notes: "", archived: false };
      data.plans.push(plan);
    }
    // Do not quietly certify that an OLD scan covers a NEW validity period.
    const reusedPrevious = documentIds.some(id => (previousRecord.fileIds || []).includes(id));
    if (reusedPrevious && previousRecord.documentDueDate !== dueDate) assert(p.confirmReuse === true, "COMPLIANCE_CONFIRM_DOCUMENT");
  }
  const record: ComplianceRecord = { ...previousRecord, requirement: p.requirement, reason, fileIds: documentIds,
    planId: plan?.id || previousRecord.planId, documentDueDate: dueDate,
    updatedBy: member.name, updatedAt: new Date().toISOString() };
  compliance[kind] = record;
  if ("responsible" in p) compliance.responsible = text(p.responsible, 160);
  if (kind === "udt" && "udtNumber" in p) compliance.udtNumber = text(p.udtNumber, 160);
  if (kind === "insurance") {
    if ("insurer" in p) data.insurer = text(p.insurer, 200);
    if ("policyNumber" in p) data.policyNumber = text(p.policyNumber, 200);
  }
  data.compliance = compliance;
  return { data, event: { kind: "document", happened_on: localToday(), data: {
    title: `${LABELS[kind]}${dueDate ? " • " + dueDate : p.requirement === "not_required" ? " • Nie dotyczy" : ""}`,
    notes: text(p.notes, 3000), reason, complianceKind: kind, documentIds,
    previousDueDate, dueDate, plan, changedFields: ["compliance", ...(kind === "insurance" ? ["insurer", "policyNumber"] : [])],
    before: { compliance: current.data.compliance, insurer: current.data.insurer, policyNumber: current.data.policyNumber },
    after: { compliance, insurer: data.insurer, policyNumber: data.policyNumber },
  } } };
}

/** Full selected document set may include existing linked files; only new files get re-linked. */
export function validateComplianceFiles(cmd: FleetCommand, files: Pick<FleetFile, "id" | "vehicle_id" | "state" | "category">[]): void {
  assert(Array.isArray(cmd.payload.documentIds), "INVALID_FILES");
  const ids = cmd.payload.documentIds.map(uuid);
  assert(ids.length <= 20 && new Set(ids).size === ids.length && files.length === ids.length, "INVALID_FILES");
  assert(files.every(file => ids.includes(file.id) && file.vehicle_id === cmd.vehicleId && file.state === "ready" && file.category === "document"), "INVALID_FILES");
}
