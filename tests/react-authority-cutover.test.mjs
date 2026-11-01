import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';

test('workbench workflows contain no npm publication or OIDC publisher', async()=>{
  const names=await readdir('.github/workflows');
  assert.ok(!names.includes('publish.yml'));
  for(const name of names.filter(name=>/\.ya?ml$/.test(name))){
    const workflow=await readFile(`.github/workflows/${name}`,'utf8');
    assert.doesNotMatch(workflow,/\bnpm\s+(?:publish|stage\s+publish)\b/,name);
    assert.doesNotMatch(workflow,/id-token:\s*write/,name);
  }
});

test('opt-in reference publication remains separately identifiable',async()=>{
  const manual=await readFile('.github/workflows/prepare-release.yml','utf8');
  const reference=await readFile('.github/workflows/reference-release.yml','utf8');
  assert.match(manual,/inputs\.publish_references/);
  assert.match(manual,/uses:\s*\.\/\.github\/workflows\/reference-release\.yml/);
  assert.match(reference,/scripts\/reference-release\/publish\.mjs/);
});
