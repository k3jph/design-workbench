import { chromium } from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const OUT='visual-audit-output';
const SITES=[
 {id:'martlet',base:'https://develop-martletdesign-jekyll-reference.k3jph.workers.dev',repo:'martletdesign/jekyll',sha:'154a853cc3c170d121b5a4e794ad4de7918a3bbb'},
 {id:'krigsvold',base:'https://develop-krigsvolddesign-jekyll-reference.k3jph.workers.dev',repo:'krigsvolddesign/jekyll',sha:'9fabe11fc87de6dba271b7bf893169b45397c0f3'}
];
const report={purpose:'P2 deployed Jekyll accessibility acceptance recheck',created:new Date().toISOString(),sites:[],checks:[],summary:{}};
await mkdir(OUT,{recursive:true});
const save=()=>writeFile(join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const error=e=>String(e?.stack||e).slice(0,600);
function rgb(color){
 const m=color?.match(/^rgba?\(\s*([\d.]+)(?:,\s*|\s+)([\d.]+)(?:,\s*|\s+)([\d.]+)(?:,\s*|\s+\/\s*|\s*,\s*)?([\d.]+)?/);
 if(!m)throw Error('Unrecognized computed color '+color);
 return [Number(m[1]),Number(m[2]),Number(m[3]),m[4]===undefined?1:Number(m[4])];
}
function lum(c){
 const [r,g,b]=c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});
 return .2126*r+.7152*g+.0722*b;
}
function contrast(fg,bg,opacity=1){
 const f=rgb(fg), b=rgb(bg); const alpha=f[3]*opacity;
 const apparent=f.slice(0,3).map((v,i)=>v*alpha+b[i]*(1-alpha));
 const l1=lum(apparent),l2=lum(b);
 return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
}
const browser=await chromium.launch({headless:true});
let problems=0;
try{
 for(const site of SITES){
  const info={id:site.id,url:site.base,expectedSha:site.sha,manifestStatus:null,observedSha:null,verified:false,attempts:0};
  report.sites.push(info);
  for(let n=1;n<=12;n++){
   info.attempts=n;
   try{
    const res=await fetch(site.base+'/.well-known/deployment.json',{signal:AbortSignal.timeout(14000),redirect:'follow'});
    info.manifestStatus=res.status;
    const data=await res.json();
    info.observedSha=data.sourceCommit;
    info.branch=data.branch;
    info.repository=data.repository;
    info.builtAt=data.builtAt;
    info.verified=res.ok&&data.sourceCommit===site.sha&&data.branch==='develop'&&data.repository===site.repo;
    if(info.verified)break;
   }catch(e){info.lastError=error(e)}
   if(n<12)await sleep(12000);
  }
  console.log('DEPLOYMENT_CHECK '+JSON.stringify(info));
  await save();
  if(!info.verified){problems++;continue}
  const context=await browser.newContext({viewport:{width:1440,height:900},colorScheme:'dark',reducedMotion:'reduce'});
  await context.addInitScript(()=>{try{localStorage.setItem('design-appearance','dark')}catch{}});
  const page=await context.newPage();
  page.setDefaultNavigationTimeout(16000);
  let candidates=new Set(['/examples/search/','/examples/contact/','/examples/sign-up/']);
  try {
   const response=await page.goto(site.base+'/examples/',{waitUntil:'load'});
   if(!response.ok())throw Error('examples index HTTP '+response.status());
   const hrefs=await page.locator('a[href]').evaluateAll(links=>links.map(a=>{try{return new URL(a.href).pathname}catch{return ''}}));
   for(const path of hrefs)if(path.startsWith('/examples/')&&/^\/examples\/[a-z-]+\/$/.test(path))candidates.add(path);
  }catch(e){report.checks.push({site:site.id,type:'catalogue-discovery',pass:false,error:error(e)});problems++}
  let placeholderCount=0,routeCount=0;
  for(const route of [...candidates].sort()){
   const check={site:site.id,type:'chromium-dark-placeholders',route,fields:[],pass:true};
   try{
    const resp=await page.goto(site.base+route,{waitUntil:'load'});
    check.status=resp.status();routeCount++;
    if(resp.status()!==200)throw Error('HTTP '+resp.status());
    const fields=await page.locator('input[placeholder], textarea[placeholder]').evaluateAll(els=>els.filter(el=>{
     const box=el.getBoundingClientRect(),style=getComputedStyle(el);
     return box.width>0&&box.height>0&&style.visibility!=='hidden'&&style.display!=='none';
    }).map(el=>{
     const pseudo=getComputedStyle(el,'::placeholder'),input=getComputedStyle(el);
     return {id:el.id,type:el.getAttribute('type')||el.tagName.toLowerCase(),placeholder:el.getAttribute('placeholder'),
       foreground:pseudo.color,opacity:pseudo.opacity,background:input.backgroundColor};
    }));
    for(const f of fields){
     const ratio=contrast(f.foreground,f.background,Number(f.opacity));
     f.ratio=Number(ratio.toFixed(3));f.pass=ratio>=4.5;
     placeholderCount++;
     if(!f.pass){check.pass=false;problems++}
    }
    check.fields=fields;
    if(fields.length||!check.pass)report.checks.push(check);
    if(fields.length){await page.screenshot({path:join(OUT,site.id+'--'+route.replaceAll('/','_')+'--dark-fields.png'),animations:'disabled'})}
   }catch(e){check.pass=false;check.error=error(e);report.checks.push(check);problems++}
  }
  report.checks.push({site:site.id,type:'dark-placeholder-coverage',routesVisited:routeCount,fieldsChecked:placeholderCount,pass:placeholderCount>0});
  if(!placeholderCount)problems++;
  await context.close();
  if(site.id==='krigsvold'){
   for(const appearance of ['light','dark']){
    const pc=await browser.newContext({viewport:{width:1440,height:900},colorScheme:appearance,reducedMotion:'reduce'});
    await pc.addInitScript(mode=>{try{localStorage.setItem('design-appearance',mode)}catch{}},appearance);
    const page=await pc.newPage();
    for(const route of ['/language/','/examples/','/journal/']){
     const check={site:site.id,type:'print-credit-contrast',appearance,route,pass:true};
     try{
      const res=await page.goto(site.base+route,{waitUntil:'load'});
      if(res.status()!==200)throw Error('HTTP '+res.status());
      await page.emulateMedia({media:'print'});
      const links=await page.locator('.hero-image-credit a').evaluateAll(els=>els.map(el=>{
       const style=getComputedStyle(el),box=el.getBoundingClientRect();
       return {text:el.textContent?.trim(),url:el.href,color:style.color,visibility:style.visibility,
         display:style.display,width:box.width,height:box.height};
      }));
      check.links=links.map(el=>({...el,contrast:Number(contrast(el.color,'rgb(255, 255, 255)').toFixed(3))}));
      check.pass=check.links.length>0&&check.links.every(el=>el.width>0&&el.height>0&&el.display!=='none'&&el.visibility!=='hidden'&&el.contrast>=4.5);
      if(!check.pass)problems++;
      if(route==='/language/'){
       const pdf=site.id+'--'+appearance+'--language-print.pdf';
       await page.pdf({path:join(OUT,pdf),format:'A4',printBackground:false,preferCSSPageSize:true});
       check.pdf=pdf;
      }
      await page.emulateMedia({media:'screen'});
     }catch(e){check.pass=false;check.error=error(e);problems++}
     report.checks.push(check);
    }
    await pc.close();
   }
  }
  await save();
 }
}finally{await browser.close();}
report.summary={pass:problems===0,failedChecks:problems,verifiedDeployments:report.sites.filter(s=>s.verified).length,
  placeholderFields:report.checks.filter(c=>c.type==='chromium-dark-placeholders').flatMap(c=>c.fields).length};
await save();
console.log('P2_ACCEPTANCE_RESULT '+JSON.stringify(report.summary));
if(problems)process.exitCode=1;
