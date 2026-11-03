/** Build the shared reference with reviewed standalone packages; never publishes or deploys. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,cp,mkdtemp,realpath,symlink} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve,join,dirname,relative,sep,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
const options={};for(let i=2;i<process.argv.length;i+=2){assert.ok(/^--[a-z-]+$/.test(process.argv[i])&&process.argv[i+1],'Expected --option value');options[process.argv[i].slice(2)]=process.argv[i+1];}
for(const name of ['repo','consumer','inputs','out'])assert.ok(options[name],`Missing --${name}`);
const repo=await realpath(resolve(options.repo)),consumer=await realpath(resolve(options.consumer)),out=resolve(options.out),inputPath=resolve(options.inputs),input=JSON.parse(await readFile(inputPath,'utf8'));
const sha=value=>createHash('sha256').update(value).digest('hex'),hex=value=>/^[a-f0-9]{40}$/.test(value??''),sourceRef=options['source-ref']??input.sourceRef;
assert.equal(input.schemaVersion,1);assert.ok(hex(sourceRef));const outputRelative=relative(repo,out);assert.ok(outputRelative==='..'||outputRelative.startsWith('..'+sep)||isAbsolute(outputRelative),'Output must be outside authoritative source repository');
const tree=execFileSync('git',['rev-parse',sourceRef+'^{tree}'],{cwd:repo,encoding:'utf8'}).trim();
let publicCommit=null;
if(input.publicSourceProof){const p=input.publicSourceProof;assert.equal(p.localCommit,sourceRef);assert.equal(p.localTree,tree);assert.equal(p.publicTree,tree);assert.equal(p.readBackVerified,true);assert.ok(hex(p.publicCommit));publicCommit=p.publicCommit;}
await mkdir(out,{recursive:true});const source=await mkdtemp(join(out,'.source-'));
const archive=execFileSync('git',['archive',sourceRef,'docs-app','docs/languages','docs/components.md','docs/distribution.json'],{cwd:repo,maxBuffer:64*1024*1024});execFileSync('tar',['--same-permissions','-x','-C',source],{input:archive});await symlink(join(consumer,'node_modules'),join(source,'node_modules'),'dir');
const {build}=await import(pathToFileURL(join(consumer,'node_modules/vite/dist/node/index.js')).href);
const lock=JSON.parse(await readFile(join(consumer,'package-lock.json'),'utf8')),distributionBase=JSON.parse(await readFile(join(source,'docs/distribution.json'),'utf8'));
const sourceVersion=(await readFile(join(source,'docs-app/src/data.ts'),'utf8')).match(/implementationVersion\s*=\s*['"]([^'"]+)/)?.[1];
assert.equal(input.families.length,2);assert.deepEqual(input.families.map(x=>x.family).sort(),['krigsvold','martlet']);
const output=[];
for(const item of input.families){
 const family=item.family,name=`@${family}/react`,archivePath=resolve(dirname(inputPath),item.archive),bytes=await readFile(archivePath);assert.equal(sha(bytes),item.sha256,'Reviewed archive mismatch');assert.equal('sha512-'+createHash('sha512').update(bytes).digest('base64'),item.integrity,'Reviewed SHA-512 integrity mismatch');assert.ok(hex(item.sourceCommit));
 assert.equal(item.version,sourceVersion,'Frontend and standalone implementation versions differ');
 const installed=join(consumer,'node_modules',name),pkg=JSON.parse(await readFile(join(installed,'package.json'),'utf8'));assert.equal(pkg.name,name);assert.equal(pkg.version,item.version);
 for(const file of ['package.json','dist/index.js','dist/index.d.ts','dist/styles.css']){const reviewed=execFileSync('tar',['-xOzf',archivePath,'package/'+file]);assert.equal(sha(await readFile(join(installed,file))),sha(reviewed),'Installed implementation differs from reviewed archive: '+file);}
 const coreName=`@${family}/core`,core=lock.packages?.[`node_modules/${coreName}`];assert.equal(core?.version,item.core.version);assert.equal(core?.integrity,item.core.integrity);assert.ok(core.resolved?.startsWith('https://registry.npmjs.org/'),'Core must use genuine registry lock provenance');
 const published=item.registryProof?.registryVerified===true&&item.registryProof?.provenanceVerified===true;
 if(published){assert.equal(item.registryProof.sha256,item.sha256);assert.ok(hex(item.registryProof.sourceCommit));}
 const sourceCommit=published?item.registryProof.sourceCommit:item.sourceCommit,delivery=structuredClone(distributionBase.families[family]);
 delivery.packages.React={...delivery.packages.React,name,version:item.version,published,tag:'latest',repository:`https://github.com/${family}design/react`,sourceCommit,core:{name:coreName,version:core.version},tarball:{url:`https://registry.npmjs.org/@${family}/react/-/react-${item.version}.tgz`,sha256:item.sha256,integrity:item.integrity,available:published,source:published?'Independently verified registry archive and workflow provenance':'Reviewed standalone candidate; authenticated registry publication pending'},install:`npm install ${coreName}@${core.version} ${name}@${item.version} react@19 react-dom@19`};delete delivery.packages.React.theme;
 await mkdir(join(source,'mcp/catalogs'),{recursive:true});await writeFile(join(source,'mcp/catalogs',family+'-distribution.json'),JSON.stringify(delivery,null,2)+'\n');
 const aliases=[{find:new RegExp(`^@${family}/react/styles\\.css$`),replacement:join(installed,'dist/styles.css')},{find:new RegExp(`^@${family}/react$`),replacement:join(installed,'dist/index.js')},{find:new RegExp(`^@${family}/core/fonts\\.css$`),replacement:join(consumer,'node_modules',coreName,'dist/fonts.css')}];
 for(const [label,base] of [['root','/reference/'],['preview','/preview/reference/']]){
  const target=join(out,family,label),modules=[];
  await build({configFile:join(source,'docs-app/vite.config.ts'),mode:family,base,resolve:{alias:aliases,dedupe:['react','react-dom']},build:{outDir:target,emptyOutDir:true},plugins:[{name:'reviewed-standalone-implementation-audit',generateBundle(){modules.push(...this.getModuleIds())}}]});
  assert.ok(modules.some(id=>id.includes(`/node_modules/@${family}/react/dist/index.js`)),'Standalone implementation absent');
  assert.ok(!modules.some(id=>id.includes('/packages/martlet-react/')||id.includes('/packages/krigsvold-react/')||id.includes(`/node_modules/@${family}/theme/`)),'Competing workspace or legacy theme runtime bundled');
  const agentProof=[];await mkdir(join(target,'agents'),{recursive:true});
  for(const agent of item.agents){assert.ok(agent.name===`${family}-builder.zip`||agent.name===`${family}-agent-tools.tar.gz`);const path=resolve(dirname(inputPath),agent.archive),b=await readFile(path);assert.equal(sha(b),agent.sha256,'Agent archive mismatch');await cp(path,join(target,'agents',agent.name));agentProof.push({name:agent.name,sha256:agent.sha256,sourceCommit:agent.sourceCommit,final:agent.final===true});}
  assert.equal(agentProof.length,2);
  const proof={family,framework:'react',mount:base,sharedReferenceSource:{repository:'k3jph/design-workbench',localCommit:sourceRef,commit:publicCommit,gitTree:tree,publicSourceVerified:publicCommit!==null},standaloneImplementation:{repository:`${family}design/react`,sourceCommit,name,version:item.version,archiveSha256:item.sha256,integrity:item.integrity,registryPublicationVerified:published},core:{name:coreName,version:core.version,integrity:core.integrity,resolved:core.resolved},agents:agentProof};
  await writeFile(join(target,'reference-provenance.json'),JSON.stringify(proof,null,2)+'\n');output.push({family,label,base,root:target,proof,modules});
 }
}
await writeFile(join(out,'composition-results.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({sourceRef,publicCommit,tree,outputs:output.map(({family,label,root})=>({family,label,root}))}));
