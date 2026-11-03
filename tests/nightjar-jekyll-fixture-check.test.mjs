import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import {createBundle} from '../scripts/qa/nightjar-fixture-bundle.mjs';
import {checkJekyll} from '../scripts/qa/nightjar-jekyll-fixture-check.mjs';

test('Jekyll pinned fixtures reject stale, missing and incorrect generated routes',async()=>{
 const root=mkdtempSync(join(tmpdir(),'nightjar-jekyll-fixtures-'));try{
  const repo=join(root,'repo'),site=join(root,'site');mkdirSync(repo);mkdirSync(site);const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');
  const pages=Array.from({length:50},(_,i)=>({id:`record-${i}`,title:`Record ${i}`,summary:`Summary ${i}`,composition:'reading'}));const catalog={pages},dashboards={people:[]};
  const files={'examples/page-archetypes/content/catalog.json':catalog,'examples/page-archetypes/content/dashboards.json':dashboards,'examples/page-archetypes/contracts/catalog.schema.json':{},'examples/page-archetypes/contracts/dashboards.schema.json':{}};
  for(const [path,value] of Object.entries(files)){mkdirSync(dirname(join(repo,path)),{recursive:true});writeFileSync(join(repo,path),JSON.stringify(value));}git('add','.');git('commit','-qm','fixtures');const commit=git('rev-parse','HEAD'),bundle=createBundle(repo,commit),hash=createHash('sha256').update(bundle).digest('hex');
  mkdirSync(join(site,'_data'));mkdirSync(join(site,'examples'));writeFileSync(join(site,'_data/examples.json'),JSON.stringify(catalog));writeFileSync(join(site,'_data/dashboards.json'),JSON.stringify(dashboards));
  for(const record of pages){const front={record_id:record.id,permalink:`/examples/${record.id}/`,title:record.title,description:record.summary,layout:`example-${record.composition}`};writeFileSync(join(site,'examples',`${record.id}.html`),`---\n${JSON.stringify(front)}\n---\n`);}for(const path of ['index.html','scientific-workspace.html'])writeFileSync(join(site,'examples',path),'fixture');
  const run=()=>checkJekyll(bundle,commit,hash,site);assert.equal((await run()).canonical_routes,50);
  const stale=join(site,'examples/stale.html');writeFileSync(stale,'stale');await assert.rejects(run(),/Missing or stale/);rmSync(stale);
  const missing=join(site,'examples/record-0.html');const valid=`---\n${JSON.stringify({record_id:'record-0',permalink:'/examples/record-0/',title:'Record 0',description:'Summary 0',layout:'example-reading'})}\n---\n`;rmSync(missing);await assert.rejects(run(),/Missing or stale/);writeFileSync(missing,valid.replace('Summary 0','Wrong'));await assert.rejects(run(),/summary/);writeFileSync(missing,valid);
  writeFileSync(join(site,'_data/dashboards.json'),'{}');await assert.rejects(run(),/dashboard fixture differs/);
  await assert.rejects(checkJekyll(bundle,commit,'0'.repeat(64),site),/Bundle SHA-256 differs/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
