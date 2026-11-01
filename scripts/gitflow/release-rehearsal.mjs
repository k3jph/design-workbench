import {checkRelease} from './policy.mjs';

// Rehearsal only: every side effect is supplied by a caller; this function
// never reaches npm, GitHub or a shell by itself.
export async function rehearseRelease(input, adapters) {
  const decision = checkRelease(input);
  await adapters.install();
  await adapters.build();
  await adapters.test();
  const archive = await adapters.pack();
  if (!archive || !await adapters.inspect(archive, decision.version)) throw new Error('Archive inspection failed');
  await adapters.publish(archive, decision.distTag);
  if (!await adapters.verify(archive, decision.version)) throw new Error('Published archive verification failed');
  await adapters.release(input.tag);
}
