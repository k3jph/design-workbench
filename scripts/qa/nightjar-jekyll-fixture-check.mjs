#!/usr/bin/env node
// Bounded local consistency check: it never edits the candidate or fixtures.
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyBundle} from './nightjar-fixture-bundle.mjs';

export async function checkJekyll(bytes,commit,digest,site){
 const files=verifyBundle(bytes,commit,digest),data=Object.fromEntries(files.map(f=>[f.path,JSON.parse(f.content.toString('utf8'))]));
 const catalog=data['examples/page-archetypes/content/catalog.json'],dashboards=data['examples/page-archetypes/content/dashboards.json'];
 assert.equal(catalog.pages.length,50,'Expected exactly 50 canonical records');
 const ids=catalog.pages.map(p=>p.id);assert.equal(new Set(ids).size,50,'Duplicate canonical route');for(const id of ids)assert.match(id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/,'Unsafe route ID');
 assert.deepEqual(JSON.parse(await readFile(join(site,'_data/examples.json'),'utf8')),catalog,'Candidate catalog differs from pinned fixture');
 assert.deepEqual(JSON.parse(await readFile(join(site,'_data/dashboards.json'),'utf8')),dashboards,'Candidate dashboard fixture differs');
 const routes=(await readdir(join(site,'examples'))).filter(n=>n.endsWith('.html')).sort();
 assert.deepEqual(routes,[...ids.map(id=>`${id}.html`),'index.html','scientific-workspace.html'].sort(),'Missing or stale generated route');
 for(const record of catalog.pages){
  const html=await readFile(join(site,'examples',`${record.id}.html`),'utf8');
  const match=html.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);assert.ok(match,`${record.id}: missing JSON front matter`);
  const front=JSON.parse(match[1]);assert.equal(front.record_id,record.id,`${record.id}: record_id`);assert.equal(front.permalink,`/examples/${record.id}/`,`${record.id}: permalink`);
  assert.equal(front.title,record.title,`${record.id}: title`);assert.equal(front.description,record.summary,`${record.id}: summary`);assert.equal(front.layout,`example-${record.composition}`,`${record.id}: layout`);
 }
 return {canonical_routes:ids.length,science:'experimental, not assessed',interactive_behavior:'not_assessed',accessibility:'not_assessed'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [bundle,commit,digest,site,...extra]=process.argv.slice(2);assert.ok(bundle&&commit&&digest&&site&&!extra.length,'Usage: node nightjar-jekyll-fixture-check.mjs BUNDLE FULL_COMMIT TRUSTED_SHA256 SITE');
 console.log(JSON.stringify(await checkJekyll(await readFile(resolve(bundle)),commit,digest,resolve(site))));
}
