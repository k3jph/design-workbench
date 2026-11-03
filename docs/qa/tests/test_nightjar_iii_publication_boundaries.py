"""Offline graph examples only; these do not create or change any protections."""
from copy import deepcopy
from pathlib import Path
import unittest

import yaml

from docs.qa.tests.test_nightjar_publication_graph import assess, documented_policy


ROOT = Path(__file__).resolve().parents[3]
BOUNDARIES = {
    'package': ('reference-approval', 'reference-release-approval'),
    'publish': ('reference-publish-approval', 'reference-publish-approval'),
    'adopt': ('host-adoption-approval', 'host-adoption-approval'),
}


def independently_gated(jobs):
    """Reject missing direct approval dependencies in this illustrative graph.

    A real review must also verify actual environment policy, immutable subjects,
    family scope, caller graphs, external hosting and all other effects.
    """
    errors = []
    for effect, (gate, environment) in BOUNDARIES.items():
        job = jobs.get(effect, {})
        needs = job.get('needs', [])
        if isinstance(needs, str):
            needs = [needs]
        if gate not in needs:
            errors.append(f'{effect} lacks independent {gate}')
        if str(job.get('if', 'success()')).strip() not in ('success()', '${{ success() }}'):
            errors.append(f'{effect} has non-success condition')
        approval = jobs.get(gate, {})
        configured = approval.get('environment', {})
        name = configured.get('name') if isinstance(configured, dict) else configured
        if name != environment or approval.get('if'):
            errors.append(f'{gate} environment or condition requires review')
    return errors


class PublicationBoundaryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.actual = yaml.safe_load((ROOT / '.github/workflows/reference-release.yml').read_text())['jobs']

    def one_gate(self):
        jobs = deepcopy(self.actual)
        jobs['reference-approval'] = {'environment': {'name': 'reference-release-approval'}}
        jobs['package']['needs'] = 'reference-approval'
        return jobs

    def separated(self):
        jobs = self.one_gate()
        jobs['reference-publish-approval'] = {
            'environment': {'name': 'reference-publish-approval'}, 'needs': 'test-archives'}
        jobs['publish']['needs'] = ['test-archives', 'reference-publish-approval']
        jobs['host-adoption-approval'] = {
            'environment': {'name': 'host-adoption-approval'}, 'needs': 'publish'}
        jobs['adopt']['needs'] = ['publish', 'host-adoption-approval']
        return jobs

    def test_current_source_contains_real_effects_before_and_after_package(self):
        self.assertNotIn('needs', self.actual['package'])
        publish = (ROOT / 'scripts/reference-release/publish.mjs').read_text()
        adopt = (ROOT / 'scripts/reference-release/adopt.mjs').read_text()
        self.assertIn("method: 'POST'", publish)
        self.assertIn("method: 'PATCH'", publish)
        self.assertIn('/merge`', adopt)
        self.assertIn('Cloudflare deployment', adopt)

    def test_single_gate_satisfies_old_assumption_but_not_separate_decisions(self):
        jobs = self.one_gate()
        self.assertEqual(assess(jobs, documented_policy()), [])
        errors = independently_gated(jobs)
        self.assertIn('publish lacks independent reference-publish-approval', errors)
        self.assertIn('adopt lacks independent host-adoption-approval', errors)

    def test_illustrative_separate_edges_pass_only_this_narrow_model(self):
        self.assertEqual(independently_gated(self.separated()), [])

    def test_missing_later_gate_and_wrong_environment_fail(self):
        jobs = self.separated()
        del jobs['publish']['needs']
        self.assertIn('publish lacks independent reference-publish-approval', independently_gated(jobs))
        jobs = self.separated()
        jobs['host-adoption-approval']['environment']['name'] = 'reference-release-approval'
        self.assertIn('host-adoption-approval environment or condition requires review', independently_gated(jobs))

    def test_failure_and_always_conditions_do_not_bypass_approval(self):
        for effect in BOUNDARIES:
            for condition in ('always()', 'failure()', '${{ !cancelled() }}'):
                with self.subTest(effect=effect, condition=condition):
                    jobs = self.separated()
                    jobs[effect]['if'] = condition
                    self.assertIn(f'{effect} has non-success condition', independently_gated(jobs))


if __name__ == '__main__':
    unittest.main()
