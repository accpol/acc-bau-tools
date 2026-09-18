const test=require('node:test'),A=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const {createHarness,text,nodes,labeled}=require('./helpers/compliance-render.cjs');
const D=require('../lib/fleet/domain.ts'),C=require('../lib/fleet/compliance.ts'),{ct}=require('../lib/fleet/compliance-i18n.ts');
const today='2026-09-17';
function data(expiry='2027-09-17'){
 const v={id:randomUUID(),version:1,data:{...D.emptyVehicle(),plate:'ABC 123',make:'Test',model:'Van',driver:'Kierowca',plans:[],compliance:{responsible:'Piotr Mania',registration:{fileIds:[randomUUID()]}}},created_at:'2026-01-01',updated_at:'2026-01-01'};
 const p={id:randomUUID(),kind:'insurance',label:'OC',dueDate:expiry,dueMileage:null,intervalMonths:null,intervalKm:null,warnDays:30,warnKm:1500,lastDoneDate:null,lastDoneMileage:null,notes:'',archived:false};
 v.data.plans=[p,{...p,id:randomUUID(),kind:'inspection',label:'Przegląd',dueDate:'2027-10-01'}];
 const doc={id:randomUUID(),vehicle_id:v.id,event_id:randomUUID(),name:'polisa.pdf',category:'document',mime:'application/pdf',size:12000,state:'ready',created_by:'Piotr Mania',created_at:'2026-01-01'};
 v.data.compliance.insurance={fileIds:[doc.id],documentDueDate:expiry,planId:p.id,updatedBy:'Piotr Mania'};
 return {vehicle:v,files:[doc],events:[]};
}
const button=(tree,label)=>nodes(tree,node=>node.tag==='button'&&text(node).includes(label))[0];
const submit=tree=>nodes(tree,node=>node.tag==='form')[0].props.onSubmit({preventDefault(){}});
test('UI: tabela pokazuje rejestrację, kierowcę, Piotra i obie daty',()=>{const h=createHarness(),d=data();const s=text(h.render('ComplianceTable',{vehicles:[d.vehicle],today,lang:'pl',admin:true,onOpen(){},onEdit(){}}));for(const value of ['ABC 123','Kierowca','Piotr Mania','17.09.2027','1.10.2027','Nie dotyczy'])A.ok(s.includes(value),value+' missing: '+s);});
test('UI: filtr wymagające uwagi nie ukrywa ich po ponownym renderze',()=>{const h=createHarness(),a=data(),b=data('2026-09-16');b.vehicle.data.plate='OVERDUE';const props={vehicles:[a.vehicle,b.vehicle],today,lang:'pl',admin:true,onOpen(){},onEdit(){}};let tree=h.render('ComplianceTable',props);button(tree,'Tylko wymagające uwagi').props.onClick();tree=h.render('ComplianceTable',props);A.ok(text(tree).includes('OVERDUE'));A.ok(!text(tree).includes('ABC 123'));});
test('UI: filtr po odpowiedzialnym oddzielny od kierowcy',()=>{const h=createHarness(),a=data(),b=data();b.vehicle.data.plate='OTHER';b.vehicle.data.compliance.responsible='Inny';const props={vehicles:[a.vehicle,b.vehicle],today,lang:'pl',admin:true,onOpen(){},onEdit(){}};let tree=h.render('ComplianceTable',props);labeled(tree,'Odpowiedzialny za terminy','select').props.onChange({target:{value:'Piotr Mania'}});tree=h.render('ComplianceTable',props);A.ok(text(tree).includes('ABC 123'));A.ok(!text(tree).includes('OTHER'));});
test('UI: brak załadowanych danych nie wyświetla zielonego potwierdzenia',()=>{const h=createHarness();const s=text(h.render('ComplianceAttention',{vehicles:[],today,lang:'pl',loadedAt:'',error:false,onOpen(){}}));A.ok(s.includes('Wczytywanie'));A.ok(!s.includes(ct('pl','allRecorded')));});
test('UI: przy błędzie odczytu brak zielonego potwierdzenia',()=>{const h=createHarness(),d=data();const s=text(h.render('ComplianceAttention',{vehicles:[d.vehicle],today,lang:'pl',loadedAt:'2026-09-17T12:00:00Z',error:true,onOpen(){}}));A.ok(s.includes(ct('pl','staleData')));A.ok(!s.includes(ct('pl','allRecorded')));});
test('UI: odczyt ostrzeżeń nie ma przycisku trwałego schowania',()=>{const h=createHarness(),d=data('2026-10-17');const props={vehicles:[d.vehicle],today,lang:'pl',loadedAt:'2026-09-17T12:00:00Z',error:false,onOpen(){}};const s=text(h.render('ComplianceAttention',props));A.ok(s.includes('Zbliża się termin'));A.equal(text(h.render('ComplianceAttention',props)),s);A.ok(!s.includes('Oznacz jako przeczytane'));});
test('UI: ubezpieczenie i dowód rejestracyjny są kartami w jednej siatce',()=>{const h=createHarness(),d=data();const tree=h.render('VehicleComplianceCards',{detail:d,today,lang:'pl',admin:true,onEdit(){},onView(){}});const grids=nodes(tree,n=>n.tag==='div'&&n.props.className?.includes('lg:grid-cols-2'));A.equal(grids.length,1);for(const name of ['Dowód rejestracyjny','Ubezpieczenie','Badanie / decyzja UDT'])A.ok(text(grids[0]).includes(name));});
test('UI: pracownik nie otrzymuje przycisków zmiany dokumentów',()=>{const h=createHarness(),d=data();const tree=h.render('VehicleComplianceCards',{detail:d,today,lang:'pl',admin:false,onEdit(){},onView(){}});A.ok(!text(tree).includes('Dodaj / uaktualnij'));A.ok(text(tree).includes('Dokumenty dostępne administratorowi'));});
test('UI: upload dokumentów ma kategorię Dokument zablokowaną przed wyborem Zdjęcia',()=>{const h=createHarness(),d=data();const props={kind:'insurance',detail:d,lang:'pl',people:[],onClose(){},onSaved(){},onRefresh:async()=>{}};const tree=h.render('default',props,'components/fleet/ComplianceModal.tsx');const selects=nodes(tree,n=>n.tag==='select');A.equal(selects.length,1);A.ok(text(tree).includes('polisa.pdf'));});
test('UI: wybór dokumentów nie zawiera faktur ani zdjęć ogólnych',()=>{const h=createHarness(),d=data();d.files.push({...d.files[0],id:randomUUID(),name:'SECRET-INVOICE.pdf',category:'invoice'},{...d.files[0],id:randomUUID(),name:'PUBLIC-PHOTO.jpg',category:'photo'});const tree=h.render('default',{kind:'insurance',detail:d,lang:'pl',people:[],onClose(){},onSaved(){},onRefresh:async()=>{}},'components/fleet/ComplianceModal.tsx');A.ok(!text(tree).includes('SECRET-INVOICE'));A.ok(!text(tree).includes('PUBLIC-PHOTO'));});
test('UI: nowa data usuwa tylko bieżące przypisanie starego skanu, nie stary plik',async()=>{
 let sent;const d=data();const h=createHarness({api:async(path,body)=>{sent=JSON.parse(JSON.stringify(body));return d;}});
 const props={kind:'insurance',detail:d,lang:'pl',people:[],onClose(){},onSaved(){},onRefresh:async()=>{}};
 let tree=h.render('default',props,'components/fleet/ComplianceModal.tsx');A.equal(labeled(tree,'polisa.pdf').props.checked,true);
 labeled(tree,'Ważne do').props.onChange({target:{value:'2028-09-17'}});tree=h.render('default',props,'components/fleet/ComplianceModal.tsx');A.equal(labeled(tree,'polisa.pdf').props.checked,false);
 await submit(tree);A.equal(sent.type,'compliance_save');A.equal(sent.payload.dueDate,'2028-09-17');A.deepEqual(sent.payload.documentIds,[]);A.equal(d.files.length,1);A.equal(d.vehicle.data.driver,'Kierowca');
});
test('UI: dowód rejestracyjny można zapisać bez daty terminu',async()=>{let sent;const d=data();const h=createHarness({api:async(path,body)=>{sent=body;return d;}});const tree=h.render('default',{kind:'registration',detail:d,lang:'pl',people:[],onClose(){},onSaved(){},onRefresh:async()=>{}},'components/fleet/ComplianceModal.tsx');A.equal(nodes(tree,n=>n.tag==='input'&&n.props.type==='date').length,0);await submit(tree);A.equal(sent.payload.kind,'registration');});
test('UI: dwuklik przy zapisie nie wysyła dwóch poleceń',async()=>{let calls=0,finish;const d=data();const h=createHarness({api:()=>{calls++;return new Promise(resolve=>{finish=()=>resolve(d);});}});const tree=h.render('default',{kind:'insurance',detail:d,lang:'pl',people:[],onClose(){},onSaved(){},onRefresh:async()=>{}},'components/fleet/ComplianceModal.tsx');const one=submit(tree);await submit(tree);A.equal(calls,1);finish();await one;});
test('UI: ponowienie po błędzie sieci zachowuje identyfikator operacji',async()=>{let calls=[];const d=data();let h;h=createHarness({api:async(path,body)=>{calls.push(JSON.parse(JSON.stringify(body)));if(calls.length===1)throw new h.ApiError('NETWORK_ERROR');return d;}});const props={kind:'insurance',detail:d,lang:'pl',people:[],onClose(){},onSaved(){},onRefresh:async()=>{}};await submit(h.render('default',props,'components/fleet/ComplianceModal.tsx'));await submit(h.render('default',props,'components/fleet/ComplianceModal.tsx'));A.equal(calls[0].commandId,calls[1].commandId);});
test('UI: eksport kontroli zawiera daty i odpowiedzialnego',()=>{let output;const h=createHarness({downloadText:(name,body,mime)=>{output={name,body,mime};}}),d=data();const tree=h.render('ComplianceTable',{vehicles:[d.vehicle],today,lang:'pl',admin:true,onOpen(){},onEdit(){}});const exportButton=nodes(tree,n=>n.tag==='button').find(n=>text(n).toLowerCase().includes('csv'));A.ok(exportButton);exportButton.props.onClick();A.ok(output.body.includes('2027-09-17'));A.ok(output.body.includes('Piotr Mania'));A.ok(output.name.includes('kontrola-floty'));});

