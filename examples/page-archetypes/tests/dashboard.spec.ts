import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const route=(family:string,view:string)=>`/${family}/examples/dashboard-${view}/`;
for(const family of ['martlet','krigsvold']){
 test(`${family}: account examples associate sensitive-field guidance`,async({page})=>{
  for(const id of ['sign-in','sign-up']){
   await page.goto(`/${family}/examples/${id}/`);
   await expect(page.getByLabel('Example password',{exact:true})).toHaveAccessibleDescription('Use an invented password of at least eight characters.');
  }
  await page.goto(`/${family}/examples/two-factor/`);
  await expect(page.getByLabel('Six-digit example code',{exact:true})).toHaveAccessibleDescription('Any six digits demonstrate local format validation.');
 });
 test(`${family}: editing a validated example clears the prior status`,async({page})=>{
  await page.goto(`/${family}/examples/sign-in/`);
  await page.getByLabel('Email address',{exact:true}).fill('example@example.test');
  await page.getByLabel('Example password',{exact:true}).fill('invented-password');
  await page.getByRole('button',{name:'Validate example'}).click();
  await expect(page.locator('[data-form-status]')).toContainText('Example validated locally.');
  await page.getByLabel('Email address',{exact:true}).fill('other@example.test');
  await expect(page.locator('[data-form-status]')).toBeEmpty();
 });
 test(`${family}: analytics scope, exact data alternatives, invalid-range recovery`,async({page})=>{
  await page.goto(route(family,'analytics'));
  await expect(page.locator('[data-metric=sessions]')).toHaveText('7,686');
  await expect(page.getByLabel('Category',{exact:true})).toHaveCSS('font-family',family==='martlet'?/Lato/:/Roboto/);
  await page.getByLabel('Date range',{exact:true}).selectOption('14');await page.getByLabel('Category',{exact:true}).selectOption('Research');await page.getByRole('button',{name:'Apply filters',exact:true}).click();
  await expect(page.locator('[data-metric=sessions]')).toHaveText('4,459');await expect(page.locator('#analytics-source tbody tr')).toHaveCount(14);
  await page.getByText('View session trend data',{exact:true}).click();await expect(page.locator('[data-chart-table=sessions] tbody tr')).toHaveCount(14);
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download filtered CSV',exact:true}).click();expect((await download).suggestedFilename()).toBe('northlight-analytics.csv');
  await page.getByLabel('Start date',{exact:true}).fill('2026-10-28');await page.getByLabel('End date',{exact:true}).fill('2026-10-22');await page.getByRole('button',{name:'Apply filters',exact:true}).click();
  await expect(page.locator('#analytics-error')).toBeVisible();await expect(page.locator('[data-metric=sessions]')).toHaveText('4,459');await expect(page.getByRole('button',{name:'Download filtered CSV'})).toBeDisabled();
 });
 test(`${family}: an end-only URL is identified as a custom analytics range`,async({page})=>{
  await page.goto(route(family,'analytics')+'?end=2026-10-25');
  await expect(page.getByLabel('Date range',{exact:true})).toHaveValue('custom');
  await expect(page.locator('#analytics-source tbody tr')).toHaveCount(12);
 });
 test(`${family}: administration selection scope, confirmation, sorting and recovery`,async({page})=>{
  await page.goto(route(family,'administration'));
  await expect(page.locator('#people-table tbody tr')).toHaveCount(5);
  const originalPage=await page.locator('#people-table tbody').innerText();
  await page.getByLabel('Select visible people',{exact:true}).check();await page.getByRole('button',{name:'Next page',exact:true}).click();
  await expect(page.locator('[data-selection-count]')).toContainText('5 people selected');await page.getByRole('button',{name:'Suspend selected',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('5 selected people');await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByRole('dialog')).not.toBeVisible();await page.getByRole('button',{name:'Previous page',exact:true}).click();expect(await page.locator('#people-table tbody').innerText()).toBe(originalPage);
  await page.getByLabel('Search people',{exact:true}).fill('Mara Ellis');await page.getByRole('button',{name:'Apply directory filters'}).click();await expect(page.locator('[data-selection-count]')).toContainText('0 people selected');await expect(page.locator('#people-table tbody tr')).toHaveCount(1);
  await page.getByLabel('Select visible people',{exact:true}).check();await page.getByRole('button',{name:'Suspend selected'}).click();await page.getByRole('button',{name:'Confirm change'}).click();await expect(page.locator('#people-table tbody')).toContainText('Suspended');
  await page.getByRole('button',{name:'Edit Mara Ellis',exact:true}).click();await page.getByLabel('Full name',{exact:true}).fill('');await page.getByRole('button',{name:'Save person locally'}).click();await expect(page.locator('#person-errors')).toBeVisible();await expect(page.getByLabel('Email address',{exact:true})).toHaveValue('mara.ellis@example.invalid');
  await page.getByLabel('Full name',{exact:true}).fill('<img src=x onerror=alert(1)>');await page.getByRole('button',{name:'Save person locally'}).click();await page.getByRole('button',{name:'Clear filters',exact:true}).click();await expect(page.locator('#people-table tbody img')).toHaveCount(0);
  await page.getByRole('button',{name:'Name',exact:true}).click();await expect(page.locator('[data-sort=name]').locator('..')).toHaveAttribute('aria-sort','descending');
  await page.getByLabel('State preview',{exact:true}).selectOption('loading');await expect(page.locator('[data-directory-state]')).toContainText('Loading state preview');await page.getByLabel('State preview',{exact:true}).selectOption('error');await page.getByRole('button',{name:'Retry directory'}).click();await expect(page.locator('[data-directory-region]')).toBeVisible();
  await page.getByLabel('Search people',{exact:true}).fill('nonexistent-record');await page.getByRole('button',{name:'Apply directory filters'}).click();await expect(page.locator('[data-directory-state]')).toContainText('No people match');
 });
 test(`${family}: malformed page in a shared directory URL recovers to the first page`,async({page})=>{
  await page.goto(route(family,'administration')+'?page=1.5');
  await expect(page.locator('[data-people-page]')).toHaveText('Page 1 of 5');
  await expect(page.locator('#people-table tbody tr')).toHaveCount(5);
  await expect(page.getByRole('button',{name:'Previous page',exact:true})).toBeDisabled();
 });
 test(`${family}: operations controls, thresholds and acknowledgement`,async({page})=>{
  await page.goto(route(family,'operations'));
  await expect(page.locator('[data-metric=warnings]')).toHaveText('1');
  await page.getByLabel('Warning threshold (ms)',{exact:true}).fill('50');await page.getByRole('button',{name:'Apply monitoring controls'}).click();await expect(page.locator('[data-metric=warnings]')).toHaveText('5');
  await page.getByLabel('Service',{exact:true}).selectOption('SVC-04');await page.getByLabel('Alert severity',{exact:true}).selectOption('Critical');await page.getByRole('button',{name:'Apply monitoring controls'}).click();await expect(page.locator('#service-table tbody tr')).toHaveCount(1);await expect(page.locator('#alert-table tbody tr')).toHaveCount(1);
  await page.getByRole('button',{name:'Acknowledge AL-001',exact:true}).click();await expect(page.locator('[data-metric=open_alerts]')).toHaveText('0');await expect(page.locator('[data-activity]')).toContainText('Acknowledged AL-001 locally');
  await page.getByLabel('Hide acknowledged alerts',{exact:true}).check();await page.getByRole('button',{name:'Apply monitoring controls'}).click();await expect(page.locator('#alert-table tbody tr')).toHaveCount(0);
  await page.getByLabel('Warning threshold (ms)',{exact:true}).fill('1');await page.getByRole('button',{name:'Apply monitoring controls'}).click();await expect(page.locator('#operations-error')).toBeVisible();await page.getByRole('button',{name:'Reset operations preview'}).click();await expect(page.locator('[data-metric=open_alerts]')).toHaveText('2');
 });
 test(`${family}: acknowledging an alert preserves unapplied monitoring controls`,async({page})=>{
  await page.goto(route(family,'operations'));
  await expect(page.locator('[data-metric=warnings]')).toHaveText('1');
  const threshold=page.getByLabel('Warning threshold (ms)',{exact:true});
  await threshold.fill('50');
  await page.getByRole('button',{name:'Acknowledge AL-001',exact:true}).click();
  await expect(page.getByRole('button',{name:'Undo acknowledgement AL-001',exact:true})).toBeVisible();
  await expect(page.locator('[data-metric=warnings]')).toHaveText('1');
  await expect(threshold).toHaveValue('50');
  expect(new URL(page.url()).searchParams.get('threshold')).toBe('250');
  await page.getByRole('button',{name:'Apply monitoring controls'}).click();
  await expect(page.locator('[data-metric=warnings]')).toHaveText('5');
  await threshold.fill('1');
  await page.getByRole('button',{name:'Undo acknowledgement AL-001',exact:true}).click();
  await expect(page.getByRole('button',{name:'Acknowledge AL-001',exact:true})).toBeVisible();
  await expect(threshold).toHaveValue('1');
  await expect(page.locator('[data-metric=warnings]')).toHaveText('5');
  await page.getByRole('button',{name:'Apply monitoring controls'}).click();
  await expect(page.locator('#operations-error')).toBeVisible();
 });
 test(`${family}: chart labels remain readable when the viewport changes`,async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto(route(family,'analytics'));
  const chart=page.locator('[data-chart=sessions]');
  await expect(chart.locator('svg')).toBeVisible();
  const desktopWidth=await chart.locator('svg').evaluate(svg=>Number(svg.getAttribute('viewBox')!.split(' ')[2]));
  await page.setViewportSize({width:320,height:900});
  await expect.poll(async()=>chart.locator('svg').evaluate(svg=>{
   const label=svg.querySelector('.dash-chart-label')!;
   return label.getBoundingClientRect().height;
  })).toBeGreaterThanOrEqual(11);
  const categoryLabels=page.locator('[data-chart=categories] .dash-chart-label');
  await expect.poll(async()=>categoryLabels.count()).toBe(7);
  const boxes=await categoryLabels.evaluateAll(nodes=>nodes.slice(-3).map(node=>{
   const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};
  }));
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
   const a=boxes[i],b=boxes[j];expect(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top).toBe(true);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByText('View session trend data',{exact:true}).click();
  await expect(page.locator('[data-chart-table=sessions] tbody tr')).toHaveCount(7);
  await page.setViewportSize({width:1440,height:900});
  await expect.poll(async()=>chart.locator('svg').evaluate(svg=>Number(svg.getAttribute('viewBox')!.split(' ')[2]))).toBeGreaterThan(desktopWidth-2);
 });
 for(const width of [320,768,1100,1440])for(const view of ['analytics','administration','operations']){
  test(`${family}: ${view} at ${width}px`,async({page})=>{
   await page.setViewportSize({width,height:1000});await page.goto(route(family,view));await expect(page.locator('[data-dashboard]')).toHaveAttribute('data-ready','true');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   if(width<=1024){const toggle=page.getByRole('button',{name:'Dashboard navigation',exact:true});await toggle.click();await expect(page.getByRole('navigation',{name:'Dashboard navigation',exact:true})).toBeVisible();await toggle.press('Escape');await expect(toggle).toHaveAttribute('aria-expanded','false');}
   if(width===320||width===1440)await page.screenshot({path:`test-results/dashboards/${family}-${view}-${width}.png`,fullPage:true});
  });
 }
 for(const mode of ['light','dark'])for(const view of ['analytics','administration','operations']){
  test(`${family}: ${view} ${mode} accessibility`,async({page})=>{
   await page.goto(route(family,view));if(mode==='dark')await page.locator('[data-appearance-toggle]').click();
   const results=await new AxeBuilder({page}).include('.dash-app').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(results.violations).toEqual([]);
  });
 }
}
test('paired initial and filtered views have identical functional results',async({page})=>{
 const read=async(family:string)=>{await page.goto(route(family,'analytics')+'?start=2026-10-15&end=2026-10-28&category=Research');await expect(page.locator('[data-metric=sessions]')).toHaveText('4,459');return page.locator('[data-metric]').allTextContents();};
 expect(await read('martlet')).toEqual(await read('krigsvold'));
 for(const view of ['administration','operations']){await page.goto(route('martlet',view));const first=await page.locator(view==='administration'?'#people-table tbody':'#service-table tbody').textContent();await page.goto(route('krigsvold',view));expect(await page.locator(view==='administration'?'#people-table tbody':'#service-table tbody').textContent()).toEqual(first);}
});

