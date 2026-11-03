import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

for (const [family,version,sha] of [
 ['martlet','2.2.3','e8a209a29db580d88a2d1c5e0a3a6158d5200c0dcbfeac6e063ce93d88cacbc5'],
 ['krigsvold','2.2.4','057539e5ff9afa518cc249ca8bf7966d13781028f77c279616dfa9293e9a29e1'],
]) test(`${family}: reviewed historical fixture and registry-backed package contract`,async()=>{
 const bytes=await readFile(`fixtures/core-candidates/${family}-core-${version}.tgz`);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),sha);
 const pkg=JSON.parse(await readFile(`packages/${family}-react/package.json`,'utf8'));
 assert.equal(pkg.private,true);assert.equal(pkg.dependencies[`@${family}/core`],version);
 assert.equal(pkg.dependencies[`@${family}/theme`],undefined);
 const lock=JSON.parse(await readFile('package-lock.json','utf8'));
 assert.equal(lock.packages[`node_modules/@${family}/core`].resolved,`https://registry.npmjs.org/@${family}/core/-/core-${version}.tgz`);
 assert.match(lock.packages[`node_modules/@${family}/core`].integrity,/^sha512-[A-Za-z0-9+/]{86}==$/);
 assert.equal(lock.packages[`packages/${family}-react`].dependencies[`@${family}/core`],version);
 const css=await readFile(`packages/${family}-react/src/styles.css`,'utf8');
 assert.match(css,new RegExp(`@${family}/core/css`));assert.doesNotMatch(css,new RegExp(`@${family}/theme`));
});
