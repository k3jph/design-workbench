# Nightjar IV consolidated continuation report

Observed November 1, 2026, America/New_York (November 2 UTC). This updates the existing Nightjar IV coordination record; the [ledger](nightjar-iv-ledger.json) remains the single machine-readable coordination authority. Production readiness is **not established**.

Completed: authenticated inventory of all 19 repositories and available Cloudflare resources; exact-head workflow/job audit; stale production-history repairs across all 16 reusable language repositories; durable nonproduction checkpoint CAS/recovery rehearsals; fresh local package, native-editor, and framework checks. No production merge, release tag, npm publication, GitHub Release, ruleset/trust modification, Cloudflare change, website deployment, or browser-store submission occurred.

## Repository and exact-head hosted verification

The table records the original candidates, independently of the new stacked drafts below. All 17 non-websites are public; both websites are private. Krigsvold Astro is public. All original candidates and historic PR stacks are preserved. Workbench #74's passing result belongs to the pre-refresh commit shown; it does not verify the later evidence-only refresh commit containing this report. Its next checks must be assessed at that new exact head.

| Repository | Visibility | Candidate | Exact head | Workflow runs | Jobs |
|---|---|---|---|---|---|
| martletdesign/core | public | #16 | `b0de8de2b23745ad5b22905161fd84ccbc0e04b4` | 4 queued | 4 queued |
| martletdesign/astro | public | #15 | `43a858cffd144663b5316b2858272b370cf390ee` | 5 queued | 16 queued |
| martletdesign/react | public | #6 | `7ffe7b32ce2f250c8cae17bb4e85960d1a079f7c` | 9 queued | 39 queued |
| martletdesign/jekyll | public | #6 | `a243900a57e71dc0acb2ff3b853da6181d7325f9` | 2 queued | 5 queued |
| martletdesign/vim | public | #2 | `c362095a47e72a4576f43494e60f44213559fb08` | 3 queued | 3 queued |
| martletdesign/emacs | public | #2 | `e32d2fc69480b9d1d27b830705c0990d0a3f0318` | 3 queued | 3 queued |
| martletdesign/chrome | public | #2 | `5da73a2e3344bfd3843e7c1d1255bacd4c8a8d25` | 3 queued | 3 queued |
| martletdesign/firefox | public | #2 | `ab9ad694068c9fbf1c58a03fe47ef03b6da8a3ee` | 3 queued | 3 queued |
| martletdesign/website | private | #34 | `fae4502a5b1aa3d745c4f4d90171c717ccc76c8a` | 3 success | 5 success |
| krigsvolddesign/core | public | #17 | `7bd170cb4ae37a4125a73acc81b985e4cba4472f` | 4 queued | 4 queued |
| krigsvolddesign/astro | public | #15 | `82ac5eddbc5e870985c3e74d9e7435dd2901e05d` | 4 queued | 15 queued |
| krigsvolddesign/react | public | #6 | `4fdc39d3056b5b7db0414ea09870d97b4126628f` | 9 queued | 39 queued |
| krigsvolddesign/jekyll | public | #6 | `84a3884cd3f1c0c99ab315a207784ba59a27c7c7` | 2 queued | 5 queued |
| krigsvolddesign/vim | public | #2 | `19a6e71cdc94f2eac3c3ae3445d98169211b3f2b` | 3 queued | 3 queued |
| krigsvolddesign/emacs | public | #2 | `3b18a072691b81f127613cc17833e4323c834e06` | 3 queued | 3 queued |
| krigsvolddesign/chrome | public | #2 | `c87664eaf5a3a8dc2350a80b774c2be0a3b0b76b` | 3 queued | 3 queued |
| krigsvolddesign/firefox | public | #2 | `25f4154eba6b5e8dd8e81d260dc4b54cf8912aab` | 3 queued | 3 queued |
| krigsvolddesign/website | private | #32 | `dcdd8044891f4d9a824e1dbf71bdfb1bd139179c` | 3 success | 5 success |
| k3jph/design-workbench | public | #74 | `0a239137929f31e6948d5a3e2321f5b195b1a846` | 1 success | 3 success, 1 skipped |

