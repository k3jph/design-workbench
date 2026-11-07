import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,cp,mkdir,rm} from 'node:fs/promises';
import {join,resolve,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {build} from 'vite';
import {chromium,firefox,webkit} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const distribution=JSON.parse(await readFile('docs/distribution.json','utf8'));
const engine=process.env.WORKBENCH_BROWSER??'chromium';assert.ok(['chromium','firefox','webkit'].includes(engine));
const proof=resolve('test-results/public-react');await mkdir(proof,{recursive:true});
async function fontsReady(page){let timer;try{await Promise.race([page.evaluate(()=>document.fonts.ready.then(()=>true)),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('Public React consumer font deadline exceeded (15000ms)')),15000))]);}finally{clearTimeout(timer);}}
const browser=await({chromium,firefox,webkit})[engine].launch(engine==='chromium'&&process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH,args:['--no-sandbox']}:{});
try{for(const family of ['martlet','krigsvold']){
 const temp=await mkdtemp(join(tmpdir(),'public-'+family+'-'));let server;
 try{
  const release=distribution.families[family].packages.React;
  assert.equal(release.published,true,'Documented npm route is published');
  const artifact=release.tarball;
  assert.equal(artifact.available,true);
  const response=await fetch(artifact.url,{signal:AbortSignal.timeout(20000)});assert.equal(response.status,200,'Public archive download');
  const bytes=Buffer.from(await response.arrayBuffer());assert.equal(createHash('sha256').update(bytes).digest('hex'),artifact.sha256,'Immutable public release digest');
  await mkdir(join(temp,'vendor'));await writeFile(join(temp,'vendor',family+'-react.tgz'),bytes);
  await writeFile(join(temp,'package.json'),JSON.stringify({name:'public-'+family+'-consumer',private:true,type:'module',scripts:{build:'vite build'},dependencies:{['@'+family+'/react']:release.version,react:'19.3.1','react-dom':'19.3.1'},devDependencies:{vite:'8.3.5'}},null,2)+'\n');
  execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund'],{cwd:temp,stdio:'pipe',timeout:120000});
  execFileSync('npm',['ci','--ignore-scripts','--no-audit','--no-fund'],{cwd:temp,stdio:'pipe',timeout:120000});
  const lock=JSON.parse(await readFile(join(temp,'package-lock.json'),'utf8'));
  assert.equal(lock.packages['node_modules/@'+family+'/react'].version,release.version);
  assert.ok(lock.packages['node_modules/@'+family+'/react'].resolved.startsWith('https://registry.npmjs.org/'),'Consumer uses the public npm package, not a workspace or archive');
  assert.equal(lock.packages['node_modules/'+release.core.name].version,release.core.version,'Real React Core dependency remains pinned');
  await writeFile(join(temp,'index.html'),'<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Public '+family+' consumer</title></head><body><div id="root"></div><script type="module" src="/main.jsx"></script></body></html>');
  await writeFile(join(temp,'main.jsx'),"import React from 'react';import {createRoot} from 'react-dom/client';import App from './App.jsx';createRoot(document.getElementById('root')).render(<App/>);");
  await writeFile(join(temp,'App.jsx'),(await readFile('tests/public-react/App.jsx','utf8')).replaceAll('@F/','@'+family+'/').replaceAll('className="F"','className="'+family+'"').replaceAll('data-F','data-'+family));
  await writeFile(join(temp,'host.css'),`body{margin:0}.consumer-form{display:grid;gap:var(--${family}-region-gap);max-inline-size:64rem}.consumer-form fieldset{display:grid;gap:var(--${family}-group-gap)}.consumer-actions{display:flex;flex-wrap:wrap;gap:1rem}`);
  await build({root:temp,configFile:false,logLevel:'warn',build:{outDir:'dist',emptyOutDir:true}});
  // Preserve a runnable locked consumer and exact public bytes in CI evidence.
  for(const file of ['package.json','package-lock.json','index.html','main.jsx','App.jsx','host.css']){await mkdir(join(proof,family),{recursive:true});await cp(join(temp,file),join(proof,family,file));}await cp(join(temp,'vendor'),join(proof,family,'vendor'),{recursive:true});
  const root=join(temp,'dist');server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');const path=resolve(root,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.woff':'font/woff'})[extname(path)]??'application/octet-stream');res.end(await readFile(path));}catch{res.writeHead(404).end();}});await new Promise(done=>server.listen(0,'127.0.0.1',done));
  const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(15000);
  try{
   await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.locator('h1').waitFor();await fontsReady(page);
   const axe=async()=>assert.deepEqual((await new AxeBuilder({page}).analyze()).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],'Public component consumer axe');
   const active=id=>page.waitForFunction(id=>document.activeElement?.id===id,id);
   for(const mode of ['light','dark']){if(mode==='dark')await page.locator('#appearance').click();await axe();for(const width of [320,360,1280]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'Consumer fits '+width);}await page.addStyleTag({content:'html{font-size:200% !important}'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));await page.screenshot({path:join(proof,family,mode+'-200pct.png'),fullPage:true});await page.reload();}
   await page.locator('#notes').fill('Retain my access requirements.');await page.locator('#submit').click();await active('summary');assert.equal(await page.locator('#summary a').count(),3);await axe();await page.locator('#summary a[href="#email"]').click();await active('email');
   await page.locator('#name').fill('Alex Example');await page.locator('#email').fill('alex@example.org');await page.locator('input[value="studio"]').check();await page.locator('#reminder').check();await page.locator('#submit').click();await page.waitForFunction(()=>document.querySelector('#registration').getAttribute('aria-busy')==='true');await page.locator('#submit').dispatchEvent('click');await active('summary');assert.equal(await page.locator('#notes').inputValue(),'Retain my access requirements.');await page.keyboard.press('Tab');await active('retry');await page.keyboard.press('Enter');await page.getByRole('status').filter({hasText:'recorded'}).waitFor();await active('submit');
   await page.locator('#name').fill('Changed draft');await page.locator('#reset').click();await page.getByRole('dialog').waitFor();assert.equal(await page.evaluate(()=>document.activeElement.textContent.trim()),'Keep editing');await page.keyboard.press('Escape');await active('reset');assert.equal(await page.locator('#name').inputValue(),'Changed draft');await page.locator('#reset').click();await page.getByRole('button',{name:'Discard entries',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#name').value==='');await active('reset');assert.equal(await page.locator('#name').inputValue(),'');assert.deepEqual(errors,[]);
   console.log(family+': npm package installed, clean-ci locked, built and exercised in '+engine+'; native React fields, errors, retained failure/retry and modal reset pass.');
  }finally{await context.close();}
 }finally{if(server)await new Promise(done=>server.close(done));await rm(temp,{recursive:true,force:true});}
}}finally{await browser.close();}
