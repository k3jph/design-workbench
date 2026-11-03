// Bounded cross-engine checks against independently built portable examples.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname,resolve,join} from 'node:path';
import {chromium,firefox,webkit,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import catalog from '../content/catalog.json' with {type:'json'};
import {captureIncompleteTargets} from './contrast-incomplete-evidence.mjs';

const engine=process.env.NIGHTJAR_BROWSER || 'chromium';
const browsers={chromium,firefox,webkit};
if(!browsers[engine]) throw Error('NIGHTJAR_BROWSER must be chromium, firefox, or webkit');
const roots={jekyll:process.env.NIGHTJAR_JEKYLL_ROOT,astro:process.env.NIGHTJAR_ASTRO_ROOT||'examples/astro-slice/dist',react:process.env.NIGHTJAR_REACT_ROOT||'examples/react-catalog/dist'};
if(!roots.jekyll) throw Error('NIGHTJAR_JEKYLL_ROOT must contain the paired root-path Jekyll builds');
const evidence=process.env.NIGHTJAR_CONTRAST_EVIDENCE;if(evidence)await mkdir(evidence,{recursive:true});
async function serve(root){
  const server=createServer(async(req,res)=>{
    const path=new URL(req.url,'http://localhost').pathname, name=decodeURIComponent(path.slice(1)),file=resolve(root,name.endsWith('/')?`${name}index.html`:name);
    if(!file.startsWith(root+'/')) return res.writeHead(403).end();
    try{const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'};const content=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(content);}catch{res.writeHead(404).end()}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return server;
}
const browser=await browsers[engine].launch({headless:true,...(engine==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{
 for(const family of ['martlet','krigsvold']) for(const framework of ['jekyll','astro','react']){
  const server=await serve(resolve(roots[framework],family));
  try{
   for(const appearance of ['light','dark']){
   const context=await browser.newContext({viewport:{width:320,height:900}}),page=await context.newPage(),errors=[],missing=[];
   await context.addInitScript(mode=>{localStorage.setItem('nightjar-appearance',mode);localStorage.setItem('design-appearance',mode)},appearance);
   page.on('pageerror',error=>errors.push(error.message));
   const origin=`http://127.0.0.1:${server.address().port}`;
   page.on('response',response=>{if(response.url().startsWith(origin)&&response.status()>=400)missing.push(`${response.status()} ${response.url()}`)});
   async function open(route){
    const response=await page.goto(`${origin}/examples/${route}/`,{waitUntil:'networkidle'});
    assert.equal(response.status(),200,`${family} ${framework} ${route} responds`);
    await page.evaluate(()=>document.fonts.ready);
    if(framework==='react')await page.waitForFunction(mode=>document.querySelector('.source-shell')?.dataset.mode===mode,appearance);
    else await page.waitForFunction(mode=>document.documentElement.dataset.appearance===mode,appearance);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${family} ${framework} ${route} reflows at 320px`);
   }
   async function checkAxe(state){
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
    const violations=result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));
    assert.deepEqual(violations,[],`${engine} ${family} ${framework} ${appearance} ${state}: WCAG-tagged axe violations`);
    const incomplete=result.incomplete.filter(rule=>rule.nodes.length).map(rule=>({id:rule.id,targets:rule.nodes.map(node=>node.target)}));
    if(incomplete.length)console.log(`${engine} ${family} ${framework} ${appearance} ${state}: axe requires manual review: ${JSON.stringify(incomplete)}`);
    const contrast=incomplete.find(rule=>rule.id==='color-contrast');
    if(evidence&&contrast){
     const name=[engine,family,framework,appearance,state].join('-').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
     const targets=await captureIncompleteTargets(page,contrast.targets);
     assert.deepEqual(targets.map(record=>record.target),contrast.targets,`${name}: every axe target is retained in evidence`);
     const screenshot=`${name}.png`;
     await page.screenshot({path:join(evidence,screenshot),fullPage:true});
     await writeFile(join(evidence,`${name}.json`),JSON.stringify({engine,family,framework,appearance,state,url:page.url(),axeResult:'incomplete',screenshot,targets},null,2)+'\n');
    }
   }
   await open('article');
   await expect(page.getByRole('heading',{name:catalog.pages.find(item=>item.id==='article').title,exact:true})).toBeVisible();
   await checkAxe('article');
   if(appearance==='light'){
    await open('gallery');
    const gallery=page.locator('[data-gallery]').first(),first=gallery.locator('a').nth(0),second=gallery.locator('a').nth(1),dialog=gallery.locator('dialog');
    await first.focus();await page.keyboard.press('Enter');await expect(dialog).toBeVisible();
    await expect(dialog.locator('img')).toHaveAttribute('alt','Stylised field station beside calm water.');
    await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(first).toBeFocused();
    // The queued close event must not take focus from another image link.
    await first.click();await expect(dialog).toBeVisible();
    const dialogHandle=await dialog.elementHandle(),secondHandle=await second.elementHandle();
    assert.equal(await page.evaluate(([node,target])=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Gallery close event did not arrive')),5000);node.addEventListener('close',()=>requestAnimationFrame(()=>{clearTimeout(timer);resolve(document.activeElement===target)}),{once:true});node.close();target.focus();}),[dialogHandle,secondHandle]),true,`${engine} ${family} ${framework}: gallery close preserves moved focus`);
    await page.keyboard.press('Enter');await expect(dialog).toBeVisible();await expect(dialog.locator('img')).toHaveAttribute('alt','Layered coastal contours with observation markers.');
    // Reopening the same gallery before its queued close must retain the image.
    assert.equal(await page.evaluate(([node,target])=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Gallery close event did not arrive')),5000);node.addEventListener('close',()=>requestAnimationFrame(()=>{clearTimeout(timer);resolve(node.open&&node.contains(document.activeElement))}),{once:true});node.close();target.click();}),[dialogHandle,secondHandle]),true,`${engine} ${family} ${framework}: gallery remains open on rapid reopen`);
    await expect(dialog.locator('img')).toHaveAttribute('alt','Layered coastal contours with observation markers.');
    await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(second).toBeFocused();
    const fallback=await browser.newContext({viewport:{width:320,height:900}});
    try{
     await fallback.addInitScript(()=>Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value(){throw new Error('simulated modal failure')}}));
     const fp=await fallback.newPage();await fp.goto(`${origin}/examples/gallery/`,{waitUntil:'networkidle'});
     const link=fp.locator('[data-gallery] a').first(),href=await link.getAttribute('href');assert.ok(href);
     const response=fp.waitForResponse(response=>response.request().isNavigationRequest()&&response.url()===new URL(href,origin).href);
     await link.click();const imageResponse=await response;assert.equal(imageResponse.status(),200);assert.match(imageResponse.headers()['content-type'],/^image\/svg\+xml/);assert.equal(fp.url(),new URL(href,origin).href);
    }finally{await fallback.close()}
   }
   await open('sign-in');
   const form=page.locator('form[data-demo-form]'),email=form.getByLabel('Email address'),password=form.getByLabel('Example password'),submit=form.getByRole('button',{name:'Validate example'});
   await email.fill('invented@example.invalid');await password.fill('invented-password');await submit.focus();await page.keyboard.press('Enter');
   await expect(form.getByRole('status')).toContainText('Example validated locally');await expect(password).toHaveValue('');
   await checkAxe('validated sign-in');
   await open('dashboard-analytics');
   await page.getByRole('combobox',{name:'Date range'}).selectOption('14');await page.getByRole('combobox',{name:'Category',exact:true}).selectOption('Research');await page.getByRole('button',{name:'Apply filters',exact:true}).click();
   await expect(page.locator('[aria-label="Analytics summary"] output').first()).toHaveText('4,459');
   await page.getByText('View session trend data',{exact:true}).click();await expect(page.locator('figure').filter({has:page.getByRole('heading',{name:'Session trend',exact:true})}).locator('table tbody tr')).toHaveCount(14);
   const toggle=page.getByRole('button',{name:'Dashboard navigation',exact:true});await toggle.focus();await page.keyboard.press('Enter');await expect(toggle).toHaveAttribute('aria-expanded','true');await page.keyboard.press('Escape');await expect(toggle).toHaveAttribute('aria-expanded','false');await expect(toggle).toBeFocused();
   await checkAxe('filtered analytics with chart data open');
   await open('scientific-workspace');
   const science=page.locator(framework==='react'?'.scientific-workspace':'[data-science]');
   const duration=science.getByLabel('Duration (min)'),run=science.getByRole('button',{name:'Run calculation'}),exportCsv=science.getByRole('button',{name:'Download results CSV'}),rows=science.locator('tbody tr');
   await expect(rows).toHaveCount(6);await expect(rows.last()).toContainText('24.93');
   if(appearance==='light'){
    const initial=science.getByLabel('Initial temperature (°C)'),longValue='0'.repeat(1000);
    await science.getByRole('status').evaluate(node=>{window.__scienceStatusMutations=0;window.__scienceStatusObserver=new MutationObserver(records=>{window.__scienceStatusMutations+=records.length});window.__scienceStatusObserver.observe(node,{childList:true,characterData:true,subtree:true})});for(const value of ['8','81','812'])await initial.fill(value);await page.waitForFunction(()=>window.__scienceStatusMutations>=1);assert.equal(await page.evaluate(()=>window.__scienceStatusMutations),1,'unchanged draft status is not repeatedly rewritten');await initial.fill('80');await page.waitForFunction(()=>window.__scienceStatusMutations>=2);assert.equal(await page.evaluate(()=>window.__scienceStatusMutations),2,'returning to applied values updates status once');await page.evaluate(()=>window.__scienceStatusObserver.disconnect());
    await initial.fill(longValue);await run.click();await expect(rows.last()).toContainText('18.36');assert.equal(await initial.inputValue(),longValue);assert.ok((await science.innerText()).includes(`${longValue} °C initial`));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${family}/${framework}: long scientific value reflows`);assert.equal(await science.locator('p').filter({hasText:'Last run:'}).evaluate(node=>node.scrollWidth<=node.clientWidth),true,'last-run value wraps without clipping');
    const longDownload=page.waitForEvent('download');await exportCsv.click();const longCsv=await readFile(await (await longDownload).path(),'utf8');assert.match(longCsv,/10\.00,18\.36/);await initial.fill('80');await run.click();await expect(rows.last()).toContainText('24.93');
   }
   await duration.fill('0');await run.click();await expect(science.getByRole('alert')).toContainText('Duration must be a number');await expect(duration).toHaveAttribute('aria-invalid','true');await expect(rows.last()).toContainText('24.93');
   await science.getByRole('link',{name:/Duration must be a number/}).click();await expect(duration).toBeFocused();
   if(appearance==='light'){
    const priorDownload=page.waitForEvent('download');await exportCsv.click();const prior=await readFile(await (await priorDownload).path(),'utf8');assert.match(prior,/10\.00,24\.93/,'invalid draft retains previous CSV');
   }
   await duration.fill('5');await run.focus();await page.keyboard.press('Enter');await expect(science.getByRole('alert')).toHaveCount(0);await expect(rows.last()).toContainText('5.00');
   if(appearance==='light'){
    const nextDownload=page.waitForEvent('download');await exportCsv.click();const next=await readFile(await (await nextDownload).path(),'utf8');assert.match(next,/5\.00,/);assert.doesNotMatch(next,/10\.00,24\.93/);
    const fallback=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900}});
    try{const fp=await fallback.newPage();const response=await fp.goto(`${origin}/examples/scientific-workspace/`);assert.equal(response.status(),200);await expect(fp.getByRole('button',{name:'Run calculation'})).toBeDisabled();await expect(fp.getByRole('button',{name:'Download results CSV'})).toBeDisabled();await expect(fp.getByText('Interactive calculations are unavailable. The example results remain available; reload to try again.')).toBeVisible();await expect(fp.locator('main tbody tr')).toHaveCount(6);}finally{await fallback.close()}
   }
   await checkAxe('scientific calculation after validation and recovery');
   assert.deepEqual(errors,[],`${family} ${framework}: no page script errors`);
   assert.deepEqual(missing,[],`${family} ${framework}: all requested local resources load`);
   await context.close();console.log(`${engine}: ${family} ${framework} ${appearance}: reading, form, dashboard, scientific calculation and mobile keyboard${appearance==='light'?', gallery handover/reopen/fallback and scientific CSV/no-JS':''} passed; no WCAG-tagged axe violations`);
   }
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 }
}finally{await browser.close()}
