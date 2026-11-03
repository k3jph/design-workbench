// Build schema-valid adversarial structured catalog fields in isolated copies.
import assert from 'node:assert/strict';
import {cpSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync, symlinkSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve, join, basename, extname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {chromium} from '@playwright/test';
import {Validator} from '@cfworker/json-schema';
const root=process.cwd(),temp=mkdtempSync(join(tmpdir(),'nightjar-empty-'));
const mode=process.argv[2]||'url';assert.ok(['url','date','order'].includes(mode));
const fixture=JSON.parse(readFileSync('examples/page-archetypes/content/catalog.json','utf8'));
const payload='<img src=x onerror="window.__nightjarInjected=1">',url='/examples/article/?x=1&copy';
const page=id=>fixture.pages.find(page=>page.id===id),section=(id,kind)=>page(id).sections.find(item=>item.kind===kind);
const listing=section('archive','listing');listing.items[0].url=url;section('home','cards').items[0].url=url;
section('home','cards').items[0].summary=`Card ${payload}`;section('place','figure').caption=`Caption ${payload}`;section('faq','faq').items[0].answer=`Answer ${payload}`;page('event').event.location=`Location ${payload}`;page('event').event.start=payload;page('event').event.end='2026-02-30T09:00:00-05:00';page('event').event.display_start=`Start ${payload}`;page('article').title=`Article ${payload}`;page('case-study').date='2026-10-20';
if(mode==='order'){page('event').event.start='2026-11-14T10:00:00+02:00';page('event').event.end='2026-11-14T08:59:59.999+01:00';page('event').event.display_start='Example start';page('event').event.display_end='Example end';
 for(const [id,start,end] of [
  ['place','2026-01-01T23:00Z','2026-01-02T00:00+01:00'],
  ['faq','2026-01-02T00:30+02:00','2026-01-01T23:45Z'],
  ['home','2026-02-30T00:00Z','2026-01-01T00:00Z']
 ]){const record=page(id);record.semantic_class='event';record.event={...page('event').event,start,end};}
}
if(mode==='date'){listing.items[0].date=payload;listing.items[1].date='2026-02-31';listing.items[2].date='0000-01-01';page('article').date='2026-02-31';page('case-study').date=payload;}
const schema=JSON.parse(readFileSync('examples/page-archetypes/contracts/catalog.schema.json','utf8'));assert.ok(new Validator(schema,'2020-12',true).validate(fixture).valid,'Adversarial structured catalog must remain schema-valid');
const skip=new Set(['node_modules','dist','_site','.astro','.jekyll-cache','test-results']);
function run(command,args,cwd,extra={}){
 const child=spawnSync(command,args,{cwd,env:{...process.env,...extra},encoding:'utf8'});
 assert.equal(child.status,0,`${command} ${args.join(' ')} failed: ${child.stderr}\n${child.stdout}`);
}
let browser;
try {
 cpSync(join(root,'examples'),join(temp,'examples'),{recursive:true,filter:path=>!skip.has(basename(path))&&!basename(path).endsWith('-dist')});
 cpSync(join(root,'packages'),join(temp,'packages'),{recursive:true,filter:path=>!skip.has(basename(path))});
 cpSync(join(root,'package.json'),join(temp,'package.json'));
 symlinkSync(resolve(root,'node_modules'),join(temp,'node_modules'),'dir');
 symlinkSync(resolve(root,'examples/astro-slice/node_modules'),join(temp,'examples/astro-slice/node_modules'),'dir');
 const catalogPath=join(temp,'examples/page-archetypes/content/catalog.json'),missing=structuredClone(fixture);missing.pages.find(page=>page.id==='archive').sections.find(section=>section.kind==='listing').items[0].url='/examples/not-a-route/?x=1';
 writeFileSync(catalogPath,JSON.stringify(missing));run('python3',['examples/page-archetypes/scripts/sync.py'],temp);
 const rejected=spawnSync('node',['examples/page-archetypes/scripts/verify.mjs'],{cwd:temp,env:process.env,encoding:'utf8'});assert.notEqual(rejected.status,0,'unknown route with query must still be rejected');assert.match(rejected.stderr,/Broken fixture destination/);
 const traversal=structuredClone(fixture);traversal.pages.find(page=>page.id==='archive').sections.find(section=>section.kind==='listing').items[0].url='/../README.md?x=1';writeFileSync(catalogPath,JSON.stringify(traversal));run('python3',['examples/page-archetypes/scripts/sync.py'],temp);const escaped=spawnSync('node',['examples/page-archetypes/scripts/verify.mjs'],{cwd:temp,env:process.env,encoding:'utf8'});assert.notEqual(escaped.status,0,'path outside the Jekyll source root must be rejected');assert.match(escaped.stderr,/Broken fixture destination/);
 const linkPath=join(temp,'examples/page-archetypes/jekyll/outside-link');symlinkSync(join(temp,'examples/page-archetypes/README.md'),linkPath);const linked=structuredClone(fixture);linked.pages.find(page=>page.id==='archive').sections.find(section=>section.kind==='listing').items[0].url='/outside-link?x=1';writeFileSync(catalogPath,JSON.stringify(linked));const linkedResult=spawnSync('node',['examples/page-archetypes/scripts/verify.mjs'],{cwd:temp,env:process.env,encoding:'utf8'});assert.notEqual(linkedResult.status,0,'symlink escaping the Jekyll source root must be rejected');assert.match(linkedResult.stderr,/Broken fixture destination/);rmSync(linkPath);
 writeFileSync(catalogPath,JSON.stringify(fixture));run('python3',['examples/page-archetypes/scripts/sync.py'],temp);run('node',['examples/page-archetypes/scripts/verify.mjs'],temp);
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 for(const family of ['martlet','krigsvold']) for(const framework of ['jekyll','astro','react'].filter(value=>!process.env.NIGHTJAR_TEST_FRAMEWORK||value===process.env.NIGHTJAR_TEST_FRAMEWORK)) for(const base of ['/','/preview/']) {
  const site=join(temp,'examples/jekyll',family),dist=join(temp,'empty-dist',framework,family);
  if(framework==='jekyll') run('bundle',['exec','jekyll','build','--safe','--baseurl',base==='/'?'':'/preview','--destination',dist],site);
  if(framework==='astro') run('npm',['run','build'],join(temp,'examples/astro-slice'),{NIGHTJAR_FAMILY:family,NIGHTJAR_BASE:base,ASTRO_TELEMETRY_DISABLED:'1'});
  if(framework==='react') run(process.execPath,['examples/react-catalog/build.mjs'],temp,{NIGHTJAR_FAMILY:family,NIGHTJAR_BASE:base});
  const built=framework==='jekyll'?dist:join(temp,'examples',framework==='astro'?'astro-slice':'react-catalog','dist',family);
  const server=createServer((req,res)=>{const path=new URL(req.url,'http://localhost').pathname;if(!path.startsWith(base)){res.writeHead(404).end();return;}const file=resolve(built,decodeURIComponent(path.slice(base.length)),path.endsWith('/')?'index.html':'');if(!file.startsWith(built+'/')){res.writeHead(403).end();return;}try{const data=readFileSync(file);const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff'};res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(data);}catch{res.writeHead(404).end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try {for(const javascriptEnabled of [true,false]){
   const context=await browser.newContext({javaScriptEnabled:javascriptEnabled,viewport:{width:320,height:900}}),page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   const origin=`http://127.0.0.1:${server.address().port}`;
   for(const [route,text] of [['archive','What a shoreline remembers'],['home',`Card ${payload}`],['place',`Caption ${payload}`],['faq',`Answer ${payload}`],['event',`Location ${payload}`],['article',`Article ${payload}`],['case-study',mode==='date'?`Invalid date: ${payload}`:'2026']]){
    await page.goto(`${origin}${base}examples/${route}/`,{waitUntil:'networkidle'});assert.ok((await page.locator('body').textContent()).includes(text),`${route}: literal structured text`);assert.equal(await page.locator('img[src="x"]').count(),0,`${route}: text must not create elements`);assert.equal(await page.evaluate(()=>window.__nightjarInjected),undefined);
    if(route==='archive'){const link=page.getByRole('link',{name:'What a shoreline remembers',exact:true});assert.equal(await link.getAttribute('href'),`${base}examples/article/?x=1&copy`,'URL query survives HTML parsing');assert.ok(await link.evaluate(node=>new URL(node.href).searchParams.has('copy')),'query key survives URL parsing');if(mode==='date'){assert.ok((await page.locator('body').textContent()).includes(`Invalid date: ${payload}`));assert.ok((await page.locator('body').textContent()).includes('Invalid date: 2026-02-31'));assert.ok((await page.locator('body').textContent()).includes('Invalid date: 0000-01-01'));assert.equal(await page.locator('time[datetime="2026-02-31"]').count(),0);}}
    if(route==='home')assert.equal(await page.getByRole('link',{name:'Read the coast',exact:true}).getAttribute('href'),`${base}examples/article/?x=1&copy`);
    if(route==='event'&&mode==='order'){assert.equal(await page.locator('time[datetime="2026-11-14T10:00:00+02:00"]').count(),1);assert.equal(await page.locator('time[datetime="2026-11-14T08:59:59.999+01:00"]').count(),1);assert.ok((await page.locator('body').textContent()).includes('Event end is earlier than its start.'));}
    if(mode==='order'&&['place','faq','home'].includes(route)){assert.ok(!(await page.locator('body').textContent()).includes('Event end is earlier than its start.'),`${route}: valid chronological or invalid individual timestamp has no order warning`);if(route==='home'){assert.ok((await page.locator('body').textContent()).includes('(invalid start time)'));assert.equal(await page.locator('time[datetime="2026-01-01T00:00Z"]').count(),1);}else assert.equal(await page.locator('time').count(),2,`${route}: both valid timestamps retained`);}
    if(route==='event'&&mode!=='order'){assert.equal(await page.locator('time').filter({hasText:`Start ${payload}`}).count(),0,'invalid start must not become a machine-readable time');assert.ok((await page.locator('body').textContent()).includes(`Start ${payload} (invalid start time)`));assert.equal(await page.locator('time[datetime="2026-02-30T09:00:00-05:00"]').count(),0,'impossible end must not become a machine-readable time');assert.ok((await page.locator('body').textContent()).includes('(invalid end time)'));assert.ok(!(await page.locator('body').textContent()).includes('Event end is earlier than its start.'),'invalid times do not produce an ordering claim');}
    if(route==='article'&&mode==='date'){assert.ok((await page.locator('body').textContent()).includes('Invalid date: 2026-02-31'));assert.equal(await page.locator('time[datetime="2026-02-31"]').count(),0);}
    if(route==='article'&&mode==='url'){const bodyText=await page.locator('body').textContent();assert.doesNotMatch(bodyText,/Invalid date:/);assert.match(bodyText,/Oct(?:ober)? 28, 2026/);}
    if(route==='case-study'&&mode==='url')assert.match(await page.locator('body').textContent(),/Oct(?:ober)? 20, 2026/,'date-only metadata remains visible');
   }
   assert.deepEqual(errors,[]);await context.close();
  }console.log(`${family} ${framework} ${base}: structured text and URLs safely rendered`);

  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
 }
} finally {if(browser)await browser.close();rmSync(temp,{recursive:true,force:true});}
