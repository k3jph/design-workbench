# React experimental release policy

Experimental release workflow · October 25, 2026. Source and all components, styles, specifications, patterns, and reference applications remain MIT and freely available. The separate distribution record reports observed publication; this policy does not claim verified stable accessibility.

**Current authority, 7 November 2026.** Both independent React repositories have published 0.2.0 on npm `latest`, using their matching Core packages. Historical `next` remains 0.1.0. Private workbench copies and the original workbench publication/archive procedures below are retained as historical context, not instructions to reactivate a second publisher. Current release preparation follows each independent repository and the ratified [GitFlow policy](GITFLOW-ACCEPTANCE.md); preserve trusted publishing, protected tags, provenance and required npm stage approval. See [current distribution](distribution.md). Maturity evidence does not add a human-review requirement to GitFlow integration.

The public design-language preview is 0.3.0. Preview releases may remain below 1.0; support follows explicit contracts and documented maturity. Package versions are independent. See [preview scope and canonical homes](preview-0.3.md).

## Compatibility and versions

Current independent React 0.2.0 targets React 19, ES modules and modern browser CSS, with matching Core dependencies. Original React 0.1.0 pinned theme 2.1.0. The packed consumer check currently verifies React/ReactDOM 19.3.1; it does not establish every React 19 minor or other rendering framework. The local registry requires Node 24.19 or later within Node 24. Database schema 2 and API/export schema 1 remain unchanged by browser drafts/settings.

The original experimental 0.1.0 release remains on the historical `next` channel; current independent 0.2.0 is published on `latest`. The initial packages do not replace existing theme or Astro packages. While below 1.0, incompatible API changes increment the minor version and include migration examples; compatible additions and corrections increment patch versions. Every release records public API, visual contract, behavioral and accessibility changes, supported dependencies, known limitations, and source commit. The families may release independently; shared behavior changes must be checked against both consumers.

Before 1.0, adopt and publish a stable support policy. Proposed minimum: deprecated stable APIs remain available for at least six months and until the next major version, whichever is later. Removal needs a named replacement, migration steps, examples, and an announced date. This proposed support window is not an existing maintenance guarantee.

## Original workbench release preparation (historical)

1. Complete clean installation, builds/native-ref types, Node tests, supported-browser regression checks, packed-package consumer checks, and visual review at the exact proposed commit.
2. Review manual assistive-technology observations and real consumer evidence separately from automated results. Label remaining gaps prominently; experimental publication never certifies every component stable.
3. Confirm package ownership and configure npm trusted publishing for the correct repository/workflow/environment. Keep credentials out of source. Set public access explicitly for scoped packages.
4. Prepare package-specific changelogs and migration examples. Verify all declared exports, CSS, declarations, README, LICENSE, NOTICE, dependency pins, source links and included files in the actual tarballs.
5. Remove each package's private flag only in the release change; publish the verified tarballs with provenance under `next`. Keep the default `latest` tag unchanged until a separately reviewed stable release decision.
6. Install the actual registry versions in an independent example; inspect package contents and confirm both light/dark family presentations. Announce only the versions and capabilities actually available.

A manual `Prepare experimental React candidates` workflow now gates candidate creation on clean builds, Node checks, three browser engines and isolated package consumers at the same commit. It uploads tarballs and a JSON manifest with source commit, integrity, SHA-256, included files and remaining release steps. It has read-only repository permissions and no npm publication step or publishing credential. Local preparation after successful checks uses `node scripts/prepare-release.mjs both FULL_SOURCE_COMMIT` (or select one family). Package changelogs are included in each tarball.

The release manifests use `private: false`, public access, `next` and provenance. The publication workflow accepts only a GitHub pre-release tagged `react-v0.1.0` that matches both package versions and belongs to main history. It reruns clean checks, three browser engines, package and agent consumers, and compiled Worker checks before separate family publication jobs. npm scope ownership and trusted-publisher configuration remain external requirements. Publication success must be verified from the registry, not inferred from a merged PR. A readiness observation in the registry does not publish anything.

## Rollback and migrations

Never silently replace a published tarball. Correct a bad experimental release with a new patch/minor and an explicit upgrade note; deprecate a defective version with a useful explanation when appropriate. Keep database backups independent of package rollback. Browser specification drafts and workspace preferences use versioned, origin-scoped keys; unknown formats are retained and explained rather than reinterpreted. A fresh origin, port, browser profile, cleared storage, or unavailable storage cannot recover those copies. Source-site changes remain deliberate consumers of generalized fixes, with their own validation.

## Original reference-host archive pipeline (historical)

The tested React reference sites have a separate archive/adoption pipeline, documented in [reference automation and setup](reference-automation.md). Existing verification gates publication of commit-qualified `design-v…` prereleases. The exact archived bytes pass three-browser reference tests before publication; each host adoption PR pins the version, source commit and SHA-256. Strict host CI protection gates merging, followed by Cloudflare and live `/preview.json` verification. This does not change the experimental npm publication job or its trusted-publisher configuration.
