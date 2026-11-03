// Builds isolated copies with deterministic over-precision data; never edits the source fixture.
import assert from 'node:assert/strict';
import {cpSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync, symlinkSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve, join, basename, extname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {Validator} from '@cfworker/json-schema';
const root=process.cwd(),temp=mkdtempSync(join(tmpdir(),'nightjar-precision-'));
const original=JSON.parse(readFileSync('examples/page-archetypes/content/dashboards.json','utf8'));
const selection=process.argv.includes('--selection'),previous=process.argv.includes('--previous'),unsafeDate=selection?'2026-10-10':previous?'2026-10-20':'2026-10-24';
const fixture={...original,analytics:original.analytics.map(row=>row.date===unsafeDate&&row.category==='Research'?{...row,sessions:Number.MAX_SAFE_INTEGER}:row)};
const schema=JSON.parse(readFileSync('examples/page-archetypes/contracts/dashboards.schema.json','utf8'));
assert.ok(new Validator(schema,'2020-12',true).validate(fixture).valid,'Precision fixture must remain schema-valid');
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
  const site=join(temp,'examples/jekyll',family),dist=join(temp,'precision-dist',framework,family);
  if(framework==='jekyll') run('bundle',['exec','jekyll','build','--baseurl',base==='/'?'':'/preview','--destination',dist],site);
  if(framework==='astro') run('npm',['run','build'],join(temp,'examples/astro-slice'),{NIGHTJAR_FAMILY:family,NIGHTJAR_BASE:base,ASTRO_TELEMETRY_DISABLED:'1'});
  if(framework==='react') run(process.execPath,['examples/react-catalog/build.mjs'],temp,{NIGHTJAR_FAMILY:family,NIGHTJAR_BASE:base});
  const built=framework==='jekyll'?dist:join(temp,'examples',framework==='astro'?'astro-slice':'react-catalog','dist',family);
  const server=createServer((req,res)=>{const path=new URL(req.url,'http://localhost').pathname;if(!path.startsWith(base)){res.writeHead(404).end();return;}const file=resolve(built,decodeURIComponent(path.slice(base.length)),path.endsWith('/')?'index.html':'');if(!file.startsWith(built+'/')){res.writeHead(403).end();return;}try{const data=readFileSync(file);const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff'};res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(data);}catch{res.writeHead(404).end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try {for(const javascriptEnabled of [true,false]){
   const context=await browser.newContext({javaScriptEnabled:javascriptEnabled,viewport:{width:320,height:900}}),page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(`http://127.0.0.1:${server.address().port}${base}examples/dashboard-analytics/`,{waitUntil:'networkidle'});
   assert.equal(await page.locator('h1').innerText(),'Analytics');
   const navigation=page.getByRole('navigation',{name:'Dashboard navigation',exact:true});
   if(selection){
    assert.equal(await page.locator('[data-analytics-data-error]').count(),0);
    if(javascriptEnabled){
     const initial=(await page.locator('[aria-label="Analytics summary"] output').allTextContents())[0];
     assert.equal(initial,'7,686');
     await page.getByLabel('Start date',{exact:true}).fill('2026-10-28');await page.getByLabel('End date',{exact:true}).fill('2026-10-22');await page.getByRole('button',{name:'Apply filters'}).click();for(const name of ['Start date','End date'])assert.equal(await page.getByLabel(name,{exact:true}).getAttribute('aria-describedby'),'analytics-error','range errors are associated before a subsequent data error');
     await page.getByLabel('Start date',{exact:true}).fill('2026-10-10');await page.getByLabel('End date',{exact:true}).fill('2026-10-10');await page.getByRole('button',{name:'Apply filters'}).click();
     assert.match(await page.getByRole('alert').innerText(),/Analytics totals exceed supported safe integer precision/);
     assert.notEqual(await page.getByLabel('Start date',{exact:true}).getAttribute('aria-invalid'),'true');
     assert.notEqual(await page.getByLabel('End date',{exact:true}).getAttribute('aria-invalid'),'true');
     for(const name of ['Start date','End date'])assert.equal(await page.getByLabel(name,{exact:true}).getAttribute('aria-describedby'),null,'data errors are not attributed to date fields');
     assert.match(await page.getByRole('status').filter({hasText:'Analytics data is unavailable'}).innerText(),/previous valid results remain visible/i);
     assert.equal((await page.locator('[aria-label="Analytics summary"] output').allTextContents())[0],initial);
     assert.equal(await page.getByRole('button',{name:'Download filtered CSV'}).isDisabled(),true);
     await page.getByLabel('Start date',{exact:true}).fill('2026-10-12');await page.getByLabel('End date',{exact:true}).fill('2026-10-12');await page.getByRole('button',{name:'Apply filters'}).click();
     assert.equal(await page.getByRole('button',{name:'Download filtered CSV'}).isDisabled(),false);
    }
   }else{
    assert.equal(await page.locator('[data-analytics-data-error]').innerText(),'Analytics totals exceed supported safe integer precision.');
    const outputs=await page.locator('[aria-label="Analytics summary"] output').allTextContents();
    assert.ok(outputs.every(value=>value.trim()==='—'),'No rounded metrics');
    if(!javascriptEnabled && framework!=='react') assert.equal(await page.getByText('Unavailable until a safe range is selected.',{exact:true}).count(),4);
    if(!javascriptEnabled && framework!=='react'){assert.equal(await page.locator('[data-chart-table] tbody th[scope=row]').count(),0,'Unsafe totals must not be rendered as chart observations');assert.equal(await page.getByText('Chart values are unavailable until a safe range is selected.',{exact:true}).count(),3);}
    assert.equal(await page.getByRole('button',{name:'Download filtered CSV'}).isDisabled(),true,'No invalid export');
    if(!javascriptEnabled) assert.match(await page.locator('body').innerText(),/JavaScript is required to choose a different range/);
    if(javascriptEnabled){
     assert.notEqual(await page.getByLabel('Start date',{exact:true}).getAttribute('aria-invalid'),'true');
     assert.notEqual(await page.getByLabel('End date',{exact:true}).getAttribute('aria-invalid'),'true');
     for(const name of ['Start date','End date'])assert.equal(await page.getByLabel(name,{exact:true}).getAttribute('aria-describedby'),null,'data errors are not attributed to date fields');
     await page.getByLabel('Start date',{exact:true}).fill('2026-10-13');await page.getByLabel('End date',{exact:true}).fill('2026-10-12');await page.getByRole('button',{name:'Apply filters'}).click();
     assert.match(await page.getByRole('status').filter({hasText:'Invalid filters'}).innerText(),/No valid results are available/);
     assert.equal(await page.getByRole('button',{name:'Download filtered CSV'}).isDisabled(),true);
     await page.getByLabel('Start date',{exact:true}).fill('2026-10-12');await page.getByLabel('End date',{exact:true}).fill('2026-10-12');await page.getByRole('button',{name:'Apply filters'}).click();
     assert.equal(await page.getByRole('button',{name:'Download filtered CSV'}).isDisabled(),false,'A safe range can recover');
     assert.ok((await page.locator('[aria-label="Analytics summary"] output').first().innerText())!=='—');
    }
   }
   if(javascriptEnabled){const toggle=page.getByRole('button',{name:'Dashboard navigation',exact:true});await toggle.click();assert.equal(await navigation.isVisible(),true);const axe=await new AxeBuilder({page}).include('main').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(({id})=>id),[],`${family} ${framework}: automated accessibility`);}
   else assert.equal(await navigation.isVisible(),true);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No page overflow at 320px');
   assert.deepEqual(errors,[]);await context.close();
  }console.log(`${family} ${framework} ${base}: precision error and recovery handled with and without JavaScript`);
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
 }
} finally {if(browser)await browser.close();rmSync(temp,{recursive:true,force:true});}
