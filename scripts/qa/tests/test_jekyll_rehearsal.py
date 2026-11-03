import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / 'scripts/qa/nightjar-jekyll-rehearsal.py'
BASE = '80a5635abe4de7a07a1983de0b3ef796b101e047'

class JekyllRehearsalTest(unittest.TestCase):
    def test_snapshots_reproduce_and_never_overwrite(self):
        with tempfile.TemporaryDirectory(prefix='nightjar-jekyll-materialize-') as temporary:
            parent = Path(temporary)
            first, second = parent / 'first', parent / 'second'
            first.mkdir(); second.mkdir()
            for location in (first, second):
                subprocess.run([sys.executable, str(SCRIPT), '--destination', str(location)], check=True, capture_output=True, text=True)
            for family, count in (('martlet', 189), ('krigsvold', 181)):
                a, b = first / f'jekyll-{family}', second / f'jekyll-{family}'
                git = lambda root, *args: subprocess.check_output(['git', '-C', str(root), *args], text=True).strip()
                self.assertEqual(git(a, 'rev-parse', 'HEAD^{tree}'), git(b, 'rev-parse', 'HEAD^{tree}'))
                self.assertEqual(git(a, 'remote'), '')
                self.assertEqual(git(a, 'status', '--porcelain'), '')
                provenance = json.loads((a / 'nightjar/PROVENANCE.json').read_text())
                self.assertEqual(provenance['workbench_commit'], BASE)
                self.assertEqual(provenance['family'], family)
                self.assertEqual(len(provenance['files']), count)
                for item in provenance['files']:
                    target = a / item['path']
                    self.assertEqual(hashlib.sha256(target.read_bytes()).hexdigest(), item['snapshot_sha256'])
                    original = subprocess.check_output(['git', '-C', str(ROOT), 'cat-file', 'blob', item['git_blob']])
                    self.assertEqual(hashlib.sha256(original).hexdigest(), item['source_sha256'])
                    if item['transformation'] == 'byte-identical':
                        self.assertEqual(target.read_bytes(), original)
                tracked = set(git(a, 'ls-files').splitlines())
                self.assertEqual(tracked, set(json.loads((a / 'nightjar/source-files.json').read_text())))
            refused = subprocess.run([sys.executable, str(SCRIPT), '--destination', str(first)], capture_output=True, text=True)
            self.assertNotEqual(refused.returncode, 0)
            self.assertIn('must be absent', refused.stderr)
            self.assertEqual(git(first / 'jekyll-martlet', 'status', '--porcelain'), '')
            rejected_ref = subprocess.run([sys.executable, str(SCRIPT), '--destination', str(parent), '--source-commit', 'main'], capture_output=True, text=True)
            self.assertNotEqual(rejected_ref.returncode, 0)
            self.assertIn('full lowercase 40-character SHA', rejected_ref.stderr)
            rejected_old = subprocess.run([sys.executable, str(SCRIPT), '--destination', str(parent), '--source-commit', '5138a89fc2956d9019d5bd720c987b8b9e24533b'], capture_output=True, text=True)
            self.assertNotEqual(rejected_old.returncode, 0)
            self.assertIn('descend from the frozen baseline', rejected_old.stderr)
            # Exercise dirty-source refusal in a disposable clone, never the shared source worktree.
            clone = parent / 'dirty-clone'
            subprocess.run(['git', 'clone', '-q', '--shared', '--no-checkout', str(ROOT), str(clone)], check=True)
            subprocess.run(['git', '-C', str(clone), 'checkout', '-q', '--detach', BASE], check=True)
            helper = clone / 'scripts/qa/jekyll-rehearsal'
            helper.mkdir(parents=True)
            for name in ('build.py', 'verify.py'):
                shutil.copy2(ROOT / 'scripts/qa/jekyll-rehearsal' / name, helper / name)
            clone_script = clone / 'scripts/qa/nightjar-jekyll-rehearsal.py'
            shutil.copy2(SCRIPT, clone_script)
            source = clone / 'examples/jekyll/martlet/index.md'
            source.write_text(source.read_text() + '\nsynthetic uncommitted edit\n')
            output = parent / 'dirty-output'; output.mkdir()
            rejected_dirty = subprocess.run([sys.executable, str(clone_script), '--destination', str(output)], capture_output=True, text=True)
            self.assertNotEqual(rejected_dirty.returncode, 0)
            self.assertIn('source/export paths are dirty', rejected_dirty.stderr)
            self.assertEqual(list(output.iterdir()), [])

if __name__ == '__main__':
    unittest.main()
