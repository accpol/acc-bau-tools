import type { Plan, VehicleDetails } from "./schema";

export function emptyDetails(): VehicleDetails {
  return { fleetNumber: "", registration: "", vin: "", make: "", model: "", year: null, kind: "van", country: "PL",
    company: "ACC BAU", ownership: "owned", fuel: "diesel", meterMode: "km", engine: "", powerKw: null,
    grossWeightKg: null, oilSpec: "", oilLitres: null, tireSize: "", firstRegistration: null,
    site: "", location: "", notes: "" };
}
export function emptyPlan(id = crypto.randomUUID()): Plan {
  return { id, title: "", kind: "service", dueDate: null, dueKm: null, dueHours: null,
    everyMonths: null, everyKm: null, everyHours: null, warnDays: 30, warnKm: 1000, warnHours: 50,
    disabled: false, disabledReason: "", lastDate: null, lastKm: null, lastHours: null };
}
export function defaultPlans(): Plan[] {
  return ([
    ["Badanie techniczne / HU", "inspection"], ["Ubezpieczenie OC", "insurance"],
    ["Olej silnikowy + filtr oleju", "oil"], ["Filtr powietrza", "filter"],
    ["Filtr paliwa", "filter"], ["Filtr kabinowy", "filter"],
  ] as const).map(([title, kind]) => ({ ...emptyPlan(), title, kind }));
}