for(const family of ['martlet','krigsvold'])for(const view of ['analytics','administration','operations'])test(`${family}: ${view} comparison omits unrelated URL parameters`,async({page})=>{
 await page.goto(route(family,view)+'?token=private');
 const compare=page.locator('[data-compare]');
 await expect(compare).toHaveAttribute('href', /dashboard-/);
 expect(new URL(await compare.getAttribute('href')!, page.url()).searchParams.has('token')).toBe(false);
 if(view==='administration'){
  await page.getByLabel('Search people',{exact:true}).fill('Mara Ellis');
  await page.getByRole('button',{name:'Apply directory filters'}).click();
  await page.getByLabel('Table density',{exact:true}).selectOption('compact');
  const url=new URL(await compare.getAttribute('href')!,page.url());
  expect(url.searchParams.get('q')).toBe('Mara Ellis');
  expect(url.searchParams.get('density')).toBe('compact');
  expect(url.searchParams.has('token')).toBe(false);
 }
});

for(const family of ['martlet','krigsvold'])test(`${family}: workspace review re-evaluates active filters`,async({page})=>{
 await page.goto(`/${family}/examples/workspace/`);
 const workspace=page.locator('[data-workspace]');
 const filter=workspace.getByLabel('Filter records');
 await filter.fill('Needs review');
 await workspace.getByRole('button',{name:'Station inlet',exact:true}).click();
 await workspace.getByRole('button',{name:'Mark reviewed locally'}).click();
 await expect(workspace.locator('[data-record-count]')).toHaveText('0 of 3 records shown.');
 await expect(workspace.getByRole('button',{name:'Mark reviewed locally'})).toBeDisabled();
 await expect(workspace.locator('[data-active-record]')).toContainText('outside this filter');
 await expect(filter).toBeFocused();
});

