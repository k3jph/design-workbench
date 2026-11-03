// Test actual supplied family archives through a separate browser consumer.
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {extname,resolve} from 'node:path';
import {build} from 'vite';
import {chromium,firefox,webkit} from 'playwright';
import {expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {installPackedConsumer} from './install-packed-consumer.mjs';

if(!process.env.NIGHTJAR_REACT_ARCHIVE_DIR)throw Error('NIGHTJAR_REACT_ARCHIVE_DIR is required');
const engine=process.env.WORKBENCH_BROWSER||'chromium';
assert.ok(['chromium','firefox','webkit'].includes(engine));
const browser=await ({chromium,firefox,webkit})[engine].launch(engine==='chromium'&&process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{headless:true});
try{
 for(const family of ['martlet','krigsvold']){
  const temp=await mkdtemp(resolve(process.cwd(),'tests/.packed-shell-'));let server;
  try{
   installPackedConsumer(temp,family);
   await writeFile(resolve(temp,'index.html'),'<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Package consumer</title></head><body><div id="root"></div><script type="module" src="/main.jsx"></script></body></html>');
   await writeFile(resolve(temp,'main.jsx'),`import React,{useState} from 'react';import{createRoot}from'react-dom/client';import{AppShell,DataTable}from'@${family}/react';import '@${family}/react/styles.css';function App(){const[count,setCount]=useState(0);return <AppShell brand="Observatory" navigation={<a href="#summary">Summary</a>} utilities={<span>Local example</span>}><h1 id="summary">Observations</h1><DataTable caption="Recent observations"><thead><tr><th scope="col">Name</th><th scope="col">Value</th></tr></thead><tbody><tr><th scope="row">A very long representative observation description</th><td>28</td></tr></tbody></DataTable><button onClick={()=>setCount(count+1)}>Review observation</button><p role="status">Reviewed {count}</p></AppShell>}createRoot(document.getElementById('root')).render(<App/>);`);
   await build({root:temp,configFile:false,logLevel:'warn',build:{outDir:'dist',emptyOutDir:true}});
   const dist=resolve(temp,'dist');server=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname,file=resolve(dist,path.slice(1)+(path.endsWith('/')?'index.html':''));if(!file.startsWith(dist+'/')){res.writeHead(403).end();return}try{const data=await readFile(file),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2'};res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(data)}catch{res.writeHead(404).end()}});
   await new Promise(r=>server.listen(0,'127.0.0.1',r));
   const context=await browser.newContext({viewport:{width:320,height:850}}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto(`http://127.0.0.1:${server.address().port}/`);await expect(page.getByRole('heading',{name:'Observations'})).toBeVisible();
   const table=page.getByRole('table',{name:'Recent observations'}),region=page.getByRole('region',{name:'Recent observations'});
   await expect(table.getByRole('columnheader',{name:'Name'})).toBeVisible();await expect(table.getByRole('rowheader',{name:'A very long representative observation description'})).toBeVisible();
   await region.focus();await expect(region).toBeFocused();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${family}: table containment at 320px`);
   await page.getByRole('button',{name:'Review observation'}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('status')).toHaveText('Reviewed 1');
   await page.getByRole('link',{name:'Skip to content'}).focus();await page.keyboard.press('Enter');await expect(page.locator('main#main')).toBeFocused();
   assert.deepEqual((await new AxeBuilder({page}).analyze()).violations.map(v=>v.id),[]);assert.deepEqual(errors,[]);
   await context.close();console.log(`${family}: packed AppShell, skip link, DataTable, narrow containment and keyboard action passed`);
  }finally{if(server){server.closeAllConnections();await new Promise(r=>server.close(r))}await rm(temp,{recursive:true,force:true})}
 }
}finally{await browser.close()}
