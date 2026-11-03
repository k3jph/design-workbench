# Nightjar IV standalone Jekyll portable check

On 2026-11-01 the portable runner checked 50 static catalog pages for each standalone Jekyll candidate at both root and `/preview`: 200 checks in Chromium. The complete machine-readable result is alongside this file. It includes the source commits, output digests, fixture pins and unassessed dimensions. Missing Astro and React targets are explicitly listed; this is not a six-implementation conformance result.

The runner local commit is `64e89b668368dead1290a290e2a65eeb2236779f`, whose source tree matches the first commit of this draft. It reported a dirty worktree because `node_modules` was an untracked symlink to preinstalled dependencies; runner and verifier hashes were recorded and checked unchanged by the runner. The input builds came from Git archives, excluding all worktree files.

| Input | Local source commit | Tree | Review draft at the time |
| --- | --- | --- | --- |
| Martlet Jekyll | `3974265910d12d5c0d3d4398a7df4cfbeaeed26b` | `c24b22c9aa537a5750b4dfa83ae44e6e9249773f` | `martletdesign/jekyll#1` head `3d1eda45dbd432d7850fd2479f6cd2d5c0a895a6` |
| Krigsvold Jekyll | `504b5823b11268cd424525eef0894451cd627dcb` | `af8ac28737a82d6f3c44389db7faa5eadd55d128` | `krigsvolddesign/jekyll#1` head `eb81a54dd1218228d36ad65f89aa04221e0114f0` |

The corresponding reviewed draft trees matched these trees at the time of execution. Recheck heads and tree equality before relying on this evidence. The strict declared-input flag was enabled but these Jekyll targets declare no package inputs, so it made no package-consumption assertion. Static HTML and experimental static science presence were checked; interaction, accessibility, visual identity, and the other fields listed in the result were not assessed.
