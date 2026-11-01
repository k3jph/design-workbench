import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {archive,execute,expand,pinned,readPin,validateManifest,verifyInput,verifyOutputRoot} from '../scripts/qa/portable-runner.mjs';

const sha='1234567890abcdef1234567890abcdef12345678';
function manifest(){return {version:1,repositories:{fixture:{path:'/tmp/fixture',commit:sha}},fixture:{repository:'fixture',catalog:'catalog.json',dashboards:'dashboards.json'},targets:[{family:'martlet',framework:'jekyll',repository:'fixture',commands:[['python3','build.py','--out','{output}']]}]};}

test('manifest rejects moving refs, unsafe fixture paths, duplicates and unknown targets',()=>{
 assert.doesNotThrow(()=>validateManifest(manifest()));
 let data=manifest();data.repositories.fixture.commit='main';assert.throws(()=>validateManifest(data),/full commit/);
 data=manifest();data.fixture.catalog='../outside';assert.throws(()=>validateManifest(data),/repository-relative/);
 data=manifest();data.targets.push({...data.targets[0]});assert.throws(()=>validateManifest(data),/duplicate target/);
 data=manifest();data.targets[0].repository='missing';assert.throws(()=>validateManifest(data),/unknown repository/);
 data=manifest();data.targets[0].inputs=['missing'];assert.throws(()=>validateManifest(data),/unique known repositories/);
 data=manifest();data.targets[0].commands=[['node',null]];assert.throws(()=>validateManifest(data),/argument array/);
 data=manifest();data.repositories.other={path:'/tmp/other',commit:sha};data.targets[0].commands=[['node','{source:other}']];assert.throws(()=>validateManifest(data),/declared input/);data.targets[0].inputs=['other'];assert.doesNotThrow(()=>validateManifest(data));
 assert.throws(()=>expand('{source:constructor}',{sources:{}}),/Unknown placeholder/);
});

test('package input checks reject missing, wrong-family, wrong-version and altered implementation bytes',async()=>{
 const temp=mkdtempSync(join(tmpdir(),'nightjar-package-check-'));try{
  const hash=value=>createHash('sha256').update(value).digest('hex');
  const check={package_name:'@martlet/react',package_version:'0.2.0',files:{'src/index.js':hash('export const Article = 1;')}};
  mkdirSync(join(temp,'src'));writeFileSync(join(temp,'package.json'),JSON.stringify({name:'@martlet/react',version:'0.2.0'}));writeFileSync(join(temp,'src','index.js'),'export const Article = 1;');
  await assert.doesNotReject(verifyInput(temp,check));
  writeFileSync(join(temp,'package.json'),JSON.stringify({name:'@krigsvold/react',version:'0.2.0'}));await assert.rejects(verifyInput(temp,check),/Package name differs/);
  writeFileSync(join(temp,'package.json'),JSON.stringify({name:'@martlet/react',version:'0.1.0'}));await assert.rejects(verifyInput(temp,check),/Package version differs/);
  writeFileSync(join(temp,'package.json'),JSON.stringify({name:'@martlet/react',version:'0.2.0'}));writeFileSync(join(temp,'src','index.js'),'export const Renamed = 1;');await assert.rejects(verifyInput(temp,check),/Input file hash differs/);
  rmSync(join(temp,'src','index.js'));await assert.rejects(verifyInput(temp,check),{code:'ENOENT'});
  const data=manifest();data.targets[0].input_checks={fixture:check};assert.doesNotThrow(()=>validateManifest(data));
  data.targets[0].input_checks={fixture:{...check,files:{'../outside':hash('x')}}};assert.throws(()=>validateManifest(data),/unsafe checked file path/);
  data.targets[0].input_checks={other:check};assert.throws(()=>validateManifest(data),/checked source/);
 }finally{rmSync(temp,{recursive:true,force:true});}
});

test('complete-matrix mode refuses partial coverage before opening repositories',async()=>{
 await assert.rejects(execute(manifest(),{requireMatrix:true}),/complete matrix missing targets/);
});

test('strict declared-input mode rejects unchecked packages before opening repositories',async()=>{
 const data=manifest();data.repositories.package={path:'/tmp/missing',commit:sha};data.targets[0].inputs=['package'];
 await assert.rejects(execute(data,{requireCheckedInputs:true}),/declared input package lacks/);
 data.targets[0].input_checks={package:{package_name:'@martlet/core',package_version:'2.2.3',files:{'index.js':'a'.repeat(64)}}};
 // The strict guard accepted the check and execution reached the pinned-repo read.
 await assert.rejects(execute(data,{requireCheckedInputs:true}),/failed/);
});

test('existing result files are never overwritten or mistaken for a new run',async()=>{
 const temp=mkdtempSync(join(tmpdir(),'nightjar-result-test-'));try{const output=join(temp,'result.json');writeFileSync(output,'prior evidence');await assert.rejects(execute(manifest(),{output}),/Output already exists/);assert.equal(readFileSync(output,'utf8'),'prior evidence');}finally{rmSync(temp,{recursive:true,force:true});}
});

