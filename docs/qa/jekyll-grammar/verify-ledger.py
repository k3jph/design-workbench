#!/usr/bin/env python3
"""Validate ledger coverage against supplied canonical fixture JSON, without network."""
import argparse,json,pathlib
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('fixture',type=pathlib.Path)
p.add_argument('--ledger',type=pathlib.Path,default=pathlib.Path(__file__).with_name('disposition.json'))
a=p.parse_args();d=json.loads(a.ledger.read_text());fixture=json.loads(a.fixture.read_text());pages=fixture['pages'];rows=d['rows']
assert d['schemaVersion']==1 and len(rows)==len(pages)==50
assert len({r['id'] for r in rows})==50
assert [r['id'] for r in rows]==[p['id'] for p in pages]
for r,p in zip(rows,pages):
 assert r['route']=='/examples/'+p['id']+'/'
 assert r['semanticClass']==p['semantic_class'] and r['composition']==p['composition']
 assert r['baseline']['sectionIds']==[s['id'] for s in p['sections']]
 assert r['baseline']['sectionKinds']==[s.get('kind','prose') for s in p['sections']]
 assert r['disposition'] in ('change','retain') and r['rationale']
 assert r['wave'] in (1,2,3,4) and r['testPlan']
 for f in ('martlet','krigsvold'):
  assert r['familyJudgment'][f] and r['authenticFamilyRules'][f]
  assert all(d['rules'][key]['family']==f for key in r['authenticFamilyRules'][f])
 assert isinstance(r['evidence'],list) and isinstance(r['exceptions'],list)
print('Validated 50 ordered routes, fixture semantics, anchors and independent family dispositions.')
