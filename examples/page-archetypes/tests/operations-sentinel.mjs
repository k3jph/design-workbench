// Builds isolated copies with a schema-valid service named by the legacy All sentinel.
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
const fixture=structuredClone(original),oldId=fixture.services[0].id;
fixture.services[0].id='All';fixture.alerts.forEach(alert=>{if(alert.service_id===oldId)alert.service_id='All'});fixture.activity.forEach(event=>{if(event.service_id===oldId)event.service_id='All'});fixture.alerts[0].service_id='All';fixture.activity[0].service_id='All';
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
   const route=`http://127.0.0.1:${server.address().port}${base}examples/dashboard-operations/`;
   await page.goto(`${route}?service=All`,{waitUntil:'networkidle'});
   const service=page.getByRole('combobox',{name:'Service',exact:true});assert.equal(await service.locator('option').first().getAttribute('value'),'','All services has its own value');assert.equal(await service.locator('option').nth(1).getAttribute('value'),'All','literal All service remains selectable');
   assert.equal(await page.locator('#service-table tbody tr').count(),fixture.services.length,'legacy service=All retains all-services meaning');
   if(javascriptEnabled){
    await service.selectOption('All');await page.getByRole('button',{name:'Apply monitoring controls'}).click();assert.equal(await page.locator('#service-table tbody tr').count(),1);assert.match(await page.locator('#service-table tbody tr').innerText(),new RegExp(fixture.services[0].name));assert.equal(await page.locator('#alert-table tbody tr').count(),fixture.alerts.filter(alert=>alert.service_id==='All').length);const activity=page.getByRole('heading',{name:'Activity timeline'}).locator('..').locator('li');assert.equal(await activity.count(),fixture.activity.filter(event=>event.service_id==='All').length);assert.equal(new URL(page.url()).searchParams.get('serviceId'),'All');
    await page.reload({waitUntil:'networkidle'});assert.equal(await service.inputValue(),'All');assert.equal(await page.locator('#service-table tbody tr').count(),1,'specific All service survives reload');
    await service.selectOption('');await page.getByRole('button',{name:'Apply monitoring controls'}).click();assert.equal(await page.locator('#service-table tbody tr').count(),fixture.services.length);assert.equal(new URL(page.url()).searchParams.get('serviceId'),null,'all-services clears explicit service ID');
    const other=fixture.services[1].id;await page.goto(`${route}?service=${encodeURIComponent(other)}`,{waitUntil:'networkidle'});assert.equal(await service.inputValue(),other);assert.equal(await page.locator('#service-table tbody tr').count(),1,'legacy service-specific URLs retain their meaning');
   }else assert.ok(await service.isDisabled());
   assert.deepEqual(errors,[]);await context.close();
  }console.log(`${family} ${framework} ${base}: literal All service and all-services scope distinguished`);

  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
 }
} finally {if(browser)await browser.close();rmSync(temp,{recursive:true,force:true});}
