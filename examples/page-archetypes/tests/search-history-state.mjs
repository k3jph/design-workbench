// Search may update its own query without discarding state owned by its host.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium,expect} from '@playwright/test';
const root=process.cwd(),only=process.env.NIGHTJAR_SEARCH_FRAMEWORK||'all';
if(!['all','Jekyll','Astro','React'].includes(only))throw Error('Choose all, Jekyll, Astro or React');
const sources=[['Jekyll',process.env.NIGHTJAR_JEKYLL_ROOT],['Astro',process.env.NIGHTJAR_ASTRO_ROOT||resolve(root,'examples/astro-slice/dist')],['React',process.env.NIGHTJAR_REACT_ROOT||resolve(root,'examples/react-catalog/dist')]];
if((only==='all'||only==='Jekyll')&&!sources[0][1])throw Error('Set NIGHTJAR_JEKYLL_ROOT to paired root-path builds');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try {for(const [framework,source] of sources.filter(([name])=>only==='all'||name===only))for(const family of ['martlet','krigsvold']){
 const directory=resolve(source,family),server=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname,file=resolve(directory,path.slice(1)+(path.endsWith('/')?'index.html':''));if(!file.startsWith(directory+'/')){res.writeHead(403).end();return}try{const data=await readFile(file),type={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'};res.writeHead(200,{'Content-Type':type[extname(file)]||'application/octet-stream'}).end(data)}catch{res.writeHead(404).end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const page=await browser.newPage(),origin=`http://127.0.0.1:${server.address().port}`,label=`${framework}/${family}`,state={host:{draft:'preserve',revision:4}};await page.addInitScript(value=>history.replaceState(value,'',location.href),state);await page.goto(`${origin}/examples/search/?keep=untouched&q=shoreline#context`,{waitUntil:'networkidle'});const input=page.getByRole('searchbox',{name:'Search the example record'});await expect(input).toHaveValue('shoreline');assert.deepEqual(await page.evaluate(()=>history.state),state,`${label}: initial enhancement preserves history state`);const length=await page.evaluate(()=>history.length);
  for(const [value,expected] of [['  protocol  ','protocol'],['','']]){await input.fill(value);await input.press('Enter');await expect(input).toHaveValue(expected);const result=await page.evaluate(()=>({state:history.state,length:history.length,query:new URL(location.href).searchParams.get('q'),keep:new URL(location.href).searchParams.get('keep'),hash:location.hash}));assert.deepEqual(result.state,state,`${label}: query update preserves host state`);assert.equal(result.length,length,`${label}: query update replaces history entry`);assert.equal(result.query,expected||null);assert.equal(result.keep,'untouched');assert.equal(result.hash,'#context');}
  await page.close();console.log(`${label}: search retains host history state and unrelated URL state`);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
}}finally{await browser.close();}
