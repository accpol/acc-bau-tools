// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
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

const STORAGE_KEY = "acc_tools_v7";
const HISTORY_KEY = "acc_history_v7";
const SETTINGS_KEY = "acc_settings_v7";
const USER_KEY = "acc_user_v7";
const LANG_KEY = "acc_lang_v7";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

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
    reportFailure: "Zgłoś awarię",
    failureReported: "Zgłoszono awarię",
    failureReportedDetails: "Użytkownik zgłosił awarię urządzenia",
    failureStatus: "Awaria",
    clearFailure: "Zdejmij awarię",
    failureCleared: "Zdjęto awarię",
    failureClearedDetails: "Administrator zdjął awarię urządzenia",
    workerCannotClearFailure: "Awarię może zdjąć tylko admin.",
    qrUnreadable: "QR nieczytelne",
    qrUnreadableReported: "Zgłoszono nieczytelny QR",
    qrUnreadableDetails: "Użytkownik zgłosił, że naklejka QR jest nieczytelna",
    qrReplacementReceived: "Nowy QR otrzymano",
    qrReplacementReceivedDetails: "Potwierdzono otrzymanie nowej naklejki QR",
    qrAlarmStatus: "QR nieczytelne — potrzebna nowa naklejka",
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
    noInspectionRequired: "Nie wymaga przeglądu",
    inspectionsOkPermanent: "Przeglądy OK — bezterminowo",
    inspectionNeedsAction: "Przegląd wymaga reakcji",
    publicInfo: "HSE Information",
    publicTitle: "ACC BAU • HSE INFORMATION",
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
    days: "dni",
    printHistory: "Drukuj historię",
    printAllHistory: "Drukuj całą historię",
    printGenerated: "Wydruk",
    historyTitle: "Historia przekazań",
    historySubtitle: "Kto komu przekazywał, kiedy i jakie urządzenie",
    historyClickHint: "Kliknij wpis historii, aby zobaczyć zdjęcia przekazującego i odbierającego.",
    date: "Data",
    equipment: "Urządzenie",
    action: "Akcja",
    from: "Od",
    to: "Do",
    details: "Szczegóły",
    photos: "Zdjęcia",
    userLabel: "Użytkownik",
    noPhotosShort: "brak zdjęć",
    photoOne: "zdjęcie",
    photosMany: "zdjęć",
    clickToViewPhotos: "Kliknij, aby zobaczyć zdjęcia",
    historyDetailTitle: "Szczegóły przekazania",
    giverPhotos: "Zdjęcia przekazującego",
    receiverPhotos: "Zdjęcia odbierającego",
    noPhotos: "Brak zdjęć.",
    addPhotoCamera: "📷 Dodaj zdjęcie / zrób aparatem",
    uploadPhotoDevice: "🖼️ Wgraj zdjęcie z urządzenia",
    photosSavedInHistory: "Zdjęcia zapiszą się w historii tego konkretnego przekazania.",
    noPhotosAdded: "Nie dodano jeszcze żadnych zdjęć.",
    remove: "Usuń",
    skip: "Pomiń",
    savePhotos: "Zapisz zdjęcia",
    saving: "Zapisywanie...",
    preparePhotoError: "Nie udało się przygotować zdjęcia. Spróbuj mniejsze zdjęcie.",
    savePhotoError: "Nie udało się zapisać zdjęć w Supabase:",
    savePhotoErrorHint: "Spróbuj dodać mniej zdjęć albo mniejsze zdjęcia.",
    handoverPhotoTitle: "Przekazałeś urządzenie — dodaj zdjęcia stanu/uszkodzeń, jeśli chcesz",
    receiverPhotoTitle: "Przejąłeś urządzenie — dodaj zdjęcia stanu/uszkodzeń, jeśli chcesz",
    transferCreated: "Przekazanie - kod utworzony",
    handover: "Przekazanie",
    transferCodeAction: "Kod przekazania",
    claimAction: "Przejęcie",
    changedData: "Zmieniono dane",
    addedTool: "Dodano sprzęt",
    photosAddedOnHandover: "Zdjęcia dodane przy przekazaniu",
    photosAddedOnClaim: "Zdjęcia dodane przy przejęciu",
    waitingForReceiver: "oczekuje na odbiorcę",
    name: "Nazwa",
    brand: "Marka",
    model: "Model",
    type: "Typ",
    toolPhoto: "Zdjęcie sprzętu",
    preview: "Podgląd",
    removePhoto: "Usuń zdjęcie",
    loadingDb: "Ładowanie bazy danych...",
    supabaseOffline: "Uwaga: brak połączenia z Supabase. Aplikacja działa lokalnie.",
    badTransferCode: "Zły kod przekazania",
    toolNotFound: "Nie znaleziono narzędzia",
    cannotClaimFromYourself: "Nie możesz przejąć od siebie",
    cannotClaimCurrent: "Nie można przejąć. Aktualnie:",
    openCameraScan: "Otwórz aparat i skanuj QR",
    closeCamera: "Zamknij aparat",
    scannerUnsupported: "Ten telefon/przeglądarka nie wspiera automatycznego skanowania QR. Użyj Chrome na Androidzie albo wklej kod ręcznie.",
    serviceRepair: "Naprawa / Serwis",
    repair: "Naprawa",
    service: "Serwis",
    workDone: "Co zrobiono",
    serviceRepairHistory: "Historia przeglądów, serwisów i napraw",
    inspectionRecord: "Przegląd",
    serviceRecord: "Serwis / naprawa",
    deleteInspection: "Usuń wpis",
    confirmDeleteInspection: "Usunąć ten wpis przeglądu/serwisu?",
    inspectionDeleted: "Usunięto wpis przeglądu/serwisu",
    inspectionDeletedDetails: "Administrator usunął błędny wpis przeglądu/serwisu",
    noNextDateRequired: "Brak następnego terminu — wpis serwisowy / naprawa",
    attachments: "Załączniki / zdjęcia / dokumenty",
    addAttachmentCamera: "📷 Zrób zdjęcie certyfikatu / faktury",
    uploadAttachmentDevice: "🖼️ Wgraj zdjęcie lub PDF z urządzenia",
    noAttachments: "Brak załączników.",
    attachmentSavedHint: "Zdjęcia, certyfikaty lub faktury zapiszą się razem z tym wpisem.",
    removeAttachment: "Usuń załącznik",
    attachmentPrepareError: "Nie udało się przygotować załącznika. Spróbuj mniejszy plik.",
    cameraError: "Nie udało się otworzyć aparatu. Sprawdź zgodę na kamerę oraz HTTPS.",
    alertsDashboardTitle: "Dashboard alarmów",
    alertsDashboardHint: "Kliknij kafelek, żeby filtrować. Kliknij ponownie, żeby odznaczyć i wrócić do wszystkich.",
    alarmFailures: "Awarie",
    alarmQrIssues: "QR do wymiany",
    alarmInspectionWarnings: "Przeglądy / braki",
    alarmUnassigned: "Bez osoby",
    alarmNoLocation: "Bez lokalizacji",
    active: "Aktywny",
    dayReport: "Raport dnia",
    dayReportSubtitle: "Dzisiejsze przekazania, awarie i serwisy",
    printDayReport: "Drukuj raport",
    noEntriesToday: "Brak wpisów z dzisiaj.",
    failures: "Awarie",
    transfers: "Przekazania",
    servicesInspections: "Serwis/przeglądy",
    lastActivity: "Ostatnia aktywność",
    serviceRepairCosts: "Koszty serwisu/napraw",
    failurePriority: "Priorytet",
    failureQuestion: "Co się stało?",
    failurePlaceholder: "Np. uszkodzony kabel, nie działa, wyciek, pęknięcie...",
    failurePhotos: "Zdjęcia awarii / uszkodzeń",
    takePhoto: "Zrób zdjęcie",
    uploadFile: "Wgraj plik",
    priorityLow: "niski",
    priorityMedium: "średni",
    priorityUrgent: "pilny",
    phoneSpeedRepair: "Naprawa szybkości telefonu",
    phoneSpeedRepairHint: "Odchudza istniejące zdjęcia zapisane w bazie. Nie usuwa danych ani zdjęć, tylko zmniejsza ich wagę, żeby aplikacja działała na telefonie.",
    optimizePhotosInDb: "Odchudź zdjęcia w bazie",
    toolPdfCard: "Karta PDF",
    ppe: "PPE / ŚOI",
    ppeSubtitle: "Środki ochrony indywidualnej pracowników",
    ppeEmployees: "Pracownicy PPE",
    ppeEquipment: "Wyposażenie PPE",
    addPpe: "Dodaj PPE",
    editPpe: "Edytuj PPE",
    deletePpe: "Usuń PPE",
    printPpeQr: "Drukuj mały QR",
    ppeType: "Rodzaj PPE",
    ppeItem: "Nazwa / model",
    ppeSize: "Rozmiar",
    ppeIssuedDate: "Data wydania",
    ppeExpiryDate: "Data ważności / przeglądu",
    ppeStatusOk: "OK",
    ppeStatusWarning: "Do kontroli",
    ppeStatusExpired: "Po terminie",
    ppeStatusLost: "Zgubione",
    ppeStatusDamaged: "Uszkodzone",
    ppeNoItems: "Brak PPE dla tego pracownika.",
    ppePublicTitle: "ACC BAU • PPE INFORMATION",
    ppePublicSubtitle: "Informacje po zeskanowaniu małego QR — bez logowania.",
    ppeAssignedTo: "Przypisane do",
    ppeQrHint: "Mały QR dla kasku, szelek, butów lub kurtki.",
    ppeDashboardMissing: "Braki PPE",
    ppeDashboardExpired: "PPE po terminie",
    ppeDashboardSoon: "PPE do kontroli",
    ppeAllEmployees: "Wszyscy pracownicy",
    ppeHistoryNote: "Historia PPE jest zapisywana razem z ustawieniami i nie kasuje narzędzi ani zdjęć.",
    ppeSaveError: "Nie udało się zapisać PPE:",
    ppeEmployeeCard: "Karta pracownika PPE",
    printEmployeePpe: "Drukuj kartę pracownika",
    ppeIssuedItems: "Wydane środki ochrony",
    ppeRequiredSet: "Wymagany zestaw",
    ppeMissingItems: "Brakuje",
    ppeCompleteSet: "Komplet PPE",
    ppeSignature: "Podpis pracownika",
    ppeTypeHelmet: "Kask",
    ppeTypeShoes: "Buty ochronne",
    ppeTypeHarness: "Szelki bezpieczeństwa",
    ppeTypeJacket: "Kurtka",
    ppeTypeGloves: "Rękawice",
    ppeTypeGlasses: "Okulary ochronne",
    ppeTypeHearing: "Ochronniki słuchu",
    ppeTypeMask: "Maska",
    ppeTypeVest: "Kamizelka",
    ppeTypeOther: "Inne",
    ppeSizes: "Rozmiary pracownika",
    ppeEmployeeSummary: "Podsumowanie PPE pracownika",
    ppeFormHint: "Wypełnij dane wydanego środka ochrony. Istniejące PPE i historia nie są usuwane.",
    ppeSuggested: "Podpowiedź: dla nowych pracowników sprawdź kask, buty, kamizelkę, rękawice i okulary.",
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
    reportFailure: "Report failure",
    failureReported: "Failure reported",
    failureReportedDetails: "User reported equipment failure",
    failureStatus: "Failure",
    clearFailure: "Clear failure",
    failureCleared: "Failure cleared",
    failureClearedDetails: "Admin cleared the equipment failure",
    workerCannotClearFailure: "Only admin can clear a failure.",
    qrUnreadable: "QR unreadable",
    qrUnreadableReported: "Unreadable QR reported",
    qrUnreadableDetails: "User reported that the QR label is unreadable",
    qrReplacementReceived: "New QR received",
    qrReplacementReceivedDetails: "New QR label receipt confirmed",
    qrAlarmStatus: "QR unreadable — new label needed",
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
    noInspectionRequired: "No inspection required",
    inspectionsOkPermanent: "Inspections OK — no expiry",
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
    days: "days",
    printHistory: "Print history",
    printAllHistory: "Print full history",
    printGenerated: "Print generated",
    historyTitle: "Handover history",
    historySubtitle: "Who handed over what, to whom, and when",
    historyClickHint: "Click a history entry to view giver and receiver photos.",
    date: "Date",
    equipment: "Equipment",
    action: "Action",
    from: "From",
    to: "To",
    details: "Details",
    photos: "Photos",
    userLabel: "User",
    noPhotosShort: "no photos",
    photoOne: "photo",
    photosMany: "photos",
    clickToViewPhotos: "Click to view photos",
    historyDetailTitle: "Handover details",
    giverPhotos: "Giver photos",
    receiverPhotos: "Receiver photos",
    noPhotos: "No photos.",
    addPhotoCamera: "📷 Add photo / take with camera",
    uploadPhotoDevice: "🖼️ Upload photo from device",
    photosSavedInHistory: "Photos will be saved in the history of this handover.",
    noPhotosAdded: "No photos added yet.",
    remove: "Remove",
    skip: "Skip",
    savePhotos: "Save photos",
    saving: "Saving...",
    preparePhotoError: "Could not prepare the photo. Try a smaller photo.",
    savePhotoError: "Could not save photos in Supabase:",
    savePhotoErrorHint: "Try adding fewer photos or smaller photos.",
    handoverPhotoTitle: "You handed over the tool — add condition/damage photos if you want",
    receiverPhotoTitle: "You received the tool — add condition/damage photos if you want",
    transferCreated: "Handover code created",
    handover: "Handover",
    transferCodeAction: "Handover code",
    claimAction: "Received",
    changedData: "Data changed",
    addedTool: "Tool added",
    photosAddedOnHandover: "Photos added during handover",
    photosAddedOnClaim: "Photos added during receipt",
    waitingForReceiver: "waiting for receiver",
    name: "Name",
    brand: "Brand",
    model: "Model",
    type: "Type",
    toolPhoto: "Tool photo",
    preview: "Preview",
    removePhoto: "Remove photo",
    loadingDb: "Loading database...",
    supabaseOffline: "Warning: no Supabase connection. The app is running locally.",
    badTransferCode: "Invalid handover code",
    toolNotFound: "Tool not found",
    cannotClaimFromYourself: "You cannot receive from yourself",
    cannotClaimCurrent: "Cannot receive. Current holder:",
    openCameraScan: "Open camera and scan QR",
    closeCamera: "Close camera",
    scannerUnsupported: "This phone/browser does not support automatic QR scanning. Use Chrome on Android or paste the code manually.",
    serviceRepair: "Repair / Service",
    repair: "Repair",
    service: "Service",
    workDone: "Work done",
    serviceRepairHistory: "Inspection, service and repair history",
    inspectionRecord: "Inspection",
    serviceRecord: "Service / repair",
    deleteInspection: "Delete entry",
    confirmDeleteInspection: "Delete this inspection/service entry?",
    inspectionDeleted: "Inspection/service entry deleted",
    inspectionDeletedDetails: "Admin deleted an incorrect inspection/service entry",
    noNextDateRequired: "No next date required — service / repair entry",
    attachments: "Attachments / photos / documents",
    addAttachmentCamera: "📷 Take certificate / invoice photo",
    uploadAttachmentDevice: "🖼️ Upload photo or PDF from device",
    noAttachments: "No attachments.",
    attachmentSavedHint: "Photos, certificates or invoices will be saved with this entry.",
    removeAttachment: "Remove attachment",
    attachmentPrepareError: "Could not prepare the attachment. Try a smaller file.",
    cameraError: "Could not open camera. Check camera permission and HTTPS.",
    alertsDashboardTitle: "Alarm dashboard",
    alertsDashboardHint: "Click a tile to filter. Click again to clear it and show all tools.",
    alarmFailures: "Failures",
    alarmQrIssues: "QR replacement",
    alarmInspectionWarnings: "Inspections / missing",
    alarmUnassigned: "No holder",
    alarmNoLocation: "No location",
    active: "Active",
    dayReport: "Daily report",
    dayReportSubtitle: "Today’s handovers, failures and service entries",
    printDayReport: "Print report",
    noEntriesToday: "No entries today.",
    failures: "Failures",
    transfers: "Handovers",
    servicesInspections: "Service/inspections",
    lastActivity: "Last activity",
    serviceRepairCosts: "Service/repair costs",
    failurePriority: "Priority",
    failureQuestion: "What happened?",
    failurePlaceholder: "E.g. damaged cable, not working, leak, crack...",
    failurePhotos: "Failure / damage photos",
    takePhoto: "Take photo",
    uploadFile: "Upload file",
    priorityLow: "low",
    priorityMedium: "medium",
    priorityUrgent: "urgent",
    phoneSpeedRepair: "Phone speed repair",
    phoneSpeedRepairHint: "Optimizes existing photos stored in the database. It does not delete data or photos, it only reduces file size so the app works better on phones.",
    optimizePhotosInDb: "Optimize photos in database",
    toolPdfCard: "Tool PDF card",
    ppe: "PPE",
    ppeSubtitle: "Personal protective equipment per employee",
    ppeEmployees: "PPE employees",
    ppeEquipment: "PPE equipment",
    addPpe: "Add PPE",
    editPpe: "Edit PPE",
    deletePpe: "Delete PPE",
    printPpeQr: "Print small QR",
    ppeType: "PPE type",
    ppeItem: "Name / model",
    ppeSize: "Size",
    ppeIssuedDate: "Issue date",
    ppeExpiryDate: "Expiry / inspection date",
    ppeStatusOk: "OK",
    ppeStatusWarning: "Check required",
    ppeStatusExpired: "Expired",
    ppeStatusLost: "Lost",
    ppeStatusDamaged: "Damaged",
    ppeNoItems: "No PPE for this employee.",
    ppePublicTitle: "ACC BAU • PPE INFORMATION",
    ppePublicSubtitle: "Information after scanning small QR — no login required.",
    ppeAssignedTo: "Assigned to",
    ppeQrHint: "Small QR for helmet, harness, shoes or jacket.",
    ppeDashboardMissing: "Missing PPE",
    ppeDashboardExpired: "Expired PPE",
    ppeDashboardSoon: "PPE due soon",
    ppeAllEmployees: "All employees",
    ppeHistoryNote: "PPE history is saved in settings and does not delete tools or photos.",
    ppeSaveError: "Could not save PPE:",
    ppeEmployeeCard: "Employee PPE card",
    printEmployeePpe: "Print employee card",
    ppeIssuedItems: "Issued PPE items",
    ppeRequiredSet: "Required set",
    ppeMissingItems: "Missing",
    ppeCompleteSet: "Complete PPE",
    ppeSignature: "Employee signature",
    ppeTypeHelmet: "Helmet",
    ppeTypeShoes: "Safety shoes",
    ppeTypeHarness: "Safety harness",
    ppeTypeJacket: "Jacket",
    ppeTypeGloves: "Gloves",
    ppeTypeGlasses: "Safety glasses",
    ppeTypeHearing: "Hearing protection",
    ppeTypeMask: "Mask",
    ppeTypeVest: "Safety vest",
    ppeTypeOther: "Other",
    ppeSizes: "Employee sizes",
    ppeEmployeeSummary: "Employee PPE summary",
    ppeFormHint: "Fill in issued PPE details. Existing PPE and history are not deleted.",
    ppeSuggested: "Tip: for new workers check helmet, shoes, vest, gloves and glasses.",
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
    reportFailure: "Störung melden",
    failureReported: "Störung gemeldet",
    failureReportedDetails: "Benutzer hat eine Gerätestörung gemeldet",
    failureStatus: "Störung",
    clearFailure: "Störung entfernen",
    failureCleared: "Störung entfernt",
    failureClearedDetails: "Admin hat die Gerätestörung entfernt",
    workerCannotClearFailure: "Nur Admin kann eine Störung entfernen.",
    qrUnreadable: "QR unlesbar",
    qrUnreadableReported: "Unlesbarer QR gemeldet",
    qrUnreadableDetails: "Benutzer hat gemeldet, dass der QR-Aufkleber unlesbar ist",
    qrReplacementReceived: "Neuer QR erhalten",
    qrReplacementReceivedDetails: "Erhalt des neuen QR-Aufklebers bestätigt",
    qrAlarmStatus: "QR unlesbar — neuer Aufkleber erforderlich",
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
    noInspectionRequired: "Keine Prüfung erforderlich",
    inspectionsOkPermanent: "Prüfungen OK — unbefristet",
    inspectionNeedsAction: "Prüfung erfordert Reaktion",
    publicInfo: "HSE Information",
    publicTitle: "ACC BAU • HSE INFORMATION",
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
    days: "Tage",
    printHistory: "Historie drucken",
    printAllHistory: "Gesamte Historie drucken",
    printGenerated: "Ausdruck",
    historyTitle: "Übergabehistorie",
    historySubtitle: "Wer wann welches Gerät an wen übergeben hat",
    historyClickHint: "Klicken Sie auf einen Historieneintrag, um Fotos von Übergeber und Empfänger zu sehen.",
    date: "Datum",
    equipment: "Gerät",
    action: "Aktion",
    from: "Von",
    to: "An",
    details: "Details",
    photos: "Fotos",
    userLabel: "Benutzer",
    noPhotosShort: "keine Fotos",
    photoOne: "Foto",
    photosMany: "Fotos",
    clickToViewPhotos: "Klicken, um Fotos zu sehen",
    historyDetailTitle: "Übergabedetails",
    giverPhotos: "Fotos des Übergebers",
    receiverPhotos: "Fotos des Empfängers",
    noPhotos: "Keine Fotos.",
    addPhotoCamera: "📷 Foto hinzufügen / mit Kamera aufnehmen",
    uploadPhotoDevice: "🖼️ Foto vom Gerät hochladen",
    photosSavedInHistory: "Fotos werden in der Historie dieser Übergabe gespeichert.",
    noPhotosAdded: "Noch keine Fotos hinzugefügt.",
    remove: "Entfernen",
    skip: "Überspringen",
    savePhotos: "Fotos speichern",
    saving: "Speichern...",
    preparePhotoError: "Foto konnte nicht vorbereitet werden. Versuchen Sie ein kleineres Foto.",
    savePhotoError: "Fotos konnten nicht in Supabase gespeichert werden:",
    savePhotoErrorHint: "Versuchen Sie weniger oder kleinere Fotos hinzuzufügen.",
    handoverPhotoTitle: "Sie haben das Gerät übergeben — fügen Sie bei Bedarf Zustands-/Schadensfotos hinzu",
    receiverPhotoTitle: "Sie haben das Gerät übernommen — fügen Sie bei Bedarf Zustands-/Schadensfotos hinzu",
    transferCreated: "Übergabecode erstellt",
    handover: "Übergabe",
    transferCodeAction: "Übergabecode",
    claimAction: "Übernommen",
    changedData: "Daten geändert",
    addedTool: "Gerät hinzugefügt",
    photosAddedOnHandover: "Fotos bei Übergabe hinzugefügt",
    photosAddedOnClaim: "Fotos bei Übernahme hinzugefügt",
    waitingForReceiver: "wartet auf Empfänger",
    name: "Name",
    brand: "Marke",
    model: "Modell",
    type: "Typ",
    toolPhoto: "Gerätefoto",
    preview: "Vorschau",
    removePhoto: "Foto entfernen",
    loadingDb: "Datenbank wird geladen...",
    supabaseOffline: "Hinweis: keine Verbindung zu Supabase. Die App läuft lokal.",
    badTransferCode: "Ungültiger Übergabecode",
    toolNotFound: "Werkzeug nicht gefunden",
    cannotClaimFromYourself: "Sie können nicht von sich selbst übernehmen",
    cannotClaimCurrent: "Übernahme nicht möglich. Aktuell:",
    openCameraScan: "Kamera öffnen und QR scannen",
    closeCamera: "Kamera schließen",
    scannerUnsupported: "Dieses Telefon/dieser Browser unterstützt kein automatisches QR-Scannen. Verwenden Sie Chrome auf Android oder fügen Sie den Code manuell ein.",
    serviceRepair: "Reparatur / Service",
    repair: "Reparatur",
    service: "Service",
    workDone: "Was wurde gemacht",
    serviceRepairHistory: "Historie der Prüfungen, Services und Reparaturen",
    inspectionRecord: "Prüfung",
    serviceRecord: "Service / Reparatur",
    deleteInspection: "Eintrag löschen",
    confirmDeleteInspection: "Diesen Prüfungs-/Serviceeintrag löschen?",
    inspectionDeleted: "Prüfungs-/Serviceeintrag gelöscht",
    inspectionDeletedDetails: "Admin hat einen fehlerhaften Prüfungs-/Serviceeintrag gelöscht",
    noNextDateRequired: "Kein nächster Termin erforderlich — Service- / Reparatureintrag",
    attachments: "Anhänge / Fotos / Dokumente",
    addAttachmentCamera: "📷 Zertifikat/Rechnung fotografieren",
    uploadAttachmentDevice: "🖼️ Foto oder PDF vom Gerät hochladen",
    noAttachments: "Keine Anhänge.",
    attachmentSavedHint: "Fotos, Zertifikate oder Rechnungen werden mit diesem Eintrag gespeichert.",
    removeAttachment: "Anhang entfernen",
    attachmentPrepareError: "Anhang konnte nicht vorbereitet werden. Versuchen Sie eine kleinere Datei.",
    cameraError: "Kamera konnte nicht geöffnet werden. Prüfen Sie Kameraberechtigung und HTTPS.",
    alertsDashboardTitle: "Alarm-Dashboard",
    alertsDashboardHint: "Klicken Sie auf eine Kachel zum Filtern. Nochmals klicken, um den Filter zu entfernen und alles anzuzeigen.",
    alarmFailures: "Störungen",
    alarmQrIssues: "QR ersetzen",
    alarmInspectionWarnings: "Prüfungen / fehlend",
    alarmUnassigned: "Ohne Besitzer",
    alarmNoLocation: "Ohne Standort",
    active: "Aktiv",
    dayReport: "Tagesbericht",
    dayReportSubtitle: "Heutige Übergaben, Störungen und Serviceeinträge",
    printDayReport: "Bericht drucken",
    noEntriesToday: "Keine Einträge von heute.",
    failures: "Störungen",
    transfers: "Übergaben",
    servicesInspections: "Service/Prüfungen",
    lastActivity: "Letzte Aktivität",
    serviceRepairCosts: "Service-/Reparaturkosten",
    failurePriority: "Priorität",
    failureQuestion: "Was ist passiert?",
    failurePlaceholder: "Z.B. Kabel beschädigt, funktioniert nicht, Leck, Riss...",
    failurePhotos: "Fotos der Störung / Schäden",
    takePhoto: "Foto aufnehmen",
    uploadFile: "Datei hochladen",
    priorityLow: "niedrig",
    priorityMedium: "mittel",
    priorityUrgent: "dringend",
    phoneSpeedRepair: "Telefon-Geschwindigkeit verbessern",
    phoneSpeedRepairHint: "Optimiert vorhandene Fotos in der Datenbank. Es werden keine Daten oder Fotos gelöscht, nur die Dateigröße reduziert, damit die App auf dem Telefon besser läuft.",
    optimizePhotosInDb: "Fotos in der Datenbank optimieren",
    toolPdfCard: "Gerätekarte PDF",
    ppe: "PSA",
    ppeSubtitle: "Persönliche Schutzausrüstung pro Mitarbeiter",
    ppeEmployees: "PSA-Mitarbeiter",
    ppeEquipment: "PSA-Ausrüstung",
    addPpe: "PSA hinzufügen",
    editPpe: "PSA bearbeiten",
    deletePpe: "PSA löschen",
    printPpeQr: "Kleinen QR drucken",
    ppeType: "PSA-Art",
    ppeItem: "Name / Modell",
    ppeSize: "Größe",
    ppeIssuedDate: "Ausgabedatum",
    ppeExpiryDate: "Ablauf-/Prüfdatum",
    ppeStatusOk: "OK",
    ppeStatusWarning: "Prüfung erforderlich",
    ppeStatusExpired: "Abgelaufen",
    ppeStatusLost: "Verloren",
    ppeStatusDamaged: "Beschädigt",
    ppeNoItems: "Keine PSA für diesen Mitarbeiter.",
    ppePublicTitle: "ACC BAU • PSA INFORMATION",
    ppePublicSubtitle: "Informationen nach kleinem QR-Scan — ohne Login.",
    ppeAssignedTo: "Zugeordnet an",
    ppeQrHint: "Kleiner QR für Helm, Auffanggurt, Schuhe oder Jacke.",
    ppeDashboardMissing: "Fehlende PSA",
    ppeDashboardExpired: "PSA abgelaufen",
    ppeDashboardSoon: "PSA bald fällig",
    ppeAllEmployees: "Alle Mitarbeiter",
    ppeHistoryNote: "PSA-Historie wird in den Einstellungen gespeichert und löscht keine Werkzeuge oder Fotos.",
    ppeSaveError: "PSA konnte nicht gespeichert werden:",
    ppeEmployeeCard: "PSA-Mitarbeiterkarte",
    printEmployeePpe: "Mitarbeiterkarte drucken",
    ppeIssuedItems: "Ausgegebene PSA",
    ppeRequiredSet: "Erforderlicher Satz",
    ppeMissingItems: "Fehlt",
    ppeCompleteSet: "PSA komplett",
    ppeSignature: "Unterschrift Mitarbeiter",
    ppeTypeHelmet: "Helm",
    ppeTypeShoes: "Sicherheitsschuhe",
    ppeTypeHarness: "Auffanggurt",
    ppeTypeJacket: "Jacke",
    ppeTypeGloves: "Handschuhe",
    ppeTypeGlasses: "Schutzbrille",
    ppeTypeHearing: "Gehörschutz",
    ppeTypeMask: "Maske",
    ppeTypeVest: "Warnweste",
    ppeTypeOther: "Sonstige",
    ppeSizes: "Mitarbeitergrößen",
    ppeEmployeeSummary: "PSA-Übersicht Mitarbeiter",
    ppeFormHint: "Füllen Sie die Daten der ausgegebenen PSA aus. Bestehende PSA und Historie werden nicht gelöscht.",
    ppeSuggested: "Hinweis: Bei neuen Mitarbeitern Helm, Schuhe, Weste, Handschuhe und Brille prüfen.",
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

