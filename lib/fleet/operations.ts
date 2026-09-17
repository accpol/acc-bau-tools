import { createHash } from "node:crypto";
import type { Command, Event, Member, Vehicle, VehicleData } from "./schema";
import { defaultPlans } from "./defaults";
import { addCalendarMonths, fleetToday, validMeterSequence } from "./logic";

export class FleetError extends Error {
  constructor(message: string, public status = 400) { super(message); this.name = "FleetError"; }
}
export function demand(condition: unknown, message: string, status = 400): asserts condition {
  if (!condition) throw new FleetError(message, status);
}
export function canOperate(me: Member, vehicle: Vehicle): boolean {
  return me.active && (me.role === "admin" || vehicle.driverId === me.userId);
}
export function publicVehicle(vehicle: Vehicle, me: Member): Vehicle {
  // No costs or invoice paths are stored in the vehicle document. Financial events/files are filtered separately.
  return { ...vehicle, notes: me.role === "admin" ? vehicle.notes : "" };
}
export function publicEvent(event: Event, me: Member, visibleFileIds: Set<string>): Event {
  const { requestHash: _hash, ...rest } = event;
  void _hash;
  if (me.role === "admin") return { ...rest, fileIds: event.fileIds.filter((id) => visibleFileIds.has(id)) };
  return { ...rest, cost: null, invoiceNumber: "", workshop: "", parts: "", voidReason: event.voidedAt ? "Szczegóły unieważnienia dostępne administratorowi." : "", note: ["service", "repair", "inspection", "insurance", "fuel", "note", "edited", "void"].includes(event.kind) ? "Szczegóły administracyjne dostępne dla administratora." : rest.note,
    fileIds: event.fileIds.filter((id) => visibleFileIds.has(id)) };
}

