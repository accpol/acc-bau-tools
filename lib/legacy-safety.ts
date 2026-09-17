/** Compatibility helpers for the existing Tools/PPE JSON schema. No schema migration. */
type Row = Record<string, unknown>;
const equal=(a:unknown,b:unknown):boolean=>JSON.stringify(a)===JSON.stringify(b);
export class LegacyConflict extends Error { constructor(){super("Dane zmieniły się na innym urządzeniu. Odśwież dane i ponów zmianę. Nie nadpisano istniejących wpisów.");} }
/** Apply only changes made against base; retain server-only fields and unmatched rows. */
export function mergeLegacyRecord(base:Row,next:Row,current:Row):Row {
  const result={...current};
  for(const [key,value] of Object.entries(next)) {
    if(key==="updatedAt"||equal(value,base[key]))continue;
    if(["ppeRecords","inspections","history"].includes(key)&&Array.isArray(value)) {
      const old=Array.isArray(base[key])?base[key] as Row[]:[];
      const remote=Array.isArray(current[key])?current[key] as Row[]:[];
      const merged=[...remote];
      for(const item of value as Row[]) {
        if(!item||typeof item!=="object"||!item.id) {if(!merged.some(x=>equal(x,item)))merged.push(item);continue;}
        const before=old.find(x=>x.id===item.id), index=merged.findIndex(x=>x.id===item.id);
        if(before&&equal(before,item))continue;
        if(index<0){if(before)throw new LegacyConflict();merged.push(item);}
        else if(!before&&!equal(merged[index],item))throw new LegacyConflict();
        else if(before)merged[index]=mergeLegacyRecord(before,item,merged[index]);
      }
      // Omitting a record NEVER deletes it. Archival is a field change.
      result[key]=merged;
    } else {
      if(!equal(current[key],base[key])&&!equal(current[key],value))throw new LegacyConflict();
      result[key]=value;
    }
  }
  if("updatedAt" in next)result.updatedAt=new Date().toISOString();
  return result;
}
export function legacyDateValue(value:unknown):number {
  const text=String(value||"");
  if(/^\d{4}-\d{2}-\d{2}/.test(text))return Date.parse(text)||0;
  const m=text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  return m?new Date(+m[3],+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0),+(m[6]||0)).getTime():0;
}
export function sortLegacyHistory<T extends {createdAt?:unknown;date?:unknown}>(list:T[]):T[]{return [...list].sort((a,b)=>legacyDateValue(b.createdAt||b.date)-legacyDateValue(a.createdAt||a.date));}
const RECOVERY_KEYS = ["acc_tools_v7", "acc_history_v7", "acc_settings_v7"];
const RECOVERY_SUFFIX = "__before_fleet_v1";
export function safeCacheSet(key:string,value:unknown):boolean {
  try {
    // Before the first replacement, retain the ORIGINAL browser copy verbatim.
    // If there is no space for the recovery copy, do not overwrite the old cache.
    if(RECOVERY_KEYS.includes(key)) {
      const previous=localStorage.getItem(key);
      if(previous!==null && localStorage.getItem(key+RECOVERY_SUFFIX)===null)
        localStorage.setItem(key+RECOVERY_SUFFIX,previous);
    }
    localStorage.setItem(key,JSON.stringify(value));return true;
  } catch {
    if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("acc-cache-warning"));return false;
  }
}
/** Browser recovery export only; NOT a full backup of the database or Storage. */
export function exportLegacyRecovery():void {
  try {
    const raw:Record<string,string|null>={};
    for(const key of RECOVERY_KEYS)raw[key]=localStorage.getItem(key+RECOVERY_SUFFIX)??localStorage.getItem(key);
    const content=JSON.stringify({format:"acc-tools-browser-recovery-v1",exportedAt:new Date().toISOString(),raw},null,2);
    const url=URL.createObjectURL(new Blob([content],{type:"application/json"}));
    const a=document.createElement("a");a.href=url;a.download="ACC-BAU-kopia-przegladarki-"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
  } catch {alert("Nie można pobrać lokalnej kopii. Nie czyść danych przeglądarki.");}
}
