// Build current independent references for advisory tests. No publishing or deployment.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,mkdtemp,cp,rm,stat} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
const workbench=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const families=['martlet','krigsvold'],frameworks=['jekyll','astro','react'];
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=async path=>JSON.parse(await readFile(path,'utf8'));
const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','inherit'],timeout:30000}).trim();

export function checkedJekyllRelease(family,release){
 assert.ok(families.includes(family),'Unknown family');
 assert.equal(release.version,'2.0.0','Use the accepted Jekyll 2.0.0 reference');
 assert.equal(release.published,true);assert.equal(release.sourceZip?.available,true);
 assert.equal(release.repository,`https://github.com/${family}design/jekyll`);
 assert.equal(release.sourceZip.url,`${release.repository}/releases/download/v2.0.0/source.zip`);
 assert.match(release.sourceZip.sha256,/^[a-f0-9]{64}$/);
 assert.match(release.sourceCommit,/^[a-f0-9]{40}$/);
 return release;
}
export async function checkSharedFixtures(directory,framework){
 const content=framework==='jekyll'?'_data':framework==='astro'?'reference/page-archetypes/content':'examples/page-archetypes/content';
 for(const [canonical,name] of [['catalog.json',framework==='jekyll'?'examples.json':'catalog.json'],['dashboards.json','dashboards.json']]){
  assert.deepEqual(await json(join(directory,content,name)),await json(join(workbench,'examples/page-archetypes/content',canonical)),`${framework}: independent ${canonical} differs from shared semantic data`);
 }
}

