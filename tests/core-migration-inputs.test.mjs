import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname,relative} from 'node:path';

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
 const fixtureRequire=createRequire(new URL(`../packages/${family}-react/package.json`,import.meta.url));
 const corePath=fixtureRequire.resolve(`@${family}/core/package.json`);
 assert.equal(JSON.parse(await readFile(corePath,'utf8')).version,version);
 const fixtureCore=lock.packages[relative(process.cwd(),dirname(corePath)).replaceAll('\\','/')];
 assert.equal(fixtureCore.resolved,`https://registry.npmjs.org/@${family}/core/-/core-${version}.tgz`);
 assert.match(fixtureCore.integrity,/^sha512-[A-Za-z0-9+/]{86}==$/);
 assert.equal(lock.packages[`packages/${family}-react`].dependencies[`@${family}/core`],version);
 const css=await readFile(`packages/${family}-react/src/styles.css`,'utf8');
 assert.match(css,new RegExp(`@${family}/core/css`));assert.doesNotMatch(css,new RegExp(`@${family}/theme`));
});

for(const family of ['martlet','krigsvold'])test(`${family}: app runtime resolves verified public packages separately from historical fixtures`,async()=>{
 const distribution=JSON.parse(await readFile('docs/distribution.json','utf8'));
 const release=distribution.families[family].packages.React;
 const lock=JSON.parse(await readFile('package-lock.json','utf8'));
 const runtime=lock.packages[`node_modules/@${family}/react-runtime`];
 assert.equal(runtime.version,release.version);assert.equal(runtime.resolved,release.tarball.url);
 assert.equal(runtime.integrity,release.tarball.integrity);assert.equal(runtime.link,undefined);
 const installed=JSON.parse(await readFile(`node_modules/@${family}/react-runtime/package.json`,'utf8'));
 assert.equal(installed.name,release.name);assert.equal(installed.version,release.version);
 assert.equal(installed.dependencies[release.core.name],release.core.version);
 const core=lock.packages[`node_modules/${release.core.name}`];
 assert.equal(core.version,release.core.version);
 assert.equal(core.integrity,distribution.families[family].packages.core.tarball.integrity);
});
