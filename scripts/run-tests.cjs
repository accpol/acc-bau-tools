#!/usr/bin/env node
// Transpile the real pure business engine to a temporary directory; no mocked validator.
// Runtime Zod validation, Next.js rendering, API calls and SQL require integration tests separately.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'acc-fleet-test-'));
try {
  for (const name of ['lib/fleet/logic.ts', 'lib/fleet/defaults.ts', 'lib/fleet/operations.ts', 'lib/legacy.ts']) {
    const text = fs.readFileSync(path.join(root, name), 'utf8');
    const target = path.join(out, name.replace(/\.ts$/, '.js'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText);
  }
  const result = spawnSync(process.execPath, ['--test', path.join(root, 'tests/fleet.test.cjs')], {
    stdio: 'inherit', env: { ...process.env, FLEET_TEST_DIR: out },
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally { fs.rmSync(out, { recursive: true, force: true }); }
