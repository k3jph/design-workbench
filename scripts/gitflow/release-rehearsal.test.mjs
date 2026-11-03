import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rehearseRelease} from './release-rehearsal.mjs';

const input={tag:'v1.2.3',packageVersion:'1.2.3',sourceVersion:'1.2.3',onMainFirstParent:true,protectedTag:true,registryState:'absent'};
function fixture(fail) {
  const calls=[];
  const fn=(name, result)=>async (...args)=>{calls.push([name,...args]); if (fail===name) throw new Error(`${name} failed`); return result;};
  return {calls,adapters:{install:fn('install'),build:fn('build'),test:fn('test'),pack:fn('pack','archive'),inspect:fn('inspect',true),publish:fn('publish'),verify:fn('verify',true),release:fn('release')}};
}
test('offline release rehearsal preserves ordering and stable tag', async()=>{
  const {calls,adapters}=fixture(); await rehearseRelease(input,adapters);
  assert.deepEqual(calls.map(x=>x[0]),['install','build','test','pack','inspect','publish','verify','release']);
  assert.deepEqual(calls.find(x=>x[0]==='publish'),['publish','archive','latest']);
});
test('existing versions, failed builds and failed tests prevent publication', async()=>{
  for (const f of ['build','test']) {const {calls,adapters}=fixture(f); await assert.rejects(rehearseRelease(input,adapters)); assert.equal(calls.some(x=>x[0]==='publish'),false);}
  for (const state of ['present','unknown']) {const {calls,adapters}=fixture(); await assert.rejects(rehearseRelease({...input,registryState:state},adapters)); assert.equal(calls.length,0);}
});
test('post-publish verification failure prevents release creation', async()=>{
  const {calls,adapters}=fixture('verify'); await assert.rejects(rehearseRelease(input,adapters));
  assert.equal(calls.some(x=>x[0]==='publish'),true);
  assert.equal(calls.some(x=>x[0]==='release'),false);
});
