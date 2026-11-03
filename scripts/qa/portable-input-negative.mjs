#!/usr/bin/env node
// Opt-in integration controls: deliberately break the actual pinned package and
// require the existing gallery build to fail for the expected missing export.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const manifests=process.argv.slice(2);
assert.equal(manifests.length,2,'Usage: node scripts/qa/portable-input-negative.mjs react-manifest.json astro-manifest.json');
const root=mkdtempSync(join(tmpdir(),'nightjar-package-negative-'));
const runner=fileURLToPath(new URL('./portable-runner.mjs',import.meta.url));
function command(program,args,options={}){
 const result=spawnSync(program,args,{encoding:'utf8',maxBuffer:32*1024*1024,...options});
 if(result.error)throw result.error;
 assert.equal(result.status,0,`${program} failed: ${result.stderr||result.stdout}`);
 return result.stdout.trim();
}
try {
 for(const [index,framework] of ['react','astro'].entries()){
  const manifest=JSON.parse(readFileSync(resolve(manifests[index]),'utf8'));
  for(const family of ['martlet','krigsvold']){
   const target=manifest.targets.find(t=>t.family===family&&t.framework===framework);
   assert.ok(target,`missing ${family}/${framework} target`);
   const name=`${framework}-${family}`, spec=manifest.repositories[name];
   assert.ok(spec && target.inputs?.includes(name),`target must declare ${name}`);
   assert.match(spec.commit,/^[0-9a-f]{40}$/,`${name}: full commit required`);
   const repo=join(root,name);
   command('git',['clone','--quiet','--no-hardlinks',resolve(spec.path),repo]);
   command('git',['checkout','--quiet',spec.commit],{cwd:repo});
   let checked;
   if(framework==='react'){
    checked='src/index.tsx';const path=join(repo,checked),before=readFileSync(path,'utf8');
    assert.ok(before.includes('export function DataTable('),'fixture no longer exposes DataTable in the expected form');
    writeFileSync(path,before.replace('export function DataTable(','export function RenamedDataTable('));
   }else{
    checked='src/index.ts';rmSync(join(repo,'src/components/Button.astro'));
   }
   command('git',['add','-A'],{cwd:repo});
   command('git',['-c','user.name=Nightjar negative fixture','-c','user.email=nightjar@example.invalid','commit','--quiet','-m','Deliberately break package export'],{cwd:repo});
   const commit=command('git',['rev-parse','HEAD'],{cwd:repo});
   const pkg=JSON.parse(readFileSync(join(repo,'package.json'),'utf8'));
   const hash=createHash('sha256').update(readFileSync(join(repo,checked))).digest('hex');
   // Bind the intentionally broken bytes so rejection must come from the actual
   // consumer build, rather than merely from the input hash guard.
   const one={version:1,repositories:{[manifest.fixture.repository]:manifest.repositories[manifest.fixture.repository],[name]:{path:repo,commit}},fixture:manifest.fixture,targets:[{...target,input_checks:{[name]:{package_name:pkg.name,package_version:pkg.version,files:{[checked]:hash}}}}]};
   const input=join(root,`${name}.json`),output=join(root,`${name}-result.json`);writeFileSync(input,JSON.stringify(one));
   const result=spawnSync(process.execPath,[runner,'--manifest',input,'--output',output],{encoding:'utf8',env:process.env,maxBuffer:32*1024*1024,timeout:15*60*1000});
   if(result.error)throw result.error;
   const log=result.stdout+'\n'+result.stderr;
   assert.notEqual(result.status,0,`${name}: broken implementation unexpectedly passed`);
   if(framework==='react')assert.match(log,/DataTable[^\n]*(?:not exported|missing export)|(?:not exported|missing export)[^\n]*DataTable/i,`${name}: unexpected failure`);
   else assert.match(log,/Button\.astro[\s\S]*(?:No such file|not found|could not resolve)|(?:could not resolve|not found|No such file)[\s\S]*Button\.astro/i,`${name}: unexpected failure`);
   console.log(`${name}: pinned deliberate mutation ${commit} rejected by consumer build for missing ${framework==='react'?'DataTable export':'Button.astro'}`);
  }
 }
}finally{rmSync(root,{recursive:true,force:true});}
