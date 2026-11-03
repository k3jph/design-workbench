#!/usr/bin/env node
// Capture the full rendered background of text flagged by axe as indeterminate.
// This deliberately tests only the named text rectangles in a fixed viewport.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,realpath,writeFile} from 'node:fs/promises';
import {extname,relative,resolve,sep} from 'node:path';
import {chromium} from '@playwright/test';

const [site,family,outDir,base='/preview/docs/v/2.0.0/']=process.argv.slice(2);
assert.ok(site&&outDir&&['martlet','krigsvold'].includes(family),'Usage: node gradient-contrast-capture.mjs SITE_ROOT FAMILY NEW_OUTPUT_DIRECTORY [BASE]');
assert.match(base,/^\/(?:[A-Za-z0-9._~-]+\/)*$/);assert.ok(!base.split('/').some(x=>x==='.'||x==='..'));
const root=await realpath(site),out=resolve(outDir);
await mkdir(out); // Fail rather than overwrite an existing observation.
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{try {
 const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);assert.ok(path.startsWith(base));
 let tail=path.slice(base.length);if(!tail||tail.endsWith('/'))tail+='index.html';
 const file=resolve(root,tail),rel=relative(root,file);assert.ok(rel&&rel!=='..'&&!rel.startsWith(`..${sep}`)&&await realpath(file)===file);
 const bytes=await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream'}).end(bytes);
}catch{res.writeHead(404).end()}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const selectors=family==='martlet'?['.eyebrow','#page-title','.page-intro__content > p:nth-child(3)']:['.navbar-brand > span','.eyebrow','#page-title','.col-lg-9 > p:nth-child(3)'];
let browser;
try {
 browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
 const context=await browser.newContext({viewport:{width:320,height:900},deviceScaleFactor:1,reducedMotion:'reduce'}),page=await context.newPage();
 const failures=[];page.on('response',r=>{if(r.status()>=400)failures.push(`${r.status()} ${r.url()}`)});page.on('requestfailed',r=>failures.push(`failed ${r.url()}`));
 const response=await page.goto(`http://127.0.0.1:${server.address().port}${base}examples/contact/`);assert.equal(response.status(),200);
 await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);
 const records=[];
 for(const [i,selector] of selectors.entries()){
  const element=page.locator(selector).first();assert.equal(await element.count(),1);await element.scrollIntoViewIfNeeded();
  const style=await element.evaluate(e=>{const s=getComputedStyle(e),ancestors=[];for(let n=e;n;n=n.parentElement){const a=getComputedStyle(n);ancestors.push({opacity:a.opacity,mixBlendMode:a.mixBlendMode,filter:a.filter})}return {color:s.color,fontSize:s.fontSize,fontWeight:s.fontWeight,background:s.backgroundColor,backgroundImage:s.backgroundImage,ancestors}});
  assert.ok(style.background==='rgba(0, 0, 0, 0)'&&style.backgroundImage==='none','Selected text must have no background of its own');
  assert.ok(style.ancestors.every(a=>a.opacity==='1'&&a.mixBlendMode==='normal'&&a.filter==='none'),'Unsupported opacity, blending or filter');
  const rect=await element.boundingBox();assert.ok(rect&&rect.x>=0&&rect.y>=0&&rect.x+rect.width<=320&&rect.y+rect.height<=900&&rect.width>0&&rect.height>0,'Entire text box must fit in viewport');
  await element.evaluate(e=>e.style.visibility='hidden');const screenshot=`background-${i}.png`;
  await page.screenshot({path:resolve(out,screenshot),clip:rect});await element.evaluate(e=>e.style.removeProperty('visibility'));
  records.push({selector,color:style.color,fontSize:style.fontSize,fontWeight:style.fontWeight,rect,screenshot});
 }
 assert.deepEqual(failures,[]);await writeFile(resolve(out,'capture.json'),JSON.stringify({family,source:'Caller-supplied built output; provenance not attested',browser:browser.version(),viewport:{width:320,height:900},base,records},null,2)+'\n',{flag:'wx'});
 await context.close();
}finally{await browser?.close();server.closeAllConnections();await new Promise(done=>server.close(done));}
