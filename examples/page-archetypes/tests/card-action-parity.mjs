// Focused visual-grammar checks against root-path Jekyll, Astro and React builds.
// See READING-VERIFICATION.md for fixture setup and audit limitations.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const roots={jekyll:process.env.NIGHTJAR_JEKYLL_ROOT,astro:process.env.NIGHTJAR_ASTRO_ROOT||'examples/astro-slice/dist',react:process.env.NIGHTJAR_REACT_ROOT||'examples/react-catalog/dist'};
if(!roots.jekyll)throw Error('Set NIGHTJAR_JEKYLL_ROOT; see READING-VERIFICATION.md.');
async function serve(root){const server=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname,name=decodeURIComponent(path.slice(1)),file=resolve(root,name.endsWith('/')?`${name}index.html`:name);if(!file.startsWith(root+'/'))return res.writeHead(403).end();try{const bytes=await readFile(file),types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'};res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream'}).end(bytes)}catch{res.writeHead(404).end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));return server}
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{for(const family of ['martlet','krigsvold'])for(const framework of ['jekyll','astro','react']){
 const server=await serve(resolve(roots[framework],family)),origin=`http://127.0.0.1:${server.address().port}`;
 try{for(const width of [320,1440])for(const js of [true,false]){
  const context=await browser.newContext({viewport:{width,height:900},javaScriptEnabled:js,reducedMotion:'reduce'}),page=await context.newPage();
  for(const [route,label,target] of [['home','Explore the work','/examples/projects/'],['pricing','View the session','/examples/event/']]){
   await page.goto(`${origin}/examples/${route}/`,{waitUntil:'networkidle'});const action=page.getByRole('link',{name:label,exact:true});
   assert.equal(await action.getAttribute('href'),target);const style=await action.evaluate(n=>{const s=getComputedStyle(n);return {display:s.display,background:s.backgroundColor,height:n.getBoundingClientRect().height,padding:parseFloat(s.paddingLeft)}});
   assert.ok(['inline-flex','flex','inline-block','block'].includes(style.display),`${family} ${framework} ${route}: action presentation ${style.display}`);assert.notEqual(style.background,'rgba(0, 0, 0, 0)');assert.ok(style.height>=40 && style.padding>=8);
   const card=route==='home'?page.getByRole('heading',{name:'Read the coast'}).locator('..'):page.getByRole('heading',{name:'Introduction'}).locator('..');
   assert.ok(await card.evaluate(n=>parseFloat(getComputedStyle(n).borderTopWidth)>=1),`${family} ${framework} ${route}: card rule`);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(js){
    await action.focus();assert.ok(await action.evaluate(n=>document.activeElement===n));
    assert.deepEqual((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id),[]);
    if(width===1440){
     await page.getByRole('button',{name:'Dark mode'}).click();
     await page.waitForTimeout(500); // Let source-site color transitions settle before measuring contrast.
     assert.deepEqual((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({html:n.html,why:n.failureSummary}))})),[]);
     await page.getByRole('button',{name:'Light mode'}).click();
    }
   }
  }
  for(const [route,label] of [['changelog','Added'],['workspace','Selected record']]){
   await page.goto(`${origin}/examples/${route}/`,{waitUntil:'networkidle'});
   const heading=page.getByRole('heading',{name:label,exact:true});
   const size=await heading.evaluate(n=>parseFloat(getComputedStyle(n).fontSize));
   assert.ok(Math.abs(size-19.2)<.2,`${family} ${framework} ${route}: nested heading size ${size}`);
  }
  await context.close();
 }console.log(`${family} ${framework}: card rules, styled action links, keyboard and no-JS passed`)}finally{server.closeAllConnections();await new Promise(r=>server.close(r))}
}}finally{await browser.close()}
