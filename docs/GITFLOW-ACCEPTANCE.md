# GitFlow acceptance and deployment authority

**Decision (7 November 2026).** Both Martlet and Krigsvold are complete design languages with independent implementations. GitHub owns acceptance. The deployment host publishes the exact accepted source and verifies the artifact; it does **not** rerun GitHub's deliberation over pull requests, reviewers, or CI history.

## Branch meaning

| Ref | Authority | Expected behavior |
| --- | --- | --- |
| `feature/*`, `fix/*`, `release/*`, `hotfix/*` | Candidate only | May fail to build or test; an isolated, noindex preview is optional and never a production approval |
| `develop` | Accepted integration | Authorizes development deployment at its exact current commit |
| `main` | Accepted production | Authorizes production deployment at its exact current commit |
| Protected `v*` tag | Immutable published version | Source releases are independently reproducible, uniquely versioned, and never overwritten |

A branch may be revised repeatedly before acceptance. No successful candidate check, preview deployment, second human reviewer, or production-grade attestation is required merely to *work* on a candidate. Failure is a result, not a governance incident.

## Acceptance belongs to GitHub

The accepted-branch rules must be enforced on **both** `main` and `develop`:
- Pull-request integration (0 required human approvals in these single-maintainer repositories); the actual merge is the acceptance event.
- No branch deletion, history rewrites, or bypass of branch protection.
- A small, authoritative automated acceptance job. Other matrices and extended browser, visual, security, compatibility, archival and rehearsal checks can run as useful **advisory** jobs. They are not mandatory preconditions unless explicitly promoted to an acceptance requirement.
- Both merge commits and squash merges are allowed; select the appropriate method for the change. Prefer squash for routine feature work into `develop`; preserve meaningful release merges into `main`.
- A failure of an *optional* check does not prevent work on a candidate. A failure of the *required* check prevents acceptance, not experimentation.

All nine repositories now have active GitFlow branch rulesets in addition to protected version tags. GitHub ruleset status remains an independently verifiable configuration fact: a sentence, workflow or Cloudflare script alone does not establish enforcement. Inspect the current configuration read-only when needed; do not recreate the existing controls because an older audit recorded a different state.

### Minimum required check per repository

| Repository | Required GitHub Actions check | Extended CI |
| --- | --- | --- |
| `martletdesign/core`, `krigsvolddesign/core` | `verify` | Archive/provenance rehearsal and npm staging |
| `martletdesign/astro`, `krigsvolddesign/astro` | `accept` | Six Astro-version/browser compatibility jobs, documentation and remote-archive experiments |
| `martletdesign/react`, `krigsvolddesign/react` | `test` | Browser/gallery matrices, published provenance and release rehearsal |
| `martletdesign/jekyll`, `krigsvolddesign/jekyll` | `verify` | Three-browser conformance, deterministic archives, visual crop tests and PR previews |
| `k3jph/design-workbench` | `accept` | Broad cross-framework matrix, visual reference tests and distribution rehearsals |

These choices deliberately distinguish **minimum safe acceptance** from **comprehensive quality measurement**. Test failures in advisory suites should be visible and actionable, but need not force every candidate to idle.

`python3 scripts/governance/apply-gitflow-rules.py` prints the reference configuration without GitHub writes. Its `--apply` mode is an administration tool for a separately authorized configuration change, not an integration or deployment prerequisite. The current consolidation requires no ruleset changes and must preserve immutable version-tag protections.

## Deployment contract

1. Select the target from an actual accepted ref: `develop` → development, `main` → production. Treat other refs as optional isolated previews only.
2. Confirm the checked-out Git SHA and native builder-reported branch/SHA, and reject a superseded accepted-branch ref. A bounded public Git ref lookup is sufficient; **do not query PRs, reviews, commit check-runs or GitHub REST approval history** while deploying.
3. Build from the exact checkout. Validate source allowlist, deterministic archive/digests, and intended runtime configuration.
4. Publish only the appropriate environment. Check the live artifact identity and critical bytes, and retain tested rollback behavior.
5. Report the actual deployed version, SHA, and verified URL. A successful source merge is **not** itself evidence that Cloudflare completed deployment.

Any deployment that cannot establish its source identity or artifact integrity fails safely. Do not replace those checks with a weak manifest. There is no need for a second attestation system when one organization owns repository acceptance and hosting.

## Publication remains separate

A deployment does not itself create a public version. The versioned Jekyll source release still requires a unique, protected `v*` tag pointing at eligible `main` history, correct `VERSION`, deterministic `source.zip`, verified `SHA256SUMS`, and genuine GitHub Release assets. npm packages require the established registry-provenance and trusted-publishing steps. Do not overwrite or bypass tags, releases, registry stage approvals, or security requirements.

## Evolution

The two languages should share semantic, representative-data, behavioral and accessibility contracts across the 50 canonical examples while preserving separate visual grammars. Core, Astro, React and Jekyll remain independently authored and versioned implementations. They may diverge naturally after the accepted baseline; no common website template or synchronized package version is required.

**Principle:** GitHub determines what is accepted; deployments faithfully deliver that exact accepted source. Candidate branches are allowed to fail.
