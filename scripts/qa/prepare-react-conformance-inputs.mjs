// Build conformance inputs without publishing. Standalone source is authoritative;
// private workspaces are retained only as shared-contract test fixtures.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {reviewedRegistryCoreArchive,reviewedCore} from '../reviewed-registry-core.mjs';
// npm includes source file modes in archive bytes; reproduce reviewed 0644 files.
process.umask(0o022);
const [source,target]=process.argv.slice(2);
assert.ok(['standalone','workspace'].includes(source),'Choose standalone or workspace conformance inputs');
assert.ok(target&&target.startsWith('/'),'An absolute isolated destination is required');
const destination=resolve(target);await mkdir(destination,{recursive:true});
const pins={
 martlet:{commit:'ec9d3515c2233514304908d0e343bfd291505ebe',sha256:'185bf53ada0b4bdb792a1ba78223068ec3eda29ba1e74a6f85415c6cdf98f6d1'},
 krigsvold:{commit:'2bb52de74314f50c854429f3f90f11631f5aeb8b',sha256:'26db29737f69e5bb20ecc7b138acb35656c68c3f4eea80defdfb6a3d1bfb9961'},
};
const run=(cmd,args,cwd)=>execFileSync(cmd,args,{cwd,stdio:'pipe',timeout:180000});
if(source==='workspace')run('npm',['run','build','--workspaces'],process.cwd());
const inputs=[];
for(const family of ['martlet','krigsvold']){
 const core=reviewedRegistryCoreArchive(family,destination);let commit;
 if(source==='standalone'){
  const repository=resolve(`.react-source-${family}`),pin=pins[family];
  commit=run('git',['rev-parse','HEAD'],repository).toString().trim();assert.equal(commit,pin.commit,'Standalone source differs from reviewed candidate');
  const temp=await mkdtemp(join(tmpdir(),`reviewed-react-${family}-`));
  try{
   const archive=join(temp,'source.tar'),exported=join(temp,'source');await mkdir(exported);
   run('git',['archive','--format=tar','--output',archive,'HEAD'],repository);run('tar',['-xf',archive,'-C',exported]);
   const path=join(exported,'package.json'),manifest=JSON.parse(await readFile(path,'utf8'));
   assert.equal(manifest.name,`@${family}/react`);assert.equal(manifest.version,'0.2.0');assert.equal(manifest.private,true);
   assert.equal(manifest.dependencies[`@${family}/core`],reviewedCore[family].version);
   manifest.private=false;await writeFile(path,JSON.stringify(manifest,null,2)+'\n');
   run('npm',['ci','--ignore-scripts','--no-audit','--no-fund'],exported);run('npm',['run','build'],exported);
   run('node',['scripts/normalize-package-modes.mjs','.'],exported);
   run('npm',['pack','--ignore-scripts','--pack-destination',destination],exported);
   run('node',['scripts/tag-release-cli.mjs','inspect',join(destination,`${family}-react-0.2.0.tgz`)],repository);
  }finally{await rm(temp,{recursive:true,force:true})}
 }else{
  commit=run('git',['rev-parse','HEAD'],process.cwd()).toString().trim();
  run('npm',['pack','--workspace',`@${family}/react`,'--ignore-scripts','--pack-destination',destination],process.cwd());
 }
 const archive=join(destination,`${family}-react-0.2.0.tgz`),bytes=await readFile(archive),sha256=createHash('sha256').update(bytes).digest('hex');
 if(source==='standalone')assert.equal(sha256,pins[family].sha256,'Independent React archive differs from reviewed release candidate');
 const packaged=JSON.parse(run('tar',['-xOzf',archive,'package/package.json']).toString());assert.equal(packaged.name,`@${family}/react`);assert.equal(packaged.version,'0.2.0');assert.equal(packaged.dependencies[`@${family}/core`],reviewedCore[family].version);
 inputs.push({family,source,commit,react:{version:'0.2.0',sha256,bytes:bytes.length},core:{version:reviewedCore[family].version,sha256:reviewedCore[family].sha256,archive:core},publicationPerformed:false});
}
await writeFile(join(destination,'inputs.json'),JSON.stringify(inputs,null,2)+'\n');console.log(JSON.stringify(inputs));
