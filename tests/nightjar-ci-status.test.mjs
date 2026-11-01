import test from 'node:test';
import assert from 'node:assert/strict';
import { assess } from '../scripts/qa/nightjar-ci-status.mjs';

const sha = 'a'.repeat(40), other = 'b'.repeat(40);
const run = (id, name, status, conclusion, head_sha = sha) => ({ id, name, status, conclusion, head_sha, html_url: `https://example.invalid/${id}` });
test('a moved head and missing evidence never pass', () => {
  assert.equal(assess(sha, other, [run(1, 'test', 'completed', 'success')]).state, 'head_changed');
  assert.equal(assess(sha, sha, [run(1, 'test', 'completed', 'success', other)]).state, 'no_runs');
  assert.throws(() => assess('main', sha, []));
});
test('latest result per workflow distinguishes pending, skipped and failed from success', () => {
  assert.equal(assess(sha, sha, [run(1, 'a', 'completed', 'failure'), run(2, 'a', 'completed', 'success'), run(3, 'b', 'completed', 'success')]).state, 'observed_success');
  assert.equal(assess(sha, sha, [run(1, 'a', 'completed', 'success'), run(2, 'b', 'queued', null)]).state, 'pending');
  assert.equal(assess(sha, sha, [run(1, 'a', 'completed', 'success'), run(2, 'b', 'completed', 'skipped')]).state, 'not_all_success');
  assert.equal(assess(sha, sha, [run(1, 'a', 'completed', 'success'), run(2, 'b', 'completed', 'failure')]).state, 'not_all_success');
  assert.equal(assess(sha, sha, [run(1, 'a', 'completed', 'failure'), run(2, 'b', 'queued', null)]).state, 'not_all_success');
});
