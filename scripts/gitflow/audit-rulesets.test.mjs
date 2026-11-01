import {test} from 'node:test';
import assert from 'node:assert/strict';
import {audit} from './audit-rulesets.mjs';

const fixture = {id:1,name:'main',source:'o/r',target:'branch',enforcement:'active',
  conditions:{ref_name:{include:['refs/heads/main'],exclude:[]}},bypass_actors:[],
  rules:['pull_request','required_status_checks','deletion','non_fast_forward'].map(type=>({type}))};
const api = endpoint => endpoint.includes('?') ? [{id:1,source_type:'Repository'}] : fixture;
test('reports evidence without inferring protections for other refs',()=>{
  const r=audit('o/r',api);
  assert.equal(r.main.pull_request[0].id,1);
  assert.match(r.main.pull_request[0].warnings[0],/approving review/);
  assert.match(r.main.required_status_checks[0].warnings[0],/CI checks/);
  assert.equal(r.develop.pull_request,'not demonstrated');
  assert.equal(r.version_tags.deletion,'not demonstrated');
});
test('surfaces bypass actors even where review and CI parameters are present',()=>{
  const detail={...fixture,bypass_actors:[{actor_id:1,actor_type:'Team'}],rules:[
    {type:'pull_request',parameters:{required_approving_review_count:1}},
    {type:'required_status_checks',parameters:{required_status_checks:[{context:'test'}]}}]};
  const r=audit('o/r',e=>e.includes('?')?[{id:1,source_type:'Repository'}]:detail);
  assert.deepEqual(r.main.pull_request[0].warnings,['Bypass actors require review']);
  assert.deepEqual(r.main.required_status_checks[0].warnings,['Bypass actors require review']);
});
test('exclusions, disabled enforcement and incomplete detail fail closed',()=>{
  for(const override of [{enforcement:'disabled'},{conditions:{ref_name:{include:['refs/heads/main'],exclude:['refs/heads/main']}}}]) {
    const r=audit('o/r',e=>e.includes('?')?[{id:1,source_type:'Repository'}]:{...fixture,...override});
    assert.equal(r.main.pull_request,'not demonstrated');
  }
  assert.throws(()=>audit('o/r',e=>e.includes('?')?[{id:1,source_type:'Repository'}]:{id:1}));
  assert.throws(()=>audit('o/r',()=>{throw Error('403')}));
  assert.throws(()=>audit('o/../r',api));
});
