// Print closed disclosures without mutating their screen state, even without JS.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium,expect} from '@playwright/test';
const roots=[['Jekyll',process.env.NIGHTJAR_JEKYLL_ROOT],['Astro',process.env.NIGHTJAR_ASTRO_ROOT||'examples/astro-slice/dist'],['React',process.env.NIGHTJAR_REACT_ROOT||'examples/react-catalog/dist']];
if(!roots[0][1])throw Error('Set NIGHTJAR_JEKYLL_ROOT to paired root-path builds');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try { for(const [framework,root] of roots) for(const family of ['martlet','krigsvold']) {
 const directory=resolve(root,family),server=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname,file=resolve(directory,path.slice(1)+(path.endsWith('/')?'index.html':''));if(!file.startsWith(directory+'/')){res.writeHead(403).end();return}try{const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'};const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(data)}catch{res.writeHead(404).end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try { for(const javascriptEnabled of [true,false]) { const context=await browser.newContext({javascriptEnabled}),page=await context.newPage();
  for(const [route,content] of [['faq','p'],['dashboard-analytics','table']]) {
   await page.goto(`http://127.0.0.1:${server.address().port}/examples/${route}/`,{waitUntil:'networkidle'});const details=page.locator('main details').first();
   // React's FAQ uses a direct text node; wrap it solely to measure visibility.
   if(content==='p')await details.evaluate(el=>{if(el.querySelector('p'))return;const node=[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());if(node){const span=document.createElement('span');span.dataset.printTestText='';node.replaceWith(span);span.append(node);}});
   const inside=details.locator(content==='p'?'p,[data-print-test-text]':content).first();
   await expect(details).toHaveCount(1);await expect(inside).toBeHidden();assert.equal(await details.evaluate(el=>el.open),false);
   await page.emulateMedia({media:'print'});await expect(inside).toBeVisible();assert.equal(await details.evaluate(el=>el.open),false);
   await page.emulateMedia({media:'screen'});await expect(inside).toBeHidden();assert.equal(await details.evaluate(el=>el.open),false);
   await details.locator('summary').click();await expect(inside).toBeVisible();await page.emulateMedia({media:'print'});await expect(inside).toBeVisible();assert.equal(await details.evaluate(el=>el.open),true);await page.emulateMedia({media:'screen'});assert.equal(await details.evaluate(el=>el.open),true);
  } await context.close(); } console.log(`${framework} ${family}: FAQ and chart print disclosures preserve state with and without JavaScript`);
 } finally {server.closeAllConnections();await new Promise(r=>server.close(r))}
} } finally {await browser.close()}
