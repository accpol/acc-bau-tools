"use client";
import React, { useRef, useState } from "react";
import { api } from "@/lib/fleet/client";
import { addCalendarMonths, emptyVehicle, INFO_FIELDS, localToday } from "@/lib/fleet/domain";
import { tr } from "@/lib/fleet/i18n";
import type { FleetCommand, FleetEvent, FleetMember, ServicePlan, VehicleDetail } from "@/lib/fleet/types";
import { Btn, Check, Dialog, ErrorBanner, errorCode, FormFooter, Input, Pick, Textarea, Uploader } from "./common";

export interface ModalSpec { type:string; event?:FleetEvent; plan?:ServicePlan }
interface Props { spec:ModalSpec; detail:VehicleDetail|null; lang:string; member:FleetMember; people:string[]; projects:string[]; onClose:()=>void; onSaved:(d:VehicleDetail)=>void; onRefresh:()=>Promise<void> }
const opt=(lang:string,values:string[],blank=false)=>[...(blank?[{value:"",label:"—"}]:[]),...values.map(value=>({value,label:tr(lang,value)}))];
const titles:Record<string,string>={create:"addVehicle",update:"editVehicle",mileage:"addMileage",assignment:"assign",service:"newService",defect:"defect",plan_add:"addPlan",plan_update:"editPlan",document_attach:"attachToRecord",archive:"archive",restore:"restore",plan_archive:"planArchive",defect_close:"defectClose",mileage_correction:"correctMileage",document:"newDocuments"};
export function CommandModal({spec,detail,lang,member,people,projects,onClose,onSaved,onRefresh}:Props) {
  const initial=()=> {
    const v=detail?.vehicle.data||emptyVehicle();
    const result:Record<string,string>={};
    if(spec.type==="create"||spec.type==="update") for(const key of INFO_FIELDS) result[key]=String(v[key]??"");
    const initialValues:Record<string,string> = {...result,date:localToday(),mileage:spec.type==="create"?"":String(v.mileage??""),driver:v.driver,project:v.project,location:v.location,title:"",notes:spec.type==="update"?v.notes:"",recordKind:"service",cost:"",currency:"EUR",costBasis:"gross",workshop:"",invoiceNumber:"",priority:"normal",kind:"inspection",label:tr(lang,"inspection"),dueDate:"",dueMileage:"",intervalMonths:"",intervalKm:"",warnDays:"30",warnKm:"1500",reason:"",correctedMileage:spec.event?.data.mileage==null?"":String(spec.event.data.mileage)};
    if(spec.type==="plan_update"&&spec.plan) for(const [key,value] of Object.entries(spec.plan)) if(typeof value!=="object" || value===null)initialValues[key]=String(value??"");
    if(spec.type==="document_attach")initialValues.title=(tr(lang,"attachToRecord")+": "+(spec.event?.data.title||tr(lang,spec.event?.kind||"document"))).slice(0,160);
    return initialValues;
  };
  const [values,setValues]=useState<Record<string,string>>(initial); const [busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState("");
  const [ids,setIds]=useState<string[]>([]),[completions,setCompletions]=useState<Record<string,{nextDate:string;nextMileage:string}>>(()=>spec.type==="service"&&spec.plan?{[spec.plan.id]:{nextDate:"",nextMileage:""}}:{});
  const [section,setSection]=useState("basic"); const newId=useRef(crypto.randomUUID()),planId=useRef(crypto.randomUUID()); const command=useRef<FleetCommand|null>(null);
  const admin=member.role==="admin"; const type=spec.type; const v=detail?.vehicle;
  const put=(key:string,value:string)=>{setValues(old=>({...old,[key]:value}));command.current=null;};
  const close=()=>{if(!busy&&!uploading&&window.confirm(tr(lang,"dirtyClose")))onClose();};
  async function save(e:React.FormEvent) {
    e.preventDefault();if(busy||uploading)return;setBusy(true);setError("");
    try {
      if(!command.current) {
        let payload:Record<string,unknown>={...values}; const actualType=type==="service"?values.recordKind:type;
        if(type==="update") payload=Object.fromEntries(INFO_FIELDS.map(k=>[k,values[k]??v?.data[k]??""]));
        if(type==="plan_add") payload.id=planId.current;
        if(type==="plan_update") payload.id=spec.plan?.id;
        if(type==="document_attach") payload.relatedEventId=spec.event?.id;
        if(type==="plan_archive") payload.id=spec.plan?.id;
        if(type==="defect_close") payload.id=spec.event?.id;
        if(type==="mileage_correction") payload.correctedId=spec.event?.id;
        if(type==="service") payload.completions=Object.entries(completions).map(([id,value])=>({id,...value}));
        command.current={commandId:crypto.randomUUID(),vehicleId:v?.id||newId.current,expectedVersion:v?.version||0,type:actualType,payload,fileIds:ids};
      }
      const result=await api<VehicleDetail>("commands",command.current);onSaved(result);
    }catch(e){setError(errorCode(e));}finally{setBusy(false);}
  }
  const input=(key:string,required=false,inputType="text",list?:string)=><Input key={key} label={tr(lang,key)} name={key} type={inputType} required={required} value={values[key]??""} onChange={e=>put(key,e.target.value)} maxLength={key==="vin"?17:200} min={inputType==="number"?"0":undefined} step={inputType==="number"?"1":undefined} list={list}/>;
  const select=(key:string,options:string[],blank=false)=><Pick key={key} label={tr(lang,key)} value={values[key]??""} onChange={e=>put(key,e.target.value)} options={opt(lang,options,blank)}/>;
  const needsUploads=["mileage","assignment","service","defect","document","document_attach"].includes(type)&&!!v;
  return <Dialog title={tr(lang,titles[type]||type)} onClose={close} busy={busy||uploading} wide={type==="create"||type==="update"||type==="service"}>
    <form onSubmit={save} onInvalidCapture={e=>{
      const target=e.target as HTMLInputElement;
      const tab=target.closest<HTMLElement>("[data-form-section]")?.dataset.formSection;
      if(tab&&tab!==section){e.preventDefault();setSection(tab);requestAnimationFrame(()=>{target.focus();target.reportValidity();});}
    }}><fieldset disabled={busy} className="space-y-5 p-4 sm:p-6">
      <ErrorBanner lang={lang} error={error}/>
      {error==="CONFLICT"&&<Btn onClick={async()=>{try{await onRefresh();command.current=null;setError("");}catch(e){setError(errorCode(e));}}}>{tr(lang,"reloadDraft")}</Btn>}
      <datalist id="fleet-form-people">{Array.from(new Set(people)).map(p=><option key={p} value={p}/>)}</datalist><datalist id="fleet-form-projects">{Array.from(new Set(projects)).map(p=><option key={p} value={p}/>)}</datalist>
      {(type==="create"||type==="update")&&<>
        <div className="flex flex-wrap gap-2">{["basic","technical","financial"].map(s=><Btn key={s} tone={section===s?"primary":"light"} onClick={()=>setSection(s)}>{tr(lang,s)}</Btn>)}</div>
        {/* Reveal a tab before the browser focuses its invalid field. */}
        <div data-form-section="basic" className={section==="basic"?"grid gap-4 sm:grid-cols-2 lg:grid-cols-3":"hidden"}>
          {input("plate",true)}{input("make",true)}{input("model",true)}{input("name")}{input("vin")}{input("year",false,"number")}
          {select("category",["car","van","truck","trailer","crane","telehandler","machine","other"])}{input("country")}{select("status",["available","in_use","service","out_of_service","sold"])}
          {input("project",false,"text","fleet-form-projects")}{input("location")}
          {type==="create"&&<>{input("driver",false,"text","fleet-form-people")}{input("mileage",false,"number")}<Input label={tr(lang,"mileageDate")} type="date" max={localToday()} value={values.date} onChange={e=>put("date",e.target.value)}/></>}
        </div>
        <div data-form-section="technical" className={section==="technical"?"grid gap-4 sm:grid-cols-2 lg:grid-cols-3":"hidden"}>
          {select("fuel",["diesel","petrol","electric","hybrid","lpg","other"])}{input("transmission")}{input("firstRegistration",false,"date")}{input("engine")}{input("power",false,"number")}{input("maxMass",false,"number")}{input("payload",false,"number")}{input("seats",false,"number")}{input("tyreSize")}
        </div>
        <div data-form-section="financial" className={section==="financial"?"grid gap-4 sm:grid-cols-2 lg:grid-cols-3":"hidden"}>
          {input("company")}{select("ownership",["owned","leased","rented"])}{input("purchaseDate",false,"date")}{input("purchasePrice")}{select("purchaseCurrency",["EUR","PLN","SEK","DKK","CZK","GBP","USD"])}{input("leasingUntil",false,"date")}{input("insurer")}{input("policyNumber")}{input("assistancePhone")}
        </div>
        <Textarea label={tr(lang,"notes")} value={values.notes} maxLength={6000} onChange={e=>put("notes",e.target.value)}/>
        <p className="rounded-xl bg-orange-50 p-3 text-xs text-orange-900">{tr(lang,type==="create"?"saveVehicleFirst":"mileageInitialHint")}</p>
      </>}
      {["mileage","assignment","service","defect"].includes(type)&&<>
        {type==="service"&&select("recordKind",["service","repair","inspection"])}
        <div className="grid gap-4 sm:grid-cols-2"><Input label={tr(lang,"date")} type="date" value={values.date} max={localToday()} min={type==="assignment"?localToday():undefined} required onChange={e=>put("date",e.target.value)}/>{input("mileage",type!=="defect","number")}</div>
        {type==="assignment"&&<><p className="text-sm text-zinc-500">{tr(lang,"from")}: <b>{v?.data.driver||tr(lang,"returned")}</b></p><div className="grid gap-4 sm:grid-cols-2">{input("driver",false,"text","fleet-form-people")}{input("project",false,"text","fleet-form-projects")}{input("location")}</div><p className="text-xs text-zinc-500">{tr(lang,"returned")}: —</p></>}
        {["service","defect"].includes(type)&&<Input label={tr(lang,"titleField")} value={values.title} required maxLength={160} onChange={e=>put("title",e.target.value)}/>}
        {type==="defect"&&select("priority",["low","normal","urgent"])}
        {type==="service"&&<>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{input("workshop")}{input("invoiceNumber")}<Input label={tr(lang,"cost")} inputMode="decimal" value={values.cost} onChange={e=>put("cost",e.target.value)}/>{select("currency",["EUR","PLN","SEK","DKK","CZK","GBP","USD"])}{select("costBasis",["gross","net"])}</div>
          {!!v?.data.plans.some(p=>!p.archived)&&<div className="space-y-3 rounded-2xl border border-orange-200 bg-orange-50/50 p-4"><h3 className="text-sm font-black">{tr(lang,"completedPlans")}</h3><p className="text-xs leading-relaxed text-zinc-600">{tr(lang,"completedHint")}</p>
            {v.data.plans.filter(p=>!p.archived).map(p=><div key={p.id} className="rounded-xl border border-orange-100 bg-white p-3"><Check label={p.label} checked={p.id in completions} onChange={e=>{setCompletions(prev=>{const n={...prev};if(e.target.checked)n[p.id]={nextDate:"",nextMileage:""};else delete n[p.id];return n;});command.current=null;}}/>
              {p.id in completions&&<div className="mt-3 grid gap-3 sm:grid-cols-2"><Input label={`${tr(lang,"nextDate")}${p.intervalMonths&&values.date?` (${addCalendarMonths(values.date, p.intervalMonths)})`:""}`} type="date" value={completions[p.id].nextDate} onChange={e=>{setCompletions(prev=>({...prev,[p.id]:{...prev[p.id],nextDate:e.target.value}}));command.current=null;}}/><Input label={`${tr(lang,"nextMileage")}${p.intervalKm&&values.mileage!==""?` (${Number(values.mileage)+p.intervalKm})`:""}`} type="number" min="0" step="1" value={completions[p.id].nextMileage} onChange={e=>{setCompletions(prev=>({...prev,[p.id]:{...prev[p.id],nextMileage:e.target.value}}));command.current=null;}}/></div>}
            </div>)}
          </div>}
        </>}
        <Textarea label={tr(lang,"notes")} value={values.notes} maxLength={6000} onChange={e=>put("notes",e.target.value)}/>
      </>}
      {(type==="plan_add"||type==="plan_update")&&<>
        <div className="rounded-xl bg-orange-50 p-3 text-sm font-bold text-orange-900">{tr(lang,"firstDue")}</div>
        <p className="text-xs leading-relaxed text-zinc-500">{tr(lang,"intervalHint")}</p>
        <div className="grid gap-4 sm:grid-cols-2"><Pick label={tr(lang,"kind")} value={values.kind} onChange={e=>{put("kind",e.target.value);put("label",tr(lang,e.target.value));}} options={opt(lang,["inspection","insurance","udt","oil","oil_filter","air_filter","cabin_filter","fuel_filter","timing_belt","brake_fluid","tyres","tachograph","extinguisher","other"])}/>{input("label",true)}{input("dueDate",false,"date")}{input("dueMileage",false,"number")}{input("intervalMonths",false,"number")}{input("intervalKm",false,"number")}{input("warnDays",false,"number")}{input("warnKm",false,"number")}</div>
        {type==="plan_update"&&<Textarea label={tr(lang,"reason")} required maxLength={2000} value={values.reason} onChange={e=>put("reason",e.target.value)}/>}
        <Textarea label={tr(lang,"notes")} value={values.notes} maxLength={2000} onChange={e=>put("notes",e.target.value)}/>
      </>}
      {(type==="archive"||type==="plan_archive")&&<><p className="text-sm text-zinc-600">{type==="archive"?tr(lang,"archiveHint"):spec.plan?.label}</p><Textarea label={tr(lang,"reason")} required maxLength={2000} value={values.reason} onChange={e=>put("reason",e.target.value)}/></>}
      {type==="restore"&&<p className="text-sm">{v?.data.plate} — {tr(lang,"retained")}</p>}
      {type==="mileage_correction"&&<><p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{tr(lang,"correctionHint")}</p><p className="text-sm">{spec.event?.happened_on}: {spec.event?.data.mileage} km</p>{input("correctedMileage",true,"number")}<Textarea required label={tr(lang,"reason")} maxLength={2000} value={values.reason} onChange={e=>put("reason",e.target.value)}/></>}
      {type==="defect_close"&&<><p className="font-bold">{spec.event?.data.title}</p><p className="text-sm text-amber-800">{tr(lang,"defectCloseHint")}</p><Textarea required label={tr(lang,"titleField")} maxLength={3000} value={values.notes} onChange={e=>put("notes",e.target.value)}/></>}
      {(type==="document"||type==="document_attach")&&<><Input label={tr(lang,"titleField")} required value={values.title} maxLength={160} onChange={e=>put("title",e.target.value)}/><Textarea label={tr(lang,"notes")} value={values.notes} maxLength={3000} onChange={e=>put("notes",e.target.value)}/></>}
      {needsUploads&&<Uploader vehicleId={v!.id} lang={lang} admin={admin} fileIds={ids} onIds={x=>{setIds(x);command.current=null;}} existing={detail!.files} onBusy={setUploading} defaultCategory={type==="service"||type==="document_attach"?"invoice":"photo"}/>}
    </fieldset><FormFooter lang={lang} busy={busy||uploading} onClose={close}/></form>
  </Dialog>;
}

export function MembersModal({lang,people,current,onClose,onSessionExpired}:{lang:string;people:string[];current:FleetMember;onClose:()=>void;onSessionExpired:()=>void}) {
  const [members,setMembers]=useState<FleetMember[]>([]),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  const [form,setForm]=useState({id:"",name:"",pin:"",role:"worker",active:true});
  React.useEffect(()=>{let alive=true;api<{members:FleetMember[]}>("members").then(r=>{if(alive)setMembers(r.members);}).catch(e=>{if(alive)setError(errorCode(e));});return()=>{alive=false;};},[]);
  async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{const r=await api<{member:FleetMember;reLogin:boolean}>("members",{...form,id:form.id||null});setMembers(prev=>[...prev.filter(m=>m.id!==r.member.id),r.member]);setForm({id:"",name:"",pin:"",role:"worker",active:true});if(r.reLogin)onSessionExpired();}catch(e){setError(errorCode(e));}finally{setBusy(false);}}
  return <Dialog title={tr(lang,"members")} onClose={onClose} busy={busy} wide><div className="grid gap-5 p-4 sm:p-6 md:grid-cols-2"><div><p className="mb-4 text-sm leading-relaxed text-zinc-600">{tr(lang,"workerHint")}</p><div className="space-y-2">{members.map(m=><button key={m.id} className="flex w-full justify-between rounded-xl border bg-zinc-50 p-3 text-left text-sm" onClick={()=>setForm({id:m.id,name:m.name,pin:"",role:m.role,active:m.active})}><b>{m.name}</b><span>{tr(lang,m.role)}{!m.active?" • ×":""}</span></button>)}</div><Btn className="mt-3" onClick={()=>setForm({id:"",name:"",pin:"",role:"worker",active:true})}>{tr(lang,"addMember")}</Btn></div><form onSubmit={save} className="space-y-4"><ErrorBanner lang={lang} error={error}/><p className="text-xs text-zinc-500">{tr(lang,"memberNameHint")}</p><datalist id="fleet-member-names">{Array.from(new Set(people)).map(p=><option key={p} value={p}/>)}</datalist><Input label={tr(lang,"loginName")} value={form.name} required maxLength={160} list="fleet-member-names" disabled={!!form.id||busy} onChange={e=>setForm({...form,name:e.target.value})}/><Input label={tr(lang,"pin")} type="password" autoComplete="new-password" minLength={8} maxLength={128} required={!form.id} value={form.pin} onChange={e=>setForm({...form,pin:e.target.value})}/><p className="text-xs text-zinc-500">{tr(lang,"pinHint")}</p><Pick label={tr(lang,"role")} value={form.role} disabled={form.id===current.id} onChange={e=>setForm({...form,role:e.target.value})} options={opt(lang,["worker","admin"])}/><Check label={tr(lang,"accountActive")} checked={form.active} disabled={form.id===current.id} onChange={e=>setForm({...form,active:e.target.checked})}/><Btn type="submit" tone="primary" disabled={busy}>{tr(lang,busy?"saving":"save")}</Btn></form></div></Dialog>;
}
