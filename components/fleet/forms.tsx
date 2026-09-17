"use client";
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { discardFiles, send, uploadFiles, type PendingFile } from "@/lib/fleet/client";
import { addCalendarMonths, fleetToday, fmtDate, fmtNumber, vehicleAlerts } from "@/lib/fleet/logic";
import { currencies, emptyDetails, emptyPlan, type Command, type Event, type FleetFile, type Member, type Plan, type Vehicle, type VehicleDetails } from "@/lib/fleet/schema";
import { Action, Dialog, Field, FilePicker, Hint, labels, number, options, Pick, Section, TextArea } from "./ui";

type Props = { vehicle: Vehicle; onClose: () => void; onSaved: (id: string) => void };
function useSave(vehicleId: string, onClose: () => void, onSaved: (id: string) => void) {
  const [operationId] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [progress, setProgress] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);
  async function submit(build: (fileIds: string[]) => Command) {
    if (busy) return; setBusy(true); setError("");
    try {
      const fileIds = await uploadFiles(vehicleId, files, (key, patch) => setFiles((all) => all.map((f) => f.key === key ? { ...f, ...patch } : f)), setProgress);
      await send(build(fileIds)); onSaved(vehicleId);
    } catch (e) { setError(e instanceof Error ? e.message : "Nie udało się zapisać danych."); }
    finally { setBusy(false); setProgress(""); }
  }
  function close() {
    if (busy) return;
    if (!window.confirm("Zamknąć formularz bez zapisu zmian?")) return;
    void discardFiles(files).finally(onClose);
  }
  return { operationId, busy, error, progress, files, setFiles, submit, close };
}
function MeterFields({ vehicle, mileage, hours, setMileage, setHours, required = false }: {
  vehicle: Pick<Vehicle, "meterMode">; mileage: number | null; hours: number | null;
  setMileage: (n: number | null) => void; setHours: (n: number | null) => void; required?: boolean;
}) {
  return <>{["km", "both"].includes(vehicle.meterMode) && <Field label="Stan licznika [km]" value={mileage} type="number" min={0} step="1" onChange={(s) => setMileage(number(s))} required={required} />}
    {["hours", "both"].includes(vehicle.meterMode) && <Field label="Motogodziny [h]" value={hours} type="number" min={0} step="0.1" onChange={(s) => setHours(number(s))} required={required} />}</>;
}

