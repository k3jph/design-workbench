import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {test} from 'node:test';

const revision='80a5635abe4de7a07a1983de0b3ef796b101e047';
test('offline extraction preserves pinned family sources and rejects an existing output',()=>{
 const root=process.cwd(), parent=mkdtempSync(join(tmpdir(),'nightjar-react-rehearsal-')),output=join(parent,'candidate');
 try{
  execFileSync(process.execPath,['scripts/nightjar3/react-extraction.mjs','--out',output],{cwd:root});
  for(const family of ['martlet','krigsvold']){
   for(const file of ['src/index.tsx','src/styles.css','LICENSE','NOTICE.md','README.md','tsconfig.json']){
    const original=execFileSync('git',['show',`${revision}:packages/${family}-react/${file}`],{cwd:root});
    assert.deepEqual(readFileSync(join(output,family,file)),original,`${family}/${file} must retain source bytes`);
   }
   const manifest=JSON.parse(readFileSync(join(output,family,'package.json')));
   const original=JSON.parse(execFileSync('git',['show',`${revision}:packages/${family}-react/package.json`],{cwd:root}));
   for(const key of ['name','version','exports','dependencies','peerDependencies','sideEffects','files']) assert.deepEqual(manifest[key],original[key],`${family} ${key} must retain contract`);
   assert.equal(manifest.private,true,'rehearsal must not be publishable');
   assert.deepEqual(readFileSync(join(output,family,'package-lock.json')),readFileSync(resolve(root,`fixtures/nightjar3/react-locks/${family}-package-lock.json`)));
  }
  const second=spawnSync(process.execPath,['scripts/nightjar3/react-extraction.mjs','--out',output],{cwd:root,encoding:'utf8'});
  assert.notEqual(second.status,0);assert.match(second.stderr,/Output already exists/);
 }finally{rmSync(parent,{recursive:true,force:true});}
});
