import test from 'node:test';
import assert from 'node:assert/strict';
import {isValidEventDateTime,isEventEndBeforeStart} from '../lib/event-time.mjs';
test('event time requires an actual calendar date and explicit valid offset',()=>{
 for(const value of ['2026-11-14T09:00:00-05:00','2024-02-29T12:02Z','2024-02-29T12:02:03.123Z','0001-01-01 00:00+23:59','9999-12-31T23:59:59+00:00'])assert.equal(isValidEventDateTime(value),true,value);
 for(const value of ['2024-02-29t12:02:03Z','2024-02-29T12:02:03z','2024-02-29T12:02:03.1234Z','2026-01-01T00:00-00:00','2026-02-30T09:00:00-05:00','1900-02-29T00:00Z','0000-01-01T00:00Z','2026-13-01T00:00Z','2026-01-00T00:00Z','2026-01-01T24:00Z','2026-01-01T00:60Z','2026-01-01T00:00:60Z','2026-01-01T00:00+24:00','2026-01-01T00:00+01:60','2026-01-01T00:00','2026-1-01T00:00Z','2026-01-01T00:00:00.Z','<img src=x>',null])assert.equal(isValidEventDateTime(value),false,String(value));
});

test('event ordering compares instants and ignores invalid values',()=>{
 assert.equal(isEventEndBeforeStart('2026-01-01T23:45Z','2026-01-02T00:30+02:00'),true);
 assert.equal(isEventEndBeforeStart('2026-01-02T00:30+02:00','2026-01-01T23:45Z'),false);
 assert.equal(isEventEndBeforeStart('2026-01-01T23:00Z','2026-01-02T00:00+01:00'),false);
 assert.equal(isEventEndBeforeStart('1969-12-31T23:59:59.9Z','1969-12-31T23:59:59.1Z'),true);
 assert.equal(isEventEndBeforeStart('2026-02-30T00:00Z','2026-01-01T00:00Z'),false);
});