export function VehicleForm({ vehicle, onClose, onSaved }: { vehicle?: Vehicle; onClose: () => void; onSaved: (id: string) => void }) {
  const [id] = useState(() => vehicle?.id || crypto.randomUUID());
  const [details, setDetails] = useState<VehicleDetails>(() => vehicle ? Object.fromEntries(Object.keys(emptyDetails()).map((key) => [key, vehicle[key as keyof VehicleDetails]])) as VehicleDetails : emptyDetails());
  const [mileage, setMileage] = useState<number | null>(null); const [hours, setHours] = useState<number | null>(null);
  const [occurredOn, setDate] = useState(fleetToday()); const save = useSave(id, onClose, onSaved);
  const set = <K extends keyof VehicleDetails>(key: K, value: VehicleDetails[K]) => setDetails((d) => ({ ...d, [key]: value }));
  return <Dialog wide title={vehicle ? "Edytuj dane pojazdu" : "Dodaj pojazd"} subtitle="Rejestracja lub numer flotowy identyfikuje pojazd. Pola z gwiazdką są wymagane." onClose={save.close} busy={save.busy} error={save.error} onSubmit={() => save.submit(() => vehicle ? {
    action: "edit", vehicleId: id, expectedVersion: vehicle.version, operationId: save.operationId, details,
  } : { action: "create", vehicleId: id, expectedVersion: 0, operationId: save.operationId, details,
    mileage: ["km", "both"].includes(details.meterMode) ? mileage : null, hours: ["hours", "both"].includes(details.meterMode) ? hours : null, occurredOn })}>
    <Section title="Identyfikacja"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Numer rejestracyjny" value={details.registration} onChange={(v) => set("registration", v.toUpperCase())} placeholder="np. PO 12345" />
      <Field label="Numer flotowy" value={details.fleetNumber} onChange={(v) => set("fleetNumber", v)} placeholder="np. ACC-AUTO-001" />
      <Field label="VIN (17 znaków)" value={details.vin} onChange={(v) => set("vin", v.toUpperCase())} />
      <Field label="Marka / producent" value={details.make} onChange={(v) => set("make", v)} required />
      <Field label="Model" value={details.model} onChange={(v) => set("model", v)} required />
      <Pick label="Rodzaj pojazdu" value={details.kind} onChange={(v) => set("kind", v as VehicleDetails["kind"])} options={options(labels.kind)} />
      <Field label="Rok produkcji" value={details.year} type="number" min={1900} max={2100} onChange={(v) => set("year", number(v))} />
      <Field label="Pierwsza rejestracja" value={details.firstRegistration} type="date" max={fleetToday()} onChange={(v) => set("firstRegistration", v || null)} />
      <Field label="Kraj rejestracji" value={details.country} onChange={(v) => set("country", v)} />
    </div></Section>
    <Section title="Firma i położenie"><div className="grid gap-4 sm:grid-cols-2">
      <Field label="Firma / właściciel" value={details.company} onChange={(v) => set("company", v)} />
      <Pick label="Forma użytkowania" value={details.ownership} onChange={(v) => set("ownership", v as VehicleDetails["ownership"])} options={options(labels.ownership)} />
      <Field label="Budowa / projekt" value={details.site} onChange={(v) => set("site", v)} />
      <Field label="Lokalizacja (wpis ręczny, nie GPS)" value={details.location} onChange={(v) => set("location", v)} />
    </div><p className="text-xs text-slate-500">Kierowcę przypiszesz przyciskiem „Przekaż / zwróć”, aby zachować historię odpowiedzialności.</p></Section>
    <Section title="Dane techniczne i eksploatacyjne"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Pick label="Paliwo / napęd" value={details.fuel} onChange={(v) => set("fuel", v as VehicleDetails["fuel"])} options={options(labels.fuel)} />
      <Pick label="Rodzaj licznika" value={details.meterMode} disabled={!!vehicle} onChange={(v) => set("meterMode", v as VehicleDetails["meterMode"])} options={options(labels.meter)} />
      <Field label="Silnik / pojemność / kod" value={details.engine} onChange={(v) => set("engine", v)} />
      <Field label="Moc [kW]" value={details.powerKw} type="number" min={0} step="0.1" onChange={(v) => set("powerKw", number(v))} />
      <Field label="DMC [kg]" value={details.grossWeightKg} type="number" min={0} onChange={(v) => set("grossWeightKg", number(v))} />
      <Field label="Rozmiar opon" value={details.tireSize} onChange={(v) => set("tireSize", v)} placeholder="np. 235/65 R16C" />
      <Field label="Specyfikacja oleju" value={details.oilSpec} onChange={(v) => set("oilSpec", v)} placeholder="Wg instrukcji producenta" />
      <Field label="Ilość oleju [l]" value={details.oilLitres} type="number" min={0} step="0.1" onChange={(v) => set("oilLitres", number(v))} />
    </div></Section>
    {!vehicle && <Section title="Pierwszy odczyt"><div className="grid gap-4 sm:grid-cols-3"><Field label="Data odczytu" value={occurredOn} type="date" max={fleetToday()} required onChange={setDate} /><MeterFields vehicle={details} mileage={mileage} hours={hours} setMileage={setMileage} setHours={setHours} /></div><p className="text-xs text-slate-500">Nieznany licznik zostaw pusty — system pokaże brak odczytu, a nie 0 km.</p></Section>}
    <TextArea label="Uwagi administracyjne (tylko administrator)" value={details.notes} onChange={(v) => set("notes", v)} />
    {!vehicle && <Hint>Po zapisaniu otworzysz kartę pojazdu. Dodaj zdjęcia i dokumenty, przypisz użytkownika oraz uzupełnij terminy. Interwałów nie zgadujemy — ustaw je według dokumentów i zaleceń producenta.</Hint>}
  </Dialog>;
}

