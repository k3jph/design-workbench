# Nightjar II: bounded review of incomplete contrast checks

The frozen candidate `5138a89` produced 18 Firefox and 18 WebKit `color-contrast` **incomplete scan records** in [portable run 40988368952](https://github.com/k3jph/design-workbench/actions/runs/40988368952). One record can contain many target elements. [The target inventory](nightjar-ii-contrast-targets.json) preserves every selector array and timestamp from both hosted logs, deduplicating only identical arrays. Firefox and WebKit produced the same 18 state/selector groups in this run. None of the incomplete records is reclassified as an automated pass.

The local follow-up used Chromium 151, the candidate's freshly rebuilt Jekyll, Astro and React pages, a 320×900 CSS-pixel viewport, the specified family and saved light/dark appearance, and the 14-day Research analytics filter. No Firefox or WebKit binary was available in this environment. Computed-color calculations and screenshots are evidence about this bounded Chromium rendering, not measurements of the affected engines, all custom backgrounds, actual browser zoom or assistive technology. Browser antialiasing is not used as the foreground color for WCAG ratio calculations.

## Classification of all 18 states in each engine

| Family | Framework / state | Target group | Classification and bounded follow-up |
| --- | --- | --- | --- |
| Martlet | Jekyll light article | `targets-01` (7 nodes) | Gradient masthead/transparent header: automated contrast result is inconclusive; endpoint and screenshot evidence below, human engine-specific review open. |
| Martlet | Jekyll light invalid sign-in | `targets-02` (3) | Same gradient context; human engine-specific review open. |
| Martlet | Jekyll light analytics | `targets-03` (17) | SVG axis labels: axe incomplete; bounded computed colors and selected screenshot below, overlapping paint/engine review open. |
| Martlet | Jekyll light scientific | `targets-04` (3) | Same gradient context; scientific endpoint and screenshot evidence below, human engine-specific review open. |
| Martlet | Jekyll dark analytics | `targets-03` (17) | SVG axis labels; same bounded follow-up and open review. |
| Martlet | Astro light analytics | `targets-05` (60) | SVG axes plus caption and 42 horizontally clipped body cells; bounded colors and scroll follow-up, human engine-specific review open. |
| Martlet | Astro dark analytics | `targets-05` (60) | Same target group and open review in dark appearance. |
| Martlet | React light analytics | `targets-06` (60) | SVG axes plus caption and 42 clipped body cells; bounded colors and scroll follow-up, human engine-specific review open. |
| Martlet | React dark analytics | `targets-06` (60) | Same target group and open review in dark appearance. |
| Krigsvold | Jekyll light article | `targets-07` (8) | Gradient masthead/translucent navbar: endpoint and screenshot evidence below, human engine-specific review open. |
| Krigsvold | Jekyll light invalid sign-in | `targets-08` (4) | Same gradient context; human engine-specific review open. |
| Krigsvold | Jekyll light analytics | `targets-09` (17) | SVG axis labels; bounded colors and selected screenshot below, overlapping paint/engine review open. |
| Krigsvold | Jekyll light scientific | `targets-10` (4) | Same gradient context; scientific endpoint and screenshot evidence below, human engine-specific review open. |
| Krigsvold | Jekyll dark analytics | `targets-09` (17) | SVG axis labels; same bounded follow-up and open review. |
| Krigsvold | Astro light analytics | `targets-11` (60) | SVG axes plus caption and 42 clipped body cells; bounded colors and scroll follow-up, human engine-specific review open. |
| Krigsvold | Astro dark analytics | `targets-11` (60) | Same target group and open review in dark appearance. |
| Krigsvold | React light analytics | `targets-12` (60) | SVG axes plus caption and 42 clipped body cells; bounded colors and scroll follow-up, human engine-specific review open. |
| Krigsvold | React dark analytics | `targets-12` (60) | Same target group and open review in dark appearance. |

In this investigation, no actual contrast failure was established for these states. The automated tool could not evaluate the listed contexts; the measured foreground/background pairs below have adequate computed ratios for the bounded Chromium cases. This is supporting evidence, not proof that each individual target passes in Firefox or WebKit. The JSON inventory retains the exact selectors, including repeated clipped cells, so a reviewer can inspect each target in the affected engines.

The portable browser smoke now records the **actual current run's** incomplete `color-contrast` targets into one JSON artifact and a full-page screenshot per affected state when `NIGHTJAR_CONTRAST_EVIDENCE` is set. Every emitted target retains axe's selector and every matching node's text, bounding rectangle, computed foreground and font, an opaque-ancestor background candidate, ancestor background/opacity/position/overflow/filter chain and a center-point hit stack. It reports a `background` only when no known unresolved paint condition was found; the ancestor candidate by itself is not a painted-background verdict. Explicit unknowns cover gradients or images, nonopaque backgrounds/foregrounds, opacity, clipping, hidden/offscreen nodes, SVG paint overlap, filters, text shadows, transparent positioned backdrops, overlapping paint and selector ambiguity. A fixed transparent header, for example, cannot safely use a white body ancestor as its actual background when a gradient masthead is painted behind it. Center-point hit testing is not a pixel-level analysis and can miss partial overlap or pseudo-element paint. These raw styles are not a contrast verdict: every captured record remains `axeResult: incomplete`, and the collector never suppresses or modifies an axe violation. The raw historical selector inventory and the live artifact serve different purposes; the former is not silently replaced by a later browser's output.

## Computed colors and visual context

The test measures all 17 rendered SVG axis labels, 75 table headers/data cells and the previously unmeasured caption. It refuses to guess for gradients, images, translucent foregrounds or intervening partly transparent backgrounds. The named table region is keyboard focusable and responds to Right Arrow. Captions are partly clipped in the initial 320px view because they share the horizontal table scroll region; keyboard scrolling was verified. This behavior needs human review for discoverability; it is not represented as a resolved axe result.

| Family / appearance | First SVG label foreground on background; minimum of 17 | Jekyll caption | Astro and React caption |
| --- | --- | --- | --- |
| Martlet light | `rgb(69, 91, 118)` on `rgb(255, 255, 255)`; ≥6.97:1 | Same pair, 6.97:1 | `rgb(18, 39, 68)` on white, 15.01:1 |
| Martlet dark | `rgb(198, 213, 235)` on `rgb(4, 11, 22)`; ≥13.26:1 | Same pair, 13.26:1 | `rgb(243, 247, 255)` on `rgb(4, 11, 22)`, 18.37:1 |
| Krigsvold light | `rgb(86, 97, 108)` on `rgb(251, 250, 247)`; ≥6.06:1 | Same pair, 6.06:1 | `rgb(23, 32, 42)` on `rgb(251, 250, 247)`, 15.76:1 |
| Krigsvold dark | `rgb(179, 204, 213)` on `rgb(6, 19, 37)`; ≥11.10:1 | Same pair, 11.10:1 | `rgb(238, 248, 250)` on `rgb(6, 19, 37)`, 17.24:1 |

The minimum across the 75 table cells was 13.72:1. The Jekyll Martlet article, sign-in and scientific mastheads use base `rgb(7, 17, 31)` with `linear-gradient(115deg, rgba(7, 17, 31, .9), rgba(12, 35, 60, .8))`; sampled foregrounds are white, `rgb(230, 199, 125)`, `rgb(248, 244, 233)` and `rgba(248, 244, 233, .88)`. The transparent fixed header is required to lie over the masthead. All tested endpoint pairs were ≥10.12:1. Krigsvold uses base `rgb(10, 29, 53)` with `linear-gradient(0deg, rgba(6, 19, 37, .94), rgba(6, 19, 37, .42))`, white foreground and `rgba(6, 19, 37, .96)` navbar; the minimum endpoint pair was 17.06:1, including a conservative white navbar underlay. Those values do not establish all intermediate gradient pixels, custom hero images, opacity effects or text overlapping painted SVG marks.

Optional screenshots were captured for all 12 analytics states and the six Jekyll light mastheads. I inspected the first Martlet/Krigsvold light chart, Martlet dark chart, both scientific mastheads and both Astro light captions. The chart labels were visibly separated from the plotted line in these selected captures; the narrow caption crop showed the horizontal clipping described above. These screenshots were not approved as baselines and do not substitute for full visual review. They are local artifacts; rerun the command below to recreate them.

## Transition, zoom and print observations

The new `contrast-enable-transition.mjs` samples the sign-in submit button after setting it disabled, then enabling it and collecting 400ms of animation frames. Across both families, all three frameworks and light/dark at 320px, 25–27 enabled samples per case were at least 6.72:1. It asserts opaque foreground/background and ancestors before calculating; disabled colors and opacity are recorded but disabled controls are not judged against the active-text threshold. This checks one representative transition, not every control or animation.

Two existing Jekyll Chromium transition regressions also passed against fresh `/martlet` and `/krigsvold` builds: the Krigsvold analytics primary/secondary button checks sample both directions of appearance change at 0–150ms and exercise hover, while the Martlet sign-in header checks light/dark scrolling and samples 0–500ms header opacity. These checks cover their named elements and do not establish every family/framework transition.

An initial headless attempt at `Control+=` five times did not change browser zoom: `innerWidth=1280`, `devicePixelRatio=1`, `visualViewport.scale=1` and computed body font 16px. To exercise actual browser zoom, I then extracted Xvfb and xdotool into a user-writable toolchain from the allowed Debian repository, started an isolated 1280×900 virtual X11 display, launched headed Chromium 151 without device-metrics emulation, and sent real X11 `Ctrl+Plus` keyboard shortcuts to its browser window. At 200% and 400%, the test verified device-pixel ratios 2 and 4, CSS viewport widths 639 and 319, and `visualViewport.scale=1`; it reset zoom between cases. All 12 family × framework × zoom combinations passed article page reflow, keyboard sign-in validation and focus, analytics filtering and keyboard scrolling within the table. These are actual Chromium desktop browser-zoom controls, not CSS zoom or pinch zoom, but the display is virtual and this is not evidence from a physical screen, Firefox/WebKit browser zoom, screen magnifiers, every page or assistive technology.

Optional zoom captures use ImageMagick's X11 window capture of the headed browser, not Playwright viewport screenshots; an initial Playwright screenshot attempt yielded blank or clipped captures after real zoom and is not treated as visual evidence. I inspected 200% Martlet Jekyll and Krigsvold Astro analytics, 400% Krigsvold Jekyll analytics and a 400% Martlet React article. The analytics captures showed selected Research data after horizontal table scrolling; the partially clipped date is a consequence of the deliberate horizontal scroll. Other real-zoom screenshots are not approved baselines or a substitute for a full visual review.

Chromium print-media emulation passed the existing FAQ/analytics disclosure and administration filtered-directory lifecycle checks for both families × three frameworks, with and without JavaScript where those tests cover it. This does not inspect physical print, page breaks or print in Firefox/WebKit.

## Reproduce

Build both Jekyll sites into paired root directories, and the Astro and React examples for each family at `/`. With a Playwright Chromium or `CHROMIUM_PATH` set to an installed Chromium:

```sh
NIGHTJAR_JEKYLL_ROOT=/path/to/paired/jekyll CHROMIUM_PATH=/usr/bin/chromium NIGHTJAR_CONTRAST_SCREENSHOTS=/tmp/nightjar-ii-contrast node examples/page-archetypes/tests/contrast-bounded.mjs
NIGHTJAR_JEKYLL_ROOT=/path/to/paired/jekyll CHROMIUM_PATH=/usr/bin/chromium node examples/page-archetypes/tests/contrast-enable-transition.mjs
NIGHTJAR_JEKYLL_ROOT=/path/to/paired/jekyll CHROMIUM_PATH=/usr/bin/chromium node examples/page-archetypes/tests/print-disclosures.mjs
NIGHTJAR_JEKYLL_ROOT=/path/to/paired/jekyll CHROMIUM_PATH=/usr/bin/chromium node examples/page-archetypes/tests/print-directory.mjs
```

For real Chromium zoom, use a dedicated, non-network-listening X11 display and installed Xvfb, xdotool and xauth (`xvfb-run` uses xauth). ImageMagick `import` is needed only for optional screenshots. For example, in an isolated test environment:

```sh
Xvfb :76 -screen 0 1280x900x24 -nolisten tcp -ac &
DISPLAY=:76 NIGHTJAR_JEKYLL_ROOT=/path/to/paired/jekyll CHROMIUM_PATH=/usr/bin/chromium NIGHTJAR_ZOOM_SCREENSHOTS=/tmp/nightjar-ii-real-zoom node examples/page-archetypes/tests/real-browser-zoom.mjs
```

The test focuses the isolated Chromium window and sends actual `Ctrl+0` and `Ctrl+Plus` keystrokes. `NIGHTJAR_XDOTOOL` and `NIGHTJAR_X11_CAPTURE` can select non-default executable paths. Remove `NIGHTJAR_ZOOM_SCREENSHOTS` to run without ImageMagick. Do not run it against a user's active desktop display. On this environment the X11 tools were extracted into a nonprivileged directory and their binary/library paths were supplied explicitly.

The portable pull-request workflow also runs this test in a separate `xvfb-run` display with xdotool; its exact-head result remains to be verified in hosted CI. This does not add a Firefox/WebKit zoom assertion or claim manual magnifier, device or assistive-technology review.

`NIGHTJAR_CONTRAST_SCREENSHOTS` is optional; no reference image is written or approved by the check. Set `NIGHTJAR_BROWSER=firefox` or `webkit` to select an installed Playwright engine. The pull-request portable smoke workflow runs this bounded measurement in both engines, captures live incomplete-target styles with `NIGHTJAR_CONTRAST_EVIDENCE`, and uploads both forms of review screenshots and JSON as CI artifacts; its results for this change must be inspected before drawing engine-specific conclusions. The historical hosted job logs linked above are the source of the affected-engine target list. Inspect the actual Firefox and WebKit contexts before resolving their incompletes; follow with a human screen-reader, further browser zoom and print review. The separate family grammar references consulted were experimental offline snapshots; the connected design MCP tools were unavailable. No palette, typography or source shell was altered.
