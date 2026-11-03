#!/usr/bin/env python3
"""Materialise portable fixtures and adapters into standalone Jekyll checkouts."""
import argparse
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]

def overlay(source, target):
    shutil.copytree(source, target, dirs_exist_ok=True)

def sync(family, target):
    catalog = json.loads((ROOT / 'content/catalog.json').read_text())
    target = target.resolve()
    if family not in ('martlet', 'krigsvold'):
        raise ValueError('Unknown family')
    overlay(ROOT / 'jekyll', target)
    overlay(ROOT / 'families' / family, target)
    (target / '_data').mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / 'content/dashboards.json', target / '_data/dashboards.json')
    (target / '_data/dashboard_navigation.json').write_text(json.dumps([{'id': view, 'title': view.capitalize(), 'url': '/examples/dashboard-' + view + '/'} for view in ['analytics', 'administration', 'operations']]))
    peer = 'krigsvold' if family == 'martlet' else 'martlet'
    (target / '_data/dashboard_peer.json').write_text(json.dumps({'name': peer.capitalize(), 'url': 'https://' + peer + '-jekyll.k3jph.chatgpt.site'}))
    (target / '_data/examples.json').write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + '\n')
    examples = target / 'examples'
    examples.mkdir(exist_ok=True)
    for record in catalog['pages']:
        front = {'layout': 'example-' + record['composition'], 'permalink': '/examples/' + record['id'] + '/',
                 'title': record['title'], 'description': record['summary'], 'record_id': record['id'],
                 'eyebrow': record['category'] + ' · Fictional demonstration'}
        if 'dashboard' in record: front['dashboard'] = record['dashboard']
        for key in ('date', 'author', 'tags'):
            if key in record: front[key] = record[key]
        # JSON is a YAML subset and avoids ambiguous date/scalar coercion.
        (examples / (record['id'] + '.html')).write_text('---\n' + json.dumps(front, ensure_ascii=False, indent=2) + '\n---\n')
    (examples / 'index.html').write_text('''---
layout: default
permalink: /examples/
title: A collection of possibilities.
eyebrow: The example library
description: Shared content, independent compositions, and clear boundaries between publishing and applications.
---
<div class="example-root example-frame--landing"><div class="example-wrap">{% include examples/catalog.html %}</div></div>
''')
    (target / '404.html').write_text('''---
layout: example-reading
title: That page is outside the record.
description: Find another route through the example collection.
record_id: not-found
permalink: /404.html
---
''')
    default = target / '_layouts/default.html'
    text = default.read_text()
    marker = '<!-- Page archetype adapters -->'
    if marker not in text:
        text = text.replace('</head>', marker + '\n<link rel="stylesheet" href="{{ "/assets/css/examples.css" | relative_url }}">\n<link rel="stylesheet" href="{{ "/assets/css/examples-family.css" | relative_url }}">\n</head>')
        text = text.replace('</body>', '<script src="{{ "/assets/js/examples.js" | relative_url }}" defer></script>\n</body>')
    text = text.replace('{% include masthead.html %}', '{% unless page.dashboard %}{% include masthead.html %}{% endunless %}') if '{% unless page.dashboard %}' not in text else text
    if 'dashboard-page' not in text:
        text = text.replace('class="' + family + '"', 'class="' + family + '{% if page.dashboard %} dashboard-page{% endif %}"', 1)
    default.write_text(text)
    nav = target / '_data/navigation.yml'
    nav.write_text('''- title: Overview
  url: /
- title: The Language
  url: /language/
- title: Examples
  url: /examples/
- title: Journal
  url: /journal/
- title: Use This Template
  url: /setup/
''')
    index = target / 'index.md'
    text = index.read_text()
    if '## The complete example library' not in text:
        text += '''\n## The complete example library\n\n[Explore all 50 page recipes]({{ '/examples/' | relative_url }}): publishing, projects, collections, people, documentation, commerce, events, reports, support, recovery, and application interfaces. The same fictional institute and content appear in both themes.\n\n[Read about integration boundaries]({{ '/examples/integrations/' | relative_url }}) before connecting forms, accounts, devices, or transactions to a live service.\n'''
    text = text.replace('Explore all 46 page recipes', 'Explore all 50 page recipes')
    index.write_text(text)
    for doc in ['README.md', 'PORTING.md', 'ACCEPTANCE.md', 'VERIFICATION.md', 'DASHBOARDS.md', 'IMPLEMENTATION-REPORT.md']:
        destination = target / 'docs/archetypes' / doc
        destination.parent.mkdir(parents=True, exist_ok=True)
        if (ROOT / doc).exists(): shutil.copy2(ROOT / doc, destination)
    schema_dir = target / 'docs/archetypes/contracts'
    schema_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / 'contracts/catalog.schema.json', schema_dir / 'catalog.schema.json')
    config = target / '_config.yml'
    text = config.read_text().replace('package.json]', 'package.json, docs, template.zip]')
    config.write_text(text)
    shutil.copy2(ROOT / 'contracts/dashboards.schema.json', schema_dir / 'dashboards.schema.json')
    print(f'{family}: {len(catalog["pages"])} recipes → {target}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--family', choices=['martlet', 'krigsvold'])
    parser.add_argument('--target', type=Path)
    args = parser.parse_args()
    if bool(args.family) != bool(args.target): parser.error('--family and --target must be supplied together')
    if args.family: sync(args.family, args.target)
    else:
        for family in ('martlet', 'krigsvold'): sync(family, REPO / 'examples/jekyll' / family)
