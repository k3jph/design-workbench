import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {aggregate,analyticsView,analyticsCalendarIssue,rangeError,collectionView,personControlLabels,applyBulk,validatePerson,nextPersonId,operationsView,operationsDataIssue,validOperationsTimestamp,operationsSnapshotLabel,comparisonSearch,analyticsCoverageMessage,analyticsComparison} from '../jekyll/assets/js/dashboard-model.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('../content/dashboards.json',import.meta.url)));
test('analytics computes rates from totals and duration from weighted observations',()=>{
 const totals=aggregate([{sessions:20,downloads:3,completions:4,duration_seconds:1200},{sessions:80,downloads:7,completions:6,duration_seconds:16800}]);
 assert.equal(totals.conversion,10);assert.equal(totals.mean_duration,180);assert.equal(totals.downloads,10);
});
test('date and category scope constrain every analytic record and comparison',()=>{
 const selected=analyticsView(fixture,{start:'2026-10-22',end:'2026-10-28',category:'Research'});
 assert.equal(selected.rows.length,7);assert.equal(selected.days.length,7);assert.ok(selected.previous);
 assert.ok(selected.rows.every(row=>row.category==='Research'&&row.date>='2026-10-22'&&row.date<='2026-10-28'));
 assert.equal(selected.totals.sessions,selected.days.reduce((sum,day)=>sum+day.sessions,0));
 assert.equal(analyticsView(fixture,{start:'2026-09-03',end:'2026-09-04'}).previous,null);
 assert.ok(rangeError('2026-10-28','2026-10-22','2026-09-03','2026-10-28'));
 assert.ok(rangeError('2026-09-31','2026-10-02','2026-09-03','2026-10-28'));
});
test('preceding analytics totals include both endpoints in the selected category',()=>{
 // 15–21 October research fixture, with 15 October contributing 266 sessions.
 const view=analyticsView(fixture,{start:'2026-10-22',end:'2026-10-28',category:'Research'});
 assert.ok(view.previous);
 assert.equal(view.previous.sessions,2156);
 assert.equal(view.previous.downloads,301);
 assert.equal(view.previous.completions,77);
 assert.equal(view.previous.duration_seconds,356132);
 assert.equal(analyticsComparison(view,'sessions'),'6.8% versus preceding period.');
});
test('collection pages clamp after filtering and bulk writes affect only selected IDs',()=>{
 const view=collectionView(fixture.people,{query:'Mara Ellis',page:8,size:5});assert.equal(view.total,1);assert.equal(view.page,1);
 const result=applyBulk(fixture.people,['P-001'],'Suspended');assert.equal(result[0].status,'Suspended');assert.deepEqual(result.slice(1),fixture.people.slice(1));assert.notEqual(result,fixture.people);
 assert.throws(()=>applyBulk(fixture.people,['P-001'],'Deleted'));
});
test('collection rejects fractional and non-finite page numbers from URLs',()=>{
 for(const page of [1.5,Infinity,NaN,'not-a-page']) {
  const view=collectionView(fixture.people,{page,size:5});
  assert.equal(view.page,1);
  assert.equal(view.rows.length,5);
 }
 assert.equal(collectionView(fixture.people,{page:999,size:5}).page,5);
});
test('editing permits the same record email but rejects a duplicate on another person',()=>{
 const person=fixture.people[0];assert.deepEqual(validatePerson(person,fixture.people,person.id),{});
 assert.ok(validatePerson({...person,id:'new'},fixture.people).email);
 assert.ok(validatePerson({...person,name:' ',email:'broken',role:'Owner'},fixture.people,person.id).name);
});
test('operational scope, threshold and acknowledgement filters remain separate',()=>{
 const low=operationsView(fixture,{threshold:50});assert.equal(low.warnings,5);
 const high=operationsView(fixture,{threshold:1000});assert.equal(high.warnings,0);
 const scoped=operationsView(fixture,{service:'SVC-04',severity:'Critical',hideAcknowledged:true});assert.equal(scoped.services.length,1);assert.equal(scoped.alerts.length,1);assert.equal(scoped.points.length,6);
 const acknowledged=fixture.alerts.map(alert=>({...alert,acknowledged:true}));assert.equal(operationsView(fixture,{hideAcknowledged:true},acknowledged).alerts.length,0);
});

