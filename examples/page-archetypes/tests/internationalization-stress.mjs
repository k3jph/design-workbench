// This is a bounded reflow check, not a claim of complete internationalization or RTL support.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from '@playwright/test';
const root=process.cwd(),only=process.env.NIGHTJAR_I18N_FRAMEWORK||'all';
if(!['all','Jekyll','Astro','React'].includes(only))throw Error('Choose all, Jekyll, Astro or React');
const sources=[['Jekyll',process.env.NIGHTJAR_JEKYLL_ROOT],['Astro',process.env.NIGHTJAR_ASTRO_ROOT||resolve(root,'examples/astro-slice/dist')],['React',process.env.NIGHTJAR_REACT_ROOT||resolve(root,'examples/react-catalog/dist')]];
if((only==='all'||only==='Jekyll')&&!sources[0][1])throw Error('Set NIGHTJAR_JEKYLL_ROOT to the root-path paired Jekyll builds');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const text='Überlängenbeobachtungsbezeichnung'.repeat(6)+'日本語اللغةالعربية';
try {for(const [framework,source] of sources.filter(([name])=>only==='all'||name===only))for(const family of ['martlet','krigsvold']){
 const directory=resolve(source,family);const server=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname,file=resolve(directory,path.slice(1)+(path.endsWith('/')?'index.html':''));if(!file.startsWith(directory+'/')){res.writeHead(403).end();return}try{const data=await readFile(file),type={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'};res.writeHead(200,{'Content-Type':type[extname(file)]||'application/octet-stream'}).end(data)}catch{res.writeHead(404).end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{for(const width of [320,768])for(const direction of ['ltr','rtl']){
  const page=await browser.newPage({viewport:{width,height:900}}),origin=`http://127.0.0.1:${server.address().port}`;
  await page.goto(`${origin}/examples/home/`,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  const title=page.locator('h1').first();await page.evaluate(({direction,text})=>{document.documentElement.dir=direction;document.documentElement.lang=direction==='rtl'?'ar':'de';document.querySelector('h1').textContent=text;},{direction,text});
  assert.equal(await title.textContent(),text);const heading=await title.evaluate(node=>{const range=document.createRange();range.selectNodeContents(node);const ink=range.getBoundingClientRect();const clips=[];for(let ancestor=node;ancestor;ancestor=ancestor.parentElement){const style=getComputedStyle(ancestor),box=ancestor.getBoundingClientRect();if(['hidden','clip'].includes(style.overflowY)&&(ink.top<box.top-1||ink.bottom>box.bottom+1))clips.push(ancestor.tagName);}return {client:node.clientWidth,scroll:node.scrollWidth,verticalClips:clips,left:node.getBoundingClientRect().left,right:node.getBoundingClientRect().right,viewport:innerWidth,document:document.documentElement.scrollWidth};});
  assert.ok(heading.scroll<=heading.client+1&&heading.verticalClips.length===0,`${framework}/${family} ${width}px ${direction}: title clipped or unwrapped (${JSON.stringify(heading)})`);assert.ok(heading.document<=heading.viewport+1,`${framework}/${family} ${width}px ${direction}: title causes page overflow`);
  await page.goto(`${origin}/examples/contact/`,{waitUntil:'networkidle'});await page.evaluate(({direction,text})=>{document.documentElement.dir=direction;document.documentElement.lang=direction==='rtl'?'ar':'de';document.querySelector('input[name="name"]').labels[0].textContent=text;},{direction,text});
  const input=page.getByRole('textbox',{name:text,exact:true});assert.equal(await input.count(),1,`${framework}/${family}: label association lost`);
  const geometry=await page.locator('label:has(+ input[name="name"])').evaluate(node=>{const box=node.getBoundingClientRect();return {left:box.left,right:box.right,viewport:innerWidth,document:document.documentElement.scrollWidth}});
  assert.ok(geometry.left>=-1&&geometry.right<=geometry.viewport+1&&geometry.document<=geometry.viewport+1,`${framework}/${family} ${width}px ${direction}: label overflows (${JSON.stringify(geometry)})`);
  await page.close();
 }console.log(`${framework} ${family}: multilingual long titles and labels at 320/768px in LTR/RTL reflow passed`);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
}}finally{await browser.close();}
