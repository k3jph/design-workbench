# Nightjar III authority and release inventory

This is a read-only baseline inventory, not an ownership transfer, release or approval to integrate. Observations were made on 31 October 2026. The Nightjar II candidate is workbench commit `80a5635abe4de7a07a1983de0b3ef796b101e047`, tree `b65bf1fd31c277048e7e4542130f34f7b0416ed4`, descended from Nightjar I `5138a89fc2956d9019d5bd720c987b8b9e24533b`. GitHub [#37](https://github.com/k3jph/design-workbench/pull/37) remained a draft at that exact head. Its hosted workbench `41153829102` and portable `41153829162` workflows completed successfully. The parent `main` observed remotely was `aafd9a8443e0c6cdc4afd6f973a605faa74b8f2c`; `git diff --stat aafd9a8 80a5635` reports 726 changed paths. Neither Nightjar candidate is a published release.

## Current source authority

The table names existing sources, not proposed future owners. Paths are relative to the named repository. The source-site shell hashes and contracts establish provenance, not a transfer of authority or full design conformance.

| Concern | Current source of change | Copies, dependencies and boundary |
| --- | --- | --- |
| Martlet theme tokens and style contracts | `martlettheme/npm`: `source.json`, `language.json`, `styles/`, `scripts/build*.mjs`, `docs/` | Built `dist/` and registry tarballs are products; source grammar refers to `k3jph/k3jph.github.io` at `32b7166a629ea696147d0d779d911b713e4baf7e`. |
| Krigsvold theme tokens and style contracts | `krigsvoldtheme/npm`: `source.json`, `language.json`, `styles/`, `scripts/build*.mjs`, `docs/` | Built `dist/` and registry tarballs are products; source grammar refers to `basuhoward/krigsvold.org` at `a3cf072c516c59ed35814e0fa153028cc91ceecd`. Maintain its distinct density, alignment, fonts and roles. |
| Source visual shells and origin contracts | Family source-site repositories: `site/` and `scripts/generate-shell.mjs`; workbench family exports record `_data/shell.json` | `examples/jekyll/martlet` records source-site `b588542b36cb67ed84a57700ce26ce845d475df9`, shell SHA-256 `d5cf12b35bac7b01cfb2c0298102454309fe979e19584c00490a21c93d500f45`; Krigsvold records `fa4a66c8675d9258f733250f1e32149c3622ea39`, shell SHA-256 `a65b1cbbe032d46be7373b1f3a90ca46ba1b3971fa85c98975cd9ec76394c05d`. Those hashes are metadata recorded by the generators, not evidence for every downstream file. Fonts and notices must remain attributable. |
| Canonical catalog and synthetic fixtures | Workbench `examples/page-archetypes/content/catalog.json`, `content/dashboards.json` | 50 catalog `pages`; administration, analytics and operations use shared fixture data. Scientific workspace is experimental and is not a 51st canonical recipe. |
| Shared contracts and cross-framework tests | Workbench `examples/page-archetypes/contracts/`, `INTERACTION-CONTRACTS.md`, `tests/`, `scripts/verify.mjs`, `docs/qa/nightjar-conformance.*` | Shared behavioral and semantic acceptance criteria; a 300-cell snapshot records bounded evidence, not comprehensive parity or accessibility certification. |
| Jekyll renderer and controller | Workbench `examples/page-archetypes/jekyll/`, `families/<family>/`, `scripts/sync.py` | The actual 189 Martlet and 181 Krigsvold export paths are inventoried individually in [the machine-readable map](nightjar-iii-jekyll-authority.csv). `examples/jekyll/<family>/` is currently a generated/seeded export, not an independently owned upstream. `_layouts/default.html`, `_config.yml` and `index.md` are transformed in place and require a single-owner decision before cutover. |
| Cross-framework domain models | Workbench `examples/page-archetypes/jekyll/assets/js/dashboard-model.mjs` and related shared model modules | Astro and React consumers import current shared models from the Jekyll source path. Removing this path as part of extraction would break other frameworks until an explicitly reviewed ownership and import transition. |
| Astro implementations and package surfaces | `martlettheme/astro` and `krigsvoldtheme/astro`: `src/components/*.astro`, `src/index.ts`, `src/styles.css`, `package.json` | Workbench `examples/astro-slice/src/` is a separate reference implementation composed with package dependencies, not equivalent to the standalone package's entire API. Local repo `main` candidates are 1.2.2; registry `latest` is 1.1.0 and `next` is 1.2.2 for both. |
| React implementation and public contracts | Workbench `packages/martlet-react/src/index.tsx`, `src/styles.css` and corresponding Krigsvold paths; `docs/components.md`; `scripts/test-*-consumer.mjs` | Each exports Button, Field controls, Notice, Badge, DataTable, AppShell, Dialog, Checkbox, Fieldset, Disclosure, ErrorSummary, TableOfContents, Article, FileInput, Radio, Pagination, DefinitionList, Switch and Tabs. Types and styles are part of the surface. The candidate is unreleased even though its package version matches a published version; see below. |
| Astro/React reference applications | Workbench `examples/astro-slice/src/`, `examples/react-catalog/src/` | App-specific dashboards, shell adaptations and interaction state are not automatically reusable package exports. Cross-framework tests prove selected observable behavior, not identical implementation or pixel equality across families. |
| Generated archives, reference builds and agents | Workbench `scripts/package-preview.mjs`, `scripts/build-knowledge.mjs`, `mcp/agent-lock.json`, `scripts/reference-release/`, `docs/distribution.json` | Locally generated archives and build artifacts are products; source sites consume checksum-pinned published reference archives. Rebuilding a workbench candidate does not repoint or patch a deployed site. |
| Conformance runner and evidence | Workbench `examples/page-archetypes/tests/`, `playwright.dashboard.config.ts`, `.github/workflows/jekyll-examples.yml`, `docs/qa/nightjar-conformance.*` | Current tests use workbench-shaped paths, bundled application builds and fixtures. `NIGHTJAR_JEKYLL_ROOT` names built sites, not independently pinned source checkouts; a repository-independent runner is future work. |

`python3 scripts/qa/nightjar-iii-authority.py --check` verifies the CSV against the current manifest and exported file bytes. It classifies each source path, detects shared/overlay collisions, verifies copied-source bytes agree and fails on missing or symbolic files. It separately identifies the source-site-generated shell and contract snapshot, checks their bytes against `_data/shell.json` and records their immutable origins. A temporary mutation to a copied Jekyll controller made the check fail; the original bytes were restored and the check passed. The record is an inventory, not a permission to modify a source or proof of attribution sufficiency.

The default CSV is the frozen `80a5635` snapshot and must not be silently regenerated when an integration intentionally changes Jekyll sources. To validate that baseline later, run the checker and its default CSV in a clean temporary checkout or archive of `80a5635`; both checker and CSV were introduced after that commit and must be copied into the temporary tree. On a later, separately committed implementation tree, use `python3 scripts/qa/nightjar-iii-authority.py --snapshot docs/qa/nightjar-iii-jekyll-authority-<revision>.csv` and then add `--check` to verify the **separate** snapshot. Record the exact source commit and tree beside it, compare path/authority/hash differences with the frozen CSV, and review any changed source-site origins before accepting them: this classifier's source-site revision mapping describes this frozen baseline and must be explicitly reviewed when source-site ownership changes. The Jekyll source-manifest updater reads the Git index, so also run its `--check` with intended integrated files staged and inspect untracked files separately. A checked manifest and CSV cannot establish that omitted untracked files belong in an archive.

## Seven repositories and verified main references

`git ls-remote origin refs/heads/main` was read-only and matched the local main checkout for each entry:

| Repository | Main SHA | Current role |
| --- | --- | --- |
| `k3jph/design-workbench` | `aafd9a8443e0c6cdc4afd6f973a605faa74b8f2c` | Shared laboratory, workbench React packages and publication orchestration. |
| `martlettheme/martlettheme` | `b588542b36cb67ed84a57700ce26ce845d475df9` | Martlet source site and shell reference. |
| `martlettheme/npm` | `0ee1de92350aa3c1f6c4abacc253a0a0e02fab1b` | Martlet core/theme package source. |
| `martlettheme/astro` | `ed1f121ae991fd868e757228664d1c3a737c3c10` | Martlet Astro package and starter source. |
| `krigsvoldtheme/krigsvoldtheme` | `fa4a66c8675d9258f733250f1e32149c3622ea39` | Krigsvold source site and shell reference. |
| `krigsvoldtheme/npm` | `5deb567f7afcd8bedb50f9ea3f3fb501bc2ae7a8` | Krigsvold core/theme package source. |
| `krigsvoldtheme/astro` | `af57afbc6413d7690cea8a839c7c0e1d48e2730c` | Krigsvold Astro package and starter source; repository visibility observed private. |

Repository visibility and authorization can change; the private Astro repository in particular requires an explicitly authorized access strategy for a future public runner. Remote metadata alone does not establish that packages, histories, deployment settings or prospective repository names are available for transfer.

## Registry and unreleased candidate collision

Read-only `npm view <package> dist-tags --json` found:

| Package | `latest` | `next` | Current checked-in source/candidate |
| --- | --- | --- | --- |
| `@martlet/theme` | 2.1.0 | 2.2.2 | `martlettheme/npm` 2.2.2 |
| `@krigsvold/theme` | 2.1.0 | 2.2.3 | `krigsvoldtheme/npm` 2.2.3 |
| `@martlet/astro`, `@krigsvold/astro` | 1.1.0 | 1.2.2 | both family Astro repos 1.2.2 |
| `@martlet/react`, `@krigsvold/react` | 0.1.0 | 0.1.0 | both workbench packages declare 0.1.0 but contain later unreleased changes |

The workbench Astro `package-lock.json` resolves the explicit registry tarballs Astro 1.2.2 and theme 2.2.2/2.2.3; the workbench React packages depend on their family theme **2.1.0**. Thus unqualified `npm install` selects different default theme/Astro versions from the versions used in the examples, and should not be represented as the same tested artifact.

Read-only `npm pack @<family>/react@0.1.0` downloaded the existing published archives; a fresh `npm ci --ignore-scripts`, `npm run build --workspaces` and `npm pack` built the candidate packages without publishing. For **both families**, `dist/index.js`, `dist/index.d.ts` and `dist/styles.css` differ between the existing registry version and the newly built candidate despite the identical declared version. The declaration diff adds optional `Field` `hintId` and `errorId`; identical exported names alone do not establish behavior or full compatibility. Martlet published/candidate `dist/index.js` SHA-256 is `f27188d009cf8fd51b520fac26a2416f9133090f7eaeb2497ff775bf1c0a4713` / `3f10e0cc5e539eeac6ef77176eb940d7a520c79469cc99d70a4cf3832c4a0a43`; Krigsvold is `facb54af528af71aa29f5bc806e002633278780edc19e2464c5102f168ae418a` / `dc330ba32950422b093c2bf5e2a7e41e9aa981ee8ae423fa6154ccc47c7a6c34`. A future release requires a distinct reviewed version and release authorization; existing published versions cannot be assumed to contain candidate fixes. Rehearsals must identify local tarball bytes and source SHA, not imply registry replacement.

The downloaded registry tarballs had SHA-256 `04178debb5c3873d97cd0a568d45bc9596dcff22c7cf493145cc27444f7f5c89` (Martlet) and `d04f167c2050c5a59ddc1225dc182ea71f19fd5f64eedf78b707b7b000111c90` (Krigsvold). Registry metadata reported SRI `sha512-UjoxzhtzlFpXkh+NL97B1xjSq/9nZS7LlsGDsu8FWVpcvSK5rtxOB9gUAij92SIYK3HSmNuZL5bst+lQoaQvHg==` and `sha512-oG4h+jwpAsaCdSuOb1NrN0RuhYGsidMCkUc5u4Ha0EcdlnT+nz//ORfd3GPanRfVNRXJ8I7vDPFnTi5FIf1l4A==`, respectively; compare actual bytes rather than treating a package version as sufficient identity.

## Frozen fixture and package identities

SHA-256 at `80a5635`:

| Input | SHA-256 |
| --- | --- |
| `examples/page-archetypes/content/catalog.json` | `4795e34b2eaea8fa506cca6d7679e93f38c6019cea704834ae736ef2064afd37` |
| `examples/page-archetypes/content/dashboards.json` | `9a0341f3789a9bf1c9a20cb6c31ace624a1400c3390de8131a305df372d87b35` |
| `examples/page-archetypes/contracts/catalog.schema.json` | `60785cc5f9d712419f06b45ef8a656016e0602c3516a6d455c69d8b84c979eeb` |
| `examples/page-archetypes/contracts/dashboards.schema.json` | `5c7cbcf973247bf2bf51002d2100e46c814e891aac009eb08cd882a201fb0b92` |
| `examples/page-archetypes/contracts/jekyll-source-files.json` | `d7ed87f23abd56bb758d83c8f6f957a27099aeb779a4850b53712aac67377b20` |
| `packages/martlet-react/src/index.tsx` | `653d8f81f967d5ba020e8d6e901d89ff0ca55f7cb67628a3e0b8b7b9815f6270` |
| `packages/krigsvold-react/src/index.tsx` | `6b56979c236684028cf0d9a7c839b1d6b9e56cbbd5965a72c43ee1c6d886f5dc` |

Fixture synchronization must use reviewed immutable inputs. `sync.py` overlays shared and family files onto seeded destinations, writes known generated pages but does not remove obsolete catalog pages. The source-manifest updater reads the Git index. A candidate assembled from a worktree with untracked or unstaged files may therefore differ from the manifest; do not equate an idempotent sync with clean reconstruction or silently delete unrelated consumer files.

## Release and security gates

The workbench main-push workflow can invoke `reference-release.yml`; its package job creates and uploads archives, then later jobs can create a tag/prerelease and initiate host adoption/deployment. A manually dispatched preparation path and a published `react-v` prerelease path also invoke reference work; `publish.yml` separately invokes `npm publish`. Ordinary verification also creates internal build archives. The [Nightjar II proposal](nightjar-ii-publication-proposal.md) is a model and checklist, not active production protection; no conclusion about GitHub environment settings, other external hosting triggers or old rerunnable workflows follows from it. Main pushes, releases, publication, adoption and deploys remain unauthorized.

The separate source-site security drafts remain [Martlet #32](https://github.com/martlettheme/martlettheme/pull/32) at `6dfce8703cb31f4ae84092806b3dd6ccff9534b5` and [Krigsvold #31](https://github.com/krigsvoldtheme/krigsvoldtheme/pull/31) at `1a0f3c13aa04200308e031398d4b79f81c745704`; both remained open and draft on inspection. They update Astro 5 to 7.3.3 with Node ≥22.19 and need platform/Cloudflare review before any deployment. Separately bundled site Workers and downloaded agents retain their own provenance and may contain Zod 4.3.6; the Nightjar II generator/guard changes do not retroactively patch published artifacts or prove deployed exploitation. At the previous assessment GitHub reported 65 default-branch Dependabot alerts (4 critical, 25 high, 24 moderate, 12 low); individual records require authorized security-admin access. Root `npm audit` only covers the examined lockfile, not those records, bundled Workers or published archives.

Manual assistive technology, physical printing, representative visual review and the 18 Firefox plus 18 WebKit incomplete contrast findings remain open. Issue #42 authorizes local rehearsals and reviewable branches only; remote Jekyll/React repository creation, authority handoff, merges, publishing and deployment each require a separate, concrete authorization.
