// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ClipboardList,
  Edit3,
  FileSpreadsheet,
  Hammer,
  History,
  Lock,
  LogOut,
  PackageCheck,
  PackageX,
  Plus,
  Printer,
  RotateCcw,
  Save,
  ScanLine,
  Search,
  ShieldCheck,
  Trash2,
  User,
  Wrench,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "acc_tools_v6";
const HISTORY_KEY = "acc_history_v6";
const SETTINGS_KEY = "acc_settings_v6";
const USER_KEY = "acc_user_v6";
const LANG_KEY = "acc_lang_v6";

const I18N = {
  pl: {
    appTitle: "ACC Bau Narzędziownia",
    subtitle: "Admin / pracownik • QR publiczny • przekazania",
    loginText: "Logowanie PIN. Admin edytuje, pracownik przekazuje i przegląda.",
    login: "Logowanie",
    enter: "Wejdź",
    demoPin: "Demo PIN: 1234",
    allTools: "Sprzęt razem",
    available: "Dostępne",
    issued: "Wydane",
    inspectionsWarning: "Przeglądy: uwaga",
    toolsList: "Lista sprzętu",
    publicQrHint: "QR publiczny pokazuje dane BHP bez logowania.",
    search: "Szukaj...",
    category: "Kategoria",
    status: "Status",
    project: "Projekt",
    person: "Osoba",
    toolsByPeople: "Narzędzia według osób",
    takeover: "Przejmij",
    excel: "Excel",
    settings: "Ustawienia",
    demo: "Demo",
    add: "Dodaj",
    logout: "Wyloguj",
    noPermission: "Brak uprawnień admina",
    wrongPin: "Nieprawidłowy PIN",
    enterIdName: "Wpisz ID i nazwę",
    edit: "Edytuj",
    delete: "Usuń",
    returnTool: "Zwrot",
    showTransferCode: "Pokaż kod przekazania",
    printQr: "Drukuj QR",
    addInspection: "Dodaj przegląd",
    assignedTo: "Aktualny posiadacz",
    location: "Lokalizacja",
    notes: "Uwagi",
    serial: "Numer seryjny",
    brandModel: "Marka / model",
    inspections: "Przeglądy / certyfikaty",
    history: "Historia",
    noHistory: "Brak historii.",
    noInspections: "Brak przeglądów.",
    inspectionNeedsAction: "Przegląd wymaga reakcji",
    publicInfo: "Informacja BHP",
    publicTitle: "ACC BAU • INFORMACJA BHP",
    publicSubtitle: "Dane po zeskanowaniu QR — bez logowania.",
    equipmentId: "ID sprzętu",
    safetyInspectionStatus: "Status przeglądu BHP",
    testsInspections: "Badania / przeglądy",
    noToolFound: "Nie znaleziono sprzętu.",
    back: "Powrót",
    transferCode: "Kod przekazania",
    transferCodeSubtitle: "Druga osoba skanuje QR i przejmuje sprzęt.",
    claimTool: "Przejmij narzędzie",
    claimSubtitle: "Wklej kod albo otwórz link z QR.",
    claimWarning: "Bez kodu od aktualnego posiadacza nie można przejąć narzędzia.",
    cancel: "Anuluj",
    save: "Zapisz",
    settingsHint: "PIN: Imię:1234. Uprawnienia: Imię:admin albo Imię:worker.",
    workers: "Pracownicy",
    sites: "Budowy",
    categories: "Kategorie",
    pins: "PIN-y",
    roles: "Uprawnienia",
    ruleTitle: "Zasada przekazania",
    rule1: "Aktualny posiadacz pokazuje kod przekazania.",
    rule2: "Nowy pracownik loguje się u siebie.",
    rule3: "Klika „Przejmij” i skanuje/wkleja kod.",
    rule4: "System zapisuje historię.",
    worker: "PRACOWNIK",
    admin: "ADMIN",
    warehouse: "Magazyn",
    unassigned: "nieprzypisane",
    next: "następny",
    missing: "brak",
    done: "Wykonano",
    result: "Wynik",
    nextInspection: "Następny",
    ok: "OK",
    warning: "UWAGA",
    overdue: "po terminie",
    inDays: "za",
    noReview: "Brak przeglądu",
    reviewsOk: "Przeglądy OK",
  },
  en: {
    appTitle: "ACC Bau Tool Control",
    subtitle: "Admin / worker • public QR • handovers",
    loginText: "PIN login. Admin edits, worker transfers and views.",
    login: "Login",
    enter: "Enter",
    demoPin: "Demo PIN: 1234",
    allTools: "All tools",
    available: "Available",
    issued: "Issued",
    inspectionsWarning: "Inspections: warning",
    toolsList: "Tool list",
    publicQrHint: "Public QR shows safety data without login.",
    search: "Search...",
    category: "Category",
    status: "Status",
    project: "Project",
    person: "Person",
    toolsByPeople: "Tools by person",
    takeover: "Receive",
    excel: "Excel",
    settings: "Settings",
    demo: "Demo",
    add: "Add",
    logout: "Logout",
    noPermission: "Admin permission required",
    wrongPin: "Wrong PIN",
    enterIdName: "Enter ID and name",
    edit: "Edit",
    delete: "Delete",
    returnTool: "Return",
    showTransferCode: "Show handover QR",
    printQr: "Print QR",
    addInspection: "Add inspection",
    assignedTo: "Current holder",
    location: "Location",
    notes: "Notes",
    serial: "Serial number",
    brandModel: "Brand / model",
    inspections: "Inspections / certificates",
    history: "History",
    noHistory: "No history.",
    noInspections: "No inspections.",
    inspectionNeedsAction: "Inspection needs action",
    publicInfo: "Safety information",
    publicTitle: "ACC BAU • SAFETY INFORMATION",
    publicSubtitle: "Data after scanning QR — no login required.",
    equipmentId: "Equipment ID",
    safetyInspectionStatus: "Safety inspection status",
    testsInspections: "Tests / inspections",
    noToolFound: "Tool not found.",
    back: "Back",
    transferCode: "Handover QR code",
    transferCodeSubtitle: "The receiving person scans QR and takes over the tool.",
    claimTool: "Receive tool",
    claimSubtitle: "Paste code or open the QR link.",
    claimWarning: "Without the current holder's code, the tool cannot be received.",
    cancel: "Cancel",
    save: "Save",
    settingsHint: "PIN: Name:1234. Roles: Name:admin or Name:worker.",
    workers: "Workers",
    sites: "Sites",
    categories: "Categories",
    pins: "PINs",
    roles: "Roles",
    ruleTitle: "Handover rule",
    rule1: "The current holder shows the handover QR code.",
    rule2: "The new worker logs in on their device.",
    rule3: "They click Receive and scan/paste the code.",
    rule4: "The system records the history.",
    worker: "WORKER",
    admin: "ADMIN",
    warehouse: "Warehouse",
    unassigned: "unassigned",
    next: "next",
    missing: "missing",
    done: "Done",
    result: "Result",
    nextInspection: "Next",
    ok: "OK",
    warning: "WARNING",
    overdue: "overdue",
    inDays: "in",
    noReview: "No inspection",
    reviewsOk: "Inspections OK",
  },
  de: {
    appTitle: "ACC Bau Werkzeugverwaltung",
    subtitle: "Admin / Mitarbeiter • öffentlicher QR • Übergaben",
    loginText: "PIN-Login. Admin bearbeitet, Mitarbeiter übergibt und sieht ein.",
    login: "Login",
    enter: "Einloggen",
    demoPin: "Demo-PIN: 1234",
    allTools: "Werkzeuge gesamt",
    available: "Verfügbar",
    issued: "Ausgegeben",
    inspectionsWarning: "Prüfungen: Warnung",
    toolsList: "Werkzeugliste",
    publicQrHint: "Öffentlicher QR zeigt BHP-/Sicherheitsdaten ohne Login.",
    search: "Suchen...",
    category: "Kategorie",
    status: "Status",
    project: "Projekt",
    person: "Person",
    toolsByPeople: "Werkzeuge nach Personen",
    takeover: "Übernehmen",
    excel: "Excel",
    settings: "Einstellungen",
    demo: "Demo",
    add: "Hinzufügen",
    logout: "Abmelden",
    noPermission: "Adminrechte erforderlich",
    wrongPin: "Falsche PIN",
    enterIdName: "ID und Name eintragen",
    edit: "Bearbeiten",
    delete: "Löschen",
    returnTool: "Rückgabe",
    showTransferCode: "Übergabe-QR anzeigen",
    printQr: "QR drucken",
    addInspection: "Prüfung hinzufügen",
    assignedTo: "Aktueller Besitzer",
    location: "Standort",
    notes: "Hinweise",
    serial: "Seriennummer",
    brandModel: "Marke / Modell",
    inspections: "Prüfungen / Zertifikate",
    history: "Historie",
    noHistory: "Keine Historie.",
    noInspections: "Keine Prüfungen.",
    inspectionNeedsAction: "Prüfung erfordert Reaktion",
    publicInfo: "Sicherheitsinformation",
    publicTitle: "ACC BAU • SICHERHEITSINFORMATION",
    publicSubtitle: "Daten nach QR-Scan — ohne Login.",
    equipmentId: "Geräte-ID",
    safetyInspectionStatus: "Status der Sicherheitsprüfung",
    testsInspections: "Prüfungen / Inspektionen",
    noToolFound: "Werkzeug nicht gefunden.",
    back: "Zurück",
    transferCode: "Übergabe-QR-Code",
    transferCodeSubtitle: "Die übernehmende Person scannt den QR und übernimmt das Werkzeug.",
    claimTool: "Werkzeug übernehmen",
    claimSubtitle: "Code einfügen oder QR-Link öffnen.",
    claimWarning: "Ohne Code des aktuellen Besitzers kann das Werkzeug nicht übernommen werden.",
    cancel: "Abbrechen",
    save: "Speichern",
    settingsHint: "PIN: Name:1234. Rechte: Name:admin oder Name:worker.",
    workers: "Mitarbeiter",
    sites: "Baustellen",
    categories: "Kategorien",
    pins: "PINs",
    roles: "Rechte",
    ruleTitle: "Übergaberegel",
    rule1: "Der aktuelle Besitzer zeigt den Übergabe-QR-Code.",
    rule2: "Der neue Mitarbeiter loggt sich auf seinem Gerät ein.",
    rule3: "Er klickt Übernehmen und scannt/fügt den Code ein.",
    rule4: "Das System speichert die Historie.",
    worker: "MITARBEITER",
    admin: "ADMIN",
    warehouse: "Lager",
    unassigned: "nicht zugewiesen",
    next: "nächste",
    missing: "fehlt",
    done: "Durchgeführt",
    result: "Ergebnis",
    nextInspection: "Nächste",
    ok: "OK",
    warning: "WARNUNG",
    overdue: "überfällig",
    inDays: "in",
    noReview: "Keine Prüfung",
    reviewsOk: "Prüfungen OK",
  },
};