The target audit contains 70 runs / 165 jobs: 151 queued primary/native jobs, ten successful website jobs, three successful workbench browser jobs and one skipped references job. Queued remains queued; skipped remains skipped. No redundant CI reruns were issued. Existing historic failures and older successes remain in the all-open-PR evidence, without being transferred to new heads. The [all-open-PR inventory](nightjar-iv-evidence/github-inventory.json) includes 143 PRs observed before creation of this continuation's drafts; new drafts are recorded separately below and in the same ledger. [Target job detail](nightjar-iv-evidence/github-target-jobs.json) retains job-level coverage.

## Implemented repairs and draft integration order

Sixteen isolated stacked drafts fix a concrete source-authority defect: first-parent ancestry trusted cached `origin/main` without requiring that its tip match the live advertised production branch. Missing, stale, malformed or ambiguous remote state now fails closed. Existing tag/source/checkout guards remain. This point-in-time comparison does not make a later remote change atomic or replace effective branch/tag protection.

The two additional Astro drafts implement a small, executable **nonproduction** head authority using a separate local bare Git repository, pinned bootstrap, bounded single-parent record lineage, identity/sequence validation and atomic expected-old `git update-ref` CAS. Six adversarial tests cover concurrent processes (exactly one winner), durable reopen, interrupted orchestration retry and unanchored history substitution. Production mode and configured remotes reject. A privileged local writer can rewind a ref: independent expected-current pins, isolated production identities and verified remote protections remain prerequisites. This rehearsal does not claim production anti-rollback protection.

