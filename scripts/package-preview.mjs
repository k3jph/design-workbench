import {readFile,writeFile,cp,mkdir,mkdtemp,rm,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
const distribution=JSON.parse(await readFile('docs/distribution.json','utf8'));
const commit=process.env.DESIGN_SOURCE_COMMIT;
const artifactVersion=process.env.DESIGN_PREVIEW_ARTIFACT_VERSION??distribution.preview.version;
if(!/^[0-9A-Za-z.-]+$/.test(artifactVersion))throw new Error('Invalid preview artifact version.');
if(!/^[a-f0-9]{40}$/.test(commit??''))throw new Error('Set DESIGN_SOURCE_COMMIT to the reviewed source revision.');
execFileSync(process.execPath,['scripts/build-docs.mjs'],{stdio:'inherit',env:{...process.env,DESIGN_DOCS_BASE:'/'}});
await mkdir('preview-dist',{recursive:true});const entries=[];
for(const family of ['martlet','krigsvold']) {
 const dir=await mkdtemp(join(tmpdir(),'design-preview-'));
 try {
  const docs=join(dir,'react');await cp(`docs-dist/${family}`,docs,{recursive:true});await mkdir(join(docs,'licenses'),{recursive:true});
  const dependencies=['react','react-dom',`@${family}/theme`,`@${family}/core`,...(family==='martlet'?['@fontsource/cambo','@fontsource/cinzel','@fontsource/lato','@fontsource/ibm-plex-mono']:['@fontsource/roboto','@fontsource/roboto-slab','@fontsource/roboto-mono'])];
  for(const pkg of dependencies)await cp(`node_modules/${pkg}/LICENSE`,join(docs,'licenses',pkg.replaceAll('/','-').replace('@','')+'.txt'));
  await cp('LICENSE',join(docs,'licenses/workbench.txt'));await cp(`packages/${family}-react/NOTICE.md`,join(docs,'licenses/react-notice.md'));await cp('docs-app/brand/provenance.json',join(docs,'licenses/brand-provenance.json'));
  const metadata={family,preview:distribution.preview,artifactVersion,sourceCommit:commit,base:'/',readOnlyReference:true};await writeFile(join(docs,'preview.json'),JSON.stringify(metadata,null,2)+'\n');
  const archive=`${family}-react-reference-${artifactVersion}.tar.gz`,path=resolve('preview-dist',archive);
  execFileSync('tar',['--create','--gzip','--file',path,'--sort=name','--mtime=@0','--owner=0','--group=0','--numeric-owner','--directory',dir,'react']);
  entries.push({...metadata,archive,sha256:createHash('sha256').update(await readFile(path)).digest('hex'),bytes:(await stat(path)).size});
 }finally{await rm(dir,{recursive:true,force:true});}
}
await writeFile('preview-dist/manifest.json',JSON.stringify({version:distribution.preview.version,entries},null,2)+'\n');
console.log(JSON.stringify(entries.map(({family,archive,sha256,bytes})=>({family,archive,sha256,bytes}))));
