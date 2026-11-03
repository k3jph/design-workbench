#!/usr/bin/env python3
"""Exercise source archives in a disposable checkout without Git metadata."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[3]

class SourceArchiveTest(unittest.TestCase):
    def test_only_manifested_regular_files_reach_site_and_archive(self):
        with tempfile.TemporaryDirectory(prefix='nightjar-source-archive-') as temporary:
            root = Path(temporary)
            examples = root / 'examples'
            shutil.copytree(ROOT / 'examples/page-archetypes/scripts', examples / 'page-archetypes/scripts')
            shutil.copytree(ROOT / 'examples/page-archetypes/contracts', examples / 'page-archetypes/contracts')
            self.assertFalse((root / '.git').exists(), 'Git metadata must not be required')
            external = root / 'external-canary.txt'
            external.write_text('outside synthetic canary')
            manifest = json.loads((examples / 'page-archetypes/contracts/jekyll-source-files.json').read_text())
            for family in ('martlet', 'krigsvold'):
                with self.subTest(family=family):
                    source = examples / 'jekyll' / family
                    shutil.copytree(ROOT / 'examples/jekyll' / family, source, ignore=shutil.ignore_patterns('dist', '_site', '.jekyll-cache', '.bundle', 'vendor', 'node_modules'))
                    (source / '.env').write_text('private synthetic canary')
                    (source / 'unlisted-private.txt').write_text('unlisted synthetic canary')
                    (source / '.private-link').symlink_to(external)
                    (source / 'assets/unlisted-link.txt').symlink_to(external)
                    (source / 'README.md').write_text('Local intentional template change.\n')
                    for base in ('', '/preview'):
                        dest = root / (family + ('-root' if not base else '-preview'))
                        result = subprocess.run([sys.executable, str(examples / 'page-archetypes/scripts/build.py'), '--family', family, '--baseurl', base, '--destination', str(dest)], capture_output=True, text=True)
                        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                        check = subprocess.run([sys.executable, str(examples / 'page-archetypes/scripts/verify-html.py'), str(dest), '--baseurl', base], capture_output=True, text=True)
                        self.assertEqual(check.returncode, 0, check.stdout + check.stderr)
                        with zipfile.ZipFile(dest / 'template.zip') as archive:
                            self.assertEqual(set(archive.namelist()), set(manifest[family]))
                            self.assertEqual(archive.read('README.md'), b'Local intentional template change.\n')
                            shell = json.loads(archive.read('_data/shell.json'))
                            self.assertEqual(shell['contract'], 'docs/source-shell/CONTRACT.md')
                            self.assertEqual(hashlib.sha256(archive.read(shell['contract'])).hexdigest(), shell['contract_sha256'])
                            self.assertIn(b'upstream', archive.read('docs/source-shell/README.md'))
                        for unwanted in ('.env', 'unlisted-private.txt', '.private-link', 'assets/unlisted-link.txt'):
                            self.assertFalse((dest / unwanted).exists(), f'{unwanted} leaked into the built site')
                        if not base:
                            unpacked = root / (family + '-unpacked')
                            with zipfile.ZipFile(dest / 'template.zip') as archive:
                                archive.extractall(unpacked)
                            unpacked_dest = root / (family + '-unpacked-site')
                            rebuilt = subprocess.run(['bundle', 'exec', 'jekyll', 'build', '--source', str(unpacked), '--destination', str(unpacked_dest)], cwd=unpacked, capture_output=True, text=True)
                            self.assertEqual(rebuilt.returncode, 0, rebuilt.stdout + rebuilt.stderr)
                            links = subprocess.run([sys.executable, str(examples / 'page-archetypes/scripts/verify-html.py'), str(unpacked_dest)], capture_output=True, text=True)
                            self.assertEqual(links.returncode, 0, links.stdout + links.stderr)
                    # Reject symlinks and missing entries before Jekyll can read the source.
                    (source / 'assets/mark.svg').unlink()
                    (source / 'assets/mark.svg').symlink_to(external)
                    invoked = root / (family + '-jekyll-invoked')
                    env = {**os.environ, 'JEKYLL_COMMAND_JSON': json.dumps([sys.executable, '-c', f"open({str(invoked)!r}, 'w').write('invoked')"])}
                    failed = subprocess.run([sys.executable, str(examples / 'page-archetypes/scripts/build.py'), '--family', family, '--destination', str(root / (family + '-bad'))], env=env, capture_output=True, text=True)
                    self.assertNotEqual(failed.returncode, 0, 'manifested symlinks must be rejected')
                    self.assertFalse(invoked.exists(), 'the source must be validated before invoking Jekyll')
                    (source / 'assets/mark.svg').unlink()
                    shutil.copy2(ROOT / 'examples/jekyll' / family / 'assets/mark.svg', source / 'assets/mark.svg')
                    unsafe = subprocess.run([sys.executable, str(examples / 'page-archetypes/scripts/build.py'), '--family', family, '--destination', str(source / 'assets')], env=env, capture_output=True, text=True)
                    self.assertNotEqual(unsafe.returncode, 0, 'destinations containing source files must fail')
                    self.assertIn('destination would overwrite source file', unsafe.stderr)
                    self.assertFalse(invoked.exists(), 'unsafe destinations must be rejected before Jekyll')
                    (source / 'language.md').unlink()
                    missing = subprocess.run([sys.executable, str(examples / 'page-archetypes/scripts/build.py'), '--family', family, '--destination', str(root / (family + '-missing'))], env=env, capture_output=True, text=True)
                    self.assertNotEqual(missing.returncode, 0, 'missing manifest entries must fail')
                    self.assertIn('Missing required Jekyll source file', missing.stderr)
                    self.assertFalse(invoked.exists(), 'missing files must be detected before invoking Jekyll')
                    shutil.copy2(ROOT / 'examples/jekyll' / family / 'language.md', source / 'language.md')
                    manifest_file = examples / 'page-archetypes/contracts/jekyll-source-files.json'
                    tampered = json.loads(manifest_file.read_text())
                    tampered[family].append('../external-canary.txt')
                    manifest_file.write_text(json.dumps(tampered))
                    unsafe_manifest = subprocess.run([sys.executable, str(examples / 'page-archetypes/scripts/build.py'), '--family', family, '--destination', str(root / (family + '-unsafe-manifest'))], env=env, capture_output=True, text=True)
                    self.assertNotEqual(unsafe_manifest.returncode, 0, 'manifest path traversal must fail')
                    self.assertIn('Unsafe source manifest path', unsafe_manifest.stderr)
                    self.assertFalse(invoked.exists(), 'unsafe manifests must be rejected before Jekyll')
                    manifest_file.write_text(json.dumps(manifest))

if __name__ == '__main__':
    unittest.main()
