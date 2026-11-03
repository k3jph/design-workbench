// Builds isolated copies with deterministic sparse and zero-valued observations; never edits the source fixture.
import assert from 'node:assert/strict';
import {cpSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync, symlinkSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve, join, basename, extname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {analyticsView} from '../jekyll/assets/js/dashboard-model.mjs';
import {Validator} from '@cfworker/json-schema';
const root=process.cwd(),temp=mkdtempSync(join(tmpdir(),'nightjar-sparse-'));
const original=JSON.parse(readFileSync('examples/page-archetypes/content/dashboards.json','utf8'));
const gap=process.argv.includes('--gap');
const fixture={...original,analytics:gap ? original.analytics.filter(row=>row.date<'2026-10-22') : original.analytics.filter(row=>row.date!=='2026-10-28'&&!(row.category==='Research'&&['2026-10-20','2026-10-24'].includes(row.date))).map(row=>row.date>='2026-10-22'&&row.date<='2026-10-28'?{...row,sessions:0,downloads:0,completions:0,duration_seconds:0}:row)};
const schema=JSON.parse(readFileSync('examples/page-archetypes/contracts/dashboards.schema.json','utf8'));
assert.ok(new Validator(schema,'2020-12',true).validate(fixture).valid,'Sparse fixture must remain schema-valid');
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
  const site=join(temp,'examples/jekyll',family),dist=join(temp,'sparse-dist',framework,family);
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
   if(gap){
    assert.match(await page.getByRole('status').filter({hasText:'No observations'}).innerText(),/No observations are available/);
    assert.equal(await page.locator('#analytics-source tbody tr').count(),0);
    const outputs=await page.locator('[aria-label="Analytics summary"] output').allTextContents();
    if(javascriptEnabled || framework==='react') assert.deepEqual(outputs,['Unavailable','Unavailable','Unavailable','Unavailable']);
    else assert.ok(outputs.every(value=>value.trim()==='—'),'Static placeholders must not invent zero rates');
    const navigation=page.getByRole('navigation',{name:'Dashboard navigation',exact:true});
    if(javascriptEnabled){
     const toggle=page.getByRole('button',{name:'Dashboard navigation',exact:true});await toggle.click();assert.equal(await navigation.isVisible(),true);
     assert.equal(await page.getByRole('button',{name:'Download filtered CSV'}).isDisabled(),true);
     await page.getByLabel('Start date',{exact:true}).fill('2026-10-21');await page.getByLabel('End date',{exact:true}).fill('2026-10-21');await page.getByRole('button',{name:'Apply filters'}).click();
     assert.equal(await page.getByRole('button',{name:'Download filtered CSV'}).isDisabled(),false);
     const axe=await new AxeBuilder({page}).include('main').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(({id})=>id),[],`${family} ${framework}: automated accessibility`);
    }else assert.equal(await navigation.isVisible(),true);
   }else{
   const status=page.getByRole('status').filter({hasText:'Partial data:'});
   assert.match(await status.innerText(),/Partial data: 4 expected observations are missing/);
   assert.equal(await page.locator('#analytics-source tbody tr').count(),17);
   const outputs=await page.locator('[aria-label="Analytics summary"] output').allTextContents();
   if(javascriptEnabled || framework==='react') assert.deepEqual(outputs,['0','0','Unavailable','Unavailable']);
   else assert.ok(outputs.every(value=>value.trim()==='—'),'Static placeholders must not invent zero rates');
   if(!javascriptEnabled && framework==='react') assert.ok(await page.getByText('Comparison unavailable: selected period has missing observations.').count()>=1);

   const navigation=page.getByRole('navigation',{name:'Dashboard navigation',exact:true});
   if(javascriptEnabled){
    const toggle=page.getByRole('button',{name:'Dashboard navigation',exact:true});await toggle.click();assert.equal(await navigation.isVisible(),true);
    assert.ok(await page.getByText('Comparison unavailable: selected period has missing observations.').count()>=1);
    const category=page.getByRole('combobox',{name:'Category',exact:true}),start=page.getByLabel('Start date',{exact:true}),end=page.getByLabel('End date',{exact:true});
    await category.selectOption('Research');await start.fill('2026-10-24');await end.fill('2026-10-24');await page.getByRole('button',{name:'Apply filters'}).click();
    assert.match(await page.getByRole('status').filter({hasText:'No observations'}).innerText(),/No observations are available/);
    assert.deepEqual(await page.locator('[aria-label="Analytics summary"] output').allTextContents(),['Unavailable','Unavailable','Unavailable','Unavailable']);
    assert.equal(await page.getByRole('button',{name:'Download filtered CSV'}).isDisabled(),true);
    assert.equal(await page.getByText('No observations are available for this chart. Exact values appear in the data table.',{exact:true}).count(),3);
    await start.fill('2026-10-25');await end.fill('2026-10-25');await page.getByRole('button',{name:'Apply filters'}).click();
    assert.deepEqual(await page.locator('[aria-label="Analytics summary"] output').allTextContents(),['0','0','Unavailable','Unavailable']);
    assert.equal(await page.getByRole('button',{name:'Download filtered CSV'}).isDisabled(),false);
    await start.fill('2026-10-26');await end.fill('2026-10-26');await page.getByRole('button',{name:'Apply filters'}).click();
    assert.ok(await page.getByText('Comparison unavailable: preceding value is zero.').count()>=1);
    const axe=await new AxeBuilder({page}).include('main').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(({id})=>id),[],`${family} ${framework}: automated accessibility`);
   }else assert.equal(await navigation.isVisible(),true);
   }
   if(!javascriptEnabled){const view=analyticsView(fixture,{start:'2026-10-22',end:'2026-10-28',category:'All',coverage:{start:'2026-09-03',end:'2026-10-28'}});for(const [title,expected] of [['Session trend',view.days.map(day=>[day.date,String(day.sessions)])],['Download trend',view.days.map(day=>[day.date,String(day.downloads)])],['Category comparison',view.categories.filter(category=>view.rows.some(row=>row.category===category.name)).map(category=>[category.name,String(category.sessions),String(view.previousCategories?.find(previous=>previous.name===category.name)?.sessions??'Unavailable')])]]){const figure=page.locator('figure').filter({has:page.getByRole('heading',{name:title,exact:true})}),rows=await figure.locator('tbody tr:has(th[scope=row])').evaluateAll(items=>items.map(row=>[...row.children].map(cell=>cell.textContent.trim())));assert.deepEqual(rows,expected,`${family} ${framework} ${base}: ${title} static sparse rows`);}}
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No page overflow at 320px');
   assert.deepEqual(errors,[]);await context.close();
  }console.log(`${family} ${framework} ${base}: sparse/gap data handled with and without JavaScript`);
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
 }
} finally {if(browser)await browser.close();rmSync(temp,{recursive:true,force:true});}
