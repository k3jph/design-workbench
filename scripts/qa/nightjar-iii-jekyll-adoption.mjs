// Exercise independently built, git-free Jekyll consumer copies. Arguments are
// Martlet root/preview output, then Krigsvold root/preview output directories.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {extname,resolve,sep} from 'node:path';
import {gzipSync} from 'node:zlib';
import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const dirs=process.argv.slice(2).map(value=>resolve(value));
if(dirs.length!==4)throw Error('Pass Martlet root/preview, then Krigsvold root/preview output paths.');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})}),results=[];
try{for(let i=0;i<dirs.length;i++){
 const family=i<2?'martlet':'krigsvold',base=i%2?'/preview/':'/',dist=dirs[i];
 const server=createServer((req,res)=>{const path=new URL(req.url,'http://localhost').pathname;if(!path.startsWith(base))return res.writeHead(404).end();const relative=decodeURIComponent(path.slice(base.length)),file=resolve(dist,relative,relative.endsWith('/')||!relative?'index.html':'');if(file!==dist&&!file.startsWith(dist+sep))return res.writeHead(403).end();try{const data=readFileSync(file),type=extname(file),compressed=['.js','.mjs','.css','.html'].includes(type),body=compressed?gzipSync(data):data;res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2'})[type]||'application/octet-stream','Content-Length':body.length,...(compressed?{'Content-Encoding':'gzip'}:{})}).end(body)}catch{res.writeHead(404).end()}});
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 try{const url=`http://127.0.0.1:${server.address().port}${base}`,context=await browser.newContext({viewport:{width:320,height:900}}),page=await context.newPage(),transfers=[],errors=[];
  page.on('response',response=>{const type=extname(new URL(response.url()).pathname),length=Number(response.headers()['content-length']);if(response.status()===200&&['.js','.css','.woff','.woff2'].includes(type)&&Number.isFinite(length))transfers.push({type,bytes:length})});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${url}journal/clean-room/`,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await expect(page.getByRole('heading',{name:'Clean room reading'})).toBeVisible();await expect(page.getByText('A local editorial page built using the documented post layout.')).toBeVisible();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual((await new AxeBuilder({page}).analyze()).violations.map(v=>v.id),[]);
  const articleTransfers=transfers.reduce((sum,item)=>({...sum,[item.type]:(sum[item.type]||0)+item.bytes}),{});
  await page.goto(`${url}examples/contact/`,{waitUntil:'networkidle'});const form=page.locator('form[data-demo-form=contact]');await form.getByLabel('Name',{exact:true}).fill('Example Person');await form.getByLabel('Email address').fill('person@example.test');await form.getByLabel('Message').fill('Local example message');await form.getByLabel('Message').press('Enter');await form.getByRole('button',{name:'Validate example'}).focus();await page.keyboard.press('Enter');await expect(form.getByRole('status')).toContainText('validated locally');
  await page.goto(`${url}examples/dashboard-administration/`,{waitUntil:'networkidle'});const search=page.getByLabel('Search people');await search.fill('Amara');await search.press('Enter');await expect(page.locator('#people-table tbody')).toContainText('Amara');assert.equal(await page.locator('#people-table tbody tr').count(),1);const dashboardAxe=(await new AxeBuilder({page}).analyze()).violations;if(dashboardAxe.length)console.error(JSON.stringify({family,base,route:'dashboard-administration',violations:dashboardAxe.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,html:n.html}))}))}));assert.deepEqual(dashboardAxe.map(v=>v.id),[]);assert.deepEqual(errors,[]);await context.close();
  const nojs=await browser.newContext({javaScriptEnabled:false}),p=await nojs.newPage();await p.goto(`${url}examples/contact/`);await expect(p.locator('form[data-demo-form=contact] input[name=name]')).toBeDisabled();await expect(p.locator('[data-form-fallback]')).toBeVisible();await p.goto(`${url}examples/dashboard-administration/`);await expect(p.locator('[data-dashboard-fallback]')).toBeVisible();assert.ok(await p.locator('#people-table tbody tr').count()>0,'static directory remains readable');await nojs.close();
  results.push({family,base,articleTransfers,checks:'authored post, form keyboard submit, sample directory filter, no-JS safe fallback, 320px reflow and axe passed'});console.log(`${family} ${base}: adoption checks passed`);
 }finally{server.closeAllConnections();await new Promise(done=>server.close(done));}
}}finally{await browser.close()}
console.log(JSON.stringify({results},null,2));
