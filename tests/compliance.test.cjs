const test = require('node:test');
const A = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const D = require('../lib/fleet/domain.ts');
const C = require('../lib/fleet/compliance.ts');
const Cmd = require('../lib/fleet/compliance-command.ts');
const {ct} = require('../lib/fleet/compliance-i18n.ts');
const {tr} = require('../lib/fleet/i18n.ts');
const today = '2026-09-17';
const admin = {id:randomUUID(),name:'Piotr Mania',role:'admin',active:true,auth_version:1};
function vehicle(patch={}) { return {id:randomUUID(),data:{...D.emptyVehicle(),plate:'TEST 123',make:'Test',model:'Van',...patch},version:5,created_at:'2026-01-01',updated_at:'2026-01-01'}; }
function plan(kind='insurance',date='2026-10-17',extra={}) { return {id:randomUUID(),kind,label:kind,dueDate:date,dueMileage:null,intervalMonths:null,intervalKm:null,warnDays:30,warnKm:1500,lastDoneDate:null,lastDoneMileage:null,notes:'keep plan notes',archived:false,...extra}; }
function command(v,kind='insurance',payload={}) { return {commandId:randomUUID(),vehicleId:v.id,expectedVersion:v.version,type:'compliance_save',fileIds:[],payload:{kind,requirement:'required',planId:C.compliancePlans(v.data,kind)[0]?.id||randomUUID(),dueDate:'2027-09-17',documentIds:[],responsible:'Piotr Mania',...payload}}; }
function readyDocument(v,id=randomUUID()) { return {id,vehicle_id:v.id,state:'ready',category:'document'}; }
function code(fn,expected) { A.throws(fn,e=>e.code===expected); }
function healthy() {
 const v=vehicle({plans:[plan('insurance','2027-09-17'),plan('inspection','2027-09-17')],compliance:{registration:{fileIds:[randomUUID()]}}});
 v.data.compliance.insurance={fileIds:[randomUUID()],planId:v.data.plans[0].id,documentDueDate:'2027-09-17'};
 return v;
}

