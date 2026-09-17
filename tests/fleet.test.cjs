// Compatibility for the retired v0.2.0 engine. Current tests remain separate.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const base = process.env.FLEET_TEST_DIR || path.resolve(__dirname, '..');
const ext = process.env.FLEET_TEST_DIR ? '.js' : '.ts';
const legacyPaths = ['lib/fleet/logic', 'lib/fleet/defaults', 'lib/fleet/operations', 'lib/legacy'];
const legacyPresent = legacyPaths.map(name => fs.existsSync(path.join(base, name + ext)));
if (legacyPresent.every(present => !present)) {
  test('Archiwalny silnik v0.2.0: brak w czystej aktualnej paczce', {skip: 'Brak starych plików; bieżący silnik jest testowany w domain.test.cjs.'}, () => {});
} else {
  assert.ok(legacyPresent.every(Boolean), 'Niekompletne stare pliki testowe v0.2.0');
  const logic = require(path.join(base, 'lib/fleet/logic' + ext));
  const { emptyDetails, emptyPlan, defaultPlans } = require(path.join(base, 'lib/fleet/defaults' + ext));
  const { applyCommand, FleetError, canOperate, publicEvent, publicVehicle } = require(path.join(base, 'lib/fleet/operations' + ext));
  const legacy = require(path.join(base, 'lib/legacy' + ext));
const TODAY = '2026-09-17';
const admin = { userId: randomUUID(), displayName: 'Administrator testowy', role: 'admin', active: true };
const worker = { userId: randomUUID(), displayName: 'Kierowca testowy', role: 'worker', active: true };
const other = { ...worker, userId: randomUUID(), displayName: 'Inny pracownik' };
const members = [admin, worker, other];
function car(patch = {}) {
  return { ...emptyDetails(), registration: 'TEST-01', fleetNumber: 'F001', make: 'Test', model: 'Van',
    id: randomUUID(), version: 1, createdAt: '2026-09-01T08:00:00Z', updatedAt: '2026-09-01T08:00:00Z',
    status: 'available', mileage: 100000, mileageDate: '2026-09-15', hours: null, hoursDate: null,
    driverId: null, driverName: '', plans: [], defects: [], ...patch };
}
function plan(patch = {}) { return { ...emptyPlan(), title: 'Olej', kind: 'oil', ...patch }; }
function event(patch = {}) {
  return { id: randomUUID(), vehicleId: randomUUID(), kind: 'mileage', occurredOn: '2026-09-15', createdAt: '2026-09-15T10:00:00Z', actorId: admin.userId, actorName: admin.displayName,
    mileage: 100000, hours: null, title: 'Wpis', note: '', workshop: '', parts: '', cost: null, currency: 'PLN', invoiceNumber: '', fileIds: [], planIds: [], fromDriver: '', toDriver: '', litres: null, fuelLevel: null, checks: [], referenceId: null, voidedAt: null, voidReason: '', ...patch };
}
function cmd(v, action, patch = {}) { return { vehicleId: v.id, expectedVersion: v.version, operationId: randomUUID(), action, ...patch }; }
function meterCmd(v, patch = {}) { return cmd(v, 'mileage', { occurredOn: TODAY, mileage: 100100, hours: null, note: '', correction: false, ...patch }); }
function serviceCmd(v, patch = {}) { return cmd(v, 'service', { kind: 'service', occurredOn: TODAY, mileage: 100100, hours: null, title: 'Wymiana oleju', note: 'Wykonano wymianę oleju i filtra.', workshop: 'Warsztat test', parts: 'Olej', cost: 123.45, currency: 'PLN', invoiceNumber: 'TEST/1', fileIds: [], completions: [], inspectionResult: null, litres: null, ...patch }); }
function assignCmd(v, patch = {}) { return cmd(v, 'assignment', { occurredOn: TODAY, mileage: 100100, hours: null, driverId: worker.userId, driverName: '', site: 'Budowa', location: 'Magazyn', fuelLevel: 80, checks: ['Klucze'], note: '', fileIds: [], ...patch }); }
function run(c, v, who = admin, events = []) { return applyCommand(c, who, v, events, members, TODAY); }
function rejects(c, v, who = admin, events = [], status) { assert.throws(() => run(c, v, who, events), (e) => e instanceof FleetError && (!status || e.status === status)); }

test('Berlin date: UTC evening is next day in summer', () => assert.equal(logic.fleetToday(new Date('2026-09-16T22:30:00Z')), TODAY));
test('Berlin date: winter offset', () => assert.equal(logic.fleetToday(new Date('2026-01-01T23:30:00Z')), '2026-01-02'));
test('January 31 plus month clamps February', () => assert.equal(logic.addCalendarMonths('2026-01-31', 1), '2026-02-28'));
test('Leap year February', () => assert.equal(logic.addCalendarMonths('2024-01-31', 1), '2024-02-29'));
test('Leap day plus year', () => assert.equal(logic.addCalendarMonths('2024-02-29', 12), '2025-02-28'));
test('Date days unaffected by DST', () => assert.equal(logic.dateDays('2026-03-30', '2026-03-28'), 2));
test('Blank schedule means missing, not OK', () => assert.equal(logic.planDue(plan(), car(), TODAY).level, 'missing'));
test('Date reached today is due', () => assert.equal(logic.planDue(plan({ dueDate: TODAY }), car(), TODAY).level, 'due'));
test('Kilometres reached override distant date', () => assert.equal(logic.planDue(plan({ dueDate: '2027-12-01', dueKm: 100000 }), car(), TODAY).level, 'due'));
test('Hours reached override date and kilometres', () => assert.equal(logic.planDue(plan({ dueDate: '2027-12-01', dueKm: 150000, dueHours: 250 }), car({ hours: 251 }), TODAY).level, 'due'));
test('Warning distance', () => assert.equal(logic.planDue(plan({ dueKm: 101000, warnKm: 1000 }), car(), TODAY).level, 'soon'));
test('Healthy schedule', () => assert.equal(logic.planDue(plan({ dueDate: '2027-12-01', dueKm: 150000 }), car(), TODAY).level, 'ok'));
test('Missing mileage never treated as zero', () => assert.equal(logic.planDue(plan({ dueKm: 150000 }), car({ mileage: null }), TODAY).level, 'missing'));
test('Unknown mileage flagged even with distant date', () => assert.equal(logic.planDue(plan({ dueDate: '2027-12-01', dueKm: 150000 }), car({ mileage: null }), TODAY).level, 'missing'));
test('Due date still red with unknown mileage', () => { const a = logic.planDue(plan({ dueDate: TODAY, dueKm: 150000 }), car({ mileage: null }), TODAY); assert.equal(a.level, 'due'); assert.equal(a.missingMeter, true); });
test('Disabled task has explicit disabled state', () => assert.equal(logic.planDue(plan({ disabled: true, disabledReason: 'Nie dotyczy', dueDate: '2020-01-01' }), car(), TODAY).level, 'disabled'));
test('Old mileage is stale', () => assert.equal(logic.staleMeters(car({ mileageDate: '2026-09-01' }), TODAY), true));
test('Recent mileage is not stale', () => assert.equal(logic.staleMeters(car(), TODAY), false));
test('No meter means no stale alarm', () => assert.equal(logic.staleMeters(car({ meterMode: 'none', mileageDate: null }), TODAY), false));
test('Both meters need dates', () => assert.equal(logic.staleMeters(car({ meterMode: 'both', hoursDate: null }), TODAY), true));
test('No plans yields configuration warning', () => assert.equal(logic.vehicleAlerts(car(), TODAY).missing, 1));
test('Default plans are independent, no invented intervals', () => { const all = defaultPlans(); assert.equal(all.length, 6); assert.equal(new Set(all.map(p => p.id)).size, 6); assert.ok(all.every(p => p.dueDate === null && p.everyKm === null)); });
test('Cost totals keep currencies separate', () => assert.deepEqual(logic.costTotals([event({ cost: 10, currency: 'PLN' }), event({ cost: 20, currency: 'EUR' })]), { PLN: 10, EUR: 20 }));
test('Money uses integer cents and excludes voided', () => assert.deepEqual(logic.costTotals([event({ cost: 0.1 }), event({ cost: 0.2 }), event({ cost: 99, voidedAt: TODAY })]), { PLN: 0.3 }));
test('CSV protects Excel formula injection', () => assert.equal(logic.csvCell(' =HYPERLINK("x")'), '"\' =HYPERLINK(""x"")"'));
test('CSV escapes quotes and keeps newlines inside quoted cells', () => assert.equal(logic.csvCell('A"B\nC'), '"A""B\nC"'));
test('CSV UTF-8 BOM for Excel', () => assert.ok(logic.csv([['Łódź']]).startsWith('\uFEFF')));
test('Recognizes PDF magic', () => assert.equal(logic.sniffMime(Buffer.from('%PDF-1.7')), 'application/pdf'));
test('Rejects HTML pretending to be PDF', () => assert.equal(logic.sniffMime(Buffer.from('<html>test')), null));
test('Recognizes PNG magic', () => assert.equal(logic.sniffMime(Uint8Array.from([137,80,78,71,13,10,26,10])), 'image/png'));
test('Recognizes JPEG magic', () => assert.equal(logic.sniffMime(Uint8Array.from([255,216,255,224])), 'image/jpeg'));
test('Recognizes WebP magic', () => assert.equal(logic.sniffMime(Buffer.from('RIFFxxxxWEBP')), 'image/webp'));

test('Only administrator can create car', () => { const v = car(); rejects(cmd(v, 'create', { expectedVersion: 0, details: { ...emptyDetails(), make: 'Test', model: 'Van', registration: 'ABC' }, mileage: 0, hours: null, occurredOn: TODAY }), null, worker, [], 403); });
test('Create keeps 0 distinct from unknown', () => { const v = car(); const c = cmd(v, 'create', { expectedVersion: 0, details: { ...emptyDetails(), make: 'Test', model: 'Van', registration: 'ABC' }, mileage: 0, hours: null, occurredOn: TODAY }); const r = run(c, null); assert.equal(r.data.mileage, 0); assert.equal(r.event.kind, 'created'); });
test('Electric vehicle does not start with combustion filter schedules', () => { const v = car(); const r = run(cmd(v, 'create', { expectedVersion: 0, details: { ...emptyDetails(), make: 'Test', model: 'EV', registration: 'EV', fuel: 'electric' }, mileage: null, hours: null, occurredOn: TODAY }), null); assert.ok(r.data.plans.every(p => !['oil','filter'].includes(p.kind))); });
test('Inactive account rejected', () => { const v = car(); rejects(meterCmd(v), v, { ...admin, active: false }, [], 403); });
test('Assigned worker can add mileage', () => { const v = car({ driverId: worker.userId }); assert.equal(run(meterCmd(v), v, worker).data.mileage, 100100); });
test('Unassigned worker cannot write', () => { const v = car({ driverId: worker.userId }); rejects(meterCmd(v), v, other, [], 403); });
test('Worker cannot service even assigned', () => { const v = car({ driverId: worker.userId }); rejects(serviceCmd(v), v, worker, [], 403); });
test('Worker cannot change role or assignment through command', () => { const v = car({ driverId: worker.userId }); rejects(assignCmd(v), v, worker, [], 403); });
test('Worker cannot correct counter', () => { const v = car({ driverId: worker.userId }); rejects(meterCmd(v, { correction: true, note: 'Wymiana licznika' }), v, worker, [], 403); });
test('Expected version mismatch returns conflict', () => { const v = car(); rejects(meterCmd(v, { expectedVersion: 0 }), v, admin, [], 409); });
test('Archived car rejects ordinary edits', () => { const v = car({ status: 'archived' }); rejects(meterCmd(v), v); });
test('Admin can restore archived car', () => { const v = car({ status: 'archived' }); assert.equal(run(cmd(v, 'status', { status: 'available', reason: 'Przywrócenie' }), v).event.kind, 'restored'); });
test('Mileage cannot decrease without correction', () => { const v = car(); rejects(meterCmd(v, { mileage: 99999 }), v); });
test('Future activity rejected', () => { const v = car(); rejects(meterCmd(v, { occurredOn: '2026-09-18' }), v); });
test('Back-dated mileage does not replace current counter', () => { const v = car(); const r = run(meterCmd(v, { occurredOn: '2026-09-10', mileage: 90000 }), v); assert.equal(r.data.mileage, 100000); assert.equal(r.event.mileage, 90000); });
test('Back-dated reading above current rejected', () => { const v = car(); rejects(meterCmd(v, { occurredOn: '2026-09-10', mileage: 100100 }), v); });
test('Counter chronology considers earlier readings', () => { const v = car(); rejects(meterCmd(v, { occurredOn: '2026-09-10', mileage: 90000 }), v, admin, [event({ occurredOn: '2026-09-09', mileage: 95000 })]); });
test('Counter chronology considers later readings', () => { const v = car(); rejects(meterCmd(v, { occurredOn: '2026-09-10', mileage: 96000 }), v, admin, [event({ occurredOn: '2026-09-11', mileage: 95000 })]); });
test('Admin correction requires reason', () => { const v = car(); rejects(meterCmd(v, { mileage: 0, correction: true, note: '' }), v); });
test('Admin correction may reset counter today', () => { const v = car(); const r = run(meterCmd(v, { mileage: 0, correction: true, note: 'Wymiana licznika' }), v); assert.equal(r.data.mileage, 0); assert.equal(r.event.kind, 'meter_correction'); });
test('Historical reading before correction is rejected', () => { const v = car({ mileage: 200, mileageDate: TODAY }); rejects(meterCmd(v, { occurredOn: '2026-09-16', mileage: 100 }), v, admin, [event({ kind: 'meter_correction', occurredOn: TODAY, mileage: 0 })]); });
test('New segment ignores pre-correction high mileage', () => { const v = car({ mileage: 100, mileageDate: TODAY }); const events = [event({ createdAt: '2026-09-10T10:00:00Z', occurredOn: '2026-09-10', mileage: 100000 }), event({ kind: 'meter_correction', createdAt: '2026-09-17T09:00:00Z', occurredOn: TODAY, mileage: 0 })]; assert.equal(run(meterCmd(v, { mileage: 200 }), v, admin, events).data.mileage, 200); });
test('Wrong meter type rejected', () => { const v = car({ meterMode: 'hours', mileage: null, mileageDate: null, hours: 100, hoursDate: TODAY }); rejects(meterCmd(v), v); });
test('Hours update allows tenths', () => { const v = car({ meterMode: 'hours', mileage: null, mileageDate: null, hours: 100, hoursDate: TODAY }); assert.equal(run(meterCmd(v, { mileage: null, hours: 100.1 }), v).data.hours, 100.1); });

test('Oil service updates only selected oil plan', () => { const oil = plan({ everyKm: 15000, everyMonths: 12 }); const hu = plan({ title: 'HU', kind: 'inspection', dueDate: '2026-10-01' }); const v = car({ plans: [oil, hu] }); const r = run(serviceCmd(v, { completions: [{ planId: oil.id }] }), v); assert.equal(r.data.plans[0].dueKm, 115100); assert.equal(r.data.plans[0].dueDate, '2027-09-17'); assert.deepEqual(r.data.plans[1], hu); });
test('Unscheduled service never changes any task', () => { const p = plan({ dueKm: 120000 }); const v = car({ plans: [p] }); assert.deepEqual(run(serviceCmd(v), v).data.plans, [p]); });
test('Multiple tasks update independently in one visit', () => { const p1 = plan({ everyKm: 15000 }); const p2 = plan({ title: 'Filtr powietrza', everyKm: 30000 }); const v = car({ plans: [p1,p2] }); const r = run(serviceCmd(v, { completions: [{ planId:p1.id },{ planId:p2.id }] }), v); assert.equal(r.data.plans[0].dueKm,115100); assert.equal(r.data.plans[1].dueKm,130100); });
test('Manual next deadline overrides recurrence', () => { const p = plan({ everyKm: 15000 }); const v = car({ plans: [p] }); assert.equal(run(serviceCmd(v, { completions: [{ planId:p.id,nextKm:125000 }] }), v).data.plans[0].dueKm,125000); });
test('No repeat does not silently reuse completed deadline', () => { const p = plan({ dueDate: TODAY }); const v = car({ plans:[p] }); const r=run(serviceCmd(v,{completions:[{planId:p.id}]}),v); assert.equal(r.data.plans[0].dueDate,null); assert.equal(logic.planDue(r.data.plans[0],r.data,TODAY).level,'missing'); });
test('Cannot complete unknown task', () => { const v=car(); rejects(serviceCmd(v,{completions:[{planId:randomUUID()}]}),v); });
test('Cannot complete disabled task', () => { const p=plan({disabled:true,disabledReason:'Nie dotyczy'}); const v=car({plans:[p]}); rejects(serviceCmd(v,{completions:[{planId:p.id}]}),v); });
test('Km recurrence requires service mileage', () => { const p=plan({everyKm:15000}); const v=car({plans:[p]}); rejects(serviceCmd(v,{mileage:null,completions:[{planId:p.id}]}),v); });
test('Older service cannot close later completed task', () => { const p=plan({lastDate:TODAY}); const v=car({plans:[p]}); rejects(serviceCmd(v,{occurredOn:'2026-09-16',mileage:100000,completions:[{planId:p.id}]}),v); });
test('Next mileage must be greater than performed mileage', () => { const p=plan();const v=car({plans:[p]}); rejects(serviceCmd(v,{completions:[{planId:p.id,nextKm:50000}]}),v); });
test('Fuel event cannot complete technical inspection', () => { const p=plan();const v=car({plans:[p]}); rejects(serviceCmd(v,{kind:'fuel',completions:[{planId:p.id}]}),v); });
test('Duplicate task IDs rejected', () => { const p=plan();const v=car(); rejects(cmd(v,'plans',{plans:[p,p]}),v); });
test('Incompatible meter task rejected', () => { const v=car(); rejects(cmd(v,'plans',{plans:[plan({dueHours:200})]}),v); });
test('Meter mode cannot change silently', () => { const v=car(); rejects(cmd(v,'edit',{details:{...emptyDetails(),registration:'ABC',make:'Test',model:'Van',meterMode:'hours'}}),v); });

test('Assignment gets driver name from verified membership', () => {const v=car();const r=run(assignCmd(v,{driverName:'Podrobiona nazwa'}),v);assert.equal(r.data.driverName,worker.displayName);assert.equal(r.data.status,'in_use');});
test('Unknown driver account rejected', () => {const v=car();rejects(assignCmd(v,{driverId:randomUUID()}),v);});
test('Assignment requires actual counter', () => {const v=car();rejects(assignCmd(v,{mileage:null}),v);});
test('Assignment records previous and next users', () => {const v=car({driverName:'Poprzedni',driverId:other.userId});const r=run(assignCmd(v),v);assert.equal(r.event.fromDriver,'Poprzedni');assert.equal(r.event.toDriver,worker.displayName);});
test('External driver can be assigned without granting write account', () => {const v=car();const r=run(assignCmd(v,{driverId:null,driverName:'Kierowca zewnętrzny'}),v);assert.equal(r.data.driverId,null);assert.equal(r.data.driverName,'Kierowca zewnętrzny');assert.equal(canOperate(worker,{...v,...r.data}),false);});
test('Critical defect takes vehicle out of service', () => {const v=car({driverId:worker.userId});const r=run(cmd(v,'defect',{note:'Uszkodzone hamulce',severity:'critical',fileIds:[]}),v,worker);assert.equal(r.data.status,'out_of_service');assert.equal(r.data.defects.length,1);});
test('Critical defect blocks assignment', () => {const v=car({defects:[{id:randomUUID(),severity:'critical',resolvedAt:null}]});rejects(assignCmd(v),v);});
test('Disabled car can be returned', () => {const v=car({status:'out_of_service',driverId:worker.userId,driverName:worker.displayName});const r=run(assignCmd(v,{driverId:null,driverName:''}),v);assert.equal(r.data.driverName,'');assert.equal(r.data.status,'out_of_service');});
test('Cannot enable car with unresolved critical defect', () => {const v=car({status:'out_of_service',defects:[{id:randomUUID(),severity:'critical',resolvedAt:null}]});rejects(cmd(v,'status',{status:'available',reason:'Uruchomienie'}),v);});
test('Resolving defect does not automatically enable car', () => {const d={id:randomUUID(),severity:'critical',resolvedAt:null};const v=car({status:'out_of_service',defects:[d]});const r=run(cmd(v,'resolve',{defectId:d.id,note:'Naprawiono i sprawdzono',fileIds:[]}),v);assert.equal(r.data.status,'out_of_service');assert.ok(r.data.defects[0].resolvedAt);});
test('Archive requires vehicle return', () => {const v=car({driverName:worker.displayName});rejects(cmd(v,'status',{status:'archived',reason:'Sprzedaż auta'}),v);});
test('Cannot void assignment history', () => {const e=event({kind:'assignment'});const v=car();rejects(cmd(v,'void',{eventId:e.id,reason:'Błąd danych'}),v,admin,[e]);});
test('Void preserves counter and produces audit record', () => {const e=event({kind:'service',cost:100});const v=car();const r=run(cmd(v,'void',{eventId:e.id,reason:'Podwójny wpis'}),v,admin,[e]);assert.equal(r.voidId,e.id);assert.equal(r.data.mileage,v.mileage);assert.equal(r.event.referenceId,e.id);});
test('Already voided event rejected', () => {const e=event({kind:'service',voidedAt:TODAY});const v=car();rejects(cmd(v,'void',{eventId:e.id,reason:'Podwójny wpis'}),v,admin,[e]);});
test('Worker response strips financial fields and invoice links', () => {const invoice=randomUUID(),photo=randomUUID();const e=event({kind:'inspection',note:'Faktura dane',cost:100,workshop:'Secret',parts:'Secret',invoiceNumber:'FV1',fileIds:[invoice,photo],requestHash:'secret'});const safe=publicEvent(e,worker,new Set([photo]));assert.equal(safe.cost,null);assert.equal(safe.invoiceNumber,'');assert.equal(safe.workshop,'');assert.equal(safe.parts,'');assert.notEqual(safe.note,e.note);assert.deepEqual(safe.fileIds,[photo]);assert.equal(safe.requestHash,undefined);});
test('Worker cannot see admin vehicle notes', () => assert.equal(publicVehicle(car({notes:'Dane finansowe'}),worker).notes,''));
test('Admin retains financial information but never receives hash', () => {const e=event({cost:100,requestHash:'private'});const safe=publicEvent(e,admin,new Set());assert.equal(safe.cost,100);assert.equal(safe.requestHash,undefined);});
test('Domain engine never mutates the input car', () => {const v=car();const before=structuredClone(v);run(meterCmd(v),v);assert.deepEqual(v,before);});
test('Same command has stable operation hash', () => {const v=car();const c=meterCmd(v);assert.equal(run(c,v).event.requestHash,run(c,v).event.requestHash);});

test('Legacy settings change keeps PPE and future fields', () => {const old={people:['A'],ppeRecords:[{id:1}],future:{x:2}};const r=legacy.mergeSettingsChanges(old,{people:['B']},old,['people']);assert.deepEqual(r,{...old,people:['B']});});
test('Legacy PPE update preserves newer unrelated employee list', () => {const current={people:['New'],ppeRecords:[1]};const r=legacy.mergeSettingsChanges(current,{ppeRecords:[1,2]},{people:['Old'],ppeRecords:[1]},['ppeRecords']);assert.deepEqual(r,{people:['New'],ppeRecords:[1,2]});});
test('Legacy stale PPE write rejected instead of overwriting', () => assert.throws(()=>legacy.mergeSettingsChanges({ppeRecords:[1,2]},{ppeRecords:[3]},{ppeRecords:[1]},['ppeRecords'])));
test('Legacy comparison ignores JSON object key order', () => assert.equal(legacy.canonical({a:1,b:2}),legacy.canonical({b:2,a:1})));
test('Missing old PPE array equals empty array', () => assert.deepEqual(legacy.mergeSettingsChanges({}, {ppeRecords:[1]}, {ppeRecords:[]}, ['ppeRecords']),{ppeRecords:[1]}));
test('Missing next inspection date is NOT a service', () => assert.equal(legacy.legacyService({type:'DGUV/VDE',doneDate:TODAY,nextDate:''}),false));
test('Explicit repair is a service', () => assert.equal(legacy.legacyService({type:'Naprawa',doneDate:TODAY}),true));
test('Current DGUV supersedes old one but not calibration', () => {const a={type:'DGUV/VDE',doneDate:'2025-01-01',nextDate:'2026-01-01'};const b={type:'DGUV/VDE',doneDate:'2026-01-01',nextDate:'2027-01-01'};const c={type:'Kalibracja',doneDate:'2025-01-01',nextDate:'2026-01-01'};assert.deepEqual(legacy.latestLegacyInspections([b,a,c]),[b,c]);});
test('Legacy no-inspection marker does not suppress real inspections', () => {const a={type:'Nie wymaga przeglądu'};const b={type:'DGUV/VDE',nextDate:'2020-01-01'};assert.deepEqual(legacy.latestLegacyInspections([a,b]),[b]);});
test('Negative inspection recognized', () => assert.equal(legacy.negativeLegacyInspection({result:'NOK'}),true));
test('OK inspection is not negative', () => assert.equal(legacy.negativeLegacyInspection({result:'OK'}),false));
test('Legacy print scripts restricted before interpolated content', () => {const s=legacy.legacyPrintDocument('<html><head><title>x</title></head><body><script>bad()</script></body></html>');assert.ok(s.indexOf("script-src 'none'")<s.indexOf('<title>'));});

test('Technical inspection requires explicit result', () => {const v=car();rejects(serviceCmd(v,{kind:'inspection'}),v);});
test('Failed inspection cannot extend schedule', () => {const p=plan();const v=car({plans:[p]});rejects(serviceCmd(v,{kind:'inspection',inspectionResult:'failed',completions:[{planId:p.id}]}),v);});
test('Failed inspection creates critical defect and blocks vehicle', () => {const v=car();const r=run(serviceCmd(v,{kind:'inspection',inspectionResult:'failed'}),v);assert.equal(r.data.status,'out_of_service');assert.equal(r.data.defects[0].severity,'critical');assert.equal(r.event.inspectionResult,'failed');});
test('Passing inspection alone never resolves outstanding critical defects', () => {const v=car({status:'out_of_service',defects:[{id:randomUUID(),severity:'critical',resolvedAt:null}]});const r=run(serviceCmd(v,{kind:'inspection',inspectionResult:'passed'}),v);assert.equal(r.data.status,'out_of_service');assert.equal(r.data.defects[0].resolvedAt,null);});

}
