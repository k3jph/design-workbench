import assert from 'node:assert/strict';
import {test} from 'node:test';
import fixture from '../page-archetypes/content/dashboards.json' with {type:'json'};
import {dashboardPayload,serializeForScript} from './src/dashboard/fixture.mjs';

test('each dashboard receives exactly its canonical data subset',()=>{
 assert.deepEqual(dashboardPayload('analytics',fixture),{analytics:fixture.analytics,categories:fixture.categories});
 assert.deepEqual(dashboardPayload('administration',fixture),{people:fixture.people});
 assert.deepEqual(dashboardPayload('operations',fixture),{as_of:fixture.as_of,services:fixture.services,alerts:fixture.alerts,activity:fixture.activity});
 assert.throws(()=>dashboardPayload('unrecognized',fixture),/Unsupported dashboard/);
});
test('embedded payload cannot terminate its JSON script',()=>{
 const input={label:'</script><script>alert(1)</script>'};const json=serializeForScript(input);
 assert.ok(!json.includes('<'));assert.deepEqual(JSON.parse(json),input);
});