const defaultSettings = {
  people: ["Aleksander Czarnecki", "Klepacki", "Kowalski", "Gunter Hecker", "Marek Nowak"],
  projects: ["Magazyn Komorniki", "Magazyn Berlin", "Helmstedt", "Heuberg", "Hünfelden", "Nowogródek"],
  categories: ["Elektronarzędzia", "Wibratory do betonu", "Rozdzielnie", "Pompy", "Agregaty", "Zagęszczarki", "Szlifierki", "Inne"],
  pins: {
    "Aleksander Czarnecki": "1234",
    Klepacki: "1234",
    Kowalski: "1234",
    "Gunter Hecker": "1234",
    "Marek Nowak": "1234",
  },
  roles: {
    "Aleksander Czarnecki": "admin",
    "Gunter Hecker": "admin",
    Klepacki: "worker",
    Kowalski: "worker",
    "Marek Nowak": "worker",
  },
};

const defaultTools = [
  {
    id: "ACC-HLM-ELT-0001",
    name: "Hilti TE 70",
    category: "Elektronarzędzia",
    brand: "Hilti",
    model: "TE 70",
    serial: "HIL-458822",
    status: "Wydane",
    project: "Helmstedt",
    location: "Kontener A",
    assignedTo: "Klepacki",
    notes: "Walizka kompletna",
    inspections: [
      { id: "i1", type: "DGUV/VDE", doneDate: "2026-05-30", nextDate: "2026-11-30", result: "OK", notes: "Pomiar OK" },
      { id: "i2", type: "Serwis mechaniczny", doneDate: "2026-03-20", nextDate: "2026-09-20", result: "OK", notes: "Szczotki OK" },
    ],
  },
  {
    id: "ACC-HBG-VIB-0007",
    name: "Wacker IRFU 57",
    category: "Wibratory do betonu",
    brand: "Wacker Neuson",
    model: "IRFU 57",
    serial: "WN-8821",
    status: "Dostępne",
    project: "Magazyn Berlin",
    location: "Regal 2",
    assignedTo: "",
    notes: "Sprawdzić przewód",
    inspections: [{ id: "i3", type: "DGUV/VDE", doneDate: "2026-02-15", nextDate: "2026-08-15", result: "OK", notes: "" }],
  },
];

