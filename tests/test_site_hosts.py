import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('site_hosts', ROOT / 'scripts/docs-versions/check-site-hosts.py')
site_hosts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(site_hosts)

class HostPlanTests(unittest.TestCase):
    def test_exact_eight_hosts_and_reject_wrong_scope(self):
        plan = json.loads(site_hosts.DEFAULT_PLAN.read_text())
        self.assertEqual(len(site_hosts.hosts(plan)), 8)
        plan['reference']['martlet']['astro'] = 'evil.invalid'
        with self.assertRaises(ValueError):
            site_hosts.hosts(plan)

    def test_proxy_denial_is_inconclusive_and_http_is_not_health(self):
        with tempfile.TemporaryDirectory() as scratch:
            program = Path(scratch) / 'curl-fixture'
            program.write_text('#!/bin/sh\nprintf 000\nexit 56\n')
            os.chmod(program, 0o755)
            failed = site_hosts.observe(str(program), 'martletdesign.dev')
            self.assertEqual(failed['classification'], 'inconclusive')
            self.assertEqual(failed['curlExit'], 56)
            program.write_text('#!/bin/sh\nprintf 503\n')
            response = site_hosts.observe(str(program), 'martletdesign.dev')
            self.assertEqual(response['classification'], 'http_response')
            self.assertEqual(response['httpCode'], 503)

if __name__ == '__main__':
    unittest.main()
