import {readFile, writeFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
const refresh=process.argv[2] !== '--check';
const distribution=JSON.parse(await readFile('docs/distribution.json','utf8'));
for(const family of ['martlet','krigsvold']) {
  const dir=`docs/languages/${family}`, skill=`skills/${family}-builder/references`;
  if(refresh && process.argv[2] !== family) continue;
  if(refresh) {
    const core=resolve(process.argv[3]??''), commit=process.argv[4];
    if(!/^[a-f0-9]{40}$/.test(commit??'')) throw new Error('Usage: sync-language.mjs FAMILY CORE_CHECKOUT FULL_COMMIT, or --check');
    const snapshot={repository:`${family}theme/npm`,commit,files:{}};
    for(const [source,target] of [['docs/grammar.md','grammar.md'],['docs/source-decisions.md','decisions.md'],['language.json','implementation.json'],['docs/coverage.md','coverage.md'],['docs/patterns/forms.md','forms.md'],['docs/patterns/query-results.md','query-results.md'],['docs/native-html.md','native-html.md'],['docs/form-styling.md','form-styling.md']]) {
      const content=await readFile(join(core,source),'utf8');
      await writeFile(join(dir,target),content);
      snapshot.files[target]={sourcePath:source,sha256:hash(content)};
    }
    await writeFile(join(dir,'canonical.json'),JSON.stringify(snapshot,null,2)+'\n');
    for(const name of Object.keys(snapshot.files)) await writeFile(join(skill,name),await readFile(join(dir,name),'utf8'));
    await writeFile(join(skill,'source.md'),`# Source and framework support\n\nCanonical guidance: https://github.com/${snapshot.repository}/tree/${commit}. The bundled grammar and source decisions are exact copies of that revision; implementation.json records framework availability. Grammar 0.3 remains experimental.\n\nCurrent publication is separate from this immutable historical snapshot: Core ${distribution.families[family].packages.core.version}, Astro ${distribution.families[family].packages.Astro.version}, and React ${distribution.families[family].packages.React.version} are recorded in the connected MCP manifest and docs/distribution.json. Embedded implementation versions describe the pinned revision, not current npm channels. Read react-setup.md and astro.md for current installation and framework APIs. Legacy React 0.1.0 retains theme 2.1.0; do not transfer that dependency instruction to the independent 0.2 line. Shared grammar does not imply shared props or event/focus APIs.\n\nThe hosted read-only endpoint is https://${family}design.dev/mcp when available. The skill directory contains instructions and references only. The optional full agent archive contains a stdio server for offline/local transport; installing the skill does not install that server or create a remote connection. Check manifest family, sourceCommit and sourceDigest. Manual accessibility, localization/RTL and sustained use remain open.\n`);
  }
  const snapshot=JSON.parse(await readFile(join(dir,'canonical.json'),'utf8'));
  if(snapshot.repository!==`${family}theme/npm` || !/^[a-f0-9]{40}$/.test(snapshot.commit))throw new Error('Invalid canonical source for '+family);
  for(const [name,file] of Object.entries(snapshot.files)) {
    const content=await readFile(join(dir,name),'utf8');
    if(hash(content)!==file.sha256)throw new Error('Canonical guidance drift: '+family+'/'+name);
    if(content!==await readFile(join(skill,name),'utf8'))throw new Error('Offline skill drift: '+family+'/'+name);
  }
  console.log(`Verified ${family} canonical guidance at ${snapshot.commit}`);
}
