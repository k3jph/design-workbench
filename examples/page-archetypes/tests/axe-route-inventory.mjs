// Broad automated scan of the initial rendered state; this is not an accessibility certification.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const roots=[['Jekyll',process.env.NIGHTJAR_JEKYLL_ROOT],['Astro',process.env.NIGHTJAR_ASTRO_ROOT||'examples/astro-slice/dist'],['React',process.env.NIGHTJAR_REACT_ROOT||'examples/react-catalog/dist']];
if(!roots[0][1])throw Error('Set NIGHTJAR_JEKYLL_ROOT to paired root-path builds');
const catalog=JSON.parse(await readFile('examples/page-archetypes/content/catalog.json','utf8'));
const appearance=process.env.NIGHTJAR_AXE_APPEARANCE;
if(appearance&&!['light','dark'].includes(appearance))throw Error('NIGHTJAR_AXE_APPEARANCE must be light or dark');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const issues=[];let groups=0;
try {
 for(const [framework,root] of roots)for(const family of ['martlet','krigsvold']){
  if(process.env.NIGHTJAR_AXE_SCOPE && process.env.NIGHTJAR_AXE_SCOPE!==`${framework}/${family}`)continue;
  groups++;
  const directory=resolve(root,family),server=createServer(async(req,res)=>{
   const path=new URL(req.url,'http://localhost').pathname,file=resolve(directory,path.slice(1)+(path.endsWith('/')?'index.html':''));
   if(!file.startsWith(directory+'/')){res.writeHead(403).end();return}
   try{const data=await readFile(file),types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'};res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(data)}catch{res.writeHead(404).end()}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try {
   const context=await browser.newContext({viewport:{width:1280,height:900}});
   if(appearance)await context.addInitScript(value=>{localStorage.setItem('nightjar-appearance',value);localStorage.setItem('design-appearance',value)},appearance);
   const page=await context.newPage();
   let scanned=0;
   for(const record of catalog.pages){
    if(process.env.NIGHTJAR_AXE_ROUTE && process.env.NIGHTJAR_AXE_ROUTE!==record.id)continue;
    scanned++;
    const label=`${framework}/${family}/${record.id}`,response=await page.goto(`http://127.0.0.1:${server.address().port}/examples/${record.id}/`,{waitUntil:'load'});
    assert.equal(response.status(),200,label);
    if(appearance){if(framework==='React')await page.waitForFunction(value=>document.querySelector('.source-shell')?.dataset.mode===value,appearance);else await page.waitForFunction(value=>document.documentElement.dataset.appearance===value,appearance);}
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
    for(const violation of result.violations){const issue={label,id:violation.id,nodes:violation.nodes.map(node=>({target:node.target,summary:node.failureSummary}))};issues.push(issue);console.error(JSON.stringify(issue));}
    if(framework==='Astro'&&record.id==='contact'){
     // Exercise the real disabled-to-enabled transition; a settled scan alone can miss it.
     const ratios=await page.evaluate(async()=>{
      const fieldset=document.querySelector('[data-demo-fields]'),button=fieldset.querySelector('button[type=submit]');
      fieldset.disabled=true;await new Promise(r=>setTimeout(r,250));fieldset.disabled=false;
      const values=[],channel=c=>{const n=c/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4},lum=rgb=>.2126*channel(rgb[0])+.7152*channel(rgb[1])+.0722*channel(rgb[2]);
      const start=performance.now();do{await new Promise(requestAnimationFrame);const style=getComputedStyle(button),parse=value=>{const parts=value.match(/\d+(?:\.\d+)?/g);if(!parts||parts.length<3)throw Error(`Unexpected color ${value}`);return parts.slice(0,3).map(Number)},a=lum(parse(style.color)),b=lum(parse(style.backgroundColor));values.push((Math.max(a,b)+.05)/(Math.min(a,b)+.05));}while(performance.now()-start<200);return values;
     });
     assert.ok(ratios.length>0&&ratios.every(ratio=>ratio>=4.5),`${label}: enabled button contrast during transition: ${ratios.join(', ')}`);
    }
   }
   assert.ok(scanned>0,`No matching routes for ${process.env.NIGHTJAR_AXE_ROUTE}`);
   await context.close();console.log(`${framework} ${family}: scanned ${scanned} initial states`);
  } finally {server.closeAllConnections();await new Promise(r=>server.close(r))}
 }
} finally {await browser.close()}
assert.ok(groups>0,`No matching framework/family for ${process.env.NIGHTJAR_AXE_SCOPE}`);
assert.deepEqual(issues,[],JSON.stringify(issues,null,2));
