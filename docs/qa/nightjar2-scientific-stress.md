# Nightjar II scientific workspace stress checks

This investigation starts from the frozen Nightjar I candidate `5138a89fc2956d9019d5bd720c987b8b9e24533b`. It exercises the existing experimental scientific workspace, not a new recipe, and preserves the shared thermal model and both families' independent visual roles. The checks use synthetic values and do not establish engineering-calculation validity or complete accessibility conformance.

## Long valid numeric input

Before the change, a 1,000-character all-zero initial-temperature input was a valid numeric zero and was retained in the last-run description. At a 320px viewport, the rendered page became 9,985px wide in Martlet Astro, 9,008px in Krigsvold Astro, 10,241px in Martlet React and 9,024px in Krigsvold React; both root and `/preview/` builds reproduced these values. Jekyll already reflowed at 320px in both families because its example shell supplies an inherited wrapping rule. All three ports computed the same numerical output; the defect was a presentation and cross-framework reflow divergence.

The native scientific-region stylesheet shared by Jekyll and Astro and the React scientific stylesheet now use `overflow-wrap:anywhere` within the working regions. This gives Astro and React the corresponding capability without clipping, hiding, rejecting or rewriting valid input. The entered text, last-run description, calculation and CSV remain intact. An independently inspected 320px Martlet Astro screenshot showed the 1,000 characters wrapping across lines; it was an inspection artifact, not an approved visual baseline.

## Repeated live-status writes

Before the change, typing three successive values `8`, `81`, `812` into the scientific input generated three identical mutation records in the Jekyll and Astro live-status node across both families and both base paths. React generated one. The repeated writes could cause repeated announcements; actual screen-reader announcements were not observed. The shared native controller now writes the status only when its text changes. Returning to the applied value still produces the distinct current-calculation status.

## Verification and limitations

On system Chromium, `scientific-ports.mjs` passed all 12 family/framework/root-or-subpath builds after the fix. It exercises the exact 1,000-character input, unchanged last-run value and actual CSV, 320px and 1440px reflow without clipping, draft/current status, invalid input, keyboard recovery, light/dark automated axe, and disabled controls with no-JavaScript or blocked scripts. It also uses `MutationObserver` to verify one status change for three edits and one for the return to the applied value. The existing model/recipe verification and four thermal-model tests passed; generated Jekyll copies and source manifest were checked. No assertions or baselines were weakened.

The bounded portable-browser smoke now contains the same long-input/CSV and status-mutation checks at 320px in light appearance for both families and all frameworks. It passed all 12 family/framework/light-or-dark cases in local Chromium; its 18 logged axe incomplete entries require manual review and are not passes. Firefox and WebKit require their own hosted runs. Manual assistive technology, real browser zoom, print and other adversarial values remain open.
