import {createHash, timingSafeEqual} from 'node:crypto';

// Verify both the reviewed bytes and npm's advertised integrity, without
// assuming a successful publish makes registry contents trustworthy.
export function verifiedRegistryArtifact(reviewed, downloaded, metadata, expectedName, expectedVersion) {
  if (!Buffer.isBuffer(reviewed) || !Buffer.isBuffer(downloaded)) return false;
  if (metadata?.name !== expectedName || metadata?.version !== expectedVersion) return false;
  const integrity=metadata?.dist?.integrity;
  if (typeof integrity !== 'string' || !/^sha512-[A-Za-z0-9+/]{86}==$/.test(integrity)) return false;
  const digest=(bytes)=>createHash('sha512').update(bytes).digest();
  const expected=digest(reviewed), actual=digest(downloaded), advertised=Buffer.from(integrity.slice(7),'base64');
  return advertised.length===expected.length && timingSafeEqual(expected,actual) && timingSafeEqual(expected,advertised);
}
