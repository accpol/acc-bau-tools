/** Pure compatibility helpers. They do not migrate or delete any legacy records. */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return "{" + Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",") + "}";
  return JSON.stringify(value) ?? "null";
}
export function mergeSettingsChanges(current: Record<string, unknown>, next: Record<string, unknown>, expected: Record<string, unknown>, changedKeys: string[]): Record<string, unknown> {
  const normalize = (key: string, value: unknown) => key === "ppeRecords" ? value ?? [] : value;
  for (const key of changedKeys) {
    if (canonical(normalize(key, current[key])) !== canonical(normalize(key, expected[key]))) {
      throw new Error("Ustawienia lub PPE zostały zmienione na innym urządzeniu. Nie nadpisano ich. Odśwież stronę i ponów zmianę.");
    }
  }
  return { ...current, ...Object.fromEntries(changedKeys.map((key) => [key, next[key]])) };
}
export type LegacyInspection = { id?: string; type?: string; kind?: string; nextDate?: string; doneDate?: string; result?: string; noInspectionRequired?: boolean };
export function legacyNoInspection(item: LegacyInspection | null | undefined): boolean {
  return !!item?.noInspectionRequired || ["Nie wymaga przeglądu", "No inspection required", "Keine Prüfung erforderlich"].includes(item?.type || "");
}
export function legacyService(item: LegacyInspection | null | undefined): boolean {
  if (legacyNoInspection(item)) return false;
  return item?.kind === "service" || ["Naprawa / Serwis", "Naprawa", "Serwis"].includes(item?.type || "");
}
export function latestLegacyInspections<T extends LegacyInspection>(entries: T[]): T[] {
  // Entries are stored newest first; for a back-dated input prefer its actual performance date.
  const groups = new Map<string, T>();
  for (const entry of entries) {
    if (legacyService(entry) || legacyNoInspection(entry)) continue;
    const key = (entry.type || "Inny").trim().toLocaleLowerCase();
    const previous = groups.get(key);
    if (!previous || (entry.doneDate || "") > (previous.doneDate || "")) groups.set(key, entry);
  }
  return [...groups.values()];
}
export function negativeLegacyInspection(entry: LegacyInspection): boolean {
  const result = (entry.result || "").trim().toLocaleLowerCase();
  return /^(nok|not ok|nie|negative|negatywny|negativ|failed|fail|niedopuszczony|niezaliczony|bad)/.test(result);
}
/** Defense in depth for legacy HTML print templates: never run stored scripts in a same-origin print tab. */
export function legacyPrintDocument(html: string): string {
  const policy = "default-src 'none'; img-src https: data: blob:; style-src 'unsafe-inline'; script-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
  // Put the restriction before all interpolated text/attributes.
  return html.replace(/<head>/i, `<head><meta http-equiv="Content-Security-Policy" content="${policy}">`);
}
