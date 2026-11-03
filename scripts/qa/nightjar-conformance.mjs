import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

// Evidence snapshot: the statuses below record checks documented at this commit,
// not claims inferred merely from an implementation or from current test code.
const snapshot = '22612d2';
const catalog = JSON.parse(await readFile('examples/page-archetypes/content/catalog.json','utf8'));
const react = JSON.parse(await readFile('examples/react-catalog/src/selected.json','utf8'));
const {supported:astro} = await import(pathToFileURL(resolve('examples/astro-slice/src/supported.mjs')));
const ids = catalog.pages.map(page=>page.id);
assert.equal(ids.length,50,'Review the evidence snapshot when the catalog changes');
assert.equal(new Set(ids).size,ids.length,'Catalog IDs must be unique');
for(const [name,selected] of [['Astro',astro],['React',react]]){
 assert.equal(new Set(selected).size,selected.length,`${name}: duplicate route`);
 assert.deepEqual([...selected].sort(),[...ids].sort(),`${name}: routes do not match the snapshot`);
}
for(const family of ['martlet','krigsvold']){
 const exported=JSON.parse(await readFile(`examples/jekyll/${family}/_data/examples.json`,'utf8'));
 assert.deepEqual(exported,catalog,`${family}: Jekyll exported catalog drift`);
}
const dashboards = new Set(['dashboard-analytics','dashboard-administration','dashboard-operations']);
const interaction = {
 jekyll:new Set(['search','workspace','chat','sensors','scene','gallery','sign-in',...dashboards]),
 astro:new Set(['archive','search','workspace','fleet','chat','sensors','scene','gallery','contact','sign-in','sign-up','password-reset','two-factor','coming-soon','faq',...dashboards]),
 react:new Set(['archive','search','workspace','fleet','chat','sensors','scene','gallery','sign-in','two-factor','faq',...dashboards])
};
// Chromium initial-state axe scans covered all 50 routes in both families and
// frameworks in default and saved-dark appearances. This records that a scan
// ran; it does not reclassify incomplete color-contrast results as passes.
const axe = {jekyll:new Set(ids),astro:new Set(ids),react:new Set(ids)};
for(const group of [dashboards,...Object.values(interaction),...Object.values(axe)]) for(const id of group) assert.ok(ids.includes(id),`Unknown evidence ID: ${id}`);
const dimensions={languages:['martlet','krigsvold'],frameworks:['jekyll','astro','react']};
const cells=[];
for(const page of catalog.pages) for(const language of dimensions.languages) for(const framework of dimensions.frameworks){
 cells.push({example:page.id,language,framework,route_build:'checked',content_routing:'sampled',interaction:interaction[framework].has(page.id)?'sampled':'unrecorded',automated_accessibility:axe[framework].has(page.id)?'sampled':'unrecorded',responsive:(framework!=='jekyll'||dashboards.has(page.id))?'sampled':'unrecorded',visual_conformance:'not_assessed',manual_accessibility:'not_assessed',performance_conformance:'not_assessed'});
}
assert.equal(cells.length,300);
assert.equal(new Set(cells.map(c=>`${c.example}:${c.language}:${c.framework}`)).size,300);
const scientific={example:'scientific-workspace',status:'experimental',evidence_commit:'a20e968',languages:dimensions.languages,frameworks:dimensions.frameworks,route_build:'checked',interaction:'sampled',automated_accessibility:'sampled',responsive:'sampled',visual_conformance:'not_assessed',manual_accessibility:'not_assessed',performance_conformance:'not_assessed',scope:'12 local Chromium builds cover root and /preview/ across both languages and all three frameworks; see scientific-ports.mjs and SCIENTIFIC.md. Firefox/WebKit, manual assistive technology, physical print and full visual parity remain open. This is not a 51st canonical recipe.'};
const json={snapshot_commit:snapshot,recorded_date:'2026-10-29',dimensions,meaning:{checked:'A build or route check passed in the recorded run; not a claim of conformance.',sampled:'Recorded automated or interaction checks cover part of this dimension, not its full acceptance criteria.',unrecorded:'This snapshot does not attribute a completed check to this particular example; it is not a failure or a pass.',not_assessed:'No full conformance assessment was recorded; individual inspections or measurements may exist.'},scope:'Paired runs cover both languages. Root and /preview/ are covered by catalog checks; dashboards have separate suites. Axe records initial Chromium route scans only, including unresolved incomplete results. See the ledger for exact checks and caveats.',evidence:['docs/qa/nightjar-status.md','examples/page-archetypes/VERIFICATION.md','examples/page-archetypes/DASHBOARDS.md','examples/astro-slice/README.md','examples/react-catalog/README.md','examples/page-archetypes/CONTRAST-VERIFICATION.md','docs/qa/nightjar-conformance-review.md'],cells,experimental_examples:[scientific]};
const byKey = new Map(cells.map(cell=>[`${cell.example}:${cell.language}:${cell.framework}`,cell]));
const describe = cell=>['B',cell.interaction==='sampled'?'I':'—',cell.automated_accessibility==='sampled'?'A':'—',cell.responsive==='sampled'?'R':'—'].join(' ');
const rows=catalog.pages.map(page=>{
 const statuses=dimensions.frameworks.map(framework=>{
  const a=byKey.get(`${page.id}:martlet:${framework}`),b=byKey.get(`${page.id}:krigsvold:${framework}`);
  const relevant=({interaction,automated_accessibility,responsive})=>({interaction,automated_accessibility,responsive});
  assert.deepEqual(relevant(a),relevant(b),'Do not collapse language-specific evidence');
  return describe(a);
 });
 return `| ${page.id} | ${statuses.join(' | ')} |`;
});
const markdown=`# Nightjar conformance evidence snapshot\n\nSnapshot of evidence through workbench commit \`${snapshot}\` (October 29, 2026). The machine-readable [matrix](nightjar-conformance.json) contains all 300 example × language × framework cells. Each table entry below applies to both Martlet and Krigsvold because the cited suites ran both; visual identities were not compared for pixel equality.\n\n**B**: route generated and checked in the recorded build; **I**: at least one relevant interaction was exercised; **A**: automated axe checks were run on this example; **R**: recorded responsive checks include this example. A dash means this snapshot does not attribute that check to that specific example. Every I, A and R is partial evidence, not a comprehensive pass. The A marker records initial-state Chromium axe scans on all 50 routes in both families and frameworks, in default and saved-dark appearances. These scans do not cover all states and do not turn incomplete contrast findings into passes. The catalog suites check all 47 content routes at 320px for Astro and React; dedicated suites cover dashboards. The Jekyll baseline checked every generated route and local link; its dashboard suite includes reflow checks. Some additional Jekyll non-dashboard sweeps are documented in the ledger without a per-route result set, so they are not attributed here.\n\nNo cell claims complete visual conformance, manual assistive-technology review, or performance conformance. Limited screenshot reviews and local transfer-size measurements are recorded in the [progress ledger](nightjar-status.md); these do not establish full coverage. Automated axe checks and a route build do not certify accessibility, behavior, visual parity or release readiness. Error-page examples demonstrate content and do not set host HTTP error statuses. Hosted Firefox and WebKit smoke covered a bounded selection of routes and states; 16 contrast scans per engine reported incomplete results. Broader cross-engine interactions, screen-reader testing, print-on-paper, source-shell fidelity and full cross-framework comparisons remain open.\n\n| Example | Jekyll | Astro | React |\n| --- | --- | --- | --- |\n${rows.join('\n')}\n\n## Experimental scientific workspace

The separate scientific-workspace route is experimental and is not part of the 50-recipe canonical matrix. At evidence commit \`a20e968\`, 12 local Chromium builds covered both families × Jekyll/Astro/React × root/subpath, including index navigation, static model agreement, validation and recovery, actual CSV bytes, keyboard focus, 320/1440px reflow, light/dark axe and no-JavaScript/blocked-script fallbacks. Its B/I/A/R evidence is sampled; Firefox/WebKit, manual assistive technology, physical print and full visual parity remain unassessed. See [the scientific notes](../../examples/page-archetypes/SCIENTIFIC.md).

See [the structured conformance review](nightjar-conformance-review.md), [the bounded contrast review](../../examples/page-archetypes/CONTRAST-VERIFICATION.md), [the ledger](nightjar-status.md), [Jekyll verification](../../examples/page-archetypes/VERIFICATION.md), [dashboard contracts](../../examples/page-archetypes/DASHBOARDS.md), [Astro notes](../../examples/astro-slice/README.md) and [React notes](../../examples/react-catalog/README.md) for the scope and limitations of the recorded runs. This is a dated snapshot; regenerate only after reviewing new evidence, and update the snapshot identifier and evidence lists.\n\nTo check that the checked-in matrix still matches the canonical catalog and route inventories, run \`node scripts/qa/nightjar-conformance.mjs --check\`. A successful check verifies consistency, not that a historical browser test was rerun.\n`;
const outputs=[['docs/qa/nightjar-conformance.json',JSON.stringify(json,null,2)+'\n'],['docs/qa/nightjar-conformance.md',markdown]];
if(process.argv.includes('--check')){
 for(const [path,value] of outputs) assert.equal(await readFile(path,'utf8'),value,`${path}: snapshot out of date`);
 console.log('Verified 300 matrix cells, catalog identities, route inventories, exported catalogs and snapshot consistency.');
}else for(const [path,value] of outputs) await writeFile(path,value);
