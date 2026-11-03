// Native fragment navigation for every reading/document recipe in both ports.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {chromium,expect} from '@playwright/test';
const catalog=JSON.parse(await readFile('examples/page-archetypes/content/catalog.json','utf8'));
const pages=catalog.pages.filter(page=>['reading','document'].includes(page.composition));
assert.equal(pages.length,18);
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{
 for(const family of ['martlet','krigsvold'])for(const base of ['/','/preview/'])for(const framework of ['astro','react']){
  const env={...process.env,NIGHTJAR_FAMILY:family,NIGHTJAR_BASE:base,ASTRO_TELEMETRY_DISABLED:'1'};
  const args=framework==='astro'?['--prefix','examples/astro-slice','run','build']:['examples/react-catalog/build.mjs'];
  const built=spawnSync(framework==='astro'?'npm':'node',args,{env,encoding:'utf8'});assert.equal(built.status,0,built.stderr);
  const root=resolve(framework==='astro'?'examples/astro-slice/dist':'examples/react-catalog/dist',family);
  const server=createServer(async(req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;if(!pathname.startsWith(base))return res.writeHead(404).end();const name=decodeURIComponent(pathname.slice(base.length)),file=resolve(root,name.endsWith('/')?name+'index.html':name);if(!file.startsWith(root+'/'))return res.writeHead(403).end();try{const data=await readFile(file),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2','.svg':'image/svg+xml'};res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(data)}catch{res.writeHead(404).end()}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{for(const js of [false,true]){const context=await browser.newContext({javaScriptEnabled:js,viewport:{width:320,height:900}}),page=await context.newPage();
   for(const record of pages){const label=`${framework}/${family}/${base}/${record.id}/js=${js}`;const response=await page.goto(`http://127.0.0.1:${server.address().port}${base}examples/${record.id}/`);assert.equal(response.status(),200,label);const nav=page.getByRole('navigation',{name:'On this page',exact:true}),links=nav.getByRole('link');await expect(nav).toBeVisible();await expect(links).toHaveCount(record.sections.length);for(let i=0;i<record.sections.length;i++){const section=record.sections[i];await expect(links.nth(i)).toHaveText(section.title);await expect(links.nth(i)).toHaveAttribute('href',`#${section.id}`);await expect(page.locator(`[id="${section.id}"]`)).toHaveCount(1)}await links.first().focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>decodeURIComponent(location.hash.slice(1))),record.sections[0].id,label);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${label} reflow`);
   }
   await page.emulateMedia({media:'print'});await expect(page.getByRole('navigation',{name:'On this page',exact:true,includeHidden:true})).toBeHidden();await context.close();
  }console.log(`${framework} ${family} ${base}: ${pages.length} indexes with JS/no-JS, keyboard, 320px and print passed`);}finally{server.closeAllConnections();await new Promise(r=>server.close(r))}
 }
}finally{await browser.close()}
