// Install a local tarball in a disposable consumer. No publish or staging calls.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const [archiveArg,name,version,expectedHash]=process.argv.slice(2);
if(!archiveArg||!/^@(martlet|krigsvold)\/core$/.test(name??'')||!/^\d+\.\d+\.\d+$/.test(version??'')||!/^[a-f0-9]{64}$/.test(expectedHash??'')) throw Error('Usage: node verify-consumer.mjs TARBALL @family/core VERSION SHA256');
const archive=resolve(archiveArg);assert.equal(createHash('sha256').update(await readFile(archive)).digest('hex'),expectedHash);
const tmp=await mkdtemp(join(tmpdir(),'nightjar-core-consumer-'));
try{
 await writeFile(join(tmp,'package.json'),JSON.stringify({name:'core-release-consumer',private:true,type:'module'}));
 execFileSync('npm',['install',...(process.env.CORE_CONSUMER_NETWORK==='1'?[]:['--offline']),'--ignore-scripts','--no-audit','--no-fund','--package-lock=false',archive],{cwd:tmp,stdio:'pipe'});
 const verify=`import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {readFile,access} from 'node:fs/promises';import {join} from 'node:path';
 const name=${JSON.stringify(name)},version=${JSON.stringify(version)};const req=createRequire(import.meta.url),pkg=req(name+'/package.json');
 assert.equal(pkg.name,name);assert.equal(pkg.version,version);assert.equal(pkg.private,false);assert.equal(pkg.license,'MIT');
 const esm=await import(name),cjs=req(name);assert.equal(esm.version,version);assert.equal(cjs.version,version);assert.deepEqual(esm.themes,cjs.themes);
 for(const key of Object.keys(pkg.exports)){const spec=key==='.'?name:name+key.slice(1);await access(req.resolve(spec));}
 for(const file of ['LICENSE','NOTICE.md']) await access(join(process.cwd(),'node_modules',name,file));
 const css=await readFile(req.resolve(name+'/fonts.css'),'utf8');const imports=[...css.matchAll(/@import\\s+['\"]([^'\"]+)['\"]/g)].map(x=>x[1]);assert.ok(imports.length>0,'Expected font imports');for(const spec of imports)await access(req.resolve(spec));
 for(const dep of Object.keys(pkg.dependencies||{}).filter(x=>x.startsWith('@fontsource/'))){const fontPkg=JSON.parse(await readFile(join(process.cwd(),'node_modules',dep,'package.json'),'utf8'));assert.ok(fontPkg.license);await access(join(process.cwd(),'node_modules',dep,'LICENSE'));}
 console.log(JSON.stringify({name,version,exports:Object.keys(pkg.exports).length,fontImports:imports.length,license:pkg.license}));`;
 await writeFile(join(tmp,'verify.mjs'),verify);execFileSync(process.execPath,['verify.mjs'],{cwd:tmp,stdio:'inherit'});
}finally{await rm(tmp,{recursive:true,force:true});}
