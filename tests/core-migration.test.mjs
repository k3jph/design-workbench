import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('core rehearsal pins both local artifacts and refuses a changed input',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../fixtures/core-migration/candidates.json',import.meta.url)));
 assert.equal(manifest.status,'unpublished-local-only');
 for(const family of ['martlet','krigsvold']){const c=manifest.families[family];assert.match(c.coreCommit,/^[a-f0-9]{40}$/);assert.match(c.reactSourceCommit,/^[a-f0-9]{40}$/);assert.match(c.reactSourceTree,/^[a-f0-9]{40}$/);assert.match(c.coreSha256,/^[a-f0-9]{64}$/);assert.equal(c.legacyThemeVersion,'2.1.0');}
 const temp=mkdtempSync(join(tmpdir(),'nightjar-wrong-core-'));try{const bad=join(temp,'bad.tgz');writeFileSync(bad,'corrupt');const script=new URL('../scripts/nightjar3/core-react-rehearsal.mjs',import.meta.url);const result=spawnSync(process.execPath,[script.pathname,temp,temp,bad,bad,join(temp,'out')],{encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,/core archive differs/);}finally{rmSync(temp,{recursive:true,force:true});}
});
