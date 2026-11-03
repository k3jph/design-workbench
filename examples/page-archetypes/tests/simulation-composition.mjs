// Build disposable fixtures containing multiple instances; no canonical page is altered.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {cp,mkdtemp,readFile,rm,symlink,writeFile} from 'node:fs/promises';
import {basename,extname,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const root=process.cwd(),framework=process.env.NIGHTJAR_SIMULATION_FRAMEWORK||'all';
if(!['all','jekyll','astro'].includes(framework))throw Error('Choose all, jekyll, or astro');
const temp=await mkdtemp(resolve(tmpdir(),'nightjar-jekyll-sim-'));
// The copied Astro root stays under examples so its shared relative imports resolve.
const astro=await mkdtemp(resolve(root,'examples/.nightjar-simulation-'));
const ignored=new Set(['node_modules','dist','.astro','test-results']);
let browser;
function run(command,args,options){const result=spawnSync(command,args,{...options,encoding:'utf8'});if(result.status!==0)throw Error(`${command} failed:\n${result.stdout}\n${result.stderr}`)}
async function serve(dir,base){const server=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname;if(!path.startsWith(base)){res.writeHead(404).end();return}const relative=decodeURIComponent(path.slice(base.length)),file=resolve(dir,relative.endsWith('/')?relative+'index.html':relative);if(!file.startsWith(dir+'/')){res.writeHead(403).end();return}try{const data=await readFile(file);const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'};res.writeHead(200,{'Content-Type':type[extname(file)]||'application/octet-stream'}).end(data)}catch{res.writeHead(404).end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));return server;}
async function inspect(dir,base,label,route='simulation-fixture/'){ 
 const server=await serve(dir,base),origin=`http://127.0.0.1:${server.address().port}`;
 try{
  const context=await browser.newContext({viewport:{width:320,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()>=400)errors.push(response.url())});
  await page.goto(`${origin}${base}${route}`,{waitUntil:'networkidle'});
  const ids=await page.locator('[id]').evaluateAll(nodes=>nodes.map(node=>node.id));assert.equal(ids.length,new Set(ids).size,`${label}: duplicate IDs`);
  const first=page.getByRole('region',{name:'Station one'}),second=page.getByRole('region',{name:'Station two'}),scene=page.getByRole('region',{name:'Scene one'}),other=page.getByRole('region',{name:'Scene two'});
  await first.getByLabel('Simulated conditions',{exact:true}).selectOption('24');assert.equal(await first.locator('output').innerText(),'24 °C');assert.equal(await second.locator('output').innerText(),'18 °C');
  await second.getByLabel('Preview ventilation enabled').check();assert.match(await second.locator('[role=status]').innerText(),/ventilation enabled/);assert.match(await first.locator('[role=status]').innerText(),/ventilation disabled/);
  await scene.getByLabel('Viewpoint',{exact:true}).selectOption('station');await other.getByLabel('Viewpoint',{exact:true}).selectOption('notebook');assert.match(await scene.locator('img').getAttribute('src'),/station(?:\.[A-Za-z0-9_-]+)?\.svg$/);assert.match(await other.locator('img').getAttribute('src'),/notebook(?:\.[A-Za-z0-9_-]+)?\.svg$/);assert.match(await scene.locator('img').getAttribute('alt'),/field station/i);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual((await new AxeBuilder({page}).include('main').analyze()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.html)})),[]);assert.deepEqual(errors,[]);await context.close();
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900}}),staticPage=await nojs.newPage();await staticPage.goto(`${origin}${base}${route}`);for(const region of ['Station one','Station two'])assert.ok(await staticPage.getByRole('region',{name:region}).getByLabel('Simulated conditions',{exact:true}).isDisabled());for(const region of ['Scene one','Scene two'])assert.ok(await staticPage.getByRole('region',{name:region}).getByLabel('Viewpoint',{exact:true}).isDisabled());await nojs.close();
  console.log(`${label} ${base}: unique IDs, independent controls, responsive, axe and no-JS passed`);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
}
try{
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 await cp(resolve(root,'examples/astro-slice'),astro,{recursive:true,filter:source=>!ignored.has(basename(source))&&!basename(source).endsWith('-dist')});
 await symlink(resolve(root,'examples/astro-slice/node_modules'),resolve(astro,'node_modules'),'dir');
 const astroFixture=`---\nimport Simulations from '../components/Simulations.astro';\n---\n<html lang="en"><head><meta charset="UTF-8" /><link rel="icon" href="data:," /><title>Simulation fixture</title><meta name="viewport" content="width=device-width,initial-scale=1" /></head><body><main data-fixture><h1>Simulation fixture</h1><p id="simulation-one-mode">Reserved section identifier.</p><p id="scene-three-view">Another section identifier.</p><section aria-label="Station one"><Simulations kind="sensors" id="one" /></section><section aria-label="Station two"><Simulations kind="sensors" id="two" /></section><section aria-label="Scene one"><Simulations kind="scene" id="three" /></section><section aria-label="Scene two"><Simulations kind="scene" id="four" /></section></main></body></html>`;
 await writeFile(resolve(astro,'src/pages/simulation-fixture.astro'),astroFixture);
 for(const family of ['martlet','krigsvold']){
  const source=resolve(temp,family);await cp(resolve(root,`examples/jekyll/${family}`),source,{recursive:true,filter:path=>!ignored.has(basename(path))});
  const dataPath=resolve(source,'_data/examples.json'),data=JSON.parse(await readFile(dataPath,'utf8'));data.pages.push({id:'simulation-fixture',title:'Simulation fixture',summary:'Synthetic composition fixture',category:'Tests',semantic_class:'simulation',composition:'workspace',sections:[{id:'one',title:'Station one',kind:'sensors'},{id:'two',title:'Station two',kind:'sensors'},{id:'three',title:'Scene one',kind:'scene'},{id:'four',title:'Scene two',kind:'scene'},{id:'simulation-one-mode',title:'Reserved section identifier',body:'A heading cannot collide with a control ID.'},{id:'scene-three-view',title:'Another section identifier',body:'A second heading cannot collide with a control ID.'}]});await writeFile(dataPath,JSON.stringify(data));
  const jekyllFixture=`---\nlayout: example-workspace\ntitle: Simulation fixture\nrecord_id: simulation-fixture\npermalink: /examples/simulation-fixture/\n---\n`;
  await writeFile(resolve(source,'simulation-fixture.html'),jekyllFixture);
  for(const base of ['/','/preview/']){
   const output=resolve(temp,`${family}-${base==='/'?'root':'preview'}`);
   if(framework!=='astro'){run('bundle',['exec','jekyll','build','--baseurl',base==='/'?'':base.replace(/\/$/,''),'--destination',output],{cwd:source,env:process.env});run('python3',[resolve(root,'examples/page-archetypes/scripts/verify-html.py'),'--baseurl',base==='/'?'':base.replace(/\/$/,''),output],{cwd:root,env:process.env});await inspect(output,base,`${family} Jekyll`,'examples/simulation-fixture/');}
   if(framework!=='jekyll'){run('npm',['run','build'],{cwd:astro,env:{...process.env,NIGHTJAR_FAMILY:family,NIGHTJAR_BASE:base,ASTRO_TELEMETRY_DISABLED:'1'}});await inspect(resolve(astro,'dist',family),base,`${family} Astro`);}
  }
 }
}finally{await browser?.close();await rm(temp,{recursive:true,force:true});await rm(astro,{recursive:true,force:true});}
