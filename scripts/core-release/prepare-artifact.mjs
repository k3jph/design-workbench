// Prepare local, publishable-form tarballs without any registry mutation.
// The immutable input remains private; only a disposable exported copy is changed.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {copyFile, mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import assert from 'node:assert/strict';

const [repoArg, commit, identity, version, outputArg] = process.argv.slice(2);
if (!repoArg || !/^[a-f0-9]{40}$/.test(commit ?? '') || !/^@(martlet|krigsvold)\/core$/.test(identity ?? '') || !/^\d+\.\d+\.\d+$/.test(version ?? '') || !outputArg) {
 throw Error('Usage: node prepare-artifact.mjs CORE_REPOSITORY COMMIT @family/core VERSION NEW_OUTPUT_DIRECTORY');
}
const npmCli = process.env.NIGHTJAR_NPM_CLI;
if (!npmCli || !npmCli.startsWith('/')) throw Error('Set NIGHTJAR_NPM_CLI to the absolute npm CLI entry point.');
const npmVersion=execFileSync(process.execPath,[npmCli,'--version'],{encoding:'utf8'}).trim();
if (npmVersion !== '11.15.0') throw Error(`Expected npm 11.15.0, got ${npmVersion}`);
if (process.versions.node !== '24.19.0') throw Error(`Expected Node 24.19.0, got ${process.versions.node}`);
const repo=resolve(repoArg), output=resolve(outputArg);
const workspace=await mkdtemp(join(tmpdir(),'nightjar-core-release-'));
const artifacts=[];
try {
 const archive=execFileSync('git',['-C',repo,'archive','--format=tar',commit],{maxBuffer:64*1024*1024});
 for (const index of [1,2]) {
  const tree=join(workspace,`build-${index}`);await mkdir(tree);
  execFileSync('tar',['-x','-C',tree],{input:archive});
  const options={cwd:tree,stdio:'pipe',maxBuffer:32*1024*1024};
  const npm=(args)=>execFileSync(process.execPath,[npmCli,...args],options);
  npm(['ci','--ignore-scripts','--offline','--no-audit','--no-fund']);
  npm(['run','build']);npm(['test']);
  const filename=join(tree,'package.json');const original=JSON.parse(await readFile(filename,'utf8'));
  assert.equal(original.name,identity);assert.equal(original.version,version);assert.equal(original.private,true,'Private source guard must be intact');
  const source=JSON.parse(await readFile(join(tree,'source.json'),'utf8'));assert.equal(source.version,version);
  const release={...original,private:false};await writeFile(filename,JSON.stringify(release,null,2)+'\n');
  const packDir=join(workspace,`pack-${index}`);await mkdir(packDir);
  const result=JSON.parse(npm(['pack','--json','--ignore-scripts','--pack-destination',packDir]).toString());
  assert.equal(result.length,1);assert.equal(result[0].name,identity);assert.equal(result[0].version,version);
  const path=join(packDir,result[0].filename),bytes=await readFile(path);
  artifacts.push({path,name:result[0].filename,sha256:createHash('sha256').update(bytes).digest('hex'),sha512:createHash('sha512').update(bytes).digest('base64'),size:bytes.length,files:result[0].files.map(x=>x.path)});
 }
 assert.equal(artifacts[0].sha256,artifacts[1].sha256,'Independent exports produced different archives');
 assert.deepEqual(artifacts[0].files,artifacts[1].files);
 await mkdir(output);await copyFile(artifacts[0].path,join(output,artifacts[0].name));
 const report={identity,version,sourceCommit:commit,node:process.versions.node,npm:npmVersion,sourcePrivate:true,artifactPrivate:false,artifact:artifacts[0].name,sha256:artifacts[0].sha256,integrity:`sha512-${artifacts[0].sha512}`,size:artifacts[0].size,files:artifacts[0].files,independentExports:2,registryMutation:false};
 await writeFile(join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
} finally {await rm(workspace,{recursive:true,force:true});}
