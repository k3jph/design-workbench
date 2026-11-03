// Builds isolated copies with schema-valid hostile text and selector-special IDs.
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
const fixture=structuredClone(original),serviceId='service" [x]',alertId='alert"]#',payload='<img src=x onerror="window.__nightjarInjected=1">';
const previousId=fixture.services[0].id;fixture.services[0].id=serviceId;fixture.services[0].name=`Service ${payload}`;
fixture.alerts.forEach(alert=>{if(alert.service_id===previousId)alert.service_id=serviceId});
fixture.activity.forEach(event=>{if(event.service_id===previousId)event.service_id=serviceId});
fixture.alerts[0].id=alertId;fixture.alerts[0].service_id=serviceId;fixture.alerts[0].title=`Alert ${payload}`;fixture.activity[0].service_id=serviceId;fixture.activity[0].title=`Activity ${payload}`;
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
   const body=page.locator('body');assert.match(await body.textContent(),/Service <img src=x onerror=/);assert.match(await body.textContent(),/Alert <img src=x onerror=/);assert.match(await body.textContent(),/Activity <img src=x onerror=/);
   assert.equal(await page.locator('img[src="x"]').count(),0,'fixture text must never create elements');assert.equal(await page.evaluate(()=>window.__nightjarInjected),undefined);
   if(javascriptEnabled){
    await page.getByRole('combobox',{name:'Service',exact:true}).selectOption(serviceId);await page.getByRole('button',{name:'Apply monitoring controls'}).click();
    const button=page.getByRole('button',{name:`Acknowledge ${alertId}`,exact:true});await button.click();const undo=page.getByRole('button',{name:`Undo acknowledgement ${alertId}`,exact:true});assert.ok(await undo.isVisible());assert.ok(await undo.evaluate(node=>document.activeElement===node),'focus returns to the corresponding alert');await undo.click();const again=page.getByRole('button',{name:`Acknowledge ${alertId}`,exact:true});assert.ok(await again.isVisible());assert.ok(await again.evaluate(node=>document.activeElement===node),'focus returns after undo');
    assert.equal(await page.locator('img[src="x"]').count(),0);assert.equal(await page.evaluate(()=>window.__nightjarInjected),undefined);
   }
   assert.deepEqual(errors,[]);await context.close();
  }console.log(`${family} ${framework} ${base}: hostile text and selector-special IDs safely handled with and without JavaScript`);

  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
 }
} finally {if(browser)await browser.close();rmSync(temp,{recursive:true,force:true});}
