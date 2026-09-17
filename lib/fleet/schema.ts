import { z } from "zod";

const text = (max = 200) => z.string().trim().max(max);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "Nieprawidłowa data.");
const date = dateSchema.nullable();
const km = z.number().int().min(0).max(10_000_000).nullable();
const hours = z.number().min(0).max(1_000_000).multipleOf(0.1).nullable();
const uuid = z.string().uuid();
export const currencies = ["PLN", "EUR", "SEK", "CZK", "GBP", "USD", "NOK", "DKK"] as const;
export const vehicleKinds = ["car", "van", "truck", "trailer", "crane", "machine", "other"] as const;
export const vehicleStates = ["available", "in_use", "in_service", "out_of_service", "archived"] as const;
export const planKinds = ["inspection", "insurance", "oil", "filter", "service", "tyres", "warranty", "other"] as const;
export const eventKinds = ["created", "edited", "mileage", "meter_correction", "service", "repair", "inspection", "insurance", "fuel", "assignment", "defect", "defect_resolved", "plans", "archived", "restored", "documents", "note", "void"] as const;
export const fileKinds = ["photo", "document", "invoice", "damage"] as const;

export const planSchema = z.object({
  id: uuid,
  title: text(100).min(1, "Wpisz nazwę czynności."),
  kind: z.enum(planKinds),
  dueDate: date,
  dueKm: km,
  dueHours: hours,
  everyMonths: z.number().int().min(1).max(240).nullable(),
  everyKm: z.number().int().min(1).max(2_000_000).nullable(),
  everyHours: z.number().min(0.1).max(100_000).multipleOf(0.1).nullable(),
  warnDays: z.number().int().min(0).max(365),
  warnKm: z.number().int().min(0).max(100_000),
  warnHours: z.number().min(0).max(10_000),
  disabled: z.boolean(),
  disabledReason: text(500),
  lastDate: date,
  lastKm: km,
  lastHours: hours,
}).strict().refine((p) => !p.disabled || p.disabledReason.length >= 3, {
  message: "Podaj powód wyłączenia terminu, np. pojazd elektryczny.", path: ["disabledReason"],
});
export type Plan = z.infer<typeof planSchema>;

export const detailsSchema = z.object({
  fleetNumber: text(60),
  registration: text(30),
  vin: text(17).transform((v) => v.toUpperCase()).refine((v) => !v || /^[A-HJ-NPR-Z0-9]{17}$/.test(v), "VIN musi mieć 17 znaków (bez I, O, Q). Dla maszyn bez VIN zostaw puste pole."),
  make: text(80).min(1, "Wpisz markę / producenta."),
  model: text(100).min(1, "Wpisz model."),
  year: z.number().int().min(1900).max(2100).nullable(),
  kind: z.enum(vehicleKinds),
  country: text(50),
  company: text(120),
  ownership: z.enum(["owned", "leased", "rented"]),
  fuel: z.enum(["diesel", "petrol", "hybrid", "electric", "lpg", "other", "none"]),
  meterMode: z.enum(["km", "hours", "both", "none"]),
  engine: text(120),
  powerKw: z.number().min(0).max(10000).nullable(),
  grossWeightKg: z.number().min(0).max(1_000_000).nullable(),
  oilSpec: text(160),
  oilLitres: z.number().min(0).max(1000).nullable(),
  tireSize: text(100),
  firstRegistration: date,
  site: text(150),
  location: text(200),
  notes: text(5000),
}).strict().refine((v) => Boolean(v.registration || v.fleetNumber), {
  message: "Podaj rejestrację lub numer flotowy.", path: ["registration"],
});
export type VehicleDetails = z.infer<typeof detailsSchema>;

