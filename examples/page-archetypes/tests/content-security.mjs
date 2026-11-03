// Exercise schema-valid hostile catalog content in disposable paired builds.
import assert from 'node:assert/strict';
import {cpSync,mkdtempSync,readFileSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join,basename,extname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {chromium} from '@playwright/test';
import {Validator} from '@cfworker/json-schema';
const root=process.cwd(),temp=mkdtempSync(join(tmpdir(),'nightjar-content-security-'));
const fixture=JSON.parse(readFileSync('examples/page-archetypes/content/catalog.json','utf8'));
const title='Hostile <img src=x onerror="window.__nightjarInjected=1"> & title';
const home=fixture.pages.find(page=>page.id==='home'),section=home.sections[0];
section.title=title;section.body='Normal **bold** and [valid](https://example.org/).\n\n<img src=x onerror="window.__nightjarInjected=1">\n\n<script>window.__nightjarInjected=1</script>\n\n[unsafe](javascript:alert(1)) [encoded](java&#x73;cript:alert(1))\n\n![bad](javascript:alert(1)) <a href="java&#x73;cript:alert(1)" onclick="window.__nightjarInjected=1">raw</a> <svg onload="window.__nightjarInjected=1"></svg>';
section.body+='\n\n[local](/examples/about/?q=x&view=y#details) [already](/preview/examples/about/) [base query](/preview?q=1) [near base](/previewing/path) [relative](../about/) [fragment](#details) [protocol-relative](//example.org/path) ![local image](/assets/examples/coast.svg) ![already image](/preview/assets/examples/coast.svg)';
section.actions[0].url='/examples/about/?q=x&view=y';
const stress=fixture.pages.find(page=>page.id==='stress-test').sections.find(section=>section.id==='code');
stress.body+='\n\n<img src=x onerror="window.__nightjarInjected=1"><script>window.__nightjarInjected=1</script> [bad](javascript:alert(1))';
const schema=JSON.parse(readFileSync('examples/page-archetypes/contracts/catalog.schema.json','utf8'));
const validation=new Validator(schema,'2020-12',true).validate(fixture);assert.ok(validation.valid,JSON.stringify(validation.errors));
const skip=new Set(['node_modules','dist','_site','.astro','.jekyll-cache','test-results']);
function run(command,args,cwd,extra={}){const child=spawnSync(command,args,{cwd,env:{...process.env,...extra},encoding:'utf8'});assert.equal(child.status,0,`${command} ${args.join(' ')} failed: ${child.stderr}\n${child.stdout}`)}
let browser;
try {
 cpSync(join(root,'examples'),join(temp,'examples'),{recursive:true,filter:path=>!skip.has(basename(path))&&!basename(path).endsWith('-dist')});
 cpSync(join(root,'packages'),join(temp,'packages'),{recursive:true,filter:path=>!skip.has(basename(path))});cpSync(join(root,'package.json'),join(temp,'package.json'));
 symlinkSync(resolve(root,'node_modules'),join(temp,'node_modules'),'dir');symlinkSync(resolve(root,'examples/astro-slice/node_modules'),join(temp,'examples/astro-slice/node_modules'),'dir');
 for(const path of ['examples/page-archetypes/content/catalog.json','examples/jekyll/martlet/_data/examples.json','examples/jekyll/krigsvold/_data/examples.json'])writeFileSync(join(temp,path),JSON.stringify(fixture));
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 for(const family of ['martlet','krigsvold'])for(const framework of ['jekyll','astro','react'])for(const base of ['/','/preview/']) {
  const site=join(temp,'examples/jekyll',family),dist=join(temp,'security-dist',framework,family);
  if(framework==='jekyll')run('bundle',['exec','jekyll','build','--baseurl',base==='/'?'':'/preview','--destination',dist],site);
  if(framework==='astro')run('npm',['run','build'],join(temp,'examples/astro-slice'),{NIGHTJAR_FAMILY:family,NIGHTJAR_BASE:base,ASTRO_TELEMETRY_DISABLED:'1'});
  if(framework==='react')run(process.execPath,['examples/react-catalog/build.mjs'],temp,{NIGHTJAR_FAMILY:family,NIGHTJAR_BASE:base});
  const built=framework==='jekyll'?dist:join(temp,'examples',framework==='astro'?'astro-slice':'react-catalog','dist',family);
  const server=createServer((req,res)=>{const path=new URL(req.url,'http://localhost').pathname;if(!path.startsWith(base)){res.writeHead(404).end();return;}const file=resolve(built,decodeURIComponent(path.slice(base.length)),path.endsWith('/')?'index.html':'');if(!file.startsWith(built+'/')){res.writeHead(403).end();return;}try{const data=readFileSync(file),types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff'};res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(data)}catch{res.writeHead(404).end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try {for(const javascriptEnabled of [true,false]) {const context=await browser.newContext({javascriptEnabled}),page=await context.newPage();
   for(const route of ['home','stress-test']) {await page.goto(`http://127.0.0.1:${server.address().port}${base}examples/${route}/`,{waitUntil:'networkidle'});assert.equal(await page.evaluate(()=>window.__nightjarInjected),undefined);assert.equal(await page.locator('main script, main [onerror], main [onclick], main [onload]').count(),0);assert.equal(await page.locator('main a,main img').evaluateAll(nodes=>nodes.filter(node=>['href','src'].some(attr=>(node.getAttribute(attr)||'').toLowerCase().replace(/[\u0000-\u0020]/g,'').startsWith('javascript:'))).length),0);
    if(route==='home'){assert.equal(await page.getByRole('heading',{name:title,exact:true}).count(),1);assert.equal(await page.locator('main strong').filter({hasText:'bold'}).count(),1);assert.equal(await page.getByRole('link',{name:'valid',exact:true}).getAttribute('href'),'https://example.org/');const prefix=base==='/'?'':base.slice(0,-1);for(const [name,target] of [['local',`${prefix}/examples/about/?q=x&view=y#details`],['already','/preview/examples/about/'],['base query','/preview?q=1'],['near base',`${prefix}/previewing/path`],['relative','../about/'],['fragment','#details'],['protocol-relative','//example.org/path']])assert.equal(await page.getByRole('link',{name,exact:true}).getAttribute('href'),target,`${framework}/${family}/${base}: ${name}`);for(const [name,target] of [['local image',`${prefix}/assets/examples/coast.svg`],['already image','/preview/assets/examples/coast.svg']])assert.equal(await page.getByAltText(name,{exact:true}).getAttribute('src'),target,`${framework}/${family}/${base}: ${name}`);assert.equal(await page.locator(`main a[href="${base}examples/about/?q=x&view=y"]`).count(),1)}
    else {assert.equal(await page.locator('main math').count(),1);assert.equal(await page.locator('main math msup').count(),1)}
   }await context.close();}console.log(`${family} ${framework} ${base}: schema-valid hostile titles, markup and URLs safely rendered with and without JavaScript`);
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r))}
 }
 // With local Jekyll plugins disabled, escaped rendered markup remains non-executable.
 for(const family of ['martlet','krigsvold']){const site=join(temp,'examples/jekyll',family),dist=join(temp,'safe-dist',family);run('bundle',['exec','jekyll','build','--safe','--destination',dist],site);const html=readFileSync(join(dist,'examples/home/index.html'),'utf8');assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img src="?x"? onerror=/);assert.doesNotMatch(html,/<a href="javascript:/i);console.log(`${family} Jekyll --safe: escaped fallback remains inert`)}
}finally{if(browser)await browser.close();rmSync(temp,{recursive:true,force:true})}