export function PlansForm({ vehicle, onClose, onSaved }: Props) {
  const [plans, setPlans] = useState<Plan[]>(() => structuredClone(vehicle.plans)); const save = useSave(vehicle.id, onClose, onSaved);
  const update = (id: string, patch: Partial<Plan>) => setPlans((all) => all.map((p) => p.id === id ? { ...p, ...patch } : p));
  return <Dialog wide title="Terminy i harmonogram" subtitle={`${vehicle.registration || vehicle.fleetNumber} • Każdy przegląd i filtr ma osobny termin.`} onClose={save.close} busy={save.busy} error={save.error} onSubmit={() => save.submit(() => ({ action: "plans", vehicleId: vehicle.id, expectedVersion: vehicle.version, operationId: save.operationId, plans }))}>
    <Hint>Wystarczy osiągnięcie jednej granicy: daty, kilometrów lub motogodzin. Puste pola oznaczają brak zaplanowanego terminu. „Co ile” służy do wyznaczenia kolejnego terminu dopiero po zapisaniu wykonanej czynności.</Hint>
    {plans.map((p, index) => <details key={p.id} open={index === 0 || !p.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <summary className="cursor-pointer text-sm font-bold text-slate-900">{p.title || "Nowa czynność"}{p.disabled ? " • nie dotyczy" : ""}</summary>
      <div className="mt-4 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Nazwa czynności" value={p.title} required onChange={(title) => update(p.id, { title })} /><Pick label="Rodzaj" value={p.kind} onChange={(kind) => update(p.id, { kind: kind as Plan["kind"] })} options={options(labels.plan)} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.disabled} onChange={(e) => update(p.id, { disabled: e.target.checked })} />Nie dotyczy tego pojazdu / wyłącz alarm</label>
        {p.disabled ? <Field label="Dlaczego nie dotyczy?" value={p.disabledReason} required onChange={(disabledReason) => update(p.id, { disabledReason })} /> : <>
          <div className="grid gap-4 sm:grid-cols-3"><Field label="Następny termin — data" value={p.dueDate} type="date" onChange={(s) => update(p.id, { dueDate: s || null })} />
            {["km", "both"].includes(vehicle.meterMode) && <Field label="Następny termin — stan licznika [km]" value={p.dueKm} type="number" min={0} onChange={(s) => update(p.id, { dueKm: number(s) })} />}
            {["hours", "both"].includes(vehicle.meterMode) && <Field label="Następny termin — stan [h]" value={p.dueHours} type="number" step="0.1" min={0} onChange={(s) => update(p.id, { dueHours: number(s) })} />}
          </div>
          <div className="grid gap-4 sm:grid-cols-3"><Field label="Powtarzaj co [miesiące]" value={p.everyMonths} type="number" min={1} onChange={(s) => update(p.id, { everyMonths: number(s) })} />
            {["km", "both"].includes(vehicle.meterMode) && <Field label="Powtarzaj co [km]" value={p.everyKm} type="number" min={1} onChange={(s) => update(p.id, { everyKm: number(s) })} />}
            {["hours", "both"].includes(vehicle.meterMode) && <Field label="Powtarzaj co [h]" value={p.everyHours} type="number" step="0.1" min={0.1} onChange={(s) => update(p.id, { everyHours: number(s) })} />}
          </div>
          <div className="grid gap-4 sm:grid-cols-3"><Field label="Ostrzegaj wcześniej [dni]" value={p.warnDays} type="number" min={0} required onChange={(s) => update(p.id, { warnDays: Number(s) })} />
            {["km", "both"].includes(vehicle.meterMode) && <Field label="Ostrzegaj wcześniej [km]" value={p.warnKm} type="number" min={0} required onChange={(s) => update(p.id, { warnKm: Number(s) })} />}
            {["hours", "both"].includes(vehicle.meterMode) && <Field label="Ostrzegaj wcześniej [h]" value={p.warnHours} type="number" step="0.1" min={0} required onChange={(s) => update(p.id, { warnHours: Number(s) })} />}
          </div><p className="text-xs text-slate-500">Ostatnio wykonano: {fmtDate(p.lastDate)}{p.lastKm !== null ? ` • ${fmtNumber(p.lastKm)} km` : ""}{p.lastHours !== null ? ` • ${fmtNumber(p.lastHours, 1)} h` : ""}</p>
        </>}
      </div>
    </details>)}
    <Action variant="secondary" onClick={() => setPlans((all) => [...all, emptyPlan()])}><Plus size={16} />Dodaj kolejny termin</Action>
    <p className="text-xs text-slate-500">Możesz dodać np. rozrząd, olej w skrzyni, opony, gaśnicę, tachograf, dodatkowe badanie, AC, assistance, koniec leasingu lub gwarancji. Historia wcześniejszych czynności pozostaje zachowana.</p>
  </Dialog>;
}

