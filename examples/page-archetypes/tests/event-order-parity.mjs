import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {isEventEndBeforeStart} from '../lib/event-time.mjs';
const cases=[
 ['2026-11-14T10:00:00+02:00','2026-11-14T08:59:59.999+01:00',true],
 ['2026-01-01T23:45Z','2026-01-02T00:30+02:00',true],
 ['2026-01-02T00:30+02:00','2026-01-01T23:45Z',false],
 ['2026-01-01T23:00Z','2026-01-02T00:00+01:00',false],
 ['2026-01-01T00:00:00.100Z','2026-01-01T00:00:00.099Z',true],
 ['1969-12-31T23:59:59.9Z','1969-12-31T23:59:59.1Z',true],
 ['1969-12-31T23:59:59.1Z','1969-12-31T23:59:59.9Z',false],
 ['0001-01-01 00:00+23:59','0001-01-01T00:01+23:59',false],
 ['9999-12-31T23:59:59-23:59','9999-12-31T23:59:58-23:59',true],
 ['2026-02-30T00:00Z','2026-01-01T00:00Z',false],
 ['2026-01-01T00:00Z','2026-02-30T00:00Z',false],
 ['invalid','invalid',false],
];
const result=spawnSync('bundle',['exec','ruby','examples/page-archetypes/tests/event-order-liquid.rb'],{encoding:'utf8',input:cases.map(([start,end])=>JSON.stringify([start,end])).join('\n')+'\n',env:{...process.env,BUNDLE_GEMFILE:'examples/jekyll/martlet/Gemfile'}});
assert.equal(result.status,0,result.stderr);const lines=result.stdout.trim().split('\n').map(JSON.parse);assert.equal(lines.length,cases.length);
for(const [i,[start,end,expected]] of cases.entries()){assert.equal(isEventEndBeforeStart(start,end),expected,`${start} to ${end}`);assert.equal(lines[i].includes('Event end is earlier than its start.'),expected,`${start} to ${end}: ${lines[i]}`);}
console.log(`JavaScript and Jekyll agree on ${cases.length} event ordering cases`);