// Even a checksum-pinned archive is extracted within a fresh directory, without
// symlinks, duplicate/escaping paths or an unbounded expanded payload.
export const extractSourceZip=String.raw`
import pathlib,stat,sys,zipfile
root=pathlib.Path(sys.argv[2]);root.mkdir()
with zipfile.ZipFile(sys.argv[1]) as archive:
 names=set();total=0
 for entry in archive.infolist():
  name=entry.filename.rstrip('/');path=pathlib.PurePosixPath(name)
  if not name or chr(92) in name or path.is_absolute() or str(path)!=name or any(part in ('.','..') for part in path.parts) or name in names:raise ValueError('Unsafe source ZIP path')
  if stat.S_ISLNK(entry.external_attr>>16):raise ValueError('Source ZIP symlink')
  names.add(name);total+=entry.file_size
  if total>128*1024*1024:raise ValueError('Source ZIP exceeds expanded-size bound')
 archive.extractall(root)
`;
function progress(family,framework,operation,details={}){console.log(JSON.stringify({family,framework,operation,...details}));}
export function independentSourceEnvironment(parent){
 // These are local builds of a different repository, not that owner's GitHub
 // event. Keep runtime/proxy settings without forwarding workbench identity.
 return Object.fromEntries(Object.entries(parent).filter(([key])=>!key.startsWith('GITHUB_')));
}
function command(executable,args,{cwd,deadline,env={},foreignSource=false}){
 const remaining=deadline-Date.now();assert.ok(remaining>0,'Independent input build deadline exceeded');
 const timeout=Math.min(480000,remaining);
 return new Promise((resolveRun,reject)=>{
  const grouped=process.platform!=='win32';let timedOut=false,ended=false,result;
  const inherited={...process.env,...env};
  const child=spawn(executable,args,{cwd,env:foreignSource?independentSourceEnvironment(inherited):inherited,stdio:'inherit',detached:grouped});
  const kill=signal=>{try{if(grouped)process.kill(-child.pid,signal);else child.kill(signal);}catch(error){if(error.code!=='ESRCH')throw error;}};
  const finish=()=>{if(ended)return;ended=true;clearTimeout(timer);result?.code===0&&!timedOut?resolveRun():reject(Error(`${executable} failed (${timedOut?'deadline':result?.signal||result?.code}) in ${cwd}`));};
  const timer=setTimeout(()=>{timedOut=true;kill('SIGTERM');setTimeout(()=>{kill('SIGKILL');finish();},2000);},timeout);
  child.on('error',error=>{clearTimeout(timer);ended=true;reject(error);});
  child.on('close',(code,signal)=>{result={code,signal};if(!timedOut)finish();});
 });
}
export async function verifyInputs(output){
 const manifest=await json(join(output,'inputs.json'));
 assert.equal(manifest.schemaVersion,1);assert.equal(manifest.complete,true,'The advisory suite requires all six independent inputs');
 assert.equal(manifest.workbenchCommit,git(workbench,'rev-parse','HEAD'));
 assert.equal(manifest.catalogSha256,digest(await readFile(join(workbench,'examples/page-archetypes/content/catalog.json'))));
 assert.equal(manifest.dashboardSha256,digest(await readFile(join(workbench,'examples/page-archetypes/content/dashboards.json'))));
 assert.equal(manifest.sources.length,6);
 const routes=[...(await json(join(workbench,'examples/page-archetypes/content/catalog.json'))).pages.map(page=>page.id),'scientific-workspace'];
 for(const family of families)for(const framework of frameworks){
  const entries=manifest.sources.filter(source=>source.family===family&&source.framework===framework);assert.equal(entries.length,1);
  assert.match(entries[0].commit,/^[a-f0-9]{40}$/);
  if(framework==='react')assert.equal(entries[0].provenance.sourceCommit,entries[0].commit);
  if(framework==='astro')assert.equal(entries[0].provenance.sourceCommit,entries[0].commit);
  if(framework==='jekyll'){
   const current=checkedJekyllRelease(family,(await json(join(workbench,'docs/distribution.json'))).families[family].packages.Jekyll);
   assert.equal(entries[0].commit,current.sourceCommit);assert.equal(entries[0].archive.sha256,current.sourceZip.sha256);
  }
  for(const prefix of ['','preview'])for(const route of routes)assert.ok((await stat(join(output,framework,family,prefix,'examples',route,'index.html'))).isFile());
 }
 console.log('Verified six source-pinned independent reference inputs; this does not assert the moving refs are still latest.');
 return manifest;
}
async function build(output,{family,framework}={}){
 assert.ok(!family||families.includes(family),'Unknown family');assert.ok(!framework||frameworks.includes(framework),'Unknown framework');
 const selected=families.flatMap(f=>frameworks.map(k=>({family:f,framework:k}))).filter(x=>(!family||x.family===family)&&(!framework||x.framework===framework));
 const distribution=await json(join(workbench,'docs/distribution.json'));
 const deadline=Date.now()+18*60000;
 // Resolve public accepted refs once. Later ref movement does not relabel the
 // source snapshot that this particular advisory run actually exercised.
 const sources=selected.map(source=>{
  const {family,framework}=source;
  if(framework==='jekyll'){
   const release=checkedJekyllRelease(family,distribution.families[family].packages.Jekyll);
   return {...source,repository:release.repository,ref:'v1.1.0',commit:release.sourceCommit,archive:release.sourceZip};
  }
  const repository=`https://github.com/${family}design/${framework}`;
  progress(family,framework,'resolve-main');const result=git(workbench,'ls-remote','--exit-code',repository+'.git','refs/heads/main').split(/\s+/)[0];
  assert.match(result,/^[a-f0-9]{40}$/);return {...source,repository,ref:'main',commit:result,resolvedAt:new Date().toISOString()};
 });
 await mkdir(dirname(output),{recursive:true});await mkdir(output); // Never replace earlier evidence.
 const temporary=await mkdtemp(join(tmpdir(),'independent-reference-inputs-'));
 const manifest={schemaVersion:1,complete:sources.length===6,workbenchCommit:git(workbench,'rev-parse','HEAD'),catalogSha256:digest(await readFile(join(workbench,'examples/page-archetypes/content/catalog.json'))),dashboardSha256:digest(await readFile(join(workbench,'examples/page-archetypes/content/dashboards.json'))),sources:[]};
 try{
  for(const source of sources){
   const {family,framework}=source,directory=join(temporary,framework+'-'+family),destination=join(output,framework,family);
   progress(family,framework,'fetch-source',{ref:source.ref,commit:source.commit});
   if(framework==='jekyll'){
    const archive=join(temporary,family+'-source.zip');
    await command('curl',['--fail','--location','--silent','--show-error','--proto','=https','--proto-redir','=https','--connect-timeout','15','--max-time','60','--max-filesize','33554432','--retry','1','--output',archive,source.archive.url],{cwd:temporary,deadline});
    assert.equal(digest(await readFile(archive)),source.archive.sha256,'Accepted Jekyll source ZIP checksum');
    await command('python3',['-c',extractSourceZip,archive,directory],{cwd:temporary,deadline});
   }else{
    await mkdir(directory);git(directory,'init','--quiet');git(directory,'remote','add','origin',source.repository+'.git');
    await command('git',['fetch','--depth=1','origin',source.commit],{cwd:directory,deadline});git(directory,'checkout','--quiet','--detach','FETCH_HEAD');assert.equal(git(directory,'rev-parse','HEAD'),source.commit);
   }
   await checkSharedFixtures(directory,framework);
   const run=(exe,args,env={})=>command(exe,args,{cwd:directory,deadline,env,foreignSource:true});
   progress(family,framework,'install-locked-dependencies');
   if(framework==='jekyll'){
    await run('bundle',['config','set','--local','path','vendor/bundle']);await run('bundle',['install'],{BUNDLE_FROZEN:'true'});
    await mkdir(destination,{recursive:true});
    for(const base of ['','/preview']){
     progress(family,framework,'native-build',{base:base||'/'});
     await run('python3',['nightjar/build.py','--destination',base?join(destination,'preview'):destination,'--baseurl',base]);
    }
   }else{
    await run('npm',['ci','--ignore-scripts',...(framework==='astro'?['--legacy-peer-deps']:[]),'--no-audit','--no-fund','--fetch-retries=0','--fetch-timeout=20000']);
    if(framework==='astro')await run('npm',['ci','--prefix','reference','--no-audit','--no-fund']);
    else await run('npm',['run','build:package']);
    for(const base of ['','/preview']){
     progress(family,framework,'native-build',{base:base||'/'});
     if(framework==='astro')await run('npm',['run','build','--prefix','reference'],{ASTRO_TELEMETRY_DISABLED:'1',NIGHTJAR_BASE:base?base+'/':'/'});
     else await run('npm',['run','build:reference'],{NIGHTJAR_BASE:base?base+'/':'/'});
     const built=framework==='astro'?join(directory,'reference/dist'):join(directory,'examples/react-catalog/dist',family);
     const target=base?join(destination,'preview'):destination;
     await mkdir(dirname(target),{recursive:true});await cp(built,target,{recursive:true});
    }
    // Git checkout above establishes source identity; ordinary framework builds
    // no longer emit the retired deployment-provenance wrapper files.
    source.provenance={sourceCommit:source.commit,packageVersion:(await json(join(directory,'package.json'))).version};
   }
   manifest.sources.push(source);progress(family,framework,'complete',{commit:source.commit});await rm(directory,{recursive:true,force:true});
  }
  await writeFile(join(output,'inputs.json'),JSON.stringify(manifest,null,2)+'\n');
  if(manifest.complete)await verifyInputs(output);
 }catch(error){await rm(output,{recursive:true,force:true});throw error;}
 finally{await rm(temporary,{recursive:true,force:true});}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),option=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
 if(option('--verify'))await verifyInputs(resolve(option('--verify')));
 else{
  assert.ok(option('--output'),'Supply a new --output directory');
  await build(resolve(option('--output')),{family:option('--family'),framework:option('--framework')});
 }
}
