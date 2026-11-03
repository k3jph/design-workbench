import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium,firefox,webkit,request} from '@playwright/test';
import {configureBehavior,deepBehavior,contactBehavior,responsiveMedia} from './behavior.mjs';

const maps=JSON.parse(await readFile(new URL('./target-maps.json',import.meta.url),'utf8'));
const catalogBytes=await readFile(new URL('./fixtures/catalog.json',import.meta.url));
const catalog=JSON.parse(catalogBytes),engine=process.env.SITE_BROWSER||process.argv.slice(2).find(x=>!x.startsWith('--'))||'chromium',mapName=process.env.SITE_TARGET_MAP||'jekyll-stage';
assert.ok(['chromium','firefox','webkit'].includes(engine));assert.equal(catalog.pages.length,50);assert.equal(new Set(catalog.pages.map(x=>x.id)).size,50);for(const p of catalog.pages)assert.match(p.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
assert.ok(Object.hasOwn(maps.maps,mapName),'Use a checked-in fixed target map');const hosts=maps.maps[mapName];
const allowed=new Set(['martletdesign-jekyll-reference.k3jph.workers.dev','krigsvolddesign-jekyll-reference.k3jph.workers.dev','jekyll.martletdesign.dev','jekyll.krigsvolddesign.dev']);
for(const h of hosts){const u=new URL(h.origin);assert.equal(u.protocol,'https:');assert.ok(allowed.has(u.hostname));assert.equal(u.username+u.password+u.search+u.hash,'');assert.equal(u.port,'');assert.equal(u.pathname,'/');assert.match(h.sourceCommit,/^[a-f0-9]{40}$/);assert.match(h.sourceZipSha256,/^[a-f0-9]{64}$/);assert.ok(['martlet','krigsvold'].includes(h.family));assert.equal(h.framework,'jekyll');for(const b of h.bases)assert.match(b,/^\/(?:preview\/)?(?:docs\/v\/1\.0\.0\/)?$/)}
if(process.argv.includes('--validate-only')){console.log(JSON.stringify({status:'validated-not-executed',map:mapName,hosts:hosts.length,bases:hosts.map(h=>h.bases),recipes:50,engine}));process.exit(0)}
const verifyMode=process.env.SITE_VERIFY_MODE||'full';assert.ok(['full','route-lifecycle-smoke'].includes(verifyMode));
const outDir=process.env.SITE_RESULTS_DIR||'results';await mkdir(outDir,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const report={schemaVersion:1,map:mapName,verificationMode:verifyMode,fullAcceptance:false,engine,observedAt:new Date().toISOString(),node:process.version,runnerSha256:sha(await readFile(new URL('./run.mjs',import.meta.url))),behaviorSha256:sha(await readFile(new URL('./behavior.mjs',import.meta.url))),catalogSha256:sha(catalogBytes),hosts:[],progress:[],limitations:['Only automated, bounded browser observations are claimed.','No manual assistive technology, RTL/localization, sustained use, native browser UI zoom or physical print/pagination certification.','Axe incomplete findings remain incomplete.','HTTP source proof is checked; administrator immutability and Worker binding isolation are not established by a browser test.','Firefox no-JavaScript routes are tested without awaiting the known nonsettling document.fonts.ready operation.']};
let browser,http;const overall=setTimeout(()=>{report.status='failed';report.error='Overall live-browser deadline exceeded (13 minutes)';void save().catch(()=>{});console.error('FAIL overall live-browser deadline exceeded (13 minutes)');setTimeout(()=>process.exit(1),2000);Promise.allSettled([browser?.close(),http?.dispose()]).finally(()=>process.exit(1))},13*60*1000);
async function save(){await writeFile(`${outDir}/live-${mapName}-${engine}.json`,JSON.stringify(report,null,2)+'\n')}
function progress(t,operation,state,extra={}){const p={family:t.family,framework:t.framework,base:t.base,operation,state,at:new Date().toISOString(),...extra};report.progress.push(p);console.log(JSON.stringify(p))}
async function bounded(name,fn,timeout=30000){let timer;try{return await Promise.race([Promise.resolve().then(fn),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(name+' exceeded '+timeout+'ms deadline')),timeout)})])}finally{clearTimeout(timer)}}
async function operation(t,name,fn,timeout=30000){const start=Date.now();progress(t,name,'start');try{const value=await bounded(name,fn,timeout);progress(t,name,'passed',{elapsedMs:Date.now()-start});return value}catch(e){progress(t,name,'failed',{elapsedMs:Date.now()-start,error:e.message});throw e}}
async function fontsReady(page,t,name){await operation(t,'font loading '+name,()=>page.evaluate(()=>document.fonts.ready.then(()=>true)),15000)}
async function sourceProof(host){const r=await bounded('deployment source proof',()=>http.get(host.origin+host.proofPath,{maxRedirects:0}),20000);assert.equal(r.status(),200);const bytes=await r.body(),d=JSON.parse(bytes);assert.equal(d.family,host.family);assert.equal(d.framework,host.framework);assert.equal(d.sourceCommit,host.sourceCommit);assert.equal(d.version,host.version);assert.equal(d.sourceZipSha256,host.sourceZipSha256);assert.equal(d.advancedArchiveEnabled,false);assert.deepEqual(d.runtimeBindings,[]);assert.equal(d.deliveryMode,'native-cloudflare-static-assets');assert.equal(d.runtimeSecrets,false);return {sha256:sha(bytes),sourceCommit:d.sourceCommit,sourceZipSha256:d.sourceZipSha256,advancedArchiveEnabled:false,proofClaimedBindings:d.runtimeBindings}}
async function routeFrames(t){
 const result=[],smoke=process.env.SITE_VERIFY_MODE==='route-lifecycle-smoke',recipes=smoke?['home','place','pricing','gallery','pricing'].map(id=>catalog.pages.find(p=>p.id===id)):catalog.pages;
 for(const javaScriptEnabled of [true,false]){
  const context=await browser.newContext({javaScriptEnabled,viewport:{width:320,height:900},reducedMotion:'reduce'});let completed=0;
  try{for(const recipe of recipes){
   // Each route owns its page and network ledger. No previous navigation can
   // cancel resources and contaminate the next route's failure assertions.
   const page=await context.newPage(),failures=[],pending=new Set();let lastNetworkChange=Date.now();
   const local=r=>new URL(r.url()).origin===t.origin;
   page.on('pageerror',e=>failures.push(e.message));
   page.on('request',r=>{if(local(r)){pending.add(r);lastNetworkChange=Date.now()}});
   page.on('requestfinished',r=>{pending.delete(r);lastNetworkChange=Date.now()});
   page.on('requestfailed',r=>{pending.delete(r);lastNetworkChange=Date.now();if(local(r))failures.push('failed '+r.url()+' '+r.failure()?.errorText)});
   page.on('response',r=>{if(new URL(r.url()).origin===t.origin&&r.status()>=400)failures.push(r.status()+' '+r.url())});
   const url=t.origin+t.base+'examples/'+recipe.id+'/';
   try{await operation(t,`route ${recipe.id} JS=${javaScriptEnabled}`,async()=>{
    const r=await page.goto(url,{waitUntil:'load'});assert.equal(r.status(),200);assert.match(r.headers()['cache-control']||'',/(?:^|,)\s*no-transform\s*(?:,|$)/i,'HTML must prevent automatic edge transformation');assert.equal(await page.locator('main').count(),1);assert.equal(await page.locator('h1').count(),1);assert.equal((await page.locator('h1').textContent()).replace(/\s+/g,' ').trim(),recipe.title.replace(/\s+/g,' ').trim());assert.ok((await page.locator('main').textContent()).replace(/\s+/g,' ').includes(recipe.summary.replace(/\s+/g,' ')));
    // Loading=eager makes every declared image part of this route's asset gate,
    // including images below the fold which otherwise begin loading too late.
    await operation(t,'image loading '+recipe.id,async()=>{
     await page.evaluate(()=>{for(const image of document.images){if(!image.hasAttribute('src')&&!image.hasAttribute('srcset')&&!image.currentSrc){const dialog=image.closest('dialog.example-lightbox');if(!dialog||dialog.open||image.getAttribute('alt')!=='')throw Error('Source-less image is not a dormant decorative lightbox slot')}else image.loading='eager'}document.documentElement.getBoundingClientRect()});
     // Poll from Node: Firefox may not deliver injected asynchronous callbacks
     // when page JavaScript is disabled, although actual resources still load.
     for(;;){const images=await page.evaluate(()=>[...document.images].filter(image=>image.hasAttribute('src')||image.hasAttribute('srcset')||image.currentSrc).map(image=>({src:image.currentSrc||image.src,complete:image.complete,width:image.naturalWidth})));const broken=images.find(image=>image.complete&&image.width<=0);if(broken)throw Error('Image failed or has no decoded width: '+broken.src);if(images.every(image=>image.complete&&image.width>0))break;await new Promise(resolve=>setTimeout(resolve,25))}
    },15000);
    if(javaScriptEnabled&&recipe.id==='gallery'&&await page.locator('[data-gallery] [data-enlarge]').count())await operation(t,'gallery lightbox real image and focus',async()=>{
     const opener=page.locator('[data-gallery] [data-enlarge]').first(),expected=await opener.getAttribute('href'),alt=await opener.locator('img').getAttribute('alt'),dialog=page.locator('dialog.example-lightbox');await opener.focus();await page.keyboard.press('Enter');await dialog.waitFor({state:'visible'});const image=dialog.locator('img');assert.equal(await image.getAttribute('src'),new URL(expected,page.url()).href);assert.equal(await image.getAttribute('alt'),alt);await image.evaluate(image=>image.complete&&image.naturalWidth>0?true:new Promise((resolve,reject)=>{image.addEventListener('load',()=>image.naturalWidth>0?resolve(true):reject(Error('Lightbox image has no decoded width')),{once:true});image.addEventListener('error',()=>reject(Error('Lightbox image failed')),{once:true})}));await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.equal(await opener.evaluate(n=>document.activeElement===n),true,'lightbox Escape returns opener focus');
    },15000);
    if(javaScriptEnabled)await fontsReady(page,t,recipe.id);
    await operation(t,'resource settlement '+recipe.id,async()=>{
     // Zero pending same-origin requests must remain stable across rendering
     // frames and a short event-delivery interval before this page is closed.
     if(javaScriptEnabled)await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));else await page.evaluate(()=>document.documentElement.getBoundingClientRect().width);
     while(pending.size||Date.now()-lastNetworkChange<150)await new Promise(resolve=>setTimeout(resolve,25));
     assert.deepEqual([...pending].map(r=>r.url()),[]);
    },15000);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,recipe.id+' 320px document reflow');assert.deepEqual([...new Set(failures)],[],recipe.id+' local asset/page errors before close');
    assert.equal(pending.size,0,recipe.id+' pending requests before close');await page.close();await new Promise(resolve=>setImmediate(resolve));assert.deepEqual([...new Set(failures)],[],recipe.id+' local asset/page errors after close');
   },45000);completed++}
   finally{if(!page.isClosed())await page.close()}
  }result.push({javaScriptEnabled,routes:completed,viewport:{width:320,height:900},mainHeadingSummaryReflowAndAssets:true,resourceLifecycle:'fresh page; every image loaded; request ledger settled before and after close; no request failure filters'})}
  finally{await context.close()}
 }
 return result;
}

