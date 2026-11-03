// Confirm the portable report's native download contract, independent of the server MIME type.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {cp,mkdtemp,readFile,rm,symlink,writeFile} from 'node:fs/promises';
import {basename,extname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {chromium,expect} from '@playwright/test';
import {Validator} from '@cfworker/json-schema';

const original=process.cwd(),tmp=await mkdtemp(resolve('examples/.report-download-')),fixtureExamples=resolve(tmp,'examples'),ignored=new Set(['node_modules','dist','.astro','test-results']);
const expected=await readFile('examples/page-archetypes/jekyll/assets/examples/observations.csv');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
function run(cmd,args,env){const result=spawnSync(cmd,args,{cwd:tmp,env,encoding:'utf8'});assert.equal(result.status,0,`${cmd} failed:\n${result.stdout}\n${result.stderr}`)}
function build(family,base,framework){const env={...process.env,NIGHTJAR_FAMILY:family,NIGHTJAR_BASE:base,ASTRO_TELEMETRY_DISABLED:'1'};if(framework==='jekyll'){const root=resolve(tmp,`${family}-${base==='/'?'root':'preview'}`);run('python3',['examples/page-archetypes/scripts/build.py','--family',family,'--baseurl',base==='/'?'':base.replace(/\/$/,''),'--destination',root],env);return root}if(framework==='astro'){run('npm',['--prefix','examples/astro-slice','run','build'],env);return resolve(fixtureExamples,'astro-slice/dist',family)}run('node',['examples/react-catalog/build.mjs'],env);return resolve(fixtureExamples,'react-catalog/dist',family)}
async function serve(root,base){const server=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname;if(!path.startsWith(base))return res.writeHead(404).end();const name=decodeURIComponent(path.slice(base.length)),file=resolve(root,name.endsWith('/')?`${name}index.html`:name);if(!file.startsWith(root+'/'))return res.writeHead(403).end();try{const data=await readFile(file),types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2','.csv':'text/plain'};res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(data)}catch{res.writeHead(404).end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));return server}
try{
 for(const name of ['page-archetypes','astro-slice','react-catalog','jekyll'])await cp(resolve(original,'examples',name),resolve(fixtureExamples,name),{recursive:true,filter:path=>!ignored.has(basename(path))&&!basename(path).endsWith('-dist')});
 await symlink(resolve(original,'examples/astro-slice/node_modules'),resolve(fixtureExamples,'astro-slice/node_modules'),'dir');
 const catalogPath=resolve(fixtureExamples,'page-archetypes/content/catalog.json'),catalog=JSON.parse(await readFile(catalogPath,'utf8'));
 const plan=catalog.pages.find(page=>page.id==='pricing').sections.find(section=>section.kind==='plans').items[0];
 plan.action={label:'Download sample plan CSV',url:'/assets/examples/observations.csv',download:'plan-observations.csv'};
 const schema=JSON.parse(await readFile(resolve(fixtureExamples,'page-archetypes/contracts/catalog.schema.json'),'utf8')),result=new Validator(schema,'2020-12',true).validate(catalog);assert.ok(result.valid,JSON.stringify(result.errors));
 await writeFile(catalogPath,JSON.stringify(catalog));for(const family of ['martlet','krigsvold'])await writeFile(resolve(fixtureExamples,'jekyll',family,'_data/examples.json'),JSON.stringify(catalog));
 for(const family of ['martlet','krigsvold'])for(const base of ['/','/preview/'])for(const framework of ['jekyll','astro','react']){
 const label=`${family}/${framework}/${base}`,root=build(family,base,framework);
 const server=await serve(root,base),origin=`http://127.0.0.1:${server.address().port}`;
 try{for(const javascriptEnabled of [false,true]){const context=await browser.newContext({javascriptEnabled,acceptDownloads:true,viewport:{width:320,height:900}}),page=await context.newPage();
  await page.goto(`${origin}${base}examples/report/?keep=1#method`,{waitUntil:'load'});const url=page.url(),downloadLink=page.getByRole('link',{name:'Download example data (CSV)',exact:true}),ordinary=page.getByRole('link',{name:'Observation protocol',exact:true});
  await expect(downloadLink).toHaveAttribute('download','observations.csv');await expect(ordinary).not.toHaveAttribute('download',/.*/);await downloadLink.focus();const pending=page.waitForEvent('download');await page.keyboard.press('Enter');const download=await pending;assert.equal(download.suggestedFilename(),'observations.csv',label);assert.deepEqual(await readFile(await download.path()),expected,`${label}: downloaded bytes`);assert.equal(page.url(),url,`${label}: download must preserve current page state`);await context.close();
  const planContext=await browser.newContext({javascriptEnabled,acceptDownloads:true,viewport:{width:320,height:900}}),planPage=await planContext.newPage();await planPage.goto(`${origin}${base}examples/pricing/?keep=1#plans`,{waitUntil:'load'});const planUrl=planPage.url(),planLink=planPage.getByRole('link',{name:'Download sample plan CSV',exact:true});await expect(planLink).toHaveAttribute('download','plan-observations.csv');await expect(planPage.getByRole('link',{name:'Ask about a group',exact:true})).not.toHaveAttribute('download',/.*/);await planLink.focus();const planPending=planPage.waitForEvent('download');await planPage.keyboard.press('Enter');const planDownload=await planPending;assert.equal(planDownload.suggestedFilename(),'plan-observations.csv',label);assert.deepEqual(await readFile(await planDownload.path()),expected,`${label}: plan bytes`);assert.equal(planPage.url(),planUrl,`${label}: plan download preserves page state`);await planContext.close();
 }console.log(`${label}: report and synthetic plan JS/no-JS keyboard downloads, stable names, bytes and page state passed`);}finally{server.closeAllConnections();await new Promise(r=>server.close(r))}
 }
 // Render deliberately invalid fixture data to verify escaping even if a caller bypasses schema validation.
 const hostile='evil.csv" onmouseover="window.__nightjarInjected=1';
 catalog.pages.find(page=>page.id==='report').sections.find(section=>section.id==='method').actions[0].download=hostile;plan.action.download=hostile;
 assert.equal(new Validator(schema,'2020-12',true).validate(catalog).valid,false,'hostile filename must fail schema');
 await writeFile(catalogPath,JSON.stringify(catalog));for(const family of ['martlet','krigsvold'])await writeFile(resolve(fixtureExamples,'jekyll',family,'_data/examples.json'),JSON.stringify(catalog));
 for(const family of ['martlet','krigsvold'])for(const base of ['/','/preview/'])for(const framework of ['jekyll','astro','react']){
  const root=build(family,base,framework),server=await serve(root,base),origin=`http://127.0.0.1:${server.address().port}`,label=`${family}/${framework}/${base}`;
  try{for(const javascriptEnabled of [false,true]){const context=await browser.newContext({javascriptEnabled}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));for(const [route,name] of [['report','Download example data (CSV)'],['pricing','Download sample plan CSV']]){await page.goto(`${origin}${base}examples/${route}/`,{waitUntil:'load'});const link=page.getByRole('link',{name,exact:true});await expect(link).toHaveAttribute('download',hostile);await expect(link).not.toHaveAttribute('onmouseover',/.*/);await link.hover();assert.equal(await page.evaluate(()=>window.__nightjarInjected),undefined,`${label}: injected event handler`);}assert.deepEqual(errors,[],`${label}: script errors`);await context.close();}console.log(`${label}: invalid hostile filename remains an inert attribute with JS/no-JS`);}finally{server.closeAllConnections();await new Promise(r=>server.close(r))}
 }
}finally{await browser.close();await rm(tmp,{recursive:true,force:true})}