const emptyTool = {
  id: "",
  name: "",
  category: "Elektronarzędzia",
  brand: "",
  model: "",
  serial: "",
  status: "Dostępne",
  project: "Magazyn Komorniki",
  location: "",
  assignedTo: "",
  notes: "",
  inspections: [],
};

const statusOptions = ["Wszystkie", "Dostępne", "Wydane", "Do przeglądu", "Uszkodzone", "Zgubione"];
const inspectionTypes = ["DGUV/VDE", "Kalibracja", "Serwis mechaniczny", "Przegląd producenta", "Przegląd UDT", "Inny"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addMonths(date, months) {
  const d = new Date(date || today());
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function daysUntil(date) {
  if (!date) return 99999;
  return Math.ceil((new Date(date).getTime() - new Date().getTime()) / 86400000);
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function qrUrl(text) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(text)}`;
}

function publicLink(id) {
  if (typeof window === "undefined") return id;
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("publicTool", id);
  return url.toString();
}

function transferLink(code) {
  if (typeof window === "undefined") return code;
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("transfer", code);
  return url.toString();
}

function encodeTicket(ticket) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(ticket))));
}

function decodeTicket(code) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(code))));
  } catch {
    return null;
  }
}

function inspections(tool) {
  return Array.isArray(tool?.inspections) ? tool.inspections : [];
}

function urgentInspection(tool) {
  const list = inspections(tool);
  if (!list.length) return null;
  return [...list].sort((a, b) => daysUntil(a.nextDate) - daysUntil(b.nextDate))[0];
}

function inspectionStatus(tool, T = I18N.pl) {
  const item = urgentInspection(tool);
  if (!item) return { danger: true, label: T.noReview, cls: "bg-red-100 text-red-700 border-red-200" };
  const d = daysUntil(item.nextDate);
  if (d < 0) return { danger: true, label: `${item.type} ${T.overdue}`, cls: "bg-red-100 text-red-700 border-red-200" };
  if (d <= 30) return { danger: true, label: `${item.type} ${T.inDays} ${d} dni`, cls: "bg-red-100 text-red-700 border-red-200" };
  return { danger: false, label: T.reviewsOk, cls: "bg-green-100 text-green-700 border-green-200" };
}

function badgeStatus(status) {
  if (status === "Wydane") return "bg-blue-100 text-blue-700 border-blue-200";
  if (status === "Dostępne") return "bg-green-100 text-green-700 border-green-200";
  if (status === "Do przeglądu" || status === "Uszkodzone") return "bg-red-100 text-red-700 border-red-200";
  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

export default function App() {
  const [tools, setTools] = useState([]);
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [user, setUser] = useState("");
  const [lang, setLang] = useState("pl");
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Wszystkie");
  const [status, setStatus] = useState("Wszystkie");
  const [project, setProject] = useState("Wszystkie");
  const [person, setPerson] = useState("Wszystkie");
  const [showToolForm, setShowToolForm] = useState(false);
  const [toolForm, setToolForm] = useState(emptyTool);
  const [editing, setEditing] = useState(false);
  const [showInspection, setShowInspection] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [transferCode, setTransferCode] = useState("");
  const [publicToolId, setPublicToolId] = useState("");

  const T = I18N[lang] || I18N.pl;

  useEffect(() => {
    const t = load(STORAGE_KEY, defaultTools);
    const s = load(SETTINGS_KEY, defaultSettings);
    const h = load(HISTORY_KEY, []);
    const u = localStorage.getItem(USER_KEY) || "";
    const storedLang = localStorage.getItem(LANG_KEY) || "pl";
    const params = new URLSearchParams(window.location.search);
    const publicTool = params.get("publicTool");
    const transfer = params.get("transfer");
    setTools(t);
    setSettings(s);
    setHistory(h);
    setUser(u);
    setLang(storedLang);
    if (publicTool) setPublicToolId(publicTool);
    if (transfer) {
      setTransferCode(transfer);
      setShowClaim(true);
    }
    setSelected(t[0] || null);
  }, []);

  useEffect(() => {
    if (tools.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
  }, [tools]);
  useEffect(() => localStorage.setItem(HISTORY_KEY, JSON.stringify(history)), [history]);
  useEffect(() => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem(LANG_KEY, lang), [lang]);

  const role = settings.roles?.[user] || "worker";
  const isAdmin = role === "admin";

  const peopleOptions = useMemo(() => {
    const fromTools = tools.map((t) => t.assignedTo).filter(Boolean);
    return ["Wszystkie", "Nieprzypisane", ...Array.from(new Set([...settings.people, ...fromTools]))];
  }, [tools, settings.people]);

  const peopleSummary = useMemo(() => {
    const map = {};
    tools.forEach((t) => {
      const key = t.assignedTo || "Nieprzypisane";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [tools]);

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      const text = `${t.id} ${t.name} ${t.brand} ${t.model} ${t.serial} ${t.assignedTo} ${t.project}`.toLowerCase();
      return text.includes(query.toLowerCase()) &&
        (category === "Wszystkie" || t.category === category) &&
        (status === "Wszystkie" || t.status === status) &&
        (project === "Wszystkie" || t.project === project) &&
        (person === "Wszystkie" || (person === "Nieprzypisane" ? !t.assignedTo : t.assignedTo === person));
    });
  }, [tools, query, category, status, project, person]);

  const stats = {
    all: tools.length,
    free: tools.filter((t) => t.status === "Dostępne").length,
    issued: tools.filter((t) => t.status === "Wydane").length,
    danger: tools.filter((t) => inspectionStatus(t, T).danger).length,
  };

  function log(tool, action, details) {
    setHistory((prev) => [
      { id: crypto.randomUUID?.() || String(Date.now()), toolId: tool.id, date: new Date().toLocaleString("pl-PL"), user, action, details },
      ...prev,
    ]);
  }

  function login(name, pin) {
    const expected = settings.pins?.[name] || "1234";
    if (pin !== expected) return alert(T.wrongPin);
    localStorage.setItem(USER_KEY, name);
    setUser(name);
  }

  function logout() {
    localStorage.removeItem(USER_KEY);
    setUser("");
  }

  function openNewTool() {
    if (!isAdmin) return alert(T.noPermission);
    setToolForm({ ...emptyTool, id: `ACC-NEW-${String(tools.length + 1).padStart(4, "0")}` });
    setEditing(false);
    setShowToolForm(true);
  }

  function openEditTool(tool) {
    if (!isAdmin) return alert(T.noPermission);
    setToolForm(tool);
    setEditing(true);
    setShowToolForm(true);
  }

  function saveTool() {
    if (!isAdmin) return alert(T.noPermission);
    if (!toolForm.id || !toolForm.name) return alert(T.enterIdName);
    if (editing) setTools((prev) => prev.map((t) => (t.id === toolForm.id ? toolForm : t)));
    else setTools((prev) => [toolForm, ...prev]);
    setSelected(toolForm);
    log(toolForm, editing ? T.edit : T.add, editing ? "Zmieniono dane" : "Dodano sprzęt");
    setShowToolForm(false);
  }

  function updateTool(tool, action, details) {
    setTools((prev) => prev.map((t) => (t.id === tool.id ? tool : t)));
    setSelected(tool);
    log(tool, action, details);
  }

  function addInspection(inspection) {
    if (!isAdmin) return alert(T.noPermission);
    const updated = { ...selected, inspections: [inspection, ...inspections(selected)] };
    if (inspectionStatus(updated, T).danger && updated.status !== "Uszkodzone") updated.status = "Do przeglądu";
    updateTool(updated, T.addInspection, `${inspection.type}: ${inspection.doneDate} / ${inspection.nextDate}`);
    setShowInspection(false);
  }

  function createTransfer() {
    if (!selected) return;
    if (selected.assignedTo && selected.assignedTo !== user) return alert(`Nie możesz przekazać. Sprzęt przypisany do: ${selected.assignedTo}`);
    const ticket = { id: crypto.randomUUID?.() || String(Date.now()), toolId: selected.id, toolName: selected.name, from: user, time: new Date().toISOString() };
    const code = encodeTicket(ticket);
    setTransferCode(code);
    setShowTransfer(true);
    log(selected, T.transferCode, `Wystawił: ${user}`);
  }

  function claimTransfer(code) {
    const ticket = decodeTicket(code.trim());
    if (!ticket) return alert("Zły kod przekazania");
    const tool = tools.find((t) => t.id === ticket.toolId);
    if (!tool) return alert("Nie znaleziono narzędzia");
    if (ticket.from === user) return alert("Nie możesz przejąć od siebie");
    if (tool.assignedTo && tool.assignedTo !== ticket.from) return alert(`Nie można przejąć. Aktualnie: ${tool.assignedTo}`);
    const updated = { ...tool, status: "Wydane", assignedTo: user };
    updateTool(updated, T.claimTool, `${ticket.from} ➜ ${user}`);
    setShowClaim(false);
    setTransferCode("");
  }

  function returnTool() {
    if (!selected) return;
    updateTool({ ...selected, status: "Dostępne", assignedTo: "" }, T.returnTool, "Zwrócono do magazynu");
  }

  function exportExcel() {
    const rows = tools.map((t) => {
      const u = urgentInspection(t);
      return {
        ID: t.id,
        Nazwa: t.name,
        Marka: t.brand,
        Model: t.model,
        Serial: t.serial,
        Status: t.status,
        Projekt: t.project,
        Lokalizacja: t.location,
        Operator: t.assignedTo,
        Przeglad: u ? `${u.type} / ${u.nextDate}` : "Brak",
      };
    });
    const headers = Object.keys(rows[0] || { ID: "" });
    const html = `<html><meta charset="UTF-8"><body><h2>ACC Bau Narzędziownia</h2><table style="border-collapse:collapse;font-family:Arial;font-size:12px"><tr>${headers.map((h) => `<th style="border:1px solid #333;background:#111;color:#fff;padding:8px">${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${headers.map((h) => `<td style="border:1px solid #ccc;padding:6px">${r[h] || ""}</td>`).join("")}</tr>`).join("")}</table></body></html>`;
    download(html, "acc-bau-tools.xls", "application/vnd.ms-excel");
  }

  function download(content, name, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printLabel(tool) {
    const url = publicLink(tool.id);
    const u = urgentInspection(tool);
    const html = `<html><body style="font-family:Arial;margin:18px"><div style="width:360px;border:3px solid #111;border-radius:18px;padding:16px"><div style="font-size:20px;font-weight:900">ACC BAU • BHP</div><div style="font-size:12px;color:#666;margin-top:2px">PUBLIC EQUIPMENT INFO</div><div style="display:flex;gap:14px;align-items:center;margin-top:14px"><img src="${qrUrl(url)}" style="width:150px;height:150px"><div><div style="font-size:18px;font-weight:900">${tool.name}</div><div style="font-size:13px;margin-top:6px">ID: ${tool.id}</div><div style="font-size:13px">SN: ${tool.serial || "—"}</div><div style="font-size:13px">Next: ${u?.nextDate || "—"}</div></div></div><div style="font-size:10px;color:#777;margin-top:12px;word-break:break-all">${url}</div></div><script>window.print()</script></body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
  }

  if (publicToolId) {
    const tool = tools.find((t) => t.id === publicToolId);
    return <PublicToolView tool={tool} T={T} lang={lang} setLang={setLang} onBack={() => setPublicToolId("")} />;
  }

  if (!user) return <LoginScreen settings={settings} T={T} lang={lang} setLang={setLang} onLogin={login} />;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_32%),linear-gradient(135deg,#09090b_0%,#18181b_42%,#27272a_100%)] text-zinc-950">
      <Header T={T} lang={lang} setLang={setLang} user={user} role={role} isAdmin={isAdmin} onLogout={logout} onClaim={() => setShowClaim(true)} onExcel={exportExcel} onSettings={() => setShowSettings(true)} onDemo={() => { setTools(defaultTools); setSelected(defaultTools[0]); }} onAdd={openNewTool} />

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Wrench />} label={T.allTools} value={stats.all} />
          <StatCard icon={<PackageCheck />} label={T.available} value={stats.free} />
          <StatCard icon={<User />} label={T.issued} value={stats.issued} />
          <StatCard icon={<AlertTriangle />} label={T.inspectionsWarning} value={stats.danger} danger />
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
          <Card className="overflow-hidden rounded-[32px] border border-white/30 bg-white/95 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur">
            <CardContent className="p-4 sm:p-6">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-zinc-950">{T.toolsList}</h2>
                  <p className="text-sm text-zinc-500">{T.publicQrHint}</p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 shadow-inner">
                  <Search className="h-4 w-4 text-zinc-400" />
                  <input className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400 lg:w-72" placeholder={T.search} value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Select label={T.category} value={category} setValue={setCategory} options={["Wszystkie", ...settings.categories]} />
                <Select label={T.status} value={status} setValue={setStatus} options={statusOptions} />
                <Select label={T.project} value={project} setValue={setProject} options={["Wszystkie", ...settings.projects]} />
                <Select label={T.person} value={person} setValue={setPerson} options={peopleOptions} />
              </div>

              <div className="mb-5 rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-3 shadow-sm">
                <div className="mb-2 flex items-center gap-2 text-sm font-black text-zinc-800"><User className="h-4 w-4" /> {T.toolsByPeople}</div>
                <div className="flex flex-wrap gap-2">
                  {peopleSummary.map((p) => <button key={p.name} onClick={() => setPerson(p.name)} className={`rounded-full border px-3 py-1 text-xs font-bold shadow-sm transition hover:-translate-y-0.5 ${person === p.name ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"}`}>{p.name}: {p.count}</button>)}
                </div>
              </div>

              <div className="space-y-3">{filtered.map((tool) => <ToolRow key={tool.id} tool={tool} active={selected?.id === tool.id} onClick={() => setSelected(tool)} T={T} />)}</div>
            </CardContent>
          </Card>

          <aside className="space-y-5">
            {selected && <ToolDetails T={T} tool={selected} isAdmin={isAdmin} history={history.filter((h) => h.toolId === selected.id)} onEdit={() => openEditTool(selected)} onDelete={() => { if (!isAdmin) return alert(T.noPermission); setTools((prev) => prev.filter((t) => t.id !== selected.id)); setSelected(tools[0] || null); }} onTransfer={createTransfer} onReturn={returnTool} onInspection={() => setShowInspection(true)} onPrint={() => printLabel(selected)} />}
            <InfoBox T={T} />
          </aside>
        </section>
      </main>

      {showToolForm && <ToolForm T={T} form={toolForm} setForm={setToolForm} settings={settings} onClose={() => setShowToolForm(false)} onSave={saveTool} editing={editing} />}
      {showInspection && selected && <InspectionModal T={T} onClose={() => setShowInspection(false)} onSave={addInspection} />}
      {showSettings && <SettingsModal T={T} settings={settings} setSettings={setSettings} onClose={() => setShowSettings(false)} />}
      {showTransfer && selected && <TransferModal T={T} code={transferCode} tool={selected} onClose={() => setShowTransfer(false)} />}
      {showClaim && <ClaimModal T={T} initialCode={transferCode} onClose={() => setShowClaim(false)} onClaim={claimTransfer} />}
    </div>
  );
}

