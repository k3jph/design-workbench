// Local cold-cache transfer observation for the paired static article. No budget or production claim.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {gzipSync} from 'node:zlib';
import {chromium} from '@playwright/test';

const root=process.cwd();
const jekyll=process.env.NIGHTJAR_JEKYLL_ROOT;
if(!jekyll) throw Error('Set NIGHTJAR_JEKYLL_ROOT to the paired root-path Jekyll builds');
const sources={jekyll,astro:process.env.NIGHTJAR_ASTRO_ROOT||'examples/astro-slice/dist',react:process.env.NIGHTJAR_REACT_ROOT||'examples/react-catalog/dist'};
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try {for(const [framework,path] of Object.entries(sources)) for(const family of ['martlet','krigsvold']) {
 const site=resolve(root,path,family),requests=[];
 const server=createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname,filename=decodeURIComponent(pathname.slice(1));
  const file=resolve(site,filename.endsWith('/')?`${filename}index.html`:filename);
  if(!file.startsWith(`${site}/`)){res.writeHead(403).end();return;}
  try {const raw=await readFile(file),ext=extname(file),types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'};
   const gzip=['.html','.css','.js','.mjs','.svg'].includes(ext)&&/\bgzip\b/.test(req.headers['accept-encoding']||''),wire=gzip?gzipSync(raw):raw;
   requests.push({path:pathname,ext,bytes:wire.length});res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream','Content-Length':wire.length,'Cache-Control':'no-store',...(gzip?{'Content-Encoding':'gzip'}:{})}).end(wire);
  }catch{requests.push({path:pathname,error:'404'});res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${server.address().port}`;
 try {const runs=[];for(let index=0;index<3;index++){
  requests.length=0;const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(/^https?:/i.test(request.url())&&!request.url().startsWith(`${origin}/`))external.push(request.url())});
  const response=await page.goto(`${origin}/examples/article/`,{waitUntil:'load'});assert.equal(response.status(),200);await page.evaluate(()=>document.fonts.ready);await page.waitForLoadState('networkidle');
  assert.equal(await page.getByRole('heading',{name:'What a shoreline remembers',level:1}).count(),1);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);const missing=requests.filter(item=>item.error);assert.deepEqual(missing.filter(item=>item.path!=='/favicon.ico'),[],`${framework}/${family}: missing local resource`);
  const groups={html:0,js:0,css:0,fonts:0,images:0,other:0};for(const item of requests){if(item.error)continue;const kind=item.ext==='.html'?'html':['.js','.mjs'].includes(item.ext)?'js':item.ext==='.css'?'css':['.woff','.woff2'].includes(item.ext)?'fonts':item.ext==='.svg'?'images':'other';groups[kind]+=item.bytes;}
  runs.push({groups,missing:missing.map(item=>item.path),assets:requests.filter(item=>['.js','.mjs'].includes(item.ext)).map(item=>item.path)});await context.close();
 }
 const bytes=Object.fromEntries(Object.keys(runs[0].groups).map(key=>[key,median(runs.map(run=>run.groups[key]))]));
 const context=await browser.newContext({javaScriptEnabled:false}),page=await context.newPage();await page.goto(`${origin}/examples/article/`,{waitUntil:'load'});assert.equal(await page.getByRole('heading',{name:'What a shoreline remembers',level:1}).count(),1);assert.ok(await page.locator('main a').count()>0);await context.close();
 console.log(JSON.stringify({framework,family,bytes,total:Object.values(bytes).reduce((a,b)=>a+b,0),javascriptRequests:runs[0].assets,missingOptional:runs[0].missing,noScript:'heading and article links present'}));
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}}finally{await browser.close();}
