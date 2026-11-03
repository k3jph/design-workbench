import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from '@playwright/test';
const source=await readFile(new URL('./run.mjs',import.meta.url),'utf8');
const functionText=source.slice(source.indexOf('async function routeFrames(t)'),source.indexOf('\nasync function noJsContact(t)'));
assert.ok(functionText.startsWith('async function routeFrames(t)'));
const ids=['home','place','pricing','gallery'];
const catalog={pages:ids.map(id=>({id,title:id,summary:'Fixture '+id}))};
let mode='delayed-success',served=0,completed=0;
const server=http.createServer((req,res)=>{
 if(req.url.startsWith('/slow.svg')){served++;setTimeout(()=>{if(mode==='network-failure'){req.socket.destroy();return}res.writeHead(200,{'Content-Type':'image/svg+xml'});res.end('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8"/></svg>');completed++},250);return}
 const id=req.url.split('/')[2];res.writeHead(200,{'Content-Type':'text/html'});res.end(`<meta name="viewport" content="width=device-width"><main><h1>${id}</h1><p>Fixture ${id}</p><div style="height:2000px"></div><img loading="lazy" src="/slow.svg?${id}" width="8" height="8"></main>`);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
let timer;const deadline=(name,fn,ms)=>Promise.race([Promise.resolve().then(fn),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(name+' deadline')),ms)})]).finally(()=>clearTimeout(timer));
// Evaluate the actual checked-in route implementation; fixture adapters only
// supply its existing catalog, operations and real browser dependencies.
const routeFrames=new Function('assert','catalog','browser','operation','fontsReady',functionText+';return routeFrames')(assert,catalog,browser,async(t,n,fn,ms)=>{let timeout;try{return await Promise.race([fn(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error(n+' deadline')),ms)})])}finally{clearTimeout(timeout)}},async page=>page.evaluate(()=>document.fonts.ready));
process.env.SITE_VERIFY_MODE='route-lifecycle-smoke';
const target={origin:`http://127.0.0.1:${server.address().port}`,base:'/'};
const results={method:'Actual checked-in routeFrames with real Chromium and delayed lazy assets on loopback HTTP',cases:[]};
try{
 const ok=await routeFrames(target);assert.deepEqual(ok.map(x=>x.routes),[5,5]);assert.equal(served,10);assert.equal(completed,10);results.cases.push({name:'delayed below-fold lazy image settles before fresh-page close',status:'passed',routeStates:10,served,completed});
 mode='network-failure';let rejected=false;try{await routeFrames(target)}catch(e){rejected=true;results.cases.push({name:'real delayed socket failure is rejected',status:'passed',observedError:e.message})}assert.equal(rejected,true);
 results.status='passed';console.log(JSON.stringify(results,null,2));await writeFile(new URL('../lifecycle-regression-results.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
}finally{await browser.close();await new Promise(r=>server.close(r))}
