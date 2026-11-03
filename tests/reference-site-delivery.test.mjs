import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../infra/reference-sites/worker.mjs';

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
 assert.equal(plan.advancedArchiveEnabled,false);assert.deepEqual(plan.runtimeBindings,['ASSETS']);
 assert.equal(plan.newReferenceWorkers.length,6);assert.equal(new Set(plan.newReferenceWorkers.map(x=>x.host)).size,6);
 assert.deepEqual(plan.existingMainWorkers.map(x=>x.worker),['martlettheme','krigsvoldtheme']);
 for(const family of ['martlet','krigsvold'])for(const framework of ['astro','react','jekyll']){
  const entry=plan.newReferenceWorkers.find(x=>x.family===family&&x.framework===framework);
  assert.equal(entry.host,`${framework}.${family}design.dev`);
  assert.ok(!plan.existingMainWorkers.some(x=>x.worker===entry.worker));
 }
});
