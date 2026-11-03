import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {checkBackmerge} from './backmerge.mjs';

test('a release and a hotfix must both be incorporated into develop',()=>{
  const dir=mkdtempSync(join(tmpdir(),'nightjar-backmerge-'));
  const git=(...args)=>execFileSync('git',args,{cwd:dir,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  try {
    git('init','-b','main');git('config','user.name','Nightjar');git('config','user.email','nightjar@example.invalid');
    git('commit','--allow-empty','-m','initial');git('checkout','-b','develop');
    const refs=()=>{for(const b of ['main','develop'])git('update-ref',`refs/remotes/origin/${b}`,git('rev-parse',b));};
    refs();assert.ok(checkBackmerge(dir).main);
    for(const kind of ['release','hotfix']) {
      git('checkout','main');git('checkout','-b',`${kind}/1.0.0`);git('commit','--allow-empty','-m',kind);
      git('checkout','main');git('merge','--no-ff',`${kind}/1.0.0`,'-m',kind);refs();assert.throws(()=>checkBackmerge(dir));
      git('checkout','develop');git('merge','--no-ff','main','-m',`${kind} backmerge`);refs();assert.ok(checkBackmerge(dir));
    }
  } finally {rmSync(dir,{recursive:true,force:true});}
});
