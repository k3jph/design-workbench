// Builds isolated copies with repeated category declarations and observations.
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
const fixture=structuredClone(original);fixture.categories.push('Research');const source=fixture.analytics.find(row=>row.date==='2026-10-28'&&row.category==='Research');fixture.analytics.push({...source,sessions:source.sessions+1});
const schema=JSON.parse(readFileSync('examples/page-archetypes/contracts/dashboards.schema.json','utf8'));assert.ok(new Validator(schema,'2020-12',true).validate(fixture).valid,'Repeated categories and observations remain schema-valid');
const researchTotal=fixture.analytics.filter(row=>row.date>='2026-10-22'&&row.date<='2026-10-28'&&row.category==='Research').reduce((sum,row)=>sum+row.sessions,0);
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
   page.on('console',message=>{if(/same key|unique .key/i.test(message.text()))errors.push(message.text())});
   const route=`http://127.0.0.1:${server.address().port}${base}examples/dashboard-analytics/`;await page.goto(route,{waitUntil:'networkidle'});
   const category=page.getByRole('combobox',{name:'Category',exact:true});assert.equal(await category.locator('option').filter({hasText:'Research'}).count(),1,'duplicate declarations produce one category choice');
   const sourceTable=page.locator('#analytics-source tbody');assert.equal(await sourceTable.locator('tr').count(),22,'all observations remain present');
   const categoryTable=page.locator('table').filter({has:page.locator('caption',{hasText:'Category comparison'})});const research=categoryTable.locator('tbody tr').filter({hasText:'Research'});assert.equal(await research.count(),1,'one comparison per category');assert.equal(Number(await research.locator('td').first().textContent()),researchTotal,'all observations contribute to the category total');
   if(javascriptEnabled){await category.selectOption('Research');await page.getByRole('button',{name:'Apply filters'}).click();assert.equal(await sourceTable.locator('tr').count(),8);assert.equal((await page.locator('[aria-label="Analytics summary"] output').first().innerText()).replaceAll(',',''),String(researchTotal));await category.selectOption('');await page.getByRole('button',{name:'Apply filters'}).click();assert.equal(await sourceTable.locator('tr').count(),22);}else assert.ok(await category.isDisabled());
   assert.deepEqual(errors,[]);await context.close();
  }console.log(`${family} ${framework} ${base}: category declarations deduplicated; observations preserved`);

  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
 }
} finally {if(browser)await browser.close();rmSync(temp,{recursive:true,force:true});}
