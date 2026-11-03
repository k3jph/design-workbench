#!/usr/bin/env node
// Local, deterministic contract snapshot for review; no fetch or publishing.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {devNull} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const paths=['examples/page-archetypes/content/catalog.json','examples/page-archetypes/content/dashboards.json','examples/page-archetypes/contracts/catalog.schema.json','examples/page-archetypes/contracts/dashboards.schema.json'];
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const full=/^[0-9a-f]{40}$/,sha256=/^[0-9a-f]{64}$/;
function git(repo,args){
 const env={...process.env};for(const key of Object.keys(env))if(key.startsWith('GIT_'))delete env[key];
 Object.assign(env,{GIT_NO_REPLACE_OBJECTS:'1',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:devNull,GIT_ATTR_NOSYSTEM:'1'});
 const result=spawnSync('git',['-C',repo,...args],{env,maxBuffer:32*1024*1024});
 if(result.error)throw result.error;if(result.status!==0)throw Error(`Local Git read failed: ${result.stderr.toString('utf8')}`);return result.stdout;
}
export function createBundle(repo,commit){
 assert.match(commit,full,'Full lowercase commit ID required');
 assert.equal(git(repo,['rev-parse','--verify',`${commit}^{commit}`]).toString().trim(),commit,'Commit does not resolve exactly');
 const files=paths.map(path=>{
  const entry=git(repo,['ls-tree',commit,'--',path]).toString('utf8').trimEnd();
  assert.match(entry,/^100(?:644|755) blob [0-9a-f]{40}\t/,`Fixture must be a tracked regular file: ${path}`);
  const content=git(repo,['show',`${commit}:${path}`]);JSON.parse(content.toString('utf8'));
  return {path,sha256:digest(content),base64:content.toString('base64')};
 });
 return Buffer.from(JSON.stringify({version:1,source_commit:commit,files},null,2)+'\n');
}
export function verifyBundle(bytes,commit,expectedDigest){
 assert.match(commit,full,'Full lowercase source commit required');assert.match(expectedDigest,sha256,'Trusted full SHA-256 required');
 assert.equal(digest(bytes),expectedDigest,'Bundle SHA-256 differs from independently reviewed digest');
 const bundle=JSON.parse(bytes.toString('utf8'));assert.equal(bundle.version,1);assert.equal(bundle.source_commit,commit,'Bundle source commit differs');
 assert.ok(Array.isArray(bundle.files));assert.deepEqual(bundle.files.map(file=>file.path),paths,'Bundle must contain exactly the expected ordered fixture and schema paths');
 return bundle.files.map(file=>{
  assert.match(file.sha256,sha256);assert.equal(typeof file.base64,'string');
  const content=Buffer.from(file.base64,'base64');assert.equal(content.toString('base64'),file.base64,'Noncanonical base64');
  assert.equal(digest(content),file.sha256,`Fixture digest differs: ${file.path}`);JSON.parse(content.toString('utf8'));return {path:file.path,content};
 });
}
export async function unpackBundle(bytes,commit,expectedDigest,destination){
 const files=verifyBundle(bytes,commit,expectedDigest),out=resolve(destination);
 await mkdir(out); // Require a new destination; no in-place source update.
 for(const file of files){const target=join(out,file.path);await mkdir(dirname(target),{recursive:true});await writeFile(target,file.content,{flag:'wx'});}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [action,...args]=process.argv.slice(2);
 if(action==='create'&&args.length===3){const [repo,commit,output]=args;const bytes=createBundle(resolve(repo),commit);await writeFile(resolve(output),bytes,{flag:'wx'});console.log(`Created reviewed-input fixture bundle ${digest(bytes)} from ${commit}`);}
 else if(action==='unpack'&&args.length===4){const [input,commit,expectedDigest,output]=args;await unpackBundle(await readFile(resolve(input)),commit,expectedDigest,output);console.log(`Verified fixture bundle from ${commit} into a new directory`);}
 else throw Error('Usage: node nightjar-fixture-bundle.mjs create REPO FULL_COMMIT NEW_BUNDLE | unpack BUNDLE FULL_COMMIT TRUSTED_SHA256 NEW_DIRECTORY');
}
