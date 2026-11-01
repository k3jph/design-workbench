# Standalone contact interaction contract

`node scripts/qa/portable-interactions.mjs --manifest /absolute/manifest.json --output /absolute/new-result.json --browser chromium --require-matrix` checks a narrowly defined, local built-output contract. Dependencies are the workbench's locked Playwright and axe packages. The runner serves each supplied built tree on loopback and never installs, fetches, builds, or deploys an implementation. Use reviewed local inputs. Browser checks can use `--browser firefox` or `--browser webkit`; `CHROMIUM_PATH` optionally selects a local Chromium executable.

Each target in the version-1 JSON manifest specifies `family`, `framework`, absolute `root` path, absolute `base` ending in `/`, and a full `source_commit`. An optional `catalog` object supplies an explicit local `{path, url}` for a versioned Astro archive's catalog request. The runner reads catalog bytes once and records their SHA-256. It hashes the entire site tree before and after testing, rejects symlinks and special files, refuses to replace an existing result, and records each claimed source commit. It **does not validate those source claims or prove how the output was built**. `--require-matrix` rejects a missing family/framework pair; it does not ensure every base is represented.

The shared contact form check exercises keyboard submission of whitespace, the error's focus and invalid state, correction, an immediate pointer retry, reset, the disabled no-JavaScript fallback, 320px reflow, request failures and an axe scan. This is one interaction, not full framework conformance. Incomplete axe results are recorded with their selectors and require assessment. The unit test includes an actual browser negative control that removes the contact form, plus manifest and missing-matrix rejection.

## Local six-implementation observation

The adjacent JSON records a Chromium 151 run of the contract on local candidate outputs for both languages and all three frameworks. Jekyll and Astro used `/preview/docs/v/2.0.0/`; React used `/preview/`. The Astro outputs were local archives generated from the claimed source commits, and their catalog was a synthetic local fixture, not a production catalog. The Jekyll outputs came from the local source checkouts named by the recorded commits. React gallery output was built before final documentation/CI and TypeScript declaration changes; the gallery source and lockfiles were reported unchanged. These are source claims, not independently verified attestations.

All six checks completed with zero reported axe violations. Axe marked `color-contrast` incomplete on each Jekyll page; it was not assessed as passing. All other examples, full keyboard coverage, manual assistive technology, visual equivalence, and real deployments remain unassessed. The three browser engines, root base paths and the final combined integration trees require separate checks.

## Investigation of the Jekyll contrast incompletes

The `color-contrast` checks identify gradients behind the text as the reason axe cannot calculate a background. To examine the same previously recorded **local output trees**, we hid each selected text element without hiding its ancestors, captured the entire text rectangle at 320 × 900 in Chromium 151 with reduced motion, and computed the minimum WCAG contrast against every 8-bit background color in the rectangle. This is conservative for that rectangle because it includes pixels where there is no text. The selected elements have transparent backgrounds, no ancestor opacity, filters, or blend modes, and their computed foreground alpha is composited into the calculation. The captured backgrounds and browser metadata are in `docs/qa/nightjar-iv-contrast/`.

| Family | Element | Minimum sampled contrast |
| --- | --- | ---: |
| Martlet | Eyebrow | 10.488:1 |
| Martlet | Page title | 15.459:1 |
| Martlet | Introduction | 12.032:1 |
| Krigsvold | Brand text | 18.624:1 |
| Krigsvold | Eyebrow | 18.005:1 |
| Krigsvold | Page title | 18.127:1 |
| Krigsvold | Introduction | 18.169:1 |

These values exceed the 4.5:1 threshold for normal text and 3:1 threshold for large text in this one rendered state. They do **not** turn axe's incomplete results into passes: the results do not verify other viewports, themes, pages, image assets, browsers, or the latest repository trees. In particular, the source commits in the adjacent report are caller claims rather than verified build provenance. Manual visual and assistive-technology assessment remains open.

We also sampled the later local Jekyll #6 archive builds at `/preview/docs/v/0.0.0-dev.0/`. The build provider identified the source heads as Martlet `dec2acedb91b0d1ae71ae8f6b17cfd3c34a2fc56` and Krigsvold `c162db57d8a0480fcb6f633c9bda07e4c2705891`; these source claims remain independently unverified. Their built-tree hashes, calculated by the same sorted path-and-content algorithm as the portable runner, were `0116ebd9b9dac58b89b41d53d49946b6dd10453f91cfb25b50e8f30bb8c404dc` and `f71b0efcb54b29d76b2451713df5ec4d7e53309a6fa2dc151860c4e8b30fbeb2`, respectively. The seven background images are byte-identical to the earlier observations, and all minimum contrast values in the table are unchanged. The separate `capture-current.json` files record the newer base path. This observation concerns only the named headings and brand in the enabled JavaScript state, not the complete application.

To reproduce, install the workbench's locked Playwright dependencies and Pillow, build the same candidate Jekyll output under `/preview/docs/v/2.0.0/`, and run:

```sh
CHROMIUM_PATH=/usr/bin/chromium node scripts/qa/gradient-contrast-capture.mjs /absolute/built/site martlet /absolute/new/evidence-directory
python3 scripts/qa/gradient-contrast-measure.py /absolute/new/evidence-directory
```

Use `krigsvold` in the second argument for the other family. The capture creates a new output directory and refuses to overwrite an existing observation. Compare built-tree hashes and source provenance independently before drawing conclusions about a newer candidate.
For another deployment base, append the absolute, slash-terminated base as the fourth argument.
