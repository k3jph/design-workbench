// Builds isolated copies with schema-valid unsafe or precision-boundary service observations.
import assert from 'node:assert/strict';
import {cpSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync, symlinkSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve, join, basename, extname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {chromium} from '@playwright/test';
import {Validator} from '@cfworker/json-schema';
const root=process.cwd(),temp=mkdtempSync(join(tmpdir(),'nightjar-empty-'));
const original=JSON.parse(readFileSync('examples/page-archetypes/content/dashboards.json','utf8'));
const mode=process.argv[2]||'observation';
assert.ok(['observation','queue','latency','rounding'].includes(mode));
const services=structuredClone(original.services);
if(mode==='observation')services[0].samples[0].queue=Number.MAX_SAFE_INTEGER+1;
if(mode==='queue')services[0].samples.at(-1).queue=Number.MAX_SAFE_INTEGER;
if(mode==='latency')services[0].samples[0].latency_ms=Number.MAX_SAFE_INTEGER;
if(mode==='rounding')services.forEach((service,index)=>{service.samples.at(-1).latency_ms=index===0?9007199254740987:0});
const fixture={...original,services};
const schema=JSON.parse(readFileSync('examples/page-archetypes/contracts/dashboards.schema.json','utf8'));
assert.ok(new Validator(schema,'2020-12',true).validate(fixture).valid,'Invalid operations fixture remains schema-valid');
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
   if(mode==='rounding'){
    const trend=page.locator('table').filter({has:page.locator('caption',{hasText:'Latency trend'})});
    const last=trend.locator('tbody tr').filter({hasText:'20:00 UTC'});assert.equal((await last.locator('td').last().textContent()).trim(),'1801439850948197','means are rounded from exact integer totals');
    if(javascriptEnabled)assert.equal(await page.locator('[aria-label="Operations summary"] output').nth(1).innerText(),'1801439850948197 ms');
   }else{
    assert.match(await page.getByRole('alert').innerText(),/Operations data unavailable: observations or totals exceed supported safe integer precision/);
    assert.equal(await page.locator('[aria-label="Operations summary"]').count(),0);assert.equal(await page.locator('#service-table').count(),0);assert.equal(await page.locator('#operations-filters').count(),0);
    assert.doesNotMatch(await page.locator('body').innerText(),/published data tables remain available/i);
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const navigation=page.getByRole('navigation',{name:'Dashboard navigation',exact:true});
   if(javascriptEnabled)await page.getByRole('button',{name:'Dashboard navigation',exact:true}).click();
   assert.ok(await navigation.isVisible());
   await page.goto(`http://127.0.0.1:${server.address().port}${base}examples/dashboard-analytics/`,{waitUntil:'networkidle'});assert.equal(await page.locator('h1').innerText(),'Analytics');assert.equal(await page.locator('[aria-label="Analytics summary"]').count(),1);
   assert.deepEqual(errors,[]);await context.close();
  }console.log(`${family} ${framework} ${base}: ${mode} precision handled with and without JavaScript`);

  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
 }
} finally {if(browser)await browser.close();rmSync(temp,{recursive:true,force:true});}
