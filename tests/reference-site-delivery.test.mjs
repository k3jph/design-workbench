import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker,{createReferenceWorker} from '../infra/reference-sites/worker.mjs';

test('reference delivery rejects archive and write traffic without invoking assets',async()=>{
 let calls=0;const env={ASSETS:{fetch:async()=>{calls++;return new Response('public')}}};
 for(const method of ['GET','HEAD','POST','PUT','DELETE']){
  for(const path of ['/_archive','/_archive/v/2.0.0/manifest.json']){
   const response=await worker.fetch(new Request('https://reference.invalid'+path,{method}),env);
   assert.equal(response.status,404);assert.equal(response.headers.get('cache-control'),'no-store');
  }
 }
 for(const method of ['POST','PUT','DELETE','PATCH']){
  const response=await worker.fetch(new Request('https://reference.invalid/examples/contact/',{method}),env);
  assert.equal(response.status,405);assert.equal(response.headers.get('allow'),'GET, HEAD');
 }
 assert.equal(calls,0);
});

test('reference delivery preserves asset responses and applies safe content headers',async()=>{
 for(const method of ['GET','HEAD']){
  const request=new Request('https://reference.invalid/preview/examples/article/?view=full',{method});let received;
  const response=await worker.fetch(request,{ASSETS:{fetch:async value=>{received=value;return new Response(method==='GET'?'Verified static article':null,{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=60'}})}}});
  assert.equal(received,request);assert.equal(response.status,200);
  assert.equal(response.headers.get('content-type'),'text/html; charset=utf-8');
  assert.equal(response.headers.get('cache-control'),'public, max-age=60');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.equal(response.headers.get('referrer-policy'),'strict-origin-when-cross-origin');
  assert.equal(await response.text(),method==='GET'?'Verified static article':'');
 }
});

test('reference rollout has only static runtime authority and preserves main Worker identity',async()=>{
 const plan=JSON.parse(await readFile('infra/reference-sites/deployment-plan.json','utf8'));
 assert.equal(plan.advancedArchiveEnabled,false);assert.deepEqual(plan.allowedRuntimeBindings,['ASSETS']);assert.equal(plan.assetsRunWorkerFirst,true);
 assert.equal(plan.newReferenceWorkers.length,6);assert.equal(new Set(plan.newReferenceWorkers.map(x=>x.host)).size,6);
 assert.deepEqual(plan.existingMainWorkers.map(x=>x.worker),['martlettheme','krigsvoldtheme']);
 for(const family of ['martlet','krigsvold'])for(const framework of ['astro','react','jekyll']){
  const entry=plan.newReferenceWorkers.find(x=>x.family===family&&x.framework===framework);
  assert.equal(entry.host,`${framework}.${family}design.dev`);assert.equal(entry.legacyQueryReference,false);assert.equal(entry.deliveryMode,'native-static-assets');assert.deepEqual(entry.runtimeBindings,[]);
  assert.ok(!plan.existingMainWorkers.some(x=>x.worker===entry.worker));
 }
});

test('React component-directory root aliases redirect with or without queries and retain every value',async()=>{
 const react=createReferenceWorker({legacyQueryReference:true});
 let calls=0;const env={ASSETS:{fetch:async()=>{calls++;return new Response('asset')}}};
 for(const root of ['/','/index.html','/preview','/preview/','/preview/index.html'])for(const method of ['GET','HEAD'])for(const query of ['','palette=dark','appearance=dark','page=unknown&component=Button&appearance=dark','page=&palette=dark','component=DataTable&note=a%20b','workspace=notes&shell=side','shell=none&extra=%2Fexamples%2F']){
  const response=await react.fetch(new Request('https://reference.invalid'+root+(query?'?'+query:''),{method}),env);
  assert.equal(response.status,308);const location=new URL(response.headers.get('location'));
  assert.equal(location.origin,'https://reference.invalid');assert.equal(location.pathname,['/','/index.html'].includes(root)?'/reference/':'/preview/reference/');assert.equal(location.search,query?'?'+query:'');
 }
 assert.equal(calls,0);
});

test('gallery pagination and non-root query routes remain assets instead of legacy redirects',async()=>{
 const react=createReferenceWorker({legacyQueryReference:true});
 const paths=['/examples/?page=2','/preview/examples/?page=2','/examples/dashboard-analytics/?page=2&component=chart','/reference/?page=start','/preview/reference/?workspace=notes','/docs/v/1.0.0/?page=2'];
 for(const path of paths){let calls=0;const response=await react.fetch(new Request('https://reference.invalid'+path),{ASSETS:{fetch:async()=>{calls++;return new Response('exact asset')}}});assert.equal(calls,1);assert.equal(response.status,200);assert.equal(await response.text(),'exact asset');}
});

test('native delivery preserves root selectors while the legacy adapter stays opt-in',async()=>{
 for(const path of ['/?page=2','/index.html?component=Card','/preview/?page=unknown','/preview/index.html?workspace=notes','/?shell=side']){
  let calls=0;const response=await worker.fetch(new Request('https://reference.invalid'+path),{ASSETS:{fetch:async()=>{calls++;return new Response('framework asset')}}});
  assert.equal(calls,1);assert.equal(response.status,200);assert.equal(response.headers.get('location'),null);assert.equal(await response.text(),'framework asset');
 }
 assert.throws(()=>createReferenceWorker({legacyQueryReference:'true'}),/build-time boolean/);
});

test('React compatibility selectors cannot bypass archive or write-method boundaries',async()=>{
 const react=createReferenceWorker({legacyQueryReference:true});let calls=0;
 const env={ASSETS:{fetch:async()=>{calls++;return new Response('unexpected')}}};
 for(const [path,method,status] of [['/_archive/catalog?page=guide','PUT',404],['/_archive?page=start','GET',404],['/?component=Button','POST',405],['/preview/index.html?shell=side','DELETE',405]]){
  const response=await react.fetch(new Request('https://reference.invalid'+path,{method}),env);assert.equal(response.status,status);assert.equal(response.headers.get('location'),null);
 }
 assert.equal(calls,0);
});
