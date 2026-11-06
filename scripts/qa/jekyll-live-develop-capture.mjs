#!/usr/bin/env node
/**
 * Read-only, evidence-first capture of the TWO actual deployed Jekyll develop sites.
 * Never logs in, modifies a site, publishes code, or infers Cloudflare deploy success.
 * A matched /.well-known/deployment.json sourceCommit is the deployment gate.
 */
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';

const out=resolve(process.env.LIVE_JEKYLL_EVIDENCE_DIR||'live-jekyll-evidence');
mkdirSync(out,{recursive:true});
const hosts=[
 {family:'martlet',repo:'martletdesign/jekyll',origin:'https://develop-martletdesign-jekyll-reference.k3jph.workers.dev'},
 {family:'krigsvold',repo:'krigsvolddesign/jekyll',origin:'https://develop-krigsvolddesign-jekyll-reference.k3jph.workers.dev'}
];
const routes=['/','/language/','/examples/','/journal/','/examples/faq/','/examples/dashboard-analytics/','/examples/sign-up/'];
const sizes=[{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const safe=(x)=>String(x).slice(0,600);
async function jsonAt(url,timeout=15000){
 const r=await fetch(url,{headers:{'User-Agent':'Jekyll-live-audit-capture/1.0','Accept':'application/json',...(process.env.GITHUB_TOKEN&&url.startsWith('https://api.github.com/')?{Authorization:'Bearer '+process.env.GITHUB_TOKEN}:{})},signal:AbortSignal.timeout(timeout),redirect:'follow'});
 if(!r.ok)throw Error('HTTP '+r.status+' at '+url);
 return r.json();
}
function reportState(checked){writeFileSync(join(out,'report.json'),JSON.stringify({schemaVersion:1,readOnly:true,checkedAt:new Date().toISOString(),hosts:checked},null,2)+'\n');}
const records=[];
let browser;
try {
 for(const host of hosts){
  const result={family:host.family,repo:host.repo,origin:host.origin,verified:false,expectedCommit:null,
   deployedCommit:null,manifest:null,verificationErrors:[],screenshots:[],captures:[],pageErrors:[]};
  records.push(result);
  try {
   const ref=await jsonAt('https://api.github.com/repos/'+host.repo+'/git/ref/heads/develop');
   result.expectedCommit=ref?.object?.sha||null;
   if(!/^[a-f0-9]{40}$/.test(result.expectedCommit||''))throw Error('No valid GitHub develop commit identity');
  }catch(e){result.verificationErrors.push('GitHub develop ref: '+safe(e.message));}
  for(let attempt=1;attempt<=6;attempt++){
   try{
    const manifest=await jsonAt(host.origin+'/.well-known/deployment.json');
    result.manifest={repository:manifest.repository,branch:manifest.branch,
      sourceCommit:manifest.sourceCommit,deploymentKind:manifest.deploymentKind};
    result.deployedCommit=manifest.sourceCommit||null;
    result.verified=manifest.repository===host.repo&&manifest.branch==='develop'&&manifest.sourceCommit===result.expectedCommit;
    if(result.verified)break;
    result.verificationErrors.push('Attempt '+attempt+': manifest does not match current develop SHA');
   }catch(e){result.verificationErrors.push('Attempt '+attempt+': '+safe(e.message));}
   if(attempt<6)await pause(10000);
  }
 }
 // Even if commit verification fails, capture pages that can be reached, but
 // prominently mark such evidence UNVERIFIED rather than declaring acceptance.
 browser=await chromium.launch({headless:true});
 for(const host of hosts){
  const item=records.find(x=>x.family===host.family);
  for(const size of sizes)for(const mode of ['light','dark']){
   const context=await browser.newContext({viewport:{width:size.width,height:size.height},deviceScaleFactor:1,
     reducedMotion:'reduce',colorScheme:mode==='dark'?'dark':'light'});
   await context.addInitScript(m=>{try{localStorage.setItem('design-appearance',m)}catch{}},mode);
   const page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(safe(e.message)));
   for(const route of routes){
    const slug=route==='/'?'home':route.replace(/^\/|\/$/g,'').replaceAll('/','--');
    const filename=host.family+'--'+size.name+'--'+mode+'--'+slug+'.jpg';
    try{
     const response=await page.goto(host.origin+route,{waitUntil:'domcontentloaded',timeout:20000});
     try{await page.waitForLoadState('load',{timeout:10000})}catch{}
     const observed=await page.evaluate(()=>{
      const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
      const hero=document.querySelector('.page-intro')||document.querySelector('header[data-hero-variant]');
      const art=hero?.querySelector('img');
      const header=document.querySelector('.site-header')||document.querySelector('.nav-shell');
      const footer=document.querySelector('.site-footer')||document.querySelector('footer');
      const checkbox=document.querySelector('.example-checkbox');
      const check=checkbox?.querySelector('input[type=checkbox]');
      const label=checkbox?.querySelector('span');
      const h=rect(hero),img=rect(art);
      return {
       title:document.title,bodyWidth:document.documentElement.scrollWidth,viewport:innerWidth,
       overflowX:document.documentElement.scrollWidth>innerWidth,appearance:document.documentElement.dataset.appearance||'',
       header:rect(header),headerBackground:header?getComputedStyle(header).backgroundColor:null,
       headerBackgroundImage:header?getComputedStyle(header).backgroundImage:null,
       hero:h,heroArt:img,heroImageSource:art?.currentSrc||null,
       imageBottomGap:h&&img?Math.round((h.bottom-img.bottom)*100)/100:null,
       heading:rect(document.querySelector('main h1')||hero?.querySelector('h1')),
       footer:rect(footer),checkbox:rect(check),checkboxText:rect(label),
       navigationItems:document.querySelectorAll('nav a').length
      };
     });
     const file=join(out,'screenshots',filename);mkdirSync(join(out,'screenshots'),{recursive:true});
     await page.screenshot({path:file,type:'jpeg',quality:79,fullPage:false,animations:'disabled'});
     item.captures.push({route,size:size.name,mode,status:response?.status()||0,filename,observed});
     item.screenshots.push(filename);
     if(route==='/'){
      await page.evaluate(()=>scrollTo(0,450));await page.waitForTimeout(650);
      const scrolled=filename.replace('.jpg','--scrolled.jpg');
      await page.screenshot({path:join(out,'screenshots',scrolled),type:'jpeg',quality:79,fullPage:false,animations:'disabled'});
      item.screenshots.push(scrolled);
      if(size.name==='desktop'){
       await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
       await page.waitForTimeout(400);
       const footerCapture=filename.replace('.jpg','--footer.jpg');
       await page.screenshot({path:join(out,'screenshots',footerCapture),type:'jpeg',quality:79,fullPage:false,animations:'disabled'});
       item.screenshots.push(footerCapture);
      }
      if(size.name==='mobile'){
       await page.evaluate(()=>scrollTo(0,0));
       const menu=page.locator('.menu-button,.navbar-toggler').first();
       if(await menu.isVisible().catch(()=>false)){
        await menu.click({timeout:2500}).catch(()=>{});
        const opened=filename.replace('.jpg','--menu-open.jpg');
        await page.screenshot({path:join(out,'screenshots',opened),type:'jpeg',quality:79,fullPage:false,animations:'disabled'});
        item.screenshots.push(opened);
       }
      }
     }
    }catch(e){item.captures.push({route,size:size.name,mode,error:safe(e.message)});}
   }
   item.pageErrors.push(...errors.map(error=>({size:size.name,mode,error})));
   await context.close();
  }
  /* Separately capture the 200% and 400% enlarged-type acceptance states.
     These are evidence only, not a substitute for human visual inspection. */
  for(const scale of [200,400])for(const route of ['/','/examples/sign-up/']){
   const context=await browser.newContext({viewport:{width:320,height:1100},reducedMotion:'reduce'});
   const page=await context.newPage();
   try{
    const response=await page.goto(host.origin+route,{waitUntil:'load',timeout:20000});
    await page.evaluate(v=>document.documentElement.style.fontSize=v+'%',scale);
    await page.waitForTimeout(300);
    const observed=await page.evaluate(()=>{
     const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right}};
     const header=document.querySelector('.site-header,.nav-shell');
     const firstText=document.querySelector('main .eyebrow, main h1, header[data-hero-variant] h1');
     const checkbox=document.querySelector('.example-checkbox input[type=checkbox]');
     const label=checkbox?.closest('label');
     const text=label?.querySelector('span');
     const brand=document.querySelector('.site-header .brand span, .navbar-brand span');
     // Document-level overflow misses text clipped by an internal scroll/clip box.
     // Measure each visible word's actual text-range fragments against both the
     // viewport and its overflow-clipping ancestors; screenshots remain decisive.
     const wordGeometry=(el)=>{
      if(!el)return null;
      const clippedWords=[];
      let wordsChecked=0;
      const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()&&wordsChecked<64){
       const node=walker.currentNode;
       for(const match of node.textContent.matchAll(/\S+/g)){
        if(wordsChecked++>=64)break;
        const range=document.createRange();
        range.setStart(node,match.index);
        range.setEnd(node,match.index+match[0].length);
        const fragments=[...range.getClientRects()];
        const escapes=fragments.some(r=>{
         if(r.right>innerWidth+.5||r.left<-.5)return true;
         for(let a=node.parentElement;a;a=a.parentElement){
          const s=getComputedStyle(a);
          if(!/(hidden|clip|auto|scroll)/.test(s.overflowX))continue;
          const box=a.getBoundingClientRect();
          if(r.left<box.left-.5||r.right>box.right+.5)return true;
         }
         return false;
        });
        if(escapes)clippedWords.push({word:match[0].slice(0,48),fragments:fragments.map(r=>({left:+r.left.toFixed(1),right:+r.right.toFixed(1)}))});
       }
      }
      return{wordsChecked,clippedWords};
     };
     let wordFragments=null;
     if(brand?.firstChild?.nodeType===Node.TEXT_NODE){
      const node=brand.firstChild;const end=node.textContent.trim().split(' ')[0].length;
      const range=document.createRange();range.setStart(node,0);range.setEnd(node,Math.min(end,node.textContent.length));
      wordFragments=range.getClientRects().length;
     }
     return{rootFont:getComputedStyle(document.documentElement).fontSize,header:rect(header),
      headerPosition:header?getComputedStyle(header).position:null,
      headerInFlow:header?getComputedStyle(header).position!=='fixed':null,
      firstMastheadText:rect(firstText),brandWordFragments:wordFragments,
      textClipping:{brand:wordGeometry(brand),eyebrow:wordGeometry(document.querySelector('main .eyebrow')),heading:wordGeometry(document.querySelector('main h1'))},
      checkbox:rect(checkbox),checkboxLabelText:rect(text),checkboxAssociated:!!label&&label.contains(checkbox),
      overflowX:document.documentElement.scrollWidth>innerWidth};
    });
    const slug=route==='/'?'home':'sign-up';
    const filename=host.family+'--reflow-320--'+scale+'pct--'+slug+'.jpg';
    if(route!=='/'){
     const input=page.locator('.example-checkbox').first();
     if(await input.count())await input.scrollIntoViewIfNeeded({timeout:5000}).catch(()=>{});
    }
    await page.screenshot({path:join(out,'screenshots',filename),type:'jpeg',quality:82,animations:'disabled'});
    item.captures.push({route,size:'reflow-320',scale,mode:'light',status:response?.status()||0,
      filename,observed});
    item.screenshots.push(filename);
   }catch(e){item.captures.push({route,size:'reflow-320',scale,error:safe(e.message)});}
   finally{await context.close();}
  }
 }

 // Motion-enabled read-only transition evidence; previous static captures
 // request reduced motion and therefore cannot certify a nav fade.
 for(const host of hosts){
  const item=records.find(x=>x.family===host.family);
  item.navTransitions=[];
  for(const mode of ['light','dark']){
   const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference',
    colorScheme:mode==='dark'?'dark':'light'});
   await context.addInitScript(m=>{try{localStorage.setItem('design-appearance',m)}catch{}},mode);
   const page=await context.newPage();
   try{
    const response=await page.goto(host.origin+'/language/',{waitUntil:'load',timeout:20000});
    const nav=page.locator('.site-header,.site-navbar,.nav-shell').first();
    const sample=async(stage)=>{
     const observed=await nav.evaluate(el=>{
      const s=getComputedStyle(el);
      return{backgroundColor:s.backgroundColor,backgroundImage:s.backgroundImage,
       opacity:s.opacity,transitionProperty:s.transitionProperty,
       transitionDuration:s.transitionDuration,position:s.position,classes:el.className};
     });
     const file=host.family+'--motion--section--'+mode+'--'+stage+'.jpg';
     await page.screenshot({path:join(out,'screenshots',file),type:'jpeg',quality:83,animations:'allow'});
     item.screenshots.push(file);
     return{stage,file,observed};
    };
    const samples=[await sample('top')];
    await page.evaluate(()=>scrollTo(0,450));
    await page.waitForTimeout(100);
    samples.push(await sample('scroll-100ms'));
    await page.waitForTimeout(500);
    samples.push(await sample('scroll-600ms'));
    item.navTransitions.push({mode,status:response?.status()||0,samples});
   }catch(e){item.navTransitions.push({mode,error:safe(e.message)});}
   finally{await context.close();}
  }
 }

}catch(e){records.push({fatalError:safe(e.stack||e.message)});process.exitCode=1;}
finally{
 if(browser)await browser.close();
 reportState(records);
 const verified=records.filter(x=>x.repo).every(x=>x.verified);
 const failed=records.filter(x=>x.repo).some(x=>x.captures.length===0);
 writeFileSync(join(out,'README.md'),
  '# Jekyll deployed develop visual evidence\n\n' +
  'These are READ-ONLY screenshots and computed geometry from the LIVE Cloudflare Worker URLs. '+
  'Source-commit identity is independently checked against GitHub develop via /.well-known/deployment.json. '+
  'If report.json has verified=false, DO NOT claim source identity or visual acceptance; screenshots are illustrative only. '+
  'Review hero image end gaps, navbar transparency/scroll, brand/menu reflow, checkbox grouping, '+
  'footer and responsive light/dark behavior. No scripts modified either site.\n');
 console.log(JSON.stringify({verified,failed,hosts:records.map(x=>({family:x.family,verified:x.verified,
  expected:x.expectedCommit,observed:x.deployedCommit,screenshots:x.screenshots?.length,errors:x.verificationErrors?.slice(-2)}))},null,2));
 if(!verified||failed)process.exitCode=1;
}