function LanguageSelect({ lang, setLang, dark = false }) {
  return (
    <select value={lang} onChange={(e) => setLang(e.target.value)} className={`rounded-xl border px-3 py-2 text-sm font-bold outline-none ${dark ? "border-white/20 bg-white/10 text-white" : "border-zinc-200 bg-white text-zinc-950"}`}>
      <option className="text-zinc-950" value="pl">🇵🇱 PL</option>
      <option className="text-zinc-950" value="en">🇬🇧 EN</option>
      <option className="text-zinc-950" value="de">🇩🇪 DE</option>
    </select>
  );
}

function Header({ T, lang, setLang, user, role, isAdmin, onLogout, onClaim, onExcel, onSettings, onDemo, onAdd }) {
  return (
    <header className="border-b border-white/10 bg-zinc-950/95 text-white shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-600 shadow-xl"><Hammer className="h-7 w-7" /></div>
          <div>
            <div className="mb-1 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-yellow-300">ACC BAU • TOOL CONTROL</div>
            <h1 className="text-2xl font-black tracking-tight">{T.appTitle}</h1>
            <p className="text-sm text-zinc-300">{T.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <LanguageSelect lang={lang} setLang={setLang} dark />
          <div className="rounded-xl border border-white/20 bg-emerald-500/20 px-3 py-2 text-sm font-bold">{user} • {role === "admin" ? T.admin : T.worker}</div>
          <Button onClick={onClaim} className="rounded-xl bg-emerald-500 text-white shadow-lg hover:bg-emerald-600"><ScanLine className="mr-2 h-4 w-4" /> {T.takeover}</Button>
          {isAdmin && <Button onClick={onExcel} className="rounded-xl bg-white text-zinc-950 hover:bg-zinc-100"><FileSpreadsheet className="mr-2 h-4 w-4" /> {T.excel}</Button>}
          {isAdmin && <Button onClick={onSettings} className="rounded-xl bg-white text-zinc-950 hover:bg-zinc-100">{T.settings}</Button>}
          {isAdmin && <Button onClick={onDemo} className="rounded-xl bg-white text-zinc-950 hover:bg-zinc-100"><RotateCcw className="mr-2 h-4 w-4" /> {T.demo}</Button>}
          {isAdmin && <Button onClick={onAdd} className="rounded-xl bg-yellow-500 text-zinc-950 shadow-lg hover:bg-yellow-400"><Plus className="mr-2 h-4 w-4" /> {T.add}</Button>}
          <Button onClick={onLogout} className="rounded-xl bg-zinc-800 text-white hover:bg-zinc-700"><LogOut className="mr-2 h-4 w-4" /> {T.logout}</Button>
        </div>
      </div>
    </header>
  );
}

function LoginScreen({ settings, T, lang, setLang, onLogin }) {
  const [name, setName] = useState(settings.people[0] || "");
  const [pin, setPin] = useState("");
  return <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.22),transparent_35%),linear-gradient(135deg,#09090b,#18181b)] p-4 text-white"><div className="mx-auto flex min-h-[80vh] max-w-4xl items-center justify-center"><Card className="grid w-full overflow-hidden rounded-[32px] border border-white/10 shadow-2xl lg:grid-cols-2"><div className="bg-zinc-950 p-8 text-white"><div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-600"><Hammer className="h-8 w-8" /></div><h1 className="text-4xl font-black">{T.appTitle}</h1><p className="mt-4 text-zinc-300">{T.loginText}</p><div className="mt-6"><LanguageSelect lang={lang} setLang={setLang} dark /></div></div><CardContent className="p-8 text-zinc-950"><div className="mb-5 flex items-center gap-2 text-xl font-black"><Lock className="h-5 w-5" /> {T.login}</div><select value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border px-4 py-3">{settings.people.map((p) => <option key={p}>{p}</option>)}</select><input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" className="mt-4 w-full rounded-2xl border px-4 py-3" /><Button onClick={() => onLogin(name, pin)} className="mt-5 w-full rounded-2xl bg-zinc-950 py-6 text-base hover:bg-zinc-800">{T.enter}</Button><p className="mt-4 text-xs text-zinc-400">{T.demoPin}</p></CardContent></Card></div></div>;
}