export type Defect = {
  id: string; note: string; severity: "low" | "normal" | "critical";
  reportedAt: string; reportedBy: string; fileIds: string[];
  resolvedAt: string | null; resolution: string;
};
export type VehicleData = VehicleDetails & {
  status: (typeof vehicleStates)[number];
  mileage: number | null; mileageDate: string | null;
  hours: number | null; hoursDate: string | null;
  driverId: string | null; driverName: string;
  plans: Plan[]; defects: Defect[];
};
export type Vehicle = VehicleData & { id: string; version: number; createdAt: string; updatedAt: string };
export type Member = { userId: string; displayName: string; role: "admin" | "worker"; active: boolean };
export type FleetFile = {
  id: string; vehicleId: string; name: string; mime: string; bytes: number;
  kind: (typeof fileKinds)[number]; createdAt: string; createdBy: string;
  eventId: string | null; ready: boolean;
};
export type Event = {
  id: string; vehicleId: string; kind: (typeof eventKinds)[number];
  occurredOn: string; createdAt: string; actorId: string; actorName: string;
  mileage: number | null; hours: number | null;
  title: string; note: string; workshop: string; parts: string;
  cost: number | null; currency: (typeof currencies)[number]; invoiceNumber: string;
  fileIds: string[]; planIds: string[]; fromDriver: string; toDriver: string;
  litres: number | null; fuelLevel: number | null; checks: string[];
  referenceId: string | null;
  voidedAt: string | null; voidReason: string;
  inspectionResult?: "passed" | "failed" | null;
  requestHash?: string;
};
export type FleetList = { me: Member; members: Member[]; vehicles: Vehicle[] };
export type FleetDetail = { vehicle: Vehicle; events: Event[]; files: FleetFile[] };

const common = { vehicleId: uuid, expectedVersion: z.number().int().min(0), operationId: uuid };
const fileIds = z.array(uuid).max(12).refine((ids) => new Set(ids).size === ids.length, "Powtórzony załącznik.");
const meter = { occurredOn: dateSchema, mileage: km, hours };
const completion = z.object({ planId: uuid, nextDate: date.optional(), nextKm: km.optional(), nextHours: hours.optional() }).strict();

export const commandSchema = z.discriminatedUnion("action", [
  z.object({ ...common, action: z.literal("create"), details: detailsSchema, mileage: km, hours, occurredOn: dateSchema }).strict(),
  z.object({ ...common, action: z.literal("edit"), details: detailsSchema }).strict(),
  z.object({ ...common, action: z.literal("plans"), plans: z.array(planSchema).max(80) }).strict(),
  z.object({ ...common, ...meter, action: z.literal("mileage"), note: text(2000), correction: z.boolean() }).strict(),
  z.object({ ...common, ...meter, action: z.literal("service"),
    kind: z.enum(["service", "repair", "inspection", "insurance", "fuel", "note"]),
    title: text(160).min(3, "Wpisz tytuł."), note: text(6000).min(3, "Opisz, co wykonano."),
    workshop: text(200), parts: text(3000), cost: z.number().min(0).max(100_000_000).multipleOf(0.01).nullable(),
    currency: z.enum(currencies), invoiceNumber: text(100), fileIds,
    inspectionResult: z.enum(["passed", "failed"]).nullable(),
    completions: z.array(completion).max(80), litres: z.number().min(0).max(10000).nullable(),
  }).strict(),
  z.object({ ...common, ...meter, action: z.literal("assignment"), driverId: uuid.nullable(), driverName: text(150),
    site: text(150), location: text(200), fuelLevel: z.number().min(0).max(100).nullable(),
    checks: z.array(text(100)).max(20), note: text(3000), fileIds,
  }).strict(),
  z.object({ ...common, action: z.literal("defect"), note: text(5000).min(3), severity: z.enum(["low", "normal", "critical"]), fileIds }).strict(),
  z.object({ ...common, action: z.literal("resolve"), defectId: uuid, note: text(5000).min(3), fileIds }).strict(),
  z.object({ ...common, action: z.literal("status"), status: z.enum(["available", "in_service", "out_of_service", "archived"]), reason: text(2000).min(3) }).strict(),
  z.object({ ...common, action: z.literal("documents"), title: text(160).min(3), fileIds: fileIds.refine((v) => v.length > 0, "Dodaj plik.") }).strict(),
  z.object({ ...common, action: z.literal("void"), eventId: uuid, reason: text(2000).min(5) }).strict(),
]);
export type Command = z.infer<typeof commandSchema>;

export const uploadSchema = z.object({
  vehicleId: uuid, name: text(180).min(1), mime: z.enum(["application/pdf", "image/jpeg", "image/png", "image/webp"]),
  bytes: z.number().int().positive().max(12 * 1024 * 1024), kind: z.enum(fileKinds),
}).strict();
export type UploadRequest = z.infer<typeof uploadSchema>;

export { emptyDetails, emptyPlan, defaultPlans } from "./defaults";
