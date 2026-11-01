#!/usr/bin/env node
// Read-only audit: unknown/inaccessible policy is never treated as protected.
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const allowedRepo = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function classify(rulesets, target, ref) {
  const required = target === 'branch'
    ? ['pull_request', 'required_status_checks', 'deletion', 'non_fast_forward']
    : ['creation', 'update', 'deletion'];
  const result = {};
  for (const type of required) {
    const matches = rulesets.filter(r => r.target === target && r.enforcement === 'active'
      && Array.isArray(r.conditions?.ref_name?.include)
      && r.conditions.ref_name.include.includes(ref)
      && Array.isArray(r.conditions.ref_name.exclude)
      && r.conditions.ref_name.exclude.length === 0
      && Array.isArray(r.rules) && r.rules.some(rule => rule.type === type));
    result[type] = matches.length ? matches.map(r => {
      const parameters = r.rules.find(rule => rule.type === type).parameters ?? {};
      const warnings = [];
      if (!Array.isArray(r.bypass_actors)) warnings.push('Bypass actors unknown');
      else if (r.bypass_actors.length) warnings.push('Bypass actors require review');
      if (type === 'pull_request' && !(parameters.required_approving_review_count >= 1)) warnings.push('At least one approving review is not demonstrated');
      if (type === 'required_status_checks' && (!Array.isArray(parameters.required_status_checks) || !parameters.required_status_checks.length)) warnings.push('Required CI checks are not demonstrated');
      return {id:r.id, name:r.name, source:r.source, parameters, bypass_actors:r.bypass_actors ?? 'unknown', warnings};
    }) : 'not demonstrated';
  }
  return result;
}

export function audit(repo, api) {
  if (!allowedRepo.test(repo)) throw new Error('Expected OWNER/REPOSITORY');
  const summary = api(`repos/${repo}/rulesets?includes_parents=true&per_page=100`, true);
  if (!Array.isArray(summary)) throw new Error('Unexpected ruleset response');
  const all = [];
  for (const entry of summary) {
    if (!Number.isSafeInteger(entry.id) || !['Repository','Organization'].includes(entry.source_type)) throw new Error('Unrecognized ruleset source');
    const owner = repo.split('/')[0];
    const endpoint = entry.source_type === 'Organization' ? `orgs/${owner}/rulesets/${entry.id}` : `repos/${repo}/rulesets/${entry.id}`;
    const detail = api(endpoint, false);
    if (!detail || detail.id !== entry.id || !Array.isArray(detail.rules)) throw new Error('Incomplete ruleset details');
    all.push(detail);
  }
  return {repository:repo, active_rulesets:all.filter(x=>x.enforcement==='active').map(x=>({id:x.id,name:x.name,source:x.source,target:x.target})),
    main:classify(all,'branch','refs/heads/main'), develop:classify(all,'branch','refs/heads/develop'),
    version_tags:classify(all,'tag','refs/tags/v*'),
    caveat:'Exact-pattern evidence only. Review bypass actors, exclusions, PR approval counts, required check identities, creation actors, organization permissions, legacy protection and GitHub plan enforcement independently. This report is not release authorization.'};
}

function ghApi(endpoint, paginate) {
  const args = ['api', endpoint, '--method', 'GET'];
  if (paginate) args.push('--paginate','--slurp');
  const value = JSON.parse(execFileSync('gh',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
  return paginate ? value.flat() : value;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(audit(process.argv[2],ghApi),null,2)); }
  catch (error) { console.error(`Ruleset audit unavailable: ${error.message.split('\n')[0]}`); process.exitCode=1; }
}
