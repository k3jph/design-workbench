# Historical Core rehearsal inputs

These tarballs preserve the earlier contrast-corrected **private rehearsal** Core candidates and their original checksums. They are not the published registry archives and must never be published or approved as staged releases. Current workspace lockfiles resolve independently reviewed public `@martlet/core@2.2.3` and `@krigsvold/core@2.2.4` from registry URLs with registry integrity. Runtime and packed-consumer tests verify those public bytes through `scripts/reviewed-registry-core.mjs`; they do not install these historical fixtures. Legacy theme packages remain development dependencies only for the historical reference/compatibility lane.

| Package | Source commit | Version | SHA-256 |
| --- | --- | --- | --- |
| @martlet/core | 7200e334acc98d7fb14b61bef767d0e511e38df2 | 2.2.3 | e8a209a29db580d88a2d1c5e0a3a6158d5200c0dcbfeac6e063ce93d88cacbc5 |
| @krigsvold/core | 24d5a7eb9a25f4464f29c4d30e3c675e10ad4888 | 2.2.4 | 057539e5ff9afa518cc249ca8bf7966d13781028f77c279616dfa9293e9a29e1 |

React 0.2.0 publication belongs to each standalone React repository; the private workbench workspaces are conformance fixtures and have no active npm publisher. Final public dependency identities, immutable candidate source, normalized package modes, archive integrity and all consumer assertions must pass before the coordinator stages a standalone release. Current publication status is recorded in `docs/distribution.json` and the Issue81 coordination ledger. Never publish these fixture tarballs.