test('collection behaviour accepts another record vocabulary without a new grid',()=>{
 const records=[{id:'b',title:'Beta',status:'Active'},{id:'a',title:'Alpha',status:'Active'}];
 const view=collectionView(records,{query:'Alpha',sort:'untrusted',size:5},{search:['title'],sort:['title'],defaultSort:'title'});
 assert.equal(view.total,1);assert.equal(view.rows[0].id,'a');
});

test('peer comparison receives only the selected dashboard view state',()=>{
 const search='?token=private&start=2026-10-15&category=Research&category=Other&q=Mara+Ellis&status=Active&service=SVC-04&hideAcknowledged=true';
 assert.equal(comparisonSearch('analytics',search),'start=2026-10-15&category=Research');
 assert.equal(comparisonSearch('administration',search),'q=Mara+Ellis&status=Active');
 assert.equal(comparisonSearch('operations',search),'service=SVC-04&hideAcknowledged=true');
 assert.equal(comparisonSearch('analytics','?token=private'),'');
 assert.throws(()=>comparisonSearch('unknown',search));
});

test('analytics ordering is independent of input observation order',()=>{
 const query={start:'2026-10-22',end:'2026-10-28',category:'All'};
 const expected=analyticsView(fixture,query);
 const shuffled={...fixture,analytics:[...fixture.analytics].reverse()};
 const actual=analyticsView(shuffled,query);
 assert.equal(actual.error,'');
 assert.deepEqual(actual,expected);
 assert.deepEqual(analyticsView(shuffled,{...query,category:'Research'}),analyticsView(fixture,{...query,category:'Research'}));
 assert.equal(shuffled.analytics[0],fixture.analytics.at(-1),'caller data must not be mutated');
});

test('empty analytics data is explicit and does not invent zero observations',()=>{
 const result=analyticsView({...fixture,analytics:[]},{start:'2026-10-22',end:'2026-10-28',category:'All'});
 assert.deepEqual(result,{error:'No analytics data is available in this snapshot.',empty:true});
});

test('sparse periods do not imply complete comparisons or missing zeros',()=>{
 const query={start:'2026-10-22',end:'2026-10-28',category:'All',coverage:{start:'2026-09-03',end:'2026-10-28'}};
 const without=(date,category)=>({...fixture,analytics:fixture.analytics.filter(row=>row.date!==date||row.category!==category)});
 const missingCurrent=analyticsView(without('2026-10-24','Research'),query);
 assert.equal(missingCurrent.missingObservations,1);
 assert.equal(missingCurrent.previous,null);
 const missingPrevious=analyticsView(without('2026-10-20','Research'),query);
 assert.equal(missingPrevious.missingObservations,0);
 assert.equal(missingPrevious.previous,null);
 const scoped=analyticsView(without('2026-10-24','Research'),{...query,category:'Publications'});
 assert.equal(scoped.missingObservations,0);
 assert.ok(scoped.previous);
 const zeros=aggregate([{sessions:0,downloads:0,completions:0,duration_seconds:0}]);
 assert.equal(zeros.sessions,0);
 assert.equal(zeros.conversion,null);
 assert.equal(zeros.mean_duration,null);
 assert.match(analyticsCoverageMessage(missingCurrent),/Partial data: 1 expected observation is missing/);
 assert.equal(analyticsComparison(missingCurrent,'sessions'),'Comparison unavailable: selected period has missing observations.');
 assert.equal(analyticsComparison(missingPrevious,'sessions'),'No complete preceding period available.');
 const none=analyticsView(without('2026-10-24','Research'),{start:'2026-10-24',end:'2026-10-24',category:'Research'});
 assert.equal(none.rows.length,0);
 assert.equal(analyticsCoverageMessage(none),'No observations are available for the selected range and category.');
 const missingBoundary=analyticsView({...fixture,analytics:fixture.analytics.filter(row=>row.date!=='2026-10-28')},query);
 assert.equal(missingBoundary.error,'');assert.equal(missingBoundary.missingObservations,3);assert.equal(missingBoundary.previous,null);
 const legacy={...fixture,analytics:fixture.analytics.filter(row=>row.date!=='2026-10-28')};const {coverage:_coverage,...legacyQuery}=query;
 assert.ok(analyticsView(legacy,legacyQuery).error,'Without declared coverage only observed bounds are known');
 assert.equal(analyticsView(fixture,{...query,coverage:{start:'2026-10-29',end:'2026-10-28'}}).error,'Analytics coverage dates are invalid.');
 for(const bounds of [null,{}, {start:null,end:'2026-10-28'}, {start:'2026-09-31',end:'2026-10-28'}]) assert.equal(analyticsView(fixture,{...query,coverage:bounds}).error,'Analytics coverage dates are invalid.');
 const zeroPrior={...fixture,analytics:fixture.analytics.map(row=>row.date==='2026-10-23'&&row.category==='Research'?{...row,sessions:0,downloads:0,completions:0,duration_seconds:0}:row)};
 const today=analyticsView(zeroPrior,{start:'2026-10-24',end:'2026-10-24',category:'Research'});
 assert.equal(analyticsComparison(today,'sessions'),'Comparison unavailable: preceding value is zero.');
});