test('output root and ancestor cannot be redirected through symlinks',async()=>{
 const temp=mkdtempSync(join(tmpdir(),'nightjar-output-boundary-'));try{
  const real=join(temp,'real'),output=join(real,'output'),rootLink=join(temp,'root-link'),ancestorLink=join(temp,'ancestor-link');mkdirSync(real);mkdirSync(output);symlinkSync(output,rootLink,'dir');symlinkSync(real,ancestorLink,'dir');
  await assert.doesNotReject(verifyOutputRoot(temp,output));
  await assert.rejects(verifyOutputRoot(temp,rootLink),/not a symlink/);
  await assert.rejects(verifyOutputRoot(temp,join(ancestorLink,'output')),/ancestor is a symlink/);
  await assert.rejects(verifyOutputRoot(output,real),/remain inside/);
 }finally{rmSync(temp,{recursive:true,force:true});}
});

test('pinned offline archive uses committed bytes, not a later checkout or dirty files',()=>{
 const temp=mkdtempSync(join(tmpdir(),'nightjar-pin-test-'));try{
  const repo=join(temp,'repo'),out=join(temp,'out');mkdirSync(repo);mkdirSync(out);
  const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
  git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.test');writeFileSync(join(repo,'catalog.json'),'first');git('add','catalog.json');git('commit','-qm','first');const first=git('rev-parse','HEAD');
  writeFileSync(join(repo,'catalog.json'),'second');git('commit','-qam','second');writeFileSync(join(repo,'catalog.json'),'uncommitted');writeFileSync(join(repo,'untracked.txt'),'not in archive');
  assert.doesNotThrow(()=>pinned(repo,first));assert.throws(()=>pinned(repo,'HEAD'),/full 40-character/);assert.equal(readPin(repo,first,'catalog.json'),'first');archive(repo,first,out);
  assert.equal(readFileSync(join(out,'catalog.json'),'utf8'),'first');assert.throws(()=>readFileSync(join(out,'untracked.txt')),{code:'ENOENT'});assert.throws(()=>readFileSync(join(out,'.git','HEAD')),{code:'ENOENT'});
  symlinkSync('/tmp',join(repo,'outside'));git('add','outside');git('commit','-qm','add unsafe symlink');const unsafe=git('rev-parse','HEAD');git('replace',unsafe,first);assert.throws(()=>pinned(repo,unsafe),/symlinks and submodules/);
 }finally{rmSync(temp,{recursive:true,force:true});}
});

test('literal pins ignore local Git replacement refs and untracked archive attributes',()=>{
 const temp=mkdtempSync(join(tmpdir(),'nightjar-replace-test-'));const keys=['GIT_DIR','GIT_CONFIG_COUNT','GIT_CONFIG_KEY_0','GIT_CONFIG_VALUE_0'];const previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));try{
  const repo=join(temp,'repo'),out=join(temp,'out');mkdirSync(repo);mkdirSync(out);
  const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
  git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.test');writeFileSync(join(repo,'content'),'trusted');git('add','content');git('commit','-qm','first');const first=git('rev-parse','HEAD');
  writeFileSync(join(repo,'content'),'replacement');git('commit','-qam','second');const second=git('rev-parse','HEAD');git('replace',first,second);
  writeFileSync(join(repo,'.git','info','attributes'),'content export-ignore\n');
  const external=join(temp,'attributes');writeFileSync(external,'content export-ignore\n');process.env.GIT_DIR=join(temp,'missing');process.env.GIT_CONFIG_COUNT='1';process.env.GIT_CONFIG_KEY_0='core.attributesFile';process.env.GIT_CONFIG_VALUE_0=external;
  assert.equal(readPin(repo,first,'content'),'trusted','fixture comes from the literal commit despite replace refs');
  pinned(repo,first);archive(repo,first,out);assert.equal(readFileSync(join(out,'content'),'utf8'),'trusted','archive ignores untracked local attributes and replacement refs');
 }finally{for(const key of keys){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];}rmSync(temp,{recursive:true,force:true});}
});

test('a pinned source tree cannot conceal an unpinned Git submodule',()=>{
 const temp=mkdtempSync(join(tmpdir(),'nightjar-submodule-test-'));try{
  const git=(...args)=>execFileSync('git',args,{cwd:temp,encoding:'utf8'}).trim();
  git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.test');writeFileSync(join(temp,'content'),'fixture');git('add','content');git('commit','-qm','first');const target=git('rev-parse','HEAD');
  git('update-index','--add','--cacheinfo',`160000,${target},module`);git('commit','-qm','add gitlink');assert.throws(()=>pinned(temp,git('rev-parse','HEAD')),/symlinks and submodules/);
 }finally{rmSync(temp,{recursive:true,force:true});}
});
