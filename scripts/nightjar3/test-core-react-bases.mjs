// Build and interact with local React/core archives in a disposable consumer.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {extname,join,resolve,sep} from 'node:path';
import {build} from 'vite';
import {chromium,firefox,webkit} from 'playwright';
const dir=process.env.NIGHTJAR_CORE_ARCHIVE_DIR,reactDir=process.env.NIGHTJAR_REACT_ARCHIVE_DIR;
assert.ok(dir&&reactDir,'Supply local core and React archive directories');
const lane=process.env.NIGHTJAR_REACT_LANE||'core';assert.ok(['theme','core'].includes(lane));
const engine=process.env.WORKBENCH_BROWSER||'chromium';assert.ok(['chromium','firefox','webkit'].includes(engine));
const browser=await ({chromium,firefox,webkit})[engine].launch(engine==='chromium'&&process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{headless:true});
try{for(const family of ['martlet','krigsvold']){
 const temp=await mkdtemp(join(tmpdir(),`nightjar-react-${family}-`));
 try{
  await writeFile(join(temp,'package.json'),JSON.stringify({name:`consumer-${family}`,private:true,type:'module'}));
  const version=lane==='theme'?'2.1.0':family==='martlet'?'2.2.2':'2.2.3',reactVersion=lane==='theme'?'0.1.0':'0.2.0';
  execFileSync('npm',['install','--offline','--ignore-scripts','--no-audit','--no-fund','--package-lock=false','react@19.3.1','react-dom@19.3.1',resolve(dir,`${family}-${lane}-${version}.tgz`),resolve(reactDir,`${family}-react-${reactVersion}.tgz`)],{cwd:temp,stdio:'pipe'});
  const other=lane==='theme'?'core':'theme';assert.equal(existsSync(join(temp,'node_modules',`@${family}`,other)),false,`${family}: ${lane} lane unexpectedly installed ${other}`);
  await writeFile(join(temp,'index.html'),'<html lang="en"><head><meta charset="utf-8"><title>Core consumer</title></head><body><div id="root"></div><script type="module" src="/main.jsx"></script></body></html>');
  await writeFile(join(temp,'main.jsx'),`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {Button} from '@${family}/react';import '@${family}/react/styles.css';import '@${family}/${lane}/fonts.css';function App(){const[n,setN]=useState(0);return <main className="${family}" data-${family}="light"><h1>Core consumer</h1><Button onClick={()=>setN(n+1)}>Count {n}</Button></main>}createRoot(document.getElementById('root')).render(<App/>);`);
  for(const base of ['/','/preview/']){
   const out=join(temp,base==='/'?'dist-root':'dist-preview');await build({root:temp,base,configFile:false,logLevel:'silent',build:{outDir:out,emptyOutDir:true}});
   const html=await readFile(join(out,'index.html'),'utf8');assert.ok(html.includes(base+'assets/'),`${family}: ${base} asset base`);
   const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith(base))return res.writeHead(404).end();const path=resolve(out,decodeURIComponent(url.pathname.slice(base.length))+(url.pathname.endsWith('/')?'index.html':''));if(!path.startsWith(out+sep))return res.writeHead(403).end();const data=await readFile(path),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2'};res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'}).end(data);}catch{res.writeHead(404).end();}});
   await new Promise(done=>server.listen(0,'127.0.0.1',done));const context=await browser.newContext(),page=await context.newPage();
   try{await page.goto(`http://127.0.0.1:${server.address().port}${base}`);await page.getByRole('heading',{name:'Core consumer'}).waitFor();await page.getByRole('button',{name:'Count 0'}).click();await page.getByRole('button',{name:'Count 1'}).waitFor();}finally{await context.close();server.closeAllConnections();await new Promise(done=>server.close(done));}
   console.log(`${family} React/${lane}: ${base} build, local CSS/fonts and button interaction passed`);
  }
 }finally{await rm(temp,{recursive:true,force:true});}
}}finally{await browser.close();}