export function MeterForm({ vehicle, me, onClose, onSaved }: Props & { me: Member }) {
  const [date, setDate] = useState(fleetToday()); const [mileage, setMileage] = useState(vehicle.mileage); const [hours, setHours] = useState(vehicle.hours);
  const [note, setNote] = useState(""); const [correction, setCorrection] = useState(false); const save = useSave(vehicle.id, onClose, onSaved);
  return <Dialog title="Aktualizuj licznik" subtitle={`${vehicle.registration || vehicle.fleetNumber} • Aktualnie: ${fmtNumber(vehicle.mileage)} km / ${fmtNumber(vehicle.hours, 1)} h`} onClose={save.close} busy={save.busy} error={save.error} onSubmit={() => save.submit(() => ({ action: "mileage", vehicleId: vehicle.id, expectedVersion: vehicle.version, operationId: save.operationId, occurredOn: date, mileage, hours, note, correction }))}>
    <div className="grid gap-4 sm:grid-cols-3"><Field label="Data odczytu" value={date} type="date" max={fleetToday()} required onChange={setDate} /><MeterFields vehicle={vehicle} mileage={mileage} hours={hours} setMileage={setMileage} setHours={setHours} /></div>
    {me.role === "admin" && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={correction} onChange={(e) => { setCorrection(e.target.checked); setDate(fleetToday()); }} />Korekta licznika (błąd wpisu / wymiana licznika)</label>}
    <TextArea label={correction ? "Powód korekty" : "Uwagi"} value={note} onChange={setNote} required={correction} />
    {correction && <Hint>Korekta pozostaje w historii i wymaga dzisiejszej daty. Po wymianie licznika sprawdź również kilometrowe progi serwisowe — system nie zmienia ich sam.</Hint>}
  </Dialog>;
}

