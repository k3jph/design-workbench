import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

for (const [family,version,sha] of [
 ['martlet','2.2.2','e1fde61cdc818dbdc5b91eb77041111f5651316a63fc9dd3ab5d4dac9536011c'],
 ['krigsvold','2.2.3','c74177f9b344b7e517b138b5d0afa9ec0b6b78c1bfdf66f6ffe0570c60b26c66'],
]) test(`${family}: exact unpublished core input and package contract`,async()=>{
 const bytes=await readFile(`fixtures/core-candidates/${family}-core-${version}.tgz`);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),sha);
 const pkg=JSON.parse(await readFile(`packages/${family}-react/package.json`,'utf8'));
 assert.equal(pkg.private,true);assert.equal(pkg.dependencies[`@${family}/core`],version);
 assert.equal(pkg.dependencies[`@${family}/theme`],undefined);
 const lock=JSON.parse(await readFile('package-lock.json','utf8'));
 assert.equal(lock.packages[`node_modules/@${family}/core`].resolved,`file:fixtures/core-candidates/${family}-core-${version}.tgz`);
 assert.equal(lock.packages[`packages/${family}-react`].dependencies[`@${family}/core`],version);
 const css=await readFile(`packages/${family}-react/src/styles.css`,'utf8');
 assert.match(css,new RegExp(`@${family}/core/css`));assert.doesNotMatch(css,new RegExp(`@${family}/theme`));
});
