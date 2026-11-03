// Bounded computed-color checks for the 320px states where axe reported incomplete contrast.
// This does not replace axe, visual inspection, or review of other images and states.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
import {chromium,firefox,webkit,expect} from '@playwright/test';

const roots={jekyll:process.env.NIGHTJAR_JEKYLL_ROOT,astro:process.env.NIGHTJAR_ASTRO_ROOT||'examples/astro-slice/dist',react:process.env.NIGHTJAR_REACT_ROOT||'examples/react-catalog/dist'};
if(!roots.jekyll)throw Error('NIGHTJAR_JEKYLL_ROOT must contain paired root-path builds');
const screenshots=process.env.NIGHTJAR_CONTRAST_SCREENSHOTS;if(screenshots)await mkdir(screenshots,{recursive:true});
const channel=n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4};
const luminance=rgb=>.2126*channel(rgb[0])+.7152*channel(rgb[1])+.0722*channel(rgb[2]);
const ratio=(a,b)=>{a=luminance(a);b=luminance(b);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
const over=(fg,bg,alpha)=>fg.map((n,i)=>n*alpha+bg[i]*(1-alpha));
function color(value){const m=value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);assert.ok(m,`Unsupported computed color ${value}`);return {rgb:m.slice(1,4).map(Number),alpha:m[4]===undefined?1:Number(m[4])};}
async function serve(root){const server=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,path.slice(1)+(path.endsWith('/')?'index.html':''));if(!file.startsWith(root+'/'))return res.writeHead(403).end();try{const data=await readFile(file),types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'};res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(data)}catch{res.writeHead(404).end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));return server}
async function solidColors(locator,property){return locator.evaluateAll((nodes,property)=>nodes.filter(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.height>0}).map(n=>{const s=getComputedStyle(n),chain=[];for(let e=n;e;e=e.parentElement){const cs=getComputedStyle(e);chain.push({bg:cs.backgroundColor,image:cs.backgroundImage,opacity:cs.opacity})}return {text:n.textContent,foreground:s[property],chain}}),property)}
function checkSolid(nodes,label){assert.ok(nodes.length,`${label}: no rendered text`);let min=Infinity;for(const node of nodes){const fg=color(node.foreground);assert.equal(fg.alpha,1,`${label}: translucent foreground needs manual analysis`);let bg;for(const layer of node.chain){assert.equal(layer.opacity,'1',`${label}: opacity needs manual analysis`);if(bg)continue;assert.equal(layer.image,'none',`${label}: image/gradient needs manual analysis`);const c=color(layer.bg);if(c.alpha===1)bg=c.rgb;else assert.equal(c.alpha,0,`${label}: partially transparent background needs manual analysis`)}assert.ok(bg,`${label}: no opaque background`);const value=ratio(fg.rgb,bg);min=Math.min(min,value);assert.ok(value>=4.5,`${label}: ${JSON.stringify(node.text)} contrast ${value.toFixed(2)}:1`)}return min}
function solidPair(node){const fg=color(node.foreground);const layer=node.chain.find(item=>color(item.bg).alpha===1);assert.ok(layer,'no opaque background');return `${node.foreground} on ${layer.bg} (${ratio(fg.rgb,color(layer.bg).rgb).toFixed(2)}:1)`}
async function masthead(page,family,route){
 const state=await page.evaluate(family=>{
  const style=selector=>{const e=document.querySelector(selector),s=getComputedStyle(e),r=e.getBoundingClientRect();return {color:s.color,bg:s.backgroundColor,image:s.backgroundImage,opacity:s.opacity,position:s.position,rect:{top:r.top,bottom:r.bottom,left:r.left,right:r.right}}};
  const text=selector=>[...document.querySelectorAll(selector)].filter(e=>e.getBoundingClientRect().width>0).map(e=>{const s=getComputedStyle(e);return {inHeader:!!e.closest('.site-header,.site-navbar'),text:e.textContent.trim(),color:s.color,opacity:s.opacity,bg:s.backgroundColor,image:s.backgroundImage,shadow:s.textShadow}});
  return family==='martlet'?{base:style('.page-intro'),shade:style('.page-intro__shade'),header:style('.site-header'),text:text('.page-intro__content > .eyebrow,.page-intro__content > h1,.page-intro__content > p:not(.eyebrow),.page-intro__content .masthead-metadata,.page-intro__content time,.brand > span,.menu-button')}:{base:style('.page-masthead'),shade:style('.page-masthead__veil'),header:style('.site-navbar'),text:text('.page-masthead .eyebrow,.page-masthead h1,.page-masthead .col-lg-9 > p,.page-masthead .masthead-metadata,.page-masthead time,.page-masthead .masthead-tags a,.navbar-brand > span')};
 },family);
 assert.equal(state.base.image,'none',`${family}/${route}: custom hero image needs manual review`);assert.equal(state.base.opacity,'1');assert.equal(state.shade.opacity,'1');assert.equal(state.header.image,'none');assert.equal(state.header.opacity,'1');assert.ok(state.text.length>=4);
 let backgrounds,headerBackgrounds;
 if(family==='martlet'){
  assert.equal(state.base.bg,'rgb(7, 17, 31)');assert.equal(state.shade.image,'linear-gradient(115deg, rgba(7, 17, 31, 0.9), rgba(12, 35, 60, 0.8))');
  assert.equal(state.header.bg,'rgba(0, 0, 0, 0)');assert.equal(state.header.position,'fixed');
  const h=state.header.rect,s=state.shade.rect;assert.ok(h.top>=s.top&&h.bottom<=s.bottom&&h.left>=s.left&&h.right<=s.right,'fixed header must be over the audited masthead');
  backgrounds=[over([7,17,31],[7,17,31],.9),over([12,35,60],[7,17,31],.8)];headerBackgrounds=backgrounds;
 }else{
  assert.equal(state.base.bg,'rgb(10, 29, 53)');assert.equal(state.shade.image,'linear-gradient(0deg, rgba(6, 19, 37, 0.94), rgba(6, 19, 37, 0.42))');
  assert.equal(state.header.bg,'rgba(6, 19, 37, 0.96)');
  const m=state.base.rect,v=state.shade.rect;assert.ok(Math.abs(m.top-v.top)<1&&Math.abs(m.bottom-v.bottom)<1&&Math.abs(m.left-v.left)<1&&Math.abs(m.right-v.right)<1,'veil must cover the audited masthead');
  backgrounds=[over([6,19,37],[10,29,53],.94),over([6,19,37],[10,29,53],.42)];
  // White is the brightest possible underlying pixel for the translucent navbar.
  headerBackgrounds=[over([6,19,37],[255,255,255],.96)];
 }
 let min=Infinity;for(const node of state.text){assert.equal(node.opacity,'1');assert.equal(node.bg,'rgba(0, 0, 0, 0)');assert.equal(node.image,'none');assert.equal(node.shadow,'none');const fg=color(node.color),bgs=node.inHeader?headerBackgrounds:backgrounds;for(const bg of bgs){const value=ratio(over(fg.rgb,bg,fg.alpha),bg);min=Math.min(min,value);assert.ok(value>=4.5,`${family}/${route}: ${JSON.stringify(node.text)} endpoint contrast ${value.toFixed(2)}:1`)}}return {min,foreground:[...new Set(state.text.map(node=>node.color))],base:state.base.bg,gradient:state.shade.image,header:state.header.bg};
}
const engineName=process.env.NIGHTJAR_BROWSER||'chromium',engine={chromium,firefox,webkit}[engineName];if(!engine)throw Error(`Unsupported NIGHTJAR_BROWSER: ${engineName}`);
const browser=await engine.launch({headless:true,...(engineName==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{for(const [framework,base] of Object.entries(roots))for(const family of ['martlet','krigsvold']){const server=await serve(resolve(base,family)),origin=`http://127.0.0.1:${server.address().port}`;try{for(const appearance of ['light','dark']){const context=await browser.newContext({viewport:{width:320,height:900}});await context.addInitScript(value=>{localStorage.setItem('nightjar-appearance',value);localStorage.setItem('design-appearance',value)},appearance);const page=await context.newPage();
 await page.goto(`${origin}/examples/dashboard-analytics/`,{waitUntil:'networkidle'});if(framework==='react')await page.waitForFunction(value=>document.querySelector('.source-shell')?.dataset.mode===value,appearance);else await page.waitForFunction(value=>document.documentElement.dataset.appearance===value,appearance);
 await page.getByRole('combobox',{name:'Date range'}).selectOption('14');await page.getByRole('combobox',{name:'Category',exact:true}).selectOption('Research');await page.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(page.locator('[aria-label="Analytics summary"] output').first()).toHaveText('4,459');
 const labels=await solidColors(page.locator('main svg text'),'fill'),cells=await solidColors(page.locator('#analytics-source :is(th,td)'),'color'),captions=await solidColors(page.locator('#analytics-source > caption'),'color'),chartMin=checkSolid(labels,`${framework}/${family}/${appearance} SVG labels`),cellMin=checkSolid(cells,`${framework}/${family}/${appearance} table`),captionMin=checkSolid(captions,`${framework}/${family}/${appearance} table caption`);
 const scroll=page.locator('#analytics-source').locator('..');await expect(scroll).toHaveAttribute('role','region');await expect(scroll).toHaveAttribute('tabindex','0');const before=await scroll.evaluate(e=>({left:e.scrollLeft,width:e.scrollWidth,client:e.clientWidth}));assert.ok(before.width>before.client,'320px source table should be horizontally scrollable');await scroll.focus();for(let i=0;i<5;i++)await page.keyboard.press('ArrowRight');await expect.poll(()=>scroll.evaluate(e=>e.scrollLeft)).toBeGreaterThan(before.left);
 if(screenshots){await page.locator('main svg').first().screenshot({path:join(screenshots,`${framework}-${family}-${appearance}-chart.png`)});await page.locator('#analytics-source > caption').screenshot({path:join(screenshots,`${framework}-${family}-${appearance}-caption.png`)});}
 let mast='';if(framework==='jekyll'&&appearance==='light')for(const route of ['article','sign-in','scientific-workspace']){await page.goto(`${origin}/examples/${route}/`,{waitUntil:'networkidle'});const evidence=await masthead(page,family,route);mast+=` ${route} gradient endpoints ≥${evidence.min.toFixed(2)}:1 ${JSON.stringify(evidence)}`;if(screenshots)await page.screenshot({path:join(screenshots,`${framework}-${family}-${appearance}-${route}.png`)});}
 console.log(`${framework} ${family} ${appearance}: ${labels.length} SVG labels ≥${chartMin.toFixed(2)}:1 (first: ${solidPair(labels[0])}); ${cells.length} table cells ≥${cellMin.toFixed(2)}:1 (first: ${solidPair(cells[0])}); caption ≥${captionMin.toFixed(2)}:1 (${solidPair(captions[0])}); keyboard horizontal scroll passed.${mast}`);await context.close();
 }}finally{server.closeAllConnections();await new Promise(r=>server.close(r))}}}finally{await browser.close()}
