import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {access,readFile,readdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import catalog from '../page-archetypes/content/catalog.json' with {type:'json'};
import selected from './src/selected.json' with {type:'json'};
import {renderMarkdown} from '../page-archetypes/lib/markdown.mjs';
import {renderDocument} from './src/template.mjs';
import {pageDataElement,serializePageData} from './src/page-data.mjs';
const tokens="$& $' $"+String.fromCharCode(96);
const templated=renderDocument('<html><head><title>Old</title></head><body><!--app--></body></html>',{originalTitle:'<title>Old</title>',title:`Title ${tokens} <`,markup:`<p>${tokens}</p>`,styles:`<style>/* ${tokens} */</style>`});
assert.ok(templated.includes(`<title>Title ${tokens.replaceAll('&','&amp;')} &lt;</title>`));assert.ok(templated.includes(`<p>${tokens}</p>`));assert.ok(templated.includes(`<style>/* ${tokens} */</style>`));
assert.ok(!renderMarkdown('<script>alert(1)</script> [bad](javascript:alert(1))').includes('<script>'));
assert.ok(!renderMarkdown('[bad](javascript:alert(1))').includes('href="javascript:'));
assert.match(renderMarkdown('[home](/examples/home/)', '/preview/'), /href="\/preview\/examples\/home\/"/);
const hostile=renderMarkdown('<math><mi onload="alert(1)">E</mi></math><script>alert(1)</script><img src="javascript:alert(1)" onerror="alert(1)">','/',{fixtureMarkup:true,docId:'security-test'});
assert.doesNotMatch(hostile,/<script|onload|onerror|javascript:/i);assert.match(hostile,/<math>/);
const payloadProbe={id:'probe',text:`</script><script>window.__nightjarInjected=true</script> ${tokens} <img src=x onerror=alert(1)>`};
assert.deepEqual(JSON.parse(serializePageData(payloadProbe)),payloadProbe);assert.ok(!serializePageData(payloadProbe).includes('<'));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try {
 const securityContext=await browser.newContext(),securityPage=await securityContext.newPage();await securityPage.setContent(`<html><head>${pageDataElement(payloadProbe)}</head><body></body></html>`);assert.equal(await securityPage.evaluate(()=>window.__nightjarInjected===true),false);assert.deepEqual(await securityPage.locator('#catalog-page-data').evaluate(node=>JSON.parse(node.textContent)),payloadProbe);await securityContext.close();
 for(const family of ['martlet','krigsvold'])for(const base of ['/','/preview/']){
  const built=spawnSync(process.execPath,['examples/react-catalog/build.mjs'],{env:{...process.env,NIGHTJAR_FAMILY:family,NIGHTJAR_BASE:base},encoding:'utf8'});
  if(built.status!==0)throw Error(built.stdout+built.stderr);
  const dir=resolve('examples/react-catalog/dist',family), routeDir=resolve(dir,'examples');
  const ids=(await readdir(routeDir,{withFileTypes:true})).filter(entry=>entry.isDirectory()).map(entry=>entry.name);assert.equal(ids.length,selected.length);
  const records=catalog.pages.filter(page=>ids.includes(page.id)&&!('dashboard' in page && page.dashboard));assert.equal(records.length,selected.length-3);
  const assets=resolve(dir,'assets'),files=await readdir(assets);
  // Check the CSS actually loaded by ordinary pages, in addition to font assets.
  // Separate dashboard styles contain scoped selectors for both families.
  const homeHtml=await readFile(resolve(dir,'examples/home/index.html'),'utf8');
  const sheets=[...homeHtml.matchAll(/<link rel="stylesheet"[^>]*href="([^"]+)"/g)].map(match=>match[1]);
  assert.ok(sheets.length>0);const css=(await Promise.all(sheets.map(href=>readFile(resolve(dir,href.slice(base.length)),'utf8')))).join('\n');
  assert.match(css,new RegExp(family));assert.doesNotMatch(css,new RegExp(family==='martlet'?'krigsvold':'martlet'));
  assert.ok(files.some(name=>family==='martlet'?/lato-/i.test(name):/roboto-/i.test(name)));
  assert.ok(!files.some(name=>family==='martlet'?/roboto-/i.test(name):/lato-|cinzel-|cambo-/i.test(name)));
  const server=createServer(async(req,res)=>{
   const path=new URL(req.url,'http://localhost').pathname;
   if(!path.startsWith(base)){res.writeHead(404).end();return}
   const name=decodeURIComponent(path.slice(base.length));const file=resolve(dir,name.endsWith('/')?name+'index.html':name);
   if(!file.startsWith(dir+'/')){res.writeHead(403).end();return}
   try{const data=await readFile(file);const type={'.html':'text/html','.css':'text/css','.js':'text/javascript','.woff':'font/woff','.woff2':'font/woff2','.svg':'image/svg+xml'};res.writeHead(200,{'Content-Type':type[extname(file)]||'application/octet-stream'}).end(data);}catch{res.writeHead(404).end()}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{
   const origin=`http://127.0.0.1:${server.address().port}`;
   for(const record of records){
    const context=await browser.newContext({viewport:{width:320,height:800}}),page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('response',response=>{if(response.status()>=400)errors.push(response.url())});
    await page.goto(`${origin}${base}examples/${record.id}/`,{waitUntil:'load'});
    const payload=await page.locator('#catalog-page-data').evaluate(node=>JSON.parse(node.textContent));assert.equal(payload.id,record.id);assert.equal(payload.page.id,record.id);assert.ok(Object.keys(payload.rendered).every(key=>key.startsWith(`${record.id}-`)));assert.equal(payload.entries.length,record.id==='search'?50:0);
    assert.equal(await page.locator('h1').innerText(),record.title);assert.equal(await page.locator('main').count(),1);
    for(const section of record.sections){
     const region=page.locator(`section[data-section="${section.id}"]`);assert.equal(await region.locator('h2').innerText(),section.title);
     if(section.body && !/[*_`\[\]<>\n]/.test(section.body)) assert.equal(await region.locator('.recipe-prose').innerText(),section.body);
     if(section.kind==='table'){assert.equal(await region.locator('thead th').count(),section.headers.length);assert.equal(await region.locator('tbody tr').count(),section.rows.length);assert.equal(await region.locator('tbody tr').first().innerText(),section.rows[0].join('\t'));}
     if(section.kind==='figure'){const img=region.locator('img');assert.equal(await img.getAttribute('alt'),section.alt);assert.equal(await region.locator('figcaption').innerText(),section.caption);const src=await img.getAttribute('src');assert.ok(src.startsWith(base));assert.equal((await page.request.get(origin+src)).status(),200);}
     for(const link of [...(section.actions||[]),...(['cards','listing'].includes(section.kind)?(section.items||[]).map(i=>({label:i.title,url:i.url})):[]),...(section.kind==='plans'?(section.items||[]).map(i=>i.action):[])]){
      assert.equal(await region.getByRole('link',{name:link.label,exact:true,includeHidden:true}).getAttribute('href'),base.replace(/\/$/,'')+link.url);
     }
    }
    for(const raw of await page.locator('[data-example] a[href]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')))){
     if(!raw||raw.startsWith('#')||!raw.startsWith(base)||raw.startsWith('//'))continue;
     const path=new URL(raw,origin).pathname.slice(base.length);const target=resolve(dir,path.endsWith('/')?path+'index.html':path);
     assert.ok(target.startsWith(dir+'/'));await access(target);
    }
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(errors,[]);
    if(record.id==='stress-test'){assert.equal(await page.locator('math').count(),1);assert.equal(await page.locator('script:not([type=module]):not(#catalog-page-data)').count(),0);assert.equal(await page.locator('script#catalog-page-data[type="application/json"]').count(),1);assert.ok(await page.locator('a[href*="fn"]').count()>0);}
    if(record.id==='faq') assert.equal(await page.locator('details').count(),4);
    if(record.id==='pricing') assert.equal(await page.locator('section[data-section=plans] article').count(),3);
    if(record.id==='report'){const url=await page.getByRole('link',{name:'Download example data (CSV)'}).getAttribute('href');const response=await page.request.get(origin+url);assert.equal(response.status(),200);assert.ok((await response.text()).includes('North transect'));}
    if(record.id==='guide') assert.equal(await page.locator('#arrival + .recipe-prose ol > li').count(),4);
    if(record.id==='opportunity') assert.equal(await page.locator('#requirements + .recipe-prose ul > li').count(),3);
    if(record.id==='reference'){assert.equal(await page.locator('#example + .recipe-prose pre').getAttribute('tabindex'),'0');assert.ok((await page.locator('#example + .recipe-prose code').innerText()).includes('north-001'));}
    if(record.id==='changelog') assert.equal(await page.locator('#v1-2 + .recipe-prose h3').count(),2);
    if(record.semantic_class==='article'){assert.equal(await page.locator('#return + .recipe-prose p').count(),2);assert.equal(await page.locator('article time').getAttribute('datetime'),record.date);assert.ok((await page.locator('article header').innerText()).includes(record.author));assert.equal(await page.locator('[aria-label="Article subjects"] li').count(),record.tags.length);}
    if(record.semantic_class==='event'){const context=page.locator('[aria-label="Event details"]');assert.equal(await context.locator('time').first().getAttribute('datetime'),record.event.start);assert.ok((await context.innerText()).includes(record.event.timezone));assert.ok((await context.innerText()).includes(record.event.location));}
    if(['home','archive','case-study','article','event','reference','place','faq','pricing','contact','search','stress-test','gallery','workspace','fleet','chat','sensors','scene'].includes(record.id)) {
     assert.deepEqual((await new AxeBuilder({page}).analyze()).violations.map(x=>x.id),[],`${family} ${base} ${record.id}`);
     await page.setViewportSize({width:1440,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    await context.close();
   }
   const context=await browser.newContext(),page=await context.newPage();
   await page.goto(`${origin}${base}examples/archive/`);const listing=page.locator('.recipe-listing li');
   assert.equal(await listing.count(),6);assert.equal(await listing.filter({visible:true}).count(),3);
   const initial=await listing.filter({visible:true}).first().innerText();
   await page.getByRole('button',{name:'Next page'}).focus();await page.keyboard.press('Enter');assert.equal(await page.getByRole('button',{name:'Previous page'}).evaluate(el=>document.activeElement===el),true);assert.equal(await listing.filter({visible:true}).count(),3);assert.notEqual(await listing.filter({visible:true}).first().innerText(),initial);
   await page.keyboard.press('Enter');assert.equal(await page.getByRole('button',{name:'Next page'}).evaluate(el=>document.activeElement===el),true);assert.equal(await listing.filter({visible:true}).first().innerText(),initial);
   await page.reload();assert.equal(await page.locator('h1').innerText(),records.find(x=>x.id==='archive').title);await page.emulateMedia({media:'print'});assert.equal(await listing.filter({visible:true}).count(),6);assert.equal(await page.getByRole('navigation',{name:'Latest writing pages'}).isVisible(),false);const formPage=await context.newPage();const requests=[];formPage.on('request',request=>{if(request.method()!=='GET')requests.push(request.url());});
   await formPage.goto(`${origin}${base}examples/sign-in/`);await formPage.getByLabel('Email address').fill('demo@example.invalid');await formPage.getByLabel('Example password').fill('fictional123');await formPage.getByRole('button',{name:'Validate example'}).click();assert.match(await formPage.locator('form [role=status]').innerText(),/Nothing was sent/);assert.equal(await formPage.getByLabel('Example password').inputValue(),'');await formPage.getByLabel('Email address').fill('other@example.invalid');assert.equal(await formPage.locator('form [role=status]').innerText(),'');assert.deepEqual(requests,[]);
   await formPage.goto(`${origin}${base}examples/two-factor/`);await formPage.getByLabel('Six-digit example code').fill('123456');await formPage.getByRole('button',{name:'Validate example'}).click();assert.equal(await formPage.getByLabel('Six-digit example code').inputValue(),'');
   await formPage.goto(`${origin}${base}examples/search/?keep=1&q=${'x'.repeat(250)}`,{waitUntil:'networkidle'});assert.equal((await formPage.getByLabel('Search the example record').inputValue()).length,200);assert.equal(new URL(formPage.url()).searchParams.get('q').length,200);assert.equal(new URL(formPage.url()).searchParams.get('keep'),'1');await formPage.goto(`${origin}${base}examples/search/?keep=1&q=%20%20`,{waitUntil:'networkidle'});assert.equal(new URL(formPage.url()).searchParams.has('q'),false);assert.equal(new URL(formPage.url()).searchParams.get('keep'),'1');await formPage.goto(`${origin}${base}examples/search/?q=shoreline`);await formPage.waitForFunction(()=>document.querySelector('input[type=search]')?.value==='shoreline');assert.match(await formPage.locator('form[role=search] + p').innerText(),/result/);await formPage.getByLabel('Search the example record').fill('<img src=x onerror=alert(1)>');await formPage.getByRole('button',{name:'Search',exact:true}).click();assert.match(await formPage.locator('form[role=search] + p').innerText(),/No results/);assert.equal(await formPage.getByRole('link',{name:'browse the example index'}).getAttribute('href'),`${base}examples/`);assert.equal(await formPage.locator('[data-example] img').count(),0);assert.ok(new URL(formPage.url()).searchParams.has('q'));await formPage.goto(`${origin}${base}examples/gallery/`,{waitUntil:'networkidle'});const image=formPage.locator('[data-gallery] a').first();await image.focus();await formPage.keyboard.press('Enter');const dialog=formPage.getByRole('dialog');await dialog.waitFor({state:'visible'});await formPage.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.equal(await image.evaluate(el=>document.activeElement===el),true);
   await formPage.goto(`${origin}${base}examples/workspace/`);const record=formPage.getByRole('button',{name:'North transect'});await record.click();await formPage.getByRole('button',{name:'Mark reviewed locally'}).click();assert.ok(await formPage.getByText('Reviewed locally',{exact:true}).count()>0);await formPage.getByLabel('Filter records').fill('Station inlet');assert.equal(await record.isVisible(),false);await formPage.getByRole('button',{name:'Reset demonstration'}).click();assert.equal(await record.isVisible(),true);
   await formPage.goto(`${origin}${base}examples/fleet/`);assert.equal(await formPage.getByRole('button',{name:'Field van'}).isVisible(),true);
   await formPage.goto(`${origin}${base}examples/chat/`);await formPage.getByLabel('Message').fill('<img src=x onerror=alert(1)>');await formPage.getByRole('button',{name:'Add to this preview'}).click();assert.equal(await formPage.locator('[data-example] img').count(),0);assert.equal(await formPage.getByText('<img src=x onerror=alert(1)>',{exact:true}).count(),1);await formPage.getByRole('button',{name:'Reset conversation'}).click();assert.equal(await formPage.locator('ol[aria-label=Conversation] li').count(),2);
   await formPage.goto(`${origin}${base}examples/sensors/`);await formPage.getByLabel('Simulated conditions').selectOption('24');assert.equal(await formPage.locator('[data-sensors] output').innerText(),'24 °C');
   await formPage.goto(`${origin}${base}examples/scene/`);await formPage.getByLabel('Viewpoint',{exact:true}).selectOption('station');assert.equal(await formPage.locator('[data-scene] img').getAttribute('alt'),'Stylised field station beside water.');await formPage.close();
   const nojs=await browser.newContext({javaScriptEnabled:false}),nojsPage=await nojs.newPage();
   await nojsPage.goto(`${origin}${base}examples/archive/`);assert.equal(await nojsPage.locator('.recipe-listing li:visible').count(),6);
   await nojsPage.goto(`${origin}${base}examples/search/`);assert.equal(await nojsPage.getByRole('link',{name:'Browse the complete example index'}).getAttribute('href'),`${base}examples/`);
   await nojsPage.goto(`${origin}${base}examples/sign-in/`);assert.equal(await nojsPage.getByLabel('Email address').isDisabled(),true);
   await nojsPage.goto(`${origin}${base}examples/faq/`);await nojsPage.locator('summary').first().click();assert.equal(await nojsPage.locator('details').first().getAttribute('open'),'');
   await nojsPage.goto(`${origin}${base}examples/gallery/`);assert.ok((await nojsPage.locator('[data-gallery] a').first().getAttribute('href')).startsWith(base+'assets/examples/'));assert.equal(await nojsPage.locator('link[rel=stylesheet][href*=special-]').count(),1);assert.equal(await nojsPage.locator('.rg-grid').evaluate(el=>getComputedStyle(el).display),'grid');
   await nojsPage.goto(`${origin}${base}examples/workspace/`);assert.equal(await nojsPage.getByLabel('Filter records').isDisabled(),true);assert.ok(await nojsPage.locator('[data-workspace] li').count()>0);
   await nojsPage.goto(`${origin}${base}examples/chat/`);assert.equal(await nojsPage.getByRole('button',{name:'Add to this preview'}).isDisabled(),true);
   await nojsPage.goto(`${origin}${base}examples/sensors/`);assert.equal(await nojsPage.getByLabel('Simulated conditions').isDisabled(),true);
   await nojsPage.goto(`${origin}${base}examples/scene/`);assert.equal(await nojsPage.getByLabel('Viewpoint',{exact:true}).isDisabled(),true);await nojs.close();
   await context.close();
   console.log(`${family} ${base}: ${records.length} direct routes, content, isolation, responsive, axe, pagination, and no-JS passed`);
  } finally{server.closeAllConnections();await new Promise(r=>server.close(r))}
 }
}finally{await browser.close()}
