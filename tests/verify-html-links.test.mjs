import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdirSync,mkdtempSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('rendered-link verification rejects encoded traversal and external symlinks at root and subpath',()=>{
 const temp=mkdtempSync(join(tmpdir(),'nightjar-link-boundary-'));try{
  const root=join(temp,'site');mkdirSync(root);writeFileSync(join(temp,'outside.txt'),'outside');symlinkSync(join(temp,'outside.txt'),join(root,'external-link'));
  const verify=(base,href)=>{
   writeFileSync(join(root,'index.html'),`<h1 id="home">Example</h1><a href="${href}">link</a>`);
   return spawnSync('python3',['examples/page-archetypes/scripts/verify-html.py',root,'--baseurl',base],{encoding:'utf8'});
  };
  for(const base of ['', '/preview']){
   const good=verify(base,`${base}/#home`);assert.equal(good.status,0,good.stderr);
   for(const href of [`${base}/%2e%2e/outside.txt`,`${base}/external-link`]){const result=verify(base,href);assert.notEqual(result.status,0,`${base||'/'} accepted ${href}`);assert.match(result.stderr,/destination escapes site root/);}
  }
  const outsideDir=join(temp,'outside-dir');mkdirSync(outsideDir);writeFileSync(join(outsideDir,'index.html'),'<h1>External</h1>');symlinkSync(outsideDir,join(root,'redirected-dir'),'dir');mkdirSync(join(root,'directory'));symlinkSync(join(outsideDir,'index.html'),join(root,'directory','index.html'));
  for(const base of ['', '/preview']){
   const nested=verify(base,`${base}/redirected-dir/`);assert.notEqual(nested.status,0);assert.match(nested.stderr,/destination escapes site root/);
   const index=verify(base,`${base}/directory/`);assert.notEqual(index.status,0);assert.match(index.stderr,/HTML document escapes site root/);assert.match(index.stderr,/directory index escapes site root/);
  }
 }finally{rmSync(temp,{recursive:true,force:true});}
});
