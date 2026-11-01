import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// A green run is evidence only for the exact commit which produced it.
export function assess(recorded, current, runs) {
  if (!/^[0-9a-f]{40}$/.test(recorded) || !/^[0-9a-f]{40}$/.test(current))
    throw new Error('A full recorded and current SHA is required');
  if (recorded !== current) return { state: 'head_changed', recorded, current, runs: [] };
  if (!Array.isArray(runs)) throw new Error('Invalid workflow response');
  const exact = runs.filter(run => run.head_sha === current).map(run => ({
    name: run.name, workflow_id: run.workflow_id, id: run.id, status: run.status, conclusion: run.conclusion,
    url: run.html_url,
  }));
  if (!exact.length) return { state: 'no_runs', recorded, current, runs: [] };
  // Do not erase an older failed workflow merely because a different workflow passed.
  const byWorkflow = new Map();
  for (const run of exact.sort((a, b) => b.id - a.id)) {
    const key = run.workflow_id ?? run.name;
    if (!byWorkflow.has(key)) byWorkflow.set(key, run);
  }
  const latest = [...byWorkflow.values()];
  const state = latest.some(run => run.status === 'completed' && run.conclusion !== 'success') ? 'not_all_success'
    : latest.some(run => run.status !== 'completed') ? 'pending' : 'observed_success';
  return { state, recorded, current, runs: latest };
}

function gh(path) {
  const result = spawnSync('gh', ['api', path], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`GitHub API unavailable for ${path}`);
  return JSON.parse(result.stdout);
}

export async function main(args) {
  const [ledgerPath, repository, number] = args;
  if (!ledgerPath || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository || '') || !/^[1-9]\d*$/.test(number || ''))
    throw new Error('Usage: node scripts/qa/nightjar-ci-status.mjs LEDGER OWNER/REPO PR_NUMBER');
  const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'));
  const entry = ledger.repositories.find(item => item.repository === repository);
  const pr = entry?.open_pull_requests.find(item => item.number === Number(number));
  if (!pr) throw new Error('PR is not present in the ledger snapshot');
  const actual = gh(`repos/${repository}/pulls/${number}`);
  const current = actual?.head?.sha;
  if (pr.sha !== current) return assess(pr.sha, current, []);
  const response = gh(`repos/${repository}/actions/runs?head_sha=${current}&per_page=100`);
  if (response.total_count > 100) throw new Error('More than 100 runs; inspect paginated results manually');
  return assess(pr.sha, current, response.workflow_runs);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { const result = await main(process.argv.slice(2)); console.log(JSON.stringify(result, null, 2)); if (result.state !== 'observed_success') process.exitCode = 1; }
  catch (error) { console.error(error.message); process.exitCode = 2; }
}
