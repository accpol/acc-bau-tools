const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { audit } = require('../scripts/check-local-imports.cjs');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('Wszystkie lokalne importy TS/TSX wskazują na istniejące eksporty (także po połączeniu paczek)', () => {
  const result = audit(root);
  assert.deepEqual(result.issues, [], result.issues.join('\n'));
});

for (const route of ['app/api/fleet/route.ts', 'app/api/fleet/files/route.ts']) {
  for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
    test(`${route}: stary ${method} jawnie odrzucony, bez zapisu danych`, async () => {
      const handlers = require(path.join(root, route));
      const result = await handlers[method]();
      assert.equal(result.status, 410);
      assert.equal((await result.json()).error, 'CLIENT_UPDATE_REQUIRED');
      assert.ok(result.headers.get('cache-control').includes('no-store'));
    });
  }
  test(`${route}: bez importu starych funkcji i bez klienta bazy`, () => {
    const source = read(route).replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(source, /\bimport\s|\brequire\s*\(|\bfetch\s*\(|createClient|\.from\s*\(|\.rpc\s*\(/);
  });
}

test('Pozostałość FleetApp korzysta z aktualnego formularza, nie z logowania e-mail', () => {
  const source = read('components/fleet/FleetApp.tsx');
  assert.match(source, /import FleetPage from "\.\/FleetPage"/);
  assert.match(source, /<FleetPage lang="pl"/);
  assert.doesNotMatch(source, /fleetClient|type="email"|signInWithPassword/);
});

test('Stary plik ui korzysta z aktualnych komponentów i nie importuje PendingFile', () => {
  const source = read('components/fleet/ui.tsx').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(source, /export \* from "\.\/common"/);
  assert.doesNotMatch(source, /PendingFile|fleetClient/);
});

test('Aktualny klient nie wywołuje zastąpionych starych adresów API', () => {
  const client = read('lib/fleet/client.ts');
  assert.ok(client.includes('`/api/fleet/${path}`'));
  assert.ok(client.includes('"uploads"'));
  const common = read('components/fleet/common.tsx');
  assert.ok(common.includes('files/${'));
  assert.ok(common.includes('/view'));
  const page = read('components/fleet/FleetPage.tsx');
  assert.ok(page.includes('"login"'));
  assert.ok(page.includes('"session"'));
});

test('Bieżąca obsługa Pojazdów nadal wymaga serwerowego uwierzytelnienia', () => {
  const api = read('app/api/fleet/[...path]/route.ts');
  assert.ok(api.includes('await session(client)'));
  assert.ok(api.includes('adminOnly(member)'));
  assert.ok(api.includes('await login(req, client, input)'));
});
