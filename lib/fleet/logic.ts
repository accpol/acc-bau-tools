import type { Event, Plan, Vehicle } from "./schema";

export const FLEET_TIME_ZONE = "Europe/Berlin";
export function fleetToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: FLEET_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  return ["year", "month", "day"].map((key) => parts.find((p) => p.type === key)!.value).join("-");
}
export function dateDays(date: string, relativeTo = fleetToday()): number {
  return Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${relativeTo}T12:00:00Z`)) / 86_400_000);
}
export function addCalendarMonths(date: string, months: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const last = new Date(Date.UTC(year, month - 1 + months + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month - 1 + months, Math.min(day, last), 12)).toISOString().slice(0, 10);
}
export type Due = { level: "ok" | "soon" | "due" | "missing" | "disabled"; days: number | null; km: number | null; hours: number | null; missingMeter: boolean };
export function planDue(plan: Plan, vehicle: Pick<Vehicle, "mileage" | "hours">, today = fleetToday()): Due {
  const days = plan.dueDate ? dateDays(plan.dueDate, today) : null;
  const km = plan.dueKm === null || vehicle.mileage === null ? null : plan.dueKm - vehicle.mileage;
  const hours = plan.dueHours === null || vehicle.hours === null ? null : Math.round((plan.dueHours - vehicle.hours) * 10) / 10;
  const missingMeter = plan.dueKm !== null && vehicle.mileage === null || plan.dueHours !== null && vehicle.hours === null;
  const result = { days, km, hours, missingMeter };
  if (plan.disabled) return { ...result, level: "disabled" };
  if ([days, km, hours].some((n) => n !== null && n <= 0)) return { ...result, level: "due" };
  if (days !== null && days <= plan.warnDays || km !== null && km <= plan.warnKm || hours !== null && hours <= plan.warnHours) return { ...result, level: "soon" };
  if (missingMeter || days === null && km === null && hours === null) return { ...result, level: "missing" };
  return { ...result, level: "ok" };
}
export function staleMeters(vehicle: Pick<Vehicle, "meterMode" | "mileageDate" | "hoursDate">, today = fleetToday(), days = 14): boolean {
  return (["km", "both"].includes(vehicle.meterMode) && (!vehicle.mileageDate || dateDays(vehicle.mileageDate, today) < -days)) ||
    (["hours", "both"].includes(vehicle.meterMode) && (!vehicle.hoursDate || dateDays(vehicle.hoursDate, today) < -days));
}
export function vehicleAlerts(vehicle: Vehicle, today = fleetToday()): { due: number; soon: number; missing: number; stale: boolean; defects: number } {
  const levels = vehicle.plans.map((p) => planDue(p, vehicle, today).level);
  return { due: levels.filter((l) => l === "due").length, soon: levels.filter((l) => l === "soon").length,
    missing: levels.length ? levels.filter((l) => l === "missing").length : 1, stale: staleMeters(vehicle, today),
    defects: vehicle.defects.filter((d) => !d.resolvedAt).length };
}
export function validMeterSequence(events: Event[], current: number | null, currentDate: string | null, date: string, value: number, field: "mileage" | "hours"): string | null {
  const label = field === "mileage" ? "Przebieg" : "Motogodziny";
  // A correction starts a new counter segment. Back-dated entries from previous segments
  // are not silently interpreted as values of the corrected counter.
  const correction = events.filter((e) => e.kind === "meter_correction" && e[field] !== null && !e.voidedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (correction && date < correction.occurredOn) return `${label}: data jest wcześniejsza niż ostatnia korekta licznika. Zapisz opis historyczny bez odczytu licznika.`;
  if (current !== null && currentDate) {
    if (date >= currentDate && value < current) return `${label} nie może być niższy od aktualnego odczytu. Błąd popraw przez „Korektę licznika”.`;
    if (date < currentDate && value > current) return `${label} z wcześniejszej daty nie może być wyższy od aktualnego odczytu.`;
  }
  for (const e of events) {
    if (e.voidedAt || e[field] === null || correction && e.createdAt < correction.createdAt) continue;
    if (e.occurredOn < date && e[field]! > value || e.occurredOn > date && e[field]! < value) return `${label} nie pasuje do odczytów zapisanych przed lub po tej dacie.`;
  }
  return null;
}
export function costTotals(events: Event[]): Record<string, number> {
  const cents: Record<string, number> = {};
  for (const event of events) if (!event.voidedAt && event.cost !== null) cents[event.currency] = (cents[event.currency] || 0) + Math.round(event.cost * 100);
  return Object.fromEntries(Object.entries(cents).map(([currency, value]) => [currency, value / 100]));
}
export function fmtNumber(value: number | null, digits = 0): string {
  return value === null ? "—" : new Intl.NumberFormat("pl-PL", { maximumFractionDigits: digits }).format(value);
}
export function fmtDate(value: string | null): string {
  return value ? value.slice(0, 10).split("-").reverse().join(".") : "—";
}
export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  // Neutralize formula injection in Excel, including leading whitespace/control characters.
  if (/^[\s\u0000-\u001f]*[=+@-]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function csv(rows: unknown[][]): string {
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
}
export function downloadText(content: string, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function sniffMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-") return "application/pdf";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value)) return "image/png";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}