export function applyCommand(command: Command, me: Member, current: Vehicle | null, events: Event[], members: Member[], today = fleetToday()): {
  command: Command; data: VehicleData; event: Event; voidId: string | null;
} {
  demand(me.active, "Konto nieaktywne.", 403);
  const admin = me.role === "admin";
  const isCreate = command.action === "create";
  demand(isCreate ? !current && command.expectedVersion === 0 : !!current, "Nie znaleziono pojazdu albo pojazd już istnieje.", 404);
  if (current) {
    demand(command.expectedVersion === current.version, "Ktoś zmienił ten pojazd. Formularz pozostaje otwarty. Skopiuj wpisany opis, zamknij formularz i odśwież kartę przed ponowną zmianą.", 409);
    demand(current.status !== "archived" || command.action === "status", "Pojazd jest w archiwum. Najpierw przywróć go do floty.");
  }
  if (!admin) {
    demand(!!current && canOperate(me, current) && ["mileage", "defect"].includes(command.action), "Ta operacja wymaga administratora lub przypisania pojazdu do Twojego konta.", 403);
    demand(command.action !== "mileage" || !command.correction, "Korektę licznika wykonuje administrator.", 403);
  }
  const data: VehicleData = current ? structuredClone(stripVehicle(current)) : {
    ...(isCreate ? command.details : (() => { throw new FleetError("Brak danych pojazdu."); })()),
    status: "available", mileage: null, mileageDate: null, hours: null, hoursDate: null,
    driverId: null, driverName: "", plans: defaultPlans(), defects: [],
  };
  const now = new Date().toISOString();
  const event: Event = {
    id: command.operationId, vehicleId: command.vehicleId, kind: "edited", occurredOn: today,
    createdAt: now, actorId: me.userId, actorName: me.displayName,
    mileage: null, hours: null, title: "", note: "", workshop: "", parts: "", cost: null,
    currency: "PLN", invoiceNumber: "", fileIds: [], planIds: [], fromDriver: "", toDriver: "",
    litres: null, fuelLevel: null, checks: [], referenceId: null, voidedAt: null, voidReason: "",
    requestHash: createHash("sha256").update(JSON.stringify(command)).digest("hex"),
  };
  let voidId: string | null = null;
  function meter(date: string, mileage: number | null, hours: number | null, correction = false) {
    demand(date <= today, "Nie można zapisać wykonanej czynności z przyszłą datą.");
    const usesKm = ["km", "both"].includes(data.meterMode);
    const usesHours = ["hours", "both"].includes(data.meterMode);
    demand(usesKm || mileage === null, "Ten pojazd nie używa licznika kilometrów.");
    demand(usesHours || hours === null, "Ten pojazd nie używa motogodzin.");
    event.occurredOn = date; event.mileage = mileage; event.hours = hours;
    for (const [field, dateField] of [["mileage", "mileageDate"], ["hours", "hoursDate"]] as const) {
      const value = field === "mileage" ? mileage : hours;
      if (value === null) continue;
      if (!correction) {
        const error = validMeterSequence(events, data[field], data[dateField], date, value, field);
        demand(!error, error || "Nieprawidłowy licznik.");
      }
      if (correction || !data[dateField] || date >= data[dateField]!) {
        data[field] = value; data[dateField] = date;
      }
    }
  }
  switch (command.action) {
    case "create": {
      demand(!command.details.firstRegistration || command.details.firstRegistration <= today, "Pierwsza rejestracja nie może być w przyszłości.");
      meter(command.occurredOn, command.mileage, command.hours);
      event.kind = "created"; event.title = "Dodano pojazd"; event.note = `${data.registration || data.fleetNumber} • ${data.make} ${data.model}`;
      if (data.meterMode === "none") data.plans = data.plans.filter((p) => !["oil", "filter"].includes(p.kind));
      if (data.fuel === "electric" || data.fuel === "none") data.plans = data.plans.filter((p) => !["oil", "filter"].includes(p.kind));
      break;
    }
    case "edit": {
      demand(command.details.meterMode === data.meterMode, "Rodzaj licznika jest stały po utworzeniu pojazdu. Skontaktuj się z administratorem bazy w przypadku błędnej konfiguracji.");
      demand(!command.details.firstRegistration || command.details.firstRegistration <= today, "Pierwsza rejestracja nie może być w przyszłości.");
      const changed = Object.keys(command.details).filter((key) => command.details[key as keyof typeof command.details] !== data[key as keyof typeof command.details]);
      Object.assign(data, command.details);
      event.kind = "edited"; event.title = "Zmieniono dane pojazdu"; event.note = `Zmienione pola: ${changed.join(", ") || "brak"}`;
      break;
    }
    case "plans": {
      demand(new Set(command.plans.map((p) => p.id)).size === command.plans.length, "Powtórzony identyfikator terminu.");
      // Keep each service type independent. Removing a plan doesn't delete any historical event.
      for (const p of command.plans) {
        demand(["km", "both"].includes(data.meterMode) || (p.dueKm === null && p.everyKm === null), "Plan kilometrów nie pasuje do rodzaju licznika.");
        demand(["hours", "both"].includes(data.meterMode) || (p.dueHours === null && p.everyHours === null), "Plan motogodzin nie pasuje do rodzaju licznika.");
      }
      data.plans = command.plans;
      event.kind = "plans"; event.title = "Zmieniono harmonogram";
      event.note = command.plans.map((p) => `${p.title}: ${p.disabled ? `wyłączony (${p.disabledReason})` : [p.dueDate, p.dueKm === null ? null : `${p.dueKm} km`, p.dueHours === null ? null : `${p.dueHours} h`].filter(Boolean).join(" / ") || "brak terminu"}`).join("\n");
      break;
    }
    case "mileage": {
      demand(command.mileage !== null || command.hours !== null, "Wpisz przynajmniej jeden odczyt licznika.");
      if (command.correction) {
        demand(command.note.length >= 5 && command.occurredOn === today, "Korekta wymaga dzisiejszej daty i podania przyczyny (co najmniej 5 znaków).");
        event.note = `Korekta z ${data.mileage ?? "—"} km / ${data.hours ?? "—"} h. Powód: ${command.note}`;
      } else event.note = command.note;
      meter(command.occurredOn, command.mileage, command.hours, command.correction);
      event.kind = command.correction ? "meter_correction" : "mileage";
      event.title = command.correction ? "Korekta licznika" : "Aktualizacja licznika";
      break;
    }
    case "service": {
      demand(!["fuel", "note"].includes(command.kind) || command.completions.length === 0, "Tankowanie lub notatka nie może zamknąć przeglądu.");
      demand(command.kind !== "inspection" || command.inspectionResult === "passed" || command.inspectionResult === "failed", "Wybierz wynik badania technicznego.");
      demand(command.kind === "inspection" || command.inspectionResult === null, "Wynik badania dotyczy tylko badania technicznego.");
      demand(command.inspectionResult !== "failed" || command.completions.length === 0, "Negatywne badanie nie może przedłużyć terminu przeglądu.");
      meter(command.occurredOn, command.mileage, command.hours);
      Object.assign(event, { kind: command.kind, title: command.title, note: command.note, workshop: command.workshop,
        parts: command.parts, cost: command.cost, currency: command.currency, invoiceNumber: command.invoiceNumber,
        fileIds: command.fileIds, litres: command.litres, inspectionResult: command.inspectionResult });
      if (command.inspectionResult === "failed") {
        data.status = "out_of_service";
        data.defects.unshift({ id: command.operationId, note: `Negatywne badanie techniczne (${command.occurredOn}). Szczegóły w dokumentacji administratora.`,
          severity: "critical", reportedAt: now, reportedBy: me.displayName, fileIds: [], resolvedAt: null, resolution: "" });
        event.referenceId = command.operationId;
      }
      demand(new Set(command.completions.map((p) => p.planId)).size === command.completions.length, "Powtórzona czynność.");
      for (const c of command.completions) {
        const plan = data.plans.find((p) => p.id === c.planId);
        demand(plan && !plan.disabled, "Nie znaleziono aktywnego terminu.");
        demand(!plan.lastDate || command.occurredOn >= plan.lastDate, "Starszy serwis zapisz bez zamykania aktualnego harmonogramu.");
        if (plan.everyKm !== null && c.nextKm === undefined) demand(command.mileage !== null, `Wpisz przebieg dla: ${plan.title}.`);
        if (plan.everyHours !== null && c.nextHours === undefined) demand(command.hours !== null, `Wpisz motogodziny dla: ${plan.title}.`);
        plan.lastDate = command.occurredOn; plan.lastKm = command.mileage; plan.lastHours = command.hours;
        plan.dueDate = c.nextDate !== undefined ? c.nextDate : plan.everyMonths ? addCalendarMonths(command.occurredOn, plan.everyMonths) : null;
        plan.dueKm = c.nextKm !== undefined ? c.nextKm : plan.everyKm !== null && command.mileage !== null ? command.mileage + plan.everyKm : null;
        plan.dueHours = c.nextHours !== undefined ? c.nextHours : plan.everyHours !== null && command.hours !== null ? Math.round((command.hours + plan.everyHours) * 10) / 10 : null;
        demand(!plan.dueDate || plan.dueDate > command.occurredOn, "Następna data musi być późniejsza niż wykonany serwis.");
        demand(plan.dueKm === null || command.mileage === null || plan.dueKm > command.mileage, "Następny przebieg musi być większy niż przebieg serwisu.");
        demand(plan.dueHours === null || command.hours === null || plan.dueHours > command.hours, "Następne motogodziny muszą być większe niż odczyt serwisu.");
        event.planIds.push(plan.id);
      }
      break;
    }
    case "assignment": {
      demand(!["km", "both"].includes(data.meterMode) || command.mileage !== null, "Przekazanie wymaga aktualnego przebiegu.");
      demand(!["hours", "both"].includes(data.meterMode) || command.hours !== null, "Przekazanie wymaga aktualnych motogodzin.");
      demand(!data.defects.some((d) => !d.resolvedAt && d.severity === "critical") && !["out_of_service", "in_service"].includes(data.status) || !command.driverId && !command.driverName,
        "Pojazd jest wyłączony z użytkowania lub w serwisie. Możesz przyjąć zwrot, ale nie wydać go kierowcy.");
      const member = command.driverId ? members.find((m) => m.userId === command.driverId && m.active) : null;
      demand(!command.driverId || !!member, "Nie znaleziono aktywnego konta kierowcy.");
      meter(command.occurredOn, command.mileage, command.hours);
      demand(command.occurredOn === today, "Zmianę aktualnego kierowcy zapisuje się z dzisiejszą datą.");
      event.kind = "assignment"; event.title = command.driverName || member ? "Przekazanie pojazdu" : "Zwrot pojazdu";
      event.fromDriver = data.driverName; event.toDriver = member?.displayName || command.driverName;
      event.note = command.note; event.fuelLevel = command.fuelLevel; event.checks = command.checks; event.fileIds = command.fileIds;
      data.driverId = member?.userId || null; data.driverName = event.toDriver;
      data.site = command.site; data.location = command.location;
      if (!["out_of_service", "in_service"].includes(data.status)) data.status = data.driverName ? "in_use" : "available";
      break;
    }
    case "defect": {
      const id = command.operationId;
      data.defects.unshift({ id, note: command.note, severity: command.severity, reportedAt: now,
        reportedBy: me.displayName, fileIds: command.fileIds, resolvedAt: null, resolution: "" });
      if (command.severity === "critical") data.status = "out_of_service";
      event.kind = "defect"; event.title = command.severity === "critical" ? "Usterka krytyczna — pojazd wyłączony" : "Zgłoszono usterkę";
      event.note = command.note; event.fileIds = command.fileIds; event.referenceId = id;
      break;
    }
    case "resolve": {
      const defect = data.defects.find((d) => d.id === command.defectId && !d.resolvedAt);
      demand(defect, "Usterka jest już zamknięta albo nie istnieje.");
      defect.resolvedAt = now; defect.resolution = command.note;
      event.kind = "defect_resolved"; event.title = "Zamknięto usterkę"; event.note = command.note;
      event.referenceId = defect.id; event.fileIds = command.fileIds;
      // Resolving a report deliberately does not authorize a return to service.
      break;
    }
    case "status": {
      demand(command.status !== "available" || !data.defects.some((d) => d.severity === "critical" && !d.resolvedAt), "Najpierw zamknij wszystkie krytyczne usterki.");
      demand(command.status !== "archived" || !data.driverName, "Przed archiwizacją zapisz zwrot pojazdu od kierowcy.");
      event.kind = command.status === "archived" ? "archived" : data.status === "archived" ? "restored" : "edited";
      event.title = command.status === "archived" ? "Archiwizacja pojazdu" : "Zmiana statusu pojazdu";
      event.note = `${data.status} → ${command.status}. ${command.reason}`;
      data.status = command.status === "available" && data.driverName ? "in_use" : command.status;
      break;
    }
    case "documents": {
      event.kind = "documents"; event.title = command.title; event.fileIds = command.fileIds;
      break;
    }
    case "void": {
      const original = events.find((e) => e.id === command.eventId);
      demand(original && !original.voidedAt && ["service", "repair", "inspection", "insurance", "fuel", "note"].includes(original.kind), "Ten wpis nie może zostać unieważniony.");
      event.kind = "void"; event.title = `Unieważnienie: ${original.title}`; event.referenceId = original.id;
      event.note = `${command.reason}\nTerminy, liczniki i użytkownik nie zostały cofnięte automatycznie. Sprawdź je osobno.`;
      voidId = original.id;
      break;
    }
  }
  return { command, data, event, voidId };
}
export function stripVehicle(vehicle: Vehicle): VehicleData {
  const { id: _id, version: _version, createdAt: _created, updatedAt: _updated, ...data } = vehicle;
  void _id; void _version; void _created; void _updated;
  return data;
}
