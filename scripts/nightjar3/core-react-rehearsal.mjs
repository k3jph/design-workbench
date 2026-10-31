#!/usr/bin/env node
// Local-only migration experiment. Candidate commits and input tarballs are pinned.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cpSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {devNull,tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {archive,pinned} from '../qa/portable-runner.mjs';
const [martletRepo,krigsvoldRepo,martletCore,krigsvoldCore,outArg]=process.argv.slice(2);
assert.ok(martletRepo&&krigsvoldRepo&&martletCore&&krigsvoldCore&&outArg,'Usage: node scripts/nightjar3/core-react-rehearsal.mjs MARTLET_REPO KRIGSVOLD_REPO MARTLET_CORE_TGZ KRIGSVOLD_CORE_TGZ NEW_OUTPUT');
const manifest=JSON.parse(readFileSync(new URL('../../fixtures/core-migration/candidates.json',import.meta.url),'utf8'));
assert.equal(manifest.status,'unpublished-local-only');
const cases=[['martlet',martletRepo,martletCore],['krigsvold',krigsvoldRepo,krigsvoldCore]].map(([family,repo,archive])=>{const p=manifest.families[family];return {family,repo,archive,commit:p.reactSourceCommit,tree:p.reactSourceTree,version:p.coreVersion,sha:p.coreSha256};});
const out=resolve(outArg);mkdirSync(out);const temp=mkdtempSync(join(tmpdir(),'nightjar-core-react-'));
function run(program,args,opts={}){const result=spawnSync(program,args,{encoding:'utf8',maxBuffer:32*1024*1024,...opts});if(result.error)throw result.error;if(result.status!==0)throw Error(`${program} failed: ${result.stderr||result.stdout}`);return result.stdout.trim();}
try{for(const c of cases){
 const bytes=readFileSync(resolve(c.archive));assert.equal(createHash('sha256').update(bytes).digest('hex'),c.sha,`${c.family}: core archive differs`);
 const source=join(temp,c.family);mkdirSync(source);let commit=c.commit;
 if(process.env.NIGHTJAR_RECONSTRUCTED_REACT_TREE==='1'){
  const env={...process.env};for(const key of Object.keys(env))if(key.startsWith('GIT_'))delete env[key];Object.assign(env,{GIT_NO_REPLACE_OBJECTS:'1',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:devNull});
  commit=run('git',['-C',resolve(c.repo),'rev-parse','HEAD'],{env});
  const tree=run('git',['-C',resolve(c.repo),'rev-parse',`${commit}^{tree}`],{env});
  assert.equal(tree,c.tree,`${c.family}: reconstructed React tree differs from recorded candidate`);
 }
 pinned(resolve(c.repo),commit);archive(resolve(c.repo),commit,source);
 run('npm',['ci','--offline','--ignore-scripts','--no-audit','--no-fund'],{cwd:source});
 const file=join(source,'package.json'),pkg=JSON.parse(readFileSync(file,'utf8'));assert.equal(pkg.dependencies[`@${c.family}/theme`],'2.1.0');delete pkg.dependencies[`@${c.family}/theme`];pkg.dependencies[`@${c.family}/core`]=c.version;pkg.version='0.2.0';pkg.private=true;writeFileSync(file,JSON.stringify(pkg,null,2)+'\n');
 const css=join(source,'src/styles.css'),before=readFileSync(css,'utf8'),after=before.replaceAll(`@${c.family}/theme/`,`@${c.family}/core/`).replace('Theme 2.1.0 is unchanged.','Unpublished core migration rehearsal.');assert.notEqual(before,after,'Expected legacy CSS imports');writeFileSync(css,after);
 run('npm',['install','--offline','--ignore-scripts','--no-audit','--no-fund','--no-save',resolve(c.archive)],{cwd:source});run('npm',['run','build'],{cwd:source});
 const afterInstall=JSON.parse(readFileSync(file,'utf8'));assert.equal(afterInstall.dependencies[`@${c.family}/core`],c.version);assert.equal(afterInstall.version,'0.2.0');
 run('npm',['pack','--ignore-scripts','--pack-destination',out],{cwd:source});
 cpSync(resolve(c.archive),join(out,`${c.family}-core-${c.version}.tgz`));
 console.log(`${c.family}: private React 0.2.0 rehearsal packed with core ${c.version}; input commit ${commit}, recorded source ${c.commit}, tree ${c.tree}`);
}}finally{rmSync(temp,{recursive:true,force:true});}
