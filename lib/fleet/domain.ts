import type { FleetCommand, FleetEvent, FleetEventData, FleetMember, PreparedCommand, ServicePlan, Vehicle, VehicleData, PlanAlert, PlanKind } from "./types";

export class FleetError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message); this.name = "FleetError"; }
}
export function assert(condition: unknown, code: string, message = code, status = 400): asserts condition {
  if (!condition) throw new FleetError(code, message, status);
}
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function uuid(value: unknown): string { assert(typeof value === "string" && UUID.test(value), "INVALID_ID"); return value; }
export function text(value: unknown, max = 200, required = false): string {
  assert(value == null || typeof value === "string", "INVALID_TEXT");
  const result = (value ?? "").toString().trim();
  assert(result.length <= max && (!required || result.length > 0), "INVALID_TEXT");
  return result;
}
export function numberOrNull(value: unknown, max = 10_000_000): number | null {
  if (value == null || value === "") return null;
  assert(typeof value === "number" || typeof value === "string", "INVALID_NUMBER");
  const n = typeof value === "number" ? value : Number(value.replace(",", "."));
  assert(Number.isFinite(n) && n >= 0 && n <= max, "INVALID_NUMBER");
  return n;
}
export function integerOrNull(value: unknown, max = 10_000_000): number | null {
  const n = numberOrNull(value, max); assert(n == null || Number.isInteger(n), "INVALID_NUMBER"); return n;
}
export function localToday(now = new Date()): string {
  // Fleet operates in PL/DE. Use the same business day in browser and on a UTC server.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function dateOrNull(value: unknown): string | null {
  if (value == null || value === "") return null;
  assert(typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value), "INVALID_DATE");
  const date = new Date(value + "T12:00:00Z");
  assert(!isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value, "INVALID_DATE");
  assert(value >= "1900-01-01" && value <= "2200-12-31", "INVALID_DATE");
  return value;
}
export function eventDate(value: unknown): string {
  const d = dateOrNull(value); assert(d && d <= localToday(), "FUTURE_DATE"); return d;
}
export function addCalendarMonths(date: string, months: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const last = new Date(Date.UTC(year, month - 1 + months + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month - 1 + months, Math.min(day, last))).toISOString().slice(0, 10);
}
export function dayDifference(date: string, today = localToday()): number {
  return Math.round((Date.parse(date + "T12:00:00Z") - Date.parse(today + "T12:00:00Z")) / 86400000);
}
export function planAlert(plan: ServicePlan, mileage: number | null, today = localToday()): PlanAlert {
  const days = plan.dueDate ? dayDifference(plan.dueDate, today) : null;
  const km = plan.dueMileage != null && mileage != null ? plan.dueMileage - mileage : null;
  let severity: PlanAlert["severity"] = "ok";
  if ((days != null && days < 0) || (km != null && km <= 0)) severity = "overdue";
  else if ((days != null && days <= plan.warnDays) || (km != null && km <= plan.warnKm)) severity = "soon";
  else if ((!plan.dueDate && plan.dueMileage == null) || (plan.dueMileage != null && mileage == null)) severity = "missing";
  return { plan, days, km, severity };
}
export function vehicleAlerts(v: Vehicle, today = localToday()): PlanAlert[] {
  return v.data.plans.filter(p => !p.archived).map(p => planAlert(p, v.data.mileage, today));
}
export function normalizedPlate(plate: string): string { return plate.toUpperCase().replace(/[^A-Z0-9]/g, ""); }
export const INFO_FIELDS = ["plate", "name", "make", "model", "vin", "year", "category", "country", "fuel", "transmission", "company", "ownership", "firstRegistration", "purchaseDate", "purchasePrice", "purchaseCurrency", "leasingUntil", "policyNumber", "insurer", "assistancePhone", "engine", "power", "maxMass", "payload", "seats", "tyreSize", "project", "location", "notes", "status"] as const;
export function emptyVehicle(): VehicleData {
  return { plate: "", name: "", make: "", model: "", vin: "", year: "", category: "van", country: "PL", fuel: "diesel", transmission: "", company: "", ownership: "owned", firstRegistration: "", purchaseDate: "", purchasePrice: "", purchaseCurrency: "EUR", leasingUntil: "", policyNumber: "", insurer: "", assistancePhone: "", engine: "", power: "", maxMass: "", payload: "", seats: "", tyreSize: "", project: "", location: "", notes: "", coverFileId: "", status: "available", driver: "", mileage: null, mileageDate: null, archived: false, archivedAt: null, plans: [], openDefects: 0 };
}
export function sanitizeVehicleInfo(patch: Record<string, unknown>, current: VehicleData): VehicleData {
  const next = { ...current };
  for (const key of INFO_FIELDS) if (key in patch) {
    const val = text(patch[key], key === "notes" ? 6000 : 200);
    (next as unknown as Record<string, unknown>)[key] = val;
  }
  next.plate = next.plate.toUpperCase(); next.vin = next.vin.toUpperCase();
  assert(normalizedPlate(next.plate).length >= 2 && next.plate.length <= 24, "PLATE_REQUIRED");
  assert(next.make.length > 0 && next.model.length > 0, "MAKE_MODEL_REQUIRED");
  assert(!next.vin || /^[A-HJ-NPR-Z0-9]{17}$/.test(next.vin), "VIN_INVALID");
  assert(!next.year || (/^\d{4}$/.test(next.year) && Number(next.year) >= 1900 && Number(next.year) <= new Date().getFullYear() + 2), "INVALID_YEAR");
  assert(["available", "in_use", "service", "out_of_service", "sold"].includes(next.status), "INVALID_STATUS");
  assert(!next.purchaseCurrency || ["EUR", "PLN", "SEK", "DKK", "CZK", "GBP", "USD"].includes(next.purchaseCurrency), "INVALID_CURRENCY");
  for (const key of ["firstRegistration", "purchaseDate", "leasingUntil"] as const) dateOrNull(next[key]);
  if (next.purchasePrice) numberOrNull(next.purchasePrice, 100_000_000);
  return next;
}
const PLAN_KINDS: PlanKind[] = ["inspection", "insurance", "oil", "oil_filter", "air_filter", "cabin_filter", "fuel_filter", "timing_belt", "brake_fluid", "tyres", "tachograph", "extinguisher", "other"];
export function sanitizePlan(p: Record<string, unknown>): ServicePlan {
  assert(PLAN_KINDS.includes(p.kind as PlanKind), "INVALID_PLAN");
  const plan: ServicePlan = { id: uuid(p.id), kind: p.kind as PlanKind, label: text(p.label, 160, true), dueDate: dateOrNull(p.dueDate), dueMileage: integerOrNull(p.dueMileage), intervalMonths: integerOrNull(p.intervalMonths, 240), intervalKm: integerOrNull(p.intervalKm, 1_000_000), warnDays: integerOrNull(p.warnDays, 365) ?? 30, warnKm: integerOrNull(p.warnKm, 100_000) ?? 1500, lastDoneDate: null, lastDoneMileage: null, notes: text(p.notes, 2000), archived: false };
  assert(plan.intervalMonths == null || plan.intervalMonths > 0, "INVALID_INTERVAL");
  assert(plan.intervalKm == null || plan.intervalKm > 0, "INVALID_INTERVAL");
  assert(plan.dueDate || plan.dueMileage != null, "DUE_REQUIRED");
  return plan;
}
function readings(events: FleetEvent[]): { id: string; date: string; value: number }[] {
  const changes = new Map<string, number>();
  [...events].sort((a, b) => a.created_at.localeCompare(b.created_at)).forEach(e => {
    if (e.kind === "mileage_correction" && e.data.correctedId && e.data.correctedMileage != null) changes.set(e.data.correctedId, e.data.correctedMileage);
  });
  return events.filter(e => e.data.mileage != null && e.kind !== "mileage_correction")
    .map(e => ({ id: e.id, date: e.happened_on, value: changes.get(e.id) ?? e.data.mileage! }));
}
export function validateReading(events: FleetEvent[], date: string, mileage: number, replacedId?: string): void {
  const items = readings(events).filter(r => r.id !== replacedId);
  const before = items.filter(r => r.date < date);
  const after = items.filter(r => r.date > date);
  assert(!before.some(r => r.value > mileage) && !after.some(r => r.value < mileage), "MILEAGE_ORDER");
  // Same-day readings can be entered retrospectively; current value is always the maximum.
}
export function effectiveMileage(events: FleetEvent[], extra?: { date: string; value: number }): { mileage: number | null; mileageDate: string | null } {
  const items = readings(events); if (extra) items.push({ id: "new", ...extra });
  if (!items.length) return { mileage: null, mileageDate: null };
  const latestDate = items.map(r => r.date).sort().at(-1)!;
  return { mileage: Math.max(...items.filter(r => r.date === latestDate).map(r => r.value)), mileageDate: latestDate };
}
export function effectiveEventMileage(event: FleetEvent, all: FleetEvent[]): number | null {
  return readings(all).find(r => r.id === event.id)?.value ?? null;
}
export function costTotals(events: FleetEvent[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const e of events) if (e.data.cost != null && ["service", "repair", "inspection"].includes(e.kind)) {
    const key = `${e.data.currency || "EUR"} ${e.data.costBasis || "gross"}`;
    result[key] = Math.round(((result[key] || 0) + e.data.cost) * 100) / 100;
  }
  return result;
}
function record(value: unknown): Record<string, unknown> { assert(value !== null && typeof value === "object" && !Array.isArray(value), "INVALID_PAYLOAD"); return value as Record<string, unknown>; }
export function prepareCommand(cmd: FleetCommand, current: Vehicle | null, events: FleetEvent[], member: FleetMember): PreparedCommand {
  uuid(cmd.commandId); uuid(cmd.vehicleId); const p = record(cmd.payload);
  assert(Number.isInteger(cmd.expectedVersion) && cmd.expectedVersion >= 0, "INVALID_VERSION");
  const admin = member.role === "admin";
  if (cmd.type === "create") {
    assert(admin, "FORBIDDEN", "FORBIDDEN", 403); assert(!current && cmd.expectedVersion === 0, "CONFLICT", "CONFLICT", 409);
    const data = sanitizeVehicleInfo(p, emptyVehicle());
    data.mileage = integerOrNull(p.mileage); data.mileageDate = data.mileage != null ? eventDate(p.date || localToday()) : null;
    data.driver = text(p.driver, 160); if (data.driver && data.status === "available") data.status = "in_use";
    return { data, event: { kind: "created", happened_on: data.mileageDate || localToday(), data: { title: data.plate, notes: "", mileage: data.mileage, to: data.driver, after: data } } };
  }
  assert(current, "NOT_FOUND", "NOT_FOUND", 404); assert(current.version === cmd.expectedVersion, "CONFLICT", "CONFLICT", 409);
  assert(!current.data.archived || cmd.type === "restore", "ARCHIVED");
  const workerActions = ["mileage", "defect", "document"];
  assert(admin || (workerActions.includes(cmd.type) && current.data.driver === member.name), "FORBIDDEN", "FORBIDDEN", 403);
  let data: VehicleData = structuredClone(current.data);
  let event: PreparedCommand["event"] = { kind: "updated", happened_on: localToday(), data: { title: "", notes: "" } };
  switch (cmd.type) {
    case "update": {
      data = sanitizeVehicleInfo(p, data);
      const changed = INFO_FIELDS.filter(k => data[k] !== current.data[k]);
      assert(changed.length, "NO_CHANGE");
      const before: Record<string, unknown> = {}, after: Record<string, unknown> = {};
      changed.forEach(k => { before[k] = current.data[k]; after[k] = data[k]; });
      event.data = { title: data.plate, notes: "", changedFields: [...changed], before, after };
      break;
    }
    case "cover": data.coverFileId = uuid(p.id); event.data = { title: "", notes: "", changedFields: ["coverFileId"], before: { coverFileId: current.data.coverFileId }, after: { coverFileId: data.coverFileId } }; break;
    case "archive": data.archived = true; data.archivedAt = new Date().toISOString(); event.kind = "archived"; event.data.notes = text(p.reason, 2000, true); break;
    case "restore": data.archived = false; data.archivedAt = null; event.kind = "restored"; break;
    case "plan_add": {
      const plan = sanitizePlan(p); assert(!data.plans.some(i => i.id === plan.id), "DUPLICATE");
      data.plans.push(plan); event.kind = "plan_added"; event.data = { title: plan.label, notes: plan.notes, plan }; break;
    }
    case "plan_update": {
      const id = uuid(p.id); const at = data.plans.findIndex(i => i.id === id && !i.archived);
      assert(at >= 0, "NOT_FOUND"); const previous = structuredClone(data.plans[at]);
      const plan = { ...sanitizePlan(p), lastDoneDate: previous.lastDoneDate, lastDoneMileage: previous.lastDoneMileage };
      data.plans[at] = plan; event.kind = "plan_updated";
      event.data = { title: plan.label, notes: text(p.reason, 2000, true), plan, previousPlan: previous }; break;
    }
    case "plan_archive": {
      const id = uuid(p.id); const plan = data.plans.find(i => i.id === id); assert(plan && !plan.archived, "NOT_FOUND");
      plan.archived = true; event.kind = "plan_archived"; event.data = { title: plan.label, notes: text(p.reason, 2000, true), plan: structuredClone(plan) }; break;
    }
    case "mileage_correction": {
      const id = uuid(p.correctedId); const target = events.find(e => e.id === id && e.data.mileage != null);
      assert(target, "NOT_FOUND"); const mileage = integerOrNull(p.correctedMileage); assert(mileage != null, "MILEAGE_REQUIRED");
      validateReading(events, target.happened_on, mileage, id);
      event.kind = "mileage_correction"; event.data = { title: target.data.title, notes: "", correctedId: id, correctedMileage: mileage, reason: text(p.reason, 2000, true) };
      const fake: FleetEvent = { id: cmd.commandId, vehicle_id: current.id, ...event, created_by: member.name, created_at: new Date().toISOString() };
      data = { ...data, ...effectiveMileage([...events, fake]) }; break;
    }
    case "mileage": case "assignment": case "service": case "repair": case "inspection": case "defect": {
      const date = eventDate(p.date); const mileage = integerOrNull(p.mileage);
      assert(mileage != null || cmd.type === "defect", "MILEAGE_REQUIRED");
      if (mileage != null) {
        validateReading(events, date, mileage);
        data = { ...data, ...effectiveMileage(events, { date, value: mileage }) };
      }
      const payload: FleetEventData = { title: text(p.title, 160, ["service", "repair", "inspection", "defect"].includes(cmd.type)), notes: text(p.notes, 6000), mileage, driver: member.name };
      event = { kind: cmd.type, happened_on: date, data: payload };
      if (cmd.type === "assignment") {
        assert(date === localToday(), "ASSIGNMENT_TODAY");
        data.driver = text(p.driver, 160); payload.from = current.data.driver; payload.to = data.driver;
        data.project = text(p.project, 200); data.location = text(p.location, 200);
        if (["available", "in_use"].includes(data.status)) data.status = data.driver ? "in_use" : "available";
        assert(payload.from !== payload.to || data.project !== current.data.project || data.location !== current.data.location, "NO_CHANGE");
      }
      if (["service", "repair", "inspection"].includes(cmd.type)) {
        payload.workshop = text(p.workshop, 200); payload.invoiceNumber = text(p.invoiceNumber, 100);
        payload.cost = numberOrNull(p.cost, 100_000_000); payload.currency = text(p.currency, 3) || "EUR";
        assert(["EUR", "PLN", "SEK", "DKK", "CZK", "GBP", "USD"].includes(payload.currency), "INVALID_CURRENCY");
        assert(p.costBasis === "net" || p.costBasis === "gross", "INVALID_COST_BASIS"); payload.costBasis = p.costBasis;
        const completions = Array.isArray(p.completions) ? p.completions.map(record) : [];
        assert(completions.length <= 40, "INVALID_PAYLOAD"); payload.completedPlans = [];
        const seen = new Set<string>();
        for (const c of completions) {
          const id = uuid(c.id); assert(!seen.has(id), "DUPLICATE"); seen.add(id);
          const plan = data.plans.find(i => i.id === id && !i.archived); assert(plan, "NOT_FOUND");
          assert(!plan.lastDoneDate || date >= plan.lastDoneDate, "OLDER_SERVICE");
          plan.lastDoneDate = date; plan.lastDoneMileage = mileage;
          plan.dueDate = dateOrNull(c.nextDate) || (plan.intervalMonths ? addCalendarMonths(date, plan.intervalMonths) : null);
          plan.dueMileage = integerOrNull(c.nextMileage) ?? (plan.intervalKm && mileage != null ? mileage + plan.intervalKm : null);
          assert(!plan.dueDate || plan.dueDate > date, "DUE_AFTER_SERVICE");
          assert(plan.dueMileage == null || mileage == null || plan.dueMileage > mileage, "DUE_AFTER_SERVICE");
          payload.completedPlans.push(id);
        }
      }
      if (cmd.type === "defect") {
        assert(["low", "normal", "urgent"].includes(String(p.priority)), "INVALID_PRIORITY"); payload.priority = p.priority as "low" | "normal" | "urgent";
        data.openDefects = (data.openDefects || 0) + 1;
        if (payload.priority === "urgent") data.status = "out_of_service";
      }
      break;
    }
    case "defect_close": {
      const id = uuid(p.id); assert(events.some(e => e.id === id && e.kind === "defect"), "NOT_FOUND");
      assert(!events.some(e => e.kind === "defect_closed" && e.data.resolvedId === id), "ALREADY_CLOSED");
      data.openDefects = Math.max(0, data.openDefects - 1);
      event.kind = "defect_closed"; event.data = { title: "", notes: text(p.notes, 3000, true), resolvedId: id };
      // Closing a defect never silently returns a vehicle to service.
      break;
    }
    case "document_attach": {
      const id = uuid(p.relatedEventId); assert(events.some(e => e.id === id), "NOT_FOUND");
      assert(cmd.fileIds?.length, "INVALID_FILES");
      event.kind = "documents_added"; event.data = { title: text(p.title, 160, true), notes: text(p.notes, 3000), relatedEventId: id }; break;
    }
    case "document": event.kind = "document"; event.data = { title: text(p.title, 160, true), notes: text(p.notes, 3000) }; break;
    default: throw new FleetError("UNKNOWN_COMMAND", "UNKNOWN_COMMAND");
  }
  return { data, event };
}
export function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value); if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
