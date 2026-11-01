# Nightjar IV final engineering integration: evidence and remaining gates

This document is a point-in-time review record. The production release gate is **not ready to activate**. Check the accompanying machine-readable ledger for exact PR heads, artifacts, and workflow observations; rerun checks after a branch changes. Workflow inventory uses the connector's recent-user PR results and first page of PR-triggered runs, not proof of all authors' PRs or all non-PR runs.

## Integration candidates

| Family | Core release draft | Astro archive/release | React archive/release | Jekyll archive/release |
| --- | --- | --- | --- | --- |
| Martlet | martletdesign/core#16 `b0de8de2b23745ad5b22905161fd84ccbc0e04b4` | martletdesign/astro#15 `43a858cffd144663b5316b2858272b370cf390ee` | martletdesign/react#6 `7ffe7b32ce2f250c8cae17bb4e85960d1a079f7c` | martletdesign/jekyll#6 `a243900a57e71dc0acb2ff3b853da6181d7325f9` |
| Krigsvold | krigsvolddesign/core#17 `7bd170cb4ae37a4125a73acc81b985e4cba4472f` | krigsvolddesign/astro#15 `82ac5eddbc5e870985c3e74d9e7435dd2901e05d` | krigsvolddesign/react#6 `4fdc39d3056b5b7db0414ea09870d97b4126628f` | krigsvolddesign/jekyll#6 `84a3884cd3f1c0c99ab315a207784ba59a27c7c7` |

All jobs for these eight heads were queued at the last observation. Queued is not a passing test. The earlier Astro #13, React source, Jekyll source/browser, and native exact-head workflows have successful hosted evidence in the ledger; those results do not verify later changes. The final candidates' local tests and emulators passed as recorded in the ledger. Read-only CI audit: `node scripts/qa/nightjar-ci-status.mjs docs/qa/nightjar-iv-ledger.json OWNER/REPO PR_NUMBER`. It requires an authenticated GitHub CLI and cannot prove a missing workflow was configured.

The previous workbench #76 Firefox/WebKit run 41357342583 failed because the extensibility smoke launched Chromium when only the matrix browser was installed. The corrected #76 head `e3cf607ca73ff20a21819c3d8eece8e6dbcb690e` selects the matrix engine without weakening assertions; rerun 41357794279 was queued. Historical workbench #34 and #38 failures remain attached to those intermediate drafts; the later form fix is in #40. Earlier Krigsvold Astro #11 failure was the form initialization timing issue; its draft and the independent #13 integration were corrected.

## Archive trust and known engineering gaps

Local archive gateways bound streaming writes, use conditional creation, validate catalog history, handle slashless redirects and MIME, and expose a separately served no-JS version index. First prereleases do not promote a nonexistent stable latest. Local two-version and R2-compatible emulator tests verify historical bytes and reject conflicts and tampering. Emulation does not establish live R2 controls; Miniflare may consume request chunks even when the worker stops reading.

The independent checkpoint verifier and ordered recovery sequence currently use simulated GitHub attestations and injected head-authority callbacks. A verified, independently protected anti-rollback head, live GitHub immutable-release and asset verification, real bucket isolation and serving integration are **not implemented or proven**. Privileged bucket writers can bypass gateway checks. Production workflows remain disabled and their documentation gate fails closed. Historical immutable pages created before the index link was added cannot be rewritten; discover later versions through the separately served index.

The full reference candidates cover 50 canonical recipes, but broad cross-framework interactions, visual parity and accessible behavior are not fully verified. The six-output shared Chromium form rehearsal is limited to caller-asserted build provenance. Axe reported Jekyll gradient contrast as incomplete. Pixel sampling at 320 × 900 found minimum 10.488–15.459:1 Martlet and 18.005–18.624:1 Krigsvold in the sampled regions; this is not evidence for all states or viewports. Manual screen-reader and physical-device testing has not occurred.

Jekyll shells accurately retain historical `@martlet/theme@2.2.2` and `@krigsvold/theme@2.2.3` provenance until a separate Core migration is reviewed. Chrome store prereleases need a numeric version strategy. The eight public hostname probes were denied by the executor proxy (curl 56, HTTP 000); this does not establish DNS, TLS or deployment failure. Workbench #72 contains proposed route fragments and read-only probes, not deployed configuration.

## Publication control and activation order

Current core direct-publish jobs on main are disabled; the existing pinned stage-only workflow remains enabled. Workbench main still has a release-event React npm publisher; #78 prepares its removal, and a separate opt-in reference release/adoption path remains. Do not activate dedicated React publishing until a reviewed authority transfer removes the competing npm path at the same cutover.

1. Complete and independently verify the protected anti-rollback head, GitHub attestation, R2 IAM, immutable archive verification, catalog/promotion recovery and real historical serving. Obtain read-only inventory of actual Cloudflare zones, DNS records, Worker routes, buckets, TLS, production branches and deployed revisions. Complete the queued exact-head checks and investigate any failures. Complete remaining interaction/accessibility and physical checks.
2. An administrator reviews and applies the [GitFlow checklist](https://github.com/k3jph/design-workbench/blob/feature/versioned-docs-contract/docs/qa/gitflow-administrator-checklist.md): protected reviewed PRs and required checks on main/develop; authorized creation of `v*` tags with separate no-update/no-delete controls; review bypass actors and back-merges. Verify the effective rules, rather than inferring them from a workflow. Preserve historical PR stacks.
3. After separate approval, integrate the reviewed dependency-ordered drafts. Remove conflicting release triggers atomically with their replacements; preserve core stage-only trust until the replacement is independently verified. The tag is the routine authorization; do not add a duplicate per-release approval.
4. Only after separate approval, configure npm trusted publishers for the exact organization, repository, workflow filename and environment listed in the administrator checklist. No long-lived npm token. Do not publish or push tags under this preparation order.
5. Only after separate deployment authorization, apply the reviewed Cloudflare route/DNS/TLS plan and verify stable historic URLs, catalog, integrity, rollback, root/subpath links and old-version availability externally. Change main-site links only after their destinations are verified.

## Recovery and rollback

Never automatically republish a version whose npm publication may have succeeded. Reconcile registry identity, bytes, integrity and provenance with the intended tag and original artifact; verify the protected tag and first-parent main history; then recover the missing GitHub Release only after verification. An ambiguous or mismatched state stops for review and requires a new version or approved correction, never overwriting a published version.

For documentation, retain all archive bytes and independent checkpoints. Verify the intended prior checkpoint/catalog and compare-and-swap the separately managed stable pointer; fail closed while pointer and checkpoint disagree. Restore previously inventoried DNS/Worker routes only under deployment authorization and verify public old-version URLs and caches. Do not delete or rewrite historical archives to perform a rollback.

No production merge, tag, package publication, release, DNS, Cloudflare, npm trust, or deployment was performed by this work.