async function noJsContact(t){const c=await browser.newContext({javaScriptEnabled:false}),page=await c.newPage();try{assert.equal((await page.goto(t.origin+t.base+'examples/contact/')).status(),200);assert.equal(await page.locator('[data-demo-form="contact"]').getByLabel('Name',{exact:true}).isDisabled(),true);assert.ok(await page.getByText(/JavaScript is needed for local form validation/).count());return {disabledFallback:true}}finally{await c.close()}}
try{
 const proxy=process.env.HTTPS_PROXY||process.env.HTTP_PROXY;const options=proxy?{proxy:{server:proxy}}:{};
 browser=await {chromium,firefox,webkit}[engine].launch({...options,...engine==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}});http=await request.newContext({...options,timeout:20000});
 const newContext=browser.newContext.bind(browser);browser.newContext=async(...args)=>{const c=await newContext(...args);await c.route('**/*',route=>route.continue());c.setDefaultTimeout(12000);c.setDefaultNavigationTimeout(20000);return c};
 report.httpCacheCoverage={mode:'disabled',method:'Playwright context.route pass-through route.continue()',requestsModified:false,responsesMocked:false,storageContextsPreserved:true,limitation:'Fresh-network assertions only; HTTP cache behavior is not covered.'};report.browserVersion=browser.version();configureBehavior({browser,catalog,bounded,operation,fontsReady});
 for(const host of (verifyMode==='full'?hosts:hosts.slice(0,1))){
  const h={family:host.family,origin:host.origin,sourceCommit:host.sourceCommit,bases:[],status:'running'};report.hosts.push(h);h.before=await sourceProof(host);await save();
  try{for(const base of (verifyMode==='full'?host.bases:host.bases.slice(0,1))){
   const t={...host,base,url:host.origin+base},r={base,status:'running'};h.bases.push(r);await save();
   try{
    r.routes=await operation(t,'full 50 recipe JS-on/off coverage',()=>routeFrames(t),5*60*1000);
    if(verifyMode==='full'){r.contact=await operation(t,'contact validation focus and axe',()=>contactBehavior(t),90000);r.contactNoJs=await operation(t,'contact no-JavaScript fallback',()=>noJsContact(t),30000);
    r.behavior=await operation(t,'authentication dashboards focus scope recovery',()=>deepBehavior(t),180000);
    r.responsiveMedia=await operation(t,'200-percent text resize viewport and print media',()=>responsiveMedia(t),120000)}r.status='passed';await save();
   }catch(e){r.status='failed';r.error=String(e.stack||e);await save();throw e}
  }h.after=await sourceProof(host);assert.equal(h.before.sha256,h.after.sha256,'Deployment changed during browser verification');h.status='passed';await save()}
  catch(e){h.status='failed';h.error=String(e.stack||e);await save();throw e}
 }
 report.status='passed';report.fullAcceptance=verifyMode==='full';
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1;console.error(e)}
finally{clearTimeout(overall);const cleanupDeadline=setTimeout(()=>{report.status='failed';report.error='Browser cleanup exceeded 10 seconds';console.error('FAIL '+report.error);setTimeout(()=>process.exit(1),1000);save().finally(()=>process.exit(1))},10000);try{await browser?.close();await http?.dispose();await save()}finally{clearTimeout(cleanupDeadline)}}
