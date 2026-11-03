// Builds isolated copies to exercise repeated same-task directory submissions.
import assert from 'node:assert/strict';
import {cpSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync, symlinkSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve, join, basename, extname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {chromium,expect} from '@playwright/test';
import {Validator} from '@cfworker/json-schema';
const root=process.cwd(),temp=mkdtempSync(join(tmpdir(),'nightjar-empty-'));
const original=JSON.parse(readFileSync('examples/page-archetypes/content/dashboards.json','utf8'));
const fixture=structuredClone(original);fixture.people=fixture.people.slice(0,2);
const schema=JSON.parse(readFileSync('examples/page-archetypes/contracts/dashboards.schema.json','utf8'));
assert.ok(new Validator(schema,'2020-12',true).validate(fixture).valid,'Invalid operations fixture remains schema-valid');
const skip=new Set(['node_modules','dist','_site','.astro','.jekyll-cache','test-results']);
function run(command,args,cwd,extra={}){
 const child=spawnSync(command,args,{cwd,env:{...process.env,...extra},encoding:'utf8'});
 assert.equal(child.status,0,`${command} ${args.join(' ')} failed: ${child.stderr}\n${child.stdout}`);
}
let browser;
try {
 cpSync(join(root,'examples'),join(temp,'examples'),{recursive:true,filter:path=>!skip.has(basename(path))&&!basename(path).endsWith('-dist')});
 cpSync(join(root,'packages'),join(temp,'packages'),{recursive:true,filter:path=>!skip.has(basename(path))});
 cpSync(join(root,'package.json'),join(temp,'package.json'));
 symlinkSync(resolve(root,'node_modules'),join(temp,'node_modules'),'dir');
 symlinkSync(resolve(root,'examples/astro-slice/node_modules'),join(temp,'examples/astro-slice/node_modules'),'dir');
 for(const path of ['examples/page-archetypes/content/dashboards.json','examples/jekyll/martlet/_data/dashboards.json','examples/jekyll/krigsvold/_data/dashboards.json']) writeFileSync(join(temp,path),JSON.stringify(fixture));
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 for(const family of ['martlet','krigsvold']) for(const framework of ['jekyll','astro','react'].filter(value=>!process.env.NIGHTJAR_TEST_FRAMEWORK||value===process.env.NIGHTJAR_TEST_FRAMEWORK)) for(const base of ['/','/preview/']) {
  const site=join(temp,'examples/jekyll',family),dist=join(temp,'empty-dist',framework,family);
  if(framework==='jekyll') run('bundle',['exec','jekyll','build','--baseurl',base==='/'?'':'/preview','--destination',dist],site);
  if(framework==='astro') run('npm',['run','build'],join(temp,'examples/astro-slice'),{NIGHTJAR_FAMILY:family,NIGHTJAR_BASE:base,ASTRO_TELEMETRY_DISABLED:'1'});
  if(framework==='react') run(process.execPath,['examples/react-catalog/build.mjs'],temp,{NIGHTJAR_FAMILY:family,NIGHTJAR_BASE:base});
  const built=framework==='jekyll'?dist:join(temp,'examples',framework==='astro'?'astro-slice':'react-catalog','dist',family);
  const server=createServer((req,res)=>{const path=new URL(req.url,'http://localhost').pathname;if(!path.startsWith(base)){res.writeHead(404).end();return;}const file=resolve(built,decodeURIComponent(path.slice(base.length)),path.endsWith('/')?'index.html':'');if(!file.startsWith(built+'/')){res.writeHead(403).end();return;}try{const data=readFileSync(file);const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff'};res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(data);}catch{res.writeHead(404).end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try {for(const javascriptEnabled of [true,false]){
   const context=await browser.newContext({javaScriptEnabled:javascriptEnabled,viewport:{width:320,height:900}}),page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(`http://127.0.0.1:${server.address().port}${base}examples/dashboard-administration/`,{waitUntil:'networkidle'});
   if(javascriptEnabled){
    const name=page.locator('#person-name'),email=page.locator('#person-email'),editor=page.locator('form').filter({has:name}),editButtons=page.getByRole('button',{name:/^Edit /}),first=editButtons.nth(0),second=editButtons.nth(1),add=page.getByRole('button',{name:'Add person'}),discard=page.getByRole('button',{name:'Discard draft'});
    // A bulk change may not silently replace a dirty editor or be undone by a stale pristine editor.
    await first.click();const person=await name.inputValue(),previousStatus=await page.locator('#person-status').inputValue(),targetStatus=previousStatus==='Suspended'?'Active':'Suspended';const bulk=page.getByRole('button',{name:targetStatus==='Active'?'Activate selected':'Suspend selected'}),rowChecks=page.locator('#people-table tbody input[type=checkbox]'),dialog=page.locator('dialog');
    await name.fill(person+' Edited');await rowChecks.first().check();await bulk.click();await expect(dialog).toBeHidden();await expect(name).toHaveValue(person+' Edited');await expect(name).toBeFocused();assert.match(await page.locator('main').innerText(),/Save or discard this draft before changing this person in bulk/);assert.equal(await rowChecks.first().isChecked(),true,'blocked action retains selection');await expect(page.locator('#people-table tbody tr').first()).toContainText(previousStatus);
    await rowChecks.first().uncheck();await rowChecks.nth(1).check();await bulk.click();await expect(dialog).toBeVisible();await dialog.getByRole('button',{name:'Confirm change'}).click();await expect(dialog).toBeHidden();await expect(name).toHaveValue(person+' Edited');await page.getByRole('button',{name:'Save person locally'}).click();await expect(page.locator('#people-table tbody tr').filter({hasText:person+' Edited'})).toContainText(previousStatus);await rowChecks.first().check();await bulk.click();await expect(dialog).toBeVisible();await dialog.getByRole('button',{name:'Confirm change'}).click();await expect(page.locator('#people-table tbody tr').filter({hasText:person+' Edited'})).toContainText(targetStatus);
    await page.reload({waitUntil:'networkidle'});await first.click();await rowChecks.first().check();await bulk.click();await expect(dialog).toBeVisible();await dialog.getByRole('button',{name:'Confirm change'}).click();await expect(dialog).toBeHidden();await expect(page.locator('#person-status')).toHaveValue(targetStatus);await name.fill(person+' Updated');await page.getByRole('button',{name:'Save person locally'}).click();await expect(page.locator('#people-table tbody tr').filter({hasText:person+' Updated'})).toContainText(targetStatus);
    await page.reload({waitUntil:'networkidle'});
    await name.fill('X');await page.getByRole('button',{name:'Save person locally'}).click();await expect(editor.locator('[role=alert]')).toBeVisible();
    const cdp=await context.newCDPSession(page),document=await cdp.send('DOM.getDocument');for(const [selector,expected,role] of [['#person-name','Full name','textbox'],['#person-email','Email address','textbox'],['#person-role','Role','combobox'],['#person-status','Person status','combobox']]){const inputNode=await cdp.send('DOM.querySelector',{nodeId:document.root.nodeId,selector}),ax=await cdp.send('Accessibility.getPartialAXTree',{nodeId:inputNode.nodeId,fetchRelatives:false});assert.equal(ax.nodes.find(node=>node.role?.value===role)?.name?.value,expected,`${family}/${framework}/${base}: editor field retains its computed accessible name`);}await expect(name).toHaveAccessibleDescription('Enter a name of at least two characters.');await expect(email).toHaveAccessibleDescription('Enter an email address.');await cdp.detach();await name.fill('Unsaved Example');
    await first.click();await expect(name).toHaveValue('Unsaved Example');await expect(email).toHaveValue('');await expect(editor.locator('[role=alert]')).toBeVisible();await expect(email).toHaveAccessibleDescription('Enter an email address.');await expect(name).toBeFocused();assert.match(await page.locator('main').innerText(),/Unsaved changes.*save or discard/i,'record switch explains how to retain or discard draft');
    await add.click();await expect(name).toHaveValue('Unsaved Example');await expect(name).toBeFocused();await discard.click();await expect(name).toHaveValue('');
    await first.click();const original=await name.inputValue();assert.notEqual(original,'');await name.fill('Edited Draft');await first.click();await expect(name).toHaveValue('Edited Draft');await expect(name).toBeFocused();assert.doesNotMatch(await page.locator('main [role=status]').first().innerText(),/Unsaved changes/,'reselecting the current record is not a context change');await second.focus();await page.keyboard.press('Enter');await expect(name).toHaveValue('Edited Draft');await expect(name).toBeFocused();await add.click();await expect(name).toHaveValue('Edited Draft');await page.getByRole('button',{name:'Save person locally'}).click();assert.match(await page.locator('#people-table tbody').innerText(),/Edited Draft/,'the retained draft can be saved');await second.click();assert.notEqual(await name.inputValue(),original,'pristine record switch works after save');await add.focus();await page.keyboard.press('Enter');await expect(name).toHaveValue('');await discard.click();
    await page.getByLabel('Full name').fill('New Example');await page.getByLabel('Email address').fill('new@example.invalid');
    await page.getByLabel('Email address').evaluate(input=>{const form=input.form;form.requestSubmit();form.requestSubmit();});
    assert.ok(await page.locator('#person-errors').isHidden(),'repeated submission does not raise an error after saving');const directory=page.locator('#people-table tbody');assert.equal(await directory.locator('tr').count(),3,'two simultaneous submissions create one record');assert.equal(await directory.locator('tr').filter({hasText:'New Example'}).count(),1);
    await page.getByRole('button',{name:'Edit New Example'}).click();await page.getByLabel('Full name').fill('Renamed Example');await page.getByRole('button',{name:'Save person locally'}).click();assert.equal(await directory.locator('tr').filter({hasText:'Renamed Example'}).count(),1,'editing affects the one newly created record');await page.getByRole('checkbox',{name:'Select Renamed Example'}).check();
    const trigger=page.getByRole('button',{name:'Suspend selected'});await trigger.click();await dialog.getByRole('button',{name:'Cancel'}).click();await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();assert.equal(await page.getByRole('checkbox',{name:'Select Renamed Example'}).isChecked(),true,'ordinary cancel keeps the selection');
    // Native Jekyll/Astro controllers can close and reopen in one turn before the queued close event.
    // React's controlled Dialog uses separately awaited user actions; its same-turn native close is covered by the packed Dialog consumer suite.
    if(framework!=='react')await page.evaluate(()=>{const open=document.querySelector('[data-bulk=Suspended]'),cancel=document.querySelector('[data-bulk-cancel]');open.click();cancel.click();open.click();});else{await trigger.click();await dialog.getByRole('button',{name:'Cancel'}).click();await trigger.click();}
    await expect(dialog).toBeVisible();await page.waitForTimeout(100);await expect(dialog.getByRole('button',{name:'Cancel'})).toBeFocused();await dialog.getByRole('button',{name:'Confirm change'}).click();await expect(dialog).toBeHidden();await expect(page.getByRole('checkbox',{name:'Select visible people'})).toBeFocused();assert.match(await directory.locator('tr').filter({hasText:'Renamed Example'}).innerText(),/Suspended/,'confirm after reopen applies the new action');await page.getByLabel('Full name').fill('Other Example');await page.getByLabel('Email address').fill('other@example.invalid');await page.getByRole('button',{name:'Save person locally'}).click();assert.equal(await directory.locator('tr').filter({hasText:'Other Example'}).count(),1);assert.match(await directory.locator('tr').filter({hasText:'Renamed Example'}).innerText(),/Suspended/,'saving after a bulk change preserves its status');await page.reload({waitUntil:'networkidle'});await page.getByLabel('Full name').fill('Click Example');await page.getByLabel('Email address').fill('click@example.invalid');await page.getByRole('button',{name:'Save person locally'}).click();await page.getByRole('button',{name:'Save person locally'}).click();assert.equal(await directory.locator('tr').filter({hasText:'Click Example'}).count(),1,'separate clicks do not duplicate a record');
   }else assert.ok(await page.getByRole('button',{name:'Save person locally'}).isDisabled());
   assert.deepEqual(errors,[]);await context.close();
  }console.log(`${family} ${framework} ${base}: rapid saves and confirmation reopen preserve selection, state and focus`);

  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
 }
} finally {if(browser)await browser.close();rmSync(temp,{recursive:true,force:true});}
