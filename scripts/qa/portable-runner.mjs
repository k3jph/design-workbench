#!/usr/bin/env node
// Experimental offline, pinned-input route and static-content evidence runner.
// Build commands are trusted local code; this process is not a network sandbox.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {lstat, mkdtemp, mkdir, readFile, readdir, realpath, rm, writeFile} from 'node:fs/promises';
import {devNull, tmpdir} from 'node:os';
import {dirname, isAbsolute, join, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium, firefox, webkit} from '@playwright/test';

const here=dirname(fileURLToPath(import.meta.url));
const defaultMatrix=JSON.parse(readFileSync(join(here,'portable-matrix.json'),'utf8'));
const supportedCapabilities=['catalog','static-route-smoke'];
const dashboardIds=new Set(['dashboard-analytics','dashboard-administration','dashboard-operations']);
const fullCommit=/^[0-9a-f]{40}$/;
function run(program,args,opts={}) {
 const result=spawnSync(program,args,{encoding:'utf8',maxBuffer:128*1024*1024,...opts});
 if(result.error) throw result.error;
 if(result.status!==0) throw Error(`${program} ${args.join(' ')} failed (${result.status}):\n${result.stderr||result.stdout}`);
 return result.stdout;
}
// These are strictly local object reads, never Git network operations. Ignore
// inherited Git selectors/config and replacement refs so a reported object ID
// cannot silently resolve to different content.
function gitEnv(extra={}){
 const env={...process.env};for(const key of Object.keys(env))if(key.startsWith('GIT_'))delete env[key];
 return {...env,GIT_NO_REPLACE_OBJECTS:'1',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:devNull,GIT_ATTR_NOSYSTEM:'1',...extra};
}
function git(repo,args){return run('git',['-C',repo,...args],{env:gitEnv()});}
export function pinned(repo,commit){
 assert.ok(fullCommit.test(commit),'Every input needs a full 40-character lowercase commit ID; moving refs are not accepted');
 const actual=git(repo,['rev-parse','--verify',`${commit}^{commit}`]).trim();
 assert.equal(actual,commit,`Missing or non-commit pin in ${repo}`);
 const entries=git(repo,['ls-tree','-r',commit]).split('\n');
 assert.ok(!entries.some(entry=>/^(120000|160000) /.test(entry)),`${repo}@${commit}: symlinks and submodules are not supported; snapshot all required sources explicitly`);
}
export function validateManifest(manifest){
 assert.equal(manifest.version,1,'manifest version must be 1');
 assert.ok(manifest.repositories && typeof manifest.repositories==='object' && !Array.isArray(manifest.repositories),'repositories required');
 const keys=Object.keys(manifest.repositories);assert.ok(keys.length,'at least one repository required');
 for(const key of keys){assert.match(key,/^[a-z][a-z0-9_-]*$/);const repo=manifest.repositories[key];assert.equal(typeof repo.path,'string');assert.ok(fullCommit.test(repo.commit||''),`${key}: full commit required`)}
 assert.ok(manifest.fixture && keys.includes(manifest.fixture.repository),'fixture repository required');
 const matrix=manifest.matrix||defaultMatrix;
 assert.ok(matrix && typeof matrix==='object' && !Array.isArray(matrix),'matrix required');
 for(const field of ['families','frameworks']){
  const values=matrix[field];assert.ok(Array.isArray(values)&&values.length&&new Set(values).size===values.length&&values.every(value=>typeof value==='string'&&/^[a-z][a-z0-9-]*$/.test(value)),`matrix ${field} must be unique nonempty identifiers`);
 }
 for(const key of ['catalog','dashboards'])assert.match(manifest.fixture[key]||'',/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9_./-]+$/,`${key}: use a repository-relative path`);
 assert.ok(Array.isArray(manifest.targets)&&manifest.targets.length,'targets required');
 const seen=new Set();for(const target of manifest.targets){
  assert.ok(matrix.families.includes(target.family)&&matrix.frameworks.includes(target.framework),'unknown family or framework');const key=`${target.family}/${target.framework}`;assert.ok(!seen.has(key),`duplicate target ${key}`);seen.add(key);
  if(manifest.matrix)assert.equal(target.adapter?.framework,target.framework,`${key}: adapter framework mismatch`);
  else if(target.adapter!==undefined)assert.equal(target.adapter?.framework,target.framework,`${key}: adapter framework mismatch`);
  assert.ok(supportedCapabilities.includes(target.capability||'catalog'),`${key}: unsupported capability`);
  assert.ok(keys.includes(target.repository),`${key}: unknown repository`);
  if(target.inputs!==undefined){assert.ok(Array.isArray(target.inputs)&&new Set(target.inputs).size===target.inputs.length&&target.inputs.every(name=>keys.includes(name)),`${key}: inputs must be unique known repositories`);}
  if(target.input_checks!==undefined){
   assert.ok(target.input_checks && typeof target.input_checks==='object' && !Array.isArray(target.input_checks),`${key}: input_checks must be an object`);
   for(const [name,check] of Object.entries(target.input_checks)){
    assert.ok(name===target.repository||(target.inputs||[]).includes(name),`${key}: checked source must be the target or a declared input`);
    assert.ok(check && typeof check==='object' && !Array.isArray(check),`${key}: invalid input check`);
    assert.ok(typeof check.package_name==='string' && check.package_name.length,`${key}: package_name required`);
    assert.ok(typeof check.package_version==='string' && check.package_version.length,`${key}: package_version required`);
    assert.ok(check.files && typeof check.files==='object' && !Array.isArray(check.files) && Object.keys(check.files).length,`${key}: file hashes required`);
    for(const [file,hash] of Object.entries(check.files)){
     assert.match(file,/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9_./-]+$/,`${key}: unsafe checked file path`);
     assert.match(hash,/^[0-9a-f]{64}$/,`${key}: file hashes must be SHA-256`);
    }
   }
  }
  assert.ok(Array.isArray(target.commands)&&target.commands.length,`${key}: build commands required`);
  for(const command of target.commands){
   assert.ok(Array.isArray(command)&&command.length&&command.every(value=>typeof value==='string'&&value.length),`${key}: each command must be a nonempty argument array`);
   for(const arg of command)for(const match of arg.matchAll(/\{source:([a-z][a-z0-9_-]*)\}/g))assert.ok(match[1]===target.repository||(target.inputs||[]).includes(match[1]),`${key}: source ${match[1]} must be the target repository or a declared input`);
  }
 }
 return manifest;
}
export function readPin(repo,commit,path){return git(repo,['show',`${commit}:${path}`]);}
// Validate the actual archived package before running the consumer. This binds
// identity and specific source bytes, but cannot prove arbitrary commands use it.
export async function verifyInput(root,check){
 const pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
 assert.equal(pkg.name,check.package_name,'Package name differs from the expected implementation');
 assert.equal(pkg.version,check.package_version,'Package version differs from the expected implementation');
 for(const [file,expected] of Object.entries(check.files)){
  const bytes=await readFile(join(root,file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),expected,`Input file hash differs: ${file}`);
 }
}
export function archive(repo,commit,dest){
 // A clean temporary bare repository uses the source's object database but
 // not its untracked .git/info/attributes or repository-specific Git config.
 const objectDirectory=resolve(repo,git(repo,['rev-parse','--git-path','objects']).trim()),bare=mkdtempSync(join(tmpdir(),'nightjar-git-archive-'));
 try{
  run('git',['init','--bare','--quiet','--template=',bare],{env:gitEnv()});
  const result=spawnSync('git',[`--git-dir=${bare}`,'-c',`core.attributesFile=${devNull}`,'archive','--format=tar',commit],{env:gitEnv({GIT_OBJECT_DIRECTORY:objectDirectory}),maxBuffer:128*1024*1024});
  if(result.error||result.status!==0)throw result.error||Error(`git archive failed for ${repo}@${commit}`);
  const extracted=spawnSync('tar',['-xf','-','-C',dest],{input:result.stdout,maxBuffer:4*1024*1024});
  if(extracted.error||extracted.status!==0)throw extracted.error||Error(`git archive extraction failed for ${repo}@${commit}`);
 }finally{rmSync(bare,{recursive:true,force:true});}
}
export function expand(arg,context){
 return arg.replace(/\{(output|baseSlash|base|source:[a-z][a-z0-9_-]*)\}/g,(_,key)=>{
  const sourceName=key.startsWith('source:')?key.slice(7):null;
  if(sourceName)assert.ok(Object.hasOwn(context.sources,sourceName),`Unknown placeholder ${key}`);
  const value=sourceName?context.sources[sourceName]:context[key];assert.notEqual(value,undefined,`Unknown placeholder ${key}`);return value;
 });
}
const norm=value=>value.replace(/\s+/g,' ').trim();
export async function verifyOutputRoot(container,root){
 const location=relative(container,root);
 assert.ok(location&&!isAbsolute(location)&&location!=='..'&&!location.startsWith(`..${sep}`),'Build output must remain inside its temporary run directory');
 const info=await lstat(root);assert.ok(info.isDirectory()&&!info.isSymbolicLink(),'Build output root must be a real directory, not a symlink');
 assert.equal(await realpath(root),resolve(await realpath(container),location),'Build output or an ancestor is a symlink');
}
async function digestTree(root){
 const files=[];async function walk(directory,prefix=''){
  for(const name of (await readdir(directory)).sort()){
   const relative=prefix?`${prefix}/${name}`:name,full=join(directory,name),info=await lstat(full);
   if(info.isDirectory())await walk(full,relative);
   else {assert.ok(info.isFile(),`Build output contains a symlink or special file: ${relative}`);files.push([relative,createHash('sha256').update(await readFile(full)).digest('hex')]);}
  }
 }await walk(root);assert.ok(files.length,'Build output is empty');return createHash('sha256').update(JSON.stringify(files)).digest('hex');
}
export async function auditSite(page,root,base,catalog,dashboards,label){
 const cells=[];
 for(const record of catalog.pages){
  const html=await readFile(join(root,'examples',record.id,'index.html'),'utf8');
  await page.setContent(html,{waitUntil:'domcontentloaded'});
  const found=await page.evaluate(()=>{const normalize=value=>value.replace(/\s+/g,' ').trim();return {headings:[...document.querySelectorAll('h1')].map(n=>normalize(n.textContent)),main:normalize(document.querySelector('main')?.textContent||''),mainCount:document.querySelectorAll('main').length,people:[...document.querySelectorAll('#people-table tbody tr th[scope=row]')].map(n=>normalize(n.textContent)),tableIds:[...document.querySelectorAll('main table[id]')].filter(n=>n.tBodies[0]?.rows.length).map(n=>n.id),sections:[...document.querySelectorAll('h2[id]')].map(h=>{const container=h.closest('section')||h.parentElement;return {id:h.id,title:normalize(h.textContent),text:normalize(container.textContent),images:[...container.querySelectorAll('img')].map(image=>image.alt),tables:[...container.querySelectorAll('table')].map(t=>({caption:normalize(t.caption?.textContent||''),headers:[...t.querySelectorAll('thead th')].map(n=>normalize(n.textContent)),columnScopes:[...t.querySelectorAll('thead th')].map(n=>n.getAttribute('scope')),rows:[...t.querySelectorAll('tbody tr')].map(r=>[...r.children].map(c=>normalize(c.textContent))),rowScopes:[...t.querySelectorAll('tbody tr')].map(r=>r.firstElementChild?.getAttribute('scope'))}))};})};});
  assert.deepEqual(found.headings,[norm(record.title)],`${label}/${record.id}: canonical heading`);assert.equal(found.mainCount,1,`${label}/${record.id}: one main`);assert.ok(found.main.includes(norm(record.summary)),`${label}/${record.id}: canonical summary`);
  if(record.id==='dashboard-administration')assert.deepEqual(found.people.sort(),dashboards.people.map(p=>norm(p.name)).sort(),`${label}: administration fixture`);
  const required=record.id==='dashboard-analytics'?['analytics-source']:record.id==='dashboard-administration'?['people-table']:record.id==='dashboard-operations'?['service-table','alert-table']:[];
  for(const id of required)assert.ok(found.tableIds.includes(id),`${label}/${record.id}: missing nonempty table ${id}`);
  if(!dashboardIds.has(record.id))for(const section of record.sections){
   const current=found.sections.find(s=>s.id===section.id),where=`${label}/${record.id}/${section.id}`;assert.ok(current,`${where}: missing section`);assert.equal(current.title,norm(section.title),`${where}: heading differs`);
   const expected=[];if(section.kind==='facts')for(const item of section.facts)expected.push(item.label,item.value);if(['cards','listing','gallery','workspace'].includes(section.kind))for(const item of section.items)for(const field of ['title','summary','status','owner','caption','tag'])if(item[field])expected.push(item[field]);if(section.kind==='faq')for(const item of section.items)expected.push(item.question,item.answer);if(section.kind==='stats')for(const item of section.items)expected.push(item.label,item.value);if(section.kind==='plans')for(const item of section.items)expected.push(item.title,item.price,item.summary,...item.features,item.action.label);if(section.kind==='figure')expected.push(section.caption);
   for(const text of expected)assert.ok(current.text.includes(norm(text)),`${where}: missing representative text ${JSON.stringify(text)}`);
   if(section.kind==='table'){const table=current.tables[0];assert.ok(table,`${where}: table missing`);assert.equal(table.caption,section.title,`${where}: caption`);assert.deepEqual(table.headers,section.headers,`${where}: headers`);assert.deepEqual(table.rows,section.rows,`${where}: rows`);assert.ok(table.columnScopes.every(scope=>scope==='col')&&table.rowScopes.every(scope=>scope==='row'),`${where}: table header scope`);}
   if(section.kind==='figure')assert.ok(current.images.includes(section.alt),`${where}: figure alt`);if(section.kind==='gallery')for(const item of section.items)assert.ok(current.images.includes(item.alt),`${where}: gallery alt`);
  }
  cells.push({example:record.id,base,static_content:'checked',interactive_behavior:'not_assessed',automated_accessibility:'not_assessed',visual_conformance:'not_assessed'});
 }
 const science=await readFile(join(root,'examples','scientific-workspace','index.html'),'utf8');await page.setContent(science,{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('h1').count(),1,`${label}: experimental science has one heading`);assert.ok(await page.locator('main tbody tr').count()>0,`${label}: experimental science has static results`);
 return {cells,science:{status:'experimental',static_results:'checked',interactive_behavior:'not_assessed'}};
}
// A small adapter smoke contract checks one canonical record, and never claims
// the full catalog, dashboards, science, interactions or accessibility.
export async function auditSmoke(page,root,base,catalog,label){
 const record=catalog.pages[0];
 const html=await readFile(join(root,'examples',record.id,'index.html'),'utf8');
 await page.setContent(html,{waitUntil:'domcontentloaded'});
 const found=await page.evaluate(()=>({headings:[...document.querySelectorAll('h1')].map(n=>n.textContent.replace(/\s+/g,' ').trim()),mainCount:document.querySelectorAll('main').length,main:document.querySelector('main')?.textContent.replace(/\s+/g,' ').trim()||''}));
 assert.deepEqual(found.headings,[norm(record.title)],`${label}/${record.id}: canonical heading`);
 assert.equal(found.mainCount,1,`${label}/${record.id}: one main`);
 assert.ok(found.main.includes(norm(record.summary)),`${label}/${record.id}: canonical summary`);
 return {cells:[{example:record.id,base,static_content:'checked',scope:'adapter-smoke',interactive_behavior:'not_assessed',automated_accessibility:'not_assessed',visual_conformance:'not_assessed'}],science:{status:'not_assessed'}};
}
export async function execute(manifest,{browserName='chromium',output,requireMatrix=false,requireCheckedInputs=false}={}){
 validateManifest(manifest);assert.ok(['chromium','firefox','webkit'].includes(browserName),'unsupported browser');
 if(requireCheckedInputs)for(const target of manifest.targets)for(const input of target.inputs||[])
  assert.ok(Object.hasOwn(target.input_checks||{},input),`${target.family}/${target.framework}: declared input ${input} lacks a package identity and file hash check`);
 const matrix=manifest.matrix||defaultMatrix;
 const expected=matrix.families.flatMap(f=>matrix.frameworks.map(fr=>`${f}/${fr}`));
 const present=new Set(manifest.targets.map(t=>`${t.family}/${t.framework}`));
 const missing=expected.filter(key=>!present.has(key));
 if(requireMatrix)assert.equal(missing.length,0,`complete matrix missing targets: ${missing.join(', ')}`);
 if(output){try{await lstat(resolve(output));throw Error('Output already exists; choose a new result path');}catch(error){if(error.code!=='ENOENT')throw error;}}
 const runnerFile=fileURLToPath(import.meta.url),verifier=join(here,'../../examples/page-archetypes/scripts/verify-html.py'),matrixFile=join(here,'portable-matrix.json'),hashFile=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
 const runnerCommit=git(here,['rev-parse','HEAD']).trim(),scriptHash=await hashFile(runnerFile),verifierHash=await hashFile(verifier),matrixFileHash=await hashFile(matrixFile),dirty=!!git(here,['status','--porcelain','--untracked-files=all']).trim();
 const repos={};for(const [name,spec] of Object.entries(manifest.repositories)){const path=resolve(spec.path);pinned(path,spec.commit);repos[name]={path,commit:spec.commit};}
 const fixtureRepo=repos[manifest.fixture.repository],catalogText=readPin(fixtureRepo.path,fixtureRepo.commit,manifest.fixture.catalog),dashboardText=readPin(fixtureRepo.path,fixtureRepo.commit,manifest.fixture.dashboards);
 const catalog=JSON.parse(catalogText),dashboards=JSON.parse(dashboardText);assert.equal(catalog.pages.length,50,'canonical fixture must have 50 examples');assert.equal(new Set(catalog.pages.map(p=>p.id)).size,50,'duplicate catalog ID');
 for(const p of catalog.pages)assert.match(p.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/,'unsafe route ID');
 const temp=await mkdtemp(join(tmpdir(),'nightjar-portable-runner-'));let browser;
 try{
  browser=await ({chromium,firefox,webkit})[browserName].launch({headless:true,...(browserName==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  const context=await browser.newContext({javaScriptEnabled:false});await context.route('**/*',route=>route.abort());const page=await context.newPage();
  const results=[];for(const target of manifest.targets)for(const base of ['', '/preview']){
   // Every build starts with a fresh archive of each pinned input. Build output
   // and caches from one family/base cannot become another case's source.
   const sources={};for(const [name,repo] of Object.entries(repos)){sources[name]=join(temp,'sources',target.family,target.framework,base?'preview':'root',name);await mkdir(sources[name],{recursive:true});archive(repo.path,repo.commit,sources[name]);}
   for(const [name,check] of Object.entries(target.input_checks||{}))await verifyInput(sources[name],check);
   const outputPath=join(temp,'builds',target.family,target.framework,base?'preview':'root');await mkdir(outputPath,{recursive:true});
   for(const command of target.commands){const args=command.map(arg=>expand(arg,{sources,base,baseSlash:base?`${base}/`:'/',output:outputPath}));run(args[0],args.slice(1),{cwd:sources[target.repository],timeout:15*60*1000});}
   await verifyOutputRoot(temp,outputPath);
   const outputHash=await digestTree(outputPath); // reject output symlinks before traversing rendered documents
   const htmlCheck=run('python3',[join(here,'../../examples/page-archetypes/scripts/verify-html.py'),outputPath,'--baseurl',base]);
   const capability=target.capability||'catalog';
   const audited=await (capability==='catalog'?auditSite:auditSmoke)(page,outputPath,base||'/',catalog,...(capability==='catalog'?[dashboards]:[]),`${target.family}/${target.framework}${base||'/'}`);
   results.push({family:target.family,framework:target.framework,capability,base:base||'/',source:target.repository,source_commit:repos[target.repository].commit,declared_inputs:Object.fromEntries((target.inputs||[]).map(name=>[name,repos[name].commit])),input_checks:target.input_checks||{},declared_input_consumption:'not_verified',build_commands:target.commands,output_tree_sha256:outputHash,html_check:htmlCheck.trim(),...audited});
   console.log(`${target.family}/${target.framework}${base||'/'}: ${audited.cells.length} ${capability} static route checks`);
  }
  await context.close();
  assert.equal(await hashFile(runnerFile),scriptHash,'Runner changed during execution');assert.equal(await hashFile(verifier),verifierHash,'HTML verifier changed during execution');assert.equal(git(here,['rev-parse','HEAD']).trim(),runnerCommit,'Runner commit changed during execution');
  assert.equal(await hashFile(matrixFile),matrixFileHash,'Default matrix configuration changed during execution');
  const result={version:1,runner_scope:'Capability-scoped static content and local link/fragment inventory; catalog additionally checks experimental static-result presence. Not full conformance or an accessibility audit.',network_policy:'Runner performs no fetch; build commands are trusted code and network isolation is not enforced.',runner:{commit:runnerCommit,script_sha256:scriptHash,html_verifier_sha256:verifierHash,default_matrix_sha256:matrixFileHash,worktree_dirty:dirty},require_checked_declared_inputs:requireCheckedInputs,matrix,fixture:{repository:manifest.fixture.repository,commit:fixtureRepo.commit,catalog_path:manifest.fixture.catalog,dashboards_path:manifest.fixture.dashboards,catalog_sha256:createHash('sha256').update(catalogText).digest('hex'),dashboards_sha256:createHash('sha256').update(dashboardText).digest('hex')},repositories:Object.fromEntries(Object.entries(repos).map(([name,repo])=>[name,{commit:repo.commit}])),browser:{engine:browserName,version:browser.version()},node:process.version,javascript:'disabled',results,missing,not_assessed:['declared package input consumption','interactive behavior','JavaScript failure recovery','automated accessibility','contrast incomplete findings','visual identity','manual assistive technology','physical print','performance']};
  if(output)await writeFile(resolve(output),JSON.stringify(result,null,2)+'\n',{flag:'wx'});return result;
 }finally{if(browser)await browser.close();await rm(temp,{recursive:true,force:true});}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);let manifestPath,output,browserName='chromium',requireMatrix=false,requireCheckedInputs=false;
 for(let i=0;i<args.length;i++){if(args[i]==='--manifest')manifestPath=args[++i];else if(args[i]==='--output')output=args[++i];else if(args[i]==='--browser')browserName=args[++i];else if(args[i]==='--require-matrix')requireMatrix=true;else if(args[i]==='--require-checked-inputs')requireCheckedInputs=true;else throw Error(`Unknown argument: ${args[i]}`);}
 assert.ok(manifestPath&&output,'Usage: node scripts/qa/portable-runner.mjs --manifest manifest.json --output result.json [--browser chromium|firefox|webkit] [--require-matrix]');
 const manifest=JSON.parse(await readFile(resolve(manifestPath),'utf8'));const result=await execute(manifest,{browserName,output,requireMatrix,requireCheckedInputs});
 console.log(`Recorded ${result.results.reduce((n,r)=>n+r.cells.length,0)} bounded static route checks; missing targets: ${result.missing.join(', ')||'none'}.`);
}
