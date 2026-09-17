"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AlertTriangle, ArrowLeft, ArrowRightLeft, CalendarClock, Car, CheckCircle2, Download, FileText, Gauge, Image as ImageIcon, Link as LinkIcon, Loader2, LogOut, MapPin, Plus, Printer, RefreshCw, Search, ShieldCheck, UserRound, Wrench } from "lucide-react";
import { api, fleetClient } from "@/lib/fleet/client";
import { costTotals, csv, downloadText, fleetToday, fmtDate, fmtNumber, vehicleAlerts } from "@/lib/fleet/logic";
import { printVehicle } from "@/lib/fleet/print";
import type { Event, FleetDetail, FleetFile, FleetList, Member, Vehicle } from "@/lib/fleet/schema";
import { Action, Chip, Dialog, ErrorBox, Field, FilePreview, Hint, labels, options, Pick, PlanStatus, Section } from "./ui";
import { AssignmentForm, DefectForm, DocumentsForm, MeterForm, PlansForm, ServiceForm, StatusForm, VehicleForm, VoidForm } from "./forms";

type Modal = { type: "new" | "edit" | "plans" | "meter" | "service" | "assignment" | "defect" | "resolve" | "status" | "documents" | "void" | "members"; ref?: string } | null;

export default function FleetApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [authError, setAuthError] = useState(""); const [recovery, setRecovery] = useState(false);
  const [list, setList] = useState<FleetList | null>(null); const [detail, setDetail] = useState<FleetDetail | null>(null);
  const [selectedId, setSelectedId] = useState(""); const [loading, setLoading] = useState(false); const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(""); const [toast, setToast] = useState(""); const [modal, setModal] = useState<Modal>(null);
  const [preview, setPreview] = useState<FleetFile | null>(null);
  const [query, setQuery] = useState(""); const [filter, setFilter] = useState("all"); const [kind, setKind] = useState(""); const [driver, setDriver] = useState(""); const [sort, setSort] = useState("alerts");
  const identity = useRef(""); const requestNo = useRef(0); const initialId = useRef("");

  useEffect(() => {
    initialId.current = new URLSearchParams(window.location.search).get("vehicle") || "";
    let mounted = true;
    try {
      const client = fleetClient();
      void client.auth.getSession().then(({ data, error }) => { if (mounted) { setSession(data.session); if (error) setAuthError(error.message); } });
      const { data } = client.auth.onAuthStateChange((event, next) => { if (mounted) { setSession(next); if (event === "PASSWORD_RECOVERY") setRecovery(true); } });
      return () => { mounted = false; data.subscription.unsubscribe(); };
    } catch (e) { setAuthError(e instanceof Error ? e.message : "Brak konfiguracji."); setSession(null); }
  }, []);

  const loadList = useCallback(async () => {
    const userId = identity.current; if (!userId) return; setLoading(true);
    try {
      const result = await api<FleetList>();
      if (identity.current === userId) { setList(result); setError(""); }
    } catch (e) { if (identity.current === userId) setError(e instanceof Error ? e.message : "Błąd pobierania floty."); }
    finally { if (identity.current === userId) setLoading(false); }
  }, []);
  const loadDetail = useCallback(async (id: string) => {
    const n = ++requestNo.current; const userId = identity.current;
    if (!id || !userId) { setDetail(null); return; }
    setDetailLoading(true);
    try {
      const next = await api<FleetDetail>(`?vehicleId=${id}`);
      if (n === requestNo.current && identity.current === userId) { setDetail(next); setError(""); }
    } catch (e) { if (n === requestNo.current && identity.current === userId) { setDetail(null); setError(e instanceof Error ? e.message : "Błąd pobierania karty pojazdu."); } }
    finally { if (n === requestNo.current) setDetailLoading(false); }
  }, []);
  useEffect(() => {
    const id = session?.user.id || "";
    if (identity.current !== id) {
      identity.current = id; requestNo.current++; setList(null); setDetail(null); setSelectedId(""); setModal(null); setPreview(null); setError("");
      if (id) { void loadList(); if (initialId.current) setSelectedId(initialId.current); }
    }
  }, [session?.user.id, loadList]);
  useEffect(() => { if (selectedId) void loadDetail(selectedId); else { requestNo.current++; setDetail(null); } }, [selectedId, loadDetail]);
  useEffect(() => {
    if (!session || modal) return;
    const refresh = () => { if (document.visibilityState === "visible") { void loadList(); if (selectedId) void loadDetail(selectedId); } };
    const timer = setInterval(refresh, 60_000); window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [session, modal, selectedId, loadList, loadDetail]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 5000); return () => clearTimeout(t); } }, [toast]);

  function select(id: string) {
    setSelectedId(id); setDetail(null);
    const url = new URL(window.location.href); if (id) url.searchParams.set("vehicle", id); else url.searchParams.delete("vehicle");
    window.history.replaceState({}, "", url);
  }
  function saved(id: string) {
    setModal(null); setToast("Zapis potwierdzony w bazie danych."); void loadList();
    if (selectedId === id) void loadDetail(id); else select(id);
  }
  async function logout() {
    const result = await fleetClient().auth.signOut({ scope: "local" });
    if (result.error) setError(result.error.message);
    else { identity.current = ""; setSession(null); setList(null); setDetail(null); setModal(null); setPreview(null); }
  }
  const active = (list?.vehicles || []).filter((v) => v.status !== "archived");
  const stats = { all: active.length, due: active.filter((v) => vehicleAlerts(v).due > 0).length, soon: active.filter((v) => vehicleAlerts(v).soon > 0).length,
    defect: active.filter((v) => vehicleAlerts(v).defects > 0 || v.status === "out_of_service").length,
    missing: active.filter((v) => { const a = vehicleAlerts(v); return a.missing > 0 || a.stale; }).length };
  const filtered = useMemo(() => {
    const text = query.toLocaleLowerCase("pl").trim();
    const rank = (v: Vehicle) => { const a = vehicleAlerts(v); return a.defects * 80 + a.due * 50 + a.soon * 10 + a.missing + (a.stale ? 1 : 0); };
    return (list?.vehicles || []).filter((v) => {
      const a = vehicleAlerts(v);
      const filterMatch = filter === "archive" ? v.status === "archived" : v.status !== "archived" && (filter === "all" || filter === "due" && a.due > 0 || filter === "soon" && a.soon > 0 || filter === "defect" && (a.defects > 0 || v.status === "out_of_service") || filter === "missing" && (a.missing > 0 || a.stale) || filter === "mine" && v.driverId === list?.me.userId);
      return filterMatch && (!kind || kind === v.kind) && (!driver || (driver === "unassigned" ? !v.driverName : v.driverName === driver)) &&
        `${v.registration} ${v.fleetNumber} ${v.vin} ${v.make} ${v.model} ${v.driverName} ${v.site} ${v.location}`.toLocaleLowerCase("pl").includes(text);
    }).sort((a, b) => sort === "mileage" ? (b.mileage ?? -1) - (a.mileage ?? -1) : sort === "updated" ? b.updatedAt.localeCompare(a.updatedAt) :
      (sort === "alerts" ? rank(b) - rank(a) : 0) || (a.registration || a.fleetNumber).localeCompare(b.registration || b.fleetNumber, "pl", { numeric: true }));
  }, [list, query, filter, kind, driver, sort]);
  const me = list?.me;
  function exportVehicles() {
    const rows = [["Numer rejestracyjny", "Numer flotowy", "Marka", "Model", "VIN", "Rodzaj", "Status", "Użytkownik", "Budowa", "Lokalizacja", "Przebieg km", "Data odczytu km", "Motogodziny", "Data odczytu h", "Terminy osiągnięte", "Terminy wkrótce", "Braki terminów"] as unknown[],
      ...filtered.map((v) => { const a = vehicleAlerts(v); return [v.registration, v.fleetNumber, v.make, v.model, v.vin, labels.kind[v.kind], labels.status[v.status], v.driverName, v.site, v.location, v.mileage, v.mileageDate, v.hours, v.hoursDate, a.due, a.soon, a.missing]; })];
    downloadText(csv(rows), `acc-bau-pojazdy-${fleetToday()}.csv`, "text/csv;charset=utf-8");
  }
  return <div className="min-h-screen bg-slate-100 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <a href="/" className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-sm font-black text-white">ACC</span><span><span className="block text-lg font-black tracking-tight">ACC BAU TOOLS</span><span className="block text-xs text-slate-500">Sprzęt • BHP • Pojazdy</span></span></a>
      <nav aria-label="Moduły" className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold"><a className="rounded-lg px-3 py-2 hover:bg-white" href="/?module=tools">Narzędzia</a><a className="rounded-lg px-3 py-2 hover:bg-white" href="/?module=ppe">BHP / PPE</a><a className="rounded-lg bg-white px-3 py-2 text-orange-700 shadow-sm" aria-current="page" href="/vehicles">Pojazdy</a></nav>
      {session && <div className="flex items-center gap-3"><div className="text-right text-xs"><p className="font-semibold">{me?.displayName || session.user.email}</p><p className="text-slate-500">{me?.role === "admin" ? "Administrator floty" : me ? "Pracownik" : "Konto Pojazdy"}</p></div><Action variant="secondary" onClick={() => void logout()} title="Wyloguj z Pojazdów"><LogOut size={16} /></Action></div>}
    </div></header>
    <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
      {session === undefined ? <div className="p-12 text-center"><Loader2 className="mx-auto animate-spin" />Sprawdzanie sesji…</div> : !session ? <FleetLogin externalError={authError} /> : <>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Zarządzanie flotą</p><h1 className="mt-1 text-3xl font-black tracking-tight">Pojazdy</h1><p className="mt-1 text-sm text-slate-500">Kto używa, co wykonano i kiedy trzeba zareagować.</p></div><div className="flex flex-wrap gap-2"><Action variant="secondary" onClick={() => { void loadList(); if (selectedId) void loadDetail(selectedId); }} disabled={loading}><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Odśwież</Action>{me && <Action variant="secondary" onClick={exportVehicles}><Download size={16} />CSV floty</Action>}{me?.role === "admin" && <><Action variant="secondary" onClick={() => setModal({ type: "members" })}><UserRound size={16} />Konta</Action><Action onClick={() => setModal({ type: "new" })}><Plus size={16} />Dodaj pojazd</Action></>}</div></div>
        {error && <div className="mb-4"><ErrorBox>{error}{list ? "\nLista może pokazywać ostatnio pobrane dane. Nie zapisujemy zmian lokalnie w zastępstwie bazy." : ""}</ErrorBox></div>}
        {toast && <div role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={18} />{toast}</div>}
        {!list && loading && <p className="p-10 text-center text-slate-500">Pobieranie floty…</p>}
        {list && <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{([
            ["all", "Aktywne pojazdy", stats.all, Car], ["due", "Termin osiągnięty", stats.due, AlertTriangle], ["soon", "Wkrótce", stats.soon, CalendarClock], ["defect", "Usterki / wyłączone", stats.defect, Wrench], ["missing", "Uzupełnij dane", stats.missing, Gauge],
          ] as const).map(([key, title, count, Icon]) => <button key={key} onClick={() => setFilter(filter === key ? "all" : key)} className={`rounded-2xl border p-4 text-left transition hover:shadow-md ${filter === key ? "border-orange-400 bg-orange-50" : "border-slate-200 bg-white"}`}><div className="mb-3 flex items-center justify-between gap-2 text-slate-500"><span className="text-xs font-semibold">{title}</span><Icon size={18} /></div><span className={`text-3xl font-black ${key === "due" && count > 0 || key === "defect" && count > 0 ? "text-red-700" : "text-slate-900"}`}>{count}</span><span className="ml-2 text-xs text-slate-400">pojazdów</span></button>)}</div>
          <div className="my-5 flex flex-wrap items-center gap-2"><Action variant={filter === "mine" ? "primary" : "secondary"} onClick={() => setFilter(filter === "mine" ? "all" : "mine")}><UserRound size={15} />Moje pojazdy</Action><Action variant={filter === "archive" ? "primary" : "secondary"} onClick={() => setFilter(filter === "archive" ? "all" : "archive")}>Archiwum</Action><p className="ml-auto text-xs text-slate-500">Alarmy w aplikacji • bez automatycznych e-maili/SMS</p></div>
          <section className="grid items-start gap-5 xl:grid-cols-[350px_minmax(0,1fr)]">
            <div className={`${selectedId ? "hidden xl:block" : "block"} rounded-2xl border border-slate-200 bg-white p-4`}>
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5"><Search size={16} className="text-slate-400" /><input aria-label="Szukaj pojazdu" className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Rejestracja, kierowca, VIN, budowa…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3"><Pick label="Rodzaj" value={kind} onChange={setKind} options={[{ value: "", label: "Wszystkie" }, ...options(labels.kind)]} /><Pick label="Użytkownik" value={driver} onChange={setDriver} options={[{ value: "", label: "Wszyscy" }, { value: "unassigned", label: "Bez użytkownika" }, ...Array.from(new Set(list.vehicles.map((v) => v.driverName).filter(Boolean))).sort().map((name) => ({ value: name, label: name }))]} /></div>
              <div className="mt-3"><Pick label="Sortowanie" value={sort} onChange={setSort} options={options({ alerts: "Najpierw wymagające reakcji", registration: "Rejestracja / numer", mileage: "Największy przebieg", updated: "Ostatnio aktualizowane" })} /></div>
              <div className="my-4 flex items-center justify-between text-xs text-slate-500"><span>{filtered.length} pojazdów</span>{filter !== "all" && <button className="font-semibold text-orange-700" onClick={() => setFilter("all")}>Usuń filtr alarmów</button>}</div>
              <div className="space-y-2 xl:max-h-[68vh] xl:overflow-y-auto">{filtered.map((vehicle) => <VehicleRow key={vehicle.id} vehicle={vehicle} selected={selectedId === vehicle.id} onClick={() => select(vehicle.id)} />)}
                {!filtered.length && <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">{list.vehicles.length ? "Brak pojazdów dla tych filtrów." : "Nie dodano jeszcze żadnego pojazdu."}{!list.vehicles.length && me?.role === "admin" && <div className="mt-3"><Action onClick={() => setModal({ type: "new" })}><Plus size={16} />Dodaj pierwszy pojazd</Action></div>}</div>}
              </div>
            </div>
            <div className={`${selectedId ? "block" : "hidden xl:block"} min-w-0`}>
              {selectedId && <div className="mb-3 xl:hidden"><Action variant="secondary" onClick={() => select("")}><ArrowLeft size={16} />Lista pojazdów</Action></div>}
              {detailLoading && !detail ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Ładowanie karty…</div> : detail && me ? <VehicleDetail key={detail.vehicle.id} detail={detail} me={me} onModal={setModal} onPreview={setPreview} onError={setError} /> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><Car className="mx-auto mb-4 h-12 w-12 text-slate-300" /><h2 className="font-bold">Wybierz pojazd z listy</h2><p className="mt-2 text-sm text-slate-500">Zobaczysz jego użytkownika, terminy, przebieg, zdjęcia i pełną historię.</p></div>}
            </div>
          </section>
        </>}
      </>}
    </main>
    {recovery && session && <PasswordReset onClose={() => setRecovery(false)} />}
    {modal?.type === "new" && me?.role === "admin" && <VehicleForm onClose={() => setModal(null)} onSaved={saved} />}
    {modal?.type === "members" && me?.role === "admin" && list && <Dialog title="Konta użytkowników Pojazdów" onClose={() => setModal(null)}><Hint>Moduł korzysta z kont Supabase Auth, nie z PIN-ów starej narzędziowni. Instrukcja dodania kont i uprawnień jest w pliku START-POJAZDY.md. Osobę bez konta można przypisać ręcznie, ale nie będzie mogła zapisywać odczytów.</Hint><div className="divide-y divide-slate-200">{list.members.map((m) => <div key={m.userId} className="flex items-center justify-between py-3"><span>{m.displayName}</span><Chip tone={m.active ? "neutral" : "red"}>{m.active ? m.role === "admin" ? "Administrator" : "Pracownik" : "Nieaktywny"}</Chip></div>)}</div></Dialog>}
    {detail && me && modal && <>
      {modal.type === "edit" && <VehicleForm vehicle={detail.vehicle} onClose={() => setModal(null)} onSaved={saved} />}
      {modal.type === "plans" && <PlansForm vehicle={detail.vehicle} onClose={() => setModal(null)} onSaved={saved} />}
      {modal.type === "meter" && <MeterForm me={me} vehicle={detail.vehicle} onClose={() => setModal(null)} onSaved={saved} />}
      {modal.type === "service" && <ServiceForm vehicle={detail.vehicle} initialPlanId={modal.ref} onClose={() => setModal(null)} onSaved={saved} />}
      {modal.type === "assignment" && <AssignmentForm vehicle={detail.vehicle} members={list?.members || []} onClose={() => setModal(null)} onSaved={saved} />}
      {(modal.type === "defect" || modal.type === "resolve") && <DefectForm vehicle={detail.vehicle} resolveId={modal.type === "resolve" ? modal.ref : undefined} onClose={() => setModal(null)} onSaved={saved} />}
      {modal.type === "status" && <StatusForm vehicle={detail.vehicle} onClose={() => setModal(null)} onSaved={saved} />}
      {modal.type === "documents" && <DocumentsForm vehicle={detail.vehicle} onClose={() => setModal(null)} onSaved={saved} />}
      {modal.type === "void" && detail.events.some((e) => e.id === modal.ref) && <VoidForm vehicle={detail.vehicle} event={detail.events.find((e) => e.id === modal.ref)!} onClose={() => setModal(null)} onSaved={saved} />}
    </>}
    {preview && <FilePreview file={preview} onClose={() => setPreview(null)} />}
  </div>;
}

