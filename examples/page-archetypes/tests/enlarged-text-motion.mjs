// Root text scaling and reduced-motion emulation are bounded checks, not browser zoom or screen-reader certification.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium,expect} from '@playwright/test';
const root=process.cwd(),only=process.env.NIGHTJAR_SCALE_FRAMEWORK||'all';
if(!['all','Jekyll','Astro','React'].includes(only))throw Error('Choose all, Jekyll, Astro or React');
const families=process.env.NIGHTJAR_SCALE_FAMILY?[process.env.NIGHTJAR_SCALE_FAMILY]:['martlet','krigsvold'];
if(families.some(family=>!['martlet','krigsvold'].includes(family)))throw Error('Choose martlet or krigsvold');
const sources=[['Jekyll',process.env.NIGHTJAR_JEKYLL_ROOT],['Astro',process.env.NIGHTJAR_ASTRO_ROOT||resolve(root,'examples/astro-slice/dist')],['React',process.env.NIGHTJAR_REACT_ROOT||resolve(root,'examples/react-catalog/dist')]];
if((only==='all'||only==='Jekyll')&&!sources[0][1])throw Error('Set NIGHTJAR_JEKYLL_ROOT to the paired root-path builds');
const browser=await chromium.launch({headless:true,timeout:20000,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const deadline=setTimeout(()=>{console.error('Enlarged-text regression exceeded its 10-minute deadline');void browser.close().finally(()=>process.exit(1));setTimeout(()=>process.exit(1),5000).unref();},600000);
async function bounded(label,operation,ms=15000){let timer;try{return await Promise.race([operation(),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error(`${label}: deadline exceeded (${ms}ms)`)),ms))]);}finally{clearTimeout(timer);}}
try {for(const [framework,source] of sources.filter(([name])=>only==='all'||name===only))for(const family of families){
 const directory=resolve(source,family),server=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname,file=resolve(directory,path.slice(1)+(path.endsWith('/')?'index.html':''));if(!file.startsWith(directory+'/')){res.writeHead(403).end();return}try{const data=await readFile(file),type={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'};res.writeHead(200,{'Content-Type':type[extname(file)]||'application/octet-stream'}).end(data)}catch{res.writeHead(404).end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{for(const width of [320,768])for(const kind of ['analytics','administration','operations']){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),origin=`http://127.0.0.1:${server.address().port}`,context=`${framework}/${family} ${kind} ${width}px`;
  page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(15000);
  console.log(`${context}: navigation`);
  await page.goto(`${origin}/examples/dashboard-${kind}/`,{waitUntil:'load'});
  const before=await page.evaluate(()=>getComputedStyle(document.documentElement).fontSize);
  // Read immediately in the same task: reduced motion must not create even a
  // one-frame font-size transition before the scaled text takes effect.
  const immediate=await page.evaluate(()=>{const style=document.createElement('style');style.dataset.nightjarTextScale='';style.textContent='html { font-size: 200% !important; }';document.head.append(style);return getComputedStyle(document.documentElement).fontSize});
  const scaleStyle=page.locator('style[data-nightjar-text-scale]');
  console.log(`${context}: fonts and settled layout`);
  await bounded(`${context}: fonts`,()=>page.evaluate(()=>document.fonts.ready.then(()=>true)));
  const toggle=page.getByRole('button',{name:'Dashboard navigation',exact:true});await toggle.waitFor({state:'visible'});
  await page.evaluate(async()=>{
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   let last,stable=0;
   for(let attempt=0;attempt<40;attempt++){
    const aside=document.querySelector('aside[aria-label="Dashboard workspace"]'),box=aside?.getBoundingClientRect();
    const current=JSON.stringify([document.querySelector('header')?.getBoundingClientRect().height,box?.top,box?.width,box?.height]);
    stable=current===last?stable+1:0;if(stable>=4)return;
    last=current;await new Promise(resolve=>setTimeout(resolve,50));
   }
   throw Error('Header/sidebar did not settle within two seconds');
  });
  // The combined narrow/enlarged state once passed overflow checks while
  // splitting NORTHLIGHT and Dashboard navigation into hard-to-read fragments.
  // Check these fixed orientation/control labels, not arbitrary long headings.
  const words=await page.evaluate(()=>{
   const aside=document.querySelector('aside[aria-label="Dashboard workspace"]');
   if(!aside)throw Error('Dashboard workspace landmark missing');
   const targets=[aside.querySelector(':scope > p'),aside.querySelector(':scope > button')];
   return targets.flatMap(node=>{
    if(!node||!node.getClientRects().length)throw Error('Dashboard orientation/control label missing');
    const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT),result=[];let text;
    while(text=walker.nextNode())for(const match of text.textContent.matchAll(/[A-Za-z]+/g)){
     const range=document.createRange();range.setStart(text,match.index);range.setEnd(text,match.index+match[0].length);
     const rects=[...range.getClientRects()].filter(rect=>rect.width>0&&rect.height>0);
     result.push({word:match[0],lines:new Set(rects.map(rect=>Math.round(rect.y))).size});
    }
    return result;
   });
  });
  assert.equal(words.length,4,`${context}: complete workspace and navigation labels`);
  assert.deepEqual(words.filter(word=>word.lines!==1),[],`${context}: fragmented dashboard label words ${JSON.stringify(words)}`);
  const state=await page.evaluate(()=>({font:getComputedStyle(document.documentElement).fontSize,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,viewport:innerWidth,document:document.documentElement.scrollWidth,clipped:[...document.querySelectorAll('button')].filter(b=>b.getClientRects().length&&b.scrollWidth>b.clientWidth+1).map(b=>b.textContent.trim())}));
  if(immediate!=='32px'||state.font!=='32px'){
   const details=await scaleStyle.evaluate(node=>{
    const matched=[];const collect=rules=>{for(const rule of rules){if(rule instanceof CSSStyleRule && rule.style.getPropertyValue('font-size')){try{if(document.documentElement.matches(rule.selectorText))matched.push({selector:rule.selectorText,value:rule.style.getPropertyValue('font-size'),priority:rule.style.getPropertyPriority('font-size')})}catch{}}else if(rule instanceof CSSMediaRule){if(matchMedia(rule.conditionText).matches)collect(rule.cssRules)}else if(rule instanceof CSSGroupingRule)collect(rule.cssRules)}};
    for(const sheet of document.styleSheets)try{collect(sheet.cssRules)}catch{}
    return {connected:node.isConnected,text:node.textContent,rules:node.sheet?[...node.sheet.cssRules].map(rule=>rule.cssText):null,matched,rootInline:document.documentElement.getAttribute('style'),rootClass:document.documentElement.className,htmlCount:document.querySelectorAll('html').length,userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],computed:getComputedStyle(document.documentElement).fontSize};
   });
   console.error('Root text scaling diagnostic:',JSON.stringify({context,before,immediate,after:state.font,...details}));
  }
  assert.equal(immediate,'32px',`${context}: immediate reduced-motion text scale`);
  assert.equal(state.font,'32px',context);assert.equal(state.reduced,true,context);assert.ok(state.document<=state.viewport+1,`${context}: horizontal overflow ${JSON.stringify(state)}`);assert.deepEqual(state.clipped,[],`${context}: clipped button text`);
  console.log(`${context}: keyboard and applied controls`);
  await toggle.focus();await page.keyboard.press('Enter');await expect(toggle).toHaveAttribute('aria-expanded','true');await page.keyboard.press('Escape');await expect(toggle).toHaveAttribute('aria-expanded','false');assert.equal(await toggle.evaluate(el=>el===document.activeElement),true,`${context}: focus restored`);
  let button;
  if(kind==='analytics'){await page.getByLabel('Date range').selectOption('14');await page.getByRole('combobox',{name:/^Category/}).selectOption('Research');button=page.getByRole('button',{name:'Apply filters',exact:true});}
  if(kind==='administration'){await page.getByLabel('Search people',{exact:true}).fill('Mara Ellis');button=page.getByRole('button',{name:'Apply directory filters',exact:true});}
  if(kind==='operations'){await page.getByLabel('Warning threshold (ms)').fill('50');button=page.getByRole('button',{name:'Apply monitoring controls',exact:true});}
  await button.focus();await page.keyboard.press('Enter');
  if(kind==='analytics')await expect(page.locator('#analytics-source tbody tr')).toHaveCount(14);
  if(kind==='administration')await expect(page.locator('#people-table tbody tr')).toHaveCount(1);
  if(kind==='operations')await expect(page.locator('[data-metric=warnings], .ro-metrics output').first()).toHaveText('5');
  await page.close();
 }console.log(`${framework} ${family}: 200% root text and reduced-motion keyboard checks passed at 320/768px`);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
}}finally{clearTimeout(deadline);await browser.close();}
