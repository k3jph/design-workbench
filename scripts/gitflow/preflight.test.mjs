import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registryVersionState,isMainFirstParent} from './preflight.mjs';

const reply=(status,body={})=>({status,json:async()=>body});
const check=(responses)=>registryVersionState(async()=>{const r=responses.shift(); if (r instanceof Error) throw r; return r;},'https://registry.npmjs.org/','@example/core','1.2.3');
test('registry errors and ambiguous responses never mean version absent',async()=>{
  assert.equal(await check([reply(200,{name:'@example/core'}),reply(404)]),'absent');
  assert.equal(await check([reply(200,{name:'@example/core'}),reply(200,{name:'@example/core',version:'1.2.3'})]),'present');
  for (const replies of [[reply(404)],[reply(403)],[new Error('network')],[reply(200,{name:'other'})],[reply(200,{name:'@example/core'}),reply(500)],[reply(200,{name:'@example/core'}),reply(200,{version:'1.2.3'})]]) assert.equal(await check(replies),'unknown');
  assert.equal(await registryVersionState(()=>{},'http://registry.example/','@example/core','1.2.3'),'unknown');
});
test('nonexistent production history is rejected',()=>assert.equal(isMainFirstParent('/tmp','HEAD'),false));
