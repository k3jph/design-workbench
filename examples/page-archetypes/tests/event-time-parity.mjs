import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {isValidEventDateTime} from '../lib/event-time.mjs';
// HTML global date-time validity, conservatively restricted to four-digit years and colon offsets.
const valid=['2026-11-14T09:00:00-05:00','2024-02-29T12:02Z','2000-02-29T12:02:03.1Z','2024-02-29T12:02:03.12Z','2024-02-29T12:02:03.123Z','0001-01-01 00:00+23:59','9999-12-31T23:59:59+00:00','2026-01-01T00:00-23:59'];
const invalid=['2026-02-30T09:00:00-05:00','1900-02-29T00:00Z','0000-01-01T00:00Z','2026-13-01T00:00Z','2026-01-00T00:00Z','2026-01-01T24:00Z','2026-01-01T00:60Z','2026-01-01T00:00:60Z','2026-01-01T00:00+24:00','2026-01-01T00:00+01:60','2026-01-01T00:00-00:00','2026-01-01T00:00+0100','2026-01-01T00:00','2026-1-01T00:00Z','2024-02-29t12:02Z','2024-02-29T12:02z','2024-02-29T12:02Z\n','2024-02-29T12:02:03.1234Z','2026-01-01T00:00:00.Z','<img src=x onerror="alert(1)">'];
const cases=[...valid,...invalid];
const result=spawnSync('bundle',['exec','ruby','examples/page-archetypes/tests/event-time-liquid.rb'],{encoding:'utf8',input:cases.map(JSON.stringify).join('\n')+'\n',env:{...process.env,BUNDLE_GEMFILE:'examples/jekyll/martlet/Gemfile'}});
assert.equal(result.status,0,result.stderr);const lines=result.stdout.trim().split('\n').map(JSON.parse);assert.equal(lines.length,cases.length);
for(const [i,value] of cases.entries()) { const expected=i<valid.length;assert.equal(isValidEventDateTime(value),expected,value);assert.equal(lines[i].startsWith('<time '),expected,`${value}: ${lines[i]}`);if(!expected)assert.equal(lines[i],'<span>label (invalid start time)</span>'); }
console.log(`JavaScript and Jekyll agree on ${cases.length} HTML datetime boundary cases`);
