// Clean-room adoption of the two locally packed React candidates. The consumer
// installs and builds outside the workbench; only this browser harness uses it.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdtempSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename, extname, join, resolve, sep} from 'node:path';
import {performance} from 'node:perf_hooks';
import {gzipSync} from 'node:zlib';
import {chromium, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const candidates = process.argv.slice(2).map(path=>resolve(path));
if (candidates.length !== 2 || candidates.some(path => !statSync(path).isFile())) throw Error('Pass the Martlet and Krigsvold package tarball paths.');
const sandbox = mkdtempSync(join(tmpdir(), 'nightjar-iii-react-adoption-'));
const browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const output = [];
const app = family => `import React, {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AppShell, Article, Button, DataTable, Field, Notice, TextInput} from '@${family}/react';
import '@${family}/react/styles.css';
import '@${family}/theme/fonts.css';
function App(){
 useEffect(()=>{performance.mark('react-client-mounted');performance.measure('react-client-mount','react-client-start','react-client-mounted')},[]);
 const [draft,setDraft]=useState(''),[applied,setApplied]=useState(''),[saved,setSaved]=useState(false);
 const rows=[{name:'Mara',status:'Active'},{name:'Pavel',status:'Pending'}].filter(row=>row.name.toLowerCase().includes(applied.toLowerCase()));
 return <div className="${family}" data-${family}="light"><AppShell brand="Field notes" navigation={<><a href="#story">Article</a> <a href="#directory">Directory</a></>} utilities={null} navigationLabel="Main navigation" navigationPlacement="top">
 <Article title="A local editorial example"><p id="story">A practical reading page using this family's published components.</p></Article>
 <section id="directory" aria-labelledby="directory-title"><h2 id="directory-title">People directory</h2>
 <form onSubmit={event=>{event.preventDefault();setApplied(draft);setSaved(true)}}><Field label="Find a person" hint="Search the two example names.">{props=><TextInput {...props} value={draft} onChange={event=>setDraft(event.target.value)}/>}</Field> <Button type="submit">Apply search</Button> <Button type="button" variant="secondary" onClick={()=>{setDraft('');setApplied('');setSaved(false)}}>Clear search</Button></form>
 {saved&&<Notice kind="success">Search applied to the local example.</Notice>}
 <DataTable caption="People"><thead><tr><th scope="col">Name</th><th scope="col">Status</th></tr></thead><tbody>{rows.map(row=><tr key={row.name}><th scope="row">{row.name}</th><td>{row.status}</td></tr>)}</tbody></DataTable>
 {rows.length===0&&<p>No matching people. Change the search to recover.</p>}</section>
 </AppShell></div>;
}
performance.mark('react-client-start');createRoot(document.getElementById('root')).render(<App/>);`;

try {
 for (let i=0;i<candidates.length;i++) {
  const family=['martlet','krigsvold'][i], cwd=join(sandbox,family); mkdirSync(cwd);
  writeFileSync(join(cwd,'package.json'),JSON.stringify({name:`nightjar-cleanroom-${family}`,version:'1.0.0',private:true,type:'module',scripts:{build:'vite build'}},null,2));
  writeFileSync(join(cwd,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Field notes</title></head><body><div id="root"><main data-adoption-fallback><h1>Field notes</h1><p>The interactive directory is unavailable. The local reading example remains available here.</p><article><h2>A local editorial example</h2><p>A practical reading page using this family's published components.</p></article><h2>People directory</h2><table><caption>People</caption><thead><tr><th scope="col">Name</th><th scope="col">Status</th></tr></thead><tbody><tr><th scope="row">Mara</th><td>Active</td></tr><tr><th scope="row">Pavel</th><td>Pending</td></tr></tbody></table></main></div><script type="module" src="/main.jsx"></script></body></html>`);
  writeFileSync(join(cwd,'main.jsx'),app(family));
  const installStart=performance.now();
  execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund','--save-exact','react@19.3.1','react-dom@19.3.1','vite@8.3.5',candidates[i]],{cwd,stdio:'pipe'});
  const installMs=Math.round(performance.now()-installStart);
  for(const base of ['/','/preview/']){
   const start=performance.now(); execFileSync('npm',['run','build','--','--base',base],{cwd,stdio:'pipe'});const buildMs=Math.round(performance.now()-start);
   const dist=join(cwd,'dist'),files=readdirSync(join(dist,'assets')).map(name=>join(dist,'assets',name));
   const metrics={};for(const type of ['.js','.css','.woff','.woff2']){const matching=files.filter(file=>extname(file)===type);metrics[type]={count:matching.length,bytes:matching.reduce((n,file)=>n+statSync(file).size,0),gzipBytes:matching.reduce((n,file)=>n+gzipSync(readFileSync(file)).length,0)};}
   const server=createServer((req,res)=>{const path=new URL(req.url,'http://localhost').pathname;if(!path.startsWith(base))return res.writeHead(404).end();const relative=decodeURIComponent(path.slice(base.length)),file=resolve(dist,relative||'index.html');if(file!==dist&&!file.startsWith(dist+sep))return res.writeHead(403).end();try{const content=readFileSync(file),type=extname(file),compressed=['.js','.css'].includes(type),body=compressed?gzipSync(content):content;res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2'})[type]||'application/octet-stream','Content-Length':body.length,...(compressed?{'Content-Encoding':'gzip'}:{})}).end(body)}catch{res.writeHead(404).end()}});
   await new Promise(done=>server.listen(0,'127.0.0.1',done));
   try{
    const url=`http://127.0.0.1:${server.address().port}${base}`, context=await browser.newContext({viewport:{width:320,height:900}}), page=await context.newPage(), failures=[],transfers=[];
    page.on('response',response=>{const type=extname(new URL(response.url()).pathname),length=Number(response.headers()['content-length']);if(response.status()===200&&['.js','.css','.woff','.woff2'].includes(type)&&Number.isFinite(length))transfers.push({type,bytes:length})});page.on('pageerror',error=>failures.push(error.message));await page.goto(url,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await expect(page.getByRole('heading',{name:'A local editorial example'})).toBeVisible();await expect(page.getByRole('navigation',{name:'Main navigation'})).toBeVisible();
    const field=page.getByLabel('Find a person');await field.focus();await page.keyboard.type('mArA');await page.keyboard.press('Enter');await expect(page.getByRole('status')).toContainText('Search applied');await expect(page.getByRole('rowheader',{name:'Mara'})).toBeVisible();assert.equal(await page.getByRole('rowheader',{name:'Pavel'}).count(),0);await field.fill('Nobody');await page.getByRole('button',{name:'Apply search'}).click();await expect(page.getByText('No matching people. Change the search to recover.')).toBeVisible();assert.deepEqual((await new AxeBuilder({page}).analyze()).violations.map(v=>v.id),[]);const clear=page.getByRole('button',{name:'Clear search'});await clear.focus();await page.keyboard.press('Enter');await expect(clear).toBeFocused();await expect(field).toHaveValue('');await expect(page.getByRole('rowheader',{name:'Mara'})).toBeVisible();await expect(page.getByRole('rowheader',{name:'Pavel'})).toBeVisible();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'320px page must reflow');assert.deepEqual((await new AxeBuilder({page}).analyze()).violations.map(v=>v.id),[]);assert.deepEqual(failures,[]);const clientMountMs=await page.evaluate(()=>performance.getEntriesByName('react-client-mount')[0]?.duration);assert.equal(typeof clientMountMs,'number','client mount measure exists');await context.close();
    for(const mode of ['nojs','blocked']){const fallback=await browser.newContext({javaScriptEnabled:mode!=='nojs'}),staticPage=await fallback.newPage();if(mode==='blocked')await staticPage.route('**/*',route=>route.request().resourceType()==='script'?route.abort():route.continue());await staticPage.goto(url,{waitUntil:'networkidle'});await expect(staticPage.getByRole('heading',{name:'Field notes'})).toBeVisible();await expect(staticPage.locator('[data-adoption-fallback] > p')).toContainText('The interactive directory is unavailable.');await expect(staticPage.locator('[data-adoption-fallback]')).toBeVisible();await expect(staticPage.getByRole('heading',{name:'A local editorial example'})).toBeVisible();await expect(staticPage.getByRole('rowheader',{name:'Mara'})).toBeVisible();await expect(staticPage.getByRole('rowheader',{name:'Pavel'})).toBeVisible();await fallback.close();}
    output.push({family,base,installMs,buildMs,clientMountMs,builtAssets:metrics,transferred:transfers.reduce((sum,item)=>({...sum,[item.type]:(sum[item.type]||0)+item.bytes}),{}),checks:'navigation, editorial render, keyboard submit, scoped results, empty recovery, 320px reflow, axe and host-provided no-JS/blocked fallback passed'});console.log(`${family} ${base}: adoption checks passed`);
   }finally{server.closeAllConnections();await new Promise(done=>server.close(done));}
  }
 }
}finally{await browser.close();}
writeFileSync(join(sandbox,'results.json'),JSON.stringify({sandbox,results:output},null,2)+'\n');console.log(JSON.stringify({sandbox,results:output},null,2));
