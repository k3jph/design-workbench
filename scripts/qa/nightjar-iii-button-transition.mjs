// Sample actual button colors through state changes; do not suppress axe or animations.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname,sep} from 'node:path';
import {chromium,firefox,webkit} from 'playwright';
const root=resolve(process.argv[2]),family=process.argv[3],engine=process.env.DESIGN_BROWSER||'chromium';
assert.ok(['martlet','krigsvold'].includes(family));assert.ok(['chromium','firefox','webkit'].includes(engine));
const server=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost'),p=resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));if(!p.startsWith(root+sep)){res.writeHead(403).end();return;}const data=await readFile(p);res.writeHead(200,{'Content-Type':{'.html':'text/html','.css':'text/css','.js':'application/javascript','.woff2':'font/woff2'}[extname(p)]||'application/octet-stream'}).end(data);}catch{res.writeHead(404).end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));const browser=await ({chromium,firefox,webkit})[engine].launch(engine==='chromium'&&process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{});
const rgb=value=>{const m=value.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);assert.ok(m,`Expected opaque RGB, got ${value}`);return m.slice(1).map(Number)};
const lum=value=>{const [r,g,b]=rgb(value).map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return .2126*r+.7152*g+.0722*b;};
const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
try {
 for (const reducedMotion of ['no-preference','reduce']) {
  const context=await browser.newContext({reducedMotion});const page=await context.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/form/`);await page.locator('#submit').waitFor();
  for (const mode of ['light','dark']) {
   if (mode==='dark') await page.locator('#appearance').click();
   await page.mouse.move(0,0);await page.waitForTimeout(250);
   const button=page.locator('#submit');
   const trace=await button.evaluate(async node=>{
    const read=phase=>{const c=getComputedStyle(node);return {phase,color:c.color,background:c.backgroundColor,disabled:node.disabled,hover:node.matches(':hover'),active:node.matches(':active')}};
    node.disabled=true;await new Promise(resolve=>setTimeout(resolve,250));const result=[read('disabled')];node.disabled=false;
    result.push(read('enable-immediate'));for(let i=0;i<14;i++){await new Promise(requestAnimationFrame);result.push(read('enable-frame'));}return result;
   });
   for (const sample of trace.filter(s=>!s.disabled)) assert.ok(contrast(sample.color,sample.background)>=4.5,`${family} ${engine} ${mode} ${reducedMotion} ${sample.phase} ${JSON.stringify(sample)} ratio ${contrast(sample.color,sample.background)}`);
   const samples=await button.evaluate(async node=>{node.focus();await new Promise(requestAnimationFrame);const c=getComputedStyle(node);return {color:c.color,background:c.backgroundColor,focused:document.activeElement===node};});assert.ok(samples.focused);assert.ok(contrast(samples.color,samples.background)>=4.5,`${family}: focused action contrast`);
   await button.hover();const hovered=await button.evaluate(async node=>{const values=[];for(let i=0;i<14;i++){const c=getComputedStyle(node);values.push({color:c.color,background:c.backgroundColor,hover:node.matches(':hover')});await new Promise(requestAnimationFrame);}return values;});assert.ok(hovered.every(s=>s.hover));for(const sample of hovered) assert.ok(contrast(sample.color,sample.background)>=4.5,`${family} ${mode}: hover transition ${JSON.stringify(sample)}`);
   await page.mouse.down();const active=await button.evaluate(node=>{const c=getComputedStyle(node);return {color:c.color,background:c.backgroundColor,active:node.matches(':active')}});assert.ok(active.active);assert.ok(contrast(active.color,active.background)>=4.5,`${family}: active contrast`);await page.mouse.up();
   await page.mouse.move(0,0);const exited=await button.evaluate(async node=>{const values=[];for(let i=0;i<14;i++){const c=getComputedStyle(node);values.push({color:c.color,background:c.backgroundColor,hover:node.matches(':hover')});await new Promise(requestAnimationFrame);}return values;});assert.ok(exited.every(s=>!s.hover));for(const sample of exited) assert.ok(contrast(sample.color,sample.background)>=4.5,`${family} ${mode}: hover exit transition ${JSON.stringify(sample)}`);
   console.log(`${family}: ${mode} ${reducedMotion} enabled transition, focus, hover and active contrast passed`);
  }
  await context.close();
 }
} finally {await browser.close();server.closeAllConnections();await new Promise(done=>server.close(done));}
