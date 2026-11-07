import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import distribution from '../docs/distribution.json' with {type:'json'};
import {checkedJekyllRelease,checkSharedFixtures,extractSourceZip,verifyInputs} from '../examples/page-archetypes/scripts/build-independent-inputs.mjs';

test('independent inputs retain the accepted Jekyll source identity and reject unverified or cross-family archives',()=>{
 for(const family of ['martlet','krigsvold']){
  const release=distribution.families[family].packages.Jekyll;assert.equal(checkedJekyllRelease(family,release),release);
  for(const mutate of [x=>x.version='0.0.0-bootstrap.0',x=>x.published=false,x=>x.sourceZip.available=false,x=>x.sourceZip.sha256='unknown',x=>x.sourceZip.url='https://unrelated.invalid/source.zip',x=>x.sourceCommit='main']){
   const changed=structuredClone(release);mutate(changed);assert.throws(()=>checkedJekyllRelease(family,changed));
  }
 }
});
test('foreign reference sources must retain both complete shared datasets before their builders run',async()=>{
 const root=await mkdtemp(join(tmpdir(),'independent-data-test-'));
 try{
  await mkdir(join(root,'_data'));
  const catalog=JSON.parse(await readFile('examples/page-archetypes/content/catalog.json','utf8'));
  await writeFile(join(root,'_data/examples.json'),JSON.stringify(catalog));
  await writeFile(join(root,'_data/dashboards.json'),await readFile('examples/page-archetypes/content/dashboards.json'));
  await checkSharedFixtures(root,'jekyll');
  catalog.pages[0].title='Different canonical meaning';await writeFile(join(root,'_data/examples.json'),JSON.stringify(catalog));
  await assert.rejects(checkSharedFixtures(root,'jekyll'),/differs from shared semantic data/);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('source ZIP extraction rejects path escapes, symlinks, duplicate names and oversized expansion before writing payloads',async()=>{
 const root=await mkdtemp(join(tmpdir(),'independent-zip-test-'));
 try{
  for(const kind of ['valid','escape','symlink','duplicate','expanded']){
   const archive=join(root,kind+'.zip'),out=join(root,kind);
   const create=spawnSync('python3',['-c',String.raw`
import stat,struct,sys,zipfile
path,kind=sys.argv[1:]
with zipfile.ZipFile(path,'w') as archive:
 entry=zipfile.ZipInfo('../escaped' if kind=='escape' else 'Gemfile')
 if kind=='symlink':entry.create_system=3;entry.external_attr=(stat.S_IFLNK|0o777)<<16
 archive.writestr(entry,'source')
 if kind=='duplicate':archive.writestr('Gemfile','second')
if kind=='expanded':
 data=bytearray(open(path,'rb').read());offset=data.index(b'PK'+bytes([1,2]));struct.pack_into('<I',data,offset+24,129*1024*1024);open(path,'wb').write(data)
`,archive,kind],{encoding:'utf8'});assert.equal(create.status,0,create.stderr);
   const extracted=spawnSync('python3',['-c',extractSourceZip,archive,out],{encoding:'utf8'});
   if(kind==='valid'){assert.equal(extracted.status,0,extracted.stderr);assert.equal(await readFile(join(out,'Gemfile'),'utf8'),'source');}
   else assert.notEqual(extracted.status,0,kind);
  }
  await assert.rejects(access(join(root,'escaped')));
 }finally{await rm(root,{recursive:true,force:true});}
});
test('an incomplete source build cannot be accepted as a complete advisory input set',async()=>{
 const root=await mkdtemp(join(tmpdir(),'independent-incomplete-test-'));
 try{await writeFile(join(root,'inputs.json'),JSON.stringify({schemaVersion:1,complete:false}));await assert.rejects(verifyInputs(root),/all six independent inputs/);}
 finally{await rm(root,{recursive:true,force:true});}
});
