// Builds isolated copies with schema-valid hostile category and directory text.
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
const fixture=structuredClone(original), category='</select><img src=x onerror="window.__nightjarInjected=1"><select>', payload='<img src=x onerror="window.__nightjarInjected=1">', name=`AAA ${payload}`, personId='person"]#';
const email=`odd">${payload}@example.invalid`;fixture.categories.push(category);fixture.people[0].name=name;fixture.people[0].id=personId;fixture.people[0].email=email;
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
   await page.goto(`http://127.0.0.1:${server.address().port}${base}examples/dashboard-analytics/`,{waitUntil:'networkidle'});
   assert.equal(await page.locator('img[src="x"]').count(),0,'category text must not create elements');assert.equal(await page.evaluate(()=>window.__nightjarInjected),undefined);
   const categories=page.getByRole('combobox',{name:'Category',exact:true});assert.equal(await categories.locator('option').last().textContent(),category);
   if(javascriptEnabled){await categories.selectOption({label:category});await page.getByRole('button',{name:'Apply filters'}).click();assert.match(await page.locator('p[role=status]').first().innerText(),/No observations are available/);assert.equal(await page.locator('#analytics-source tbody tr').count(),0);await categories.selectOption({label:'Research'});await page.getByRole('button',{name:'Apply filters'}).click();assert.ok(await page.locator('#analytics-source tbody tr').count()>0);}
   await page.goto(`http://127.0.0.1:${server.address().port}${base}examples/dashboard-administration/`,{waitUntil:'networkidle'});
   assert.equal(await page.locator('img[src="x"]').count(),0,'directory text must not create elements');assert.equal(await page.evaluate(()=>window.__nightjarInjected),undefined);const directoryText=await page.locator('#people-table').textContent();assert.ok(directoryText.includes(name));assert.ok(directoryText.includes(email));
   if(javascriptEnabled){await page.getByRole('button',{name:`Edit ${name}`,exact:true}).click();assert.equal(await page.getByLabel('Full name').inputValue(),name);const edited=`Edited ${payload}`;await page.getByLabel('Full name').fill(edited);await page.getByLabel('Email address').fill('edited@example.invalid');await page.getByRole('button',{name:'Save person locally'}).click();await page.getByRole('checkbox',{name:`Select ${edited}`,exact:true}).check();await page.getByRole('button',{name:'Suspend selected'}).click();await page.getByRole('dialog').getByRole('button',{name:'Confirm change'}).click();const row=page.locator('#people-table tbody tr').filter({hasText:edited});assert.match(await row.innerText(),/Suspended/);assert.equal(await page.locator('img[src="x"]').count(),0);assert.equal(await page.evaluate(()=>window.__nightjarInjected),undefined);}
   assert.deepEqual(errors,[]);await context.close();
  }console.log(`${family} ${framework} ${base}: hostile category and directory text safely handled with and without JavaScript`);

  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
 }
} finally {if(browser)await browser.close();rmSync(temp,{recursive:true,force:true});}
