// Verify portable breadcrumb hierarchy, including roots and JavaScript fallbacks.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{
 for(const family of ['martlet','krigsvold'])for(const base of ['/','/preview/'])for(const framework of ['astro','react']){
  const env={...process.env,NIGHTJAR_FAMILY:family,NIGHTJAR_BASE:base,ASTRO_TELEMETRY_DISABLED:'1'};
  const args=framework==='astro'?['--prefix','examples/astro-slice','run','build']:['examples/react-catalog/build.mjs'];
  const built=spawnSync(framework==='astro'?'npm':'node',args,{env,encoding:'utf8'});assert.equal(built.status,0,built.stderr);
  const root=resolve(framework==='astro'?'examples/astro-slice/dist':'examples/react-catalog/dist',family);
  const server=createServer(async(req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;if(!pathname.startsWith(base))return res.writeHead(404).end();const name=decodeURIComponent(pathname.slice(base.length)),file=resolve(root,name.endsWith('/')?name+'index.html':name);if(!file.startsWith(root+'/'))return res.writeHead(403).end();try{const data=await readFile(file),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2','.svg':'image/svg+xml'};res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(data)}catch{res.writeHead(404).end()}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{for(const js of [false,true]){const context=await browser.newContext({javaScriptEnabled:js,viewport:{width:320,height:900}}),page=await context.newPage(),origin=`http://127.0.0.1:${server.address().port}`;
   for(const [route,expected] of [['home',[]],['', ['Home']],['article',['Home','Examples']],['dashboard-analytics',[]]]){
    const label=`${framework}/${family}/${base}/${route}/js=${js}`,response=await page.goto(`${origin}${base}examples/${route}${route?'/':''}`);assert.equal(response.status(),200,label);
    const nav=page.getByRole('navigation',{name:'Breadcrumb',exact:true});await expect(nav).toHaveCount(expected.length?1:0);
    if(expected.length){const links=nav.getByRole('link');await expect(links).toHaveText(expected);await expect(links.first()).toHaveAttribute('href',`${base}examples/home/`);if(expected.length===2)await expect(links.last()).toHaveAttribute('href',`${base}examples/`);await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);await expect(nav.locator('[aria-current="page"]')).not.toHaveAttribute('href',/.*/);assert.equal(await links.evaluateAll(nodes=>nodes.some(a=>a.href===location.href)),false,`${label}: current page is not an ancestor link`);if(expected.length===2){await links.last().focus();await page.keyboard.press('Enter');await expect(page).toHaveURL(`${origin}${base}examples/`);}}
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${label} reflow`);
   }
   await context.close();
  }console.log(`${framework} ${family} ${base}: breadcrumb hierarchy, keyboard, 320px and JS/no-JS passed`);}finally{server.closeAllConnections();await new Promise(r=>server.close(r))}
 }
}finally{await browser.close()}
