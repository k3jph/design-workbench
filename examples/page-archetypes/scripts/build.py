#!/usr/bin/env python3
"""Build both standalone Jekyll sites, plus clean source downloads."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import shutil
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--family', choices=['martlet', 'krigsvold'])
parser.add_argument('--baseurl', default='')
parser.add_argument('--destination', type=Path)
args = parser.parse_args()
if args.destination and not args.family: parser.error('--destination requires --family')
command = json.loads(os.environ.get('JEKYLL_COMMAND_JSON', '["bundle", "exec", "jekyll"]'))
manifest = json.loads((ROOT / 'contracts/jekyll-source-files.json').read_text())
for family in ([args.family] if args.family else ['martlet', 'krigsvold']):
    source = REPO / 'examples/jekyll' / family
    destination = (args.destination or source / 'dist').resolve()
    entries = manifest.get(family)
    if not isinstance(entries, list) or not entries or not all(isinstance(entry, str) for entry in entries) or len(entries) != len(set(entries)):
        raise SystemExit(f'Invalid or empty source manifest for {family}.')
    if source.is_symlink():
        raise SystemExit(f'Symlink is not allowed as Jekyll source: {source}')
    if source.resolve().is_relative_to(destination):
        raise SystemExit('Jekyll destination must not contain the source directory.')
    with tempfile.TemporaryDirectory(prefix=f'nightjar-{family}-source-') as temporary:
        staged = Path(temporary) / 'source'
        for entry in entries:
            relative = Path(entry)
            if relative.is_absolute() or str(relative) != entry or any(part in ('.', '..') for part in relative.parts):
                raise SystemExit(f'Unsafe source manifest path: {entry!r}')
            if (source.resolve() / relative).is_relative_to(destination):
                raise SystemExit(f'Jekyll destination would overwrite source file: {relative}')
            current = source
            for part in relative.parts:
                current = current / part
                if current.is_symlink():
                    raise SystemExit(f'Symlink is not allowed in Jekyll source: {current}')
            if not current.is_file():
                raise SystemExit(f'Missing required Jekyll source file: {current}')
            target = staged / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(current, target)
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yml') as override:
            override.write('source_archive: true\n')
            override.flush()
            subprocess.run([*command, 'build', '--config', str(staged / '_config.yml') + ',' + override.name,
                            '--source', str(staged), '--destination', str(destination), '--baseurl', args.baseurl,
                            '--strict_front_matter', '--trace'], check=True, cwd=source)
        with zipfile.ZipFile(destination / 'template.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
            for entry in entries:
                archive.write(staged / entry, entry)
    print(f'{family}: built with baseurl={args.baseurl!r}; source download ready')