| Draft | Exact tested head |
| --- | --- |
| [martletdesign/astro#17](https://github.com/martletdesign/astro/pull/17) | `f20b3ab9d7c8532e2baa9c83827b7f99b1d0a3cd` |
| [martletdesign/react#7](https://github.com/martletdesign/react/pull/7) | `dde837aef0484b5a7a34feb5f78d483b637897ef` |
| [martletdesign/jekyll#7](https://github.com/martletdesign/jekyll/pull/7) | `cb0abc2ba62736f12346893648f4cb92211b0f7b` |
| [krigsvolddesign/astro#17](https://github.com/krigsvolddesign/astro/pull/17) | `bd39ad1f210a6f1b7f068015cf58967b77f1e801` |
| [krigsvolddesign/react#7](https://github.com/krigsvolddesign/react/pull/7) | `bbee95fd0102c683cc5c5fa4bbcd1917826d29b4` |
| [krigsvolddesign/jekyll#7](https://github.com/krigsvolddesign/jekyll/pull/7) | `859a12bffb3a02ce07a3b03b41a4853a98d9ee18` |
| [krigsvolddesign/chrome#3](https://github.com/krigsvolddesign/chrome/pull/3) | `53116892b2f662609fde23090bd8774c4bbc7a6f` |
| [krigsvolddesign/core#18](https://github.com/krigsvolddesign/core/pull/18) | `037d98f4171e3753f92f50c8ec8685f394d2fab3` |
| [krigsvolddesign/emacs#3](https://github.com/krigsvolddesign/emacs/pull/3) | `d49c8051d928dfecfa8660ac9dea668400820d12` |
| [krigsvolddesign/firefox#3](https://github.com/krigsvolddesign/firefox/pull/3) | `e8bc1a3f962192dc6cb21d1cbfe63b9a9e118d8e` |
| [krigsvolddesign/vim#3](https://github.com/krigsvolddesign/vim/pull/3) | `4bc0f8d832626774c39f784a83f4f386978774f2` |
| [martletdesign/chrome#3](https://github.com/martletdesign/chrome/pull/3) | `672a72d45b0c81843f41857e31ee834d62bccd8b` |
| [martletdesign/core#17](https://github.com/martletdesign/core/pull/17) | `a803b330ec9f2c5d9bb98ec17cfb0d43affcf38d` |
| [martletdesign/emacs#3](https://github.com/martletdesign/emacs/pull/3) | `118ad2d54c8b741fcf690758c3de955120c2635b` |
| [martletdesign/firefox#3](https://github.com/martletdesign/firefox/pull/3) | `ae16962b0b6a82abda5e87f722fcf3c7231480de` |
| [martletdesign/vim#3](https://github.com/martletdesign/vim/pull/3) | `b79aa6193ee36e09e0ef0af212284d18a8c691ec` |
| [martletdesign/astro#18](https://github.com/martletdesign/astro/pull/18) | `408907b0057ee236fdfb4817c48bfd8cbf92f3fd` |
| [krigsvolddesign/astro#18](https://github.com/krigsvolddesign/astro/pull/18) | `2d3adcdba60c3966c48d6b2642b3ccf4afc627a9` |

Integrate each source safeguard only after its existing candidate parent; the Astro local-authority drafts target the new Astro safeguard branches. All remain draft and all observed new-head hosted workflows remain queued. No publication gate was activated.

New exact-head local results: Astro source safeguards 42/42 per family; Astro local-authority drafts 48/48; React builds and 33/33 per family; Jekyll release guards 13/13 plus fail-closed documentation gates 2/2 per family. Updated Core full suites pass 25 Martlet / 26 Krigsvold, with both release rehearsals passing. Updated native release suites pass nine cases per Chrome and seven per other native repository. Broader original-head and repaired-Jekyll archive evidence is distinguished in the ledger.

## Archive trust, storage, attestation and recovery

Existing create-only snapshots, manifests/checksums, historical catalog/promotion verification, version navigation, local archive reconstruction, MIME/routing and R2-compatible rehearsal architecture remain intact. Existing production documentation gates remain disabled/fail-closed. The new local authority exercises actual durable CAS, rather than only an injected mock callback, but cannot establish isolation against a privileged storage administrator.

Live independent head storage, authentic GitHub immutable-release and asset attestations, effective R2 create-only permissions, writer isolation, retention, trusted prior-catalog retrieval, public historical serving, stable promotion and remote CAS/recovery remain unproven. Astro/React contain integrated checkpoint verifiers; Jekyll candidates still lack the equivalent signed-checkpoint integration. Do not take both archive evidence and current-head pins from the archive publisher's own writable store.

The installed GitHub CLI is 2.46 and lacks `gh release verify` / `verify-asset`. All queried historic published GitHub Releases expose `immutable=false`; no new production release was created to manufacture a verification target. Local attestation fixtures remain simulations. A recent compatible CLI and a genuinely immutable release/checkpoint asset are required for an authentic end-to-end test. [Astro nonproduction authority instructions](https://github.com/martletdesign/astro/blob/feature/nightjar-iv-head-authority-rehearsal/infra/docs-archive/LOCAL-HEAD-REHEARSAL.md) describe the rehearsal and production prerequisites.

Fresh npm registry downloads of `@martlet/core@2.2.3` and `@krigsvold/core@2.2.4` match the supplied reviewed SHA-256 values and registry SHA-512 integrity. An isolated install with scripts disabled followed by `npm audit signatures` verified registry signatures and attestations for all nine installed packages, including both Core releases. This proves present published evidence, not future trusted-publisher setup. [Registry bytes](nightjar-iv-evidence/npm-core.json) and [verification output](nightjar-iv-evidence/npm-signatures.txt) are retained.

## Fresh cross-framework conformance evidence


Fresh verification of workbench PR76 exact head `e3cf607ca73ff20a21819c3d8eece8e6dbcb690e` and the six handoff framework heads. No production action or UI source change.

| Implementation | Exact source head |
| --- | --- |
| Martlet Astro | `43a858cffd144663b5316b2858272b370cf390ee` |
| Krigsvold Astro | `82ac5eddbc5e870985c3e74d9e7435dd2901e05d` |
| Martlet React | `7ffe7b32ce2f250c8cae17bb4e85960d1a079f7c` |
| Krigsvold React | `4fdc39d3056b5b7db0414ea09870d97b4126628f` |
| Martlet Jekyll | `a243900a57e71dc0acb2ff3b853da6181d7325f9` |
| Krigsvold Jekyll | `84a3884cd3f1c0c99ab315a207784ba59a27c7c7` |

Canonical catalog JSON is byte-semantically equal across all six implementations and the current shared 50-recipe catalog. `node scripts/qa/nightjar-conformance.mjs --check` verifies the existing 300-cell evidence snapshot, exported catalogs and route inventories; this consistency check does not rerun its historical tests.

The portable runner, contact interactions and framework extensibility test suites pass all 12 tests in Chromium, including browser negative controls for a missing form and rejection of incorrect source pins, undeclared inputs, output escape, replacement Git refs and concealed submodules. Extensibility fixtures are harness tests, not additional framework implementation evidence.

Both exact-head React candidates pass `npm test` and build galleries containing 47 content recipes, three dashboards, an experimental scientific workspace and an index. Both exact-head Astro candidates build fresh create-only archives with 57 HTML pages including the 50 canonical recipes. The Astro builder verifies exact Core registry integrity and canonical/static links. Built archives and galleries used `/preview/docs/v/2.0.0/` and `/preview/`, respectively.

Fresh static-output audit verifies all 50 canonical recipes in each of these four Astro/React outputs: 200 route/content checks. It checks representative fixture content, semantic headings, tables, header scopes and experimental science static results. This does not assess interactions, accessibility or visual conformance for those 200 pages.

Contact checks pass all four Astro/React outputs in Chromium 151.0.7922.173, Firefox 157.0 and WebKit 27.2: keyboard whitespace rejection, error focus/invalid state, correction, immediate pointer retry, reset, 320px reflow, reduced motion, page/request failures, disabled no-JavaScript fallback and axe. All these contact scans report zero violations and zero incomplete findings. Scope is one interaction per implementation at the tested deployment base. The catalogs served to Astro navigation were synthetic local fixtures, not authenticated production catalogs.

Machine-readable evidence is in `work/conformance-output/static-catalog.json` and `interactions-{chromium,firefox,webkit}.json`; output digests are included in the latter. Source attribution comes from fresh exact-head checkouts and builds performed in this session; the runner itself labels commit fields as caller claims and does not create cryptographic build attestations.

WebKit initially could not launch because system libraries were missing. Debian Trixie packages were downloaded and extracted under `work/conformance-runtime`, and an isolated browser bundle under `work/conformance-browsers` used those libraries. Host preflight was disabled only after the actual libraries were installed locally; the real WebKit browser then ran and passed. No system packages or production infrastructure changed.

Both exact-head Jekyll candidates now pass all 14 Python tests and the full standalone verification: root/subpath rendering, allowlisted source archive reproducibility and rebuild, safe mode, injected-markup escaping/sanitization, symlink and traversal rejection. Fresh standalone builds at root and `/preview/` succeed. Tests use a user-local Ruby 3.3.8, pinned Bundler 2.4.19 and frozen repository locks; hosted workflows use Ruby 3.2, so this is additional local evidence rather than a replacement for hosted checks. Manual screen-reader, physical-device, sustained usability, visual grammar comparison without color, full cross-framework interaction coverage, remain outstanding. No complete conformance or production readiness claim is made.

Fresh root/subpath static audit now covers all six implementations at both bases: **600 route/content checks**, saved in `work/conformance-output/static-catalog-full.json`. All source catalogs match the same 50-recipe canonical fixture. The full contact matrix passes in **Chromium 151.0.7922.173, Firefox 157.0 and WebKit 27.2: 36 output/browser checks**. Every implementation is covered at root and subpath. Each scan reports zero axe violations; all four Jekyll output/base combinations in each browser retain incomplete `color-contrast` findings caused by gradient contexts, so contrast is inconclusive. Astro/React report no incomplete findings. Evidence files: `work/conformance-output/interactions-full-{chromium,firefox,webkit}.json`. All six claimed implementation heads are the exact original candidate heads listed above; this evidence does not cover later safeguard implementation PRs. `source-attribution.json` records commit/tree identities, lock digests and zero tracked source changes.


## Native and release engineering

Both original Core candidates passed locked installation, build, full tests (24/25), archive inspection and nonpublishing release rehearsals. Original native candidates passed all eight artifact builds, four browser manifest suites, ten ZIP CRC checks and release absence/policy tests. User-local Debian package extraction supplied Vim 9.1, Neovim 0.10.4 and Emacs 30.1; all four original-head editor suites then passed. No system package installation or source assertion weakening occurred.

Chrome prerelease numeric `version` plus full SemVer `version_name` already works and passed an extra end-to-end temporary-package rehearsal. It was verified, not repaired. Prerelease/stable store ordering within a shared numeric version needs a maintainer distribution policy before any store submission. Firefox signing and store acceptance remain unverified; no store action occurred. Native artifacts keep their native distribution identities and have not been invented as npm packages.

Proposed Core/tag/native publishers remain disabled. Existing Core staged-publishing support remains. Workbench #78 prepares retirement of the competing React publisher; legacy Astro release-event publishing must be retired atomically with replacements. Do not create production GitHub Releases while those event triggers could publish unintentionally. Source versions already present in npm must receive new authorized versions before any future actual publication.

## Authenticated Cloudflare inventory and public serving

[Site readiness](nightjar-iv-site-readiness.md) records endpoint-specific findings and all eight intended hosts. Available authenticated reads establish account/zone ownership, proxied apex/React DNS, active certificate packs, enabled custom-domain associations, Worker settings and deployment/version IDs. Both main sites and both React hosts return public HTTPS 200. Main+React share the existing `martlettheme` / `krigsvoldtheme` Workers; independent React source deployment is not established by HTTP 200. Keep Worker names unchanged.

The four Astro/Jekyll requests encounter execution-proxy CONNECT 403 with no origin response. The returned complete intended-zone DNS and account custom-domain lists contain no entries for those hostnames. This is scoped inventory evidence; unreachable endpoints are not evidence of global resource absence. Known Worker settings expose only ASSETS and no R2 binding. Returned account bucket inventory contains no Nightjar archive bucket; object-level R2/S3 permission, retention and writer restrictions remain unverified.

User-token verification returned 401 while account/zone and many resource reads returned 200; no blanket invalid-token conclusion is drawn. Some script/route/build endpoints return authentication/header errors. Git connections, sole production branch and Preview Build filters remain maintainer-reported; enabled custom-domain previews=false is not proof of Git Preview Builds being disabled. Worker version IDs are verified, deployed source Git commits are not. Both zones report minimum TLS 1.0; Krigsvold reports SSL full, while Martlet SSL-mode lookup failed. No TLS settings were changed.

## GitFlow enforcement and administrator prerequisites

All 17 non-website repositories have `main` and `develop`, both reported `protected=false`, and zero visible repository/inherited rulesets. Branch-name workflows therefore do not demonstrate strict GitFlow enforcement. Both private websites intentionally remain exempt; their ruleset queries returned a plan-related 403, which does not establish absence. Administrator review must address plan restrictions, effective required checks/reviews, tag creation/update/deletion restrictions, bypass actors and release/hotfix back-merges before activation.

Preserve merge-commit history, release/hotfix back-merges, existing stacked PR ancestry, package identities and all historic versions. Private website drafts remain unmerged and undeployed. Their Cloudflare Git settings/navigation must be coordinated only after framework packages and destinations actually exist and pass verification.

## Ordered activation, nonproduction validation and recovery


Release readiness is NOT established. The following actions require the maintainer's separate production authorization; no production action was performed in this continuation.

1. Resolve runner capacity/account/organization conditions for queued original exact-head jobs. Do not issue blanket reruns. Once jobs execute, investigate actual failures, inspect skipped coverage, and require checks for the final integrated commits. Complete manual screen-reader, physical-device, keyboard/focus, reflow, and cross-framework interaction evidence.
2. Review the existing 17-repository GitFlow administrator checklist. Apply effective main/develop branch protections and protected SemVer tag creation/update/deletion rules, required reviewed PRs and checks, authorized actors and bypass controls. Re-query effective settings. Preserve historical PR stacks and merge commits. The two websites remain exempt; plan restrictions on private-repository ruleset queries require administrator assessment.
3. Provision a nonproduction archive environment only after approval. Scope ordinary archive writer credentials to creation of new release objects; isolate checkpoint/head authority and promotion from that writer. Demonstrate that direct privileged credentials cannot overwrite/delete old evidence, or constrain/replace those credentials until they cannot. Verify retention, conditional creation and CAS using actual remote operations; local gateway checks are insufficient.
4. Enable/use authentic immutable GitHub Releases with a sufficiently recent gh release verify and verify-asset implementation. Independently pin the checkpoint head and anchor. Verify prior checkpoint/catalog before new publication. Demonstrate authentic release attestation checks, missing/deleted asset rejection, rollback rejection and protected independent head advancement. Current Jekyll candidates lack the integrated trusted-checkpoint verifier available in Astro/React; complete reviewed integration before claiming equivalent security.
5. Integrate approved source candidates in dependency order, keeping publication disabled. Atomically retire competing workbench React and legacy Astro release-event publishers alongside their replacements. Keep existing Core stage-only support until verified replacement. Configure exact npm OIDC repository/workflow/environment identity and confirm independent package authority. Set new versions when current package version is already published.
6. After separate activation authorization and demonstrated gates, enable reviewed tag-driven workflows. The protected tag is the routine release authorization. Never push a production release tag or create a production GitHub Release while legacy release-event publishers could fire unexpectedly.
7. Publish/verify immutable snapshots and historical serving before deploying new framework sites. Verify release identity, all file hashes, root/subpath assets, stable/prerelease/unsupported navigation, topic preservation, no-JS index and old release URLs. Advance stable pointer and independent head with the reviewed CAS recovery procedure. Do not serve while pointer and independently protected head disagree.
8. Deploy framework destinations under separately reviewed Cloudflare configuration; preserve existing Worker names, main-site Git connection, production branch and preview settings. Current main+React hostname sharing needs explicit migration/route review. Record deploy IDs and source commits. Change main-site navigation only after actual destinations and history are verified. Website draft merges/deployments remain a separate decision.

Nonproduction validation procedure

Start from an approved exact candidate commit and locked dependencies. Run its existing complete test suite and documented archive/Miniflare rehearsals. Use the checkpoint-state CLI described in each Astro/React infra/docs-archive/CHECKPOINT.md with independently supplied asset digest, expected source commit, catalog head, promotion head, and test HTTPS archive origin. Fetch reviewed origin/main before verification; stale or missing local tracking refs must fail closed.

In an explicitly authorized isolated bucket/namespace and separately protected test head store, exercise: create archive; retry identical creation; reject differing creation; interrupt after a subset of files; deny catalog/latest/head promotion until complete verification; deny overwrite/delete of historical evidence with ordinary publisher identity; verify independent retained checkpoint when archive writer is compromised; test old catalog/head substitution rejection; run authentic immutable-release/asset verification; test two competing CAS writers; interrupt between pointer and independent-head update; recover original transition idempotently; verify every original historical URL and file hash. Do not substitute mocked signatures or localhost results for live security evidence. Production storage writes are not authorized by the current order.

Recovery

Package publication: on timeout/uncertainty stop automatic publication. Query exact registry version, fetch and compare original archive bytes, integrity, source/workflow identity and provenance. If correctly published, resume only missing downstream verified steps after approval. If absent, distinguish an authoritative absence from network/auth failure before a separately authorized retry. If mismatch/ambiguity remains, stop for review and a new version; never overwrite, republish, or deprecate an existing version.

Documentation: retain original archive and all catalog/checkpoint chains. Reconcile exact independently pinned old/new heads and verified immutable release asset. If interrupted writes are incomplete, finish only original exact bytes under approved create-only semantics before promotion. Retry promotion/head CAS with expected parents; reject a competing head. Keep serving fail-closed during disagreement. Rollback selects a separately authorized prior stable pointer with CAS and verified retained evidence; it does not rewrite historical archives or erase checkpoint lineage.

Site deployment: restore the inventoried prior deployment/version or route only after separate deployment approval; keep hostname/Worker names unchanged unless explicitly approved. Verify TLS, redirects, old/new history URLs, assets, cache behavior and source revision. Main-site navigation must follow verified destination availability. Preserve current production content and all historical snapshots.


## Evidence scope and remaining acceptance work

This report distinguishes actual implementation, local simulation, authenticated read-only observation and unverified production state. The original handoff records remain available through Git history. The ledger's self-referencing workbench head is necessarily the observed pre-refresh commit; consult the evidence-refresh commit and its exact-head checks when reviewing this document.

The remaining gates include hosted exact-head completion, effective GitFlow protections, signed-checkpoint integration for Jekyll, genuine immutable-release/asset verification, independently protected remote anti-rollback head and writer isolation, real historical serving/retention/promotion/recovery, atomic publishing-authority cutover, exact npm OIDC identities, and outstanding manual/cross-framework accessibility and visual assessment. Local localhost output and sampled axe scans cannot certify full accessibility or production readiness. No production switch was operated.
