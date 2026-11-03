import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

test('bootstrap templates remain private and cannot consume the intended release versions',async()=>{
 for(const [family,release] of [['martlet','2.2.3'],['krigsvold','2.2.4']]){
  const pkg=JSON.parse(await readFile(`fixtures/core-release/bootstrap/${family}/package.json`,'utf8'));
  assert.equal(pkg.name,`@${family}/core`);assert.equal(pkg.private,true);
  assert.equal(pkg.version,'0.0.0-bootstrap.0');assert.notEqual(pkg.version,release);
  assert.deepEqual(pkg.files,['README.md']);assert.equal(pkg.publishConfig.access,'public');
 }
});

test('local artifact preparation rejects missing identity and never invokes publication commands',async()=>{
 const result=spawnSync(process.execPath,['scripts/core-release/prepare-artifact.mjs'],{encoding:'utf8'});
 assert.notEqual(result.status,0);assert.match(result.stderr,/Usage:/);
 for(const file of ['scripts/core-release/prepare-artifact.mjs','scripts/core-release/verify-consumer.mjs']){
  const source=await readFile(file,'utf8');assert.doesNotMatch(source,/npm (?:stage|publish)/);
 }
});