test('compliance: stare wpisy bez nowego JSON nie są mutowane i nie wyglądają na kompletne',()=>{
 const v=vehicle();const original=JSON.stringify(v);const summary=C.vehicleCompliance(v,today);
 A.equal(JSON.stringify(v),original);A.ok(summary.issues.some(i=>i.kind==='insurance'&&i.code==='dateMissing'));A.ok(summary.issues.some(i=>i.kind==='registration'&&i.code==='documentMissing'));
});
for(const [date,expected,days] of [['2026-10-18','ok',31],['2026-10-17','soon',30],['2026-09-17','soon',0],['2026-09-16','overdue',-1]]) {
 test(`compliance: próg ${days} dni, polisa ${date} => ${expected}`,()=>{
  const v=healthy();v.data.plans[0].dueDate=date;v.data.compliance.insurance.documentDueDate=date;
  const c=C.complianceCheck(v.data,'insurance',today);A.equal(c.severity,expected);A.equal(c.days,days);
 });
}
test('compliance: zachowuje dłuższe istniejące ostrzeżenie 60 dni',()=>{
 const p=plan('insurance','2026-11-06',{warnDays:60});const v=vehicle({plans:[p]});A.ok(C.complianceCheck(v.data,'insurance',today).issues.some(i=>i.code==='deadline'));
});
test('compliance: użytkownik nie skróci ostrzegania polisy do 5 dni',()=>{
 const p=plan('insurance','2026-10-17',{warnDays:5});A.equal(D.planAlert(p,0,today).severity,'soon');A.ok(C.complianceCheck(vehicle({plans:[p]}).data,'insurance',today).issues.some(i=>i.code==='deadline'));
});
test('compliance: otwarcie / ponowne obliczenie nie usuwa ostrzeżenia',()=>{const v=vehicle({plans:[plan()]});A.deepEqual(C.vehicleCompliance(v,today),C.vehicleCompliance(JSON.parse(JSON.stringify(v)),today));});
test('compliance: data ważności w odległej przeszłości nadal widoczna',()=>{const v=vehicle({plans:[plan('insurance','2020-01-01')]});A.equal(C.complianceCheck(v.data,'insurance',today).severity,'overdue');});
test('compliance: alarmy zmieniają się po zmianie dnia bez zmiany rekordów',()=>{const v=healthy();v.data.plans[0].dueDate='2026-10-18';v.data.compliance.insurance.documentDueDate='2026-10-18';A.equal(C.complianceCheck(v.data,'insurance','2026-09-17').severity,'ok');A.equal(C.complianceCheck(v.data,'insurance','2026-09-18').severity,'soon');});
test('compliance: DST nie skraca progu 30 dni',()=>{const p=plan('inspection','2026-04-10');const v=vehicle({plans:[p]});A.equal(C.complianceCheck(v.data,'inspection','2026-03-11').days,30);});
test('compliance: wszystkie zdrowe dane bez alertu',()=>{A.deepEqual(C.vehicleCompliance(healthy(),today).issues,[]);});
test('compliance: sam nowy termin bez nowej polisy nie daje zielonego statusu',()=>{const v=healthy();v.data.plans[0].dueDate='2028-09-17';A.equal(C.complianceCheck(v.data,'insurance',today).severity,'missing');A.ok(C.complianceCheck(v.data,'insurance',today).issues.some(i=>i.code==='documentOutdated'));});
test('compliance: sam upload nie usuwa przeterminowanego terminu',()=>{const v=healthy();v.data.plans[0].dueDate='2026-08-17';v.data.compliance.insurance.documentDueDate='2026-08-17';A.equal(C.complianceCheck(v.data,'insurance',today).severity,'overdue');});
test('compliance: brak daty nigdy nie jest zielony',()=>{const v=vehicle({plans:[plan('inspection',null)]});A.equal(C.complianceCheck(v.data,'inspection',today).severity,'missing');});
test('compliance: nieprawidłowa stara data nie jest zielona',()=>{const v=vehicle({plans:[plan('inspection','2026-02-30')]});A.equal(C.complianceCheck(v.data,'inspection',today).severity,'missing');});
test('compliance: inspekcja nie wymaga skanu protokołu do kompletności',()=>{const v=vehicle({plans:[plan('inspection','2027-01-01')]});A.equal(C.complianceCheck(v.data,'inspection',today).severity,'ok');});
for(const category of ['crane','telehandler']) test(`compliance: ${category} ma oddzielny wymagany UDT`,()=>{const v=vehicle({category});A.equal(C.complianceCheck(v.data,'udt',today).requirement,'required');A.ok(C.vehicleCompliance(v,today).issues.some(i=>i.kind==='udt'));});
test('compliance: Manitou w starym typie machine widoczne w kontroli UDT',()=>{const v=vehicle({category:'machine',make:'Manitou'});A.equal(C.complianceRequirement(v.data,'udt'),'required');});
test('compliance: nieokreślona maszyna wymaga potwierdzenia UDT',()=>{const v=vehicle({category:'machine'});A.equal(C.complianceCheck(v.data,'udt',today).requirement,'unconfirmed');A.ok(C.complianceCheck(v.data,'udt',today).issues.some(i=>i.code==='requirementUnknown'));});
test('compliance: samochód bez planu UDT ma Nie dotyczy',()=>{A.equal(C.complianceCheck(vehicle({category:'car'}).data,'udt',today).severity,'na');});
test('compliance: jawne wymaganie UDT działa też dla ciężarówki',()=>{const v=vehicle({category:'truck',compliance:{udt:{requirement:'required'}}});A.equal(C.complianceCheck(v.data,'udt',today).requirement,'required');});
test('compliance: UDT ustawione jako other z etykietą nie jest zgubione',()=>{const p=plan('other','2026-09-16',{label:'Badanie UDT Manitou'});const v=vehicle({plans:[p]});A.equal(C.complianceCheck(v.data,'udt',today).severity,'overdue');A.equal(C.compliancePlans(v.data,'udt')[0].id,p.id);});
test('compliance: ważny przegląd nie ukryje przeterminowanego UDT',()=>{const v=vehicle({category:'crane',plans:[plan('inspection','2027-01-01'),plan('udt','2026-09-16')]});A.equal(C.complianceCheck(v.data,'inspection',today).severity,'ok');A.equal(C.complianceCheck(v.data,'udt',today).severity,'overdue');});
test('compliance: zarchiwizowane harmonogramy nie wpływają na bieżący termin',()=>{const v=vehicle({plans:[plan('inspection','2025-01-01',{archived:true}),plan('inspection','2027-01-01')]});A.equal(C.complianceCheck(v.data,'inspection',today).severity,'ok');});
test('compliance: archiwum pojazdów zachowane, ale poza alarmami aktywnej floty',()=>{const v=vehicle({archived:true});A.equal(C.fleetCompliance([v],today).length,0);A.deepEqual(C.vehicleCompliance(v,today).issues,[]);});
test('compliance: kilka polis nie chowa najstarszej aktywnej',()=>{const v=vehicle({plans:[plan('insurance','2027-10-17'),plan('insurance','2026-09-16')]});const c=C.complianceCheck(v.data,'insurance',today);A.equal(c.dueDate,'2026-09-16');A.equal(c.severity,'overdue');A.ok(c.issues.some(i=>i.code==='multiplePlans'));});
test('compliance: N/D nie może ukryć istniejącego planu',()=>{const v=vehicle({plans:[plan('udt','2026-09-16')],compliance:{udt:{requirement:'not_required',reason:'bad legacy setting'}}});A.equal(C.complianceCheck(v.data,'udt',today).severity,'overdue');});
test('compliance: tabela porządkuje zaległe pojazdy przed zdrowymi',()=>{const healthyV=healthy();const overdue=vehicle({plans:[plan('insurance','2026-01-01')]});A.equal(C.fleetCompliance([healthyV,overdue],today)[0].vehicle.id,overdue.id);});