function PublicToolView({ tool, T, lang, setLang, onBack }) {
  if (!tool) return <div className="min-h-screen bg-zinc-950 p-6 text-white"><Card className="mx-auto max-w-3xl rounded-3xl"><CardContent className="p-6"><h1 className="text-2xl font-black">ACC Bau • {T.publicInfo}</h1><p className="mt-3 text-red-600">{T.noToolFound}</p><Button onClick={onBack} className="mt-5">{T.back}</Button></CardContent></Card></div>;
  const state = inspectionStatus(tool, T);
  return <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_35%),linear-gradient(135deg,#09090b,#18181b)] p-4 text-white"><div className="mx-auto max-w-4xl overflow-hidden rounded-[32px] bg-white text-zinc-950 shadow-2xl"><div className="bg-zinc-950 p-6 text-white"><div className="flex items-center justify-between gap-3"><div className="inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase text-yellow-300">{T.publicTitle}</div><LanguageSelect lang={lang} setLang={setLang} dark /></div><h1 className="mt-4 text-4xl font-black">{tool.name}</h1><p className="mt-2 text-zinc-300">{T.publicSubtitle}</p></div><div className="grid gap-4 p-5 sm:grid-cols-2"><Info label={T.equipmentId} value={tool.id} /><Info label={T.serial} value={tool.serial || "—"} /><Info label={T.brandModel} value={`${tool.brand || "—"} ${tool.model || ""}`} /><Info label={T.category} value={tool.category || "—"} /><Info label={T.status} value={tool.status || "—"} /><Info label={T.location} value={`${tool.project || "—"} / ${tool.location || "—"}`} /><Info label={T.assignedTo} value={tool.assignedTo || T.warehouse} /><div className={`rounded-2xl border px-4 py-3 ${state.cls}`}><p className="text-xs font-semibold">{T.safetyInspectionStatus}</p><p className="text-lg font-black">{state.label}</p></div></div><div className="px-5 pb-6"><h2 className="mb-3 text-lg font-black">{T.testsInspections}</h2><div className="grid gap-3 sm:grid-cols-2">{inspections(tool).length ? inspections(tool).map((i) => <InspectionCard key={i.id} inspection={i} T={T} />) : <div className="rounded-2xl border bg-red-50 p-4 text-red-700">{T.noInspections}</div>}</div><div className="mt-5 rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-600"><b>{T.notes}:</b><br />{tool.notes || "—"}</div></div></div></div>;
}

