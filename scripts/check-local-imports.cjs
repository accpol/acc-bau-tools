const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function audit(root) {
  const configPath = path.join(root, 'tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const options = {...parsed.options, noEmit: true};
  const program = ts.createProgram(parsed.fileNames, options);
  const checker = program.getTypeChecker();
  const issues = []; let count = 0; let files = 0;
  for (const sf of program.getSourceFiles()) {
    if (sf.isDeclarationFile || !sf.fileName.startsWith(root + path.sep)) continue;
    files++;
    function visit(node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const spec = node.moduleSpecifier.text;
        if (!spec.startsWith('.') && !spec.startsWith('@/')) return;
        if (/\.(css|scss|sass|less|svg|png|jpe?g|webp)$/.test(spec)) return;
        const resolved = ts.resolveModuleName(spec, sf.fileName, options, ts.sys).resolvedModule;
        if (!resolved) {issues.push(`${path.relative(root,sf.fileName)}: missing local module ${spec}`); return;}
        const target = program.getSourceFile(resolved.resolvedFileName);
        if (!target || !/\.tsx?$/.test(target.fileName)) return;
        const symbol = checker.getSymbolAtLocation(target);
        const exports = new Set(symbol ? checker.getExportsOfModule(symbol).map(s=>s.name) : []);
        const wanted=[];
        if(ts.isImportDeclaration(node)) {
          const c=node.importClause;
          if(c?.name) wanted.push('default');
          if(c?.namedBindings && ts.isNamedImports(c.namedBindings))
            for(const el of c.namedBindings.elements) wanted.push((el.propertyName||el.name).text);
        } else if(node.exportClause && ts.isNamedExports(node.exportClause)) {
          for(const el of node.exportClause.elements) wanted.push((el.propertyName||el.name).text);
        }
        for(const name of wanted) {count++;if(!exports.has(name))issues.push(`${path.relative(root,sf.fileName)}: '${name}' is not exported by ${spec}`);}
      }
      ts.forEachChild(node,visit);
    }
    visit(sf);
  }
  return {files, count, issues};
}
module.exports={audit};
if(require.main===module){const r=audit(path.resolve(process.argv[2]||process.cwd()));console.log(JSON.stringify(r,null,2));if(r.issues.length)process.exitCode=1;}
