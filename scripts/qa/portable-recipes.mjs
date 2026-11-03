#!/usr/bin/env node
// Canonical route coverage over independently built local outputs. No build,
// source checkout, publication, or remote input is performed by this runner.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium,firefox,webkit} from '@playwright/test';
import {digestTree,serve,validateManifest} from './portable-interactions.mjs';

export async function checkRecipes(browser,target,pages){
 assert.ok(Array.isArray(pages)&&pages.length,'Recipe inventory required');
 const ids=pages.map(p=>p.id);assert.equal(new Set(ids).size,ids.length,'Duplicate recipe');
 for(const id of ids)assert.match(id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/,'Unsafe recipe');
 const root=resolve(target.root),before=await digestTree(root);
 const catalog=target.catalog?{...target.catalog,bytes:await readFile(target.catalog.path)}:null;
 const server=await serve(root,target.base,catalog),origin=`http://127.0.0.1:${server.address().port}`;
 const states=[];let context;
 try{
  for(const javaScriptEnabled of [true,false]){
   context=await browser.newContext({javaScriptEnabled,viewport:{width:320,height:900},reducedMotion:'reduce'});
   const page=await context.newPage(),failures=[];
   page.on('pageerror',e=>failures.push(e.message));
   page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)failures.push(`${r.status()} ${r.url()}`)});
   // Chromium represents disabled-JavaScript module preloads as CSP failures;
   // Firefox/WebKit may abort them. These are expected only in the no-JS state.
   page.on('requestfailed',r=>{if(r.url().startsWith(origin)&&!(!javaScriptEnabled&&['net::ERR_ABORTED','csp'].includes(r.failure()?.errorText)&&r.resourceType()==='script'))failures.push(`failed ${r.url()} ${r.failure()?.errorText}`)});
   for(const id of ids){
    failures.length=0;
    const url=`${origin}${target.base}examples/${id}/`;
    assert.equal((await context.request.get(url)).status(),200,`${id}: canonical route missing`);
    const response=await page.goto(url);
    assert.equal(response.status(),200,`${id}: canonical route missing`);
    assert.equal(await page.locator('main').count(),1,`${id}: expected one main landmark`);
    assert.equal(await page.locator('h1').count(),1,`${id}: expected one page heading`);
    assert.ok((await page.locator('h1').textContent()).trim(),`${id}: empty page heading`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${id}: 320px document reflow`);
    assert.deepEqual([...new Set(failures)],[],`${id}: page errors or local asset failures`);
   }
   states.push({javaScriptEnabled,routes:ids.length,viewport:{width:320,height:900},reducedMotion:'reduce'});
   await context.close();context=null;
  }
  assert.equal(await digestTree(root),before,'Site changed during recipe checks');
  return {family:target.family,framework:target.framework,base:target.base,claimed_source_commit:target.source_commit,output_tree_sha256:before,states,unassessed:['interactive behavior','visual conformance','automated accessibility','manual assistive technology','physical devices']};
 }finally{await context?.close();server.closeAllConnections();await new Promise(done=>server.close(done));}
}

export async function executeRecipes(manifest,{browserName='chromium',output,requireMatrix=false}={}){
 validateManifest(manifest);assert.ok(['chromium','firefox','webkit'].includes(browserName),'Invalid browser');
 const expected=['martlet','krigsvold'].flatMap(f=>['astro','react','jekyll'].map(w=>`${f}/${w}`));
 const missing=expected.filter(id=>!manifest.targets.some(t=>`${t.family}/${t.framework}`===id));
 if(requireMatrix)assert.deepEqual(missing,[],'Missing implementations');
 // Reject existing observations before testing; exclusive creation below also
 // prevents replacing a report created concurrently.
 const {lstat}=await import('node:fs/promises');
 if(output){try{await lstat(resolve(output));throw Error('Output already exists')}catch(e){if(e.code!=='ENOENT')throw e}}
 const catalogBytes=await readFile(new URL('../../examples/page-archetypes/content/catalog.json',import.meta.url));
 const {pages}=JSON.parse(catalogBytes);assert.equal(pages.length,50,'Canonical inventory changed; review contract');
 const browser=await {chromium,firefox,webkit}[browserName].launch(browserName==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
 try{
  const results=[];for(const target of manifest.targets){results.push(await checkRecipes(browser,target,pages));console.log(`${target.family}/${target.framework}${target.base}: 50 routes with and without JavaScript checked`)}
  const report={version:1,observed_at_utc:new Date().toISOString(),scope:'Canonical route availability, main landmark, page heading, 320px document reflow and local asset/page errors with and without JavaScript; not full conformance.',runner_sha256:createHash('sha256').update(await readFile(fileURLToPath(import.meta.url))).digest('hex'),catalog_sha256:createHash('sha256').update(catalogBytes).digest('hex'),browser:{engine:browserName,version:browser.version()},node:process.version,source_commits:'Caller claims; source provenance and builds independently unverified.',results,missing};
  if(output)await writeFile(resolve(output),JSON.stringify(report,null,2)+'\n',{flag:'wx'});return report;
 }finally{await browser.close()}
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);let manifest,output,browserName='chromium',requireMatrix=false;
 for(let i=0;i<args.length;i++)if(args[i]==='--manifest')manifest=args[++i];else if(args[i]==='--output')output=args[++i];else if(args[i]==='--browser')browserName=args[++i];else if(args[i]==='--require-matrix')requireMatrix=true;else throw Error(`Unknown argument ${args[i]}`);
 assert.ok(manifest&&output,'Supply --manifest and a new --output path');
 await executeRecipes(JSON.parse(await readFile(resolve(manifest),'utf8')),{output,browserName,requireMatrix});
}