function ToolRow({ tool, active, onClick, T }) {
  const state = inspectionStatus(tool, T);
  const u = urgentInspection(tool);
  return <motion.div whileHover={{ y: -2 }} onClick={onClick} className={`cursor-pointer rounded-[26px] border bg-white p-4 shadow-sm transition hover:shadow-xl ${active ? "border-zinc-950 ring-2 ring-zinc-950/10" : state.danger ? "border-red-300" : "border-zinc-200"}`}><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{tool.name}</h3><Badge cls={badgeStatus(tool.status)}>{tool.status}</Badge><Badge cls={state.cls}>{state.label}</Badge></div><p className="mt-1 text-sm text-zinc-500">{tool.id} • {tool.brand} {tool.model} • SN: {tool.serial}</p><div className="mt-2 text-xs text-zinc-600">{tool.project} • {tool.location} • {tool.assignedTo || T.unassigned} • {T.next}: {u?.nextDate || T.missing}</div></div><img src={qrUrl(publicLink(tool.id))} alt="QR" className="h-16 w-16 rounded-2xl border bg-white p-1 shadow-sm" /></div></motion.div>;
}

function ToolDetails({ T, tool, isAdmin, history, onEdit, onDelete, onTransfer, onReturn, onInspection, onPrint }) {
  const state = inspectionStatus(tool, T);
  return <Card className="rounded-[32px] border border-white/30 bg-white/95 shadow-[0_24px_80px_rgba(0,0,0,0.25)]"><CardContent className="p-4 sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black">{tool.name}</h2><p className="text-sm text-zinc-500">{tool.id}</p>{state.danger && <div className="mt-2 rounded-2xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-bold text-red-700"><AlertTriangle className="mr-1 inline h-4 w-4" /> {T.inspectionNeedsAction}</div>}</div><img src={qrUrl(publicLink(tool.id))} alt="QR" className="h-24 w-24 rounded-3xl border bg-white p-2 shadow-xl" /></div><div className="mt-5 grid gap-3 text-sm"><Info label={T.category} value={tool.category} /><Info label={T.brandModel} value={`${tool.brand} ${tool.model}`} /><Info label={T.serial} value={tool.serial} /><Info label={T.project} value={tool.project} /><Info label={T.location} value={tool.location} /><Info label={T.assignedTo} value={tool.assignedTo || T.warehouse} /><Info label={T.notes} value={tool.notes || "—"} /></div>{isAdmin && <Button onClick={onInspection} className="mt-5 w-full rounded-2xl bg-zinc-950 py-6 font-bold hover:bg-zinc-800"><Plus className="mr-2 h-5 w-5" /> {T.addInspection}</Button>}<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"><Button onClick={onTransfer} className="rounded-2xl bg-emerald-600 py-5 font-bold hover:bg-emerald-700"><ScanLine className="mr-2 h-4 w-4" /> {T.showTransferCode}</Button><Button onClick={onReturn} variant="outline" className="rounded-2xl"><PackageX className="mr-2 h-4 w-4" /> {T.returnTool}</Button>{isAdmin && <Button onClick={onPrint} variant="outline" className="rounded-2xl"><Printer className="mr-2 h-4 w-4" /> {T.printQr}</Button>}{isAdmin && <Button onClick={onEdit} variant="outline" className="rounded-2xl"><Edit3 className="mr-2 h-4 w-4" /> {T.edit}</Button>}{isAdmin && <Button onClick={onDelete} variant="outline" className="rounded-2xl text-red-600"><Trash2 className="mr-2 h-4 w-4" /> {T.delete}</Button>}</div><SectionTitle icon={<ClipboardList />} title={T.inspections} /><div className="grid gap-3 md:grid-cols-2">{inspections(tool).map((i) => <InspectionCard key={i.id} inspection={i} T={T} />)}{!inspections(tool).length && <p className="rounded-2xl border bg-zinc-50 p-3 text-sm text-zinc-500">{T.noInspections}</p>}</div><SectionTitle icon={<History />} title={T.history} /><div className="max-h-52 space-y-2 overflow-auto rounded-2xl border bg-zinc-50 p-3">{history.map((h) => <div key={h.id} className="rounded-xl bg-white p-2 text-xs"><b>{h.action}</b> — {h.date}<br /><span className="text-zinc-500">{h.details}</span><br /><span className="text-zinc-400">Użytkownik: {h.user}</span></div>)}{!history.length && <p className="text-sm text-zinc-500">{T.noHistory}</p>}</div></CardContent></Card>;
}