function FleetLogin({ externalError }: { externalError: string }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  async function login(e: React.FormEvent) {
    e.preventDefault(); if (busy) return; setBusy(true); setError("");
    try { const result = await fleetClient().auth.signInWithPassword({ email: email.trim(), password }); if (result.error) throw new Error("Nie udało się zalogować. Sprawdź e-mail, hasło i aktywację konta."); }
    catch (e) { setError(e instanceof Error ? e.message : "Błąd logowania."); } finally { setBusy(false); }
  }
  async function reset() {
    if (!email.includes("@")) { setError("Najpierw wpisz swój adres e-mail."); return; }
    setBusy(true); setError("");
    try { const result = await fleetClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/vehicles` }); if (result.error) throw result.error; setMessage("Jeżeli adres ma konto, otrzymasz wiadomość z linkiem do ustawienia hasła."); }
    catch { setError("Nie udało się wysłać linku. Sprawdź konfigurację poczty i adres przekierowania w Supabase."); } finally { setBusy(false); }
  }
  return <div className="mx-auto mt-8 max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-700"><ShieldCheck size={24} /></div><h1 className="text-2xl font-black">Zaloguj się do Pojazdów</h1><p className="mt-2 text-sm leading-6 text-slate-500">Historia floty, prywatne dokumenty i faktury. Użyj konta e-mail utworzonego przez administratora.</p>
    <form onSubmit={login} className="mt-6 space-y-4"><Field label="E-mail" value={email} type="email" autoComplete="username" onChange={setEmail} required /><Field label="Hasło" value={password} type="password" autoComplete="current-password" onChange={setPassword} required />
      {(externalError || error) && <ErrorBox>{externalError || error}</ErrorBox>}{message && <Hint>{message}</Hint>}
      <Action type="submit" disabled={busy || !!externalError} className="w-full">{busy && <Loader2 size={16} className="animate-spin" />}Zaloguj</Action><button disabled={busy} type="button" onClick={() => void reset()} className="text-sm font-semibold text-orange-700 underline">Nie pamiętam hasła</button>
    </form><p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">PIN z Narzędzi/BHP nie jest hasłem do floty. Dotychczasowe moduły działają bez zmiany logowania.</p>
  </div>;
}
function PasswordReset({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState(""); const [repeat, setRepeat] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  return <Dialog title="Ustaw nowe hasło" onClose={onClose} busy={busy} error={error} onSubmit={async () => {
    if (password.length < 12 || password !== repeat) { setError("Hasła muszą być identyczne i mieć co najmniej 12 znaków."); return; }
    setBusy(true); setError("");
    try { const result = await fleetClient().auth.updateUser({ password }); if (result.error) throw result.error; onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : "Nie udało się zmienić hasła."); }
    finally { setBusy(false); }
  }}><Field label="Nowe hasło (minimum 12 znaków)" value={password} type="password" autoComplete="new-password" required onChange={setPassword} /><Field label="Powtórz hasło" value={repeat} type="password" autoComplete="new-password" required onChange={setRepeat} /></Dialog>;
}
function VehicleRow({ vehicle: v, selected, onClick }: { vehicle: Vehicle; selected: boolean; onClick: () => void }) {
  const a = vehicleAlerts(v);
  return <button onClick={onClick} className={`w-full rounded-xl border p-3 text-left transition hover:border-orange-300 ${selected ? "border-orange-400 bg-orange-50" : "border-slate-200 bg-white"}`}>
    <div className="flex items-start justify-between gap-2"><div><p className="font-black tracking-wide">{v.registration || v.fleetNumber}</p><p className="mt-0.5 text-xs text-slate-500">{v.make} {v.model}</p></div><Car size={22} className="text-slate-400" /></div>
    <p className="mt-3 flex items-center gap-1.5 truncate text-xs text-slate-600"><UserRound size={13} />{v.driverName || "Bez użytkownika"}</p>
    <div className="mt-2 flex flex-wrap gap-1"><Chip tone={v.status === "out_of_service" ? "red" : "neutral"}>{labels.status[v.status]}</Chip>{a.due > 0 && <Chip tone="red">Terminy: {a.due}</Chip>}{a.due === 0 && a.soon > 0 && <Chip tone="amber">Wkrótce: {a.soon}</Chip>}{a.stale && <Chip tone="amber">Sprawdź licznik</Chip>}</div>
  </button>;
}

function VehicleDetail({ detail, me, onModal, onPreview, onError }: { detail: FleetDetail; me: Member; onModal: (m: Modal) => void; onPreview: (f: FleetFile) => void; onError: (s: string) => void }) {
  const { vehicle: v, events, files } = detail; const admin = me.role === "admin"; const writable = v.status !== "archived"; const operator = admin || v.driverId === me.userId;
  const [tab, setTab] = useState("overview"); const [historyType, setHistoryType] = useState(""); const [historyQuery, setHistoryQuery] = useState(""); const [historyLimit, setHistoryLimit] = useState(40); const [year, setYear] = useState("");
  const alerts = vehicleAlerts(v);
  const history = events.filter((e) => (!historyType || e.kind === historyType) && `${e.title} ${e.note} ${e.workshop} ${e.invoiceNumber}`.toLocaleLowerCase("pl").includes(historyQuery.toLocaleLowerCase("pl")));
  const costEvents = events.filter((e) => e.cost !== null && (!year || e.occurredOn.startsWith(year)));
  const totals = costTotals(costEvents);
  const fileMap = new Map(files.map((file) => [file.id, file]));
  function exportHistory() {
    const headers = ["Data wykonania", "Zapisano", "Rodzaj", "Tytuł", "Opis", "Przebieg km", "Motogodziny", "Autor", "Od", "Do", "Unieważniony"];
    if (admin) headers.push("Koszt brutto", "Waluta", "Numer faktury", "Warsztat", "Części");
    const rows: unknown[][] = [headers, ...history.map((e) => [e.occurredOn, e.createdAt, labels.event[e.kind], e.title, e.note, e.mileage, e.hours, e.actorName, e.fromDriver, e.toDriver, e.voidedAt ? "TAK" : "", ...(admin ? [e.cost, e.currency, e.invoiceNumber, e.workshop, e.parts] : [])])];
    downloadText(csv(rows), `historia-${(v.registration || v.fleetNumber).replace(/[^a-zA-Z0-9-]/g, "_")}-${fleetToday()}.csv`, "text/csv;charset=utf-8");
  }
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div className="border-b border-slate-200 p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-black tracking-wide">{v.registration || v.fleetNumber}</h2><Chip tone={v.status === "out_of_service" ? "red" : v.status === "in_use" ? "green" : "neutral"}>{labels.status[v.status]}</Chip></div><p className="mt-1 text-sm text-slate-600">{v.make} {v.model} {v.year ? `• ${v.year}` : ""} • {labels.kind[v.kind]}</p><p className="mt-1 text-xs text-slate-400">{v.fleetNumber ? `Flota: ${v.fleetNumber} • ` : ""}Wersja {v.version}</p></div><div className="flex gap-1"><Action variant="secondary" title="Kopiuj link do karty" onClick={() => { void navigator.clipboard.writeText(`${window.location.origin}/vehicles?vehicle=${v.id}`).catch(() => onError("Nie udało się skopiować linku. Skopiuj adres z paska przeglądarki.")); }}><LinkIcon size={16} /></Action><Action variant="secondary" title="Drukuj kartę / zapisz PDF" onClick={() => { try { printVehicle(v, events, admin); } catch (e) { onError((e as Error).message); } }}><Printer size={16} /></Action></div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3"><DataTile icon={<UserRound size={18} />} label="Aktualny użytkownik" value={v.driverName || "Bez użytkownika"} sub={v.site || "Budowa nieuzupełniona"} />
        {["km", "both"].includes(v.meterMode) && <DataTile icon={<Gauge size={18} />} label="Przebieg" value={`${fmtNumber(v.mileage)} km`} sub={`Odczyt: ${fmtDate(v.mileageDate)}`} />}
        {["hours", "both"].includes(v.meterMode) ? <DataTile icon={<Gauge size={18} />} label="Motogodziny" value={`${fmtNumber(v.hours, 1)} h`} sub={`Odczyt: ${fmtDate(v.hoursDate)}`} /> : <DataTile icon={<MapPin size={18} />} label="Lokalizacja" value={v.location || "Nieuzupełniona"} sub="Wpis ręczny — nie lokalizacja GPS" />}
      </div>
      {alerts.stale && <div className="mt-3"><Hint>Licznik nie był aktualizowany przez ponad 14 dni lub nie ma odczytu. Alarmy kilometrowe i motogodzinowe mogą nie odzwierciedlać rzeczywistego zużycia.</Hint></div>}
      <div className="mt-5 flex flex-wrap gap-2">{operator && writable && v.meterMode !== "none" && <Action onClick={() => onModal({ type: "meter" })}><Gauge size={16} />Licznik</Action>}{admin && writable && <><Action onClick={() => onModal({ type: "service" })}><Wrench size={16} />Serwis / naprawa</Action><Action variant="secondary" onClick={() => onModal({ type: "assignment" })}><ArrowRightLeft size={16} />Przekaż / zwróć</Action></>}{operator && writable && <Action variant="danger" onClick={() => onModal({ type: "defect" })}><AlertTriangle size={16} />Zgłoś usterkę</Action>}{admin && <Action variant="secondary" onClick={() => onModal({ type: "status" })}>{writable ? "Status / archiwum" : "Przywróć pojazd"}</Action>}</div>
    </div>
    <nav aria-label="Karta pojazdu" className="flex overflow-x-auto border-b border-slate-200 px-4 text-sm font-semibold">{[["overview", "Dane i zdjęcia"], ["plans", `Terminy (${v.plans.length})`], ["history", "Historia"], ["files", `Dokumenty (${files.length})`], ["defects", `Usterki (${alerts.defects})`], ...(admin ? [["costs", "Koszty"]] : [])].map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`shrink-0 border-b-2 px-3 py-4 ${tab === id ? "border-orange-500 text-orange-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{label}</button>)}</nav>
    <div className="space-y-5 p-5 sm:p-6">
      {tab === "overview" && <><div className="flex flex-wrap justify-end gap-2">{admin && writable && <><Action variant="secondary" onClick={() => onModal({ type: "edit" })}>Edytuj dane</Action><Action variant="secondary" onClick={() => onModal({ type: "documents" })}><ImageIcon size={16} />Dodaj zdjęcia / dokumenty</Action></>}</div>
        <div className="grid gap-3 sm:grid-cols-2">{[
          ["VIN", v.vin], ["Numer flotowy", v.fleetNumber], ["Firma", v.company], ["Kraj rejestracji", v.country], ["Forma użytkowania", labels.ownership[v.ownership]], ["Napęd", labels.fuel[v.fuel]], ["Pierwsza rejestracja", fmtDate(v.firstRegistration)], ["Silnik", v.engine], ["Moc", v.powerKw === null ? "" : `${fmtNumber(v.powerKw, 1)} kW`], ["DMC", v.grossWeightKg === null ? "" : `${fmtNumber(v.grossWeightKg)} kg`], ["Olej", `${v.oilSpec}${v.oilLitres !== null ? ` • ${fmtNumber(v.oilLitres, 1)} l` : ""}`], ["Opony", v.tireSize], ["Budowa / projekt", v.site], ["Lokalizacja", v.location],
        ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-semibold">{value || "—"}</p></div>)}</div>
        {admin && v.notes && <Section title="Uwagi administracyjne"><p className="whitespace-pre-line text-sm text-slate-700">{v.notes}</p></Section>}
        <Section title="Zdjęcia pojazdu"><PhotoGrid files={files.filter((f) => f.kind === "photo")} onPreview={onPreview} /></Section>
      </>}
      {tab === "plans" && <><div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-lg text-xs text-slate-500">Termin jest osiągnięty, gdy upłynie data lub licznik dojdzie do wyznaczonej wartości. Nie zmieniamy innych czynności po wymianie jednego filtra.</p>{admin && writable && <Action variant="secondary" onClick={() => onModal({ type: "plans" })}>Edytuj harmonogram</Action>}</div>{!v.plans.length && <Hint>Nie skonfigurowano terminów dla tego pojazdu.</Hint>}
        {v.plans.map((p) => <div key={p.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 p-4"><div className="space-y-2"><h3 className="text-sm font-bold">{p.title}</h3><PlanStatus plan={p} vehicle={v} /><p className="text-xs text-slate-400">Ostatnio: {fmtDate(p.lastDate)}{p.lastKm !== null ? ` • ${fmtNumber(p.lastKm)} km` : ""}{p.lastHours !== null ? ` • ${fmtNumber(p.lastHours, 1)} h` : ""}</p></div>{admin && writable && !p.disabled && <Action variant="secondary" onClick={() => onModal({ type: "service", ref: p.id })}>Zapisz wykonanie</Action>}</div>)}
      </>}
      {tab === "history" && <><div className="grid gap-3 sm:grid-cols-2"><Pick label="Rodzaj wpisu" value={historyType} onChange={(v) => { setHistoryType(v); setHistoryLimit(40); }} options={[{ value: "", label: "Cała historia" }, ...options(labels.event)]} /><Field label="Szukaj w historii" value={historyQuery} onChange={(s) => { setHistoryQuery(s); setHistoryLimit(40); }} placeholder="Naprawa, warsztat, numer FV…" /></div><div className="flex items-center justify-between"><p className="text-xs text-slate-500">{history.length} wpisów • według daty wykonania</p><Action variant="secondary" onClick={exportHistory}><Download size={16} />CSV historii</Action></div>
        {history.slice(0, historyLimit).map((e) => <EventCard key={e.id} event={e} admin={admin} writable={writable} files={fileMap} onPreview={onPreview} onVoid={() => onModal({ type: "void", ref: e.id })} />)}{!history.length && <p className="text-sm text-slate-500">Brak wpisów dla tych filtrów.</p>}{history.length > historyLimit && <Action variant="secondary" onClick={() => setHistoryLimit((n) => n + 40)}>Pokaż kolejne 40 wpisów</Action>}
      </>}
      {tab === "files" && <><div className="flex items-center justify-between gap-3"><p className="text-xs text-slate-500">{admin ? "Dokumenty, faktury i zdjęcia zapisane przy tym pojeździe." : "Widoczne zdjęcia pojazdu i uszkodzeń. Dokumenty i faktury są dostępne tylko administratorowi."}</p>{admin && writable && <Action variant="secondary" onClick={() => onModal({ type: "documents" })}><Plus size={16} />Dodaj</Action>}</div>{files.map((f) => <button key={f.id} onClick={() => onPreview(f)} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"><FileText className="shrink-0 text-slate-400" size={20} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{f.name}</p><p className="mt-1 text-xs text-slate-500">{labels.file[f.kind]} • {fmtDate(f.createdAt)} • {(f.bytes / 1024 / 1024).toFixed(1)} MB</p></div><span className="text-xs font-semibold text-orange-700">Podgląd</span></button>)}{!files.length && <p className="text-sm text-slate-500">Nie dodano jeszcze plików.</p>}</>}
      {tab === "defects" && <>{v.defects.map((d) => <div key={d.id} className={`space-y-3 rounded-xl border p-4 ${!d.resolvedAt && d.severity === "critical" ? "border-red-200 bg-red-50" : "border-slate-200"}`}><div className="flex flex-wrap items-center justify-between gap-2"><Chip tone={d.resolvedAt ? "green" : d.severity === "critical" ? "red" : "amber"}>{d.resolvedAt ? "Zamknięta" : d.severity === "critical" ? "Krytyczna" : d.severity === "low" ? "Niski priorytet" : "Otwarta"}</Chip><p className="text-xs text-slate-500">{fmtDate(d.reportedAt)} • {d.reportedBy}</p></div><p className="whitespace-pre-line text-sm">{d.note}</p>{d.resolvedAt && <p className="text-sm text-emerald-800">{fmtDate(d.resolvedAt)}: {d.resolution}</p>}<Attachments ids={d.fileIds} files={fileMap} onPreview={onPreview} />{admin && writable && !d.resolvedAt && <Action variant="secondary" onClick={() => onModal({ type: "resolve", ref: d.id })}>Zamknij usterkę</Action>}</div>)}{!v.defects.length && <p className="text-sm text-slate-500">Brak zgłoszonych usterek.</p>}<Hint>Zamknięcie usterki nie przywraca automatycznie statusu „Gotowy”. Administrator podejmuje tę decyzję osobno przyciskiem „Status / archiwum”.</Hint></>}
      {tab === "costs" && admin && <><div className="max-w-xs"><Pick label="Okres kosztów" value={year} onChange={setYear} options={[{ value: "", label: "Cała historia" }, ...Array.from(new Set(events.map((e) => e.occurredOn.slice(0, 4)))).sort().reverse().map((y) => ({ value: y, label: y }))]} /></div><div className="grid gap-3 sm:grid-cols-2">{Object.entries(totals).map(([currency, amount]) => <div key={currency} className="rounded-xl bg-slate-900 p-5 text-white"><p className="text-xs text-slate-300">Zapisane koszty brutto • {year || "cała historia"}</p><p className="mt-2 text-2xl font-black">{new Intl.NumberFormat("pl-PL", { style: "currency", currency }).format(amount)}</p></div>)}</div><p className="text-xs text-slate-500">Waluty liczymy oddzielnie, bez przeliczania kursów. Unieważnione wpisy są pomijane. To suma wpisanych wydatków, nie całkowity koszt posiadania ani potwierdzenie płatności.</p>
        {costEvents.filter((e) => !e.voidedAt).map((e) => <div key={e.id} className="rounded-xl border border-slate-200 p-3"><div className="flex flex-wrap justify-between gap-2"><div><p className="text-sm font-semibold">{e.title}</p><p className="mt-1 text-xs text-slate-500">{fmtDate(e.occurredOn)} • {e.workshop || "bez warsztatu"}{e.invoiceNumber ? ` • FV ${e.invoiceNumber}` : ""}</p></div><p className="text-sm font-bold">{new Intl.NumberFormat("pl-PL", { style: "currency", currency: e.currency }).format(e.cost || 0)}</p></div><div className="mt-2"><Attachments ids={e.fileIds} files={fileMap} onPreview={onPreview} />{!e.fileIds.some((id) => fileMap.get(id)?.kind === "invoice") && <Chip tone="amber">Nie załączono faktury</Chip>}</div></div>)}{!Object.keys(totals).length && <p className="text-sm text-slate-500">Brak zapisanych kosztów w tym okresie.</p>}
      </>}
    </div>
  </article>;
}
function DataTile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) { return <div className="min-w-0 rounded-xl bg-slate-50 p-3"><p className="flex items-center gap-2 text-xs text-slate-500">{icon}{label}</p><p className="mt-2 break-words text-base font-bold">{value}</p><p className="mt-1 text-xs text-slate-400">{sub}</p></div>; }
function Attachments({ ids, files, onPreview }: { ids: string[]; files: Map<string, FleetFile>; onPreview: (f: FleetFile) => void }) {
  return <div className="flex flex-wrap gap-2">{ids.map((id) => files.get(id)).filter((f): f is FleetFile => !!f).map((f) => <button key={f.id} onClick={() => onPreview(f)} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-orange-700"><FileText size={13} /><span className="truncate">{f.name}</span></button>)}</div>;
}
function EventCard({ event: e, admin, writable, files, onPreview, onVoid }: { event: Event; admin: boolean; writable: boolean; files: Map<string, FleetFile>; onPreview: (f: FleetFile) => void; onVoid: () => void }) {
  return <article className={`rounded-xl border border-slate-200 p-4 ${e.voidedAt ? "bg-slate-50 opacity-75" : "bg-white"}`}><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><Chip>{labels.event[e.kind]}</Chip><span className="text-xs text-slate-500">{fmtDate(e.occurredOn)} • {e.actorName}</span></div><h3 className="text-sm font-bold">{e.title}</h3>{e.inspectionResult && <div className="mt-2"><Chip tone={e.inspectionResult === "failed" ? "red" : "green"}>Badanie: {e.inspectionResult === "failed" ? "wynik negatywny" : "wynik pozytywny"}</Chip></div>}{e.voidedAt && <p className="mt-1 text-xs font-bold text-red-700">UNIEWAŻNIONY: {e.voidReason}</p>}
    <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-slate-500">{e.mileage !== null && <span>{fmtNumber(e.mileage)} km</span>}{e.hours !== null && <span>{fmtNumber(e.hours, 1)} h</span>}{(e.fromDriver || e.toDriver) && <span>{e.fromDriver || "bez użytkownika"} → {e.toDriver || "zwrot"}</span>}{admin && e.cost !== null && <span className="font-bold text-slate-900">{new Intl.NumberFormat("pl-PL", { style: "currency", currency: e.currency }).format(e.cost)} brutto</span>}</div>
    <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold text-slate-600">Szczegóły wpisu</summary><div className="mt-3 space-y-2 text-slate-600">{e.note && <p className="whitespace-pre-line">{e.note}</p>}{e.workshop && <p>Warsztat: {e.workshop}</p>}{e.parts && <p className="whitespace-pre-line">Części: {e.parts}</p>}{e.invoiceNumber && <p>Faktura: {e.invoiceNumber}</p>}{e.litres !== null && <p>Paliwo: {fmtNumber(e.litres, 2)} l</p>}{e.fuelLevel !== null && <p>Poziom paliwa: {e.fuelLevel}%</p>}{e.checks.length > 0 && <p>Odnotowane wyposażenie: {e.checks.join(", ")}</p>}<p className="text-xs text-slate-400">Zarejestrowano: {new Date(e.createdAt).toLocaleString("pl-PL")}</p></div></details>
    <div className="mt-3"><Attachments ids={e.fileIds} files={files} onPreview={onPreview} /></div>{admin && writable && !e.voidedAt && ["service", "repair", "inspection", "insurance", "fuel", "note"].includes(e.kind) && <button className="mt-3 text-xs text-slate-400 underline hover:text-red-700" onClick={onVoid}>Unieważnij błędny wpis</button>}
  </article>;
}
function PhotoGrid({ files, onPreview }: { files: FleetFile[]; onPreview: (f: FleetFile) => void }) {
  const [limit, setLimit] = useState(9);
  if (!files.length) return <p className="text-sm text-slate-500">Brak zdjęć pojazdu. Dodaj zdjęcie ogólne, wnętrze i wyposażenie.</p>;
  return <><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{files.slice(0, limit).map((f) => <SecurePhoto key={f.id} file={f} onClick={() => onPreview(f)} />)}</div>{files.length > limit && <Action variant="secondary" onClick={() => setLimit((n) => n + 9)}>Pokaż więcej zdjęć</Action>}</>;
}
function SecurePhoto({ file, onClick }: { file: FleetFile; onClick: () => void }) {
  const [url, setUrl] = useState("");
  useEffect(() => { let active = true; void api<{ url: string }>(`/files?id=${file.id}`).then((r) => { if (active) setUrl(r.url); }).catch(() => {}); return () => { active = false; }; }, [file.id]);
  return <button onClick={onClick} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left">{url ? <img src={url} alt={file.name} loading="lazy" className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center text-slate-300"><ImageIcon size={28} /></div>}<p className="truncate p-2 text-xs text-slate-500">{file.name}</p></button>;
}