test('analytics rejects counts and totals outside exact integer precision',()=>{
 const row=(sessions)=>({sessions,downloads:0,completions:0,duration_seconds:0});
 assert.equal(aggregate([row(Number.MAX_SAFE_INTEGER)]).sessions,Number.MAX_SAFE_INTEGER);
 assert.throws(()=>aggregate([row(Number.MAX_SAFE_INTEGER),row(2)]),/supported safe integer precision/);
 assert.throws(()=>aggregate([row(Number.MAX_SAFE_INTEGER+1)]),/supported safe integer precision/);
 assert.throws(()=>aggregate([row(-1)]),/nonnegative whole numbers/);
 const altered={...fixture,analytics:fixture.analytics.map(row=>row.date==='2026-10-24'&&row.category==='Research'?{...row,sessions:Number.MAX_SAFE_INTEGER}:row)};
 assert.deepEqual(analyticsView(altered,{start:'2026-10-22',end:'2026-10-28',category:'All',coverage:{start:'2026-09-03',end:'2026-10-28'}}),{error:'Analytics totals exceed supported safe integer precision.',dataError:true});
 for(const value of [-1,1.5]) {const invalid={...fixture,analytics:fixture.analytics.map(row=>row.date==='2026-10-24'&&row.category==='Research'?{...row,sessions:value}:row)};assert.deepEqual(analyticsView(invalid,{start:'2026-10-22',end:'2026-10-28',category:'All',coverage:{start:'2026-09-03',end:'2026-10-28'}}),{error:'Analytics observations must be nonnegative whole numbers.',dataError:true});}
 const prior={...fixture,analytics:fixture.analytics.map(row=>row.date==='2026-10-20'&&row.category==='Research'?{...row,sessions:Number.MAX_SAFE_INTEGER}:row)};
 const query={start:'2026-10-22',end:'2026-10-28',category:'All',coverage:{start:'2026-09-03',end:'2026-10-28'}};
 assert.equal(analyticsView(prior,query).error,'Analytics totals exceed supported safe integer precision.');
 const partial={...prior,analytics:prior.analytics.filter(row=>!(row.date==='2026-10-24'&&row.category==='Research'))};
 assert.equal(analyticsView(partial,query).error,'');assert.equal(analyticsView(partial,query).previous,null);
 const older={...fixture,analytics:fixture.analytics.map(row=>row.date==='2026-10-10'&&row.category==='Research'?{...row,sessions:Number.MAX_SAFE_INTEGER}:row)};
 const recovered=analyticsView(older,{start:'2026-10-12',end:'2026-10-12',category:'All',coverage:{start:'2026-09-03',end:'2026-10-28'}});
 assert.equal(recovered.error,'');assert.equal(recovered.previousCategories.length,3);
});

test('new directory identifiers do not collide with arbitrary existing identifiers',()=>{
 assert.equal(nextPersonId([]),'P-001');
 assert.equal(nextPersonId([{id:'member-alpha'},{id:'P-001'},{id:'P-003'}]),'P-002');
 assert.equal(nextPersonId(fixture.people),'P-025');
});

