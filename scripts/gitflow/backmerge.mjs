#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

// A branch tip, not a detached checkout, is required: stale or missing remote
// refs cannot establish that a production release reached develop.
export function checkBackmerge(repo, main='refs/remotes/origin/main', develop='refs/remotes/origin/develop') {
  const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  const a=git('rev-parse','--verify',`${main}^{commit}`);
  const b=git('rev-parse','--verify',`${develop}^{commit}`);
  try {git('merge-base','--is-ancestor',a,b);} catch {throw new Error(`Production commit ${a} is not in develop ${b}`);}
  return {main:a,develop:b};
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {console.log(JSON.stringify(checkBackmerge(process.cwd())));}
  catch {console.error('Back-merge not verified; fetch the main and develop remote refs and reconcile their histories.');process.exitCode=1;}
}