function InspectionCard({ inspection, T }) {
  const d = daysUntil(inspection.nextDate);
  const danger = d <= 30;
  return <div className={`rounded-2xl border p-3 ${danger ? "border-red-300 bg-red-50" : "border-zinc-200 bg-white"}`}><div className="flex justify-between gap-2"><b>{inspection.type}</b>{danger ? <Badge cls="bg-red-600 text-white border-red-600">{T.warning}</Badge> : <Badge cls="bg-green-100 text-green-700 border-green-200">{T.ok}</Badge>}</div><div className="mt-2 text-xs text-zinc-600">{T.done}: {inspection.doneDate || "—"}<br />{T.nextInspection}: {inspection.nextDate || "—"}<br />{T.result}: {inspection.result || "—"}<br />{inspection.notes}</div></div>;
}

function ToolForm({ T, form, setForm, settings, onClose, onSave, editing }) {
  return <Modal><ModalHeader title={editing ? T.edit : T.add} onClose={onClose} /><div className="grid gap-4 p-6 md:grid-cols-2"><Field label="ID" value={form.id} onChange={(v) => setForm({ ...form, id: v })} /><Field label="Nazwa" value={form.name} onChange={(v) => setForm({ ...form, name: v })} /><FormSelect label={T.category} value={form.category} options={settings.categories} onChange={(v) => setForm({ ...form, category: v })} /><FormSelect label={T.status} value={form.status} options={statusOptions.filter((s) => s !== "Wszystkie")} onChange={(v) => setForm({ ...form, status: v })} /><Field label="Marka" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} /><Field label="Model" value={form.model} onChange={(v) => setForm({ ...form, model: v })} /><Field label={T.serial} value={form.serial} onChange={(v) => setForm({ ...form, serial: v })} /><FormSelect label={T.project} value={form.project} options={settings.projects} onChange={(v) => setForm({ ...form, project: v })} /><Field label={T.location} value={form.location} onChange={(v) => setForm({ ...form, location: v })} /><FormSelect label={T.assignedTo} value={form.assignedTo} options={["", ...settings.people]} onChange={(v) => setForm({ ...form, assignedTo: v })} /><label className="block md:col-span-2"><span className="mb-1 block text-xs font-bold text-zinc-500">{T.notes}</span><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-24 w-full rounded-xl border px-3 py-2" /></label></div><ModalFooter T={T} onClose={onClose} onSave={onSave} /></Modal>;
}

function InspectionModal({ T, onClose, onSave }) {
  const [i, setI] = useState({ id: crypto.randomUUID?.() || String(Date.now()), type: "DGUV/VDE", doneDate: today(), nextDate: addMonths(today(), 6), result: "OK", notes: "" });
  return <Modal><ModalHeader title={T.addInspection} onClose={onClose} /><div className="grid gap-4 p-6 md:grid-cols-2"><FormSelect label="Typ" value={i.type} options={inspectionTypes} onChange={(v) => setI({ ...i, type: v })} /><FormSelect label={T.result} value={i.result} options={["OK", "Do sprawdzenia", "Naprawa wymagana", "Nie dopuszczone"]} onChange={(v) => setI({ ...i, result: v })} /><Field type="date" label={T.done} value={i.doneDate} onChange={(v) => setI({ ...i, doneDate: v })} /><Field type="date" label={T.nextInspection} value={i.nextDate} onChange={(v) => setI({ ...i, nextDate: v })} /><label className="block md:col-span-2"><span className="mb-1 block text-xs font-bold text-zinc-500">{T.notes}</span><textarea value={i.notes} onChange={(e) => setI({ ...i, notes: e.target.value })} className="min-h-24 w-full rounded-xl border px-3 py-2" /></label></div><ModalFooter T={T} onClose={onClose} onSave={() => onSave(i)} /></Modal>;
}

