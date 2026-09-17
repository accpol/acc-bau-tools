// Real cryptographic/domain code; mocked framework cookie jar and database responses.
// These tests do not run Next.js, Supabase, SQL migrations, or network calls.
const test=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),{randomUUID}=require('node:crypto');
const D=require('../lib/fleet/domain.ts');const filename=path.resolve(__dirname,'../lib/fleet/server.ts');
const js=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const jar=new Map();let options;const env={FLEET_SESSION_SECRET:'test-secret-with-at-least-thirty-two-chars-12345',NODE_ENV:'production'};
const moduleObject={exports:{}};const context={exports:moduleObject.exports,module:moduleObject,Buffer,console,process:{env},Date,URL,require:p=>{
 if(p==='server-only')return{};
 if(p==='next/headers')return{cookies:async()=>({set:(k,v,o)=>{jar.set(k,v);options=o;},get:k=>jar.has(k)?{value:jar.get(k)}:undefined})};
 if(p==='@supabase/supabase-js')return{createClient:()=>{throw Error('NETWORK FORBIDDEN IN TEST');}};
 if(p==='./domain')return D;
 if(p.startsWith('node:'))return require(p);
 throw Error('Unexpected module: '+p);
}};
vm.runInNewContext(js,context,{filename});const S=moduleObject.exports;
const member={id:randomUUID(),name:'Test Admin',role:'admin',active:true,auth_version:2};
function dbMember(value){return{from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:value,error:null})})})})};}
const rejectCode=(fn,code)=>A.rejects(fn,e=>e.code===code);
test('scrypt: właściwy PIN działa, błędny nie',async()=>{const hash=await S.hashPin('Test-password-777');A.ok(hash.startsWith('scrypt$'));A.ok(!hash.includes('Test-password'));A.equal(await S.verifyPin('Test-password-777',hash),true);A.equal(await S.verifyPin('Wrong-password',hash),false);});
test('każdy hash ma inną sól',async()=>A.notEqual(await S.hashPin('Test-password-777'),await S.hashPin('Test-password-777')));
test('za krótki PIN odrzucony',async()=>await rejectCode(()=>S.hashPin('1234'),'PIN_LENGTH'));
test('uszkodzony hash nie powoduje przyznania dostępu',async()=>A.equal(await S.verifyPin('abcdefghi','bad-hash'),false));
test('sesja używa HttpOnly, Secure, SameSite strict',async()=>{await S.setSession(member);A.equal(options.httpOnly,true);A.equal(options.secure,true);A.equal(options.sameSite,'strict');A.equal(options.path,'/api/fleet');});
test('poprawna podpisana sesja odczytuje rolę z bazy',async()=>{await S.setSession(member);const r=await S.session(dbMember({...member,role:'worker'}));A.equal(r.role,'worker');});
test('zmiana wersji konta unieważnia poprzednią sesję',async()=>{await S.setSession(member);await rejectCode(()=>S.session(dbMember({...member,auth_version:3})),'LOGIN_REQUIRED');});
test('wyłączone konto nie może użyć starej sesji',async()=>{await S.setSession(member);await rejectCode(()=>S.session(dbMember({...member,active:false})),'LOGIN_REQUIRED');});
test('podrobiony podpis sesji jest odrzucony',async()=>{await S.setSession(member);jar.set(S.COOKIE,jar.get(S.COOKIE)+'.tamper'); // An extra separator must also be rejected.
 // Current token parser verifies payload.signature; test tampering with signature itself.
 await rejectCode(()=>S.session(dbMember(member)),'LOGIN_REQUIRED');
 const raw=jar.get(S.COOKIE).split('.');jar.set(S.COOKIE,raw[0]+'.BAD'+raw[1]);await rejectCode(()=>S.session(dbMember(member)),'LOGIN_REQUIRED');});
test('wylogowanie wygasza ciasteczko',async()=>{await S.clearSession();A.equal(options.maxAge,0);await rejectCode(()=>S.session(dbMember(member)),'LOGIN_REQUIRED');});
test('safeMember nie zwraca hasha PIN',()=>A.equal(S.safeMember({...member,pin_hash:'secret'}).pin_hash,undefined));
test('hash polecenia niezależny od kolejności kluczy JSON',()=>A.equal(S.commandHash({a:1,b:{c:3,d:4}}),S.commandHash({b:{d:4,c:3},a:1})));
test('inna treść polecenia daje inny hash idempotencji',()=>A.notEqual(S.commandHash({a:1}),S.commandHash({a:2})));
test('pracownik nie widzi cudzego pojazdu',()=>{const v={id:randomUUID(),data:{...D.emptyVehicle(),driver:'Inny'}};A.throws(()=>S.canView({...member,role:'worker'},v),e=>e.code==='FORBIDDEN');});
test('rola worker nie otrzymuje pól finansowych pojazdu',()=>{const v={id:randomUUID(),data:{...D.emptyVehicle(),purchasePrice:'25000',policyNumber:'SECRET'}};const r=S.publicVehicle(v,{...member,role:'worker'});A.equal(r.data.purchasePrice,'');A.equal(r.data.policyNumber,'');A.equal(v.data.purchasePrice,'25000');});
test('cross-origin zapis jest odrzucony',()=>{const req={headers:new Headers({'origin':'https://evil.invalid','host':'tools.invalid','content-type':'application/json'})};A.throws(()=>S.checkOrigin(req),e=>e.code==='BAD_ORIGIN');});
test('same-origin JSON dopuszczony przez bramkę CSRF',()=>{const req={headers:new Headers({'origin':'https://tools.invalid','host':'tools.invalid','content-type':'application/json'})};S.checkOrigin(req);});
