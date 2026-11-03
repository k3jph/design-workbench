// Produce local-only, attributed standalone candidates from the immutable Nightjar II tree.
// This script never creates a remote, publishes, or changes the source checkout.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';

const source='80a5635abe4de7a07a1983de0b3ef796b101e047';
const root=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
const args=process.argv.slice(2);
if(args.length!==2||args[0]!=='--out')throw Error('Usage: node scripts/nightjar3/react-extraction.mjs --out /path/to/new-directory');
const out=resolve(args[1]);
if(existsSync(out))throw Error(`Output already exists: ${out}`);
execFileSync('git',['cat-file','-e',`${source}^{commit}`],{cwd:root});
for(const family of ['martlet','krigsvold']){
 const lock=join(root,'fixtures/nightjar3/react-locks',`${family}-package-lock.json`);
 if(!existsSync(lock))throw Error(`Missing pinned rehearsal lock: ${lock}`);
}
mkdirSync(out,{recursive:true});
const files=['CHANGELOG.md','LICENSE','NOTICE.md','README.md','tsconfig.json','src/index.tsx','src/styles.css'];
for(const family of ['martlet','krigsvold']){
 const dest=join(out,family);mkdirSync(join(dest,'src'),{recursive:true});
 const prefix=`packages/${family}-react/`;
 const get=path=>execFileSync('git',['show',`${source}:${prefix}${path}`],{cwd:root});
 for(const file of files)writeFileSync(join(dest,file),get(file));
 const manifest=JSON.parse(get('package.json').toString());
 // The rehearsal must never be publishable by accident. Repository metadata
 // continues to identify the real source; no new family repository is implied.
 manifest.private=true;
 manifest.scripts={build:'node build.mjs'};
 manifest.devDependencies={'@types/react':'19.3.0','react':'19.3.1','typescript':'7.0.2'};
 writeFileSync(join(dest,'package.json'),JSON.stringify(manifest,null,2)+'\n');
 const lock=join(root,'fixtures/nightjar3/react-locks',`${family}-package-lock.json`);
 writeFileSync(join(dest,'package-lock.json'),readFileSync(lock));
 writeFileSync(join(dest,'build.mjs'),`import {rmSync,mkdirSync,copyFileSync} from 'node:fs';\nimport {spawnSync} from 'node:child_process';\nrmSync('dist',{recursive:true,force:true});mkdirSync('dist',{recursive:true});\nconst result=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','-p','tsconfig.json'],{stdio:'inherit'});if(result.status!==0)process.exit(result.status??1);copyFileSync('src/styles.css','dist/styles.css');\n`);
 writeFileSync(join(dest,'.gitignore'),'node_modules/\ndist/\n*.tgz\n');
 writeFileSync(join(dest,'PROVENANCE.md'),`# Local ${family} React extraction rehearsal\n\nAttributed snapshot from k3jph/design-workbench commit \`${source}\`, directory \`${prefix}\`. Component, style, license, notice, documentation and TypeScript configuration bytes are copied from that commit. Package metadata replaces only the build script, adds exact development dependencies, and marks this local rehearsal private. Build independently with Node 24 and \`npm ci --ignore-scripts && npm run build && npm pack --ignore-scripts\`. The lock file and build script are rehearsal additions. No source authority has moved; do not publish this snapshot or treat a local Git history as filtered upstream history.\n`);
}
console.log(`Created local-only candidates at ${out} from ${source}`);