function SettingsModal({ T, settings, setSettings, onClose }) {
  const NL = String.fromCharCode(10);
  const [people, setPeople] = useState((settings.people || []).join(NL));
  const [projects, setProjects] = useState((settings.projects || []).join(NL));
  const [categories, setCategories] = useState((settings.categories || []).join(NL));
  const [pins, setPins] = useState(Object.entries(settings.pins || {}).map(([k, v]) => `${k}:${v}`).join(NL));
  const [roles, setRoles] = useState(Object.entries(settings.roles || {}).map(([k, v]) => `${k}:${v}`).join(NL));
  const clean = (text) => text.split(NL).map((x) => x.trim()).filter(Boolean);
  function save() {
    const pinObj = {};
    clean(pins).forEach((line) => { const [name, pin] = line.split(":"); if (name && pin) pinObj[name.trim()] = pin.trim(); });
    const roleObj = {};
    clean(roles).forEach((line) => { const [name, role] = line.split(":"); if (name && role) roleObj[name.trim()] = role.trim(); });
    setSettings({ people: clean(people), projects: clean(projects), categories: clean(categories), pins: pinObj, roles: roleObj });
    onClose();
  }
  return <Modal wide><ModalHeader title={T.settings} subtitle={T.settingsHint} onClose={onClose} /><div className="grid gap-4 p-6 md:grid-cols-5"><TextList title={T.workers} value={people} setValue={setPeople} /><TextList title={T.sites} value={projects} setValue={setProjects} /><TextList title={T.categories} value={categories} setValue={setCategories} /><TextList title={T.pins} value={pins} setValue={setPins} /><TextList title={T.roles} value={roles} setValue={setRoles} /></div><ModalFooter T={T} onClose={onClose} onSave={save} /></Modal>;
}

function TransferModal({ T, code, tool, onClose }) {
  const url = transferLink(code);
  return <Modal><ModalHeader title={T.transferCode} subtitle={T.transferCodeSubtitle} onClose={onClose} /><div className="p-6 text-center"><p className="text-lg font-black">{tool.name}</p><p className="text-sm text-zinc-500">{tool.id}</p><img src={qrUrl(url)} alt="QR" className="mx-auto mt-5 h-64 w-64 rounded-3xl border bg-white p-3 shadow-xl" /><textarea value={code} readOnly className="mt-4 h-24 w-full rounded-xl border p-3 text-xs" /></div></Modal>;
}

function ClaimModal({ T, initialCode, onClose, onClaim }) {
  const [code, setCode] = useState(initialCode || "");
  return <Modal><ModalHeader title={T.claimTool} subtitle={T.claimSubtitle} onClose={onClose} /><div className="p-6"><textarea value={code} onChange={(e) => setCode(e.target.value)} className="min-h-36 w-full rounded-xl border p-3 text-xs" placeholder={T.transferCode} /><div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{T.claimWarning}</div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>{T.cancel}</Button><Button onClick={() => onClaim(code)} className="bg-emerald-600 hover:bg-emerald-700"><ScanLine className="mr-2 h-4 w-4" /> {T.takeover}</Button></div></div></Modal>;
}

function Modal({ children, wide }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className={`max-h-[92vh] w-full overflow-auto rounded-3xl bg-white shadow-2xl ${wide ? "max-w-5xl" : "max-w-3xl"}`}>{children}</motion.div></div>; }
function ModalHeader({ title, subtitle, onClose }) { return <div className="flex items-center justify-between border-b px-6 py-4"><div><h2 className="text-lg font-bold">{title}</h2>{subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}</div><Button variant="ghost" onClick={onClose}><X /></Button></div>; }
function ModalFooter({ T, onClose, onSave }) { return <div className="flex justify-end gap-2 border-t px-6 py-4"><Button variant="outline" onClick={onClose}>{T.cancel}</Button><Button onClick={onSave} className="bg-zinc-950 hover:bg-zinc-800"><Save className="mr-2 h-4 w-4" /> {T.save}</Button></div>; }
function TextList({ title, value, setValue }) { return <label><span className="mb-2 block text-sm font-bold">{title}</span><textarea value={value} onChange={(e) => setValue(e.target.value)} className="min-h-72 w-full rounded-xl border p-3 text-sm" /></label>; }
function InfoBox({ T }) { return <Card className="rounded-[32px] border border-white/30 bg-white/95 shadow-[0_24px_80px_rgba(0,0,0,0.25)]"><CardContent className="p-4 sm:p-6"><div className="flex items-center gap-2 font-black"><ShieldCheck className="h-5 w-5" /> {T.ruleTitle}</div><ol className="mt-3 space-y-2 text-sm text-zinc-600"><li>1. {T.rule1}</li><li>2. {T.rule2}</li><li>3. {T.rule3}</li><li>4. {T.rule4}</li></ol></CardContent></Card>; }
function SectionTitle({ icon, title }) { return <div className="mb-2 mt-6 flex items-center gap-2 font-black">{React.cloneElement(icon, { className: "h-4 w-4" })} {title}</div>; }
function StatCard({ icon, label, value, danger }) { return <Card className="rounded-[28px] border border-white/30 bg-white/95 shadow-xl"><CardContent className="flex items-center gap-4 p-5"><div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${danger ? "bg-red-100 text-red-700" : "bg-zinc-100 text-zinc-900"}`}>{React.cloneElement(icon, { className: "h-6 w-6" })}</div><div><p className="text-sm text-zinc-500">{label}</p><p className="text-2xl font-black">{value}</p></div></CardContent></Card>; }
function Select({ label, value, setValue, options }) { return <label><span className="mb-1 block text-xs font-bold text-zinc-500">{label}</span><select value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded-xl border bg-white px-3 py-2 text-sm">{options.map((o) => <option key={o} value={o}>{o || "—"}</option>)}</select></label>; }
function FormSelect({ label, value, options, onChange }) { return <label><span className="mb-1 block text-xs font-bold text-zinc-500">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border px-3 py-2">{options.map((o) => <option key={o} value={o}>{o || "—"}</option>)}</select></label>; }
function Field({ label, value, onChange, type = "text" }) { return <label><span className="mb-1 block text-xs font-bold text-zinc-500">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border px-3 py-2" /></label>; }
function Info({ label, value }) { return <div className="rounded-2xl border bg-zinc-50 px-3 py-2"><p className="text-xs text-zinc-500">{label}</p><p className="whitespace-pre-line font-semibold text-zinc-900">{value}</p></div>; }
function Badge({ children, cls }) { return <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${cls}`}>{children}</span>; }
