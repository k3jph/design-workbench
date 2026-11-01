import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from '@playwright/test';
import {validateManifest,execute,checkTarget} from './portable-interactions.mjs';
const sha='a'.repeat(40);
const fixture=()=>({version:1,targets:[{family:'martlet',framework:'jekyll',root:'/tmp/site',base:'/preview/',source_commit:sha}]});
test('manifest rejects unknown implementations, unsafe paths, duplicate cells and missing matrix',async()=>{
 assert.doesNotThrow(()=>validateManifest(fixture()));
 let v=fixture();v.targets[0].base='/../';assert.throws(()=>validateManifest(v),/Unsafe base/);
 v=fixture();v.targets[0].framework='vue';assert.throws(()=>validateManifest(v),/Unknown family/);
 v=fixture();v.targets.push({...v.targets[0]});assert.throws(()=>validateManifest(v),/Duplicate target/);
 v=fixture();v.targets[0].source_commit='main';assert.throws(()=>validateManifest(v),/full source commit/);
 await assert.rejects(execute(fixture(),{requireMatrix:true}),/Missing targets/);
});
test('actual browser rejects an implementation without the required contact form',async()=>{
 const root=await mkdtemp(join(tmpdir(),'bad-contact-'));let browser;
 try{const page=join(root,'examples','contact');await mkdir(page,{recursive:true});await writeFile(join(page,'index.html'),'<html lang="en"><main><h1>Contact</h1></main></html>');
  browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
  await assert.rejects(checkTarget(browser,{...fixture().targets[0],root}),/Expected one contact form/);
 }finally{await browser?.close();await rm(root,{recursive:true,force:true});}
});