for(const family of ['martlet','krigsvold'])test(`${family}: publishing primitives remain native`,async({page})=>{
 await page.goto(`/${family}/examples/article/`);
 const action=page.getByRole('link',{name:'Read the survey method',exact:true});
 await expect(action).toHaveClass(family==='martlet'?/\bbutton\b/:/\bbtn\b/);
 await expect(action).toHaveCSS('text-decoration-line','none');
 if(family==='martlet'){await expect(page.locator('.post-tags .pill-list a')).toHaveCount(2);expect(await page.locator('.post-tags').evaluate(node=>!node.closest('.page-intro'))).toBe(true);}
});

for(const family of ['martlet','krigsvold'])for(const mode of ['light','dark'])test(`${family}: stress-test table caption ${mode} contrast`,async({page})=>{
 await page.goto(`/${family}/examples/stress-test/`);
 if(mode==='dark')await page.locator('[data-appearance-toggle]').first().click();
 const caption=page.locator('.example-root caption');
 await expect(caption).toHaveText('A wide table');
 const results=await new AxeBuilder({page}).include('.example-root caption').withRules(['color-contrast']).analyze();
 expect(results.violations).toEqual([]);
});

test('krigsvold: dashboard buttons retain contrast through appearance changes and hover',async({page})=>{
 await page.goto(route('krigsvold','analytics'));
 await expect(page.locator('[data-dashboard]')).toHaveAttribute('data-ready','true');
 const primary=page.getByRole('button',{name:'Apply filters',exact:true});
 const secondary=page.getByRole('button',{name:'Download filtered CSV',exact:true});
 for(const target of ['dark','light']){
  const samples=await page.evaluate(async()=>{
   const buttons=[...document.querySelectorAll<HTMLElement>('#analytics-filters button.btn-dark-blue, #analytics-filters button.btn-outline-dark-blue')];
   const parse=(value:string)=>{const values=value.match(/[\d.]+/g)?.map(Number)??[];return [values[0]??0,values[1]??0,values[2]??0,values[3]??1]};
   const luminance=(rgb:number[])=>{const channel=(v:number)=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4};return .2126*channel(rgb[0])+.7152*channel(rgb[1])+.0722*channel(rgb[2])};
   const ratio=(button:HTMLElement)=>{
    const color=parse(getComputedStyle(button).color),bg=[0,0,0];let rest=1;
    for(let node:HTMLElement|null=button;node&&rest>.0001;node=node.parentElement){const c=parse(getComputedStyle(node).backgroundColor);for(let i=0;i<3;i++)bg[i]+=rest*c[3]*c[i];rest*=1-c[3]}
    for(let i=0;i<3;i++)bg[i]+=rest*255;
    const a=luminance(color),b=luminance(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
   };
   (document.querySelector('[data-appearance-toggle]') as HTMLButtonElement).click();
   await new Promise(requestAnimationFrame);
   const animations=buttons.flatMap(button=>button.getAnimations());animations.forEach(animation=>animation.pause());
   const result=[];for(const ms of [0,25,50,75,100,125,150]){animations.forEach(animation=>{animation.currentTime=ms});result.push({ms,ratios:buttons.map(ratio)})}
   animations.forEach(animation=>animation.finish());return result;
  });
  await expect(page.locator('html')).toHaveAttribute('data-appearance',target);
  expect(samples).toHaveLength(7);
  expect(samples[0].ratios).toHaveLength(2);
  for(const sample of samples)for(const ratio of sample.ratios)expect(ratio,`${target} at ${sample.ms}ms`).toBeGreaterThanOrEqual(4.5);
  for(const button of [primary,secondary]){
   await button.hover();
   const results=await new AxeBuilder({page}).include('#analytics-filters button:hover').withRules(['color-contrast']).analyze();
   expect(results.violations,`${target} hover`).toEqual([]);
  }
 }
});

