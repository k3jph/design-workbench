#!/usr/bin/env python3
"""Create two local-only attributed Jekyll repositories from a frozen export.

This is a rehearsal, not a source-authority transfer. No remotes are configured.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess

REPO = Path(__file__).resolve().parents[2]
FROZEN = '80a5635abe4de7a07a1983de0b3ef796b101e047'
HELPERS = REPO / 'scripts/qa/jekyll-rehearsal'

def git(*args):
    return subprocess.check_output(['git', '-C', str(REPO), *args])

def names_at(prefix):
    output = git('ls-tree', '-r', '-z', '--name-only', BASE, '--', prefix)
    return {s.decode()[len(prefix) + 1:] for s in output.split(b'\0') if s}

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--destination', type=Path, required=True, help='existing directory for the two new local repositories')
parser.add_argument('--source-commit', default=FROZEN, help='full immutable local workbench commit descended from the frozen baseline')
args = parser.parse_args()
BASE = args.source_commit
if not re.fullmatch(r'[0-9a-f]{40}', BASE):
    raise SystemExit('Source commit must be a full lowercase 40-character SHA')
try:
    resolved = git('rev-parse', '--verify', BASE + '^{commit}').decode().strip()
    subprocess.run(['git', '-C', str(REPO), 'merge-base', '--is-ancestor', FROZEN, BASE], check=True, capture_output=True)
except subprocess.CalledProcessError as error:
    raise SystemExit('Source commit must exist locally and descend from the frozen baseline') from error
if resolved != BASE:
    raise SystemExit('Source commit must identify the exact commit, not a tag')
dirty = git('status', '--porcelain=v1', '-z', '--untracked-files=all', '--', 'examples/jekyll', 'examples/page-archetypes')
if dirty:
    raise SystemExit('Jekyll source/export paths are dirty; commit, stash, or use a clean worktree before rehearsal')
parent = args.destination.resolve(strict=True)
if not parent.is_dir() or parent == REPO or REPO.is_relative_to(parent) or parent.is_relative_to(REPO):
    raise SystemExit('Destination must be an existing directory outside the workbench')
destinations = {family: parent / f'jekyll-{family}' for family in ('martlet', 'krigsvold')}
if any(path.exists() for path in destinations.values()):
    raise SystemExit('Both destination paths must be absent; no existing files will be overwritten')
manifest = json.loads(git('show', f'{BASE}:examples/page-archetypes/contracts/jekyll-source-files.json'))
shared = names_at('examples/page-archetypes/jekyll')
for family, dest in destinations.items():
    prefix = f'examples/jekyll/{family}'
    overlay = names_at(f'examples/page-archetypes/families/{family}')
    tree = git('ls-tree', '-r', '-z', BASE, '--', prefix)
    tracked = {}
    for item in tree.split(b'\0'):
        if not item:
            continue
        metadata, path = item.split(b'\t', 1)
        mode, kind, oid = metadata.decode().split()
        relative = path.decode()[len(prefix) + 1:]
        tracked[relative] = (mode, kind, oid)
    entries = manifest[family]
    if not entries or len(entries) != len(set(entries)):
        raise SystemExit(f'Invalid manifest for {family}')
    provenance = []
    dest.mkdir()
    for entry in entries:
        relative = Path(entry)
        if relative.is_absolute() or str(relative) != entry or any(part in ('.', '..') for part in relative.parts):
            raise SystemExit(f'Unsafe manifest path: {entry!r}')
        mode, kind, oid = tracked.get(entry, ('', '', ''))
        if mode not in ('100644', '100755') or kind != 'blob':
            raise SystemExit(f'Missing or non-regular tracked entry: {family}/{entry}')
        content = git('cat-file', 'blob', oid)
        source_digest = hashlib.sha256(content).hexdigest()
        if entry == 'README.md':
            content = (b'> **Local extraction rehearsal:** This is an attributed snapshot, not a source-authority transfer. See [standalone build and verification instructions](nightjar/README.md); `python3 nightjar/build.py --destination /absolute/output` creates the source download without the workbench. The historical export instructions below describe the original context.\n\n' + content)
        elif entry == 'docs/archetypes/README.md':
            content = (b'> **Snapshot context:** The paths and commands below refer to the upstream workbench, not files inside this standalone candidate. Shared catalog, fixtures, contracts and `sync.py` remain workbench-owned. For standalone build and verification use [the rehearsal instructions](../../nightjar/README.md). Do not treat this snapshot as an independent canonical source until a separately approved handoff.\n\n' + content)
        target = dest / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        target.chmod(0o755 if mode == '100755' else 0o644)
        if entry in shared:
            origin = f'examples/page-archetypes/jekyll/{entry}'
        elif entry in overlay:
            origin = f'examples/page-archetypes/families/{family}/{entry}'
        elif entry in ('_layouts/default.html', '_config.yml', 'index.md'):
            origin = 'seeded export transformed by examples/page-archetypes/scripts/sync.py'
        elif entry.startswith('examples/') or entry in ('404.html', '_data/dashboard_navigation.json', '_data/dashboard_peer.json', '_data/dashboards.json', '_data/examples.json', '_data/navigation.yml'):
            origin = 'generated by examples/page-archetypes/scripts/sync.py from shared catalog/fixtures'
        else:
            origin = f'{prefix}/{entry} (family export or copied contract; review individual origin before handoff)'
        provenance.append({'path': entry, 'source': f'{prefix}/{entry}', 'origin': origin, 'git_blob': oid, 'source_sha256': source_digest, 'snapshot_sha256': hashlib.sha256(content).hexdigest(), 'transformation': 'prepended standalone context notice' if entry in ('README.md', 'docs/archetypes/README.md') else 'byte-identical'})
    extra = ['nightjar/README.md', 'nightjar/PROVENANCE.json', 'nightjar/source-files.json', 'nightjar/build.py', 'nightjar/verify.py', 'nightjar/verify-html.py', 'nightjar/ci-proposal.yml']
    (dest / 'nightjar').mkdir()
    (dest / 'nightjar/PROVENANCE.json').write_text(json.dumps({'family': family, 'workbench_commit': BASE, 'source_manifest': 'examples/page-archetypes/contracts/jekyll-source-files.json', 'authority': 'rehearsal snapshot; workbench remains authoritative', 'files': provenance}, indent=2) + '\n')
    (dest / 'nightjar/source-files.json').write_text(json.dumps(sorted(entries + extra), indent=2) + '\n')
    for name in ('build.py', 'verify.py'):
        (dest / 'nightjar' / name).write_bytes((HELPERS / name).read_bytes())
    (dest / 'nightjar/verify-html.py').write_bytes(git('show', f'{BASE}:examples/page-archetypes/scripts/verify-html.py'))
    (dest / 'nightjar/README.md').write_text(f'''# {family.title()} Jekyll — local extraction rehearsal\n\nThis is an attributed local snapshot of the generated export at workbench `{BASE}`. It is not an upstream source-authority transfer or a new published theme. See `PROVENANCE.json` for file-level mappings and immutable blob hashes. Shared catalog, fixtures, schemas and generator remain owned by the workbench.\n\nInstall the locked gems ahead of time, then run `BUNDLE_FROZEN=true python3 nightjar/verify.py`. Build with `python3 nightjar/build.py --destination /absolute/output` and optionally `--baseurl /preview` or `--safe`. The build reads only this checkout and preinstalled locked gems; it makes a source archive from the explicit allowlist. `verify.py` rebuilds an unpacked archive without Git metadata, checks links, security fallbacks and rejects unsafe source inputs. The included `ci-proposal.yml` is inactive and must be reviewed before any future use.\n\nConformance inputs must be explicitly pinned to workbench `{BASE}`; no runtime checkout or fetch is performed here. Do not make this snapshot authoritative or publish it without separate approval.\n''')
    (dest / 'nightjar/ci-proposal.yml').write_text('''# Inactive proposal for a future local-only Jekyll repository. No publication.\nname: Verify standalone snapshot\non: [pull_request, push]\npermissions:\n  contents: read\njobs:\n  verify:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: ruby/setup-ruby@v1\n        with:\n          ruby-version: '3.2'\n          bundler-cache: true\n      - run: BUNDLE_FROZEN=true python3 nightjar/verify.py\n''')
    subprocess.run(['git', 'init', '-q', str(dest)], check=True)
    subprocess.run(['git', '-C', str(dest), 'add', '--all'], check=True)
    subprocess.run(['git', '-C', str(dest), '-c', 'user.name=Nightjar Rehearsal', '-c', 'user.email=nightjar-rehearsal@invalid', 'commit', '-qm', f'Rehearse {family} Jekyll snapshot from {BASE}'], check=True)
    revision = subprocess.check_output(['git', '-C', str(dest), 'rev-parse', 'HEAD'], text=True).strip()
    print(f'{family}: {dest} local commit {revision}; {len(entries)} export files (two context notices added), no remote')