test('operations samples are ordered by timestamp without mutating the fixture',()=>{
 const reordered={...fixture,services:fixture.services.map(service=>({...service,samples:[...service.samples].reverse()}))};
 assert.deepEqual(operationsView(reordered,{}),operationsView(fixture,{}));
 assert.equal(reordered.services[0].samples[0],fixture.services[0].samples.at(-1));
});

test('operations joins partial samples by timestamp and distinguishes missing coverage',()=>{
 const partial={...fixture,services:fixture.services.map((service,index)=>({...service,samples:index===1?service.samples.slice(-5,-1):service.samples}))};
 const view=operationsView(partial,{});
 assert.equal(view.partial,true);assert.equal(view.staggered,true);
 assert.deepEqual(view.points.map(point=>point.time.slice(11,16)),['16:00','17:00','18:00','19:00']);
 for(const point of view.points) assert.equal(point.latency_ms,Math.round(partial.services.reduce((sum,service)=>sum+service.samples.find(sample=>sample.time===point.time).latency_ms,0)/partial.services.length));
 assert.equal(view.latency,Math.round(partial.services.reduce((sum,service)=>sum+service.samples.at(-1).latency_ms,0)/partial.services.length));
 const disjoint={...partial,services:partial.services.map((service,index)=>index===1?{...service,samples:fixture.services[1].samples.slice(-7,-6)}:service)};
 assert.deepEqual(operationsView(disjoint,{}).points,[]);
 const old={...fixture,services:fixture.services.map(service=>({...service,samples:service.samples.slice(0,1)}))};
 assert.equal(operationsView(old,{}).availability,null);
});

test('operations reject duplicate or post-snapshot observations',()=>{
 assert.equal(operationsDataIssue(fixture),'');
 for(const future of [false,true]){
  const services=structuredClone(fixture.services),last=services[0].samples.at(-1);
  services[0].samples.push(future?{...last,time:'2026-10-28T21:00:00+00:00'}:{...last,latency_ms:999});
  const broken={...fixture,services};
  assert.match(operationsDataIssue(broken),/duplicate timestamps or readings after the snapshot/);
  assert.deepEqual(operationsView(broken,{}),{error:operationsDataIssue(broken)});
 }
});

test('operations reject unsafe observations and aggregates and round exact means',()=>{
 const prepare=()=>structuredClone(fixture);
 let value=prepare();value.services[0].samples.at(-1).queue=Number.MAX_SAFE_INTEGER;assert.match(operationsView(value,{}).error,/safe integer precision/);
 value=prepare();value.services[0].samples.at(-1).latency_ms=Number.MAX_SAFE_INTEGER;assert.match(operationsView(value,{}).error,/safe integer precision/);
 value=prepare();value.services[0].samples.at(-1).latency_ms=Number.MAX_SAFE_INTEGER;value.services.slice(1).forEach(service=>service.samples.pop());assert.match(operationsView(value,{}).error,/safe integer precision/,'staggered latest total is checked even without matching times');
 value=prepare();value.services[0].samples[0].latency_ms=Number.MAX_SAFE_INTEGER;assert.match(operationsView(value,{}).error,/safe integer precision/,'historical timestamp total is checked');
 value=prepare();value.services[0].samples[0].queue=Number.MAX_SAFE_INTEGER+1;assert.match(operationsView(value,{}).error,/safe integer precision/);
 value=prepare();value.services[0].samples[0].latency_ms=Number.MAX_SAFE_INTEGER+1;assert.match(operationsView(value,{}).error,/safe integer precision/);
 value=prepare();value.services.forEach((service,index)=>{service.samples.at(-1).latency_ms=index===0?9007199254740987:0});const view=operationsView(value,{});assert.equal(view.latency,1801439850948197);assert.equal(view.points.at(-1).latency_ms,1801439850948197);
});

test('directory controls disambiguate repeated names while preserving unique labels',()=>{
 const labels=personControlLabels([{id:'A',name:'Alex Morgan'},{id:'B',name:' alex morgan '},{id:'C',name:'Avery Lee'}]);
 assert.equal(labels.get('A'),'Alex Morgan (A)');assert.equal(labels.get('B'),' alex morgan  (B)');assert.equal(labels.get('C'),'Avery Lee');
});

