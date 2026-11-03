// Builds isolated copies with schema-valid unequal service observations.
import assert from 'node:assert/strict';
import {cpSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync, symlinkSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve, join, basename, extname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {chromium} from '@playwright/test';
import {Validator} from '@cfworker/json-schema';
import {operationsView} from '../jekyll/assets/js/dashboard-model.mjs';
const root=process.cwd(),temp=mkdtempSync(join(tmpdir(),'nightjar-empty-'));
const original=JSON.parse(readFileSync('examples/page-archetypes/content/dashboards.json','utf8'));
const disjoint=process.argv.includes('--disjoint');
const fixture={...original,services:original.services.map((service,index)=>({...service,samples:index===1?(disjoint?service.samples.slice(-7,-6):service.samples.slice(-5,-1)):service.samples}))};
const schema=JSON.parse(readFileSync('examples/page-archetypes/contracts/dashboards.schema.json','utf8'));
assert.ok(new Validator(schema,'2020-12',true).validate(fixture).valid,'Partial fixture must remain schema-valid');
const skip=new Set(['node_modules','dist','_site','.astro','.jekyll-cache','test-results']);
function run(command,args,cwd,extra={}){
 const child=spawnSync(command,args,{cwd,env:{...process.env,...extra},encoding:'utf8'});
 assert.equal(child.status,0,`${command} ${args.join(' ')} failed: ${child.stderr}\n${child.stdout}`);
}
let browser;
try {
 cpSync(join(root,'examples'),join(temp,'examples'),{recursive:true,filter:path=>!skip.has(basename(path))&&!basename(path).endsWith('-dist')});
 cpSync(join(root,'packages'),join(temp,'packages'),{recursive:true,filter:path=>!skip.has(basename(path))});
 cpSync(join(root,'package.json'),join(temp,'package.json'));
 symlinkSync(resolve(root,'node_modules'),join(temp,'node_modules'),'dir');
 symlinkSync(resolve(root,'examples/astro-slice/node_modules'),join(temp,'examples/astro-slice/node_modules'),'dir');
 for(const path of ['examples/page-archetypes/content/dashboards.json','examples/jekyll/martlet/_data/dashboards.json','examples/jekyll/krigsvold/_data/dashboards.json']) writeFileSync(join(temp,path),JSON.stringify(fixture));
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 for(const family of ['martlet','krigsvold']) for(const framework of ['jekyll','astro','react']) for(const base of ['/','/preview/']) {
  const site=join(temp,'examples/jekyll',family),dist=join(temp,'empty-dist',framework,family);
  if(framework==='jekyll') run('bundle',['exec','jekyll','build','--baseurl',base==='/'?'':'/preview','--destination',dist],site);
  if(framework==='astro') run('npm',['run','build'],join(temp,'examples/astro-slice'),{NIGHTJAR_FAMILY:family,NIGHTJAR_BASE:base,ASTRO_TELEMETRY_DISABLED:'1'});
  if(framework==='react') run(process.execPath,['examples/react-catalog/build.mjs'],temp,{NIGHTJAR_FAMILY:family,NIGHTJAR_BASE:base});
  const built=framework==='jekyll'?dist:join(temp,'examples',framework==='astro'?'astro-slice':'react-catalog','dist',family);
  const server=createServer((req,res)=>{const path=new URL(req.url,'http://localhost').pathname;if(!path.startsWith(base)){res.writeHead(404).end();return;}const file=resolve(built,decodeURIComponent(path.slice(base.length)),path.endsWith('/')?'index.html':'');if(!file.startsWith(built+'/')){res.writeHead(403).end();return;}try{const data=readFileSync(file);const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff'};res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(data);}catch{res.writeHead(404).end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try {for(const javascriptEnabled of [true,false]){
   const context=await browser.newContext({javaScriptEnabled:javascriptEnabled,viewport:{width:320,height:900}}),page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(`http://127.0.0.1:${server.address().port}${base}examples/dashboard-operations/`,{waitUntil:'networkidle'});
   for(const service of fixture.services){const latest=service.samples.at(-1),row=page.locator('#service-table tbody tr').filter({hasText:service.name});assert.match(await row.innerText(),new RegExp(latest.time.replaceAll('+','\\+')),'latest sample time is visible with and without JS');}
   if(javascriptEnabled){assert.match(await page.locator('body').innerText(),/Partial sample coverage/);assert.match(await page.locator('body').innerText(),/sample times differ/);const outputs=await page.locator('[aria-label="Operations summary"] output').allTextContents();assert.equal(outputs[1],`${Math.round(fixture.services.reduce((sum,service)=>sum+service.samples.at(-1).latency_ms,0)/fixture.services.length)} ms`);const table=page.locator('table').filter({has:page.locator('caption', {hasText:'Latency trend'})});const rows=await table.locator('tbody tr').allTextContents();assert.equal(rows.length,disjoint?0:4,`${family} ${framework} ${base}: ${JSON.stringify(rows)}`);if(!disjoint){assert.match(rows[0],/16:00 UTC/);assert.match(rows[3],/19:00 UTC/);}await page.getByRole('button',{name:'Acknowledge AL-001'}).click();assert.equal(await page.locator('[aria-label="Operations summary"] output').nth(2).innerText(),'1');if(disjoint){await page.getByRole('combobox',{name:'Service',exact:true}).selectOption(fixture.services[1].id);await page.getByRole('button',{name:'Apply monitoring controls'}).click();assert.match(await page.locator('body').innerText(),/No availability samples in this monitoring window/);assert.equal(await table.locator('tbody tr').count(),0);}}
   if(!javascriptEnabled){const expected=operationsView(fixture,{}).points.map(point=>[`${point.time.slice(11,16)} UTC`,String(point.latency_ms)]),figure=page.locator('figure').filter({has:page.getByRole('heading',{name:'Latency trend',exact:true})}),rows=await figure.locator('tbody tr:has(th[scope=row])').evaluateAll(items=>items.map(row=>[...row.children].map(cell=>cell.textContent.trim())));assert.deepEqual(rows,expected,`${family} ${framework} ${base}: static common-time latency rows`);if(!expected.length&&framework!=='react')assert.match(await figure.locator('tbody').textContent(),/No common observations/);}
   assert.deepEqual(errors,[]);await context.close();
  }console.log(`${family} ${framework} ${base}: partial samples remain truthful with and without JavaScript`);

  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
 }
} finally {if(browser)await browser.close();rmSync(temp,{recursive:true,force:true});}
