# Nightjar III: button enable-transition contrast

This is an offline, unapproved source-patch rehearsal. It does not publish, deploy, push a family repository, or change the frozen workbench candidate. The source fixes belong to each family's theme repository; no Astro-local override or shared visual identity is introduced.

## Reproduction

The Astro 7 / WebKit starter review at workbench run `41217867827`, job `124586067311`, failed its existing axe color-contrast assertion for Krigsvold's submit button immediately after validation. Stable source-profile endpoints compute as white on `#061325` (18.62:1) and white on `#286a9d` (5.77:1); that failure alone did not establish its cause.

A separate Chromium probe exercised the actual installed 2.2.3 Krigsvold theme in the patched Astro starter: after a disabled button was enabled, the text changed immediately to white while the background animated for 0.15 seconds from disabled `rgb(228,237,240)` to enabled navy. The first frame had 1.19:1 contrast, and subsequent animation frames included additional low-contrast combinations. Martlet theme 2.2.2 independently showed the same real transition at 1.23:1: white on disabled `rgb(226,232,240)`. These are measured Chromium results. The timing matches the hosted WebKit observation, but this probe does not by itself establish the exact WebKit frame; failure-only hosted diagnostics remain in the review workflow. No axe result was suppressed or reclassified.

## Paired source candidates

Both theme packages transition button background and border colors, but switch text color immediately when the native disabled state changes. The candidates remove the background-color transition while retaining the border-color transition and all existing color values, focus behavior and disabled styling. Background changes therefore occur with their matching text colors; hover/active visual values and family identities remain unchanged.

| Family | Current source base | Local candidate commit | Source patch |
| --- | --- | --- | --- |
| Martlet | `0ee1de92350aa3c1f6c4abacc253a0a0e02fab1b` | `ec566e182fd5fc1520a037b851fcc213969fbace` | [martlet-source.patch](nightjar-iii-theme-patches/martlet-source.patch) |
| Krigsvold | `5deb567f7afcd8bedb50f9ea3f3fb501bc2ae7a8` | `e6662c08a74041b4f54e131fc176d0d67e7420f1` | [krigsvold-source.patch](nightjar-iii-theme-patches/krigsvold-source.patch) |

Each zero-context source patch applies cleanly to its exact clean base with `git apply --check --unidiff-zero`. Applying it to a temporary index reconstructs the candidate source tree exactly. The family checkouts were not pushed: their checked-in workflows include verification on pushes and npm publication on a published release, but external deployment integrations could not be fully enumerated. An operator must separately assess any delivery to those repositories.

For both candidates, `npm ci --ignore-scripts`, `npm run build` and `npm test` passed (Martlet 12 tests; Krigsvold 13). The [`nightjar-iii-button-transition.mjs`](../../../scripts/qa/nightjar-iii-button-transition.mjs) consumer probe failed on both unmodified npm artifacts, then passed in Chromium for both patched themes across light and dark appearance and normal and reduced motion. It samples immediate and subsequent animation frames when enabling, plus focus, hover/hover exit and active states; it requires 4.5:1 for these enabled small-text controls. This is a bounded Chromium test of actual computed RGB values, not WCAG certification or a claim of completed manual assistive-technology review.

## Distribution testing only

The current published `@martlet/theme@2.2.2` and `@krigsvold/theme@2.2.3` `dist/components.css` bytes match the locally built CI-pinned source revisions `7e130a937b730292e940deb4c41a9b164ef0b0a2` and `86e610a6f5f79115d740d1c989fcbc71c1ef52f4` respectively. The local source candidates at those pinned bases rebuild the same patched CSS bytes as the current-source candidates. The adjacent `*-distribution.patch` files are review/test-only transformations of those installed package files, allowing a temporary npm consumer to exercise exactly the rebuilt CSS without publishing any package. They do not modify an installed production package or replace source authority.

| Family | Original `dist/components.css` SHA-256 | Patched SHA-256 |
| --- | --- | --- |
| Martlet | `afb2d998812513f1d19c4188a018b1ea708f7b98eba8cd7769b66d905f88ed42` | `5717163461ab07677220802a34aa0aff5565f50b694a2a98b2aea136d6372130` |
| Krigsvold | `581f66deef28efa1c07ce7a6273b92cc78f1a3db0fb888ec0f2ce1249378e1c1` | `b86baa13324c4cbafd830cb4761d3ab7a155d24922f3f6278fea08b8420455b4` |

Run the transition probe against an already built starter with the test runner's Playwright dependency installed:

```sh
DESIGN_BROWSER=chromium PLAYWRIGHT_EXECUTABLE_PATH=/path/to/chromium node scripts/qa/nightjar-iii-button-transition.mjs /absolute/path/to/starter/dist martlet
```

Substitute `krigsvold` and the appropriate built starter for the other family. The workbench-hosted starter review can exercise the derived distribution patches against integrity-locked public npm artifacts in Firefox and WebKit without private repository access; those exact hosted results are pending. Older checked-in and published theme versions remain unchanged until separately approved releases.
