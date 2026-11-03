#!/usr/bin/env python3
"""Deterministic synthetic data shared by both design languages."""
from datetime import date, timedelta, datetime, timezone
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
daily=[]
for day in range(56):
 for category_index,category in enumerate(['Research','Publications','Workshops']):
  sessions=140+day*3+category_index*37+(day%7)*11
  daily.append(dict(date=str(date(2026,9,3)+timedelta(days=day)),category=category,sessions=sessions,downloads=18+(day*3+category_index*7)%55,completions=8+(day+category_index*3)%21,duration_seconds=sessions*(120+(day+category_index*9)%85)))
names=['Mara Ellis','Rowan Park','Samira Chen','Theo Okafor','Inez Patel','Elliot Reed','Nadia Flores','Jonas Ahmed','Leila Brooks','Owen Tan','Amara Cole','Felix Shah','Ari Morgan','Cleo James','Dev Lin','Esme Grant','Finn Roy','Gia Woods','Hugo Bell','Indira Lane','Jules Fox','Kai Stone','Lena Nash','Micah Vale']
people=[dict(id=f'P-{i+1:03}',name=name,email=name.lower().replace(' ','.')+'@example.invalid',role=['Researcher','Editor','Coordinator'][i%3],status=['Active','Active','Invited','Suspended'][i%4]) for i,name in enumerate(names)]
services=[]
for i,name in enumerate(['Observation ingester','Catalogue API','Search index','Export worker','Metrics relay']):
 samples=[dict(time=(datetime(2026,10,27,21,tzinfo=timezone.utc)+timedelta(hours=h)).isoformat(),latency_ms=65+i*25+(h*17+i*13)%90+(150 if i==3 and h>18 else 0),queue=(h*3+i*11)%38,availability=99.6 if i==3 and h>18 else 100) for h in range(24)]
 services.append(dict(id=f'SVC-{i+1:02}',name=name,samples=samples))
alerts=[dict(id='AL-001',service_id='SVC-04',severity='Critical',title='Export latency above the target',time='2026-10-28T19:40:00+00:00',acknowledged=False),dict(id='AL-002',service_id='SVC-03',severity='Warning',title='Index refresh needs review',time='2026-10-28T18:25:00+00:00',acknowledged=False),dict(id='AL-003',service_id='SVC-01',severity='Info',title='Scheduled ingest completed',time='2026-10-28T17:00:00+00:00',acknowledged=True)]
fixture=dict(schema_version=1,synthetic=True,as_of='2026-10-28T20:00:00+00:00',categories=['Research','Publications','Workshops'],analytics=daily,people=people,services=services,alerts=alerts,activity=[dict(service_id='SVC-04',time='2026-10-28T19:40:00+00:00',title='Export latency alert opened'),dict(service_id='SVC-03',time='2026-10-28T18:25:00+00:00',title='Index refresh flagged for review'),dict(service_id='SVC-01',time='2026-10-28T17:00:00+00:00',title='Scheduled observation ingest completed')])
(root/'content/dashboards.json').write_text(json.dumps(fixture,indent=2)+'\n')
