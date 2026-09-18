// Real route handler; database/framework are deterministic mocks (NOT a live integration test).
const test=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),crypto=require('node:crypto');
const D=require('../lib/fleet/domain.ts'),C=require('../lib/fleet/compliance-command.ts');
const source=fs.readFileSync(path.join(__dirname,'../app/api/fleet/[...path]/route.ts'),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
function setup({role='admin',badFile=false}={}) {
 const v={id:crypto.randomUUID(),version:1,data:{...D.emptyVehicle(),plate:'API TEST',make:'Test',model:'Van',driver:'Piotr Mania'}};
 const f={id:crypto.randomUUID(),vehicle_id:badFile?crypto.randomUUID():v.id,category:'document',state:'ready',event_id:null,created_by:'Piotr Mania'};
 const input={commandId:crypto.randomUUID(),vehicleId:v.id,expectedVersion:1,type:'compliance_save',payload:{kind:'insurance',requirement:'required',planId:crypto.randomUUID(),dueDate:'2027-09-17',documentIds:[f.id]},fileIds:[f.id]};
 const writes=[],tables=[];
 const client={from(table){tables.push(table);let data=table==='acc_fleet_files'?[f]:[];const q={select(){return q},in(key,values){data=data.filter(item=>values.includes(item[key]));return q},eq(key,value){data=data.filter(item=>item[key]===value);return q},limit(){return q},maybeSingle:async()=>({data:null,error:null}),then(resolve){resolve({data,error:null})}};return q;},rpc:async(name,args)=>{writes.push({name,args});return{error:null};}};
 const member={id:crypto.randomUUID(),name:'Piotr Mania',role,active:true,auth_version:1};
 const server={db:()=>client,body:async()=>input,session:async()=>member,commandHash:()=>crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex'),checkDb:e=>{if(e)throw Error('DB mock error')},getVehicle:async()=>v,rows:async()=>[],canView(){},adminOnly:m=>D.assert(m.role==='admin','FORBIDDEN','FORBIDDEN',403),getDetail:async()=>({vehicle:{...v,data:writes[0]?.args.p_vehicle_data||v.data},events:[],files:[f]}),EVENT_COLUMNS:'',FILE_COLUMNS:''};
 const m={exports:{}};
 vm.runInNewContext(js,{exports:m.exports,module:m,console:{error(){}},Buffer,Response,Date,require:name=>{
  if(name==='next/server')return{NextResponse:{json:(body,options={})=>new Response(JSON.stringify(body),{status:options.status||200,headers:{'Content-Type':'application/json',...options.headers}})}};
  if(name==='node:crypto')return crypto;
  if(name==='@/lib/fleet/domain')return D;
  if(name==='@/lib/fleet/compliance-command')return C;
  if(name==='@/lib/fleet/server')return server;
  throw Error('Unexpected import '+name);
 }});
 return{handler:m.exports,input,v,f,writes,tables};
}
test('API compliance: zapis używa dotychczasowej jednej transakcji i nie dotyka starych tabel',async()=>{const s=setup();const response=await s.handler.POST({}, {params:Promise.resolve({path:['commands']})});A.equal(response.status,200);A.equal(s.writes.length,1);A.equal(s.writes[0].name,'acc_fleet_apply_command');A.equal(s.writes[0].args.p_kind,'document');A.deepEqual(JSON.parse(JSON.stringify(s.writes[0].args.p_file_ids)),[s.f.id]);A.ok(s.tables.every(table=>table.startsWith('acc_fleet_')));A.equal(s.writes[0].args.p_vehicle_data.compliance.insurance.documentDueDate,'2027-09-17');});
test('API compliance: uprawnienia worker nie pozwalają na zapis nawet ze znajomością endpointu',async()=>{const s=setup({role:'worker'});s.input.fileIds=[];s.input.payload.documentIds=[];const response=await s.handler.POST({}, {params:Promise.resolve({path:['commands']})});A.equal(response.status,403);A.equal(s.writes.length,0);});
test('API compliance: załącznik obcego pojazdu odrzucony przed transakcją',async()=>{const s=setup({badFile:true});const response=await s.handler.POST({}, {params:Promise.resolve({path:['commands']})});A.equal(response.status,400);A.equal(s.writes.length,0);});
test('API compliance: istniejący powiązany dokument można wskazać bez przenoszenia historycznego przypisania',async()=>{const s=setup();s.f.event_id=crypto.randomUUID();s.input.fileIds=[];const response=await s.handler.POST({}, {params:Promise.resolve({path:['commands']})});A.equal(response.status,200);A.equal(s.writes[0].args.p_file_ids.length,0);A.equal(s.writes[0].args.p_event_data.documentIds[0],s.f.id);});
test('API compliance: zła wersja nie wykonuje zapisu',async()=>{const s=setup();s.input.expectedVersion=0;const response=await s.handler.POST({}, {params:Promise.resolve({path:['commands']})});A.equal(response.status,409);A.equal(s.writes.length,0);});
