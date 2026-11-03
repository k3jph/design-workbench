#!/usr/bin/env node
// Capability-scoped, local-output interaction checks. The manifest's sources and
// build commands are not executed or trusted; callers supply built site trees.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {lstat,readFile,readdir,realpath,writeFile} from 'node:fs/promises';
import {extname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium,firefox,webkit} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const families=['martlet','krigsvold'], frameworks=['jekyll','astro','react'];
export function validateManifest(m){
 assert.equal(m.version,1);assert.ok(Array.isArray(m.targets)&&m.targets.length);
 const seen=new Set();for(const t of m.targets){
  assert.ok(families.includes(t.family)&&frameworks.includes(t.framework),'Unknown family/framework');
  assert.equal(typeof t.root,'string');assert.ok(t.root.length);
  assert.match(t.base,/^\/(?:[A-Za-z0-9._~-]+\/)*$/,'Base must be a clean absolute path ending with /');
  assert.ok(!t.base.split('/').some(s=>s==='.'||s==='..'),'Unsafe base');
  assert.match(t.source_commit,/^[0-9a-f]{40}$/,'A full source commit is required');
  if(t.catalog!==undefined){assert.equal(typeof t.catalog.path,'string');assert.match(t.catalog.url,/^\/(?:[A-Za-z0-9._~-]+\/)*catalog\.json$/,'Invalid catalog URL');}
  const key=`${t.family}/${t.framework}${t.base}`;assert.ok(!seen.has(key),`Duplicate target ${key}`);seen.add(key);
 }
 return m;
}
export async function digestTree(root){
 const files=[];async function walk(dir,prefix=''){
  for(const name of (await readdir(dir)).sort()){const rel=prefix?`${prefix}/${name}`:name,p=join(dir,name),s=await lstat(p);
   if(s.isDirectory())await walk(p,rel);else{assert.ok(s.isFile(),`Symlink or special file: ${rel}`);files.push([rel,createHash('sha256').update(await readFile(p)).digest('hex')]);}}
 }await walk(root);assert.ok(files.length,'Empty site');return createHash('sha256').update(JSON.stringify(files)).digest('hex');
}
export async function serve(root,base,catalog){
 const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.csv':'text/csv'};
 const resolved=await realpath(root);const server=createServer(async(req,res)=>{
  try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(catalog&&path===catalog.url){res.writeHead(200,{'content-type':'application/json'}).end(catalog.bytes);return;}if(!path.startsWith(base))throw Error('base');
   let name=path.slice(base.length);if(!name||name.endsWith('/'))name+='index.html';
   const full=resolve(resolved,name),rel=relative(resolved,full);if(!rel||rel==='..'||rel.startsWith(`..${sep}`)||await realpath(full)!==full)throw Error('path');
   res.writeHead(200,{'content-type':mime[extname(full)]||'application/octet-stream'}).end(await readFile(full));
  }catch{res.writeHead(404).end();}
 });await new Promise(done=>server.listen(0,'127.0.0.1',done));return server;
}
export async function checkTarget(browser,target){
 const root=resolve(target.root),before=await digestTree(root),catalog=target.catalog?{...target.catalog,bytes:await readFile(target.catalog.path)}:null,server=await serve(root,target.base,catalog),origin=`http://127.0.0.1:${server.address().port}`;
 const errors=[];let context;
 try{
  context=await browser.newContext({viewport:{width:320,height:900},reducedMotion:'reduce'});const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});page.on('requestfailed',r=>{if(r.url().startsWith(origin))errors.push(`failed ${r.url()}`)});
  const response=await page.goto(`${origin}${target.base}examples/contact/`);assert.equal(response.status(),200,'Contact route missing');
  const form=page.locator('[data-demo-form="contact"]');assert.equal(await form.count(),1,'Expected one contact form');
  const name=form.getByLabel('Name',{exact:true}),email=form.getByLabel('Email address',{exact:true}),message=form.getByLabel('Message',{exact:true});
  await name.waitFor({state:'visible'});await page.waitForFunction(()=>{const fields=document.querySelector('[data-demo-form="contact"] fieldset');return fields && !fields.disabled});
  await name.focus();await page.keyboard.type('   ');await email.fill('ada@example.invalid');await message.fill('Example message');
  const submit=form.getByRole('button',{name:'Validate example'});await submit.focus();await page.keyboard.press('Enter');
  const alert=form.getByRole('alert');await alert.waitFor({state:'visible'});assert.match(await alert.textContent(),/non-whitespace/);
  assert.equal(await name.getAttribute('aria-invalid'),'true');assert.equal(await name.evaluate(e=>e===document.activeElement),true,'Invalid input receives focus');
  await name.fill('Ada');assert.equal(await alert.count(),0,'Correction clears the error');await submit.click();
  assert.match(await form.getByRole('status').textContent(),/validated locally/i,'Immediate pointer retry succeeds');
  const axe=await new AxeBuilder({page}).analyze();assert.deepEqual(axe.violations.map(v=>v.id),[],'Automated accessibility violations');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'320px horizontal reflow');
  await form.getByRole('button',{name:'Clear'}).click();assert.equal(await name.inputValue(),'');assert.equal((await form.getByRole('status').textContent()).trim(),'');
  assert.deepEqual(errors,[],'Page errors and local request failures');await context.close();context=null;
  context=await browser.newContext({javaScriptEnabled:false});const nojs=await context.newPage();await nojs.goto(`${origin}${target.base}examples/contact/`);
  assert.equal(await nojs.locator('[data-demo-form="contact"]').getByLabel('Name',{exact:true}).isDisabled(),true,'No-JavaScript form must stay disabled');
  assert.ok(await nojs.getByText(/JavaScript is needed for local form validation/).count(),'No-JavaScript fallback missing');
  assert.equal(await digestTree(root),before,'Site changed during test');
  return {family:target.family,framework:target.framework,base:target.base,claimed_source_commit:target.source_commit,output_tree_sha256:before,catalog:target.catalog?{url:target.catalog.url,sha256:createHash('sha256').update(catalog.bytes).digest('hex')}:null,contact_form:'checked',axe_violations:[],axe_incomplete:axe.incomplete.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),unassessed:['all other examples','declared package consumption','visual equivalence','manual assistive technology','physical devices']};
 }finally{await context?.close();server.closeAllConnections();await new Promise(done=>server.close(done));}
}
export async function execute(m,{browserName='chromium',output,requireMatrix=false}={}){
 validateManifest(m);assert.ok(['chromium','firefox','webkit'].includes(browserName),'Invalid browser');
 const have=new Set(m.targets.map(t=>`${t.family}/${t.framework}`)),missing=families.flatMap(f=>frameworks.map(fr=>`${f}/${fr}`)).filter(x=>!have.has(x));
 if(requireMatrix)assert.deepEqual(missing,[],`Missing targets: ${missing.join(', ')}`);
 if(output){try{await lstat(resolve(output));throw Error('Output already exists')}catch(e){if(e.code!=='ENOENT')throw e}}
 const engine={chromium,firefox,webkit}[browserName],browser=await engine.launch(browserName==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
 try{const results=[];for(const t of m.targets){results.push(await checkTarget(browser,t));console.log(`${t.family}/${t.framework}${t.base} contact interaction passed`)}
  const report={version:1,runner_sha256:createHash('sha256').update(await readFile(fileURLToPath(import.meta.url))).digest('hex'),node:process.version,scope:'Local built-output contact form keyboard, validation, pointer retry, reset, no-JS fallback, reflow and axe; not full conformance.',browser:{engine:browserName,version:browser.version()},source_commits:'Caller claims; source provenance and builds independently unverified.',results,missing};
  if(output)await writeFile(resolve(output),JSON.stringify(report,null,2)+'\n',{flag:'wx'});return report;
 }finally{await browser.close()}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);let manifest,output,browserName='chromium',requireMatrix=false;
 for(let i=0;i<args.length;i++)if(args[i]==='--manifest')manifest=args[++i];else if(args[i]==='--output')output=args[++i];else if(args[i]==='--browser')browserName=args[++i];else if(args[i]==='--require-matrix')requireMatrix=true;else throw Error(`Unknown argument ${args[i]}`);
 assert.ok(manifest&&output,'Supply --manifest and a new --output path');await execute(JSON.parse(await readFile(resolve(manifest),'utf8')),{output,browserName,requireMatrix});
}
