// Parses/transpiles source and strictly type-checks dependency-free domain modules.
// This is intentionally NOT a replacement for `npm run build`.
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const root = path.resolve(__dirname, '..'); let count = 0, problems = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (entry.name.startsWith('.') || ['node_modules', 'docs', 'supabase'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.tsx?$/.test(file) && !file.endsWith('.d.ts')) {
      count++;
      const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), {fileName:file, reportDiagnostics:true,
        compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}});
      problems.push(...(result.diagnostics||[]).map(d=>`${file}: ${ts.flattenDiagnosticMessageText(d.messageText,'\n')}`));
    }
  }
}
walk(root);
const files=['lib/fleet/types.ts','lib/fleet/domain.ts','lib/fleet/i18n.ts','lib/fleet/print.ts','lib/legacy-safety.ts','lib/fleet/compliance.ts','lib/fleet/compliance-command.ts','lib/fleet/compliance-i18n.ts'].map(p=>path.join(root,p));
const program=ts.createProgram(files,{noEmit:true,strict:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,moduleResolution:ts.ModuleResolutionKind.Node10,lib:['lib.es2022.d.ts','lib.dom.d.ts'],types:[]});
problems.push(...ts.getPreEmitDiagnostics(program).map(d=>`${d.file?.fileName||''}: ${ts.flattenDiagnosticMessageText(d.messageText,'\n')}`));
if(problems.length){console.error(problems.join('\n'));process.exitCode=1;}
else console.log(`OK: składnia ${count} plików TS/TSX; strict TypeScript: ${files.length} modułów logiki bez zewnętrznych zależności.`);
