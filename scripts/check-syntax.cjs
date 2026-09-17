#!/usr/bin/env node
// This is a syntax check, NOT a substitute for `npm run typecheck` / `npm run build`.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(ts|tsx|mts)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) files.push(file);
  }
}
walk(root);
let failed = 0;
for (const file of files) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  for (const d of source.parseDiagnostics) {
    failed++;
    const at = source.getLineAndCharacterOfPosition(d.start || 0);
    console.error(`${path.relative(root, file)}:${at.line + 1}:${at.character + 1} ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
  }
}
console.log(`Syntax: ${files.length} TS/TSX files; ${failed} parse errors.`);
process.exitCode = failed ? 1 : 0;
