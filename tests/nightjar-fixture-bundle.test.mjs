import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import {createBundle,unpackBundle,verifyBundle} from '../scripts/qa/nightjar-fixture-bundle.mjs';

test('reviewed fixture bundles are deterministic, pinned, tamper-evident and unpack without Git',async()=>{
 const temp=mkdtempSync(join(tmpdir(),'nightjar-fixture-bundle-'));try{
  const repo=join(temp,'repo');mkdirSync(repo);const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');
  const paths=['examples/page-archetypes/content/catalog.json','examples/page-archetypes/content/dashboards.json','examples/page-archetypes/contracts/catalog.schema.json','examples/page-archetypes/contracts/dashboards.schema.json'];
  for(const path of paths){mkdirSync(dirname(join(repo,path)),{recursive:true});writeFileSync(join(repo,path),JSON.stringify({path}));}git('add','.');git('commit','-qm','fixtures');const commit=git('rev-parse','HEAD');
  const first=createBundle(repo,commit),hash=createHash('sha256').update(first).digest('hex');assert.deepEqual(first,createBundle(repo,commit));
  writeFileSync(join(repo,paths[0]),'{"dirty":true}');assert.deepEqual(first,createBundle(repo,commit),'dirty source is ignored');
  assert.throws(()=>createBundle(repo,'main'),/Full lowercase/);assert.throws(()=>createBundle(repo,'0'.repeat(40)),/Local Git read failed/);
  assert.equal(verifyBundle(first,commit,hash).length,4);assert.throws(()=>verifyBundle(first,'0'.repeat(40),hash),/source commit differs/);
  assert.throws(()=>verifyBundle(Buffer.concat([first,Buffer.from(' ')]),commit,hash),/Bundle SHA-256 differs/);
  const altered=JSON.parse(first);altered.files[0].base64=Buffer.from('{"wrong":true}').toString('base64');const alteredBytes=Buffer.from(JSON.stringify(altered)),alteredHash=createHash('sha256').update(alteredBytes).digest('hex');assert.throws(()=>verifyBundle(alteredBytes,commit,alteredHash),/Fixture digest differs/);
  const output=join(temp,'output');await unpackBundle(first,commit,hash,output);assert.equal(readFileSync(join(output,paths[0]),'utf8'),JSON.stringify({path:paths[0]}));await assert.rejects(unpackBundle(first,commit,hash,output),{code:'EEXIST'});assert.throws(()=>readFileSync(join(output,'.git','HEAD')),{code:'ENOENT'});
  rmSync(join(repo,paths[0]));symlinkSync('{}',join(repo,paths[0]));git('add','.');git('commit','-qm','replace fixture with symlink');assert.throws(()=>createBundle(repo,git('rev-parse','HEAD')),/tracked regular file/);
 }finally{rmSync(temp,{recursive:true,force:true});}
});
