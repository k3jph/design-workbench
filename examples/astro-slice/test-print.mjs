import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try { for(const family of ['martlet','krigsvold']) for(const base of ['/','/preview/']) {
 const build=spawnSync('npm',['run','build'],{env:{...process.env,NIGHTJAR_FAMILY:family,NIGHTJAR_BASE:base,ASTRO_TELEMETRY_DISABLED:'1'},encoding:'utf8'});assert.equal(build.status,0,build.stderr);
 const dir=resolve('dist',family),server=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname;if(!path.startsWith(base))return res.writeHead(404).end();const rel=decodeURIComponent(path.slice(base.length)),file=resolve(dir,rel.endsWith('/')?rel+'index.html':rel);if(!file.startsWith(dir+'/'))return res.writeHead(403).end();try{const data=await readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.woff2':'font/woff2'})[extname(file)]||'application/octet-stream'}).end(data)}catch{res.writeHead(404).end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 try { const page=await browser.newPage({viewport:{width:1440,height:900}});await page.goto(`${origin}${base}examples/dashboard-analytics/`);await page.waitForFunction(()=>document.querySelector('[data-metric=sessions]')?.textContent==='7,686');assert.equal(await page.locator('.nightjar-header').isVisible(),true);assert.equal(await page.locator('#analytics-filters').isVisible(),true);await page.emulateMedia({media:'print'});
  for(const selector of ['.nightjar-header','.nightjar-footer','.analytics-app aside','#analytics-filters'])assert.equal(await page.locator(selector).isVisible(),false,`${family} ${base} ${selector} should be hidden in print`);
  for(const selector of ['h1','[data-metric=sessions]','#analytics-source'])assert.equal(await page.locator(selector).isVisible(),true,`${family} ${base} ${selector} should remain in print`);
  assert.equal(await page.locator('[data-metric=sessions]').textContent(),'7,686');
  for (const [view,table] of [['administration','#people-table'],['operations','#service-table']]) {
    await page.goto(`${origin}${base}examples/dashboard-${view}/`);
    await page.waitForFunction(()=>document.querySelector('[data-dashboard]')?.dataset.ready==='true');
    for(const selector of ['.nightjar-header','.nightjar-footer','.dash-sidebar','.dash-toolbar'])assert.equal(await page.locator(selector).isVisible(),false,`${family} ${base} ${view} ${selector}`);
    assert.equal(await page.locator('h1').isVisible(),true);assert.equal(await page.locator(table).isVisible(),true);
  }
  await page.goto(`${origin}${base}examples/article/`);
  assert.equal(await page.locator('.nightjar-masthead h1').isVisible(),true);
  assert.equal(await page.locator('.nightjar-header').isVisible(),false);
  assert.equal(await page.locator('.nightjar-footer').isVisible(),false);
  // A printer often omits backgrounds. Dark-mode foregrounds must still be readable on white paper.
  await page.emulateMedia({media:'screen'});await page.locator('[data-appearance-toggle]').click();
  const darkScreenColor=await page.locator('.recipe-prose').first().evaluate(node=>getComputedStyle(node).color);
  await page.emulateMedia({media:'print'});
  const darkEnough = async selector => page.locator(selector).first().evaluate(node => {
    const rgb=getComputedStyle(node).color.match(/\d+/g).slice(0,3).map(Number);
    const linear=rgb.map(value=>{const n=value/255;return n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4;});
    return 1.05/(0.05+0.2126*linear[0]+0.7152*linear[1]+0.0722*linear[2]) >= 4.5;
  });
  assert.equal(await darkEnough('.recipe-prose'),true,`${family} article dark-appearance print text contrast`);
  await page.emulateMedia({media:'screen'});
  assert.equal(await page.locator('.recipe-prose').first().evaluate(node=>getComputedStyle(node).color),darkScreenColor,'Print rules must not change screen appearance');
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.appearance),'dark');
  await page.emulateMedia({media:'print'});
  await page.goto(`${origin}${base}examples/dashboard-analytics/`);
  await page.waitForFunction(()=>document.querySelector('[data-metric=sessions]')?.textContent==='7,686');
  assert.equal(await darkEnough('[data-metric=sessions]'),true,`${family} analytics dark-appearance print text contrast`);
  assert.equal(await darkEnough('#analytics-source tbody th'),true,`${family} analytics table dark-appearance print text contrast`);
  for (const [view,selector] of [['administration','#people-table tbody th'],['operations','#service-table tbody th']]) {
    await page.goto(`${origin}${base}examples/dashboard-${view}/`);
    await page.waitForFunction(()=>document.querySelector('[data-dashboard]')?.dataset.ready==='true');
    assert.equal(await darkEnough(selector),true,`${family} ${view} dark-appearance print text contrast`);
  }
  await page.close();console.log(`${family} ${base}: screen, dark-appearance print and report visibility passed`);
 } finally {await new Promise(r=>server.close(r))}
 }} finally {await browser.close()}