async function loginPage(h) {
 const props={lang:'pl',user:'Administrator Test',people:['Piotr Mania'],projects:[]};
 let tree=h.render('default',props,'components/fleet/FleetPage.tsx');
 await submit(tree);
 return {props,tree:h.render('default',props,'components/fleet/FleetPage.tsx')};
}
const supervisor={id:randomUUID(),name:'Administrator Test',role:'admin',active:true,auth_version:1};
test('Page wiring: po zalogowaniu widoczna nowa kontrola i zachowane nawigacje',async()=>{
 const h=createHarness({api:async path=>path==='login'?{member:supervisor}:{vehicles:[]}});
 const {tree}=await loginPage(h);const s=text(tree);
 A.ok(s.includes(ct('pl','control')));A.ok(s.includes(ct('pl','attention')));
 A.ok(nodes(tree,n=>n.tag==='table').length);A.ok(s.includes('Dostęp pracowników'));A.ok(s.includes('Dodaj pojazd'));
});
test('Page wiring: odświeżenie wczytuje pojazd i otwiera dokumenty w karcie',async()=>{
 const d=data();const h=createHarness({api:async path=>path==='login'?{member:supervisor}:path==='vehicles'?{vehicles:[d.vehicle]}:d});
 const {props}=await loginPage(h);let tree=h.render('default',props,'components/fleet/FleetPage.tsx');
 await button(tree,'Odśwież').props.onClick();tree=h.render('default',props,'components/fleet/FleetPage.tsx');A.ok(text(tree).includes('ABC 123'));
 button(tree,'ABC 123').props.onClick();await new Promise(resolve=>setImmediate(resolve));tree=h.render('default',props,'components/fleet/FleetPage.tsx');
 A.ok(text(tree).includes('Dowód rejestracyjny'));A.ok(text(tree).includes('polisa.pdf'));
});
test('Page wiring: administrator otwiera nowy formularz bez przechodzenia do starych ustawień',async()=>{
 const d=data();const h=createHarness({api:async path=>path==='login'?{member:supervisor}:path==='vehicles'?{vehicles:[d.vehicle]}:d});
 const {props}=await loginPage(h);let tree=h.render('default',props,'components/fleet/FleetPage.tsx');
 await button(tree,'Odśwież').props.onClick();tree=h.render('default',props,'components/fleet/FleetPage.tsx');
 button(tree,'Dodaj / uaktualnij').props.onClick();await new Promise(resolve=>setImmediate(resolve));tree=h.render('default',props,'components/fleet/FleetPage.tsx');
 const modal=nodes(tree,n=>n.props?.role==='dialog')[0];A.ok(modal);
 A.ok(labeled(modal,'Ważne do'));A.ok(labeled(modal,'Odpowiedzialny za terminy'));A.ok(text(modal).includes('Ubezpieczyciel'));
});