function normalizeSettings(value) {
  const source = value && typeof value === "object" ? value : {};
  const people = Array.isArray(source.people) && source.people.length ? source.people : defaultSettings.people;
  const projects = Array.isArray(source.projects) && source.projects.length ? source.projects : defaultSettings.projects;
  const categories = Array.isArray(source.categories) && source.categories.length ? source.categories : defaultSettings.categories;
  const pins = source.pins && typeof source.pins === "object" && Object.keys(source.pins).length ? source.pins : defaultSettings.pins;
  const roles = source.roles && typeof source.roles === "object" && Object.keys(source.roles).length ? source.roles : defaultSettings.roles;

  return {
    ...source,
    people,
    projects,
    categories,
    pins,
    roles,
    updatedAt: source.updatedAt || "",
  };
}

function settingsComparable(value) {
  const normalized = normalizeSettings(value);
  const { updatedAt, ...rest } = normalized;
  return JSON.stringify(rest);
}

function settingsDifferent(a, b) {
  return settingsComparable(a) !== settingsComparable(b);
}

function pickBestSettings(localSettings, serverSettings) {
  const local = normalizeSettings(localSettings);
  const server = serverSettings ? normalizeSettings(serverSettings) : null;

  if (!server) return { settings: local, shouldPushLocal: true };

  const localTs = Date.parse(local.updatedAt || "") || 0;
  const serverTs = Date.parse(server.updatedAt || "") || 0;

  if (localTs && serverTs) {
    return localTs > serverTs
      ? { settings: local, shouldPushLocal: true }
      : { settings: server, shouldPushLocal: false };
  }

  if (localTs && !serverTs) return { settings: local, shouldPushLocal: true };

  if (!serverTs && settingsDifferent(local, defaultSettings) && !settingsDifferent(server, defaultSettings)) {
    return { settings: local, shouldPushLocal: true };
  }

  return { settings: server, shouldPushLocal: false };
}

async function persistSettingsEverywhere(nextSettings, setSettingsCallback) {
  const normalized = normalizeSettings({
    ...nextSettings,
    updatedAt: nextSettings.updatedAt || new Date().toISOString(),
  });

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
  if (setSettingsCallback) setSettingsCallback(normalized);

  if (supabase) {
    const { error } = await supabase.from("settings").upsert({ id: "main", data: normalized });
    if (error) throw error;
  }

  return normalized;
}

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
    photo: "",
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
    photo: "",
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
  photo: "",
  inspections: [],
};

const statusOptions = ["Wszystkie", "Dostępne", "Wydane", "Do przeglądu", "Awaria", "Uszkodzone", "Zgubione"];
const inspectionTypes = ["DGUV/VDE", "Kalibracja", "Serwis mechaniczny", "Przegląd producenta", "Przegląd UDT", "Ubezpieczenie", "Naprawa / Serwis", "Naprawa", "Serwis", "Inny"]; 

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

async function compressImage(file, maxSize = 700, quality = 0.45) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;
          const scale = Math.min(1, maxSize / Math.max(width, height));

          width = Math.round(width * scale);
          height = Math.round(height * scale);

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (e) {
          reject(e);
        }
      };

      img.onerror = reject;
      img.src = String(reader.result || "");
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function prepareAttachmentFile(file) {
  if (!file) return null;
  const isImage = file.type?.startsWith("image/");
  const url = isImage ? await compressImage(file, 700, 0.45) : await readFileAsDataUrl(file);
  return {
    id: crypto.randomUUID?.() || String(Date.now() + Math.random()),
    name: file.name || "attachment",
    type: file.type || "application/octet-stream",
    url,
  };
}


function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
}

function isDataImage(value) {
  return typeof value === "string" && value.startsWith("data:image/");
}

