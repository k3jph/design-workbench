# Reading typography verification

`tests/reading-framework-typography.mjs` compares representative article, documentation, contact and sign-up pages in both families across Jekyll, Astro and React. It checks source heading font roles and responsive sizes, 320px and 1440px page overflow, form text sizing, browser errors, and 200% root text sizing on the Astro and React contact pages. This is a focused regression check, not a pixel comparison or a substitute for manual assistive-technology testing.

Prepare locked dependencies and root-path builds as described under “Cross-framework behavioral comparison” in [DASHBOARDS.md](DASHBOARDS.md), then run from the workbench root:

```sh
CHROMIUM_PATH=/usr/bin/chromium node examples/page-archetypes/tests/reading-framework-typography.mjs
```

Set `NIGHTJAR_JEKYLL_ROOT` to the directory containing the two Jekyll builds. `NIGHTJAR_ASTRO_ROOT` and `NIGHTJAR_REACT_ROOT` optionally override the default Astro and React `dist` directories. Omit `CHROMIUM_PATH` when Playwright's Chromium is installed.

`tests/form-keyboard-parity.mjs` uses the same builds and environment variables to check native keyboard validation, focus on invalid fields, linked format help, invalid resubmission after secrets are cleared, recovery, reset, and the no-JavaScript disabled state in all three frameworks:

```sh
CHROMIUM_PATH=/usr/bin/chromium node examples/page-archetypes/tests/form-keyboard-parity.mjs
```

## Expanded catalog visual audit

A root-path Chromium sweep captured full-page images and heading geometry for the 43 remaining catalog records at 320px and 1440px across both families and all three frameworks (516 captures). The earlier reading comparison covers article, documentation, contact and sign-up; the three dashboard applications have separate dashboard verification. The expanded set is: `home`, `about`, `archive`, `category`, `categories`, `person`, `projects`, `case-study`, `guide`, `reference`, `faq`, `privacy`, `terms`, `service`, `place`, `pricing`, `careers`, `opportunity`, `software`, `product`, `collection`, `collection-item`, `events`, `event`, `report`, `gallery`, `changelog`, `search`, `sign-in`, `password-reset`, `two-factor`, `coming-soon`, `not-found`, `server-error`, `workspace`, `chat`, `sensors`, `fleet`, `scene`, `integrations`, `stress-test`, `patterns`, `dashboard-components`.

Automated inspection found no page overflow, failed asset responses or page errors in that capture set; matched second-level heading font families and sizes at 1440px agreed within each family. These measurements do not establish pixel equality, full visual equivalence, every interactive state, or manual assistive-technology or cross-browser coverage. Matched third-level headings found six nested Astro headings with oversized inherited fonts; targeted inspection of home and pricing identified missing Astro card rules and unstyled React action links; the source-informed changes preserve link semantics, keep Martlet’s common action treatment and Krigsvold’s secondary outline, and retain framework-specific shell and fictional-host differences. Screenshots are local review evidence rather than accepted visual baselines.

With the same root-path builds, `CHROMIUM_PATH=/usr/bin/chromium node examples/page-archetypes/tests/card-action-parity.mjs` checks home and pricing card rules, action-link destinations and presentation, nested Markdown and workspace heading sizes, keyboard focus, 320/1440 overflow, no-JavaScript output, and light/dark WCAG-tagged automated checks.
