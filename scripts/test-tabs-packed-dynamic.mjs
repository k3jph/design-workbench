// Exercise dynamic availability through the actual package archives, not workspace aliases.
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {extname,resolve} from 'node:path';
import {build} from 'vite';
import {chromium,firefox,webkit} from 'playwright';
import {expect} from '@playwright/test';

const root=process.cwd(),engine=process.env.WORKBENCH_BROWSER||'chromium';
assert.ok(['chromium','firefox','webkit'].includes(engine));
const families=process.env.NIGHTJAR_TEST_FAMILY?[process.env.NIGHTJAR_TEST_FAMILY]:['martlet','krigsvold'];
assert.ok(families.every(family=>['martlet','krigsvold'].includes(family)));
const browser=await ({chromium,firefox,webkit})[engine].launch(engine==='chromium'&&process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{headless:true});
try { for(const family of families) {
 const temp=await mkdtemp(resolve(root,'tests/.packed-tabs-'));let server;
 try {
  await writeFile(resolve(temp,'package.json'),JSON.stringify({name:'packed-tabs-consumer',private:true,type:'module'}));
  const supplied=process.env.NIGHTJAR_REACT_ARCHIVE_DIR;
  const archive=supplied?resolve(supplied,`${family}-react-0.1.0.tgz`):resolve(temp,JSON.parse(execFileSync('npm',['pack','--json','--workspace',`@${family}/react`,'--pack-destination',temp],{cwd:root,encoding:'utf8'}))[0].filename);
  const coreVersion=family==='martlet'?'2.2.2':'2.2.3';
  const core=resolve(root,`fixtures/core-candidates/${family}-core-${coreVersion}.tgz`);
  const expected=family==='martlet'?'e1fde61cdc818dbdc5b91eb77041111f5651316a63fc9dd3ab5d4dac9536011c':'c74177f9b344b7e517b138b5d0afa9ec0b6b78c1bfdf66f6ffe0570c60b26c66';
  assert.equal(createHash('sha256').update(await readFile(core)).digest('hex'),expected,'exact corrected core archive');
  execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund','--package-lock=false','react@19.3.1','react-dom@19.3.1',core,archive],{cwd:temp,stdio:'pipe'});
  await writeFile(resolve(temp,'index.html'),'<html lang="en"><head><meta charset="utf-8"><title>Dynamic tabs</title></head><body><div id="root"></div><script type="module" src="/main.jsx"></script></body></html>');
  await writeFile(resolve(temp,'main.jsx'),`import React,{useState} from 'react';import{createRoot}from'react-dom/client';import{Tabs}from'@${family}/react';function App(){const[mode,setMode]=useState('normal');window.setMode=setMode;return <main><button id="outside">Outside</button><Tabs label="Views" value="alpha" onValueChange={()=>{}} items={[{id:'alpha',label:'Alpha',content:'Alpha content',disabled:mode==='disable-alpha'},...(mode==='remove'?[]:[{id:'beta',label:'Beta',content:'Beta content',disabled:mode==='disable'}]),{id:'gamma',label:'Gamma',content:'Gamma content'}]}/></main>}createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);`);
  await build({root:temp,configFile:false,logLevel:'warn',build:{outDir:'dist',emptyOutDir:true}});
  const dir=resolve(temp,'dist');server=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname,file=resolve(dir,path.slice(1)+(path.endsWith('/')?'index.html':''));if(!file.startsWith(dir+'/')){res.writeHead(403).end();return}try{const data=await readFile(file),types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(data)}catch{res.writeHead(404).end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const alpha=page.getByRole('tab',{name:'Alpha'}),beta=page.getByRole('tab',{name:'Beta'}),outside=page.locator('#outside');
  await beta.focus();await page.evaluate(()=>window.setMode('disable'));await expect(beta).toBeDisabled();await expect(alpha,`${family}: disabling the focused tab should preserve keyboard location`).toBeFocused();
  await page.evaluate(()=>window.setMode('normal'));await beta.focus();await page.evaluate(()=>window.setMode('remove'));await expect(beta).toHaveCount(0);await expect(alpha,`${family}: removing the focused tab should preserve keyboard location`).toBeFocused();
  await page.evaluate(()=>window.setMode('normal'));await alpha.focus();await page.evaluate(()=>window.setMode('disable-alpha'));await expect(beta,`${family}: disabling the selected tab focuses the fallback selection`).toBeFocused();await expect(beta).toHaveAttribute('aria-selected','true');
  await page.evaluate(()=>window.setMode('normal'));await outside.focus();await page.evaluate(()=>window.setMode('disable'));await expect(outside,`${family}: updates must not steal focus from another control`).toBeFocused();
  await page.evaluate(()=>window.setMode('normal'));await beta.focus();await beta.evaluate(node=>node.blur());await page.evaluate(()=>window.setMode('remove'));assert.equal(await page.evaluate(()=>document.activeElement===document.body),true,`${family}: a tab blurred before an update must not reclaim focus`);
  await page.close();console.log(`${family}: packed dynamic tab focus recovery passed`);
 } finally {if(server){server.closeAllConnections();await new Promise(r=>server.close(r))}await rm(temp,{recursive:true,force:true})}
} } finally {await browser.close()}
