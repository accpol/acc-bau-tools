// Lightweight component/interaction harness: real local TSX, no React DOM, browser or network.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),vm=require('node:vm');
const {randomUUID}=require('node:crypto');
const root=path.resolve(__dirname,'../..');
function createHarness(overrides={}) {
 const moduleCache=new Map(),frames=new Map();let current=null;
 const jsx=(type,props,key)=>({type,props:{...props,...(key!==undefined?{key}:{})}});
 function slot(init){const at=current.index++;if(!current.hooks.has(at))current.hooks.set(at,typeof init==='function'?init():init);return[at,current.hooks];}
 const React={
  useState(init){const [at,hooks]=slot(init);return[hooks.get(at),value=>hooks.set(at,typeof value==='function'?value(hooks.get(at)):value)];},
  useRef(value){const [at,hooks]=slot(()=>({current:value}));return hooks.get(at);},
  useMemo(fn){return fn();},useCallback(fn){return fn;},useEffect(){},
  useId(){const [at]=slot(()=>null);return 'test-id-'+current.path.replace(/\W/g,'-')+'-'+at;},
  createElement:(type,props,...children)=>jsx(type,{...props,children}),Fragment:Symbol.for('test.fragment'),
 };
 class ApiError extends Error{constructor(code,status=400){super(code);this.code=code;this.status=status;}}
 const mockClient={ApiError,api:async()=>{throw new Error('API not mocked for this test');},downloadText:()=>{},preparePhoto:async f=>f,uploadFile:async()=>{throw Error('NETWORK FORBIDDEN');},...overrides};
 function load(filename) {
  filename=path.resolve(filename);if(moduleCache.has(filename))return moduleCache.get(filename).exports;
  const mod={exports:{}};moduleCache.set(filename,mod);
  const js=ts.transpileModule(fs.readFileSync(filename,'utf8'),{fileName:filename,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const localRequire=name=>{
   if(name==='react')return {...React,__esModule:true,default:React};
   if(name==='react/jsx-runtime')return{jsx,jsxs:jsx,Fragment:React.Fragment};
   if(name==='lucide-react')return new Proxy({},{get:(_,key)=>props=>jsx('svg',{'data-icon':key,...props})});
   if(name==='@/lib/fleet/client')return mockClient;
   if(name.startsWith('@/')||name.startsWith('.')){
    const base=name.startsWith('@/')?path.join(root,name.slice(2)):path.resolve(path.dirname(filename),name);
    const found=[base,base+'.ts',base+'.tsx',base+'.cjs'].find(file=>fs.existsSync(file)&&fs.statSync(file).isFile());
    if(!found)throw Error('Missing '+name+' from '+filename);
    if(found.endsWith('.cjs'))return require(found);
    return load(found);
   }
   throw Error('Unexpected external module: '+name);
  };
  const context={module:mod,exports:mod.exports,require:localRequire,console,Date,Intl,URL,Buffer,Set,Map,Array,JSON,Math,Promise,Number,String,RegExp,structuredClone,
   crypto:{randomUUID},setTimeout,clearTimeout,setInterval,clearInterval,window:{confirm:()=>true},document:{},process:{env:{}}};
  vm.runInNewContext(js,context,{filename});return mod.exports;
 }
 function expand(value,where='root'){
  if(value==null||value===false||value===true)return null;
  if(Array.isArray(value))return value.map((child,i)=>expand(child,where+'.'+(child?.props?.key??i)));
  if(typeof value!=='object')return String(value);
  if(value.type===React.Fragment)return expand(value.props.children,where+'.fragment');
  if(typeof value.type==='function'){
   const previous=current;let hooks=frames.get(where);if(!hooks){hooks=new Map();frames.set(where,hooks);}current={path:where,index:0,hooks};
   let result;try{result=value.type(value.props);}finally{current=previous;}
   return expand(result,where+'.component');
  }
  return{tag:value.type,props:value.props,children:expand(value.props?.children,where+'.children')};
 }
 function render(name,props,file='components/fleet/CompliancePanel.tsx') {const mod=load(path.join(root,file));return expand(jsx(mod[name],props),file+':'+name);}
 return {render,ApiError};
}
function text(tree){if(tree==null)return'';if(Array.isArray(tree))return tree.map(text).join(' ');if(typeof tree!=='object')return String(tree);return text(tree.children);}
function nodes(tree,predicate=()=>true){if(tree==null||typeof tree!=='object')return[];if(Array.isArray(tree))return tree.flatMap(node=>nodes(node,predicate));return [...(predicate(tree)?[tree]:[]),...nodes(tree.children,predicate)];}
function labeled(tree,label,tag='input') {const match=nodes(tree,node=>node.tag==='label'&&text(node).trim().startsWith(label))[0];return match?nodes(match,node=>node.tag===tag)[0]:null;}
module.exports={createHarness,text,nodes,labeled};
