#!/usr/bin/env node
/** Read-only PR-preview evidence; NEVER treat these images as deployed develop. */
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';

const root=join(resolve(process.env.LIVE_JEKYLL_EVIDENCE_DIR||'live-jekyll-evidence'),'previews');
const shots=join(root,'screenshots');
mkdirSync(shots,{recursive:true});
const targets=[
 {family:'martlet',repo:'martletdesign/jekyll',pr:33,worker:'martletdesign-jekyll-reference'},
 {family:'krigsvold',repo:'krigsvolddesign/jekyll',pr:29,worker:'krigsvolddesign-jekyll-reference'}
];
const records=[];
const safe=e=>String(e?.message||e).slice(0,500);
async function json(url){
 const r=await fetch(url,{headers:{'Accept':'application/vnd.github+json','User-Agent':'independent-jekyll-preview-capture/1.0'},signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw Error('HTTP '+r.status+' at '+url);
 return r.json();
}
const rect=e=>e?(()=>{const b=e.getBoundingClientRect();return{left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height}})():null;
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const t of targets){
  const record={family:t.family,pr:t.pr,repo:t.repo,source:'PR PREVIEW; NOT DEVELOP',verified:false,captures:[],errors:[]};
  records.push(record);
  try{
   const pr=await json('https://api.github.com/repos/'+t.repo+'/pulls/'+t.pr);
   record.headSha=pr.head?.sha;record.headBranch=pr.head?.ref;
   const checks=await json('https://api.github.com/repos/'+t.repo+'/commits/'+record.headSha+'/check-runs?per_page=100');
   const build=checks.check_runs?.find(x=>x.name==='Workers Builds: '+t.worker&&x.conclusion==='success');
   if(!build)throw Error('Preview worker build check absent or not successful at exact PR SHA');
   const label=build.details_url?.match(/\/previews\/([^/]+)\/builds\//)?.[1];
   if(!label||!/^[a-z0-9-]+$/.test(label))throw Error('No validated preview subdomain in Cloudflare check details URL');
   record.origin='https://'+label+'-'+t.worker+'.k3jph.workers.dev';
   record.cloudflareBuild=build.details_url;
   const manifest=await json(record.origin+'/.well-known/deployment.json');
   record.manifest={repository:manifest.repository,branch:manifest.branch,sourceCommit:manifest.sourceCommit,deploymentKind:manifest.deploymentKind};
   record.verified=manifest.repository===t.repo&&manifest.sourceCommit===record.headSha&&manifest.branch===record.headBranch&&manifest.deploymentKind==='isolated-pull-request-preview';
   if(!record.verified){record.errors.push('PR SHA/branch/preview-kind manifest mismatch; screenshots are NOT acceptance proof');continue;}
   for(const scale of [100,200,400]){
    for(const route of ['/','/examples/sign-up/']){
     const ctx=await browser.newContext({viewport:{width:scale===100?390:320,height:1100},deviceScaleFactor:1,reducedMotion:'reduce'});
     const page=await ctx.newPage();
     try{
      const response=await page.goto(record.origin+route,{waitUntil:'load',timeout:30000});
      if(scale!==100)await page.evaluate(s=>document.documentElement.style.fontSize=s+'%',scale);
      await page.waitForTimeout(300);
      const geometry=await page.evaluate(()=>{
       const toRect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
       const measure=e=>{
        if(!e)return null;
        const r=document.createRange();r.selectNodeContents(e);
        const parts=[...r.getClientRects()];
        const clipped=parts.some(p=>{
         if(p.left<-.5||p.right>innerWidth+.5)return true;
         for(let a=e;a;a=a.parentElement){
          const s=getComputedStyle(a);if(!/(hidden|clip|auto|scroll)/.test(s.overflowX))continue;
          const b=a.getBoundingClientRect();
          if(p.left<b.left-.5||p.right>b.right+.5)return true;
         }
         return false;
        });
        return{clipped,parts:parts.map(x=>({left:x.left,right:x.right,top:x.top,bottom:x.bottom}))};
       };
       const brand=document.querySelector('.site-header .brand span,.navbar-brand span');
       const eyebrow=document.querySelector('main .eyebrow');
       const heading=document.querySelector('main h1');
       const menu=document.querySelector('.menu-button,.navbar-toggler');
       const checkbox=document.querySelector('.example-checkbox input[type=checkbox]');
       const label=checkbox?.closest('label');
       const labelText=label?.querySelector('span');
       return{
        width:innerWidth,rootFont:getComputedStyle(document.documentElement).fontSize,
        overflowX:document.documentElement.scrollWidth>innerWidth,
        brand:measure(brand),eyebrow:measure(eyebrow),heading:measure(heading),
        menu:toRect(menu),checkbox:toRect(checkbox),labelText:toRect(labelText),
        checkboxAssociated:!!label&&label.contains(checkbox),
        hero:toRect(document.querySelector('.page-intro,header[data-hero-variant]')),
        footer:toRect(document.querySelector('footer,.site-footer'))
       };
      });
      if(route.includes('sign-up'))await page.locator('.example-checkbox').first().scrollIntoViewIfNeeded({timeout:5000}).catch(()=>{});
      const filename=t.family+'--preview--'+scale+'pct--'+(route==='/'?'home':'sign-up')+'.jpg';
      await page.screenshot({path:join(shots,filename),type:'jpeg',quality:85,animations:'disabled'});
      record.captures.push({scale,route,file:filename,httpStatus:response?.status(),geometry});
     }catch(e){record.errors.push('Capture '+scale+' '+route+': '+safe(e));}
     finally{await ctx.close();}
    }
   }
  }catch(e){record.errors.push(safe(e));}
 }
}catch(e){records.push({fatalError:safe(e)});}
finally{
 if(browser)await browser.close();
 writeFileSync(join(root,'report.json'),JSON.stringify({readOnly:true,source:'PR PREVIEW ONLY - never develop',checkedAt:new Date().toISOString(),records},null,2)+'\n');
 const complete=records.filter(x=>x.repo).length===2&&records.filter(x=>x.repo).every(x=>x.verified&&x.captures.length===6&&x.errors.length===0);
 console.log(JSON.stringify({complete,records:records.map(x=>({family:x.family,verified:x.verified,head:x.headSha,origin:x.origin,captures:x.captures?.length,errors:x.errors}))},null,2));
 if(!complete)process.exitCode=1;
}