test('martlet: scrolling header stays opaque over content in light and dark modes',async({page})=>{
 for(const mode of ['light','dark']){
  await page.setViewportSize({width:320,height:900});
  await page.goto('/martlet/examples/sign-in/');
  if(mode==='dark'){
   const colorTransitions=await page.evaluate(async()=>{
    (document.querySelector('[data-appearance-toggle]') as HTMLButtonElement).click();
    await new Promise(requestAnimationFrame);
    return [...document.querySelectorAll<HTMLElement>('.site-header, .site-header *')].flatMap(node=>node.getAnimations()).filter(animation=>animation instanceof CSSTransition && ['color','background-color'].includes(animation.transitionProperty)).map(animation=>(animation as CSSTransition).transitionProperty);
   });
   expect(colorTransitions,'header color roles switch together').toEqual([]);
  }
  await expect(page.locator('html')).toHaveAttribute('data-appearance',mode);
  const samples=await page.evaluate(async()=>{
   const header=document.querySelector('.site-header') as HTMLElement;
   window.scrollTo({top:1000,behavior:'instant'});await new Promise(requestAnimationFrame);
   const animations=header.getAnimations();animations.forEach(animation=>animation.pause());
   const values=[];for(const ms of [0,50,100,150,200,300,400,500]){animations.forEach(animation=>{animation.currentTime=ms});values.push({ms,color:getComputedStyle(header).backgroundColor,scrolled:header.classList.contains('is-scrolled')})}
   animations.forEach(animation=>animation.finish());return values;
  });
  for(const sample of samples){
   expect(sample.scrolled,`${mode} ${sample.ms}ms scrolled`).toBe(true);
   const alpha=sample.color.startsWith('rgba')?Number(sample.color.match(/[\d.]+/g)?.[3]):1;
   expect(alpha,`${mode} ${sample.ms}ms background opacity`).toBeGreaterThanOrEqual(.99);
  }
  const axe=await new AxeBuilder({page}).include('.site-header').withRules(['color-contrast']).analyze();
  expect(axe.violations,`${mode} scrolled header`).toEqual([]);
 }
});