test('duplicate directory email checks normalize stored whitespace and case',()=>{
 const records=[{id:'existing',email:'  dupe@example.invalid'}];
 const draft={name:'New Person',email:'DUPE@example.invalid',role:'Editor',status:'Active'};
 assert.equal(validatePerson(draft,records).email,'This email address is already in the directory.');
 assert.equal(validatePerson(draft,records,'existing').email,undefined);
});

test('literal All service ID is distinguishable from the all-services filter',()=>{
 const copy=structuredClone(fixture),old=copy.services[0].id;copy.services[0].id='All';copy.alerts.forEach(alert=>{if(alert.service_id===old)alert.service_id='All'});copy.alerts[0].service_id='All';
 assert.equal(operationsView(copy,{service:'All'}).services.length,copy.services.length);
 const single=operationsView(copy,{service:'All',serviceId:'All'});assert.equal(single.services.length,1);assert.equal(single.services[0].id,'All');assert.ok(single.alerts.length>0);assert.ok(single.alerts.every(alert=>alert.service_id==='All'));
 assert.equal(comparisonSearch('operations','?service=All&serviceId=All&token=private'),'service=All&serviceId=All');
});

test('literal All category is distinguishable from the all-categories filter',()=>{
 const copy=structuredClone(fixture);copy.categories.push('All');const options={start:'2026-10-22',end:'2026-10-28',category:'All'};
 assert.equal(analyticsView(copy,options).rows.length,21);const single=analyticsView(copy,{...options,categoryId:'All'});assert.equal(single.rows.length,0);assert.equal(single.missingObservations,7);
 assert.equal(comparisonSearch('analytics','?category=All&categoryId=All&token=private'),'category=All&categoryId=All');
});

test('repeated category declarations are deduplicated without dropping observations',()=>{
 const copy=structuredClone(fixture);copy.categories.push('Research');const row=copy.analytics.find(item=>item.date==='2026-10-28'&&item.category==='Research');copy.analytics.push({...row,sessions:row.sessions+1});
 const view=analyticsView(copy,{start:'2026-10-22',end:'2026-10-28',category:'Research'});assert.equal(view.rows.length,8);assert.equal(view.categories.filter(item=>item.name==='Research').length,1);assert.equal(view.totals.sessions,view.rows.reduce((sum,item)=>sum+item.sessions,0));assert.equal(view.categories.find(item=>item.name==='Research').sessions,view.totals.sessions);
});

test('operations reject impossible UTC calendar timestamps across snapshot data',()=>{
 assert.equal(validOperationsTimestamp('2026-02-31T19:00:00+00:00'),false);assert.equal(validOperationsTimestamp('2026-10-28T20:99:00+00:00'),false);
 assert.equal(operationsSnapshotLabel('2026-10-28T20:00:00+00:00'),'28 Oct 2026, 20:00 UTC');assert.equal(operationsSnapshotLabel('2026-10-28T20:00:30+00:00'),'28 Oct 2026, 20:00:30 UTC');
 for(const type of ['sample','snapshot','alert','activity']){const copy=structuredClone(fixture),bad='2026-02-31T19:00:00+00:00';if(type==='sample')copy.services[0].samples[0].time=bad;if(type==='snapshot')copy.as_of=bad;if(type==='alert')copy.alerts[0].time=bad;if(type==='activity')copy.activity[0].time=bad;assert.match(operationsDataIssue(copy),/valid UTC calendar times/);assert.deepEqual(operationsView(copy,{}),{error:operationsDataIssue(copy)});}
});

test('analytics rejects impossible observation dates before calculating any range',()=>{
 const options={start:'2026-10-22',end:'2026-10-28',category:'Research'};assert.equal(analyticsCalendarIssue(fixture),'');
 for(const date of ['2026-09-31','2026-13-01']){const copy=structuredClone(fixture);copy.analytics[0].date=date;assert.match(analyticsCalendarIssue(copy),/valid calendar dates/);assert.deepEqual(analyticsView(copy,options),{error:analyticsCalendarIssue(copy),dataError:true,calendarError:true});}
});