test('command: zapis przedłuża wybrany plan, nie dodaje jego kopii',()=>{const v=healthy();const original=JSON.stringify(v);const result=Cmd.prepareComplianceCommand(command(v),v,admin);A.equal(result.data.plans.length,v.data.plans.length);A.equal(result.data.plans[0].id,v.data.plans[0].id);A.equal(JSON.stringify(v),original);});
test('command: zachowuje olej, filtry, kierowcę, przebieg, nieznane pola i istniejące dokumenty innych rodzajów',()=>{
 const v=healthy();v.data.plans.push(plan('oil','2026-12-01',{dueMileage:100000}));v.data.driver='Other Driver';v.data.mileage=98000;v.data.custom={preserve:'all'};
 const r=Cmd.prepareComplianceCommand(command(v,'insurance',{dueDate:'2028-01-01'}),v,admin);
 A.equal(r.data.driver,v.data.driver);A.equal(r.data.mileage,98000);A.deepEqual(r.data.custom,v.data.custom);A.deepEqual(r.data.plans.slice(1),v.data.plans.slice(1));A.deepEqual(r.data.compliance.registration,v.data.compliance.registration);
});
test('command: nie usuwa źródłowych danych przed zmianą polisy',()=>{const v=healthy();const original=structuredClone(v);Cmd.prepareComplianceCommand(command(v),v,admin);A.deepEqual(v,original);});
test('command: pierwszy termin dodawany do istniejącego JSON bez bazy/migracji',()=>{const v=vehicle();const r=Cmd.prepareComplianceCommand(command(v),v,admin);A.equal(r.data.plans.length,1);A.equal(r.data.plans[0].dueDate,'2027-09-17');});
test('command: nowy UDT nie ma wymyślonego rocznego interwału',()=>{const v=vehicle({category:'crane'});const r=Cmd.prepareComplianceCommand(command(v,'udt'),v,admin);A.equal(r.data.plans[0].kind,'udt');A.equal(r.data.plans[0].intervalMonths,null);});
test('command: stary plan UDT/other aktualizowany w miejscu',()=>{const p=plan('other','2026-09-17',{label:'UDT'});const v=vehicle({plans:[p]});const r=Cmd.prepareComplianceCommand(command(v,'udt'),v,admin);A.equal(r.data.plans.length,1);A.equal(r.data.plans[0].id,p.id);A.equal(r.data.plans[0].kind,'other');});
test('command: archiwum i inne pola starego harmonogramu nie znikają',()=>{const p=plan('insurance','2026-09-17',{intervalMonths:12,lastDoneDate:'2025-09-17',custom:'keep',warnDays:60});const v=vehicle({plans:[p]});const r=Cmd.prepareComplianceCommand(command(v),v,admin);A.equal(r.data.plans[0].intervalMonths,12);A.equal(r.data.plans[0].lastDoneDate,'2025-09-17');A.equal(r.data.plans[0].custom,'keep');A.equal(r.data.plans[0].warnDays,60);});
test('command: zapis nowego dokumentu tworzy wpis z autorem w danych i pełnym poprzednim stanem',()=>{const v=healthy();const doc=randomUUID();const r=Cmd.prepareComplianceCommand(command(v,'insurance',{documentIds:[doc],dueDate:'2028-01-01'}),v,admin);A.equal(r.event.kind,'document');A.equal(r.event.data.complianceKind,'insurance');A.equal(r.event.data.before.compliance.insurance.fileIds[0],v.data.compliance.insurance.fileIds[0]);A.equal(r.data.compliance.insurance.updatedBy,'Piotr Mania');A.deepEqual(r.event.data.documentIds,[doc]);});
test('command: odpowiedzialny nie zmienia kierowcy',()=>{const v=vehicle({driver:'Igor'});const r=Cmd.prepareComplianceCommand(command(v),v,admin);A.equal(r.data.driver,'Igor');A.equal(r.data.compliance.responsible,'Piotr Mania');});
test('command: zmiana terminu + nowa polisa usuwa wyłącznie załatwione braki',()=>{const v=healthy();v.data.plans[0].dueDate='2026-08-17';const doc=randomUUID();const r=Cmd.prepareComplianceCommand(command(v,'insurance',{documentIds:[doc]}),v,admin);A.equal(C.complianceCheck(r.data,'insurance',today).severity,'ok');});
test('command: termin nadal w 30-dniowym oknie pozostaje w alarmach po zapisie',()=>{const v=healthy();const r=Cmd.prepareComplianceCommand(command(v,'insurance',{dueDate:'2026-10-17',documentIds:[randomUUID()]}),v,admin);A.equal(C.complianceCheck(r.data,'insurance',today).severity,'soon');});
test('command: sam zapis nowej daty pozostawia Brak dokumentu',()=>{const v=healthy();const r=Cmd.prepareComplianceCommand(command(v),v,admin);A.ok(C.complianceCheck(r.data,'insurance',today).issues.some(i=>i.code==='documentMissing'));});
test('command: ponowne użycie starego skanu przy nowym terminie wymaga potwierdzenia',()=>{const v=healthy();const docs=v.data.compliance.insurance.fileIds;code(()=>Cmd.prepareComplianceCommand(command(v,'insurance',{dueDate:'2028-09-17',documentIds:docs}),v,admin),'COMPLIANCE_CONFIRM_DOCUMENT');});
test('command: wyraźnie potwierdzony dokument może obejmować nowy termin',()=>{const v=healthy();const docs=v.data.compliance.insurance.fileIds;const r=Cmd.prepareComplianceCommand(command(v,'insurance',{dueDate:'2028-09-17',documentIds:docs,confirmReuse:true}),v,admin);A.equal(r.data.compliance.insurance.documentDueDate,'2028-09-17');});
test('command: zachowanie dokumentu przy tym samym terminie jest dozwolone',()=>{const v=healthy();const r=Cmd.prepareComplianceCommand(command(v,'insurance',{documentIds:v.data.compliance.insurance.fileIds}),v,admin);A.deepEqual(r.data.compliance.insurance.fileIds,v.data.compliance.insurance.fileIds);});
test('command: dowód rejestracyjny nie wymaga sztucznej daty ważności',()=>{const v=vehicle();const r=Cmd.prepareComplianceCommand(command(v,'registration',{documentIds:[randomUUID()],dueDate:''}),v,admin);A.equal(r.data.plans.length,0);A.equal(C.complianceCheck(r.data,'registration',today).severity,'ok');});
test('command: Nie dotyczy wymaga uzasadnienia i zostawia audyt',()=>{const v=vehicle({category:'machine'});code(()=>Cmd.prepareComplianceCommand(command(v,'udt',{requirement:'not_required'}),v,admin),'INVALID_TEXT');const r=Cmd.prepareComplianceCommand(command(v,'udt',{requirement:'not_required',reason:'Sprawdzono dokumentację urządzenia'}),v,admin);A.equal(C.complianceCheck(r.data,'udt',today).severity,'na');A.ok(r.event.data.reason);});
test('command: Nie dotyczy nie archiwizuje automatycznie żadnego planu',()=>{const v=vehicle({plans:[plan('insurance')]});const before=JSON.stringify(v);code(()=>Cmd.prepareComplianceCommand(command(v,'insurance',{requirement:'not_required',reason:'test'}),v,admin),'COMPLIANCE_ACTIVE_PLAN');A.equal(JSON.stringify(v),before);});
test('command: próba skopiowania nowego harmonogramu zamiast aktualizacji odrzucona',()=>{const v=vehicle({plans:[plan('insurance')]});code(()=>Cmd.prepareComplianceCommand(command(v,'insurance',{planId:randomUUID()}),v,admin),'COMPLIANCE_SELECT_PLAN');});
test('command: aktualizacja cudzego rodzaju harmonogramu odrzucona',()=>{const p=plan('oil');const v=vehicle({plans:[p]});code(()=>Cmd.prepareComplianceCommand(command(v,'insurance',{planId:p.id}),v,admin),'INVALID_PLAN');});
test('command: stare wersje rekordów wykrywają konflikt',()=>{const v=healthy();const c=command(v);c.expectedVersion--;code(()=>Cmd.prepareComplianceCommand(c,v,admin),'CONFLICT');});
test('command: pracownik bez roli admin nie odnowi polisy',()=>{const v=healthy();code(()=>Cmd.prepareComplianceCommand(command(v),v,{...admin,role:'worker'}),'FORBIDDEN');});
test('command: archiwalnego pojazdu nie można zmienić',()=>{const v=vehicle({archived:true});code(()=>Cmd.prepareComplianceCommand(command(v),v,admin),'ARCHIVED');});
test('command: błędna data odrzucona, pusta data nie załatwia tematu',()=>{const v=healthy();code(()=>Cmd.prepareComplianceCommand(command(v,'insurance',{dueDate:'2026-02-30'}),v,admin),'INVALID_DATE');code(()=>Cmd.prepareComplianceCommand(command(v,'insurance',{dueDate:''}),v,admin),'COMPLIANCE_DATE_REQUIRED');});
test('command: nieznane typy i wymagania są odrzucane',()=>{const v=healthy();code(()=>Cmd.prepareComplianceCommand(command(v,'not-real'),v,admin),'INVALID_COMPLIANCE');code(()=>Cmd.prepareComplianceCommand(command(v,'insurance',{requirement:'dismiss'}),v,admin),'INVALID_COMPLIANCE');});
test('files: prywatny dokument z tego pojazdu dozwolony, również przy istniejącym przypisaniu',()=>{const v=healthy();const doc=readyDocument(v);Cmd.validateComplianceFiles(command(v,'insurance',{documentIds:[doc.id]}),[{...doc,event_id:randomUUID()}]);});
for(const [patch,label] of [[{vehicle_id:randomUUID()},'inny pojazd'],[{state:'pending'},'niegotowy'],[{category:'photo'},'publiczniej dostępne zdjęcie'],[{category:'invoice'},'faktura zamiast dokumentu']]) test(`files: ${label} nie może zastąpić prywatnej polisy`,()=>{const v=healthy();const doc={...readyDocument(v),...patch};code(()=>Cmd.validateComplianceFiles(command(v,'insurance',{documentIds:[doc.id]}),[doc]),'INVALID_FILES');});
test('files: brakujący identyfikator i duplikaty odrzucone',()=>{const v=healthy();const doc=readyDocument(v);code(()=>Cmd.validateComplianceFiles(command(v,'insurance',{documentIds:[doc.id]}),[]),'INVALID_FILES');code(()=>Cmd.validateComplianceFiles(command(v,'insurance',{documentIds:[doc.id,doc.id]}),[doc]),'INVALID_FILES');});
test('files: upload nie może być pominięty w kompletnej liście dokumentów zapisu',()=>{const v=healthy();const c=command(v);c.fileIds=[randomUUID()];code(()=>Cmd.prepareComplianceCommand(c,v,admin),'INVALID_FILES');});
test('files: ponad 20 dokumentów odrzucone',()=>{const v=healthy();code(()=>Cmd.prepareComplianceCommand(command(v,'insurance',{documentIds:Array.from({length:21},()=>randomUUID())}),v,admin),'INVALID_FILES');});
test('UDT dostępne też w zwykłych harmonogramach',()=>{const p=plan('udt');A.equal(D.sanitizePlan(p).kind,'udt');});
test('tłumaczenia nowych funkcji są kompletne w trzech językach',()=>{for(const lang of ['pl','en','de']) for(const key of ['control','attention','registration','insurance','udt','expiry','documentMissing','responsible','keepHistory']) A.notEqual(ct(lang,key),key);for(const lang of ['pl','en','de']) A.notEqual(tr(lang,'error_COMPLIANCE_DATE_REQUIRED'),'error_COMPLIANCE_DATE_REQUIRED');});
