// A synthetic adapter tests the runner boundary, not an implementation of Vue.
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {execute as executeRunner,validateManifest} from './portable-runner.mjs';

// Run the whole synthetic matrix and its rejection controls on the selected
// engine. CI installs that engine, so do not silently fall back to Chromium.
const execute=(manifest,options={})=>executeRunner(manifest,{...options,browserName:process.env.NIGHTJAR_TEST_BROWSER??'chromium'});

test('data-driven two-family by four-framework adapter smoke and rejection controls',async()=>{
 const repo=mkdtempSync(join(tmpdir(),'nightjar-four-frameworks-'));
 try{
  const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
  git('init','-q');git('config','user.name','Nightjar fixture');git('config','user.email','nightjar@example.invalid');
  const pages=Array.from({length:50},(_,i)=>({id:`record-${i}`,title:`Record ${i}`,summary:`Summary ${i}`,sections:[]}));
  writeFileSync(join(repo,'catalog.json'),JSON.stringify({pages}));writeFileSync(join(repo,'dashboards.json'),JSON.stringify({people:[]}));
  writeFileSync(join(repo,'package.json'),JSON.stringify({name:'fixture-implementation',version:'1.0.0'}));
  writeFileSync(join(repo,'adapter.mjs'),`import {mkdirSync,writeFileSync} from 'node:fs';import {join} from 'node:path';const out=process.argv[2],base=process.argv[3],mode=process.argv[4];if(!['','/preview'].includes(base))throw Error('bad base');mkdirSync(join(out,'examples/record-0'),{recursive:true});writeFileSync(join(out,'examples/record-0/index.html'),'<html><body><main><h1 id="record">'+(mode==='bad'?'Wrong':'Record 0')+'</h1><p>Summary 0</p><a href="'+(mode==='bad-base'?'':base)+'/examples/record-0/#record">Record</a></main></body></html>');`);
  git('add','.');git('commit','-qm','synthetic adapter and canonical test fixtures');const commit=git('rev-parse','HEAD');
  const frameworks=['jekyll','astro','react','vue'],families=['martlet','krigsvold'];
  const matrix={families,frameworks};
  const targets=families.flatMap(family=>frameworks.map(framework=>({family,framework,adapter:{framework},capability:'static-route-smoke',repository:'fixture',commands:[['node','adapter.mjs','{output}','{base}']]})));
  for(const target of targets){target.inputs=['implementation'];target.input_checks={implementation:{package_name:'fixture-implementation',package_version:'1.0.0',files:{'catalog.json':createHash('sha256').update(JSON.stringify({pages})).digest('hex')}}};}
  const data={version:1,matrix,repositories:{fixture:{path:repo,commit},implementation:{path:repo,commit}},fixture:{repository:'fixture',catalog:'catalog.json',dashboards:'dashboards.json'},targets};
  const unchecked=structuredClone(data);delete unchecked.targets[0].input_checks;await assert.rejects(execute(unchecked,{requireCheckedInputs:true}),/lacks a package identity/);
  const wrongPackage=structuredClone(data);wrongPackage.targets[0].input_checks.implementation.package_name='other';await assert.rejects(execute(wrongPackage,{requireCheckedInputs:true}),/Package name differs/);
  const full=await execute(data,{requireMatrix:true,requireCheckedInputs:true});
  assert.equal(full.require_checked_declared_inputs,true);
  assert.equal(full.results.length,16);assert.equal(full.results.flatMap(r=>r.cells).length,16);assert.deepEqual(full.missing,[]);
  assert.ok(full.results.every(r=>r.capability==='static-route-smoke'&&r.cells[0].scope==='adapter-smoke'&&r.science.status==='not_assessed'));
  assert.ok(full.results.every(r=>r.cells[0].interactive_behavior==='not_assessed'&&r.cells[0].automated_accessibility==='not_assessed'));
  assert.deepEqual(new Set(full.results.map(r=>r.base)),new Set(['/','/preview']));
  const missing=structuredClone(data);missing.targets=missing.targets.filter(t=>!(t.family==='martlet'&&t.framework==='vue'));await assert.rejects(execute(missing,{requireMatrix:true}),/martlet\/vue/);
  const duplicate=structuredClone(data);duplicate.targets.push(duplicate.targets[0]);assert.throws(()=>validateManifest(duplicate),/duplicate target/);
  const mislabeled=structuredClone(data);mislabeled.targets[0].framework='vuu';assert.throws(()=>validateManifest(mislabeled),/unknown family or framework/);
  const mismatch=structuredClone(data);mismatch.targets[0].adapter.framework='vue';assert.throws(()=>validateManifest(mismatch),/adapter framework mismatch/);
  const unsupported=structuredClone(data);unsupported.targets[0].capability='full-accessibility';assert.throws(()=>validateManifest(unsupported),/unsupported capability/);
  const wrong=structuredClone(data);wrong.repositories.fixture.commit='0'.repeat(40);await assert.rejects(execute(wrong,{requireMatrix:true}),/failed/);
  const bad=structuredClone(data);bad.targets=[{...targets[0],commands:[['node','adapter.mjs','{output}','{base}','bad']]}];await assert.rejects(execute(bad),/canonical heading/);
  const badBase=structuredClone(data);badBase.targets=[{...targets[0],commands:[['node','adapter.mjs','{output}','{base}','bad-base']]}];await assert.rejects(execute(badBase),/verify-html\.py.*failed/);
  // Omission of matrix uses the separate default configuration and its three
  // existing framework IDs; this is still a synthetic smoke test only.
  const original={...data,targets:targets.filter(t=>t.framework!=='vue')};delete original.matrix;
  const restored=await execute(original,{requireMatrix:true});assert.equal(restored.results.length,12);assert.deepEqual(restored.missing,[]);
 }finally{rmSync(repo,{recursive:true,force:true});}
});
