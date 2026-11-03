# Independent Astro starter browser checks

This is a **review-only**, nonpublishing test harness for the paired local patches in [the adoption report](../../../docs/qa/nightjar-iii-astro-adoption.md). It tests the real published package payloads with the proposed starter changes applied in temporary directories; it does not access a private source repository, publish an archive, deploy a site, or transfer authority.

## Inputs and provenance

The two fixture lockfiles pin Node-package inputs and npm `integrity` values. `astro5` pins Astro 5.18.2; `astro7` pins Astro 7.4.4. Both pin `@martlet/astro@1.2.2`, `@martlet/theme@2.2.2`, `@krigsvold/astro@1.2.2`, and `@krigsvold/theme@2.2.3`. A clean `npm ci` fetches these packages and transitive dependencies from npm; **this is not an offline install**. The registry packages were independently unpacked and compared byte-for-byte with every one of the 37 package files at Martlet source `ed1f121ae991fd868e757228664d1c3a737c3c10` and Krigsvold source `af57afbc6413d7690cea8a839c7c0e1d48e2730c`. `provenance.json` records those per-file SHA-256 values and the expected patched starter trees at local family commits `3c43243653a1f5a3acf3bca23e776177a53e2402` and `9e2cced9b4397c04f444a864c8eda4c0b43e75b2`. Npm integrity pins the theme package bytes; these are public registry artifacts, not an assertion that an arbitrary source checkout is identical to them.

The harness checks the complete installed Astro-package file map before copying, applies only `starter/**` hunks from the two reviewed zero-context patches to a temporary copy, then compares every resulting starter file against the expected patched tree. The mirrored `browser.mjs` and `subpath-check.mjs` match those candidate commits. The mirrored `form-checks.mjs` adds failure-only axe and computed-style diagnostics, retaining every original assertion; all three file hashes are checked against the provenance record. The Astro package components are unchanged by these patches. The consumer copies the registry theme into its temporary overlay, verifies the original CSS digest against the locally built pinned theme source, applies the reviewed distribution-only theme patch, and verifies the resulting CSS digest against the separately built source candidate. The registry installation remains untouched. The paired theme source patches and limitations are documented in [the transition review](../../../docs/qa/nightjar-iii-button-transition.md).

## Running

From the workbench root with Node 24 and an installed Playwright browser:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm ci --prefix scripts/qa/astro-starter-check/astro7 --ignore-scripts --no-audit --no-fund
NIGHTJAR_ASTRO_MATRIX=astro7 DESIGN_BROWSER=firefox node scripts/qa/astro-starter-check/run.mjs
```

Use `astro5` for the other lock, and `chromium`, `firefox` or `webkit` for `DESIGN_BROWSER`. Set `PLAYWRIGHT_EXECUTABLE_PATH` only for a compatible system Chromium if desired. Each family is built at root and `/preview`, then the original family browser and subpath checks exercise reading/layout, reflow, axe, keyboard, local form recovery and no-JS/CSP-blocked/partial initialization. The transition probe also samples enabled, focused, hovered and active button contrast in light/dark and normal/reduced motion. Only the five starter routes are tested; the 50 workbench recipes, dashboards and scientific workspace are **not** covered. The candidate workflow is PR-only, has read-only contents permissions, uses no secrets, does not upload artifacts, and performs no publication or deployment. Checkout and Node setup actions are pinned to commit SHAs resolved from their v4 refs during review; verify and deliberately update those pins when required. It installs browser dependencies on its ephemeral runner.

`npm audit` on October 31, 2026 reported five findings in the deliberately pinned Astro 5 compatibility fixture (one critical, three high and one low: Astro, sharp, zod, zod-to-ts and esbuild), and zero in the Astro 7 fixture. This compatibility test uses synthetic local content and does not justify deploying Astro 5 or dismissing production alerts. Check fresh advisories and reachability before any actual use. No manual assistive-technology or physical-print pass is claimed.
