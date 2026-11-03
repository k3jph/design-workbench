import {chromium} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {gzipSync} from 'node:zlib';

// Run after building both families at root. Each new browser page gets an
// independent cache. The static server deliberately applies no compression;
// gzip sizes are calculated locally at level 9 for a reproducible comparison.
const pages=['about','archive','gallery','dashboard-analytics','dashboard-administration','dashboard-operations'];
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try {for(const family of ['martlet','krigsvold']) {
 const dir=resolve('dist',family);
 const server=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname;const file=resolve(dir,path.slice(1)+(path.endsWith('/')?'index.html':''));if(!file.startsWith(dir+'/'))return res.writeHead(403).end();try{const data=await readFile(file);const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'};res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(data)}catch{res.writeHead(404).end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try {for(const name of pages){const page=await browser.newPage({viewport:{width:1440,height:900}}),assets=new Map();page.on('response',response=>{const kind=response.request().resourceType(),url=new URL(response.url());if(['script','stylesheet','font'].includes(kind)&&url.origin===`http://127.0.0.1:${server.address().port}`)assets.set(url.pathname,kind)});const response=await page.goto(`http://127.0.0.1:${server.address().port}/examples/${name}/`,{waitUntil:'networkidle'});if(response?.status()!==200)throw Error(`${family}/${name}: unexpected status ${response?.status()}`);
  const summary=Object.fromEntries(['script','stylesheet','font'].map(kind=>[kind,{raw:0,gzip:0,count:0}]));for(const [path,kind] of assets){const data=await readFile(resolve(dir,path.slice(1)));summary[kind].raw+=data.length;summary[kind].gzip+=gzipSync(data,{level:9}).length;summary[kind].count++;}const html=await readFile(resolve(dir,`examples/${name}/index.html`));console.log(JSON.stringify({family,page:name,html:html.length,htmlGzip:gzipSync(html,{level:9}).length,assets:[...assets],summary}));await page.close();}}
 finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
}}finally{await browser.close();}
