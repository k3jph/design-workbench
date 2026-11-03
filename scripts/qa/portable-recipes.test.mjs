import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium,firefox,webkit} from '@playwright/test';
import {checkRecipes} from './portable-recipes.mjs';
test('browser recipe audit rejects missing routes, broken assets and missing landmarks',async()=>{
 const root=await mkdtemp(join(tmpdir(),'recipe-contract-'));let browser;
 try{
  const engine=process.env.NIGHTJAR_TEST_BROWSER??'chromium';assert.ok(['chromium','firefox','webkit'].includes(engine));
  browser=await {chromium,firefox,webkit}[engine].launch(engine==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
  const target={root,base:'/preview/',family:'martlet',framework:'react',source_commit:'a'.repeat(40)},dir=join(root,'examples','home');await mkdir(dir,{recursive:true});
  const good='<html lang="en"><meta name="viewport" content="width=device-width"><main><h1>Home</h1></main></html>';
  await writeFile(join(dir,'index.html'),good);
  const passed=await checkRecipes(browser,target,[{id:'home'}]);assert.equal(passed.states.length,2);
  await assert.rejects(checkRecipes(browser,target,[{id:'home'},{id:'missing'}]),/canonical route missing/);
  await writeFile(join(dir,'index.html'),good.replace('</main>','<img src="/preview/missing.svg" alt="Missing"></main>'));
  await assert.rejects(checkRecipes(browser,target,[{id:'home'}]),/local asset failures/);
  await writeFile(join(dir,'index.html'),'<h1>Home</h1>');
  await assert.rejects(checkRecipes(browser,target,[{id:'home'}]),/one main landmark/);
 }finally{await browser?.close();await rm(root,{recursive:true,force:true});}
});