function dataUrlBytes(value) {
  if (!isDataImage(value)) return 0;
  const base64 = value.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

async function compressDataUrlImage(dataUrl, maxSize = 520, quality = 0.38) {
  if (!isDataImage(dataUrl)) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;
        const scale = Math.min(1, maxSize / Math.max(width, height));

        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
      } catch {
        resolve(dataUrl);
      }
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function optimizeImagesInObject(value) {
  if (isDataImage(value)) {
    if (dataUrlBytes(value) < 120000) return value;
    return await compressDataUrlImage(value, 520, 0.38);
  }

  if (Array.isArray(value)) {
    const out = [];
    for (const item of value) out.push(await optimizeImagesInObject(item));
    return out;
  }

  if (value && typeof value === "object") {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = await optimizeImagesInObject(val);
    }
    return out;
  }

  return value;
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

function normalizeAttachment(attachment, index = 0) {
  if (!attachment) return null;
  if (typeof attachment === "string") {
    return {
      id: `att-${index}-${attachment.slice(0, 24)}`,
      name: `Attachment ${index + 1}`,
      type: attachment.startsWith("data:image/") ? "image/*" : "application/octet-stream",
      url: attachment,
    };
  }

  const url = attachment.url || attachment.dataUrl || attachment.data || attachment.src || attachment.content || "";
  if (!url) return null;

  return {
    id: attachment.id || `att-${index}-${Date.now()}`,
    name: attachment.name || attachment.filename || `Attachment ${index + 1}`,
    type: attachment.type || attachment.mimeType || (String(url).startsWith("data:image/") ? "image/*" : "application/octet-stream"),
    url,
  };
}

function normalizeInspectionItem(item) {
  if (!item) return null;
  const attachments = Array.isArray(item.attachments)
    ? item.attachments.map((a, i) => normalizeAttachment(a, i)).filter(Boolean)
    : [];

  return {
    ...item,
    id: item.id || crypto.randomUUID?.() || String(Date.now() + Math.random()),
    kind: isServiceRecord(item) ? "service" : (item.kind || "inspection"),
    attachments,
  };
}

function normalizeInspectionsList(list) {
  return Array.isArray(list) ? list.map(normalizeInspectionItem).filter(Boolean) : [];
}

function inspections(tool) {
  return normalizeInspectionsList(tool?.inspections);
}

function isNoInspectionRequired(item) {
  return !!item?.noInspectionRequired || item?.type === "Nie wymaga przeglądu" || item?.type === "No inspection required" || item?.type === "Keine Prüfung erforderlich";
}

function isServiceRecord(item) {
  if (isNoInspectionRequired(item)) return false;
  return item?.kind === "service" || ["Naprawa / Serwis", "Naprawa", "Serwis"].includes(item?.type) || (!item?.nextDate && item?.doneDate);
}

function hasPermanentInspectionOk(tool) {
  return inspections(tool).some((item) => isNoInspectionRequired(item));
}

function urgentInspection(tool) {
  const list = inspections(tool).filter((item) => !isServiceRecord(item) && !isNoInspectionRequired(item) && item.nextDate);
  if (!list.length) return null;
  return [...list].sort((a, b) => daysUntil(a.nextDate) - daysUntil(b.nextDate))[0];
}

function inspectionStatus(tool, T = I18N.pl) {
  if (hasPermanentInspectionOk(tool)) return { danger: false, label: T.inspectionsOkPermanent || "Przeglądy OK — bezterminowo", cls: "bg-green-100 text-green-700 border-green-200" };
  const item = urgentInspection(tool);
  if (!item) return { danger: true, label: T.noReview, cls: "bg-red-100 text-red-700 border-red-200" };
  const d = daysUntil(item.nextDate);
  if (d < 0) return { danger: true, label: `${item.type} ${T.overdue}`, cls: "bg-red-100 text-red-700 border-red-200" };
  if (d <= 30) return { danger: true, label: `${item.type} ${T.inDays} ${d} ${T.days}`, cls: "bg-red-100 text-red-700 border-red-200" };
  return { danger: false, label: T.reviewsOk, cls: "bg-green-100 text-green-700 border-green-200" };
}

function badgeStatus(status) {
  if (status === "Wydane") return "bg-blue-100 text-blue-700 border-blue-200";
  if (status === "Dostępne") return "bg-green-100 text-green-700 border-green-200";
  if (status === "Do przeglądu" || status === "Uszkodzone" || status === "Awaria") return "bg-red-100 text-red-700 border-red-200";
  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function historyActionText(value, T) {
  const map = {
    "Przekazanie - kod utworzony": T.transferCreated,
    "Przekazanie": T.handover,
    "Kod przekazania": T.transferCodeAction,
    "Przejęcie": T.claimAction,
    "Zmieniono dane": T.changedData,
    "Dodano sprzęt": T.addedTool,
    "Zgłoszono awarię": T.failureReported,
    "Zdjęto awarię": T.failureCleared,
    "Zgłoszono nieczytelny QR": T.qrUnreadableReported,
    "Nowy QR otrzymano": T.qrReplacementReceived,
  };
  return map[value] || value || "—";
}

function historyDetailsText(value, T) {
  const map = {
    "Zdjęcia dodane przy przekazaniu": T.photosAddedOnHandover,
    "Zdjęcia dodane przy przejęciu": T.photosAddedOnClaim,
  };
  if (!value) return "—";
  if (map[value]) return map[value];
  return value.replace("oczekuje na odbiorcę", T.waitingForReceiver);
}

function photoCountText(count, T) {
  if (!count) return T.noPhotosShort;
  return `${count} ${count === 1 ? T.photoOne : T.photosMany}`;
}


function historyAttachments(item) {
  const list = [];
  if (Array.isArray(item?.attachments)) list.push(...item.attachments);
  if (Array.isArray(item?.photos)) list.push(...item.photos);
  if (Array.isArray(item?.inspectionAttachments)) list.push(...item.inspectionAttachments);
  return list.map((a, i) => normalizeAttachment(a, i)).filter(Boolean);
}

function historyPhotoCount(item) {
  return (item?.photosFromGiver?.length || 0) + (item?.photosFromReceiver?.length || 0) + historyAttachments(item).length;
}

function attachmentCountText(count, T) {
  if (!count) return T.noAttachments || T.noPhotosShort;
  return `${count} ${T.attachments || T.photos}`;
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
  const [dashboardFilter, setDashboardFilter] = useState("");
  const [activeModule, setActiveModule] = useState("tools");
  const [publicPpeId, setPublicPpeId] = useState("");
  const [showToolForm, setShowToolForm] = useState(false);
  const [toolForm, setToolForm] = useState(emptyTool);
  const [editing, setEditing] = useState(false);
  const [showInspection, setShowInspection] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDayReport, setShowDayReport] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoContext, setPhotoContext] = useState(null);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [transferCode, setTransferCode] = useState("");
  const [publicToolId, setPublicToolId] = useState("");
  const [dbLoaded, setDbLoaded] = useState(false);
  const [dbStatus, setDbStatus] = useState("local");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const T = I18N[lang] || I18N.pl;

  useEffect(() => {
    initApp();
  }, []);

  async function initApp() {
    const u = localStorage.getItem(USER_KEY) || "";
    const storedLang = localStorage.getItem(LANG_KEY) || "pl";
    const params = new URLSearchParams(window.location.search);
    const publicTool = params.get("publicTool");
    const publicPpe = params.get("publicPpe");
    const transfer = params.get("transfer");

    setUser(u);
    setLang(storedLang);
    if (publicTool) setPublicToolId(publicTool);
    if (publicPpe) setPublicPpeId(publicPpe);
    if (transfer) {
      setTransferCode(transfer);
      setShowClaim(true);
    }

    const localSettings = normalizeSettings(load(SETTINGS_KEY, defaultSettings));

    const mobile = isMobileDevice();

    if (!supabase) {
      const t = load(STORAGE_KEY, []);
      const h = mobile ? [] : load(HISTORY_KEY, []);
      setTools(t);
      setSettings(localSettings);
      setHistory(h);
      setHistoryLoaded(!mobile);
      setSelected(t[0] || null);
      setDbStatus("local");
      setDbLoaded(true);
      return;
    }

    try {
      setDbStatus("loading");
      const [toolsRes, settingsRes, historyRes] = await Promise.all([
        supabase.from("tools").select("id,data").order("id"),
        supabase.from("settings").select("id,data").eq("id", "main").maybeSingle(),
        mobile ? Promise.resolve({ data: [], error: null }) : supabase.from("history").select("id,data").limit(250),
      ]);

      let loadedTools = (toolsRes.data || []).map((row) => row.data).filter(Boolean).map((tool) => ({
        ...tool,
        inspections: normalizeInspectionsList(tool.inspections),
      }));
      let serverSettings = settingsRes.data?.data || null;
      let loadedHistory = (historyRes.data || [])
        .map((row) => ({ id: row.id, ...(row.data || {}) }))
        .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

      const pickedSettings = pickBestSettings(localSettings, serverSettings);
      let loadedSettings = pickedSettings.settings;

      if (pickedSettings.shouldPushLocal) {
        const { error } = await supabase.from("settings").upsert({ id: "main", data: loadedSettings });
        if (error) console.error("settings sync error", error);
      }

      localStorage.setItem(SETTINGS_KEY, JSON.stringify(loadedSettings));

      // Nie dodajemy automatycznie demo-narzędzi, gdy baza jest pusta.
      // Inaczej po usunięciu wszystkich narzędzi wracałyby po odświeżeniu.
      if (!loadedTools.length) {
        loadedTools = [];
      }

      setTools(loadedTools);
      setSettings(loadedSettings);
      setHistory(loadedHistory);
      setHistoryLoaded(!mobile);
      setSelected(loadedTools[0] || null);
      setDbStatus("online");
      setDbLoaded(true);
    } catch (e) {
      console.error(e);
      const localSettings = normalizeSettings(load(SETTINGS_KEY, defaultSettings));
      setTools(load(STORAGE_KEY, []));
      setSettings(localSettings);
      setHistory(mobile ? [] : load(HISTORY_KEY, []));
      setHistoryLoaded(!mobile);
      setSelected(load(STORAGE_KEY, [])[0] || null);
      setDbStatus("error");
      setDbLoaded(true);
    }
  }

  useEffect(() => {
    if (!dbLoaded || isMobileDevice()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
  }, [tools, dbLoaded]);
  useEffect(() => {
    if (!dbLoaded || isMobileDevice()) return;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history, dbLoaded]);
  useEffect(() => {
    if (!dbLoaded) return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings, dbLoaded]);
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
      const dashboardMatch =
        !dashboardFilter ||
        (dashboardFilter === "failures" && (t.status === "Awaria" || t.status === "Uszkodzone")) ||
        (dashboardFilter === "qrIssues" && !!t.qrIssue) ||
        (dashboardFilter === "inspectionWarnings" && inspectionStatus(t, T).danger) ||
        (dashboardFilter === "unassigned" && !t.assignedTo) ||
        (dashboardFilter === "noLocation" && !t.location);

      return dashboardMatch &&
        text.includes(query.toLowerCase()) &&
        (category === "Wszystkie" || t.category === category) &&
        (status === "Wszystkie" || t.status === status) &&
        (project === "Wszystkie" || t.project === project) &&
        (person === "Wszystkie" || (person === "Nieprzypisane" ? !t.assignedTo : t.assignedTo === person));
    });
  }, [tools, query, category, status, project, person, dashboardFilter, T]);

  function toggleDashboardFilter(filterKey) {
    setDashboardFilter((current) => current === filterKey ? "" : filterKey);
    setStatus("Wszystkie");
    setPerson("Wszystkie");
  }

  const stats = {
    all: tools.length,
    free: tools.filter((t) => t.status === "Dostępne").length,
    issued: tools.filter((t) => t.status === "Wydane").length,
    danger: tools.filter((t) => inspectionStatus(t, T).danger).length,
  };

  const alarmStats = useMemo(() => {
    const failures = tools.filter((t) => t.status === "Awaria" || t.status === "Uszkodzone");
    const qrIssues = tools.filter((t) => !!t.qrIssue);
    const inspectionWarnings = tools.filter((t) => inspectionStatus(t, T).danger);
    const unassigned = tools.filter((t) => !t.assignedTo);
    const noLocation = tools.filter((t) => !t.location);
    return { failures, qrIssues, inspectionWarnings, unassigned, noLocation };
  }, [tools, T]);

  async function log(tool, action, details, extra = {}) {
    const item = {
      id: crypto.randomUUID?.() || String(Date.now()),
      toolId: tool.id,
      toolName: tool.name || "",
      serial: tool.serial || "",
      date: new Date().toLocaleString("pl-PL"),
      user,
      action,
      details,
      from: extra.from || "",
      to: extra.to || "",
      photosFromGiver: [],
      photosFromReceiver: [],
      ...extra,
    };

    setHistory((prev) => [item, ...prev.filter((h) => h.id !== item.id)]);

    if (supabase) {
      const { error } = await supabase.from("history").upsert({ id: item.id, data: item });
      if (error) console.error("history save error", error);
    }

    return item;
  }

  async function saveHistoryItem(item) {
    const normalized = {
      ...item,
      toolName: item.toolName || tools.find((t) => t.id === item.toolId)?.name || "",
      serial: item.serial || tools.find((t) => t.id === item.toolId)?.serial || "",
      photosFromGiver: item.photosFromGiver || [],
      photosFromReceiver: item.photosFromReceiver || [],
    };

    setHistory((prev) => [normalized, ...prev.filter((h) => h.id !== normalized.id)]);

    if (supabase) {
      const { error } = await supabase.from("history").upsert({ id: normalized.id, data: normalized });
      if (error) console.error("history upsert error", error);
    }

    return normalized;
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

  async function saveTool() {
    if (!isAdmin) return alert(T.noPermission);
    if (!toolForm.id || !toolForm.name) return alert(T.enterIdName);

    const normalizedTool = {
      ...toolForm,
      inspections: normalizeInspectionsList(toolForm.inspections),
    };

    if (editing) setTools((prev) => prev.map((t) => (t.id === normalizedTool.id ? normalizedTool : t)));
    else setTools((prev) => [normalizedTool, ...prev]);
    setSelected(normalizedTool);
    if (supabase) await supabase.from("tools").upsert({ id: normalizedTool.id, data: normalizedTool });
    log(normalizedTool, editing ? T.edit : T.add, editing ? "Zmieniono dane" : "Dodano sprzęt");
    setShowToolForm(false);
  }

  async function updateTool(tool, action, details, options = {}) {
    const normalizedTool = {
      ...tool,
      inspections: normalizeInspectionsList(tool.inspections),
    };

    setTools((prev) => prev.map((t) => (t.id === normalizedTool.id ? normalizedTool : t)));
    setSelected(normalizedTool);

    if (supabase) {
      const { error } = await supabase.from("tools").upsert({ id: normalizedTool.id, data: normalizedTool });
      if (error) {
        alert((T.savePhotoError || "Nie udało się zapisać danych w Supabase:") + " " + error.message + "\n\n" + (T.savePhotoErrorHint || "Spróbuj dodać mniej zdjęć albo mniejsze zdjęcia."));
        console.error("tool save error", error);
        return;
      }
    }

    if (!options.skipHistory) await log(normalizedTool, action, details, options.historyExtra || {});
  }

  function addInspection(inspection) {
    if (!isAdmin) return alert(T.noPermission);
    if (!selected) return;

    const currentTool = tools.find((t) => t.id === selected.id) || selected;
    const previousInspections = normalizeInspectionsList(currentTool.inspections);
    const noRequired = !!inspection.noInspectionRequired;
    const normalized = normalizeInspectionItem({
      ...inspection,
      id: inspection.id || crypto.randomUUID?.() || String(Date.now()),
      kind: isServiceRecord(inspection) ? "service" : "inspection",
      noInspectionRequired: noRequired,
      type: noRequired ? (T.noInspectionRequired || "Nie wymaga przeglądu") : inspection.type,
      result: noRequired ? "OK" : (isServiceRecord(inspection) ? (inspection.result || T.done) : inspection.result),
      doneDate: noRequired ? "" : inspection.doneDate,
      nextDate: (noRequired || isServiceRecord(inspection)) ? "" : inspection.nextDate,
      cost: inspection.cost || "",
      attachments: Array.isArray(inspection.attachments)
        ? inspection.attachments.map((a, i) => normalizeAttachment(a, i)).filter(Boolean)
        : [],
    });

    const updated = {
      ...currentTool,
      inspections: [normalized, ...previousInspections.filter((entry) => entry.id !== normalized.id)],
    };

    if (!isNoInspectionRequired(normalized) && !isServiceRecord(normalized) && inspectionStatus(updated, T).danger && updated.status !== "Uszkodzone") updated.status = "Do przeglądu";

    const details = isNoInspectionRequired(normalized)
      ? `${T.noInspectionRequired || "Nie wymaga przeglądu"}: ${T.inspectionsOkPermanent || "Przeglądy OK — bezterminowo"}`
      : isServiceRecord(normalized)
        ? `${normalized.type}: ${normalized.doneDate} — ${normalized.notes || T.noNextDateRequired}`
        : `${normalized.type}: ${normalized.doneDate} / ${normalized.nextDate}`;

    updateTool(updated, isServiceRecord(normalized) ? T.serviceRecord : T.addInspection, details, { historyExtra: { attachments: normalized.attachments || [] } });
    setShowInspection(false);
  }

  function deleteInspection(inspectionId) {
    if (!isAdmin) return alert(T.noPermission);
    if (!selected) return;
    if (!confirm(T.confirmDeleteInspection)) return;

    const currentTool = tools.find((t) => t.id === selected.id) || selected;
    const currentInspections = normalizeInspectionsList(currentTool.inspections);
    const removed = currentInspections.find((i) => i.id === inspectionId);
    const updated = {
      ...currentTool,
      inspections: currentInspections.filter((i) => i.id !== inspectionId),
    };

    updateTool(
      updated,
      T.inspectionDeleted,
      removed ? `${removed.type}: ${removed.doneDate || "—"}` : T.inspectionDeletedDetails
    );
  }

  async function createTransfer() {
    if (!selected) return;
    if (selected.assignedTo && selected.assignedTo !== user) return alert(`Nie możesz przekazać. Sprzęt przypisany do: ${selected.assignedTo}`);

    const fromName = user;
    const historyItem = await log(selected, "Przekazanie - kod utworzony", `${fromName} ➜ oczekuje na odbiorcę`, {
      transferStatus: "created",
      from: fromName,
      to: "",
    });

    const ticket = {
      id: crypto.randomUUID?.() || String(Date.now()),
      historyId: historyItem.id,
      toolId: selected.id,
      toolName: selected.name,
      from: fromName,
      time: new Date().toISOString(),
    };

    const code = encodeTicket(ticket);
    setTransferCode(code);
    setShowTransfer(true);
    setPhotoContext({ historyId: historyItem.id, historyItem, mode: "giver", tool: selected, title: T.handoverPhotoTitle });
    setShowPhotoModal(true);
  }

  async function claimTransfer(code) {
    const ticket = decodeTicket(code.trim());
    if (!ticket) return alert(T.badTransferCode);

    const tool = tools.find((t) => t.id === ticket.toolId);
    if (!tool) return alert(T.toolNotFound);
    if (ticket.from === user) return alert(T.cannotClaimFromYourself);
    if (tool.assignedTo && tool.assignedTo !== ticket.from) return alert(`${T.cannotClaimCurrent} ${tool.assignedTo}`);

    const updated = { ...tool, status: "Wydane", assignedTo: user };
    await updateTool(updated, T.claimTool, `${ticket.from} ➜ ${user}`, { skipHistory: true });

    let baseHistory = history.find((h) => h.id === ticket.historyId);

    if (!baseHistory && supabase && ticket.historyId) {
      const { data } = await supabase.from("history").select("id,data").eq("id", ticket.historyId).maybeSingle();
      if (data?.data) baseHistory = { id: data.id, ...data.data };
    }

    if (!baseHistory) {
      baseHistory = {
        id: ticket.historyId || crypto.randomUUID?.() || String(Date.now()),
        toolId: tool.id,
        toolName: tool.name,
        serial: tool.serial || "",
        date: new Date().toLocaleString("pl-PL"),
        user: ticket.from,
        action: "Przekazanie",
        details: `${ticket.from} ➜ ${user}`,
        from: ticket.from,
        to: user,
        transferStatus: "claimed",
        photosFromGiver: [],
        photosFromReceiver: [],
      };
    }

    const updatedHistory = await saveHistoryItem({
      ...baseHistory,
      action: "Przekazanie",
      details: `${ticket.from} ➜ ${user}`,
      from: ticket.from,
      to: user,
      transferStatus: "claimed",
      claimedAt: new Date().toLocaleString("pl-PL"),
    });

    setPhotoContext({ historyId: updatedHistory.id, historyItem: updatedHistory, mode: "receiver", tool: updated, title: T.receiverPhotoTitle });
    setShowPhotoModal(true);
    setShowClaim(false);
    setTransferCode("");
  }

  function returnTool() {
    if (!selected) return;
    if (!isAdmin) return alert(T.noPermission);
    updateTool({ ...selected, status: "Dostępne", assignedTo: "" }, T.returnTool, `Zwrócono do magazynu z: ${selected.assignedTo || "brak"}`);
  }

  function reportFailure() {
    if (!selected) return;
    const currentTool = tools.find((t) => t.id === selected.id) || selected;
    const hasFailure = currentTool.status === "Awaria" || currentTool.status === "Uszkodzone";

    if (hasFailure) {
      if (!isAdmin) return alert(T.workerCannotClearFailure || T.noPermission);

      const restoredStatus = currentTool.assignedTo ? "Wydane" : "Dostępne";
      const updated = {
        ...currentTool,
        status: restoredStatus,
        failurePriority: "",
        failureNote: "",
        failureAt: "",
        failureBy: "",
        notes: currentTool.notes || "",
      };

      updateTool(
        updated,
        T.failureCleared || "Zdjęto awarię",
        `${T.failureClearedDetails || "Administrator zdjął awarię urządzenia"}: ${user || "—"}`
      );
      return;
    }

    setShowFailureModal(true);
  }

  function submitFailureReport(report) {
    if (!selected) return;
    const currentTool = tools.find((t) => t.id === selected.id) || selected;
    const priority = report?.priority || "średni";
    const note = report?.note || "";
    const attachments = Array.isArray(report?.attachments) ? report.attachments : [];
    const updated = {
      ...currentTool,
      status: "Awaria",
      failurePriority: priority,
      failureNote: note,
      failureAt: new Date().toLocaleString("pl-PL"),
      failureBy: user || "",
      notes: currentTool.notes || "",
    };

    updateTool(
      updated,
      T.failureReported || "Zgłoszono awarię",
      `${T.failureReportedDetails || "Użytkownik zgłosił awarię urządzenia"}: ${user || "—"}${priority ? ` • ${T.failurePriority || "Priorytet"}: ${priority}` : ""}${note ? ` • ${note}` : ""}`,
      { historyExtra: { attachments, priority, failureNote: note } }
    );
    setShowFailureModal(false);
  }


  function toggleQrIssue() {
    if (!selected) return;
    const currentTool = tools.find((t) => t.id === selected.id) || selected;
    const hasQrIssue = !!currentTool.qrIssue;

    const updated = {
      ...currentTool,
      qrIssue: !hasQrIssue,
      qrIssueBy: hasQrIssue ? "" : (user || ""),
      qrIssueAt: hasQrIssue ? "" : new Date().toLocaleString("pl-PL"),
    };

    updateTool(
      updated,
      hasQrIssue ? (T.qrReplacementReceived || "Nowy QR otrzymano") : (T.qrUnreadableReported || "Zgłoszono nieczytelny QR"),
      hasQrIssue
        ? `${T.qrReplacementReceivedDetails || "Potwierdzono otrzymanie nowej naklejki QR"}: ${user || "—"}`
        : `${T.qrUnreadableDetails || "Użytkownik zgłosił, że naklejka QR jest nieczytelna"}: ${user || "—"}`
    );
  }


  const ppeRecords = Array.isArray(settings.ppeRecords) ? settings.ppeRecords : [];

  function ppePublicLink(id) {
    if (typeof window === "undefined") return id;
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("publicPpe", id);
    return url.toString();
  }

  async function savePpeRecords(nextRecords) {
    const nextSettings = { ...settings, ppeRecords: nextRecords, updatedAt: new Date().toISOString() };
    try {
      await persistSettingsEverywhere(nextSettings, setSettings);
    } catch (e) {
      alert((T.ppeSaveError || "Nie udało się zapisać PPE:") + " " + (e?.message || e));
    }
  }

  function upsertPpeRecord(record) {
    const normalized = {
      ...record,
      id: record.id || `PPE-${String(Date.now())}`,
      history: [
        { date: new Date().toLocaleString("pl-PL"), user, action: record.id ? (T.edit || "Edytuj") : (T.add || "Dodaj") },
        ...(Array.isArray(record.history) ? record.history : []),
      ],
    };
    const next = [normalized, ...ppeRecords.filter((p) => p.id !== normalized.id)];
    savePpeRecords(next);
  }

  function deletePpeRecord(id) {
    if (!isAdmin) return alert(T.noPermission);
    if (!confirm(T.deletePpe || "Usunąć PPE?")) return;
    savePpeRecords(ppeRecords.filter((p) => p.id !== id));
  }

  function printPpeLabel(ppe) {
    const url = ppePublicLink(ppe.id);
    const html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>ACC BAU PPE QR</title>
  <style>
    @page { size: 50mm 25mm; margin: 0; }
    * { box-sizing: border-box; }
    html, body { width:50mm; height:25mm; margin:0; padding:0; overflow:hidden; font-family:Arial, Helvetica, sans-serif; color:#111; background:#fff; }
    .label { width:50mm; height:25mm; padding:2mm; display:flex; gap:2mm; align-items:center; border:0.3mm solid #111; }
    .qr { width:18mm; height:18mm; border:0.2mm solid #111; padding:0.7mm; display:flex; align-items:center; justify-content:center; }
    .qr img { width:16.2mm; height:16.2mm; display:block; }
    .info { flex:1; min-width:0; overflow:hidden; }
    .brand { font-size:8pt; font-weight:900; line-height:1; }
    .tag { display:inline-block; margin-top:1mm; border:0.2mm solid #111; border-radius:0.8mm; padding:0.3mm 1mm; font-size:5.5pt; font-weight:900; }
    .name { margin-top:1mm; font-size:8pt; font-weight:900; line-height:1.05; max-height:8.5mm; overflow:hidden; }
    .line { margin-top:0.7mm; font-size:5.7pt; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  </style>
</head>
<body>
  <div class="label">
    <div class="qr"><img loading="eager" decoding="sync" crossorigin="anonymous" src="${qrUrl(url)}" /></div>
    <div class="info">
      <div class="brand">ACC BAU</div>
      <div class="tag">PPE QR</div>
      <div class="name">${ppeTypeLabel(ppe.type, T)} ${ppe.name || ""}</div>
      <div class="line">${ppe.person || "—"}</div>
      <div class="line">ID: ${ppe.id || "—"}</div>
    </div>
  </div>
  <script>
    window.onload = function () {
      const imgs = Array.from(document.images || []);
      Promise.all(imgs.map(function (img) {
        if (img.complete) return Promise.resolve();
        return new Promise(function (resolve) { img.onload = resolve; img.onerror = resolve; });
      })).then(function () { setTimeout(function () { window.print(); }, 700); });
    };
  </script>
</body>
</html>`;
    const w = window.open("", "_blank", "width=360,height=220");
    if (!w) return alert("Nie udało się otworzyć okna drukowania. Sprawdź blokadę popupów.");
    w.document.open();
    w.document.write(html);
    w.document.close();
  }





  function printPpeEmployeeCard(personName) {
    const employee = personName || (settings.people?.[0] || "");
    const items = ppeRecords.filter((p) => !employee || p.person === employee);
    const required = ppeRequiredCanonicalTypes();
    const missing = required.filter((req) => !items.some((r) => ppeCanonicalType(r.type) === req));
    const generated = new Date().toLocaleString("pl-PL");

    const rows = items.map((p) => {
      const st = ppeDueStatus(p, T);
      return `<tr>
        <td>${ppeTypeLabel(p.type, T)}</td>
        <td><b>${p.name || "—"}</b><br/><small>${p.serial || ""}</small></td>
        <td>${p.size || "—"}</td>
        <td>${p.issuedDate || "—"}</td>
        <td>${p.expiryDate || "—"}</td>
        <td>${st.label}</td>
        <td>${p.notes || ""}</td>
      </tr>`;
    }).join("");

    const html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${T.ppeEmployeeCard || "Karta pracownika PPE"}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: Arial, Helvetica, sans-serif; color:#111; margin:0; }
    .top { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; border-bottom:3px solid #111; padding-bottom:10px; margin-bottom:14px; }
    .brand { font-size:22pt; font-weight:900; letter-spacing:0.5pt; }
    .tag { display:inline-block; margin-top:6px; border:2px solid #111; border-radius:8px; padding:4px 10px; font-size:10pt; font-weight:900; }
    h1 { margin:14px 0 6px 0; font-size:20pt; }
    .meta { color:#555; font-size:10pt; }
    .box { border:1px solid #ddd; border-radius:14px; padding:12px; margin:12px 0; }
    .ok { border-color:#bbf7d0; background:#f0fdf4; color:#166534; font-weight:900; }
    .warn { border-color:#fde68a; background:#fffbeb; color:#92400e; font-weight:900; }
    table { width:100%; border-collapse:collapse; margin-top:12px; font-size:9.5pt; }
    th { background:#111; color:white; text-align:left; padding:7px; border:1px solid #111; }
    td { padding:7px; border:1px solid #ccc; vertical-align:top; }
    .signature { margin-top:28px; display:grid; grid-template-columns:1fr 1fr; gap:28px; }
    .sigline { border-top:1px solid #111; padding-top:6px; font-size:9pt; color:#555; text-align:center; }
  </style>
</head>
<body>
  <div class="top">
    <div>
      <div class="brand">ACC BAU</div>
      <div class="tag">PPE / HSE</div>
    </div>
    <div class="meta">${T.printGenerated || "Wydruk"}: ${generated}</div>
  </div>
  <h1>${T.ppeEmployeeCard || "Karta pracownika PPE"}</h1>
  <div class="box">
    <b>${T.person || "Osoba"}:</b> ${employee || "—"}<br/>
    <b>${T.ppeIssuedItems || "Wydane środki ochrony"}:</b> ${items.length}
  </div>
  <div class="box ${missing.length ? "warn" : "ok"}">
    ${missing.length ? `${T.ppeMissingItems || "Brakuje"}: ${missing.map((x) => ppeTypeLabel(x, T)).join(", ")}` : (T.ppeCompleteSet || "Komplet PPE")}
  </div>
  <table>
    <thead>
      <tr>
        <th>${T.ppeType || "Rodzaj PPE"}</th>
        <th>${T.ppeItem || "Nazwa / model"}</th>
        <th>${T.ppeSize || "Rozmiar"}</th>
        <th>${T.ppeIssuedDate || "Data wydania"}</th>
        <th>${T.ppeExpiryDate || "Data ważności / przeglądu"}</th>
        <th>${T.status || "Status"}</th>
        <th>${T.notes || "Uwagi"}</th>
      </tr>
    </thead>
    <tbody>${rows || `<tr><td colspan="7">${T.ppeNoItems || "Brak PPE dla tego pracownika."}</td></tr>`}</tbody>
  </table>
  <div class="signature">
    <div class="sigline">${T.ppeSignature || "Podpis pracownika"}</div>
    <div class="sigline">${T.date || "Data"}</div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
</body>
</html>`;

    const w = window.open("", "_blank", "width=900,height=900");
    if (!w) return alert("Nie udało się otworzyć okna wydruku. Sprawdź blokadę popupów.");
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  async function loadHistoryFromDb({ force = false } = {}) {
    if (historyLoading) return;
    if (historyLoaded && !force) return;

    if (!supabase) {
      const localHistory = load(HISTORY_KEY, []);
      setHistory(localHistory);
      setHistoryLoaded(true);
      return;
    }

    try {
      setHistoryLoading(true);
      const limit = isMobileDevice() ? 80 : 500;
      const { data, error } = await supabase.from("history").select("id,data").limit(limit);
      if (error) throw error;

      const loadedHistory = (data || [])
        .map((row) => ({ id: row.id, ...(row.data || {}) }))
        .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

      setHistory(loadedHistory);
      setHistoryLoaded(true);
    } catch (e) {
      console.error("history load error", e);
      alert("Nie udało się wczytać historii: " + (e?.message || e));
    } finally {
      setHistoryLoading(false);
    }
  }

  async function openHistoryModal() {
    await loadHistoryFromDb();
    setShowHistoryModal(true);
  }

  async function openDayReport() {
    await loadHistoryFromDb();
    setShowDayReport(true);
  }


  async function optimizeExistingDatabase() {
    if (!isAdmin) return alert(T.noPermission);
    if (!supabase) return alert("Brak połączenia z Supabase.");

    const confirmed = confirm(
      "Odchudzić istniejące zdjęcia w bazie?\n\nTo NIE usuwa narzędzi, historii ani zdjęć. Zmniejsza tylko ciężkie zdjęcia base64, żeby telefon nie wywalał aplikacji."
    );
    if (!confirmed) return;

    try {
      alert("Start optymalizacji. Nie zamykaj tej karty. To może potrwać kilka minut.");

      const [toolsRes, historyRes] = await Promise.all([
        supabase.from("tools").select("id,data"),
        supabase.from("history").select("id,data"),
      ]);

      if (toolsRes.error) throw toolsRes.error;
      if (historyRes.error) throw historyRes.error;

      let toolCount = 0;
      let historyCount = 0;

      for (const row of toolsRes.data || []) {
        const optimized = await optimizeImagesInObject(row.data);
        const before = JSON.stringify(row.data || {}).length;
        const after = JSON.stringify(optimized || {}).length;

        if (after < before) {
          const { error } = await supabase.from("tools").upsert({ id: row.id, data: optimized });
          if (error) throw error;
          toolCount++;
        }
      }

      for (const row of historyRes.data || []) {
        const optimized = await optimizeImagesInObject(row.data);
        const before = JSON.stringify(row.data || {}).length;
        const after = JSON.stringify(optimized || {}).length;

        if (after < before) {
          const { error } = await supabase.from("history").upsert({ id: row.id, data: optimized });
          if (error) throw error;
          historyCount++;
        }
      }

      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(HISTORY_KEY);
      await initApp();

      alert(`Gotowe. Odchudzono zdjęcia w narzędziach: ${toolCount}, w historii: ${historyCount}.\n\nTeraz odśwież aplikację na telefonie.`);
    } catch (e) {
      console.error("optimize database error", e);
      alert("Nie udało się zakończyć optymalizacji: " + (e?.message || e));
    }
  }

  function printHistory(list = history, title = T.historyTitle) {
    const rows = list.map((h) => {
      const tool = tools.find((t) => t.id === h.toolId);
      return {
        date: h.date || "",
        toolId: h.toolId || "",
        toolName: h.toolName || tool?.name || "",
        serial: h.serial || tool?.serial || "",
        action: h.action || "",
        details: h.details || "",
        from: h.from || "",
        to: h.to || "",
        user: h.user || "",
        photos: historyPhotoCount(h),
      };
    });

    const html = `<html><head><meta charset="UTF-8"><title>${title}</title></head><body style="font-family:Arial;margin:24px;color:#111"><h1 style="margin:0 0 4px 0">${title}</h1><p style="margin:0 0 18px 0;color:#666">${T.printGenerated}: ${new Date().toLocaleString("pl-PL")}</p><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr><th style="border:1px solid #111;background:#111;color:#fff;padding:8px;text-align:left">${T.date}</th><th style="border:1px solid #111;background:#111;color:#fff;padding:8px;text-align:left">${T.equipment}</th><th style="border:1px solid #111;background:#111;color:#fff;padding:8px;text-align:left">ID / Serial</th><th style="border:1px solid #111;background:#111;color:#fff;padding:8px;text-align:left">${T.action}</th><th style="border:1px solid #111;background:#111;color:#fff;padding:8px;text-align:left">${T.from}</th><th style="border:1px solid #111;background:#111;color:#fff;padding:8px;text-align:left">${T.to}</th><th style="border:1px solid #111;background:#111;color:#fff;padding:8px;text-align:left">${T.details}</th><th style="border:1px solid #111;background:#111;color:#fff;padding:8px;text-align:left">${T.photos}</th></tr></thead><tbody>${rows.map((r) => `<tr><td style="border:1px solid #ccc;padding:7px">${r.date}</td><td style="border:1px solid #ccc;padding:7px"><b>${r.toolName}</b></td><td style="border:1px solid #ccc;padding:7px">${r.toolId}<br/>SN: ${r.serial}</td><td style="border:1px solid #ccc;padding:7px">${historyActionText(r.action, T)}</td><td style="border:1px solid #ccc;padding:7px">${r.from || "—"}</td><td style="border:1px solid #ccc;padding:7px">${r.to || "—"}</td><td style="border:1px solid #ccc;padding:7px">${historyDetailsText(r.details, T)}</td><td style="border:1px solid #ccc;padding:7px">${r.photos}</td></tr>`).join("")}</tbody></table><script>window.print()</script></body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
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

  function printToolCard(tool) {
    if (!tool) return;
    const toolHistory = history.filter((h) => h.toolId === tool.id).slice(0, 80);
    const insp = inspections(tool);
    const totalCost = insp.reduce((sum, i) => sum + (parseFloat(String(i.cost || "0").replace(",", ".")) || 0), 0);
    const rows = toolHistory.map((h) => `<tr><td>${h.date || ""}</td><td>${historyActionText(h.action, T)}</td><td>${historyDetailsText(h.details, T)}</td><td>${h.from || "—"}</td><td>${h.to || "—"}</td></tr>`).join("");
    const inspRows = insp.map((i) => `<tr><td>${i.type || ""}</td><td>${i.doneDate || "—"}</td><td>${i.nextDate || (isNoInspectionRequired(i) ? (T.inspectionsOkPermanent || "OK bezterminowo") : "—")}</td><td>${i.result || "—"}</td><td>${i.cost || "—"}</td><td>${i.notes || ""}</td></tr>`).join("");
    const html = `<html><head><meta charset="UTF-8"><title>Karta urządzenia ${tool.id}</title><style>body{font-family:Arial;margin:24px;color:#111}h1{margin:0 0 6px}h2{margin-top:22px;border-bottom:2px solid #111;padding-bottom:6px}table{width:100%;border-collapse:collapse;font-size:12px}td,th{border:1px solid #ccc;padding:7px;text-align:left;vertical-align:top}th{background:#111;color:#fff}.box{border:2px solid #111;border-radius:14px;padding:14px;margin:14px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.muted{color:#666}.badge{display:inline-block;border:1px solid #111;border-radius:999px;padding:4px 10px;font-weight:bold}</style></head><body><h1>ACC BAU • Karta urządzenia</h1><div class="muted">Wygenerowano: ${new Date().toLocaleString("pl-PL")}</div><div class="box"><div class="grid"><div><b>Nazwa:</b> ${tool.name || "—"}<br/><b>ID:</b> ${tool.id || "—"}<br/><b>SN:</b> ${tool.serial || "—"}<br/><b>Marka/model:</b> ${tool.brand || ""} ${tool.model || ""}</div><div><b>Status:</b> <span class="badge">${tool.status || "—"}</span><br/><b>Projekt:</b> ${tool.project || "—"}<br/><b>Lokalizacja:</b> ${tool.location || "—"}<br/><b>Posiadacz:</b> ${tool.assignedTo || T.warehouse}</div></div><p><b>Uwagi:</b> ${tool.notes || "—"}</p></div><h2>Przeglądy / serwis / naprawy</h2><div class="muted">Suma kosztów wpisów: <b>${totalCost ? totalCost.toFixed(2) : "0.00"}</b></div><table><thead><tr><th>Typ</th><th>Data</th><th>Następny</th><th>Wynik</th><th>Koszt</th><th>Opis</th></tr></thead><tbody>${inspRows || "<tr><td colspan='6'>Brak wpisów</td></tr>"}</tbody></table><h2>Historia</h2><table><thead><tr><th>Data</th><th>Akcja</th><th>Szczegóły</th><th>Od</th><th>Do</th></tr></thead><tbody>${rows || "<tr><td colspan='5'>Brak historii</td></tr>"}</tbody></table><script>window.onload=function(){setTimeout(function(){window.print()},300)}</script></body></html>`;
    const w = window.open("", "_blank");
    if (!w) return alert("Nie udało się otworzyć okna wydruku.");
    w.document.write(html);
    w.document.close();
  }

  function printLabel(tool) {
    const url = publicLink(tool.id);
    // Etykieta Zebra 76 x 51 mm.
    // Na naklejce nie drukujemy statusu ani przeglądów, bo aktualny stan jest po zeskanowaniu QR.
    // Nie drukujemy też długiego URL, żeby nie zaśmiecać etykiety.

    const html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>ACC BAU QR Label</title>
  <style>
    @page {
      size: 76mm 51mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
    }
    html,
    body {
      width: 76mm;
      height: 51mm;
      margin: 0;
      padding: 0;
      overflow: hidden;
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      background: #fff;
    }
    .label {
      width: 76mm;
      height: 51mm;
      padding: 5.4mm 3mm 2.8mm 3mm;
      display: flex;
      gap: 3mm;
      align-items: flex-start;
      border: 0.35mm solid #111;
      page-break-after: always;
    }
    .left {
      width: 35mm;
      flex: 0 0 35mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      overflow: hidden;
      padding-top: 0.8mm;
    }
    .qrBox {
      width: 32.5mm;
      height: 32.5mm;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 0.25mm solid #111;
      border-radius: 1.6mm;
      padding: 1mm;
      overflow: hidden;
    }
    .qrBox img {
      width: 30mm;
      height: 30mm;
      display: block;
    }
    .scan {
      width: 35mm;
      margin-top: 2.3mm;
      text-align: center;
      font-size: 8pt;
      line-height: 1;
      font-weight: 900;
      letter-spacing: 0.45pt;
      white-space: nowrap;
    }
    .info {
      flex: 1;
      min-width: 0;
      height: 40mm;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      overflow: hidden;
      padding-top: 0.5mm;
    }
    .brand {
      font-size: 10pt;
      line-height: 1;
      font-weight: 900;
      letter-spacing: 0.55pt;
      white-space: nowrap;
    }
    .hse {
      margin-top: 1mm;
      display: inline-block;
      width: fit-content;
      border: 0.25mm solid #111;
      border-radius: 1mm;
      padding: 0.5mm 1.4mm;
      font-size: 6.7pt;
      line-height: 1;
      font-weight: 900;
      letter-spacing: 0.35pt;
      white-space: nowrap;
    }
    .name {
      margin-top: 2mm;
      font-size: 12pt;
      line-height: 1.02;
      font-weight: 900;
      max-height: 14mm;
      overflow: hidden;
      word-break: break-word;
    }
    .line {
      margin-top: 1.25mm;
      font-size: 7pt;
      line-height: 1.1;
      font-weight: 800;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .small {
      margin-top: 0.8mm;
      font-size: 6.2pt;
      line-height: 1.05;
      color: #333;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    @media print {
      html,
      body {
        width: 76mm;
        height: 51mm;
      }
      .label {
        border: 0.35mm solid #111;
      }
    }
  </style>
</head>
<body>
  <div class="label">
    <div class="left">
      <div class="qrBox">
        <img loading="eager" decoding="sync" crossorigin="anonymous" src="${qrUrl(url)}" />
      </div>
      <div class="scan">SCAN FOR STATUS</div>
    </div>
    <div class="info">
      <div class="brand">ACC BAU</div>
      <div class="hse">HSE QR</div>
      <div class="name">${tool.name || "—"}</div>
      <div class="line">ID: ${tool.id || "—"}</div>
      <div class="line">SN: ${tool.serial || "—"}</div>
      <div class="small">${tool.brand || ""} ${tool.model || ""}</div>
    </div>
  </div>
  <script>
    window.onload = function () {
      const imgs = Array.from(document.images || []);
      Promise.all(imgs.map(function (img) {
        if (img.complete) return Promise.resolve();
        return new Promise(function (resolve) {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })).then(function () {
        setTimeout(function () { window.print(); }, 700);
      });
    };
  </script>
</body>
</html>`;

    const w = window.open("", "_blank", "width=420,height=320");
    if (!w) return alert("Nie udało się otworzyć okna drukowania. Sprawdź blokadę popupów.");
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  if (publicPpeId) {
    const ppe = (Array.isArray(settings.ppeRecords) ? settings.ppeRecords : []).find((p) => p.id === publicPpeId);
    return <PublicPpeView ppe={ppe} T={T} lang={lang} setLang={setLang} onBack={() => setPublicPpeId("")} />;
  }

  if (publicToolId) {
    const tool = tools.find((t) => t.id === publicToolId);
    return <PublicToolView tool={tool} T={T} lang={lang} setLang={setLang} onBack={() => setPublicToolId("")} />;
  }

  if (!user) return <LoginScreen settings={settings} T={T} lang={lang} setLang={setLang} onLogin={login} />;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,106,0,0.18),transparent_34%),linear-gradient(135deg,#2f302d_0%,#474944_42%,#d7d2c8_100%)] text-zinc-950">
      {!dbLoaded && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950 text-white"><div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-center shadow-2xl"><div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-yellow-400" /><div className="font-black">{T.loadingDb}</div></div></div>}
      {dbStatus === "error" && <div className="mx-auto max-w-7xl px-4 pt-4"><div className="rounded-2xl border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700">{T.supabaseOffline}</div></div>}
      <Header T={T} lang={lang} setLang={setLang} user={user} role={role} isAdmin={isAdmin} activeModule={activeModule} onTools={() => setActiveModule("tools")} onPpe={() => setActiveModule("ppe")} onLogout={logout} onClaim={() => setShowClaim(true)} onHistory={openHistoryModal} onExcel={exportExcel} onSettings={() => setShowSettings(true)} onAdd={openNewTool} />

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        {activeModule === "ppe" ? (
          <PpePage T={T} isAdmin={isAdmin} settings={settings} records={ppeRecords} onSave={upsertPpeRecord} onDelete={deletePpeRecord} onPrintQr={printPpeLabel} onPrintEmployeeCard={printPpeEmployeeCard} />
        ) : (
          <>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Wrench />} label={T.allTools} value={stats.all} />
          <StatCard icon={<PackageCheck />} label={T.available} value={stats.free} />
          <StatCard icon={<User />} label={T.issued} value={stats.issued} />
          <StatCard icon={<AlertTriangle />} label={T.inspectionsWarning} value={stats.danger} danger />
        </section>

        <AlertsDashboard
          T={T}
          alarmStats={alarmStats}
          activeFilter={dashboardFilter}
          onToggleFilter={toggleDashboardFilter}
          onDayReport={openDayReport}
        />

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
            {selected && <ToolDetails T={T} tool={selected} isAdmin={isAdmin} history={history.filter((h) => h.toolId === selected.id)} onEdit={() => openEditTool(selected)} onDelete={async () => {
                if (!isAdmin) return alert(T.noPermission);
                if (!confirm(`Usunąć narzędzie: ${selected.name}?`)) return;
                const deletedId = selected.id;
                const nextTools = tools.filter((t) => t.id !== deletedId);
                setTools(nextTools);
                setSelected(nextTools[0] || null);
                if (supabase) {
                  const { error } = await supabase.from("tools").delete().eq("id", deletedId);
                  if (error) {
                    alert("Nie udało się usunąć z Supabase: " + error.message);
                    await initApp();
                    return;
                  }
                }
              }} onTransfer={createTransfer} onReturn={returnTool} onReportFailure={reportFailure} onQrIssue={toggleQrIssue} onInspection={() => setShowInspection(true)} onDeleteInspection={deleteInspection} onPrint={() => printLabel(selected)} onPrintCard={() => printToolCard(selected)} onPrintHistory={() => printHistory(history.filter((h) => h.toolId === selected.id), `Historia narzędzia - ${selected.name}`)} onOpenHistory={(item) => setSelectedHistory(item)} />}
            <InfoBox T={T} />
          </aside>
        </section>
          </>
        )}
      </main>

      {showToolForm && <ToolForm T={T} form={toolForm} setForm={setToolForm} settings={settings} onClose={() => setShowToolForm(false)} onSave={saveTool} editing={editing} />}
      {showInspection && selected && <InspectionModal T={T} onClose={() => setShowInspection(false)} onSave={addInspection} />}
      {showSettings && <SettingsModal T={T} settings={settings} setSettings={setSettings} onClose={() => setShowSettings(false)} onOptimizeDatabase={optimizeExistingDatabase} />}
      {showDayReport && <DayReportModal T={T} history={history} tools={tools} onClose={() => setShowDayReport(false)} />}
      {showFailureModal && selected && <FailureReportModal T={T} tool={selected} onClose={() => setShowFailureModal(false)} onSave={submitFailureReport} />}
      {showTransfer && selected && <TransferModal T={T} code={transferCode} tool={selected} onClose={() => setShowTransfer(false)} />}
      {showClaim && <ClaimModal T={T} initialCode={transferCode} onClose={() => setShowClaim(false)} onClaim={claimTransfer} />}
      {historyLoading && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 text-white"><div className="rounded-3xl bg-zinc-950 p-6 font-black shadow-2xl">Ładowanie historii...</div></div>}
      {showHistoryModal && <HistoryModal T={T} history={history} tools={tools} onClose={() => setShowHistoryModal(false)} onPrint={() => printHistory(history)} onOpen={(item) => setSelectedHistory(item)} />}
      {selectedHistory && <HistoryDetailModal T={T} item={selectedHistory} tool={tools.find((t) => t.id === selectedHistory.toolId)} onClose={() => setSelectedHistory(null)} />}
      {showPhotoModal && photoContext && <HandoverPhotoModal T={T} context={photoContext} history={history} setHistory={setHistory} onClose={() => { setShowPhotoModal(false); setPhotoContext(null); }} />}
    </div>
  );
}

function LogoMark({ small = false }) {
  return (
    <div className={`relative shrink-0 ${small ? "h-14 w-28" : "h-20 w-40"}`}>
      <div className="absolute left-0 top-0 leading-none tracking-tight text-zinc-900">
        <div className={`${small ? "text-2xl" : "text-4xl"} font-black`}>ACC</div>
        <div className={`${small ? "-mt-1 text-2xl" : "-mt-2 text-4xl"} font-black`}>BAU</div>
      </div>
      <div className={`absolute rounded-full bg-orange-500 shadow-lg ${small ? "right-2 top-3 h-8 w-8" : "right-3 top-5 h-11 w-11"}`} />
    </div>
  );
}

function LanguageSelect({ lang, setLang, dark = false }) {
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      className={`rounded-xl border px-3 py-2 text-sm font-bold outline-none ${
        dark
          ? "border-white/20 bg-white/10 text-white"
          : "border-zinc-200 bg-white text-zinc-950"
      }`}
    >
      <option value="pl">🇵🇱 Polski</option>
      <option value="en">🇬🇧 English</option>
      <option value="de">🇩🇪 Deutsch</option>
    </select>
  );
}

function Header({ T, lang, setLang, user, role, isAdmin, activeModule, onTools, onPpe, onLogout, onClaim, onHistory, onExcel, onSettings, onAdd }) {
  return (
    <header className="border-b border-white/10 bg-zinc-950 text-white shadow-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <LogoMark small />
          <div>
            <div className="mb-1 inline-flex rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
              ACC BAU • TOOL CONTROL
            </div>
            <h1 className="text-2xl font-black tracking-tight">{T.appTitle}</h1>
            <p className="text-sm text-zinc-300">{T.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <LanguageSelect lang={lang} setLang={setLang} dark />

          <div className="rounded-xl border border-white/20 bg-emerald-500/20 px-3 py-2 text-sm font-bold">
            {user} • {role === "admin" ? T.admin : T.worker}
          </div>

          <Button onClick={onTools} className={`rounded-xl ${activeModule === "tools" ? "bg-orange-600 text-white hover:bg-orange-500" : "bg-zinc-800 text-white hover:bg-zinc-700"}`}>
            <Wrench className="mr-2 h-4 w-4" /> {T.toolsList}
          </Button>

          <Button onClick={onPpe} className={`rounded-xl ${activeModule === "ppe" ? "bg-orange-600 text-white hover:bg-orange-500" : "bg-zinc-800 text-white hover:bg-zinc-700"}`}>
            <ShieldCheck className="mr-2 h-4 w-4" /> {T.ppe || "PPE"}
          </Button>

          <Button onClick={onClaim} className="rounded-xl bg-emerald-500 text-white hover:bg-emerald-600">
            <ScanLine className="mr-2 h-4 w-4" /> {T.takeover}
          </Button>

          <Button onClick={onHistory} className="rounded-xl bg-zinc-800 text-white hover:bg-zinc-700">
            <History className="mr-2 h-4 w-4" /> {T.history}
          </Button>

          {isAdmin && (
            <Button onClick={onExcel} className="rounded-xl bg-white text-zinc-950 hover:bg-zinc-100">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> {T.excel}
            </Button>
          )}

          {isAdmin && (
            <Button onClick={onSettings} className="rounded-xl bg-white text-zinc-950 hover:bg-zinc-100">
              {T.settings}
            </Button>
          )}


          {isAdmin && (
            <Button onClick={onAdd} className="rounded-xl bg-orange-600 text-white hover:bg-orange-500">
              <Plus className="mr-2 h-4 w-4" /> {T.add}
            </Button>
          )}

          <Button onClick={onLogout} className="rounded-xl bg-zinc-800 text-white hover:bg-zinc-700">
            <LogOut className="mr-2 h-4 w-4" /> {T.logout}
          </Button>
        </div>
      </div>
    </header>
  );
}

function LoginScreen({ settings, T, lang, setLang, onLogin }) {
  const [name, setName] = useState(settings.people[0] || "");
  const [pin, setPin] = useState("");
  return <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,106,0,0.24),transparent_35%),linear-gradient(135deg,#2f302d,#575951)] p-4 text-white"><div className="mx-auto flex min-h-[80vh] max-w-4xl items-center justify-center"><Card className="grid w-full overflow-hidden rounded-[32px] border border-white/10 shadow-2xl lg:grid-cols-2"><div className="bg-zinc-950 p-8 text-white"><LogoMark /><h1 className="text-4xl font-black">{T.appTitle}</h1><p className="mt-4 text-zinc-300">{T.loginText}</p><div className="mt-6"><LanguageSelect lang={lang} setLang={setLang} dark /></div></div><CardContent className="p-8 text-zinc-950"><div className="mb-5 flex items-center gap-2 text-xl font-black"><Lock className="h-5 w-5" /> {T.login}</div><select value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border px-4 py-3">{settings.people.map((p) => <option key={p}>{p}</option>)}</select><input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" className="mt-4 w-full rounded-2xl border px-4 py-3" /><Button onClick={() => onLogin(name, pin)} className="mt-5 w-full rounded-2xl bg-zinc-950 py-6 text-base hover:bg-zinc-800">{T.enter}</Button><p className="mt-4 text-xs text-zinc-400">{T.demoPin}</p></CardContent></Card></div></div>;
}

function PublicToolView({ tool, T, lang, setLang, onBack }) {
  if (!tool) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
        <div className="rounded-3xl bg-white p-10 text-center shadow-2xl">
          <div className="mb-4 text-2xl font-black">{T.noToolFound}</div>
          <Button onClick={onBack}>{T.back}</Button>
        </div>
      </div>
    );
  }

  const state = inspectionStatus(tool, T);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,106,0,0.20),transparent_35%),linear-gradient(135deg,#2f302d,#575951)] p-4 text-zinc-950">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Button onClick={onBack} className="rounded-xl bg-zinc-950 text-white hover:bg-zinc-800">{T.back}</Button>
          <LanguageSelect lang={lang} setLang={setLang} />
        </div>

        <Card className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-2xl">
          <div className="bg-zinc-950 p-6 text-white">
            <div className="inline-flex rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-orange-300">
              {T.publicTitle}
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight">{tool.name}</h1>
            <p className="mt-2 text-zinc-300">{T.publicSubtitle}</p>
          </div>

          <CardContent className="p-5 sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow label={T.equipmentId} value={tool.id} />
                  <InfoRow label={T.serial} value={tool.serial || "—"} />
                  <InfoRow label={T.brandModel} value={`${tool.brand || "—"} ${tool.model || ""}`} />
                  <InfoRow label={T.category} value={tool.category || "—"} />
                  <InfoRow label={T.status} value={tool.status || "—"} />
                  <InfoRow label={T.location} value={`${tool.project || "—"} / ${tool.location || "—"}`} />
                  <InfoRow label={T.assignedTo} value={tool.assignedTo || T.warehouse} />
                  <div className={`rounded-2xl border px-4 py-3 ${state.cls}`}>
                    <p className="text-xs font-bold opacity-80">{T.safetyInspectionStatus}</p>
                    <p className="text-lg font-black">{state.label}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-600">
                  <b>{T.notes}:</b><br />{tool.notes || "—"}
                </div>

                <div className="mt-6">
                  <h2 className="mb-3 text-lg font-black">{T.testsInspections}</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {inspections(tool).length ? inspections(tool).map((i) => <InspectionCard key={i.id} inspection={i} T={T} />) : <div className="rounded-2xl border bg-red-50 p-4 text-red-700">{T.noInspections}</div>}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="rounded-[28px] border border-zinc-200 bg-white p-4 shadow-xl">
                  <img loading="lazy" decoding="async" src={qrUrl(window.location.href)} alt="QR" className="h-[220px] w-[220px]" />
                </div>

                {tool.photo && (
                  <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white p-2 shadow-xl">
                    <img loading="lazy" decoding="async" src={tool.photo} alt={tool.name} className="h-[150px] w-[220px] rounded-2xl object-cover" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="text-xs font-black uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-zinc-900">{value}</div>
    </div>
  );
}

function ToolRow({ tool, active, onClick, T }) {
  const state = inspectionStatus(tool, T);
  const u = urgentInspection(tool);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`cursor-pointer rounded-[26px] border bg-white p-4 shadow-sm transition hover:shadow-xl ${active ? "border-zinc-950 ring-2 ring-zinc-950/10" : state.danger ? "border-red-300" : "border-zinc-200"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="group relative inline-block">
              <h3 className="font-black underline-offset-4 group-hover:underline">{tool.name}</h3>
              {tool.photo && (
                <div className="pointer-events-none fixed left-[220px] top-[160px] z-[9999] hidden w-72 overflow-hidden rounded-3xl border-2 border-zinc-300 bg-white p-3 opacity-100 shadow-[0_30px_90px_rgba(0,0,0,0.55)] ring-4 ring-white group-hover:block">
                  <div className="absolute inset-0 -z-10 bg-white" />
                  <img loading="lazy" decoding="async" src={tool.photo} alt={tool.name} className="h-48 w-full rounded-2xl bg-white object-cover" />
                  <div className="bg-white px-2 py-2 text-xs font-bold text-zinc-700">
                    {tool.name}<br />
                    <span className="font-normal text-zinc-500">SN: {tool.serial || "—"}</span>
                  </div>
                </div>
              )}
            </div>
            <Badge cls={badgeStatus(tool.status)}>{tool.status}</Badge>
            <Badge cls={state.cls}>{state.label}</Badge>
            {tool.qrIssue && <Badge cls="bg-amber-100 text-amber-800 border-amber-200">{T.qrUnreadable || "QR nieczytelne"}</Badge>}
          </div>
          <p className="mt-1 text-sm text-zinc-500">{tool.id} • {tool.brand} {tool.model} • SN: {tool.serial}</p>
          <div className="mt-2 text-xs text-zinc-600">{tool.project} • {tool.location} • {tool.assignedTo || T.unassigned} • {T.next}: {u?.nextDate || T.missing}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <img loading="lazy" decoding="async" src={qrUrl(publicLink(tool.id))} alt="QR" className="h-16 w-16 rounded-2xl border bg-white p-1 shadow-sm" />
        </div>
      </div>
    </motion.div>
  );
}

function ToolDetails({ T, tool, isAdmin, history, onEdit, onDelete, onTransfer, onReturn, onReportFailure, onQrIssue, onInspection, onDeleteInspection, onPrint, onPrintCard, onPrintHistory, onOpenHistory }) {
  const state = inspectionStatus(tool, T);
  const lastActivity = history?.[0];
  const totalCost = inspections(tool).reduce((sum, i) => sum + (parseFloat(String(i.cost || "0").replace(",", ".")) || 0), 0);

  return (
    <Card className="rounded-[32px] border border-white/30 bg-white/95 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">{tool.name}</h2>
            <p className="text-sm text-zinc-500">{tool.id}</p>
            {state.danger && <div className="mt-2 rounded-2xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-bold text-red-700"><AlertTriangle className="mr-1 inline h-4 w-4" /> {T.inspectionNeedsAction}</div>}
          </div>
          <img loading="lazy" decoding="async" src={qrUrl(publicLink(tool.id))} alt="QR" className="h-24 w-24 rounded-3xl border bg-white p-2 shadow-xl" />
        </div>

        {tool.photo && <div className="mt-5 w-full max-w-[220px] overflow-hidden rounded-3xl border bg-zinc-50 p-2"><img loading="lazy" decoding="async" src={tool.photo} alt={tool.name} className="h-36 w-full rounded-2xl object-cover" /></div>}

        {(tool.status === "Awaria" || tool.status === "Uszkodzone") && <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-black text-red-700"><AlertTriangle className="mr-2 inline h-4 w-4" /> {T.failureStatus || "Awaria"}</div>}
        {tool.qrIssue && <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800"><ScanLine className="mr-2 inline h-4 w-4" /> {T.qrAlarmStatus || "QR nieczytelne — potrzebna nowa naklejka"}</div>}
        {lastActivity && <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700"><b>{T.lastActivity || "Ostatnia aktywność"}:</b> {historyActionText(lastActivity.action, T)} • {historyDetailsText(lastActivity.details, T)} • {lastActivity.date}</div>}
        {totalCost > 0 && <div className="mt-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-black text-orange-800">{T.serviceRepairCosts || "Koszty serwisu/napraw"}: {totalCost.toFixed(2)}</div>}

        <div className="mt-5 grid gap-3 text-sm">
          <Info label={T.status} value={tool.status || "—"} />
          {tool.qrIssue && <Info label="QR" value={T.qrAlarmStatus || "QR nieczytelne — potrzebna nowa naklejka"} />}
          <Info label={T.category} value={tool.category} />
          <Info label={T.brandModel} value={`${tool.brand} ${tool.model}`} />
          <Info label={T.serial} value={tool.serial} />
          <Info label={T.project} value={tool.project} />
          <Info label={T.location} value={tool.location} />
          <Info label={T.assignedTo} value={tool.assignedTo || T.warehouse} />
          <Info label={T.notes} value={tool.notes || "—"} />
        </div>

        {isAdmin && <Button onClick={onInspection} className="mt-5 w-full rounded-2xl bg-zinc-950 py-6 font-bold hover:bg-zinc-800"><Plus className="mr-2 h-5 w-5" /> {T.addInspection}</Button>}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button onClick={onTransfer} className="rounded-2xl bg-emerald-600 py-5 font-bold hover:bg-emerald-700"><ScanLine className="mr-2 h-4 w-4" /> {T.showTransferCode}</Button>
          {(!(tool.status === "Awaria" || tool.status === "Uszkodzone") || isAdmin) && (
            <Button onClick={onReportFailure} variant="outline" className={`rounded-2xl ${tool.status === "Awaria" || tool.status === "Uszkodzone" ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50" : "border-red-300 text-red-700 hover:bg-red-50"}`}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              {(tool.status === "Awaria" || tool.status === "Uszkodzone") && isAdmin ? (T.clearFailure || "Zdejmij awarię") : (T.reportFailure || "Zgłoś awarię")}
            </Button>
          )}
          <Button onClick={onQrIssue} variant="outline" className={`rounded-2xl ${tool.qrIssue ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50" : "border-amber-300 text-amber-700 hover:bg-amber-50"}`}>
            <ScanLine className="mr-2 h-4 w-4" />
            {tool.qrIssue ? (T.qrReplacementReceived || "Nowy QR otrzymano") : (T.qrUnreadable || "QR nieczytelne")}
          </Button>
          {isAdmin && <Button onClick={onReturn} variant="outline" className="rounded-2xl"><PackageX className="mr-2 h-4 w-4" /> {T.returnTool}</Button>}
          {isAdmin && <Button onClick={onPrint} variant="outline" className="rounded-2xl"><Printer className="mr-2 h-4 w-4" /> {T.printQr}</Button>}
          <Button onClick={onPrintCard} variant="outline" className="rounded-2xl"><ClipboardList className="mr-2 h-4 w-4" /> {T.toolPdfCard || "Karta PDF"}</Button>
          <Button onClick={onPrintHistory} variant="outline" className="rounded-2xl"><History className="mr-2 h-4 w-4" /> {T.printHistory}</Button>
          {isAdmin && <Button onClick={onEdit} variant="outline" className="rounded-2xl"><Edit3 className="mr-2 h-4 w-4" /> {T.edit}</Button>}
          {isAdmin && <Button onClick={onDelete} variant="outline" className="rounded-2xl text-red-600"><Trash2 className="mr-2 h-4 w-4" /> {T.delete}</Button>}
        </div>

        <SectionTitle icon={<ClipboardList />} title={T.serviceRepairHistory || T.inspections} />
        <div className="grid gap-3 md:grid-cols-2">
          {inspections(tool).map((i) => (
            <InspectionCard
              key={i.id}
              inspection={i}
              T={T}
              isAdmin={isAdmin}
              onDelete={() => onDeleteInspection?.(i.id)}
            />
          ))}
          {!inspections(tool).length && <p className="rounded-2xl border bg-zinc-50 p-3 text-sm text-zinc-500">{T.noInspections}</p>}
        </div>

        <SectionTitle icon={<History />} title={T.history} />
        <div className="max-h-64 space-y-2 overflow-auto rounded-2xl border bg-zinc-50 p-3">
          {history.map((h) => {
            const photoCount = historyPhotoCount(h);
            return (
              <button
                type="button"
                key={h.id}
                onClick={() => onOpenHistory?.(h)}
                className="block w-full rounded-xl bg-white p-3 text-left text-xs shadow-sm transition hover:bg-orange-50 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <b>{historyActionText(h.action, T)}</b> — {h.date}<br />
                    <span className="text-zinc-600">{historyDetailsText(h.details, T)}</span><br />
                    <span className="text-zinc-400">{T.from}: {h.from || "—"} • {T.to}: {h.to || "—"}</span>
                  </div>
                  <div className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${photoCount ? "bg-orange-100 text-orange-700" : "bg-zinc-100 text-zinc-400"}`}>
                    {photoCountText(photoCount, T)}
                  </div>
                </div>
                {photoCount > 0 && <div className="mt-2 text-[11px] font-bold text-orange-700">{T.clickToViewPhotos}</div>}
              </button>
            );
          })}
          {!history.length && <p className="text-sm text-zinc-500">{T.noHistory}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function AttachmentGallery({ attachments = [], T, compact = false }) {
  const normalizedAttachments = (attachments || []).map((a, i) => normalizeAttachment(a, i)).filter(Boolean);
  const [preview, setPreview] = useState(null);

  if (!normalizedAttachments.length) {
    return compact ? null : <div className="rounded-2xl border bg-zinc-50 p-3 text-xs text-zinc-500">{T.noAttachments}</div>;
  }

  return (
    <>
      <div className={compact ? "mt-2 flex flex-wrap gap-2" : "mt-3 grid gap-2 sm:grid-cols-2"}>
        {normalizedAttachments.map((a, i) => {
          const url = a.url;
          const name = a.name || `${T.attachments} ${i + 1}`;
          const type = a.type || "";
          const isImage = String(type).startsWith("image/") || String(url).startsWith("data:image/");

          if (compact) {
            return isImage ? (
              <button
                type="button"
                key={a.id || i}
                onClick={() => setPreview({ url, name })}
                className="h-12 w-12 overflow-hidden rounded-xl border bg-white p-1 shadow-sm hover:ring-2 hover:ring-orange-400"
                title={name}
              >
                <img loading="lazy" decoding="async" src={url} alt={name} className="h-full w-full rounded-lg object-cover" />
              </button>
            ) : (
              <a
                key={a.id || i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 min-w-12 items-center justify-center rounded-xl border bg-white px-2 text-[10px] font-black text-zinc-600 shadow-sm hover:ring-2 hover:ring-orange-400"
                title={name}
              >
                PDF
              </a>
            );
          }

          return isImage ? (
            <button
              type="button"
              key={a.id || i}
              onClick={() => setPreview({ url, name })}
              className="block overflow-hidden rounded-2xl border bg-white p-2 text-left shadow-sm hover:shadow-md"
            >
              <img loading="lazy" decoding="async" src={url} alt={name} className="h-28 w-full rounded-xl object-cover" />
              <div className="mt-2 truncate text-[11px] font-bold text-zinc-600">{name}</div>
            </button>
          ) : (
            <a key={a.id || i} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border bg-white p-2 shadow-sm hover:shadow-md">
              <div className="flex h-28 items-center justify-center rounded-xl bg-zinc-100 p-3 text-center text-xs font-bold text-zinc-600">
                PDF / FILE<br />{name}
              </div>
              <div className="mt-2 truncate text-[11px] font-bold text-zinc-600">{name}</div>
            </a>
          );
        })}
      </div>

      {preview && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4" onClick={() => setPreview(null)}>
          <div className="relative max-h-[92vh] max-w-5xl overflow-auto rounded-3xl bg-white p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setPreview(null)} className="absolute right-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1 text-sm font-black text-white">
              ×
            </button>
            <img loading="lazy" decoding="async" src={preview.url} alt={preview.name} className="max-h-[82vh] w-auto rounded-2xl object-contain" />
            <div className="mt-2 px-2 text-sm font-bold text-zinc-700">{preview.name}</div>
          </div>
        </div>
      )}
    </>
  );
}

function InspectionCard({ inspection, T, isAdmin = false, onDelete }) {
  const noRequired = isNoInspectionRequired(inspection);
  const service = isServiceRecord(inspection);
  const d = (service || noRequired) ? 99999 : daysUntil(inspection.nextDate);
  const danger = !service && !noRequired && d <= 30;
  const attachments = Array.isArray(inspection.attachments) ? inspection.attachments.map((a, i) => normalizeAttachment(a, i)).filter(Boolean) : [];

  return (
    <div className={`rounded-2xl border p-3 ${noRequired ? "border-green-200 bg-green-50" : service ? "border-zinc-200 bg-zinc-50" : danger ? "border-red-300 bg-red-50" : "border-zinc-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-black">{inspection.type}</div>
          <div className="mt-1 text-xs text-zinc-600">
            {noRequired ? (T.inspectionsOkPermanent || "Przeglądy OK — bezterminowo") : (<>{T.done}: {inspection.doneDate || "—"}{!service && <> • {T.nextInspection}: {inspection.nextDate || "—"}</>}</>)}
          </div>
        </div>
        {noRequired ? (
          <Badge cls="bg-green-100 text-green-700 border-green-200">{T.ok}</Badge>
        ) : service ? (
          <Badge cls="bg-zinc-100 text-zinc-700 border-zinc-200">{T.serviceRecord}</Badge>
        ) : danger ? (
          <Badge cls="bg-red-600 text-white border-red-600">{T.warning}</Badge>
        ) : (
          <Badge cls="bg-green-100 text-green-700 border-green-200">{T.ok}</Badge>
        )}
      </div>

      <div className="mt-2 line-clamp-3 text-xs text-zinc-600">
        {noRequired ? (
          <>{T.noInspectionRequired || "Nie wymaga przeglądu"}</>
        ) : service ? (
          <>{T.workDone}: {inspection.notes || "—"}{inspection.cost ? <> • Koszt: {inspection.cost}</> : null}</>
        ) : (
          <>
            {T.result}: {inspection.result || "—"}
            {inspection.notes ? <> • {inspection.notes}</> : null}
            {inspection.cost ? <> • Koszt: {inspection.cost}</> : null}
          </>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border bg-white/70 px-2 py-2">
        <div className="text-[11px] font-black text-zinc-500">
          {T.attachments}: {attachments.length}
        </div>
        <AttachmentGallery attachments={attachments} T={T} compact />
      </div>

      {isAdmin && (
        <Button type="button" variant="outline" onClick={onDelete} className="mt-3 w-full rounded-xl py-2 text-red-600">
          <Trash2 className="mr-2 h-4 w-4" /> {T.deleteInspection}
        </Button>
      )}
    </div>
  );
}

function ToolForm({ T, form, setForm, settings, onClose, onSave, editing }) {
  async function handlePhoto(file) {
    if (!file) return;

    try {
      const compressed = await compressImage(file, 700, 0.45);
      setForm({ ...form, photo: compressed });
    } catch (e) {
      alert(T.preparePhotoError);
      console.error(e);
    }
  }

  return <Modal><ModalHeader title={editing ? T.edit : T.add} onClose={onClose} /><div className="grid gap-4 p-6 md:grid-cols-2"><Field label="ID" value={form.id} onChange={(v) => setForm({ ...form, id: v })} /><Field label={T.name} value={form.name} onChange={(v) => setForm({ ...form, name: v })} /><FormSelect label={T.category} value={form.category} options={settings.categories} onChange={(v) => setForm({ ...form, category: v })} /><FormSelect label={T.status} value={form.status} options={statusOptions.filter((s) => s !== "Wszystkie")} onChange={(v) => setForm({ ...form, status: v })} /><Field label={T.brand} value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} /><Field label={T.model} value={form.model} onChange={(v) => setForm({ ...form, model: v })} /><Field label={T.serial} value={form.serial} onChange={(v) => setForm({ ...form, serial: v })} /><FormSelect label={T.project} value={form.project} options={settings.projects} onChange={(v) => setForm({ ...form, project: v })} /><Field label={T.location} value={form.location} onChange={(v) => setForm({ ...form, location: v })} /><FormSelect label={T.assignedTo} value={form.assignedTo} options={["", ...settings.people]} onChange={(v) => setForm({ ...form, assignedTo: v })} /><label className="block md:col-span-2"><span className="mb-1 block text-xs font-bold text-zinc-500">{T.toolPhoto}</span><input type="file" accept="image/*" onChange={(e) => handlePhoto(e.target.files?.[0])} className="w-full rounded-xl border px-3 py-2 text-sm" />{form.photo && <div className="mt-3 flex items-center gap-3"><img loading="lazy" decoding="async" src={form.photo} alt={T.preview} className="h-24 w-24 rounded-2xl border object-cover" /><Button type="button" variant="outline" onClick={() => setForm({ ...form, photo: "" })}>{T.removePhoto}</Button></div>}</label><label className="block md:col-span-2"><span className="mb-1 block text-xs font-bold text-zinc-500">{T.notes}</span><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-24 w-full rounded-xl border px-3 py-2" /></label></div><ModalFooter T={T} onClose={onClose} onSave={onSave} /></Modal>;
}

function InspectionModal({ T, onClose, onSave }) {
  const [i, setI] = useState({
    id: crypto.randomUUID?.() || String(Date.now()),
    kind: "inspection",
    type: "DGUV/VDE",
    doneDate: today(),
    nextDate: addMonths(today(), 6),
    result: "OK",
    notes: "",
    cost: "",
    noInspectionRequired: false,
    attachments: [],
  });
  const [preparing, setPreparing] = useState(false);
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);

  const noRequired = !!i.noInspectionRequired;
  const service = isServiceRecord(i);

  function changeType(type) {
    const willBeService = ["Naprawa / Serwis", "Naprawa", "Serwis"].includes(type);
    setI({
      ...i,
      type,
      kind: willBeService ? "service" : "inspection",
      noInspectionRequired: false,
      doneDate: i.doneDate || today(),
      nextDate: willBeService ? "" : (i.nextDate || addMonths(today(), 6)),
      result: willBeService ? T.done : (i.result || "OK"),
    });
  }

  async function addAttachments(files) {
    const selectedFiles = Array.from(files || []).slice(0, 6);
    if (!selectedFiles.length) return;

    setPreparing(true);
    const prepared = [];

    for (const file of selectedFiles) {
      try {
        const attachment = await prepareAttachmentFile(file);
        if (attachment) prepared.push(attachment);
      } catch (e) {
        alert(T.attachmentPrepareError || T.preparePhotoError);
        console.error(e);
      }
    }

    setI((prev) => ({
      ...prev,
      attachments: [...((prev.attachments || []).map((a, i) => normalizeAttachment(a, i)).filter(Boolean)), ...prepared],
    }));
    if (cameraRef.current) cameraRef.current.value = "";
    if (uploadRef.current) uploadRef.current.value = "";
    setPreparing(false);
  }

  function removeAttachment(idOrIndex) {
    setI((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((a, idx) => (a.id || idx) !== idOrIndex),
    }));
  }

  return (
    <Modal>
      <ModalHeader title={T.addInspection} onClose={onClose} />
      <div className="grid gap-4 p-6 md:grid-cols-2">
        <FormSelect label={T.type} value={i.type} options={inspectionTypes} onChange={changeType} />
        {!service && (
          <label className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
            <input
              type="checkbox"
              checked={noRequired}
              onChange={(e) => setI({
                ...i,
                noInspectionRequired: e.target.checked,
                doneDate: e.target.checked ? "" : (i.doneDate || today()),
                nextDate: e.target.checked ? "" : (i.nextDate || addMonths(today(), 6)),
                result: "OK",
              })}
              className="h-5 w-5"
            />
            {T.noInspectionRequired || "Nie wymaga przeglądu"}
          </label>
        )}
        {!service && !noRequired && <FormSelect label={T.result} value={i.result} options={["OK", "Do sprawdzenia", "Naprawa wymagana", "Nie dopuszczone"]} onChange={(v) => setI({ ...i, result: v })} />}
        {!noRequired && <Field type="date" label={T.done} value={i.doneDate} onChange={(v) => setI({ ...i, doneDate: v })} />}
        {!service && !noRequired && <Field type="date" label={T.nextInspection} value={i.nextDate} onChange={(v) => setI({ ...i, nextDate: v })} />}
        {noRequired && <div className="rounded-2xl border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-800">{T.inspectionsOkPermanent || "Przeglądy OK — bezterminowo"}</div>}
        {service && <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">{T.noNextDateRequired}</div>}
        {!noRequired && <Field label="Koszt naprawy / serwisu" value={i.cost} onChange={(v) => setI({ ...i, cost: v })} />}
        {!noRequired && (
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-bold text-zinc-500">{service ? T.workDone : T.notes}</span>
            <textarea value={i.notes} onChange={(e) => setI({ ...i, notes: e.target.value })} className="min-h-24 w-full rounded-xl border px-3 py-2" />
          </label>
        )}

        <div className="md:col-span-2 rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="mb-3 text-sm font-black text-zinc-800">{T.attachments}</div>
          <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{T.attachmentSavedHint}</div>

          <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple onChange={(e) => addAttachments(e.target.files)} className="hidden" />
          <input ref={uploadRef} type="file" accept="image/*,application/pdf" multiple onChange={(e) => addAttachments(e.target.files)} className="hidden" />

          <div className="grid gap-3 sm:grid-cols-2">
            <Button type="button" onClick={() => cameraRef.current?.click()} className="rounded-2xl bg-emerald-600 py-6 text-base font-black hover:bg-emerald-700">
              {T.addAttachmentCamera}
            </Button>
            <Button type="button" variant="outline" onClick={() => uploadRef.current?.click()} className="rounded-2xl py-6 text-base font-black">
              {T.uploadAttachmentDevice}
            </Button>
          </div>

          {preparing && <div className="mt-3 rounded-2xl bg-white p-3 text-sm font-bold text-zinc-600">{T.saving}</div>}

          {(i.attachments || []).length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {(i.attachments || []).map((a, idx) => {
                const isImage = String(a.type || "").startsWith("image/") || String(a.url || "").startsWith("data:image/");
                return (
                  <div key={a.id || idx} className="relative overflow-hidden rounded-2xl border bg-white p-2 shadow-sm">
                    {isImage ? (
                      <img loading="lazy" decoding="async" src={a.url} alt={a.name} className="h-32 w-full rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-32 items-center justify-center rounded-xl bg-zinc-100 p-3 text-center text-xs font-bold text-zinc-600">PDF / FILE<br />{a.name}</div>
                    )}
                    <div className="mt-2 truncate text-[11px] font-bold text-zinc-600">{a.name}</div>
                    <button type="button" onClick={() => removeAttachment(a.id || idx)} className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white shadow">
                      {T.remove}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">{T.noAttachments}</div>
          )}
        </div>
      </div>
      <ModalFooter T={T} onClose={onClose} onSave={() => onSave(i)} />
    </Modal>
  );
}


function AlertsDashboard({ T, alarmStats, activeFilter, onToggleFilter, onDayReport }) {
  const items = [
    { key: "failures", label: T.alarmFailures || "Awarie", value: alarmStats.failures.length, cls: "bg-red-50 border-red-200 text-red-700", activeCls: "ring-red-500 bg-red-100 border-red-400" },
    { key: "qrIssues", label: T.alarmQrIssues || "QR do wymiany", value: alarmStats.qrIssues.length, cls: "bg-amber-50 border-amber-200 text-amber-800", activeCls: "ring-amber-500 bg-amber-100 border-amber-400" },
    { key: "inspectionWarnings", label: T.alarmInspectionWarnings || "Przeglądy / braki", value: alarmStats.inspectionWarnings.length, cls: "bg-orange-50 border-orange-200 text-orange-800", activeCls: "ring-orange-500 bg-orange-100 border-orange-400" },
    { key: "unassigned", label: T.alarmUnassigned || "Bez osoby", value: alarmStats.unassigned.length, cls: "bg-zinc-50 border-zinc-200 text-zinc-700", activeCls: "ring-zinc-500 bg-zinc-100 border-zinc-400" },
    { key: "noLocation", label: T.alarmNoLocation || "Bez lokalizacji", value: alarmStats.noLocation.length, cls: "bg-zinc-50 border-zinc-200 text-zinc-700", activeCls: "ring-zinc-500 bg-zinc-100 border-zinc-400" },
  ];

  return (
    <Card className="mt-6 rounded-[32px] border border-white/30 bg-white/95 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black">{T.alertsDashboardTitle || "Dashboard alarmów"}</h2>
            <p className="text-sm text-zinc-500">{T.alertsDashboardHint || "Kliknij kafelek, żeby filtrować. Kliknij ponownie, żeby odznaczyć i wrócić do wszystkich."}</p>
          </div>
          <Button onClick={onDayReport} className="rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800">
            <ClipboardList className="mr-2 h-4 w-4" /> {T.dayReport || "Raport dnia"}
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((item) => {
            const active = activeFilter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onToggleFilter(item.key)}
                className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 ${item.cls} ${active ? `ring-2 ring-offset-2 ${item.activeCls}` : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-2xl font-black">{item.value}</div>
                    <div className="text-xs font-black uppercase tracking-wide">{item.label}</div>
                  </div>
                  {active && <div className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-black uppercase">{T.active || "Aktywny"}</div>}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function DayReportModal({ T, history, tools, onClose }) {
  const todayDate = new Date().toLocaleDateString("pl-PL");
  const rows = (history || []).filter((h) => String(h.date || "").includes(todayDate)).slice(0, 200);
  const failures = rows.filter((h) => String(h.action || "").includes("awari"));
  const transfers = rows.filter((h) => String(h.action || "").includes("Przekaz") || String(h.action || "").includes("Przeję"));
  const services = rows.filter((h) => String(h.action || "").includes("Serwis") || String(h.action || "").includes("Przegl"));

  function print() {
    const html = `<html><head><meta charset="UTF-8"><title>${T.dayReport || "Raport dnia"}</title><style>body{font-family:Arial;margin:24px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #ccc;padding:7px}th{background:#111;color:#fff}</style></head><body><h1>ACC BAU • ${T.dayReport || "Raport dnia"}</h1><p>${new Date().toLocaleString("pl-PL")}</p><p>${T.failures || "Awarie"}: <b>${failures.length}</b> • ${T.transfers || "Przekazania"}: <b>${transfers.length}</b> • ${T.servicesInspections || "Serwis/przeglądy"}: <b>${services.length}</b></p><table><thead><tr><th>${T.date}</th><th>${T.equipment}</th><th>${T.action}</th><th>${T.details}</th><th>${T.from}</th><th>${T.to}</th></tr></thead><tbody>${rows.map((h)=>`<tr><td>${h.date||""}</td><td>${h.toolName||h.toolId||""}</td><td>${historyActionText(h.action,T)}</td><td>${historyDetailsText(h.details,T)}</td><td>${h.from||"—"}</td><td>${h.to||"—"}</td></tr>`).join("")}</tbody></table><script>window.print()</script></body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
  }

  return (
    <Modal wide>
      <ModalHeader title={T.dayReport || "Raport dnia"} subtitle={T.dayReportSubtitle || "Dzisiejsze przekazania, awarie i serwisy"} onClose={onClose} />
      <div className="p-5">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <StatMini label={T.failures || "Awarie"} value={failures.length} />
          <StatMini label={T.transfers || "Przekazania"} value={transfers.length} />
          <StatMini label={T.servicesInspections || "Serwis/przeglądy"} value={services.length} />
        </div>
        <div className="mb-4 flex justify-end"><Button onClick={print} className="rounded-2xl bg-zinc-950 text-white"><Printer className="mr-2 h-4 w-4" /> {T.printDayReport || "Drukuj raport"}</Button></div>
        <div className="max-h-[60vh] overflow-auto rounded-2xl border">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="sticky top-0 bg-zinc-950 text-white"><tr><th className="p-3">{T.date}</th><th className="p-3">{T.equipment}</th><th className="p-3">{T.action}</th><th className="p-3">{T.details}</th><th className="p-3">{T.from}</th><th className="p-3">{T.to}</th></tr></thead>
            <tbody>{rows.map((h) => { const tool = tools.find((t) => t.id === h.toolId); return <tr key={h.id} className="border-t odd:bg-zinc-50"><td className="p-3">{h.date}</td><td className="p-3 font-bold">{h.toolName || tool?.name || h.toolId}</td><td className="p-3">{historyActionText(h.action, T)}</td><td className="p-3">{historyDetailsText(h.details, T)}</td><td className="p-3">{h.from || "—"}</td><td className="p-3">{h.to || "—"}</td></tr>; })}</tbody>
          </table>
          {!rows.length && <div className="p-6 text-sm text-zinc-500">{T.noEntriesToday || "Brak wpisów z dzisiaj."}</div>}
        </div>
      </div>
    </Modal>
  );
}

function StatMini({ label, value }) {
  return <div className="rounded-2xl border bg-zinc-50 p-4"><div className="text-2xl font-black">{value}</div><div className="text-xs font-bold uppercase text-zinc-500">{label}</div></div>;
}

function FailureReportModal({ T, tool, onClose, onSave }) {
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState(T.priorityMedium || "średni");
  const [attachments, setAttachments] = useState([]);
  const [preparing, setPreparing] = useState(false);
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);

  async function addFiles(files) {
    const selectedFiles = Array.from(files || []).slice(0, 4);
    if (!selectedFiles.length) return;
    setPreparing(true);
    const prepared = [];
    for (const file of selectedFiles) {
      try {
        const attachment = await prepareAttachmentFile(file);
        if (attachment) prepared.push(attachment);
      } catch (e) {
        alert(T.attachmentPrepareError || T.preparePhotoError);
      }
    }
    setAttachments((prev) => [...prev, ...prepared]);
    if (cameraRef.current) cameraRef.current.value = "";
    if (uploadRef.current) uploadRef.current.value = "";
    setPreparing(false);
  }

  return (
    <Modal>
      <ModalHeader title={T.reportFailure || "Zgłoś awarię"} subtitle={`${tool.name} • ${tool.id}`} onClose={onClose} />
      <div className="grid gap-4 p-6">
        <FormSelect label={T.failurePriority || "Priorytet"} value={priority} options={[T.priorityLow || "niski", T.priorityMedium || "średni", T.priorityUrgent || "pilny"]} onChange={setPriority} />
        <label className="block"><span className="mb-1 block text-xs font-bold text-zinc-500">{T.failureQuestion || "Co się stało?"}</span><textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-28 w-full rounded-xl border px-3 py-2" placeholder={T.failurePlaceholder || "Np. uszkodzony kabel, nie działa, wyciek, pęknięcie..."} /></label>
        <div className="rounded-2xl border bg-zinc-50 p-4">
          <div className="mb-3 text-sm font-black">{T.failurePhotos || "Zdjęcia awarii / uszkodzeń"}</div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple onChange={(e) => addFiles(e.target.files)} className="hidden" />
          <input ref={uploadRef} type="file" accept="image/*,application/pdf" multiple onChange={(e) => addFiles(e.target.files)} className="hidden" />
          <div className="grid gap-3 sm:grid-cols-2"><Button type="button" onClick={() => cameraRef.current?.click()} className="rounded-2xl bg-emerald-600 py-5 font-black">{T.takePhoto || "Zrób zdjęcie"}</Button><Button type="button" variant="outline" onClick={() => uploadRef.current?.click()} className="rounded-2xl py-5 font-black">{T.uploadFile || "Wgraj plik"}</Button></div>
          {preparing && <div className="mt-3 text-sm font-bold">{T.saving}</div>}
          <AttachmentGallery attachments={attachments} T={T} compact />
        </div>
      </div>
      <ModalFooter T={T} onClose={onClose} onSave={() => onSave({ note, priority, attachments })} />
    </Modal>
  );
}

function SettingsModal({ T, settings, setSettings, onClose, onOptimizeDatabase }) {
  const NL = String.fromCharCode(10);
  const [people, setPeople] = useState((settings.people || []).join(NL));
  const [projects, setProjects] = useState((settings.projects || []).join(NL));
  const [categories, setCategories] = useState((settings.categories || []).join(NL));
  const [pins, setPins] = useState(Object.entries(settings.pins || {}).map(([k, v]) => `${k}:${v}`).join(NL));
  const [roles, setRoles] = useState(Object.entries(settings.roles || {}).map(([k, v]) => `${k}:${v}`).join(NL));
  const [saving, setSaving] = useState(false);
  const clean = (text) => text.split(NL).map((x) => x.trim()).filter(Boolean);

  async function save() {
    if (saving) return;
    setSaving(true);

    try {
      const pinObj = {};
      clean(pins).forEach((line) => {
        const index = line.indexOf(":");
        if (index > 0) {
          const name = line.slice(0, index).trim();
          const pin = line.slice(index + 1).trim();
          if (name && pin) pinObj[name] = pin;
        }
      });

      const roleObj = {};
      clean(roles).forEach((line) => {
        const index = line.indexOf(":");
        if (index > 0) {
          const name = line.slice(0, index).trim();
          const role = line.slice(index + 1).trim();
          if (name && role) roleObj[name] = role;
        }
      });

      const nextSettings = normalizeSettings({
        people: clean(people),
        projects: clean(projects),
        categories: clean(categories),
        pins: pinObj,
        roles: roleObj,
        updatedAt: new Date().toISOString(),
      });

      await persistSettingsEverywhere(nextSettings, setSettings);
      onClose();
    } catch (e) {
      console.error("settings save error", e);
      alert("Nie udało się zapisać ustawień w Supabase: " + (e?.message || e) + "\n\nUstawienia zapisano lokalnie, ale sprawdź tabelę settings / RLS w Supabase.");
    } finally {
      setSaving(false);
    }
  }

  return <Modal wide><ModalHeader title={T.settings} subtitle={T.settingsHint} onClose={onClose} /><div className="grid gap-4 p-6 md:grid-cols-5"><TextList title={T.workers} value={people} setValue={setPeople} /><TextList title={T.sites} value={projects} setValue={setProjects} /><TextList title={T.categories} value={categories} setValue={setCategories} /><TextList title={T.pins} value={pins} setValue={setPins} /><TextList title={T.roles} value={roles} setValue={setRoles} /></div><div className="mx-6 mb-4 rounded-2xl border border-orange-200 bg-orange-50 p-4"><div className="text-sm font-black text-orange-900">{T.phoneSpeedRepair || "Naprawa szybkości telefonu"}</div><p className="mt-1 text-xs text-orange-800">{T.phoneSpeedRepairHint || "Odchudza istniejące zdjęcia zapisane w bazie. Nie usuwa danych ani zdjęć, tylko zmniejsza ich wagę, żeby aplikacja działała na telefonie."}</p><Button type="button" onClick={onOptimizeDatabase} className="mt-3 rounded-xl bg-orange-600 text-white hover:bg-orange-500">{T.optimizePhotosInDb || "Odchudź zdjęcia w bazie"}</Button></div><ModalFooter T={T} onClose={onClose} onSave={save} saving={saving} /></Modal>;
}

function TransferModal({ T, code, tool, onClose }) {
  const url = transferLink(code);
  return <Modal><ModalHeader title={T.transferCode} subtitle={T.transferCodeSubtitle} onClose={onClose} /><div className="p-6 text-center"><p className="text-lg font-black">{tool.name}</p><p className="text-sm text-zinc-500">{tool.id}</p><img loading="lazy" decoding="async" src={qrUrl(url)} alt="QR" className="mx-auto mt-5 h-64 w-64 rounded-3xl border bg-white p-3 shadow-xl" /><textarea value={code} readOnly className="mt-4 h-24 w-full rounded-xl border p-3 text-xs" /></div></Modal>;
}

function HistoryModal({ T, history, tools, onClose, onPrint, onOpen }) {
  return <Modal wide><ModalHeader title={T.historyTitle} subtitle={T.historySubtitle} onClose={onClose} /><div className="p-4 sm:p-6"><div className="mb-4 flex justify-end"><Button onClick={onPrint} className="rounded-2xl bg-zinc-950 hover:bg-zinc-800"><Printer className="mr-2 h-4 w-4" /> {T.printAllHistory}</Button></div><div className="max-h-[65vh] overflow-auto rounded-2xl border"><table className="w-full min-w-[920px] text-left text-xs"><thead className="sticky top-0 bg-zinc-950 text-white"><tr><th className="p-3">{T.date}</th><th className="p-3">{T.equipment}</th><th className="p-3">ID / Serial</th><th className="p-3">{T.action}</th><th className="p-3">{T.from}</th><th className="p-3">{T.to}</th><th className="p-3">{T.details}</th><th className="p-3">{T.photos}</th></tr></thead><tbody>{history.map((h) => { const tool = tools.find((t) => t.id === h.toolId); const photoCount = historyPhotoCount(h); return <tr key={h.id} onClick={() => onOpen(h)} className="cursor-pointer border-t odd:bg-zinc-50 hover:bg-orange-50"><td className="p-3">{h.date}</td><td className="p-3 font-bold">{h.toolName || tool?.name || h.toolId}</td><td className="p-3">{h.toolId}<br />SN: {h.serial || tool?.serial || "—"}</td><td className="p-3">{historyActionText(h.action, T)}</td><td className="p-3 font-bold">{h.from || "—"}</td><td className="p-3 font-bold">{h.to || "—"}</td><td className="p-3">{historyDetailsText(h.details, T)}</td><td className="p-3 font-bold">{photoCountText(photoCount, T)}</td></tr>; })}</tbody></table>{!history.length && <div className="p-6 text-sm text-zinc-500">{T.noHistory}</div>}</div><p className="mt-3 text-xs text-zinc-500">{T.historyClickHint}</p></div></Modal>;
}

function HistoryDetailModal({ T, item, tool, onClose }) {
  const attachments = historyAttachments(item);

  return (
    <Modal wide>
      <ModalHeader title={T.historyDetailTitle} subtitle={`${tool?.name || item.toolId} • ${item.date}`} onClose={onClose} />
      <div className="p-5">
        <div className="mb-5 rounded-2xl border bg-zinc-50 p-4 text-sm">
          <b>{T.action}:</b> {historyActionText(item.action, T)}<br />
          <b>{T.details}:</b> {historyDetailsText(item.details, T)}<br />
          <b>{T.userLabel}:</b> {item.user || "—"}<br />
          <b>{T.photos}:</b> {photoCountText(historyPhotoCount(item), T)}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <PhotoGallery title={T.giverPhotos} photos={item.photosFromGiver || []} T={T} />
          <PhotoGallery title={T.receiverPhotos} photos={item.photosFromReceiver || []} T={T} />
        </div>

        <div className="mt-5">
          <h3 className="mb-3 font-black">{T.attachments}</h3>
          <AttachmentGallery attachments={attachments} T={T} />
        </div>
      </div>
    </Modal>
  );
}

function PhotoGallery({ title, photos, T }) {
  const [preview, setPreview] = useState(null);

  return (
    <div>
      <h3 className="mb-3 font-black">{title}</h3>
      {photos.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {photos.map((p, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setPreview(p)}
              className="block overflow-hidden rounded-2xl border bg-white p-2 text-left shadow hover:ring-2 hover:ring-orange-400"
            >
              <img loading="lazy" decoding="async" src={p} className="h-40 w-full rounded-xl object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-500">{T.noPhotos}</div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4" onClick={() => setPreview(null)}>
          <div className="relative max-h-[92vh] max-w-5xl overflow-auto rounded-3xl bg-white p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setPreview(null)} className="absolute right-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1 text-sm font-black text-white">
              ×
            </button>
            <img loading="lazy" decoding="async" src={preview} className="max-h-[84vh] w-auto rounded-2xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

function HandoverPhotoModal({ T, context, history, setHistory, onClose }) {
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);
  const field = context.mode === "giver" ? "photosFromGiver" : "photosFromReceiver";

  async function addPhotos(files) {
    const selectedFiles = Array.from(files || []).slice(0, 6);

    for (const file of selectedFiles) {
      try {
        const compressed = await compressImage(file, 700, 0.45);
        setPhotos((prev) => [...prev, compressed]);
      } catch (e) {
        alert(T.preparePhotoError);
        console.error(e);
      }
    }
  }

  function removePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function save() {
    setSaving(true);

    let currentItem = history.find((h) => h.id === context.historyId) || context.historyItem;

    if (!currentItem) {
      currentItem = {
        id: context.historyId || crypto.randomUUID?.() || String(Date.now()),
        toolId: context.tool?.id || "",
        toolName: context.tool?.name || "",
        serial: context.tool?.serial || "",
        date: new Date().toLocaleString("pl-PL"),
        user: context.mode === "giver" ? context.tool?.assignedTo || "" : "",
        action: context.mode === "giver" ? "Kod przekazania" : "Przejęcie",
        details: context.mode === "giver" ? "Zdjęcia dodane przy przekazaniu" : "Zdjęcia dodane przy przejęciu",
        photosFromGiver: [],
        photosFromReceiver: [],
      };
    }

    const updatedItem = {
      ...currentItem,
      [field]: [...(currentItem[field] || []), ...photos],
    };

    setHistory((prev) => {
      const exists = prev.some((h) => h.id === updatedItem.id);
      if (!exists) return [updatedItem, ...prev];
      return prev.map((h) => (h.id === updatedItem.id ? updatedItem : h));
    });

    if (supabase) {
      const { error } = await supabase.from("history").upsert({ id: updatedItem.id, data: updatedItem });
      if (error) {
        alert(T.savePhotoError + " " + error.message + "\n\n" + T.savePhotoErrorHint);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onClose();
  }

  return (
    <Modal>
      <ModalHeader title={context.title} subtitle={context.tool?.name} onClose={onClose} />

      <div className="p-6">
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => addPhotos(e.target.files)}
          className="hidden"
        />

        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => addPhotos(e.target.files)}
          className="hidden"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="rounded-2xl bg-emerald-600 py-6 text-base font-black hover:bg-emerald-700"
          >
            {T.addPhotoCamera}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => uploadRef.current?.click()}
            className="rounded-2xl py-6 text-base font-black"
          >
            {T.uploadPhotoDevice}
          </Button>
        </div>

        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {T.photosSavedInHistory}
        </div>

        {photos.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {photos.map((p, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl border bg-white p-2 shadow-sm">
                <img loading="lazy" decoding="async" src={p} className="h-32 w-full rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white shadow"
                >
                  {T.remove}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
            {T.noPhotosAdded}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>{T.skip}</Button>
          <Button type="button" disabled={saving || !photos.length} onClick={save} className="bg-zinc-950 hover:bg-zinc-800">
            {saving ? T.saving : T.savePhotos}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ClaimModal({ T, initialCode, onClose, onClaim }) {
  const [code, setCode] = useState(initialCode || "");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  async function startScanner() {
    setScanError("");
    if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
      setScanError(T.scannerUnsupported);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      setScanning(true);
      setTimeout(async () => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scanLoop();
      }, 200);
    } catch (e) {
      setScanError(T.cameraError);
    }
  }

  async function scanLoop() {
    if (!videoRef.current || !streamRef.current) return;
    try {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const codes = await detector.detect(videoRef.current);
      if (codes && codes.length) {
        const value = codes[0].rawValue || "";
        stopScanner();
        const url = new URL(value, window.location.href);
        const transfer = url.searchParams.get("transfer");
        const finalCode = transfer || value;
        setCode(finalCode);
        onClaim(finalCode);
        return;
      }
    } catch (e) {}
    requestAnimationFrame(scanLoop);
  }

  function stopScanner() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }

  return <Modal><ModalHeader title={T.claimTool} subtitle={T.claimSubtitle} onClose={() => { stopScanner(); onClose(); }} /><div className="p-6"><div className="grid gap-4 md:grid-cols-2"><div><Button onClick={startScanner} className="w-full rounded-2xl bg-emerald-600 py-6 text-base font-bold hover:bg-emerald-700"><ScanLine className="mr-2 h-5 w-5" /> {T.openCameraScan}</Button>{scanning && <div className="mt-4 overflow-hidden rounded-3xl border bg-black p-2"><video ref={videoRef} className="h-72 w-full rounded-2xl object-cover" playsInline muted /></div>}{scanning && <Button onClick={stopScanner} variant="outline" className="mt-3 w-full rounded-2xl">{T.closeCamera}</Button>}{scanError && <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{scanError}</div>}</div><div><textarea value={code} onChange={(e) => setCode(e.target.value)} className="min-h-36 w-full rounded-xl border p-3 text-xs" placeholder={T.transferCode} /><div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{T.claimWarning}</div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => { stopScanner(); onClose(); }}>{T.cancel}</Button><Button onClick={() => onClaim(code)} className="bg-emerald-600 hover:bg-emerald-700"><ScanLine className="mr-2 h-4 w-4" /> {T.takeover}</Button></div></div></div></div></Modal>;
}

function Modal({ children, wide }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className={`max-h-[92vh] w-full overflow-auto rounded-3xl bg-white shadow-2xl ${wide ? "max-w-5xl" : "max-w-3xl"}`}>{children}</motion.div></div>; }
function ModalHeader({ title, subtitle, onClose }) { return <div className="flex items-center justify-between border-b px-6 py-4"><div><h2 className="text-lg font-bold">{title}</h2>{subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}</div><Button variant="ghost" onClick={onClose}><X /></Button></div>; }
function ModalFooter({ T, onClose, onSave, saving = false }) { return <div className="flex justify-end gap-2 border-t px-6 py-4"><Button variant="outline" onClick={onClose} disabled={saving}>{T.cancel}</Button><Button onClick={onSave} disabled={saving} className="bg-zinc-950 hover:bg-zinc-800"><Save className="mr-2 h-4 w-4" /> {saving ? (T.saving || "Zapisywanie...") : T.save}</Button></div>; }
function TextList({ title, value, setValue }) { return <label><span className="mb-2 block text-sm font-bold">{title}</span><textarea value={value} onChange={(e) => setValue(e.target.value)} className="min-h-72 w-full rounded-xl border p-3 text-sm" /></label>; }
function InfoBox({ T }) { return <Card className="rounded-[32px] border border-white/30 bg-white/95 shadow-[0_24px_80px_rgba(0,0,0,0.25)]"><CardContent className="p-4 sm:p-6"><div className="flex items-center gap-2 font-black"><ShieldCheck className="h-5 w-5" /> {T.ruleTitle}</div><ol className="mt-3 space-y-2 text-sm text-zinc-600"><li>1. {T.rule1}</li><li>2. {T.rule2}</li><li>3. {T.rule3}</li><li>4. {T.rule4}</li></ol></CardContent></Card>; }
function SectionTitle({ icon, title }) { return <div className="mb-2 mt-6 flex items-center gap-2 font-black">{React.cloneElement(icon, { className: "h-4 w-4" })} {title}</div>; }



function ppeCanonicalType(value) {
  const v = String(value || "").toLowerCase();
  if (["kask", "helmet", "helm"].some((x) => v.includes(x))) return "helmet";
  if (["buty", "shoes", "schuhe", "sicherheitsschuhe"].some((x) => v.includes(x))) return "shoes";
  if (["szelki", "harness", "auffanggurt"].some((x) => v.includes(x))) return "harness";
  if (["kurtka", "jacket", "jacke"].some((x) => v.includes(x))) return "jacket";
  if (["rękawice", "rekawice", "gloves", "handschuhe"].some((x) => v.includes(x))) return "gloves";
  if (["okulary", "glasses", "brille"].some((x) => v.includes(x))) return "glasses";
  if (["słuchu", "sluchu", "hearing", "gehör", "gehor"].some((x) => v.includes(x))) return "hearing";
  if (["maska", "mask", "maske"].some((x) => v.includes(x))) return "mask";
  if (["kamizelka", "vest", "weste"].some((x) => v.includes(x))) return "vest";
  return "other";
}

function ppeTypeLabel(value, T) {
  const key = ppeCanonicalType(value);
  const map = {
    helmet: T.ppeTypeHelmet || "Kask",
    shoes: T.ppeTypeShoes || "Buty ochronne",
    harness: T.ppeTypeHarness || "Szelki bezpieczeństwa",
    jacket: T.ppeTypeJacket || "Kurtka",
    gloves: T.ppeTypeGloves || "Rękawice",
    glasses: T.ppeTypeGlasses || "Okulary ochronne",
    hearing: T.ppeTypeHearing || "Ochronniki słuchu",
    mask: T.ppeTypeMask || "Maska",
    vest: T.ppeTypeVest || "Kamizelka",
    other: T.ppeTypeOther || "Inne",
  };
  return map[key] || value || "—";
}

function ppeBaseTypes(T) {
  return [
    T.ppeTypeHelmet || "Kask",
    T.ppeTypeShoes || "Buty ochronne",
    T.ppeTypeHarness || "Szelki bezpieczeństwa",
    T.ppeTypeJacket || "Kurtka",
    T.ppeTypeGloves || "Rękawice",
    T.ppeTypeGlasses || "Okulary ochronne",
    T.ppeTypeHearing || "Ochronniki słuchu",
    T.ppeTypeMask || "Maska",
    T.ppeTypeVest || "Kamizelka",
    T.ppeTypeOther || "Inne",
  ];
}

function ppeRequiredCanonicalTypes() {
  return ["helmet", "shoes", "vest", "gloves", "glasses"];
}


function ppeDueStatus(item, T) {
  if (item.status && item.status !== "OK") {
    const danger = item.status === "Uszkodzone" || item.status === "Zgubione" || item.status === "Damaged" || item.status === "Lost";
    return { danger, label: item.status, cls: danger ? "bg-red-100 text-red-700 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200" };
  }
  const d = daysUntil(item.expiryDate);
  if (!item.expiryDate) return { danger: false, label: T.ppeStatusOk || "OK", cls: "bg-green-100 text-green-700 border-green-200" };
  if (d < 0) return { danger: true, label: T.ppeStatusExpired || "Po terminie", cls: "bg-red-100 text-red-700 border-red-200" };
  if (d <= 30) return { danger: true, label: `${T.ppeStatusWarning || "Do kontroli"} • ${d} ${T.days || "dni"}`, cls: "bg-amber-100 text-amber-700 border-amber-200" };
  return { danger: false, label: T.ppeStatusOk || "OK", cls: "bg-green-100 text-green-700 border-green-200" };
}

function PpePage({ T, isAdmin, settings, records, onSave, onDelete, onPrintQr, onPrintEmployeeCard }) {
  const [person, setPerson] = useState(settings.people?.[0] || "");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const empty = {
    id: "",
    person: person || settings.people?.[0] || "",
    type: "Kask",
    name: "",
    size: "",
    serial: "",
    issuedDate: today(),
    expiryDate: "",
    status: "OK",
    notes: "",
    photo: "",
    history: [],
  };

  const people = Array.from(new Set([...(settings.people || []), ...records.map((r) => r.person).filter(Boolean)]));
  const currentRecords = records.filter((r) => {
    const txt = `${r.person} ${r.type} ${r.name} ${r.size} ${r.serial} ${r.notes}`.toLowerCase();
    return (!person || r.person === person) && txt.includes(query.toLowerCase());
  });

  const ppeTypes = ppeBaseTypes(T);
  const ppeStatuses = ["OK", T.ppeStatusWarning || "Do kontroli", T.ppeStatusDamaged || "Uszkodzone", T.ppeStatusLost || "Zgubione"];

  const missingCount = people.reduce((sum, p) => {
    const owned = records.filter((r) => r.person === p);
    const required = ppeRequiredCanonicalTypes();
    return sum + required.filter((req) => !owned.some((r) => ppeCanonicalType(r.type) === req)).length;
  }, 0);

  const selectedOwned = records.filter((r) => !person || r.person === person);
  const selectedMissing = ppeRequiredCanonicalTypes().filter((req) => !selectedOwned.some((r) => ppeCanonicalType(r.type) === req));
  const expiredCount = records.filter((r) => r.expiryDate && daysUntil(r.expiryDate) < 0).length;
  const soonCount = records.filter((r) => r.expiryDate && daysUntil(r.expiryDate) >= 0 && daysUntil(r.expiryDate) <= 30).length;

  return (
    <section className="space-y-5">
      <Card className="rounded-[32px] border border-white/30 bg-white/95 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-black"><ShieldCheck className="h-6 w-6 text-orange-600" /> {T.ppe || "PPE / ŚOI"}</h2>
              <p className="text-sm text-zinc-500">{T.ppeSubtitle || "Środki ochrony indywidualnej pracowników"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => onPrintEmployeeCard(person || (people[0] || ""))} className="rounded-xl bg-white">
                <Printer className="mr-2 h-4 w-4" /> {T.printEmployeePpe || "Drukuj kartę pracownika"}
              </Button>
              {isAdmin && (
                <Button onClick={() => setEditing(empty)} className="rounded-xl bg-orange-600 text-white hover:bg-orange-500">
                  <Plus className="mr-2 h-4 w-4" /> {T.addPpe || "Dodaj PPE"}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<User />} label={T.ppeEmployees || "Pracownicy PPE"} value={people.length} />
            <StatCard icon={<AlertTriangle />} label={T.ppeDashboardExpired || "PPE po terminie"} value={expiredCount} danger={expiredCount > 0} />
            <StatCard icon={<ClipboardList />} label={T.ppeDashboardSoon || "PPE do kontroli"} value={soonCount} danger={soonCount > 0} />
            <StatCard icon={<PackageX />} label={T.ppeDashboardMissing || "Braki PPE"} value={missingCount} danger={missingCount > 0} />
          </div>

          <div className="mt-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-black">{T.ppeEmployeeSummary || "Podsumowanie PPE pracownika"}</div>
                <div className="mt-1 text-xs text-zinc-500">{person || T.ppeAllEmployees || "Wszyscy pracownicy"}</div>
              </div>
              <div className={`rounded-2xl border px-3 py-2 text-sm font-black ${selectedMissing.length ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800"}`}>
                {selectedMissing.length ? `${T.ppeMissingItems || "Brakuje"}: ${selectedMissing.map((x) => ppeTypeLabel(x, T)).join(", ")}` : (T.ppeCompleteSet || "Komplet PPE")}
              </div>
            </div>
            <div className="mt-2 text-xs text-zinc-500">{T.ppeSuggested || "Podpowiedź: dla nowych pracowników sprawdź kask, buty, kamizelkę, rękawice i okulary."}</div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[260px_1fr]">
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-3">
              <div className="mb-2 text-sm font-black">{T.ppeEmployees || "Pracownicy PPE"}</div>
              <button onClick={() => setPerson("")} className={`mb-2 w-full rounded-2xl border px-3 py-2 text-left text-sm font-bold ${person === "" ? "border-zinc-950 bg-zinc-950 text-white" : "bg-white"}`}>
                {T.ppeAllEmployees || "Wszyscy pracownicy"}
              </button>
              <div className="space-y-2">
                {people.map((p) => {
                  const count = records.filter((r) => r.person === p).length;
                  return (
                    <button key={p} onClick={() => setPerson(p)} className={`w-full rounded-2xl border px-3 py-2 text-left text-sm font-bold ${person === p ? "border-orange-500 bg-orange-50 text-orange-800" : "border-zinc-200 bg-white text-zinc-800"}`}>
                      {p}<span className="float-right text-xs text-zinc-500">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-inner">
                <Search className="h-4 w-4 text-zinc-400" />
                <input className="w-full bg-transparent text-sm outline-none" placeholder={T.search || "Szukaj..."} value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>

              <div className="grid gap-3">
                {!currentRecords.length && <div className="rounded-3xl border border-dashed bg-white/80 p-8 text-center text-sm font-bold text-zinc-500">{T.ppeNoItems || "Brak PPE dla tego pracownika."}</div>}
                {currentRecords.map((item) => {
                  const st = ppeDueStatus(item, T);
                  return (
                    <div key={item.id} className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black">{ppeTypeLabel(item.type, T)} • {item.name || "—"}</h3>
                            <Badge cls={st.cls}>{st.label}</Badge>
                          </div>
                          <div className="mt-2 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
                            <div><b>{T.ppeAssignedTo || "Przypisane do"}:</b> {item.person || "—"}</div>
                            <div><b>{T.ppeSize || "Rozmiar"}:</b> {item.size || "—"}</div>
                            <div><b>{T.serial || "Serial"}:</b> {item.serial || "—"}</div>
                            <div><b>{T.ppeIssuedDate || "Data wydania"}:</b> {item.issuedDate || "—"}</div>
                            <div><b>{T.ppeExpiryDate || "Data ważności"}:</b> {item.expiryDate || "—"}</div>
                          </div>
                          {item.notes && <p className="mt-2 rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-700">{item.notes}</p>}
                          <p className="mt-2 text-xs text-zinc-400">{T.ppeQrHint || "Mały QR dla PPE."}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          <Button variant="outline" onClick={() => onPrintQr(item)} className="rounded-xl"><Printer className="mr-2 h-4 w-4" /> {T.printPpeQr || "Drukuj mały QR"}</Button>
                          {isAdmin && <Button variant="outline" onClick={() => setEditing(item)} className="rounded-xl"><Edit3 className="mr-2 h-4 w-4" /> {T.edit}</Button>}
                          {isAdmin && <Button variant="outline" onClick={() => onDelete(item.id)} className="rounded-xl text-red-600"><Trash2 className="mr-2 h-4 w-4" /> {T.delete}</Button>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {editing && (
        <PpeFormModal
          T={T}
          form={editing}
          setForm={setEditing}
          people={people}
          types={ppeTypes}
          statuses={ppeStatuses}
          onClose={() => setEditing(null)}
          onSave={() => { onSave(editing); setEditing(null); }}
        />
      )}
    </section>
  );
}

function PpeFormModal({ T, form, setForm, people, types, statuses, onClose, onSave }) {
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  return (
    <Modal onClose={onClose} wide>
      <div className="mb-4 flex items-center justify-between border-b px-1 pb-4">
        <h3 className="text-xl font-black">{form.id ? (T.editPpe || "Edytuj PPE") : (T.addPpe || "Dodaj PPE")}</h3>
        <Button onClick={onClose} variant="outline" className="rounded-xl"><X className="h-4 w-4" /></Button>
      </div>

      <p className="mb-4 rounded-2xl bg-orange-50 p-3 text-sm font-bold text-orange-800">{T.ppeFormHint || "Wypełnij dane wydanego środka ochrony. Istniejące PPE i historia nie są usuwane."}</p>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <FormSelect label={T.person || "Osoba"} value={form.person || ""} options={people} onChange={(v) => set("person", v)} />
        <FormSelect label={T.ppeType || "Rodzaj PPE"} value={form.type || ""} options={types} onChange={(v) => set("type", v)} />
        <Field label={T.ppeItem || "Nazwa / model"} value={form.name || ""} onChange={(v) => set("name", v)} />
        <Field label={T.ppeSize || "Rozmiar"} value={form.size || ""} onChange={(v) => set("size", v)} />
        <Field label={T.serial || "Numer seryjny"} value={form.serial || ""} onChange={(v) => set("serial", v)} />
        <FormSelect label={T.status || "Status"} value={form.status || "OK"} options={statuses} onChange={(v) => set("status", v)} />
        <Field label={T.ppeIssuedDate || "Data wydania"} value={form.issuedDate || ""} type="date" onChange={(v) => set("issuedDate", v)} />
        <Field label={T.ppeExpiryDate || "Data ważności / przeglądu"} value={form.expiryDate || ""} type="date" onChange={(v) => set("expiryDate", v)} />
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-bold text-zinc-500">{T.notes || "Uwagi"}</span>
        <textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} className="min-h-[140px] w-full rounded-xl border px-3 py-2" />
      </label>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} className="rounded-xl">{T.cancel}</Button>
        <Button onClick={onSave} className="rounded-xl bg-orange-600 text-white hover:bg-orange-500"><Save className="mr-2 h-4 w-4" /> {T.save}</Button>
      </div>
    </Modal>
  );
}

function PublicPpeView({ ppe, T, lang, setLang, onBack }) {
  if (!ppe) {
    return (
      <div className="min-h-screen bg-zinc-100 p-4">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-xl">
          <LanguageSelect lang={lang} setLang={setLang} />
          <h1 className="mt-4 text-2xl font-black">{T.noToolFound || "Nie znaleziono."}</h1>
          <Button onClick={onBack} className="mt-4 rounded-xl">{T.back}</Button>
        </div>
      </div>
    );
  }

  const st = ppeDueStatus(ppe, T);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#2f302d,#d7d2c8)] p-4">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[32px] bg-white shadow-2xl">
        <div className="bg-zinc-950 p-5 text-white">
          <div className="flex items-center justify-between gap-3">
            <LogoMark small />
            <LanguageSelect lang={lang} setLang={setLang} dark />
          </div>
          <h1 className="mt-4 text-2xl font-black">{T.ppePublicTitle || "ACC BAU • PPE INFORMATION"}</h1>
          <p className="text-sm text-zinc-300">{T.ppePublicSubtitle || "Informacje po zeskanowaniu QR — bez logowania."}</p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Info label={T.ppeType || "Rodzaj PPE"} value={ppeTypeLabel(ppe.type, T)} />
          <Info label={T.ppeItem || "Nazwa / model"} value={ppe.name || "—"} />
          <Info label={T.ppeAssignedTo || "Przypisane do"} value={ppe.person || "—"} />
          <Info label={T.ppeSize || "Rozmiar"} value={ppe.size || "—"} />
          <Info label={T.serial || "Numer seryjny"} value={ppe.serial || "—"} />
          <Info label={T.ppeIssuedDate || "Data wydania"} value={ppe.issuedDate || "—"} />
          <Info label={T.ppeExpiryDate || "Data ważności / przeglądu"} value={ppe.expiryDate || "—"} />
          <div className={`rounded-2xl border p-3 ${st.cls}`}>
            <p className="text-xs font-bold">{T.status || "Status"}</p>
            <p className="font-black">{st.label}</p>
          </div>
          <div className="sm:col-span-2">
            <Info label={T.notes || "Uwagi"} value={ppe.notes || "—"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, danger }) { return <Card className="rounded-[28px] border border-white/30 bg-white/95 shadow-xl"><CardContent className="flex items-center gap-4 p-5"><div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${danger ? "bg-red-100 text-red-700" : "bg-zinc-100 text-zinc-900"}`}>{React.cloneElement(icon, { className: "h-6 w-6" })}</div><div><p className="text-sm text-zinc-500">{label}</p><p className="text-2xl font-black">{value}</p></div></CardContent></Card>; }
function Select({ label, value, setValue, options }) { return <label><span className="mb-1 block text-xs font-bold text-zinc-500">{label}</span><select value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded-xl border bg-white px-3 py-2 text-sm">{options.map((o) => <option key={o} value={o}>{o || "—"}</option>)}</select></label>; }
function FormSelect({ label, value, options, onChange }) { return <label><span className="mb-1 block text-xs font-bold text-zinc-500">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border px-3 py-2">{options.map((o) => <option key={o} value={o}>{o || "—"}</option>)}</select></label>; }
function Field({ label, value, onChange, type = "text" }) { return <label><span className="mb-1 block text-xs font-bold text-zinc-500">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border px-3 py-2" /></label>; }
function Info({ label, value }) { return <div className="rounded-2xl border bg-zinc-50 px-3 py-2"><p className="text-xs text-zinc-500">{label}</p><p className="whitespace-pre-line font-semibold text-zinc-900">{value}</p></div>; }
function Badge({ children, cls }) { return <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${cls}`}>{children}</span>; }
