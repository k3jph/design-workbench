import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, chmod, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { assess } from '../scripts/qa/nightjar-ci-status.mjs';

const sha = 'a'.repeat(40), other = 'b'.repeat(40);
const run = (id, name, status, conclusion, head_sha = sha) => ({ id, name, status, conclusion, head_sha, html_url: `https://example.invalid/${id}` });
test('a moved head and missing evidence never pass', () => {
  assert.equal(assess(sha, other, [run(1, 'test', 'completed', 'success')]).state, 'head_changed');
  assert.equal(assess(sha, sha, [run(1, 'test', 'completed', 'success', other)]).state, 'no_runs');
  assert.throws(() => assess('main', sha, []));
});
test('CLI queries a pinned PR and fails closed on API errors', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'nightjar-ci-audit-'));
  try {
    const bin = join(dir, 'gh'), ledger = join(dir, 'ledger.json');
    await writeFile(ledger, JSON.stringify({ repositories: [{ repository: 'example/repo', open_pull_requests: [{ number: 3, sha }] }] }));
    await writeFile(bin, `#!/usr/bin/env node\nif(process.env.AUDIT_FAIL)process.exit(1);\nif(process.argv[3].includes('/pulls/'))console.log(JSON.stringify({head:{sha:'${sha}'}}));\nelse console.log(JSON.stringify({total_count:1,workflow_runs:[${JSON.stringify(run(12, 'ci', 'completed', 'success'))}]}));\n`);
    await chmod(bin, 0o755);
    const script = resolve('scripts/qa/nightjar-ci-status.mjs');
    const env = { ...process.env, PATH: `${dir}:${process.env.PATH}` };
    const ok = spawnSync(process.execPath, [script, ledger, 'example/repo', '3'], { env, encoding: 'utf8' });
    assert.equal(ok.status, 0, ok.stderr);
    assert.equal(JSON.parse(ok.stdout).state, 'observed_success');
    const bad = spawnSync(process.execPath, [script, ledger, 'example/repo', '3'], { env: { ...env, AUDIT_FAIL: '1' }, encoding: 'utf8' });
    assert.equal(bad.status, 2);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('latest result per workflow distinguishes pending, skipped and failed from success', () => {
  assert.equal(assess(sha, sha, [run(1, 'a', 'completed', 'failure'), run(2, 'a', 'completed', 'success'), run(3, 'b', 'completed', 'success')]).state, 'observed_success');
  assert.equal(assess(sha, sha, [run(1, 'a', 'completed', 'success'), run(2, 'b', 'queued', null)]).state, 'pending');
  assert.equal(assess(sha, sha, [run(1, 'a', 'completed', 'success'), run(2, 'b', 'completed', 'skipped')]).state, 'not_all_success');
  assert.equal(assess(sha, sha, [run(1, 'a', 'completed', 'success'), run(2, 'b', 'completed', 'failure')]).state, 'not_all_success');
  assert.equal(assess(sha, sha, [run(1, 'a', 'completed', 'failure'), run(2, 'b', 'queued', null)]).state, 'not_all_success');
});
