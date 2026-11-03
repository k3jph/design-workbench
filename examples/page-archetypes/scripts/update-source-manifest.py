#!/usr/bin/env python3
"""Record the tracked standalone Jekyll source files used for distributable builds."""
import argparse
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[3]
manifest = root / 'examples/page-archetypes/contracts/jekyll-source-files.json'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true', help='fail if the manifest differs from the Git index')
args = parser.parse_args()
files = {}
for family in ('martlet', 'krigsvold'):
    source = Path('examples/jekyll') / family
    output = subprocess.check_output(['git', 'ls-files', '-z', '--', str(source)], cwd=root)
    files[family] = sorted(str(Path(path.decode()).relative_to(source)) for path in output.split(b'\0') if path)
    if not files[family]:
        raise SystemExit(f'No tracked source files for {family}; run in a workbench Git checkout.')
contents = json.dumps(files, indent=2, ensure_ascii=False) + '\n'
if args.check:
    if not manifest.exists() or manifest.read_text() != contents:
        raise SystemExit('Jekyll source manifest differs from the Git index; stage intended source files and regenerate it.')
else:
    manifest.write_text(contents)
