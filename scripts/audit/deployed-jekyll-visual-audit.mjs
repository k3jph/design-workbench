import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = 'visual-audit-output';
const BASES = [
 {id:'martlet',url:'https://develop-martletdesign-jekyll-reference.k3jph.workers.dev',sha:'632bab9f8bd2b1dc2edaaecdf96bd4ff1359fe56'},
 {id:'krigsvold',url:'https://develop-krigsvolddesign-jekyll-reference.k3jph.workers.dev',sha:'a9c95263bd15d528de8627735f92e0448ecc5f9e'}
];
const ROUTES = process.env.AUDIT_QUICK==='1' ? [['home','/'],['examples','/examples/']] : [['home','/'],['language','/language/'],['examples','/examples/'],['journal','/journal/'],['faq','/examples/faq/'],['changelog','/examples/changelog/'],['analytics','/examples/dashboard-analytics/']];
const VIEWS = [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}];
const APPEARANCES = process.env.AUDIT_QUICK==='1' ? ['light'] : ['light','dark'];
const browser = await chromium.launch({headless:true});
await mkdir(OUT,{recursive:true});
const report={generatedAt:new Date().toISOString(),purpose:'Independent review of PUBLIC deployed Jekyll development sites only',sites:[],pages:[],browserErrors:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const rect=el=>el?{x:el.x,y:el.y,width:el.width,height:el.height,bottom:el.y+el.height}:null;
function slimError(e){return String(e).slice(0,900)}
for(const site of BASES){
 let deployment={requested:site.url+'/.well-known/deployment.json',expectedDevelopSha:site.sha};
 try{
  const response=await fetch(deployment.requested,{signal:AbortSignal.timeout(18000),redirect:'follow'});
  deployment.httpStatus=response.status;
  deployment.body=(await response.text()).slice(0,2200);
  try{deployment.parsed=JSON.parse(deployment.body)}catch{}
  deployment.shaVerified=JSON.stringify(deployment.parsed||{}).includes(site.sha);
 }catch(e){deployment.error=slimError(e);deployment.shaVerified=false}
 let reachability={};
 try{
  const probe=await fetch(site.url+'/',{signal:AbortSignal.timeout(12000),redirect:'follow'});
  reachability.httpStatus=probe.status;
  reachability.contentType=probe.headers.get('content-type');
  reachability.reachable=probe.ok;
 }catch(e){reachability.error=slimError(e);reachability.reachable=false}
 report.sites.push({...site,deployment,reachability});
 if(!reachability.reachable){console.log('SKIP_UNREACHABLE_SITE '+site.id+' '+JSON.stringify(reachability));continue}
 for(const view of VIEWS)for(const appearance of APPEARANCES){
  const context=await browser.newContext({viewport:{width:view.width,height:view.height},colorScheme:appearance,reducedMotion:'reduce',deviceScaleFactor:1});
  await context.addInitScript(mode=>{try{localStorage.setItem('design-appearance',mode)}catch{}},appearance);
  const page=await context.newPage();page.setDefaultNavigationTimeout(18000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message.slice(0,400)));
  page.on('console',msg=>{if(msg.type()==='error')errors.push('console: '+msg.text().slice(0,250))});
  for(const [name,path] of ROUTES){
   const entry={site:site.id,url:site.url+path,route:name,appearance,view:view.name,viewport:view,errors:[]};
   const stub=[site.id,name,appearance,view.name].join('--');
   try{
    const response=await page.goto(entry.url,{waitUntil:'load',timeout:7000});
    entry.httpStatus=response?.status()??null;
    await page.evaluate(async()=>{if(document.fonts)await document.fonts.ready});
    await sleep(120);
    entry.documentTitle=await page.title();
    entry.render=await page.evaluate(()=>{
     const found=s=>document.querySelector(s),b=e=>{if(!e)return null;let q=e.getBoundingClientRect();return{x:q.x,y:q.y,width:q.width,height:q.height,bottom:q.bottom,right:q.right}};
     const hero=found('.page-intro, .page-masthead'),art=found('.page-intro__art, .page-masthead__art img'),head=found('.site-header, .nav-shell'),title=found('main h1'),credit=found('.hero-credit, .hero-image-credit'),footer=found('.site-footer'),main=found('main');
     const artStyle=art?getComputedStyle(art):null,nav=head?getComputedStyle(head):null;
     const img=art&&art.tagName==='IMG'?art:hero?.querySelector('img');
     return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,scrollOverflow:document.documentElement.scrollWidth>innerWidth+1,
       bodyVariant:document.body.dataset.heroVariant,appearance:document.documentElement.dataset.appearance,
       hero:b(hero),art:b(art),header:b(head),title:b(title),credit:b(credit),footer:b(footer),main:b(main),
       heading:title?.innerText?.slice(0,180),navColor:nav?.backgroundColor,navImage:nav?.backgroundImage,navTransition:nav?.transitionDuration,
       heroAfter:hero?getComputedStyle(hero,'::after').backgroundImage:null,
       artFit:artStyle?.objectFit,artPosition:artStyle?.objectPosition,artPositionMode:artStyle?.position,
       artSource:img?.currentSrc,artNaturalSize:img?{width:img.naturalWidth,height:img.naturalHeight,loaded:img.complete}:null};
    });
    entry.heroBottomGap=entry.render.hero&&entry.render.art?Math.round((entry.render.hero.bottom-entry.render.art.bottom)*10)/10:null;
    entry.artTopGap=entry.render.hero&&entry.render.art?Math.round((entry.render.art.y-entry.render.hero.y)*10)/10:null;
    entry.screenshot=stub+'--top.jpg';
    await page.screenshot({path:join(OUT,entry.screenshot),type:'jpeg',quality:80,animations:'disabled'});
    if(name==='home'||name==='faq'||name==='analytics'){
      await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
      await sleep(120);
      entry.footerScreenshot=stub+'--footer.jpg';
      await page.screenshot({path:join(OUT,entry.footerScreenshot),type:'jpeg',quality:75,animations:'disabled'});
      entry.scrolledNav=await page.locator('.site-header, .nav-shell').evaluate(el=>({classes:el.className,color:getComputedStyle(el).backgroundColor,gradient:getComputedStyle(el).backgroundImage}));
      if(view.name==='mobile'&&name==='home'){
        await page.evaluate(()=>scrollTo(0,0));
        const m=page.locator('.menu-button, .navbar-toggler');
        if(await m.isVisible()){
          await m.click({timeout:2500});
          entry.mobileMenuScreenshot=stub+'--menu.jpg';
          await page.screenshot({path:join(OUT,entry.mobileMenuScreenshot),type:'jpeg',quality:75});
          entry.menuExpanded=await m.getAttribute('aria-expanded');
          await page.keyboard.press('Escape');
        }
      }
    }
   }catch(e){entry.errors.push(slimError(e))}
   entry.errors.push(...errors.splice(0));
   report.pages.push(entry);
   console.log(JSON.stringify({site:site.id,route:name,view:view.name,appearance,status:entry.httpStatus,bottomGap:entry.heroBottomGap,errors:entry.errors.length}));
  }
  await context.close();
 }
}
await writeFile(join(OUT,'report.json'),JSON.stringify(report,null,2));
await browser.close();
console.log('VISUAL_AUDIT_DONE pages='+report.pages.length+' sites='+report.sites.length);
