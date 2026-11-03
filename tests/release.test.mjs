import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('private core migration rejects release while the unmodified release gate enforces identity and tag',()=>{
 const temp=mkdtempSync(join(tmpdir(),'react-release-check-'));
 try {
  mkdirSync(join(temp,'scripts')); cpSync('scripts/check-react-release.mjs',join(temp,'scripts/check-react-release.mjs'));
  for(const family of ['martlet','krigsvold']) {
   const dir=join(temp,'packages',`${family}-react`);mkdirSync(dir,{recursive:true});
   cpSync(`packages/${family}-react/package.json`,join(dir,'package.json'));
  }
  const run=env=>spawnSync(process.execPath,['scripts/check-react-release.mjs'],{cwd:temp,encoding:'utf8',env:{...process.env,GITHUB_REPOSITORY:'k3jph/design-workbench',RELEASE_TAG:'react-v0.2.0',...env}});
  assert.notEqual(run({}).status,0,'private candidate must not pass the publication gate');
  for(const family of ['martlet','krigsvold']) {
   const path=join(temp,'packages',`${family}-react`,'package.json');const pkg=JSON.parse(readFileSync(path,'utf8'));pkg.private=false;writeFileSync(path,JSON.stringify(pkg));
  }
  assert.equal(run({}).status,0);
  assert.notEqual(run({RELEASE_TAG:'v0.2.0'}).status,0);
  assert.notEqual(run({GITHUB_REPOSITORY:'other/repository'}).status,0);
  assert.notEqual(run({GITHUB_REPOSITORY:'howardjp/design-workbench'}).status,0);
 } finally {rmSync(temp,{recursive:true,force:true});}
});