export function ServiceForm({ vehicle, onClose, onSaved, initialPlanId }: Props & { initialPlanId?: string }) {
  const initialPlan = vehicle.plans.find((p) => p.id === initialPlanId);
  const [kind, setKind] = useState<Extract<Command, { action: "service" }>["kind"]>(initialPlan?.kind === "inspection" ? "inspection" : initialPlan?.kind === "insurance" ? "insurance" : "service");
  const [date, setDate] = useState(fleetToday()); const [mileage, setMileage] = useState(vehicle.mileage); const [hours, setHours] = useState(vehicle.hours);
  const [inspectionResult, setInspectionResult] = useState<"passed" | "failed" | null>(null);
  const [title, setTitle] = useState(initialPlan?.title || ""); const [note, setNote] = useState(""); const [workshop, setWorkshop] = useState(""); const [parts, setParts] = useState("");
  const [cost, setCost] = useState<number | null>(null); const [currency, setCurrency] = useState<(typeof currencies)[number]>("PLN"); const [invoice, setInvoice] = useState(""); const [litres, setLitres] = useState<number | null>(null);
  const [selected, setSelected] = useState<string[]>(initialPlanId ? [initialPlanId] : []);
  type Completion = Extract<Command, { action: "service" }>["completions"][number];
  const [overrides, setOverrides] = useState<Record<string, Omit<Completion, "planId">>>({});
  const save = useSave(vehicle.id, onClose, onSaved);
  const change = (id: string, patch: Omit<Completion, "planId">) => setOverrides((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  return <Dialog wide title="Dodaj serwis, naprawę lub koszt" subtitle={`${vehicle.registration || vehicle.fleetNumber} • Jeden wpis może zamknąć kilka niezależnych czynności.`} onClose={save.close} busy={save.busy} error={save.error} progress={save.progress} onSubmit={() => save.submit((fileIds) => ({
    action: "service", vehicleId: vehicle.id, expectedVersion: vehicle.version, operationId: save.operationId,
    kind, occurredOn: date, mileage, hours, title, note, workshop, parts, cost, currency, invoiceNumber: invoice, litres, inspectionResult: kind === "inspection" ? inspectionResult : null,
    fileIds, completions: selected.map((planId) => ({ planId, ...overrides[planId] })),
  }))}>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Pick label="Rodzaj wpisu" value={kind} onChange={(v) => { setKind(v as typeof kind); setInspectionResult(null); if (["fuel", "note"].includes(v)) setSelected([]); }} options={options({ service: "Serwis okresowy", repair: "Naprawa", inspection: "Badanie techniczne", insurance: "Ubezpieczenie", fuel: "Tankowanie / ładowanie", note: "Notatka" })} /><Field label="Data wykonania" value={date} type="date" max={fleetToday()} required onChange={setDate} /><MeterFields vehicle={vehicle} mileage={mileage} hours={hours} setMileage={setMileage} setHours={setHours} /></div>
    {kind === "inspection" && <><Pick label="Wynik badania technicznego" value={inspectionResult || ""} onChange={(v) => { setInspectionResult(v ? v as "passed" | "failed" : null); if (v === "failed") setSelected([]); }} options={[{ value: "", label: "Wybierz wynik badania" }, { value: "passed", label: "Pozytywny" }, { value: "failed", label: "Negatywny — wyłącz pojazd z użytkowania" }]} />{inspectionResult === "failed" && <Hint>Negatywny wynik wyłączy pojazd z użytkowania i otworzy usterkę krytyczną. Nie przesunie terminu badania. Po naprawie wymagane jest osobne zamknięcie zgłoszenia i zmiana statusu przez administratora.</Hint>}</>}
    <Field label="Tytuł / co wykonano" value={title} onChange={setTitle} required placeholder="np. Olej, filtry i naprawa hamulców" />
    <TextArea label="Opis wykonanych prac" value={note} onChange={setNote} required placeholder="Zakres prac, wynik przeglądu, ustalenia, zalecenia…" />
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Warsztat / wykonawca" value={workshop} onChange={setWorkshop} /><Field label="Numer faktury" value={invoice} onChange={setInvoice} /></div>
    <TextArea label="Wymienione części / zastosowany olej i filtry" value={parts} onChange={setParts} />
    <div className="grid gap-4 sm:grid-cols-3"><Field label="Koszt brutto" value={cost} type="number" min={0} step="0.01" onChange={(v) => setCost(number(v))} /><Pick label="Waluta" value={currency} onChange={(v) => setCurrency(v as typeof currency)} options={currencies.map((v) => ({ value: v, label: v }))} />{kind === "fuel" && <Field label="Paliwo [l] (puste przy ładowaniu)" value={litres} type="number" min={0} step="0.01" onChange={(v) => setLitres(number(v))} />}</div>
    {!["fuel", "note"].includes(kind) && inspectionResult !== "failed" && <Section title="Zamknij wykonane czynności i ustal kolejne terminy">
      <p className="text-xs text-slate-600">Zaznacz tylko prace rzeczywiście wykonane. Pozostałe terminy nie zmienią się. Datę i przebieg kolejnego serwisu możesz zmienić ręcznie.</p>
      {vehicle.plans.filter((p) => !p.disabled).map((p) => {
        const checked = selected.includes(p.id); const override = overrides[p.id] || {};
        const nextDate = override.nextDate !== undefined ? override.nextDate : p.everyMonths ? addCalendarMonths(date, p.everyMonths) : null;
        const nextKm = override.nextKm !== undefined ? override.nextKm : p.everyKm !== null && mileage !== null ? mileage + p.everyKm : null;
        const nextHours = override.nextHours !== undefined ? override.nextHours : p.everyHours !== null && hours !== null ? Math.round((hours + p.everyHours) * 10) / 10 : null;
        return <div key={p.id} className={`rounded-xl border p-3 ${checked ? "border-orange-300 bg-orange-50/50" : "border-slate-200"}`}>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={checked} onChange={(e) => setSelected((all) => e.target.checked ? [...all, p.id] : all.filter((id) => id !== p.id))} />{p.title}</label>
          {checked && <div className="mt-3 space-y-2"><div className="grid gap-3 sm:grid-cols-3"><Field label="Kolejna data" value={nextDate} type="date" onChange={(s) => change(p.id, { nextDate: s || null })} />{["km", "both"].includes(vehicle.meterMode) && <Field label="Kolejny stan licznika [km]" value={nextKm} type="number" min={0} onChange={(s) => change(p.id, { nextKm: number(s) })} />}{["hours", "both"].includes(vehicle.meterMode) && <Field label="Kolejny stan [h]" value={nextHours} type="number" min={0} step="0.1" onChange={(s) => change(p.id, { nextHours: number(s) })} />}</div>{!nextDate && nextKm === null && nextHours === null && <p className="text-xs font-semibold text-amber-800">Nie ustalono następnego terminu. Po zapisie ta czynność będzie oznaczona „uzupełnij termin”.</p>}</div>}
        </div>;
      })}
    </Section>}
    <FilePicker files={save.files} setFiles={save.setFiles} kind="invoice" />
    <Hint>Sam wpis naprawy nie zamyka usterki i nie przywraca pojazdu do użytkowania. Zrób to osobno w zakładce „Usterki”, po sprawdzeniu pojazdu.</Hint>
  </Dialog>;
}

export function AssignmentForm({ vehicle, members, onClose, onSaved }: Props & { members: Member[] }) {
  const [driver, setDriver] = useState(vehicle.driverId || (vehicle.driverName ? "external" : "warehouse"));
  const [name, setName] = useState(vehicle.driverName); const [site, setSite] = useState(vehicle.site); const [location, setLocation] = useState(vehicle.location);
  const [mileage, setMileage] = useState(vehicle.mileage); const [hours, setHours] = useState(vehicle.hours); const [fuel, setFuel] = useState<number | null>(null);
  const [checks, setChecks] = useState<string[]>([]); const [note, setNote] = useState(""); const save = useSave(vehicle.id, onClose, onSaved);
  const warnings = vehicleAlerts(vehicle);
  return <Dialog title="Przekazanie / zwrot pojazdu" subtitle={`${vehicle.registration || vehicle.fleetNumber} • Obecnie: ${vehicle.driverName || "bez użytkownika"}`} onClose={save.close} busy={save.busy} error={save.error} progress={save.progress} onSubmit={() => save.submit((fileIds) => ({ action: "assignment", vehicleId: vehicle.id, expectedVersion: vehicle.version, operationId: save.operationId,
    occurredOn: fleetToday(), mileage, hours, driverId: ["warehouse", "external"].includes(driver) ? null : driver,
    driverName: driver === "warehouse" ? "" : driver === "external" ? name : members.find((m) => m.userId === driver)?.displayName || "", site, location, fuelLevel: fuel, checks, note, fileIds }))}>
    {(warnings.due > 0 || warnings.missing > 0) && <Hint>Ten pojazd ma terminy wymagające sprawdzenia lub uzupełnienia. Zapis przekazania nie jest potwierdzeniem dopuszczenia pojazdu do ruchu.</Hint>}
    <Pick label="Nowy użytkownik / zwrot" value={driver} onChange={setDriver} options={[{ value: "warehouse", label: "Zwrot — bez użytkownika" }, ...members.filter((m) => m.active).map((m) => ({ value: m.userId, label: m.displayName })), { value: "external", label: "Inna osoba — wpisz ręcznie (bez konta)" }]} />
    {driver === "external" && <><Field label="Imię i nazwisko osoby bez konta" value={name} onChange={setName} required /><p className="text-xs text-slate-500">Ta osoba nie będzie mogła samodzielnie zapisywać przebiegu. Aby mogła, administrator musi utworzyć jej konto.</p></>}
    <div className="grid gap-4 sm:grid-cols-3"><MeterFields vehicle={vehicle} mileage={mileage} hours={hours} setMileage={setMileage} setHours={setHours} required /><Field label="Poziom paliwa [%]" value={fuel} type="number" min={0} max={100} onChange={(v) => setFuel(number(v))} /></div>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Budowa / projekt" value={site} onChange={setSite} /><Field label="Lokalizacja" value={location} onChange={setLocation} /></div>
    <Section title="Odnotowane wyposażenie"><div className="grid gap-2 sm:grid-cols-2">{["Kluczyki", "Dokumenty pojazdu", "Trójkąt", "Kamizelka", "Apteczka", "Gaśnica"].map((key) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checks.includes(key)} onChange={(e) => setChecks((all) => e.target.checked ? [...all, key] : all.filter((v) => v !== key))} />{key}</label>)}</div></Section>
    <TextArea label="Stan pojazdu, braki i uwagi" value={note} onChange={setNote} />
    <FilePicker files={save.files} setFiles={save.setFiles} kind="damage" />
    <p className="text-xs text-slate-500">Zapisze się dzisiejsza data, poprzedni i nowy użytkownik, liczniki oraz stan pojazdu. Jest to wpis administratora, nie elektroniczny podpis kierowcy.</p>
  </Dialog>;
}

export function DefectForm({ vehicle, onClose, onSaved, resolveId }: Props & { resolveId?: string }) {
  const [note, setNote] = useState(""); const [severity, setSeverity] = useState<"low" | "normal" | "critical">("normal"); const save = useSave(vehicle.id, onClose, onSaved);
  const original = vehicle.defects.find((d) => d.id === resolveId);
  return <Dialog title={resolveId ? "Zamknij usterkę" : "Zgłoś usterkę"} subtitle={vehicle.registration || vehicle.fleetNumber} onClose={save.close} busy={save.busy} error={save.error} progress={save.progress} onSubmit={() => save.submit((fileIds) => resolveId ? {
    action: "resolve", vehicleId: vehicle.id, expectedVersion: vehicle.version, operationId: save.operationId, defectId: resolveId, note, fileIds,
  } : { action: "defect", vehicleId: vehicle.id, expectedVersion: vehicle.version, operationId: save.operationId, note, severity, fileIds })}>
    {original && <Hint>Zgłoszenie: {original.note}</Hint>}
    {!resolveId && <Pick label="Priorytet" value={severity} onChange={(s) => setSeverity(s as typeof severity)} options={options({ low: "Niski — do zaplanowania", normal: "Zwykły — wymaga reakcji", critical: "Krytyczny — wyłącz pojazd z użytkowania" })} />}
    <TextArea label={resolveId ? "Jak usunięto usterkę / wynik sprawdzenia" : "Co się stało?"} value={note} onChange={setNote} required />
    {severity === "critical" && !resolveId && <Hint>Zgłoszenie automatycznie oznaczy pojazd jako „Wyłączony z użytkowania”. Przywrócenie będzie możliwe tylko dla administratora po zamknięciu krytycznych usterek.</Hint>}
    <FilePicker files={save.files} setFiles={save.setFiles} kind="damage" />
  </Dialog>;
}
export function StatusForm({ vehicle, onClose, onSaved }: Props) {
  const [status, setStatus] = useState<Extract<Command, { action: "status" }>["status"]>(["in_use", "archived"].includes(vehicle.status) ? "available" : vehicle.status as Extract<Command, { action: "status" }>["status"]);
  const [reason, setReason] = useState(""); const save = useSave(vehicle.id, onClose, onSaved);
  return <Dialog title="Zmień status / archiwizuj" subtitle={vehicle.registration || vehicle.fleetNumber} onClose={save.close} busy={save.busy} error={save.error} onSubmit={() => save.submit(() => ({ action: "status", vehicleId: vehicle.id, expectedVersion: vehicle.version, operationId: save.operationId, status, reason }))}>
    <Pick label="Nowy status" value={status} onChange={(s) => setStatus(s as typeof status)} options={options({ available: "Gotowy do użytkowania / przywróć z archiwum", in_service: "W serwisie", out_of_service: "Wyłączony z użytkowania", archived: "Archiwum — sprzedany / wycofany" })} />
    <TextArea label="Powód zmiany / podstawa przywrócenia" value={reason} onChange={setReason} required />
    <Hint>Archiwizacja nie usuwa pojazdu, faktur ani historii. Przed archiwizacją zapisz jego zwrot od kierowcy.</Hint>
  </Dialog>;
}
export function DocumentsForm({ vehicle, onClose, onSaved, initialKind = "photo" }: Props & { initialKind?: FleetFile["kind"] }) {
  const [kind, setKind] = useState<FleetFile["kind"]>(initialKind); const [title, setTitle] = useState(initialKind === "photo" ? "Zdjęcia pojazdu" : "Dokumenty pojazdu"); const save = useSave(vehicle.id, onClose, onSaved);
  return <Dialog title="Dodaj zdjęcia lub dokumenty" subtitle={vehicle.registration || vehicle.fleetNumber} onClose={save.close} busy={save.busy} error={save.error} progress={save.progress} onSubmit={() => save.submit((fileIds) => ({ action: "documents", vehicleId: vehicle.id, expectedVersion: vehicle.version, operationId: save.operationId, title, fileIds }))}>
    <Pick label="Rodzaj plików" value={kind} disabled={save.files.length > 0} onChange={(s) => setKind(s as FleetFile["kind"])} options={options(labels.file)} />
    <Field label="Opis dokumentów" value={title} onChange={setTitle} required />
    <FilePicker key={kind} files={save.files} setFiles={save.setFiles} kind={kind} />
    <Hint>Faktury i dokumenty zobaczy tylko administrator. Zdjęcia pojazdu i uszkodzeń są widoczne dla użytkowników modułu.</Hint>
  </Dialog>;
}
export function VoidForm({ vehicle, event, onClose, onSaved }: Props & { event: Event }) {
  const [reason, setReason] = useState(""); const save = useSave(vehicle.id, onClose, onSaved);
  return <Dialog title="Unieważnij błędny wpis" subtitle={event.title} onClose={save.close} busy={save.busy} error={save.error} onSubmit={() => save.submit(() => ({ action: "void", vehicleId: vehicle.id, expectedVersion: vehicle.version, operationId: save.operationId, eventId: event.id, reason }))}>
    <Hint>Wpis i załączniki pozostaną w historii jako unieważnione. Koszt nie będzie liczony w podsumowaniu. Terminy, stan licznika i kierowca nie zostaną automatycznie cofnięte — sprawdź je po korekcie.</Hint>
    <TextArea label="Powód unieważnienia (minimum 5 znaków)" value={reason} onChange={setReason} required />
  </Dialog>;
}
