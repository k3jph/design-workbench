import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';
import { formChecks } from './form-checks.mjs';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root=resolve(process.argv[2]);
const watchdog=setTimeout(()=>{console.error('Layout browser checks exceeded 180 seconds');process.exit(1);},180000);
console.log('Starting layout browser checks');
const server=createServer(async(req,res)=>{
  try {const url=new URL(req.url,'http://localhost');const path=resolve(root,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}const body=await readFile(path);const type={'.html':'text/html','.css':'text/css','.js':'application/javascript','.woff2':'font/woff2'}[extname(path)]||'application/octet-stream';res.writeHead(200,{'Content-Type':type});res.end(body);}catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=`http://127.0.0.1:${server.address().port}`;
const browserName=process.env.DESIGN_BROWSER ?? 'chromium';
assert.ok(['chromium','firefox','webkit'].includes(browserName));
const browser=await ({chromium,firefox,webkit})[browserName].launch({... (browserName==='chromium' && process.env.PLAYWRIGHT_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{}),args:browserName==='chromium'?['--no-sandbox','--disable-dev-shm-usage']:[]});
const context=await browser.newContext({javaScriptEnabled:false});
const external=[];await context.route('**/*',route=>{if(route.request().url().startsWith(base+'/'))return route.continue();external.push(route.request().url());return route.abort();});
const page=await context.newPage();
page.on('requestfailed',r=>console.error('Request failed',r.url(),r.failure()));
async function settledFonts(){
 for(let n=0;n<60;n++){if(await page.evaluate(()=>{void document.documentElement.offsetHeight;return document.fonts.status === 'loaded';}))return;await new Promise(done=>setTimeout(done,250));}
 throw new Error('Fonts did not settle: '+JSON.stringify(await page.evaluate(()=>[...document.fonts].map(f=>({family:f.family,weight:f.weight,status:f.status})))));
}
async function fits(label){const detail=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1)&&!e.closest('pre,.martlet-scroll')}).slice(0,8).map(e=>({tag:e.tagName,class:e.className,width:e.getBoundingClientRect().width,text:e.textContent?.slice(0,50)}))}));assert.ok(detail.document<=detail.viewport,label+' '+JSON.stringify(detail));}
try{
 await mkdir('artifacts/qa',{recursive:true});
 for(const route of ['/','/article/','/documentation/','/layouts/','/form/']){
  for(const width of [280,307,390,768,1280,1600]){
   console.log('Checking '+route+' at '+width);await page.setViewportSize({width,height:1000});await page.goto(base+route);await settledFonts();await fits(route+' at '+width);
   assert.equal(await page.locator('main').count(),1);assert.equal(await page.locator('h1').count(),1);
  }
  await page.setViewportSize({width:307,height:1000});await page.reload();await page.evaluate(()=>document.documentElement.style.setProperty('font-size','150%','important'));await fits(route+' with 150% text');
  console.log('Capturing screenshot');await page.screenshot({timeout:15000,path:`artifacts/qa/${route.replaceAll('/','')||'landing'}-mobile.png`});
 }
 await page.setViewportSize({width:1600,height:1000});await page.goto(base+'/layouts/');
 for(const mode of ['light','dark']){
  const band=page.locator(`.layout-lab[data-martlet="${mode}"]`);
  assert.equal(await band.locator('.probe-regular-space').evaluate(e=>getComputedStyle(e).gap), await band.locator('.probe-grid').evaluate(e=>getComputedStyle(e).gap), 'Regular nested spacing is independent of a compact parent');
  const grid=band.locator('.probe-grid');assert.equal(await grid.evaluate(e=>getComputedStyle(e).display),'grid');
  const columns=await grid.evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length);assert.ok(columns>1&&columns<=3,'Bounded desktop columns');
  const nested=band.locator('.probe-nested');assert.equal(await nested.evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),1,'Nested grid wraps within its container');
  const main=await band.locator('.probe-sidebar > .martlet-sidebar__main').boundingBox(),aside=await band.locator('.probe-sidebar > .martlet-sidebar__aside').boundingBox();assert.ok(Math.abs(main.y-aside.y)<2,'Desktop sidebar is beside main content');
 }
 console.log('Capturing screenshot');await page.screenshot({timeout:15000,path:'artifacts/qa/layouts-desktop.png',fullPage:true});
 await page.setViewportSize({width:307,height:1000});await page.reload();
 const main=await page.locator('.probe-sidebar > .martlet-sidebar__main').first().boundingBox(),aside=await page.locator('.probe-sidebar > .martlet-sidebar__aside').first().boundingBox();assert.ok(aside.y>main.y,'Narrow sidebar follows main content');
 await page.setViewportSize({width:1600,height:1000});await page.goto(base+'/article/');
 const contents=page.getByRole('navigation',{name:'On this page',exact:true});
 await page.screenshot({path:'artifacts/qa/article-desktop.png',fullPage:true});
 assert.equal(await contents.locator('ul ul li').count(),1,'Child section has a native nested list');
 assert.equal(await contents.locator(':scope > ul > li').count(),2,'Two parent sections');
 const index=await contents.boundingBox(),body=await page.locator('.martlet-reading-layout__body').boundingBox();
 assert.ok(index.x < body.x && Math.abs(index.y-body.y)<25,'Wide contents precedes prose in its own column');
 const articleMain=await page.locator('.martlet-reading-layout__body .martlet-sidebar__main').boundingBox(), articleAside=await page.locator('.martlet-reading-layout__body .martlet-sidebar__aside').boundingBox();
 assert.ok(Math.abs(articleMain.y-articleAside.y)<2 && articleAside.x>articleMain.x,'Supported article has an actual side-by-side supporting region');
 assert.ok(articleMain.width<=await page.evaluate(()=>{const v=getComputedStyle(document.documentElement).getPropertyValue('--martlet-reading-width').trim();return parseFloat(v)*(v.endsWith('rem')?parseFloat(getComputedStyle(document.documentElement).fontSize):1);})+1,'Prose retains its reading measure');
 assert.equal(await page.locator('.martlet-site-footer__groups nav').count(),3);
 assert.equal(await page.locator('.martlet-site-footer--grouped').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(7, 17, 31)');
 await page.locator('.martlet-site-footer--grouped').screenshot({path:'artifacts/qa/footer-desktop.png'});
 await page.setViewportSize({width:320,height:1000});await page.reload();
 const narrowIndex=await contents.boundingBox(),narrowBody=await page.locator('.martlet-reading-layout__body').boundingBox();
 assert.ok(narrowIndex.y < narrowBody.y,'Narrow contents precedes body');await fits('Source profile and grouped footer at 320');
 await contents.getByRole('link',{name:'A closer look',exact:true}).click();assert.ok(page.url().endsWith('#detail'));
 await page.locator('.martlet-site-footer--grouped').screenshot({path:'artifacts/qa/footer-narrow.png'});
 await page.setViewportSize({width:1280,height:1000});await page.reload();await page.evaluate(()=>document.documentElement.style.setProperty('font-size','400%','important'));await fits('Article at 400% text');
 await page.goto(base+'/article/');await page.keyboard.press('Tab');assert.ok(await page.locator('.martlet-skip-link').evaluate(e=>e===document.activeElement));
 await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement?.id),'main-content','Skip link moves focus into main content');
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--martlet-motion-duration').trim()),'0s');
 await formChecks(browser,base);
 assert.deepEqual(external,[]);console.log('Layout browser checks passed: 4 routes, 6 widths, enlarged text, both modes, nested grids, source order, skip link, and reduced motion.');
}finally{clearTimeout(watchdog);await context.close();await browser.close();await new Promise(done=>server.close(done));}
