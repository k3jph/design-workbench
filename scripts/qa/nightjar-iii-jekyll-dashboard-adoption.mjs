// Exercise exactly the documented consumer snippets against separately pinned local snapshots.
import assert from 'node:assert/strict';
import {cpSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {basename, extname, join, resolve, sep} from 'node:path';
import {spawnSync} from 'node:child_process';
import {chromium, firefox, webkit} from 'playwright';
import {expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const parent=process.env.NIGHTJAR_JEKYLL_CANDIDATES;
const pins={martlet:process.env.NIGHTJAR_MARTLET_COMMIT,krigsvold:process.env.NIGHTJAR_KRIGSVOLD_COMMIT};
assert.ok(parent&&Object.values(pins).every(value=>/^[0-9a-f]{40}$/.test(value||'')),'Specify the candidate directory and both exact 40-character local commit IDs');
const engineName=process.env.NIGHTJAR_BROWSER||'chromium',engine={chromium,firefox,webkit}[engineName];
assert.ok(engine,`Unknown browser ${engineName}`);
function snippet(docs,name,language){
  const start=`<!-- nightjar-directory-${name}:start -->`,end=`<!-- nightjar-directory-${name}:end -->`;
  assert.equal(docs.split(start).length,2,`one ${name} snippet`);assert.equal(docs.split(end).length,2,`one ${name} end`);
  const body=docs.split(start)[1].split(end)[0].trim(),prefix='```'+language+'\n',suffix='\n```';
  assert.ok(body.startsWith(prefix)&&body.endsWith(suffix),`complete ${name} fence`);
  return body.slice(prefix.length,-suffix.length)+'\n';
}
function command(command,args,cwd,extra={}){
  const result=spawnSync(command,args,{cwd,env:{...process.env,...extra},encoding:'utf8'});
  assert.equal(result.status,0,`${command} ${args.join(' ')} failed: ${result.stderr}\n${result.stdout}`);
  return result.stdout;
}
const tmp=mkdtempSync(join(tmpdir(),'nightjar-jekyll-adoption-'));
let browser;
try {
  browser=await engine.launch({headless:true,...(engineName==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  for(const family of Object.keys(pins)){
    const origin=resolve(parent,`jekyll-${family}`),head=command('git',['rev-parse','HEAD'],origin).trim();
    assert.equal(head,pins[family],`${family}: explicit local snapshot pin`);
    assert.equal(command('git',['status','--porcelain','--untracked-files=all'],origin).trim(),'',`${family}: snapshot clean`);
    const docs=readFileSync(join(origin,'docs/archetypes/DASHBOARDS.md'),'utf8');
    const data=snippet(docs,'data','json'),pageSource=snippet(docs,'page','liquid'),script=snippet(docs,'script','javascript');
    assert.deepEqual(JSON.parse(data),{title:'People',headers:['Name','Status'],rows:[['Mara','Active'],['Pavel','Pending']]});
    assert.ok(!/\bstyle\s*=|<style\b/i.test(pageSource),'consumer sample adds no local CSS');
    const files=command('git',['ls-files','-z'],origin).split('\0').filter(Boolean),source=join(tmp,family,'source');
    for(const entry of files){
      const from=resolve(origin,entry),to=resolve(source,entry);
      assert.ok(from.startsWith(origin+sep)&&to.startsWith(source+sep)&&!lstatSync(from).isSymbolicLink()&&lstatSync(from).isFile(),`${family}: safe regular file ${entry}`);
      mkdirSync(resolve(to,'..'),{recursive:true});cpSync(from,to);
    }
    writeFileSync(join(source,'_data/adoption_people.json'),data);
    writeFileSync(join(source,'adoption-directory.html'),pageSource);
    writeFileSync(join(source,'assets/js/adoption-directory.js'),script);
    const manifestPath=join(source,'nightjar/source-files.json'),manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
    const additions=['_data/adoption_people.json','adoption-directory.html','assets/js/adoption-directory.js'];
    assert.ok(additions.every(entry=>!manifest.includes(entry)),'consumer additions are new and explicit');
    writeFileSync(manifestPath,JSON.stringify([...manifest,...additions].sort(),null,2)+'\n');
    for(const base of ['/','/preview/']){
      const destination=join(tmp,family,base==='/'?'root':'preview');
      command('python3',['nightjar/build.py','--destination',destination,'--baseurl',base==='/'?'':'/preview'],source);
      const checkArchive='import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert z.read("docs/archetypes/DASHBOARDS.md")==open(sys.argv[2],"rb").read(); assert all(x in z.namelist() for x in ("_data/adoption_people.json","adoption-directory.html","assets/js/adoption-directory.js"))';
      command('python3',['-c',checkArchive,join(destination,'template.zip'),join(origin,'docs/archetypes/DASHBOARDS.md')],source);
      const server=createServer((req,res)=>{
        const path=new URL(req.url,'http://localhost').pathname;
        if(!path.startsWith(base)){res.writeHead(404).end();return;}
        const file=resolve(destination,decodeURIComponent(path.slice(base.length)),path.endsWith('/')?'index.html':'');
        if(!file.startsWith(destination+sep)){res.writeHead(403).end();return;}
        try{const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.woff2':'font/woff2'};res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(readFileSync(file))}catch{res.writeHead(404).end()}
      });
      await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
      try{
        for(const mode of ['ready','nojs','blocked','partial']){
          const context=await browser.newContext({javaScriptEnabled:mode!=='nojs',viewport:{width:320,height:900}}),page=await context.newPage(),errors=[],external=[];
          page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(!request.url().startsWith(`http://127.0.0.1:${server.address().port}/`))external.push(request.url())});
          if(mode==='blocked')await page.route('**/assets/js/adoption-directory.js',route=>route.abort());
          if(mode==='partial')await page.addInitScript(()=>{const original=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(type,listener,options){if(type==='click'&&this instanceof HTMLElement&&this.hasAttribute('data-directory-clear'))throw Error('synthetic listener failure');return original.call(this,type,listener,options)}});
          await page.goto(`http://127.0.0.1:${server.address().port}${base}adoption-directory/`,{waitUntil:'networkidle'});
          const field=page.getByLabel('Find a person'),apply=page.getByRole('button',{name:'Apply search'}),clear=page.getByRole('button',{name:'Clear search'}),status=page.locator('[data-directory-status]'),fallback=page.locator('[data-directory-fallback]');
          await expect(page.getByRole('heading',{name:'People directory',level:1})).toBeVisible();await expect(page.getByRole('table',{name:'People'})).toBeVisible();
          await expect(page.getByRole('rowheader',{name:'Mara'})).toBeVisible();await expect(page.getByRole('rowheader',{name:'Pavel'})).toBeVisible();
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${family}/${base}/${mode}: narrow viewport reflows`);
          if(mode==='ready'){
            await expect(fallback).toBeHidden();await expect(field).toHaveAccessibleDescription('Search the two example names.');
            await field.focus();await page.keyboard.type('mArA');await expect(page.getByRole('rowheader',{name:'Pavel'})).toBeVisible();await page.keyboard.press('Enter');
            await expect(status).toHaveText('Search applied to the local example.');await expect(page.getByRole('rowheader',{name:'Mara'})).toBeVisible();await expect(page.getByRole('rowheader',{name:'Pavel',includeHidden:true})).toBeHidden();
            await field.fill('Nobody');await apply.click();await expect(page.getByText('No matching people. Change the search to recover.')).toBeVisible();await clear.focus();await page.keyboard.press('Enter');
            await expect(field).toHaveValue('');await expect(clear).toBeFocused();await expect(status).toBeEmpty();await expect(page.getByRole('rowheader',{name:'Mara'})).toBeVisible();await expect(page.getByRole('rowheader',{name:'Pavel'})).toBeVisible();
            assert.deepEqual((await new AxeBuilder({page}).analyze()).violations.map(v=>v.id),[],`${family}/${base}: ready axe`);
            await page.setViewportSize({width:1440,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${family}/${base}: wide viewport reflows`);
            assert.deepEqual(errors,[]);
          }else{
            await expect(field).toBeDisabled();await expect(apply).toBeDisabled();await expect(clear).toBeDisabled();await expect(fallback).toBeVisible();
            // Axe needs script execution; audit blocked/partial states and inspect
            // the native Chromium accessibility tree for the true no-JS state.
            if(mode!=='nojs')assert.deepEqual((await new AxeBuilder({page}).analyze()).violations.map(v=>v.id),[],`${family}/${base}/${mode}: static fallback axe`);
            else if(engineName==='chromium'){
              const cdp=await context.newCDPSession(page),tree=await cdp.send('Accessibility.getFullAXTree');
              const names=tree.nodes.map(node=>node.name?.value).filter(Boolean);
              assert.ok(names.includes('Mara')&&names.includes('Pavel')&&names.includes('The interactive directory is unavailable. Both example records remain visible.'),`${family}/${base}: no-JS accessibility tree includes records and fallback`);
              await cdp.detach();
            }
            if(mode==='partial')assert.ok(errors.some(error=>error.includes('synthetic listener failure')),'partial initialization failure injected');else assert.deepEqual(errors,[]);
          }
          assert.deepEqual(external,[],`${family}/${base}/${mode}: no external requests`);await context.close();
        }
        console.log(`${family} ${base}: documented table, search, clear, focus, reflow, ready/blocked/partial axe and no-JS fallback passed${engineName==='chromium'?' (no-JS accessibility tree sampled)':''}`);
      }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
    }
  }
}finally{if(browser)await browser.close();rmSync(tmp,{recursive:true,force:true})}
