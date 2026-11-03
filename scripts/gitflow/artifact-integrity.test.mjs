import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifiedRegistryArtifact} from './artifact-integrity.mjs';

test('registry bytes, advertised integrity and package identity must all agree',()=>{
  const bytes=Buffer.from('reviewed package bytes');
  const meta={name:'@example/core',version:'1.2.3',dist:{integrity:`sha512-${createHash('sha512').update(bytes).digest('base64')}`}};
  assert.equal(verifiedRegistryArtifact(bytes,bytes,meta,'@example/core','1.2.3'),true);
  assert.equal(verifiedRegistryArtifact(bytes,Buffer.from('tampered'),meta,'@example/core','1.2.3'),false);
  assert.equal(verifiedRegistryArtifact(bytes,bytes,{...meta,name:'@other/core'},'@example/core','1.2.3'),false);
  assert.equal(verifiedRegistryArtifact(bytes,bytes,{...meta,version:'1.2.4'},'@example/core','1.2.3'),false);
  assert.equal(verifiedRegistryArtifact(bytes,bytes,{...meta,dist:{integrity:'sha512-invalid'}},'@example/core','1.2.3'),false);
});
