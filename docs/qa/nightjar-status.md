# Operation Nightjar progress ledger

## Current state — 2026-10-29

The original 50 paired Jekyll recipes are preserved, and Astro and React adapters now build all 50 routes for each design language. The campaign has added dashboard and content behavior, accessibility, security, responsive, print, performance and package-type improvements, with the dated evidence and limitations recorded below. Route availability and automated Chromium checks do not establish complete visual, interaction or accessibility parity. The entries below are chronological snapshots; early baseline statements describe the state at that time, not the current implementation.

Outstanding work includes comprehensive visual and interaction review, manual assistive-technology testing, real browser zoom and physical print assessment, Firefox and WebKit testing, Ruby advisory coverage, hosted CI and fresh browser/gem installation checks. Cross-browser provisioning in this environment is blocked by proxy denials as described at the end of this ledger. Publishing and deployment have not been performed. Local branches and patch exports preserve the work for review.

At `2883aac`, the 234-commit workbench export applied to the original `4935a11` feature tip and reproduced tree `7fd1b628a56bc053d08e4caee8a5a93050a64efe` with a clean worktree. Git reported one historical trailing-whitespace warning. Subsequent ledger updates require a refreshed export; the two native package patch exports are separate.

## 2026-10-29 — baseline and continuation

This campaign builds on `feat/portable-page-archetypes` at `4935a11`. Work is isolated on local branch `nightjar/audit`; the existing branch has not been modified. Its catalog contains 50 matched recipes, including analytics, administration and operations dashboards for each family. The shared catalog, fixture, contracts, generator and Jekyll source live in `examples/page-archetypes`; the standalone Jekyll exports live in `examples/jekyll`.

### Repository and framework inventory

| Repository | Inspected main commit | Role / evidence |
| --- | --- | --- |
| `k3jph/design-workbench` | `aafd9a8` | Experimental React packages and reference apps; feature branch contains the canonical portable catalog and Jekyll examples. |
| `martlettheme/martlettheme` | `b588542` | Martlet source site; existing `work/application-ports` branch preserved. |
| `krigsvoldtheme/krigsvoldtheme` | `fa4a66c` | Krigsvold source site; existing `work/application-ports` branch preserved. |
| `martlettheme/npm` | `0ee1de9` | Martlet core package, identified by source site as canonical. |
| `krigsvoldtheme/npm` | `5deb567` | Krigsvold core package, identified by source site as canonical. |
| `martlettheme/astro` | `ed1f121` | Astro package and starter; starter examples differ from the portable catalog. |
| `krigsvoldtheme/astro` | `af57afb` | Astro package and starter; starter examples differ from the portable catalog. |

The Astro starters include index, article, documentation, form and layouts examples, but they do not establish parity with this catalog. The workbench React reference apps demonstrate components and patterns but do not consume the catalog. Full Astro and React parity, including all dashboards, remains unimplemented and unverified. `examples/page-archetypes/PORTING.md` records the adapter boundaries; it is not evidence of implemented ports.

### Verified baseline

- `npm ci --ignore-scripts` succeeded.
- `npm run test:examples` passed: 50 recipes and their contracts, parity, destinations and shell hashes; shared dashboard data integrity; six dashboard model tests.
- `npm run check` passed, including builds and 110 Node tests.
- Regenerating the standalone Jekyll exports produced no tracked differences.
- Jekyll builds, browser, accessibility and visual checks remain to be reproduced in this environment. Ruby is absent from the base image; a user-local runtime is being built.

### Release and access boundaries

The npm and Astro package repositories have release-triggered publication workflows; the workbench also has release-triggered publishing and a manual candidate workflow. Do not trigger releases, publishing or deployment. Shell `gh auth status` reports the configured `GH_TOKEN` invalid; public clones work. The separate authenticated GitHub connector reports push permission for the seven repositories, but no write has been tested. Preserve local commits and use `git format-patch` for export if needed.

### Next actions

1. Build both locked Jekyll projects and run root/subpath link, dashboard browser, responsive and automated accessibility checks; record actual outcomes and fix confirmed defects.
2. Reconcile all recipe and dashboard capabilities against Astro and React, and implement ports using the shared contracts after the Jekyll baseline is stable.
3. Expand adversarial, accessibility, responsive, performance and component checks, documenting limitations and avoiding unreviewed visual baselines.

### Pagination recovery

The administration URL accepts a `page` parameter. A fractional value such as `?page=1.5` previously produced a fractional page label and sliced the wrong records. The shared collection model now accepts only safe integer pages, defaulting invalid values to page 1 while retaining normal bounds clamping. Both generated Jekyll exports were synchronized. The model regression test passes for fractional, non-finite and nonnumeric values; a paired browser regression has been added and awaits execution with the Jekyll builds.

### Parity scope

The shared catalog has eight composition frames and 16 section roles: prose, cards, listing, facts, table, form, FAQ, figure, plans, stats, gallery, search, workspace, chat, sensors and scene. Three dashboards use dedicated renderers and a common synthetic dataset. None of the corresponding 50 Astro or 50 React pages per language has been established as consuming this catalog; analogous starter/reference demonstrations do not constitute parity. Consequently build, functional, accessibility, responsive, visual and performance status for those ports is **unverified**, not passing. Start with paired Astro routes driven by the shared catalog after the Jekyll acceptance gates, preserving base paths, family shells and class semantics; expand section and interaction coverage rather than copying generated Jekyll HTML.

### Jekyll runtime and browser baseline

Ruby 3.2.3 and Bundler 2.4.19 were built without system privileges under `/workspace/nightjar/toolchains/ruby-3.2.3-install`; gems are installed in `/workspace/nightjar/toolchains/gems`. The locked dependencies installed with `BUNDLE_FROZEN=true`. For reuse, put that Ruby's `bin` on `PATH`, and set `BUNDLE_PATH` and `BUNDLE_FROZEN=true`.

Both Jekyll sites built at `/` and `/preview`. `verify-html.py` passed for each build: 57 HTML pages and 1,428 local destinations/fragments per site. The dashboard suite passed 47/47 using installed Chromium 151 with a temporary executable-path override, including the new paired malformed-page regression, interactions, 320/768/1100/1440px overflow/navigation checks, and axe WCAG-tagged checks in light and dark modes. The Playwright browser download was denied by network policy, so these results are specific to system Chromium. Automated checks do not establish complete accessibility conformance.

The 1440px analytics screenshots for both languages and the 320px Martlet analytics screenshot were inspected; both desktop compositions rendered distinctly, and the mobile view reflowed with a bounded table. This is a limited inspection, not a comprehensive visual regression comparison. Screenshots are ignored test artifacts; no visual baseline was approved.

The existing React reference browser suite passed 39/39 on system Chromium. Further registry browser checks are in progress.

The existing workbench registry browser suite also passed 178/178 using system Chromium on isolated port 4190; the React reference suite passed 39/39. These include automated axe and responsive checks and do not replace manual screen-reader testing.

### Operations filter drafts

Acknowledging an alert previously read unapplied monitoring controls and could silently change the active scope; an invalid pending threshold could leave a stale display after the underlying local state changed. Commit `dc759fe` re-renders acknowledgement against the last applied scope while preserving form drafts and the URL's applied state. The paired browser regression failed before the fix and passed after it. Both Jekyll dashboard fixtures rebuilt, `npm run test:examples` passed, and the full system-Chromium dashboard suite passed 49/49 in the independent fix worktree.

### Non-dashboard checks and contrast

A Chromium sweep visited 46 non-dashboard routes in each family at 320, 768 and 1440px (276 visits) without page-level horizontal overflow. Fourteen representative paired interaction cases passed, covering search, gallery focus, workspace, chat, sensors, scene and local sign-in validation. Two images initially appeared incomplete because they were lazy-loaded; both loaded after scrolling and decoding. Axe checks on 20 representative pages identified Krigsvold table-caption contrast failures: 4.49:1 in light and 3.97:1 in dark against 4.5:1. Commit `27dedee` uses the existing Krigsvold semantic text role for example captions. The targeted checks passed in both families and modes; the full dashboard suite in that worktree passed 51/51, `test:examples` passed, and the Krigsvold generated-site link check passed.

### Astro first slice

Commit `9fc7301` adds a private, standalone Astro proof of concept driven by the existing catalog for home and about in both families. It uses the published family-specific Astro shells and separates CSS/font bundles. Four Chromium build/browser combinations passed (both families at `/` and `/preview/`), checking content, destination mapping, assets, CSS isolation, 320px overflow and automated axe checks. This is partial: 48 recipes are unported, links to them return 404 within the slice, generic Astro headers have not established Jekyll visual parity, and most section kinds and Markdown remain unsupported. The slice deliberately rejects unsupported input and documents these limitations; it is not a release-ready example collection. Continue the adapter rather than counting these two pages as full parity.

### Responsive chart labels and combined verification

At 320px, the fixed 720-unit chart viewBox scaled 13px labels down to roughly 4–5px. Commit `5aa133c` sizes chart coordinates to the available plot width, redraws on resize, staggers compact category labels and retains exact-data disclosures. The 320px Martlet analytics screenshot was inspected in the fix worktree. After integration of pagination, operations, caption and chart changes, both dashboard sites rebuilt and the complete system-Chromium dashboard suite passed 55/55, including resize, both contrast modes and draft preservation. `npm run test:examples` also passed on the integrated branch. The initial Astro slice's four build/browser combinations were rerun successfully on the integrated branch.

### Astro adapter expansion

Commit `ad42b88` extends the Astro experiment to 17 selected catalog records per family, adding Markdown (raw HTML disabled), base-aware links and images, facts and short listings, with native family reading/landing layouts and buttons. Both families at root and `/preview/` passed the expanded build and Chromium suite in the independent worktree, including catalog content, destinations, loaded resources, CSS isolation and 320px reflow; axe ran on three representative pages per build. Thirteen distinct linked destinations remain unported, and long-list pagination, trusted HTML/MathML, article/event metadata semantics, interactive examples, dashboards and visual parity remain open. The partial app can still contain links to routes it does not implement; do not treat it as release-ready.

### Astro article, event and listing behavior

Commit `d9f9745` expands the experimental Astro adapter to 21 selected records per language. It adds article author/date/tags/context, event time/zone/registration information, responsive captioned tables and progressive pagination for longer listings. The independent suite passed for both families at root and subpath: content, destinations, assets, 320px overflow, keyboard pagination, no-JavaScript and print fallbacks, with axe on six representative pages per build. Eleven distinct linked destinations remain unported. A separate visual comparison of Krigsvold about found missing source masthead, mark, grouped footer, breadcrumb, appearance toggle and aligned label/content composition. These remain open visual gaps; no visual parity is claimed.

### Astro catalog and search

Commit `cab41d6` adds a browsable catalog and local search over all 50 shared records; 22 recipe pages are implemented in the experiment. Direct query restoration, bounded input, text-safe results, no-JavaScript catalog fallback and availability labels were tested in both families at root and subpaths, alongside existing pagination and representative axe checks. The remaining 28 records are labeled unavailable but currently still link to unimplemented routes; removing those broken navigation targets is outstanding. Source-shell fidelity and the other interaction contracts remain open.

### Astro shell increment

Commit `bf6ed24` adds contextual source-informed family shells with a masthead, breadcrumb, grouped footer, responsive keyboard navigation and persisted appearance; Krigsvold gains aligned section regions and a secondary-action outline. On its independent 21-page branch the suite passed for both families at root/subpath, including menu/Escape/focus, no-JavaScript navigation, appearance persistence, dark-mode axe and geometry checks. Krigsvold About was visually inspected at 320 and 1440px. Exact original shell/mark, complete navigation and footer, manual screen-reader review and other engines remain open. The shell and subsequent search increment were merged; combined validation is pending.

### Astro forms and merged shell verification

Commit `790aaaf` adds six local form demonstrations (contact, sign-in, sign-up, password reset, two-factor and newsletter), bringing the adapter to 28 recipes per language. Catalog/search entries for the 22 missing pages now show unavailable without a navigable link; other recipe links can still target missing routes. The form suite checks native invalid and valid inputs, local-only submission, reset, clearing password/code fields and disabled controls without JavaScript. After merging shell, search and forms, the combined suite passed for both families at `/` and `/preview/`, including those form checks, menu and appearance behavior, pagination, content/assets, 320px reflow and representative axe checks. Exact source-shell fidelity and full parity remain unverified.

### Astro gallery and figures

Commit `d587e4f` adds gallery, collection-item, place, product and reference records, bringing the experimental adapter to 33 of 50 recipes per language. Canonical images are built into Astro; the image dialog supports keyboard open, Escape and close with focus return, while direct image links remain usable without JavaScript. The independent branch suite passed for both families at root and subpath, including alt text, caption and image loading, gallery accessibility, no-JS asset access, 320px reflow and prior shell, form, search and pagination checks. Seventeen recipes and their interactions remain unported; exact visual parity is still open.

### Jekyll search JSON safety

Commit `b7d080a` escapes `<` after serializing the Jekyll search index into its inert JSON script element. Previously an authored catalog value containing `</script>` could break out of the element. A rendered Jekyll build and Chromium regression using such a value in title, summary and category failed before the fix and passed afterward; `npm run test:search-safety` and `npm run test:examples` also passed after integration. The Jekyll CI workflow now runs the regression after Chromium installation. This is a defense for authored catalog data, not a claim that an untrusted CMS is deployed.

### Astro workspaces and messaging

Commit `7aae638` adds observation and fleet workspaces and local conversation, reaching 36 of 50 catalog recipes per language. The shared workspace supports filtering, keyboard selection, local review, filtered-selection clearing and reset. Chat rejects whitespace, renders user input as text, resets locally and makes no submission. In the independent worktree, both family/root/subpath configurations passed content checks, workspace keyboard behavior, chat safety/no-network, no-JavaScript records/messages and disabled controls, and representative axe checks. Fourteen examples remain unported, and complete visual and functional parity are not established.

### Astro simulations and static sections

Commit `ae67d4f` ports station and scene simulations, FAQ, plan and statistic sections, and the original report CSV, bringing the adapter to 45 of 50 recipes per family. Four full Chromium configurations passed in the independent worktree for catalog content, original CSV bytes, keyboard simulation, native disclosures, no-JavaScript fallback, 320px reflow and 21 representative axe pages. The static recovery examples do not configure HTTP error status codes. The stress fixture and four dashboard-related records remain unported; the simulation adapter currently guards against duplicate instances rather than supporting them. Visual and comprehensive functional parity remain open.

### Astro content stress fixture

Commit `44ee4d6` adds the stress record, bringing the experimental adapter to 46 of 50 recipes per language. Ordinary Markdown continues to disable raw HTML; only the checked-in stress fixture opts into a restricted sanitized HTML/MathML subset. Footnotes have scoped IDs and return links; code blocks are keyboard focusable and long text wraps. The independent suite passed both families at root and subpaths, including stress-page axe, MathML namespace, footnote targets, 320px reflow, hostile markup and unsafe URL rejection; targeted checks also covered nested lists, heading hierarchy and code focus. The four dashboard-related records remain unported in this branch. A combined rerun after integration is in progress.

### Astro analytics and operations routes

Commits `91f2e23` and `8591934` add explicit analytics and operations dashboard routes using the shared synthetic fixture and framework-neutral dashboard logic. Independent tests passed both families at root and subpaths: analytics totals, filters, CSV, invalid-date recovery, no-JS source data, reflow and light/dark axe; operations scope, threshold, pending-filter preservation, acknowledgement/undo, reset, error handling, reflow, light/dark axe and no-JS tables. Dashboard navigation, catalog/search integration, cross-family comparison and visual parity remain unfinished. Administration and dashboard overview are still pending. Separate tests are being rerun against the combined branch.

### Astro administration route

Commit `8d51e39` adds the administration dashboard using the synthetic fixture and shared controller, including static no-JavaScript directory content. Chromium tests passed after integration for both families at root and subpath: local editing, filtering, selection and confirmation, recovery states, safe text, malformed pagination, narrow reflow and light/dark axe. A scoped Krigsvold dark button token correction addressed a contrast failure found during development. Analytics and operations tests also passed on the combined branch in both families and base paths. The dashboard overview, catalog registration, shared navigation, peer comparison, exact visual parity and manual assistive-technology review remain open.

### Astro dashboard and catalog integration

Commit `7476a4c` connects the three Astro dashboard routes and dashboard overview to the catalog, with shared mobile keyboard navigation and optional validated `NIGHTJAR_PEER_URL` for comparison links that retain query state. Both language builds now serve all 50 catalog destinations. This establishes route availability, not complete parity. Operations family CSS was isolated after the integrated suite caught cross-family selectors. Dashboard headings now sit in the working region rather than in a tall editorial hero. Independent integrated tests passed the generic 47-page suite and all three dedicated dashboard suites in both families at root and subpaths, plus all 50 route responses, keyboard/Escape/focus, no-JavaScript navigation and configured peer-link checks. At 1440×900, admin table top measured y=846 Martlet and y=817 Krigsvold against the inspected Jekyll y=841–862; analytics filters were y=465/442 and KPIs y=777/737. Full visual parity, real deployment peer URLs, other browser engines and manual assistive-technology testing remain unverified.

### Astro print refinement

Commit `e59fdcf` hides site navigation/footer chrome and analytics controls in print while retaining report and table content. An emulated-print regression failed before the change and passed afterward for both families at root and subpath, covering all three dashboards and an article. Dark-mode print colors, physical printers and other browser engines remain unverified.

### Astro dependency security

Commit `20a5a29` updates the Astro experiment's Astro, markdown-it and sanitize-html dependencies. The prior npm audit reported four advisories (one high, one moderate, two low) in this build-time dependency tree; remote exploitability was not established. `npm audit` now reports zero advisories including development dependencies. In the independent updated worktree the full 47-page catalog suite and analytics, administration, operations and navigation suites passed for both families at root and subpaths. A targeted review of Markdown sanitization, links, JSON script escaping, text-only chat/results and dashboard fixture rendering found no further concrete injection defect; it is not a complete security certification.

### React catalog first increment

Commit `2939aaf` adds a paired React catalog experiment using the existing workbench React/Vite toolchain and shared fixture, without new dependencies. Four independent Chromium configurations passed for 14 prerendered routes in each language at root/subpaths: content and links, family CSS isolation, no console errors or missing assets, 320px and representative desktop reflow, axe on home/archive/case-study, keyboard pagination/focus recovery, reload, print and no-JavaScript record visibility. Strict TypeScript and `npm run test:examples` also passed. The standalone slice still has 36 unported routes and links to some of them; Markdown-heavy, interactive and dashboard examples, native source shells and visual parity remain open. It is not release-ready.

### Astro dark-appearance printing

Commit `0914c64` addresses pale text when a dark screen appearance is printed without backgrounds. Print-only rules use the existing light semantic colors and leave saved screen appearance unchanged. The emulated-print test failed before the fix and passed afterward in both languages at root/subpaths for article and all three dashboard pages; a background-free Chromium PDF was visually inspected. Other engines and physical printers remain unverified.

### React analytics component

Commit `dad099b` adds an isolated paired React analytics component using controlled filter state, the shared synthetic fixture and calculation model, native family buttons, responsive SVG charts with data-table alternatives, local CSV and server-rendered source data. A standalone harness passed both families at root/subpaths for filtering and totals, CSV content, query restoration, invalid-date focus and recovery, light/dark axe, responsive overflow, no-JavaScript behavior and strict TypeScript. It is not yet wired into the catalog or dashboard navigation; visual parity, manual assistive-technology review, print and other engines remain unverified. The standalone harness is intended to keep chart and fixture cost out of simple content pages.

### React operations component

Commit `41bed8c` adds a standalone paired React operations dashboard with controlled draft/applied state, scope and threshold controls, acknowledgement/undo, local timeline, reset and focus recovery, accessible trend data and server-rendered no-JavaScript tables. Its independent Chromium suite passed both families at root/subpaths for state transitions, invalid pending draft preservation, URL restoration, focus, 320/1440 reflow, light/dark axe and no-JavaScript; strict TypeScript passed. Catalog route, shared navigation, comparison, visual fidelity, manual assistive technology and print remain open.

### React reading/data and shared renderer

Commits `1e5d2b7` and `0280bca` expand React from 14 to 29 paired routes with Markdown, article/event metadata, SVG figures and native accessible data tables. The parser now lives in `examples/page-archetypes/lib` rather than the Astro adapter; both frameworks consume the shared implementation. The independent tests passed both languages at root/subpaths for content, metadata, resources, responsive reflow, axe, pagination/focus, print/no-JavaScript and Markdown safety, with strict TypeScript. Twenty-one routes and their interactions, dashboard wiring and visual parity remain open. The same update resolves a pre-existing high-severity root zod advisory by updating to 4.6.7. On the integrated branch `npm ci --ignore-scripts`, `npm audit --audit-level=low` (zero advisories) and `npm run check` (110 tests) passed. The independently tested Astro 47-route suite also passed after the renderer move; Astro requires the documented root dependency install for the shared module.

### React administration and dashboard navigation components

Commits `6c10dd4` and `8d55ac9` add isolated React administration and shared dashboard-navigation components. Administration uses controlled local state, native family Button/Dialog and a server-rendered all-record fallback. Independent Chromium tests passed both families at root/subpaths for filtering, pagination, selection, confirmation/Escape/focus, scoped updates, editing/validation, safe text, recovery, malformed URLs, 320px, light/dark axe, no POST and no-JavaScript; sorting has an additional check in progress. Navigation's independent tests covered mobile keyboard disclosure, Escape/focus return, SSR/no-JS links and optional validated peer URLs preserving query state. These components are not yet wired into catalog routes; deployment URLs, complete visual parity and manual assistive-technology review remain open.

### React catalog interactions

Commit `61ff6cd` expands React to 41 paired routes with query-backed search, six local form specimens, native disclosures, pricing, statistics, report CSV and the scoped sanitized stress fixture. Independent Chromium tests passed both families at root/subpaths for all 41 routes, representative axe and responsive checks, safe markup, search, local validation, sensitive-field clearing, disabled no-JavaScript controls, native disclosures, pagination and print; strict TypeScript passed. Nine routes, including dashboard integration and other interactive fixtures, remain unported. Standalone dashboard components are not yet catalog routes.

### React workspace and chat components

Commit `68d0625` adds isolated controlled React workspaces and local chat. Two concurrent workspace instances have distinct accessible detail names; the fixture supports keyboard selection, review, filtering and reset, with complete server-rendered records. Chat rejects whitespace, renders entered text safely, resets locally and does not send a POST. Independent Chromium tests passed both families at root/subpaths for two instances, keyboard/focus, no-JavaScript, 320px, light/dark axe and no network submission; focused TypeScript passed. Catalog wiring and full visual/manual accessibility review remain open.

### React simulation components

Commit `4969c99` adds standalone controlled station and scene simulations with per-instance IDs/state, canonical content and base-aware images. Server-rendered snapshots remain available and controls are disabled until hydration; no device or service is contacted. Strict TypeScript and four independent Chromium configurations passed, including simultaneous instances, keyboard, status, image decoding, reset, unique IDs, 320/1440 reflow, light/dark axe and no-JavaScript. Catalog integration remains pending.

### React gallery component

Commit `29f9775` adds a standalone React gallery using canonical image content, base-aware allowlisted assets, SSR direct links and a native labelled dialog with focus restoration. When JavaScript or `showModal` is unavailable, image links remain usable. Both family/root/subpath Chromium runs passed two simultaneous galleries, keyboard Enter/Escape and focus, alt/caption, 320px, light/dark axe and no-JS/no-`showModal` navigation; strict TypeScript passed. Catalog wiring, visual parity, manual assistive technology and other engines remain open.

### React dashboard route integration

Commit `11c3663` connects the three React dashboards and dashboard overview, and adds a 50-record index. It prerenders 44 routes, labels the six missing destinations as unavailable, separates dashboard JavaScript, and includes route-specific CSS in server-rendered HTML so no-JavaScript dashboards are styled. Independent tests passed both families at root/subpaths for dashboard workflows, peer query, keyboard/mobile navigation, representative axe, no-JS tables/controls/styles and normal-page dashboard-bundle isolation; the generic 41-page suite, family CSS/font isolation and strict TypeScript also passed. The six interactive records remain to be wired. Narrow no-JavaScript dashboard charts retain a fixed SVG viewBox, so labels may be small; exact-data tables are present. Visual parity, physical printing, manual assistive technology and other browsers remain open.

### React no-JavaScript chart labels

Commit `985c0a5` addresses the narrow-screen fallback recorded above. Server-rendered analytics and operations charts start with a compact 240-unit SVG capped at 240px; hydrated charts retain adaptive resizing and exact-data disclosures remain available. Dedicated tests passed both families at root/subpaths for 320/1440 no-JavaScript label geometry, category-label overlap, data disclosures, overflow and hydrated resizing; strict TypeScript passed. A 320px no-JavaScript Krigsvold category chart was visually inspected. The desktop no-JavaScript chart intentionally remains compact; full visual and manual accessibility review remains open.

### React rapid acknowledgement

Commit `6404df3` fixes a React operations race: two batched clicks could both read the prior alert state, losing a toggle and duplicating the acknowledgement event. The updated handler tracks the latest local alert state synchronously and resets it consistently. A regression failed before the change and passed in both families at root/subpaths, requiring one acknowledgement and one reopening event; the operations suite, existing recovery/axe and no-JavaScript checks also passed. The catalog integration is being rebased onto this correction.

### React complete route coverage and prerender safety

Commit `60db50c` wires gallery, workspace, fleet, chat, sensors and scene, so all 50 canonical React catalog destinations and the index are generated. Interactive and dashboard code remains route-split, with CSS included in server-rendered output. It also fixes literal `$&`, `$'` and dollar-backtick corruption in generated markup, titles and styles by using callback replacements, with a targeted regression. Independent tests passed both families at root/subpaths for the 47 content routes and three dashboards/index, local destination files, representative axe and reflow, interactive workflows, no-JavaScript output/styles, bundle isolation, rapid acknowledgement, narrow no-JS charts and peer query state; strict TypeScript passed. Route coverage and these checks do not establish complete visual, behavioral or manual accessibility parity across frameworks.

### Astro print palette isolation correction

The earlier dark-print change `0914c64` placed both families' palette declarations in a shared stylesheet, which caused the existing Astro CSS-isolation assertion to fail in the combined suite. Commit `56735b5` moves each palette into its family-specific shell stylesheet. The paired root/subpath dark-print tests passed in the independent worktree; the complete Astro suite is running with this correction and the pagination asset optimization. The prior print change should not be treated as fully validated until that suite passes.

### Cross-framework workspace filtering

Commit `e33b8be` reapplies a workspace's active filter after a review changes a record. Previously React could keep a now-hidden record selected and actionable; Jekyll and Astro could leave the nonmatching row visible. The change clears selection when the record leaves scope, updates the visible results and restores focus appropriately. The React regression failed before the fix; React workspace/chat checks passed both families at root/subpaths, targeted Jekyll checks passed both families, and focused Astro workspace/fleet checks passed all four configurations. A full Astro suite is running with the separately integrated CSS-isolation correction.

### Cross-framework analytics URL state

Commit `a318f60` makes end-date-only URLs display Custom range in all three frameworks and validates initial React URL ranges. Invalid React ranges retain default results, show/focus an error and disable CSV until corrected. The React invalid-range regression failed before the change; the independently run Jekyll dashboard suite passed 57/57, Astro analytics and standalone/integrated React dashboard suites passed both families at root/subpaths, `test:examples` and strict React TypeScript passed. Both Jekyll exports were synchronized.

### Astro listing asset isolation

Commit `af3939a` loads the Astro listing enhancement only on pages with listings. In a local Chromium 151, 1440px root-path measurement, Martlet About JavaScript fell from 1,891 raw / 856 gzip bytes to 1,312 / 537 and one script request was removed. Targeted tests passed for both families at root/subpaths: About omits the controller, Archive loads and advances, and no-JavaScript Archive retains all records. The full content suite with the print-palette isolation correction is still running. Initial measurements also found dashboards embedding unused fixture domains; further scoping is being investigated.

### React operations URL validation

Commit `11935fb` validates an initial React operations threshold URL. Invalid input now remains in the draft, reports and focuses the error and retains the default valid metrics until a valid threshold is applied. The regression failed before the fix; standalone and integrated React dashboard suites passed both families at root/subpaths, including rapid acknowledgement and no-JavaScript checks, and strict TypeScript passed.

### Dashboard cross-framework checks and mobile width

Commits `1f7896e` and `529ebc4` correct redundant React mobile dashboard padding and add a reproducible representative cross-framework dashboard test. At 320px the administration form grew from 192/200px to 272/280px (Martlet/Krigsvold) while retaining the family AppShell gutter; a corrected Martlet screen was visually inspected. The independent integrated React dashboard suite passed both families at root/subpaths, including hydrated and no-JavaScript geometry. The new comparison passed all six family/framework combinations for analytics filters and error focus, operations acknowledgement with pending drafts, keyboard confirmation/cancel and focus, mobile navigation/overflow and no-JavaScript content. It is representative rather than complete visual or manual accessibility conformance; React still differs in source mark and full site chrome.

### Jekyll account guidance and combined workspace checks

Commit `b738dc6` associates the visible password and verification-code hints with their Jekyll inputs, matching the Astro and React behavior. Both family builds passed; targeted Chromium checks confirmed accessible descriptions for sign-in, sign-up and two-factor pages, root/subpath link checks passed (57 pages, 1,428 destinations per build), and `test:examples` passed. The initial link-check invocation omitted `--baseurl` and produced false missing-file reports; rerunning with correct base paths passed.

After workspace correction `e33b8be` and Astro palette correction `56735b5`, the independent full Astro and React catalog suites passed both families at root and subpaths (47 direct content routes per build), including representative axe, routing, responsive and no-JavaScript checks. These are not a substitute for full manual accessibility or visual review.

### React search recovery

Commit `826d50b` directs both React search no-results recovery and the no-JavaScript fallback to the complete examples index instead of Home. The independent 47-page React suite passed both languages at root/subpaths with the new link assertions; strict TypeScript passed.

### Astro dashboard fixture scoping

Commit `04755cb` derives each dashboard's embedded data from the canonical fixture, transferring only the fields that view consumes; JSON is escaped for its script context. Unit checks verify exact canonical subset equality and closing-script escaping. Independent analytics, administration, operations and navigation suites passed both families at root/subpaths. In local cold Chromium 151 measurements at 1440px, Martlet administration HTML fell from 46,488 to 15,491 bytes and operations from 44,383 to 21,845; analytics gzip HTML+CSS+JS fell from 23,044 to 21,111 bytes excluding fonts, with data moving from JS into HTML. The methodology and all family/route measurements are in `examples/astro-slice/PERFORMANCE.md`; these are local transfer-size observations, not production performance claims. The full Astro content and dark-print suites also passed on the preceding pagination/isolation commits.

### Cross-framework form status

Commit `0a777ed` clears an example form's local validation-success message when a user edits a field, preventing stale success from describing changed values. It updates the shared acceptance contract and synchronizes both Jekyll exports, including previously stale dashboard comparison documentation. The targeted Jekyll regression failed before the fix and passed for both families; both Jekyll builds, `test:examples`, strict React TypeScript, and the full Astro and React 47-page suites passed in both languages at root/subpaths in the independent worktree.

### Conformance evidence snapshot

Commit `4e8a5de` adds a dated 50-row readable matrix and 300-cell JSON snapshot across both languages and all three frameworks. It distinguishes route/build and sampled browser evidence from unassessed full visual, manual accessibility and performance conformance. `node scripts/qa/nightjar-conformance.mjs --check` passed on the integrated branch; the independent validation deliberately corrupted a cell and confirmed the checker failed before restoring it. This checker verifies inventory and snapshot consistency; it does not rerun browser tests or certify parity.

### React search URL normalization

Commit `e2ba2b1` normalizes the initial React search URL to match the input: queries longer than 200 characters are truncated and whitespace-only queries removed, while other parameters and `history.state` are retained. A 250-character URL/200-character input mismatch was reproduced before the fix. The independent 47-route React suite passed both families at root/subpaths, strict TypeScript passed, and a browser check confirmed history state survives initialization and search submission.

### React source-informed shell

Commit `a8f1125` adds the authentic family header marks, source-informed masthead and grouped footer, accessible breadcrumb, persistent appearance and base-aware keyboard/mobile navigation. Krigsvold landing/dossier/detail/collection sections use aligned label/content regions and source sans roles; Martlet landing uses an editorial sequence and source-informed card/canvas treatment. The independent full 47-route React catalog and integrated dashboard suites passed both families at root/subpaths; focused shell checks covered byte-identical marks, keyboard/focus, light/dark, print, no-JS, composition and typography, and the representative cross-framework dashboard suite passed all six combinations. About/analytics screens were visually inspected at 320/1440. This is a contextual translation: masthead geometry, original footer/nav and owner identity are not exact copies. Manual assistive technology, other engines and complete visual parity remain open. A targeted shell rerun against the current combined branch is in progress.

### Multiple simulation instances

Commit `2293815` makes Jekyll initialize every station and scene and gives Jekyll/Astro controls distinct IDs based on validated section identities; Astro no longer rejects multiple instances. A disposable fixture exercises two of each through real rendering, including collision-prone section names, independent state, 320px, axe, no-JavaScript and Jekyll links. It failed on both pre-fix frameworks for duplicate IDs and passed all eight family/framework/root/subpath combinations afterward. The full Astro 47-page and existing React multi-instance suites, `test:examples`, and a clean-install CI-style run passed. The Jekyll CI workflow now runs this regression. Compatibility: links targeting former fixed `#simulation-mode`, `#ventilation` or `#scene-view` IDs need updating; see `examples/page-archetypes/README.md`.

### Dashboard comparison query privacy

Commit `61dc620` limits Jekyll, Astro and React peer-comparison links to the relevant dashboard's filter/state keys. Previously unrelated current-page query parameters could be forwarded to a separately configured peer host. The pre-fix React helper reproduced forwarding a `token` parameter; shared-model tests now cover each allowlist, duplicates, unknown keys and invalid routes. Six paired Jekyll browser tests and Astro/React navigation suites passed, including preservation of intended filters and omission of unrelated parameters after interaction. Current-page unrelated parameters are retained locally. Jekyll exports are synchronized; both dependency audits reported zero advisories at the tested snapshot.

### Long multilingual content

Commit `5caca03` wraps long unbroken multilingual titles in Krigsvold's Jekyll masthead and both Astro mastheads/content containers, and prevents long Astro field labels from widening the page. Before the fix a mixed-script title clipped in Krigsvold Jekyll at 768px and expanded Astro pages beyond 4,000px at 320px; long form labels also overflowed Astro. A new CI-backed check passed Jekyll/Astro/React × both families × 320/768px × LTR/RTL for clipping, page overflow and accessible label association. The full Astro 47-page suite passed both families/root/subpaths, Jekyll root link checks passed 57 pages/1,428 destinations each, and `test:examples` passed. This establishes bounded reflow only, not complete translation, locale formatting, RTL keyboard or manual assistive-technology support.

### Package and consumer audit

Both npm theme repository suites passed (Martlet 12 tests, Krigsvold 13). Both Astro package suites passed three tests each using their CI's `npm ci --ignore-scripts --legacy-peer-deps`; plain `npm ci` failed because their checked-in locks omit auto-installed peer dependencies. Both workbench React tarballs installed and rendered in an isolated consumer. Commit `027c7f7` corrects packaged React README links that previously pointed outside the tarball and lists the exported `TabItem` type; `npm run test:packages` passed after rebuilding, and the linked versioned documentation paths were checked against the `react-v0.1.0` tag. These checks do not establish release readiness or manual accessibility certification; no packages were published.

### Enlarged text and reduced motion

At 200% root text size and 320px, all three Astro dashboards overflowed in both families (analytics measured 341px Martlet and 445px Krigsvold), as did React operations (365px and 346px). Shared Astro dashboard reflow and React operations grid sizing now preserve readable controls without reducing text size. A cross-framework Chromium check passed Jekyll, Astro and React in both families at 320/768px across all three dashboards, with reduced-motion emulation, keyboard navigation and focus return, and keyboard filter submission. Astro analytics, administration and operations and React operations standalone suites passed both families at root/subpaths, including axe and no-JavaScript checks; `npm run test:examples` passed. Root text scaling is not browser zoom; reduced-motion emulation and keyboard checks are representative, not comprehensive assistive-technology certification.

### React route payloads

Commits `594cbaa` and `046d4a7` scope inert, script-safe hydration data to the current content page; index/search retain a compact catalog index and dashboards remain route-split. In three-run local cold Chromium gzip measurements, About JavaScript fell from 88,885/88,891 to 74,407/74,413 bytes for Martlet/Krigsvold (16.3%); total response-body transfer fell from 180,934 to 166,750 and 161,811 to 147,625 bytes respectively. These are local transfer measurements, not timing claims. The independent 47-route catalog, integrated dashboards and source-shell suites passed both languages at root/subpaths, including actual browser script-breakout regression; strict TypeScript and `test:examples` passed, and the final measurement saw no unexpected external requests. Method, per-route results and limits are in `examples/react-catalog/PERFORMANCE.md`. An integrated catalog/dashboard rerun is in progress.

### Analytics observation ordering

Commit `545510c` derives analytics bounds independently of input order and returns chronologically ordered rows and days using canonical category order, without mutating the fixture. A reversed valid fixture failed before the change and now matches the original totals and category-filtered views. `test:examples` passed with nine model tests, Jekyll analytics browser checks passed 18/18, and Astro/React analytics suites passed both families at root/subpaths. Empty analytics data remains a separate work item; the model and consumers previously assumed records exist.

### Gallery link interaction

Enhanced gallery links previously cancelled modified clicks across all three frameworks, preventing users from invoking native link behavior. The gallery now intercepts only unmodified primary activation. A cross-framework Chromium regression passed both families for Ctrl/Meta/Shift/Alt events, a Control-click event, keyboard opening and Escape focus return, and direct image navigation with JavaScript disabled. The check confirms modified events are not cancelled; it does not claim native tab/window behavior across every operating system or browser.

### Empty analytics fixture

Commit `fc09481` permits an empty analytics array in the shared schema and renders an explicit no-data state across Jekyll, Astro and React without fabricated metrics or CSV, retaining navigation and the synthetic-data notice. The previous React implementation failed during server rendering with an empty fixture. A temporary-fixture regression passed both languages × three frameworks × root/subpath × JavaScript/no-JavaScript, with 320px, navigation and scoped axe checks. Existing nonempty analytics suites passed (Jekyll 18/18; Astro and React both families/root/subpath), as did strict React TypeScript and `test:examples`. This covers a fully empty source; sparse or malformed samples remain separate cases. Static no-JavaScript ordering of reversed fixtures is under review.

### Dense table reflow

An adversarial report table with 19 columns collapsed into a 334–350px table in Astro and 668–785px in React at a 320px viewport, making some columns only one or two characters wide. Astro and both React table components now keep an 8rem minimum cell width, matching the existing Jekyll adapter; wide tables scroll within their named, keyboard-focusable region. A Chromium check passed both families in Jekyll, Astro and React with 100 added rows, 19 columns, long unbroken words, document bounds and keyboard scrolling. This synthetic stress check does not measure the rendering performance of unbounded data sets.

### Static analytics ordering and combined fixtures

Commit `05ecc45` makes Jekyll and Astro's initial no-JavaScript analytics tables respect the same bounded date range and chronological order as the normalized interactive model; Jekyll preserves canonical category order without dropping unknown categories. After merging this with the empty-state change, `npm run test:analytics-empty`, `node examples/page-archetypes/tests/analytics-order-static.mjs`, and `npm run test:examples` all passed on the integrated branch using local Ruby/Bundler and system Chromium. The temporary-fixture tests cover both languages, all three frameworks, root/subpaths and JavaScript/no-JavaScript; the reversed case includes a later out-of-range observation. Sparse or malformed samples remain unassessed.

### Composed gallery dialogs

Two Jekyll gallery sections previously emitted duplicate dialog-heading IDs and routed every image to the first dialog. A reserved section identifier also collided with the generated dialog-title ID in Astro. Jekyll galleries now scope controls and dialogs per instance and restore opener focus; both adapters name their dialogs without generated IDs. Disposable two-gallery Jekyll and Astro fixtures passed both families at root and subpaths for independent image content, unique IDs, Escape focus return, axe and no-JavaScript links. React already has a separate two-gallery composition suite.

### Reading typography and form controls

Commit `1285d26` aligns Astro masthead and section heading roles with Jekyll and makes Astro/React local form text controls use root-responsive 16px sizing with narrow-screen containment. A documented cross-framework regression passed all six family/framework combinations for article, documentation, contact and sign-up at 320/1440px, including 200% contact text and no-JavaScript. The initial 48-page/viewport Chromium audit found no page overflow, browser errors or WCAG-tagged axe violations. Full Astro and React 47-route suites passed both languages at root/subpaths. Martlet Jekyll form controls use Cambo while Astro/React retain their existing Lato control role; exact visual and manual assistive-technology parity remain open. Evidence and commands are in `examples/page-archetypes/READING-VERIFICATION.md`.

### Composed conversation recovery

Multiple Jekyll conversations previously reused a message-field ID and only the first received an interaction handler; Astro conversations also reused the ID. Both now associate their message labels without generated IDs and scope interaction state to each conversation. Disposable two-conversation fixtures passed both families and root/subpaths in Jekyll and Astro for independent submission and reset, whitespace-error recovery, keyboard focus, axe and disabled no-JavaScript controls. React uses per-instance state and IDs; its separate workspace/chat suite covers its composer behavior.

### Sparse analytics and undefined ratios

Commit `5aaaee9` marks missing date/category observations as partial, suppresses incomplete comparisons, distinguishes an unobserved range from real zero counts, and reports rates/duration or percentage changes as unavailable when their denominator/baseline is zero. SSR/no-JavaScript output follows the same semantics. `analyticsView` accepts optional explicit coverage; callers omitting it retain observed-bound inference, which cannot detect missing boundary days. The serialized fixture and schema remain unchanged. Independent sparse/zero and fully missing-range/recovery tests passed both languages × three frameworks × root/subpath × JS/no-JS, with navigation and scoped axe; canonical Jekyll analytics passed 18/18, Astro/React analytics passed both families/root/subpath, and model, fixture and React type checks passed. A combined-branch sparse/model rerun is in progress. Values exceeding JavaScript's safe integer range remain a separate investigation.

### Native invalid form resubmission

Commit `24b2922` clears an earlier local success message when native validation blocks a repeat submission after a password or code was cleared. Capturing the invalid event handles validation that occurs before the submit handler. A cross-framework Chromium keyboard regression passed both families for missing/malformed input focus, linked help, repeat submission, correction, reset, disabled no-JavaScript controls and no write requests; all six root-path builds passed. This is native Chromium validation evidence, not manual screen-reader certification.

The integrated-branch rerun of `analytics-sparse.mjs` and `test:examples` passed after `5aaaee9`, including both languages, all three frameworks, root/subpaths and JavaScript/no-JavaScript.

### Search host-history preservation

Jekyll and Astro search previously replaced the current browser history entry with null state on initialization and every query update, discarding state owned by the host. They now preserve the existing state. A Chromium regression passed both families in Jekyll, Astro and React, verifying host state, unrelated query parameters, fragment, history length and keyboard search updates.

### Analytics integer precision

Commit `955cde4` rejects unsafe nonnegative integer observations or totals with an explicit data error rather than displaying rounded metrics. The three renderers show truthful unavailable values and guidance without JavaScript; hydrated controls allow a safe-range recovery, and later data errors retain prior valid results without marking valid dates invalid. The prior-of-prior chart calculation was removed so an out-of-scope overflow does not block recovery. Independent precision tests passed unsafe current, preceding and later-selection scenarios across both families, three frameworks and root/subpaths (36 configurations), with no-JS, 320px and scoped axe for current/preceding cases. Canonical, empty, sparse, reordered and gap analytics regressions, model tests and strict React types also passed. A combined-branch precision/model rerun is in progress.

The integrated-branch `analytics-precision.mjs` and `test:examples` rerun also passed after `955cde4` using local Ruby/Bundler and system Chromium.
### Composed forms and catalog chats

Multiple demonstration forms previously reused their field, help and notice IDs in all three adapters; Astro also refused to build catalog records with multiple forms or chats despite independent chat controls. Jekyll and Astro now derive form IDs from each catalog section using a namespace that cannot collide with valid section IDs, and React uses per-instance SSR-compatible IDs. Astro allows multiple form and chat sections. Disposable catalog builds passed all three frameworks, both families and root/subpaths with two forms and two chats: unique IDs, associated labels and descriptions, independent submissions and resets, keyboard interaction, automated axe and disabled no-JavaScript controls. Existing cross-framework form keyboard/recovery and multilingual reflow tests passed. This is a synthetic composition check rather than an audit of arbitrary host-page IDs or manual assistive technology.

The integrated-branch `form-composition.mjs` and `test:examples` rerun passed after `9a239aa`, covering both languages × all three frameworks × root/subpath and two forms/two chats per fixture.

### Operations invalid initial URL recovery

Commit `b0440f9` establishes valid default Jekyll/Astro operations results before validating an invalid initial threshold URL, while retaining the invalid draft/URL and displaying its validation error. Previously the first render stayed blank and alert controls were inert despite claiming prior results were visible. The new cross-framework browser regression failed before the fix and passed all six family/framework combinations, including navigation and no-JavaScript checks; `test:examples` passed fixture verification and 12 model tests. Both Jekyll exports were synchronized.

### Administration identifier allocation

Commit `4164bf0` allocates an unused `P-` identifier for a new directory record even when existing schema-valid IDs are arbitrary strings. The former numeric-slicing approach could create duplicate `P-NaN` IDs and cause edits or bulk writes to affect more than one record. The pre-fix regression reproduced the collision; add/edit/selective-bulk flows passed after the fix for both families × three frameworks × root/subpath (12 builds). Fixture schema validation, `test:examples` (13 model tests), and strict Administration TypeScript passed. The allocator handles an empty input defensively, but the current fixture schema requires at least one person; no empty-directory fixture support is claimed.

### Operations sample ordering

Commit `cafd402` sorts service observations by timestamp before selecting the latest value and monitoring window, including initial Jekyll and Astro no-JavaScript tables. The schema does not require source order; a reversed canonical fixture previously showed oldest values. The regression failed before the fix and passed both families × three frameworks × root/subpath with and without JavaScript, checking static latest values, chart data and metrics. `test:examples` passed 14 model tests. Unequal or misaligned service coverage remains under separate investigation.

### Composed workspace recovery

Multiple Jekyll workspaces previously shared filter and detail IDs; Astro workspace IDs could also collide with valid section IDs. After resolving those collisions, automated axe exposed duplicate detail landmark names when workspaces were composed. Both adapters now namespace filter IDs by section and name detail regions by workspace title, matching React’s scoped naming. Disposable catalog fixtures passed all three frameworks, both families and root/subpaths for unique IDs, independent filter/review/reset, keyboard focus recovery, axe and no-JavaScript content. This check covers distinct workspace titles; arbitrary host IDs and duplicate titles need separate evaluation.

The integrated-branch `workspace-composition.mjs` and `test:examples` rerun passed after `2cb40b5`, including both languages × all three frameworks × root/subpaths.

### Partial operations coverage

Commit `5ad89c1` joins service observations by timestamp within the snapshot window instead of averaging by array index. Incomplete cross-service timestamps are omitted from the trend with a partial-coverage notice; tables show each service's latest sample time, latest means identify differing times, and missing window availability is explicit. Astro's scoped payload includes `as_of`. Independent schema-valid unequal/disjoint fixtures passed both languages × three frameworks × root/subpaths with and without JavaScript (24 cases), including a scoped service with no current-window observations. Reordered fixtures (12 cases), canonical parity (six), 15 model tests, Astro fixture checks and strict React types also passed. The broad schema permits duplicate timestamps and future readings; the following semantic-validation change handles them explicitly.

### Ambiguous operations timestamps

Commit `a8b18cd` rejects duplicate timestamps per service or readings after `as_of` as an explicit operations data error rather than choosing arbitrary or future values. Affected snapshots retain dashboard navigation and other dashboards; misleading numeric summaries and controls are omitted in SSR/no-JS and hydrated output. Independent duplicate/future fixture tests passed both families × three frameworks × root/subpath with and without JavaScript (24 configurations), including navigation/analytics isolation and 320px; reordered/partial fixtures (12 each), 16 model tests, Astro fixture checks and strict React Operations types also passed. The broad JSON schema accepts these inputs; the behavior is a documented semantic validation rather than a claimed schema restriction. An integrated-branch invalid/partial/model rerun is in progress.

The integrated-branch `operations-invalid.mjs`, `operations-partial.mjs` and `test:examples` rerun passed after `a8b18cd`, including both languages × three frameworks × root/subpath with JavaScript/no-JavaScript fixtures.

### Composed search navigation

Two catalog search sections previously reused query IDs; Jekyll and Astro also duplicated the index ID and enhanced only the first form. The adapters now give each control its own label association and named search landmark; static adapters scope their index and results to each section. Controls on the same page share the URL query and synchronize on submission and history navigation without discarding host history state. Disposable two-search catalog builds test all frameworks, both families and root/subpaths for unique IDs, synchronized keyboard search, back navigation, axe and no-JavaScript browse links. The Jekyll inert-index injection regression remains in place. Distinct section titles are used by this fixture; duplicate titles and arbitrary host-page IDs are not covered.

The integrated-branch `search-composition.mjs` and `test:examples` rerun passed after `d19083f` across both languages × all three frameworks × root/subpaths.

### CI coverage and clean-checkout rehearsal

Commit `673022a` adds the existing cross-framework fixture regressions in three bounded parallel CI groups, connects root dashboard parity, keyboard-form, reading-typography and Astro fixture checks, and expands workflow path filters to include packages and dependency locks. It changes a read-only verification workflow; no remote workflow, release or deployment was triggered. In an archived clean checkout, locked root/Astro npm installs, React workspace builds, frozen Ruby/Bundler installs, model/fixture tests, fresh root framework builds and six root parity/keyboard/typography combinations passed. The full operations-directory group (72 isolated builds) took 3m55s locally and passed; an analytics precision scenario (12 builds) also passed. The full proposed three-group matrix performs 156 isolated builds and has 30-minute caps; GitHub-hosted duration, Playwright browser download and OS dependency installation were not exercised. YAML was parsed locally. A separate existing `ci.yml` invokes reference-release on pushes to main; this change neither modifies nor invokes that path.

### Astro family identity in the example shell

Commit `6ab5986` restores the existing family SVG marks and example-site names in Astro's source-informed header, adds base-aware Archive/Examples navigation and contextual dashboard footer links, and disables the appearance control without JavaScript. It retains Northlight as the fictional example identity without copying original owners or external legal links. Dedicated independent checks passed both families at root/subpaths for source SVG loading, keyboard/Escape focus, 320/1440 reflow, settled light/dark axe and no-JS; article screenshots were inspected at both widths without approving visual baselines. The full 47-route Astro suite passed both families/root/subpaths. An initial dark contrast reading during a color transition did not persist when motion was reduced and colors settled. Exact original shell/footer parity and manual assistive-technology review remain open. A targeted combined-branch rerun is in progress.

The integrated-branch Astro `test-source-shell.mjs` rerun passed both families at root/subpaths after `6ab5986`, including source identity, navigation, automated accessibility and no-JavaScript checks.

### CI shell and React composition coverage

Commit `db3b585` adds Astro/React source-shell and React gallery, simulation and workspace/chat composition suites to the existing read-only workflow, after checks consuming root-path outputs because these suites rebuild root/subpath output. A clean archived checkout with locked root/Astro npm installs and React workspace builds passed all five suites for both families/root/subpaths in 1m31s locally; existing search composition passed its 12 configurations in 38s. The step has a 10-minute cap, YAML parsed, and subsequent shell builds do not alter the Jekyll artifact output. GitHub-hosted timing and browser installation were not tested. No remote workflow, baseline approval, release or deployment was triggered.

### Canonical generated-content inventory

A no-JavaScript generated-DOM inventory examined all 50 records for each family across Jekyll, Astro and React. It checks canonical page titles and summaries; structured section content, headings, links, images and data-table semantics for 47 records; Jekyll-relative prose text; and core navigation and fixture tables for the three application dashboards. Expected Markdown footnote marker variation and Astro fingerprinting of the canonical CSV are handled explicitly, including a byte comparison. The audit found Jekyll administration exposed only five of 24 people with pagination disabled, whereas Astro and React exposed all 24. Jekyll now renders the full escaped directory with an “All people” static label; enhanced behavior still paginates. The inventory does not assert exact visual equivalence, all accessibility behavior or every detail of dashboard fixture content.

### Static chart alternatives

Jekyll and Astro chart-detail tables previously contained placeholders without JavaScript, unlike the React tables. Both now render the selected default-period daily sessions and downloads, category comparisons, and common-timestamp mean latency values as semantic tables. All three frameworks and both families matched the shared model for the four canonical charts with JavaScript disabled. Sparse observations retain unavailable preceding comparisons; disjoint monitoring series show no fabricated common points, and unsafe analytics totals do not produce chart values. Interactive filtering still requires JavaScript.

The integrated-branch static-chart-data check and `test:examples` passed after `0c74b13` using freshly built paired root sites. The first invocation lacked `NIGHTJAR_JEKYLL_ROOT` and stopped at its documented precondition; rerunning with the root builds and variable set passed all six language/framework comparisons.

### Controlled React dialog native closure

The workspace React Dialog components used a controlled `open` prop, but native `<form method="dialog">` closure did not call `onDismiss`, leaving parent state stale and preventing reopening. Both components now notify the consumer of native closes and avoid duplicate callbacks for prop-driven closure, including a close/reopen race. A local consumer test passed Chromium for both families: native form close, Escape, parent-driven close, focus restoration and rapid reopening. `npm run check` passed 110 tests and `npm run test:packages` installed and rendered both locally packed artifacts. The browser test is wired into the existing browser matrix; Firefox and WebKit have not yet been run locally. This changes workspace source, not the published npm archives.

The combined-branch React Dialog consumer check passed for both families after rebuilding the workspaces, using `PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium`. An initial invocation used a different browser override and could not find Playwright's downloaded browser; the next used stale package build artifacts and failed. Rebuilding `npm run build --workspaces` before the check resolved the stale-output failure. Chromium native close, Escape, controlled close, rapid reopening and focus passed; Firefox/WebKit remain unverified locally.

### Operations integer precision

Commit `3daab16` rejects unsafe per-sample latency/queue values and unsafe latest or per-timestamp sums across the whole operations snapshot, and uses exact integer mean rounding at the safe-integer boundary, including Jekyll no-JavaScript output. Independent and integrated-branch tests passed four schema-valid observation, queue-sum, historical-latency and safe-boundary scenarios across both families × three frameworks × root/subpaths with and without JavaScript, plus model checks. Whole-snapshot rejection deliberately makes the view unavailable for an unsafe historical observation even outside a selected window. The first integrated invocation used invalid scenario arguments and stopped before a fixture; rerunning with `observation`, `queue`, `latency` and `rounding` passed. CI adds 48 isolated builds to the capped operations group; hosted runtime has not been measured.

### React pagination boundary focus

The shared React Pagination component previously left focus on the document body after a keyboard activation disabled the focused control at the first or last page. Both families now move focus to the available direction when a focused pagination control becomes unavailable and the opposite direction is available; changes from outside the component and delayed updates after focus has moved do not reclaim it. Chromium consumer checks passed for both families, including both boundaries, two independent instances and external/delayed changes. `npm run check` passed 110 tests, and `npm run test:packages` installed and rendered both locally packed packages. The test is wired into the existing browser matrix; Firefox and WebKit have not yet been run locally. This changes workspace source, not the published npm archives.

The combined-branch pagination consumer check passed both families after rebuilding the workspaces, using system Chromium. It covered boundary focus and external state changes; Firefox/WebKit remain unverified locally.

### Manual tabs keyboard exit

In both workspace React packages, moving keyboard focus to an unselected tab left the selected tab as the sole tab stop. Tab or Shift+Tab could therefore land on another tab instead of leaving the tablist. Tabs now rove the tab stop with focus while preserving manual selection, and restore the selected entry point after focus leaves. A Chromium consumer check passed both families for forward/backward exit, re-entry, disabled-tab skipping, Home/End, manual activation, vertical arrows, two independent instances and automated axe. `npm run check` passed 110 tests, and `npm run test:packages` installed and rendered both locally packed packages. The browser test is wired into the existing browser matrix; Firefox and WebKit have not been run locally. This changes workspace source, not published npm packages.

The combined-branch Tabs consumer rerun passed for both families after rebuilding workspaces, using system Chromium; manual focus/selection and independent instances passed. Firefox/WebKit remain unverified locally.

### Error-summary link recovery

Both workspace React ErrorSummary components previously cancelled navigation whenever a target ID existed, even if the target was disabled or could not receive focus. They now retain native fragment navigation when focus does not move, while preserving direct focus for usable controls and native modified-click behavior. A local Chromium consumer passed both families for keyboard focus, heading and disabled-target fallbacks, missing targets, modifier clicks, previously cancelled events and automated axe. `npm run check` passed 110 tests, and `npm run test:packages` installed and rendered both locally packed packages. The browser test is wired into the existing browser matrix; Firefox and WebKit have not been run locally. Native fragment fallback does not guarantee focus on an unfocusable target. This changes workspace source, not published npm packages.

The combined-branch ErrorSummary consumer check passed for both families after rebuilding workspaces, using system Chromium. Enabled fields receive focus; unfocusable, disabled or missing targets retain native fragment fallback; modified links retain native behavior. Fragment navigation does not guarantee focus on an unfocusable target, and Firefox/WebKit remain unverified locally.

### Field description composition

The React Field components previously derived hint and error IDs directly from caller-provided input IDs. Two controls with distinct IDs such as `reference` and `reference-hint` could consequently create duplicate IDs, breaking label and description association. Field now generates independent description IDs, retaining the input ID and render-prop associations. Consumers relying on the formerly derived, undocumented helper IDs can explicitly provide unique `hintId` and `errorId` values, or use the rendered `aria-describedby` references; this migration is documented in both package READMEs. A Chromium local-consumer check passed both families for SSR/hydration, unique labels/descriptions, explicit legacy IDs, Switch reset/disabled semantics, no-JavaScript disclosure and automated axe. `npm run check` passed 110 tests, and `npm run test:packages` installed and rendered both locally packed packages. Caller-supplied IDs still must be unique, and independently mounted React roots need distinct `identifierPrefix` values. Firefox and WebKit are covered by CI but have not been run locally; published npm archives remain unchanged.

The combined-branch Field consumer and packed-package checks passed for both families after rebuilding workspaces, using system Chromium. The explicit description-ID compatibility caveat remains relevant for a future release; no packages were published.

### Additional public control audit

A disposable SSR/hydrated Chromium consumer found no defect in the bounded cases checked in both families: controlled Switch and disabled state, native radio arrow selection and reset, Fieldset descriptions, checkbox/file reset, controlled and independent Disclosure keyboard/external state, encoded TableOfContents fragment navigation, axe and no-JavaScript native switch/disclosure operation. No source or test change resulted; Firefox, WebKit and manual assistive technology remain unverified. After the latest component fixes, integrated `npm run check` passed 110 tests and `nightjar-conformance.mjs --check` verified the 300 inventory cells.

### Desktop zoom reflow equivalent

The available headless Chromium environment has no window-automation tools; setting its profile default-zoom preference did not change measured viewport or device pixel ratio. A CDP device-metrics check instead emulates a 1280×900 desktop’s CSS viewport at 200% and 400% using 640×450/DPR 2 and 320×225/DPR 4. Across Jekyll, Astro and React, both families and seven representative content, form and dashboard routes, it passed document reflow, button clipping, keyboard menu/dialog focus, form/search/dashboard actions and selected no-JavaScript fallbacks. This is viewport and density emulation, not genuine desktop browser zoom: zoom controls, browser chrome, visual scaling and rasterization remain unverified.

### Expanded operations CI rehearsal

A clean archived checkout at `d5ac386` ran the exact expanded `operations-directory` workflow group after operations precision coverage was added: all 10 scripts / 120 family-framework-base builds passed in 7m14.968s locally (user CPU 3m52.644s; system CPU 47.963s), under the configured 30-minute cap. Fresh locked root/Astro npm installs, React workspace builds and frozen Bundler installs passed using Node 24.19, Ruby 3.2.3/Bundler 2.4.19, a locked-gem cache and system Chromium 151. GitHub-hosted timing, Playwright download and OS dependency installation were not tested; no remote workflow was run.

### Large directory and repeated names

A deterministic 2,500-person fixture exposed repeated accessible names on selection and edit controls when people shared a name. Jekyll, Astro and React now append the record ID only for duplicate names; unique-name labels remain unchanged, and labels update after edits. Disambiguation assumes unique record IDs. A separate 12-configuration fixture passed duplicate and unique names, editing and no-JavaScript records across frameworks, families and root/subpaths. React also memoizes the applied collection and duplicate-name map: the fixture showed nine unnecessary model recomputations for nine draft characters before the change and zero afterward, until filters are applied. Filtering, stable name/ID sorting and pagination passed with 5–20 enhanced rows; the complete no-JavaScript directory still renders all 2,500 rows. In this environment the resulting HTML measured roughly 883–893 KiB and navigation plus hydration roughly 1.5–1.8 seconds; those figures are observational, not portable performance guarantees or budgets.

The integrated-branch duplicate-name fixture passed both languages × all three frameworks × root/subpaths after `3ce7a5d`. The 2,500-record React test passed both families/root/subpaths with stable sorting/filtering, bounded 5–20 enhanced rows and the full no-JavaScript fallback; observed HTML was 883–893 KiB and navigation/hydration 1.46–1.66 seconds in that local run, not a portable budget. `test:examples` passed as well.

### Operations fixture text and alert identifiers

Commit `8418ece` escapes Jekyll's static service, alert and activity text and matches acknowledgement buttons by exact dataset value rather than interpolating arbitrary IDs into a CSS selector in the shared Jekyll/Astro controller. A schema-valid fixture containing hostile HTML and quote/bracket IDs reproduced an injected element before the fix. Independent tests passed both languages × three frameworks × root/subpaths with and without JavaScript, including select, acknowledge/undo, exact focus and no injected DOM; the existing partial-data matrix, `test:examples` and workflow YAML parse passed. The bounded operations CI group gains this 12-build test. A combined-branch rerun is in progress.

The integrated-branch `operations-text.mjs` and `test:examples` rerun passed after `8418ece` for both languages × three frameworks × root/subpaths with and without JavaScript.

### Analytics and administration hostile fixture text

Commit `0b704ac` escapes Jekyll analytics option, category and date text. A schema-valid select-breaking category reproduced an injected element before the fix. The independent hostile fixture also exercises administration names, emails and quote/bracket IDs through edit and targeted bulk updates; Jekyll's static directory and hydrated exact-ID matching held without further source changes. All 12 family/framework/root-subpath builds passed with and without JavaScript; canonical reordered analytics, `test:examples` and workflow YAML parsing also passed. The bounded analytics-coverage CI group adds this 12-build test. An integrated-branch rerun is in progress.

The integrated-branch `dashboard-text.mjs` and `test:examples` rerun passed after `0b704ac`, covering both languages × three frameworks × root/subpaths with and without JavaScript.

### Additional reading and data composition audit

A disposable SSR/hydrated Chromium consumer found no defect in the bounded cases checked in both families: two independently named Articles and DataTables, keyboard horizontal table scrolling at 320px, encoded space/Unicode contents links, Fieldset external/hint/error descriptions, native radio arrows, controlled Select, multiple FileInput selection/reset, axe and no-JavaScript article/table/radio behavior. No source or test change resulted. This is representative Chromium evidence; Firefox, WebKit and manual assistive-technology behavior remain unverified.

A further disposable SSR/hydrated Chromium consumer found no defect in two independently controlled forms in either family: keyboard Select/Radio/Checkbox state and reset, conditional Field hint/error recovery, multiple-file reset, special-character contents links, axe and no-JavaScript field/checkbox behavior passed. No source or test change resulted; Firefox/WebKit and manual assistive technology remain unverified.

### Directory duplicate email normalization

Commit `ab63645` trims and compares both stored and draft email addresses case-insensitively when checking duplicates, while exempting the current record during edits. A schema-valid stored email with leading whitespace previously bypassed the check; model and browser regressions failed before the change. Independent tests passed both languages × three frameworks × root/subpaths for duplicate rejection, error feedback, correction and no-JavaScript data; `test:examples` and workflow YAML parsing passed. The bounded operations/directory CI group adds this 12-build fixture. An integrated-branch rerun is in progress.

The integrated-branch `administration-email.mjs` and `test:examples` rerun passed after `ab63645` across both languages × three frameworks × root/subpaths.

### Literal All service identifier

Commit `0460b44` distinguishes a schema-valid service ID `All` from the all-services filter. Existing `service=All` URLs retain their meaning; the literal ID uses `serviceId=All`, survives reload and scopes service, alerts, activity and peer comparison. An empty option value represents all services because the schema disallows empty IDs. The independent schema-valid fixture reproduced the pre-fix ambiguity and passed both languages × three frameworks × root/subpath with and without JavaScript (12 builds), including legacy links, selection, clearing and scoping. Hostile-text and partial-data matrices, 19 model tests and strict React types passed. The CI group gains this fixture; an integrated-branch rerun is in progress.

The integrated-branch `operations-sentinel.mjs` and `test:examples` rerun passed after `0460b44` across both languages × three frameworks × root/subpaths.

### Literal All analytics category

Commit `e9e6352` distinguishes an explicit `categoryId=All` from legacy unscoped `category=All`, preserving existing URL meanings and peer comparison while using an empty all-categories option value. The schema permits `All` in the category list but restricts observation categories to Research/Publications/Workshops, so the literal category correctly yields no observations. Independent tests passed 12 family/framework/base builds with no-JS/default output, legacy URLs and scope restoration; hostile-text, sparse and precision matrices, 21 model tests, strict React types and YAML parsing passed. Administration's status enum excludes `All`, so no status change was needed. The DOM all-categories option value changed from `All` to empty; consumers relying on that markup need to account for it. A combined-branch rerun is in progress.

The integrated-branch `analytics-sentinel.mjs` and `test:examples` rerun passed after `e9e6352` across both languages × three frameworks × root/subpaths.

### Duplicate analytics declarations and observations

Commit `82db6e5` deduplicates repeated category declarations in selectors and comparison series across all renderers while retaining and summing every repeated date/category observation. React source-row keys distinguish repeated observations. An independent schema-valid adversarial fixture, sentinel and ordering regressions each passed both languages × three frameworks × root/subpaths with and without JavaScript, including filtering and recovery; 22 model tests, strict React types and workflow YAML parsing passed. The bounded analytics CI group adds this 12-build test. An integrated-branch rerun is in progress.

The integrated-branch `analytics-duplicates.mjs` and `test:examples` rerun passed after `82db6e5` across both languages × three frameworks × root/subpaths.

### Operations calendar timestamp validation

Commit `447bc63` reports a clear operations data error for impossible UTC snapshot, sample, alert or activity timestamps that the schema's pattern permits, in SSR/no-JS and hydrated views. Valid operations headings derive their displayed snapshot from the actual timestamp, including seconds; invalid timestamps do not produce a bogus time element. Independent tests passed five fixture modes across both languages × three frameworks × root/subpaths with and without JavaScript (60 builds), plus sentinel, duplicate/future and partial regressions, 23 model tests, strict React types and YAML parse. The bounded operations CI group adds these five modes; GitHub-hosted duration remains unmeasured. Valid `as_of` headings in analytics and administration are being reviewed separately.

### Dashboard snapshot labels

Commit `96a09b9` derives analytics, administration and operations snapshot labels from the actual UTC `as_of`, including nonzero seconds, instead of hard-coding the original fixture date. Invalid timestamps show an explicit invalid label rather than a false time element; analytics/administration remain available independently, while operations retains its separate data validation. Independent changed/invalid schema-valid fixtures passed all three dashboards × both languages × three frameworks × root/subpaths with and without JavaScript (24 builds, 144 page checks); `test:examples`, strict React types and YAML parse passed. Two CI modes add 24 fixture builds; hosted runtime remains unmeasured. Analytics observation calendar validation is under separate investigation.

### Analytics observation calendar validation

Commit `acebe4a` rejects impossible analytics observation dates anywhere in the snapshot with an explicit analytics-only unavailable state; it does not conflate this with operations or snapshot-label validation, and administration remains available. Independent normalized-invalid-day and invalid-month fixtures passed both languages × three frameworks × root/subpaths with and without JavaScript (24 builds); duplicate/sparse regressions, 24 model tests, strict React types and YAML parsing passed. The bounded analytics CI group adds two modes. An integrated rerun is in progress; the initial command passed a positional `month` argument although the test uses `--month`, so the explicit flag will be run separately.

### Fresh-checkout example setup

The page-archetypes README now gives a complete paired Jekyll/Astro/React root-path build and browser-check sequence, including the separate locked dependency installs and the directory shape required by cross-framework tests. A clean Git archive passed fresh root and Astro `npm ci`, both frozen Bundler installs using the existing local Ruby gem cache, all six root-path builds, the 300-route content inventory and all six dashboard behavior-parity cases. System Chromium was used; a fresh browser download and fresh Ruby gem download were not tested in that run.

### Clean paired example setup

Commit `1a713db` documents the complete paired root-path Jekyll/Astro/React build sequence, browser setup and `NIGHTJAR_JEKYLL_ROOT` directory layout in the canonical and synced READMEs. An independent clean Git archive passed fresh root/Astro npm installs, frozen Bundler installs using the existing local gem cache, all six builds, the 300-route content inventory, six dashboard parity cases and `test:examples`. Fresh Ruby-gem and Playwright-browser downloads were not exercised.

The integrated-branch `analytics-calendar.mjs` day case and explicit `--month` case passed after `acebe4a` across both languages × three frameworks × root/subpaths with and without JavaScript; `test:examples` also passed. The initial positional `month` invocation repeated the day case; the explicit flag corrected that coverage.

### Expanded visual identity sweep

Commit `c39a3e6` restores family-styled React action anchors (including pricing), Astro card rules, React pricing card rules and Astro nested heading sizes. An independent sweep captured the remaining 43 records × both families × Jekyll/Astro/React × 320/1440px (516 full-page images), with no document overflow, asset-response failures or browser errors; matched desktop h2 roles/sizes agreed within each family. The focused cross-framework regression passed all six combinations at both widths, JS/no-JS, action focus/destinations, nested headings and light/dark axe; full Astro and React catalog suites passed both families/root/subpaths. Captures are evidence at `/workspace/nightjar/visual-breadth-evidence/` and `/workspace/nightjar/visual-breadth-after/`, not approved visual baselines. This sweep and targeted corrections do not establish complete aesthetic, accessibility or cross-browser conformance; see `examples/page-archetypes/READING-VERIFICATION.md`.

The integrated-branch `card-action-parity.mjs` rerun passed after `c39a3e6` against freshly built root sites in all six language/framework combinations. No installed screen reader, Firefox or WebKit executable was found locally; those manual and cross-engine reviews remain open.

Commit `1139fcc` wires the already-passing card/action parity check into the existing read-only root-build CI sequence, before any suite that replaces those outputs. It uses the same paired build paths as the preceding reading check. No remote workflow was triggered.

### Final bounded fixture CI rehearsal

A fresh archived checkout at `60559b3` passed the exact three CI fixture groups with two CPUs per group: analytics coverage 132 builds in 11m11.5s; analytics precision 36 in 3m33.4s; operations/directory 216 in 15m15.3s. Operations and coverage ran concurrently on separate CPU pairs, with precision following coverage while operations continued. Locked root/Astro npm installs, workspace builds and frozen Bundler installs passed using cached gems and system Chromium 151. Every page-archetype `.mjs` test was wired directly or through an npm alias at that snapshot. The longest fixture phase was below its 30-minute cap locally, but hosted setup, browser download and GitHub runtime remain unmeasured. No remote workflow, release or push was triggered.

### Print media and directory records

Chromium print emulation checks 50 routes across three frameworks, both families and light/dark appearance (600 views) for readable foregrounds on white, navigation removal and horizontal clipping. Print styles now use a white background and dark text, wrap preformatted content and tables, and retain workspace titles and directory headings. Directory printing includes every matching record while preserving the screen page, filter, URL and checkbox selection; no-JavaScript output retains all static records. A4 Chromium PDFs with background printing disabled contained all 24 fixture names in each framework; selected workspace, FAQ and operations PDFs were also inspected. Chromium reveals closed FAQ and chart disclosures in print without changing their open state, including with JavaScript disabled; browsers lacking the `details::details-content` pseudo-element require opening those details manually. This evidence does not certify physical printers, other browser engines, page breaks or every generated PDF.

The integrated-branch print rerun after `25c9383` passed against fresh root builds: filtered directory printing and restored screen state, disclosure output/state, and the 600-route/mode print-media inventory across both languages and three frameworks. The same limitations remain: physical printers, PDF page-break quality, and non-Chromium disclosure support are not certified.

### Rapid directory submission integrity

Commit `91fd12d` coalesces same-task successful directory submissions and validates/allocates against the latest React page-memory records, including after bulk changes. The shared Jekyll/Astro controller also avoids a spurious second validation error. Two same-task submissions previously produced React records with identical IDs/emails. The independent 12-build regression passed both families × three frameworks × root/subpaths for same-task submits, separate clicks, edit and bulk-then-save; expanded six-case root parity checked two-page selection, confirmation, untouched records and clearing on filter. Existing email/ID fixtures, `test:examples`, strict React types and YAML parsing passed. The CI fixture group gains this case. Print code was left unchanged; an integrated-branch rerun is in progress.

The integrated-branch `administration-rapid.mjs` and `test:examples` rerun passed after `91fd12d` across both languages × three frameworks × root/subpaths, including the current print-integrated branch.

### Dashboard model mutation probes

In a disposable copy of the shared dashboard model and its Node test fixture, isolated mutations to email case normalization and self-exclusion, current and preceding category scope, safe-integer accumulation, duplicate/future timestamps, timestamp alignment (including positional pairing), and exact rounding were each rejected by the existing model tests. A separate mutation that omitted the first day from an otherwise complete preceding-period aggregate survived: earlier tests checked availability but not the total. A regression now asserts the four independently summed Research fixture totals for 15–21 October and the resulting session comparison; the same mutation fails that assertion. These probes cover specific faults, not exhaustive mutation coverage or every browser adapter. No production model was modified by the experiments.

### Source archive safety and release review

Commit `3e4263b` builds both Jekyll sites and their downloadable source ZIPs from explicit tracked-source manifests in a temporary staged tree. Unlisted local files are excluded; listed symlinks, missing files, traversal and source-overwriting destinations are rejected before Jekyll runs. Synthetic `.env` and external-symlink canaries reproduced leakage before the fix. Disposable no-Git root/subpath builds, unpacked standalone builds, link validation, negative cases, manifest staleness and two reproducible staged builds passed independently; the combined-branch manifest check, `source-archive.test.py` and `test:examples` also passed. Intended new source files must be staged and the manifest updated using the documented workflow. The manifest does not detect secrets deliberately placed inside allowed source files.

A clean release-review snapshot at `b8c497d` passed root/Astro npm installs, `npm run check` (110 tests), example model tests, agent archives, isolated packed React installation/rendering and strict TypeScript imports; two separate package builds and Jekyll/Astro/React site outputs were byte-identical. Six npm audits reported zero vulnerabilities at that snapshot. Its 220 exported patches applied cleanly to the original `4935a11` feature tip and reproduced the same tree; commits after that snapshot require a fresh export/recheck. GitHub API/permission queries returned Envoy 403 during the review; a configured shell token's current validity and actual push authorization remain unverified. Ruby advisory coverage remains unverified because the advisory tool was unavailable and the OSV endpoint was blocked. Existing main-push CI invokes reference-release, and prerelease publication triggers npm publishing; neither was invoked. Human review, full manual assistive technology/cross-browser testing and release procedure review remain required before release.

The integrated source-manifest rehearsal at `5772352` passed in a fresh Git archive: locked root/Astro installs, workspace and frozen Bundler builds, archive safety, 25 model tests, both Jekyll root/subpath builds and link checks, six dashboard parity cases, simulation composition (8 builds), form/chat composition (12), duplicate-analytics (12) and partial-operations fixtures (12). Using cached gems and system Chromium, 222 freshly generated patches applied cleanly to original feature tip `4935a11`, producing tree `e0caf6cb` identical to the tested source and a clean worktree; manifest `--check` passed there. Hosted browser/gem downloads were not tested. Later ledger-only commits require a refreshed patch if reproducing the current tip.

### Hostile canonical Markdown

Schema-valid section text could contain raw HTML and dangerous Markdown links. Jekyll previously emitted both through `markdownify`, while Astro and React disable raw HTML for ordinary content and sanitize the special MathML fixture. Jekyll now sanitizes rendered Markdown with the locked `sanitize` gem and a local Liquid filter, preserving allowed formatting, footnotes and MathML; escaping before the filter ensures `--safe` builds remain inert when local plugins are disabled, but those builds display HTML markup as text. The disposable hostile-content check exercises both families, Jekyll/Astro/React, root/subpaths and JS/no-JS, including hostile titles, event handlers, encoded dangerous links, valid links and MathML. The added locked versions are sanitize 7.0.1, Nokogiri 1.19.4, crass 1.0.8, racc 1.8.1 and mini_portile2 2.8.9 (generic parser build). Artifacts were installed locally via the inherited proxy; `bundler-audit` is unavailable, so Ruby advisories were not scanned. Fresh hosted Bundler download and non-Linux installation remain unverified.

The integrated-branch hostile-content regression passed all 12 language/framework/base combinations with and without JavaScript after `47d4124`; both Jekyll `--safe` fallbacks remained inert. Source-manifest `--check`, source-archive tests and `test:examples` also passed using the locally installed locked Ruby gems. The safe-mode presentation and Ruby advisory/install limitations above remain.

At `c81fa04`, a fresh 225-patch series applied to detached original feature tip `4935a11` and reproduced tree `51a73cc6d7473a877775863daf8ea13bacd0835f` with clean status. The reconstructed tree passed source-manifest `--check` and the archive round-trip/negative-case suite, including both sanitizer plugins, root/subpath and unpacked builds using cached Ruby gems. `git am` reported one historical trailing-whitespace warning but succeeded. The snapshot export is `/workspace/nightjar/markdown-verified-patches`; later commits require a fresh export. No remote operations or fresh gem downloads were tested.

### Structured catalog URLs and dates

Commit `9260e37` escapes Jekyll structured URL attributes, preserving query strings such as `?x=1&copy`; renders invalid catalog dates inertly and consistently in all three frameworks; and lets Astro display a valid date without an author. The catalog verifier checks local route pathnames separately from query/fragment and enforces realpath containment, rejecting traversal/symlink escape and unknown routes. Independent URL/date adversarial matrices passed both languages × three frameworks × root/subpaths with and without JavaScript (24 builds), including hostile event attributes, page/listing dates, card/figure/FAQ/title text, year-zero dates and valid date-only metadata. Six reading-layout checks, Astro/React source-shell checks, source archive and manifest, `npm run check` (110), `test:examples` (26), strict React types and YAML parsing passed. Event datetime attributes were checked for escaping; their calendar semantics remain unconstrained by schema. CI adds the two bounded fixture modes. A combined-branch rerun is in progress.

The integrated-branch `catalog-structured-safety.mjs` URL and date modes and `test:examples` rerun passed after `9260e37`, covering both languages × three frameworks × root/subpaths with and without JavaScript.

### Markdown links under subpaths

A disposable paired fixture reproduced Jekyll root-relative Markdown links and images escaping a `/preview` deployment, and Astro/React adding that prefix twice to already-prefixed paths. Jekyll now rebases within the existing HTML sanitizer, and the shared Astro/React renderer applies the prefix once. The expanded hostile-content regression checks root and subpath links/images, already-prefixed paths including query boundaries, near-prefix paths, ordinary relative paths, fragments and protocol-relative URLs, while retaining dangerous-URL and Jekyll `--safe` checks. A path already beginning with the configured deployment prefix is treated as already prefixed; use a relative URL when a distinct root path happens to share that prefix.

The integrated-branch Markdown subpath/security regression, source-manifest check and `test:examples` passed after `470962f`, including all 12 language/framework/base combinations with JS/no-JS and both inert Jekyll safe-mode fallbacks.

### Native theme token declarations

The native npm package audit found that runtime `design` exports include token groups absent from generated TypeScript declarations. Isolated branches `nightjar/design-types` fix both packages: Martlet commit `79e4383` in `/workspace/nightjar/martlet-design-types` and Krigsvold commit `79f0cab` in `/workspace/nightjar/krigsvold-design-types`. Declarations now derive group names from the source; regressions cover every runtime group and string-valued token. On those worktrees, fresh `npm ci --ignore-scripts`, builds and suites passed (13 Martlet, 14 Krigsvold tests), and independent strict TypeScript consumers checked widths, shadows, motion, Krigsvold breakpoints and rejection of an unknown group. Both Astro package suites also passed three tests each in the audit. Initial direct `npm test` in the fresh worktrees failed because dependencies were not installed; rerunning after `npm ci` passed. The worktrees are clean. Local exports are `/workspace/nightjar/martlet-design-types.patch` and `/workspace/nightjar/krigsvold-design-types.patch`; no pushes or package publications were made.

Follow-on native theme commits `8a77780` (Martlet) and `191196d` (Krigsvold) expose shipped foundation provenance fields in TypeScript, including source repository/commit and Krigsvold source files/normalization. Both isolated worktrees rebuilt cleanly and passed 14/15 tests respectively on the integrated follow-ups; independent strict TypeScript consumers exercised those fields. The local per-repository patch exports have been refreshed to include both commits in each branch. The inspected native Astro layout contracts showed no additional confirmed mismatch; no packages were published or pushed.

### Firefox and WebKit availability

A nonprivileged check found no Firefox, geckodriver, WebKit MiniBrowser/WebDriver, Playwright browser binaries, or cached distribution packages in the available workspace and system locations. Playwright 1.64.1's official Firefox 157.0 archive request to `cdn.playwright.dev` received an inherited-proxy CONNECT HTTP 403. The configured Debian snapshot metadata request also received CONNECT HTTP 403, and the local APT index offered no Firefox ESR candidate. No fallback mirror, proxy change, direct-network bypass, system package installation or root operation was attempted. WebKit 27.2's archive was not requested after the Playwright CDN denial. Consequently no Firefox or WebKit browser tests were run, and the prior Chromium evidence does not establish cross-engine compatibility. These observations describe this environment, not availability on another machine or CI runner.

### Initial-state accessibility inventory and transition contrast

A fresh Chromium 151 scan of all 300 root-path route states (50 routes × two families × three frameworks) initially reported intermittent Astro button contrast violations. The native button background transitioned for 200 ms as disabled controls became enabled, while the text changed immediately. A deterministic contact-form transition probe reproduced minimum observed ratios of 1.23:1 for Martlet and 1.19:1 for Krigsvold with the former transition restored in disposable built outputs. Astro buttons now change colors immediately; this removes their background and border hover transition as well. The undelayed full 300-route axe scan passed after the fix, and the deterministic probe passed in both families. The scan covers initial states and WCAG-tagged automated rules, not every interaction, appearance, browser or assistive technology.

The new inventory and transition regression are wired into the existing read-only workflow; hosted timing remains unmeasured. Astro's full 47-content-route suite and analytics workflow passed in both families at root and `/preview`, including representative axe, print, no-JavaScript, filtering and recovery. `test:examples` passed 26 tests; the conformance inventory, source manifest and workflow YAML checks passed. Fresh hosted browser installation and manual accessibility review remain open.

### GitHub branches and draft review

The user authorized Git and GitHub operations. Git's configured credentials successfully pushed the workbench `nightjar/audit` branch and both npm `nightjar/design-types` branches, despite `gh auth status` still reporting its separately configured `GH_TOKEN` invalid. Draft pull requests are [workbench #19](https://github.com/k3jph/design-workbench/pull/19), targeting the existing `feat/portable-page-archetypes` branch, [Martlet npm #7](https://github.com/martlettheme/npm/pull/7), and [Krigsvold npm #8](https://github.com/krigsvoldtheme/npm/pull/8). The workbench pull request queued portable-example and three-browser workbench workflows; their results were not yet available when recorded. npm branch pushes trigger verification; publication requires a separate release event. The workbench main-branch reference publication is restricted to pushes to `main`, and no release, main push or deployment was made.

GitHub's push response reported 65 Dependabot alerts on the workbench default branch (4 critical, 25 high, 24 moderate, 12 low). The previously reported zero-vulnerability npm audits apply to the tested Nightjar snapshots and do not resolve or explain those default-branch alerts. Their details have not been examined.

At workbench head `189b6ab`, hosted Verify workbench run `40855813741` passed Chromium, Firefox and WebKit; the publication job was skipped. The portable-example main job failed before the cross-framework security test because workspace React packages had not yet been built; its analytics-precision fixture job passed and the other fixture jobs were still running at this observation. Both native npm pull requests passed hosted verification. A clean-checkout reproduction and fix for the workbench prerequisite are being integrated separately.

Read-only follow-up npm audits found zero vulnerabilities in the active Nightjar root and Astro slice lockfiles. The default-branch root lock has a high-severity Zod advisory (GHSA-mrhx-c7xc-m3w5) fixed in the Nightjar feature branch. Each of four historical adoption lockfile snapshots individually reports five vulnerable packages; those snapshots are unchanged from main and are not installed by active CI. They were preserved as historical dependency evidence, not asserted safe for reuse. Direct GitHub API access to enumerate Dependabot alerts and the Ruby advisory service remained blocked by proxy CONNECT 403; the 65 default-branch alerts cannot be reconciled from these observations, and Ruby advisory coverage remains unverified.

### Dark-appearance route accessibility

An initial saved-dark Chromium scan of 300 route states found the local-index label below contrast in 18 Jekyll routes per family (4.21:1 Martlet and 3.22:1 Krigsvold). A subsequent scan also found Martlet's inherited blockquote and footnote text at 3.17:1 in the stress fixture. The shared Jekyll example styles now use the existing dark link role for the index label and the text role for those prose elements. After rebuilding, the 100 Jekyll dark route states passed; the unchanged Astro and React outputs had passed their 200 dark route states in the preceding run. The scan is wired into CI for both default and saved-dark appearances; it does not certify all states or manual accessibility. `test:examples`, source-manifest and conformance consistency checks passed locally.

### Hosted portable checks and cross-engine coverage

Commit `49d8655` moves the React workspace build before the portable security and composition tests. A clean checkout reproduced the hosted missing-`@martlet/react` failure before that build; after it, the full hostile-content test passed all 12 family/framework/base combinations with and without JavaScript and both Jekyll safe-mode fallbacks. Security assertions were retained.

Commit `082771c` adds a bounded Firefox/WebKit hosted matrix for portable examples: both families and Jekyll/Astro/React, with article, local sign-in and analytics routes, 320px reflow, keyboard submission and dashboard navigation, data-table disclosure, local resource responses and script errors. The same six framework/family cases passed in local Chromium. Firefox/WebKit portable-route results remain pending hosted execution; the previously successful three-engine workbench workflow tests components and reference applications, not this new portable smoke. The new matrix is not a substitute for the full Chromium fixtures or manual assistive-technology review.

All three hosted portable fixture groups on `189b6ab` subsequently passed (analytics precision, analytics coverage and operations/directory). The separate main job remained failed at the workspace build ordering described above; later steps did not run on that job.

### Reading and document section navigation

Review of matched screenshots identified a navigation gap: Jekyll's 18 reading and document recipes provided an “On this page” index, while their Astro and React ports did not. Commit `6a24895` restores native fragment indexes in both ports, with the existing family styles and print hiding. The independent regression passed all 18 recipes × two ports × two families × root/subpaths, with and without JavaScript, including keyboard activation, destination IDs and 320px reflow. Focused light/dark axe, strict React types and both complete 47-route Astro/React catalog suites also passed. The new regression is wired into the read-only CI workflow. No visual baseline was approved.

The integrated-branch index regression also passed all eight port/family/base combinations after rebuilding the React workspaces.

GitHub rejected portable workflow run `40857912588` before job creation because the new smoke job referenced `runner.temp` in job-level `env`, where that context is unavailable. The workflow-run connector omitted this validation failure; the Actions run page exposed it. The workflow now derives the same path from `RUNNER_TEMP` inside the two relevant steps. YAML and shell syntax checks passed; a new hosted run is required to establish scheduling and browser results.

The corrected hosted run `40858245268` on `06e5a5b` created its jobs and passed both new Firefox and WebKit portable smoke jobs across the two families and three frameworks. At this observation its main example and fixture jobs were still running; the bounded cross-engine cases do not establish full cross-browser parity.

### Portable breadcrumbs

Commit `0531774` corrects Astro's missing Examples ancestor and Home self-link, and removes the React catalog's self-link as an ancestor. Separators are hidden from assistive technology. The independent regression passed both ports and both families at root/subpaths, JS/no-JS, keyboard navigation, mobile reflow and home, catalog, article and dashboard structure. Full Astro and React source-shell suites passed in both families and bases, including axe, dark appearance, print and no-JS; strict React types passed. The focused regression is included in the read-only CI sequence.

The integrated-branch breadcrumb regression passed all eight port/family/base combinations. On hosted run `40858245268`, the original package-build problem was resolved and the hostile-content security matrix passed, but the main example job later failed waiting for the second Jekyll gallery dialog in the composition test. That failure is under investigation; subsequent main-job checks did not run.

### Gallery close focus handover

The hosted failure exposed a real race: a queued close event could return focus to the first gallery after the user had already focused the second, causing Enter to reopen the first dialog. Commit `0e0d717` restores focus only when it is lost or remains inside the closed dialog, preserving a meaningful new focus target in Jekyll, Astro and React. A deterministic handover regression failed before the change in Jekyll and React. Independent and integrated paired gallery suites passed both families and root/subpaths, including normal Escape focus return, independent dialogs, axe and no-JS; the React suite also passed its legacy-dialog fallback. Same-gallery rapid reopening is being examined separately. A fresh hosted main-job run is still required.

The follow-up reproduced a second React race: a queued close could clear selection after the same gallery reopened. Commit `6ad27f8` opens the React dialog on activation and ignores stale close events while it is open; Jekyll and Astro also ignore a close callback for a reopened dialog. Before the change, the deterministic same-gallery test failed in React; Jekyll and Astro passed that scenario. Independent and integrated gallery suites passed both families and bases after the fix, including same-image and different-image reopening, focus handover, Escape and no-JavaScript fallbacks. These are Chromium results; fresh hosted results remain pending.

### Search recovery parity

Commit `0301130` adds the base-aware example-index recovery link to Jekyll and Astro no-result search messages, matching React. Query text remains a text node. Independent and integrated search-composition checks passed both families, three frameworks and root/subpaths, including synchronized search controls, hostile queries, keyboard activation, back/recovery, axe and no-JS; Jekyll search-index safety and source-manifest checks passed.

At `527793c`, hosted Firefox and WebKit portable smoke jobs and analytics precision passed, while the main job reported Krigsvold dark dashboard button contrast failures during the appearance transition. The other two fixture jobs were still running at this observation. A deterministic follow-up found an intermediate ratio of 1.26:1; a fix is being verified before integration.

Commit `d3b23d8` switches Krigsvold example button foreground and background colors together while retaining non-color transitions. The added regression samples both primary and secondary buttons through light/dark changes and checks hover in each appearance; it failed before the fix and passed afterward. The complete integrated dashboard suite passed 70/70 on system Chromium after fresh paired builds. Its first local invocation used a temporary Playwright configuration with the wrong server working directory and was stopped after 404s; correcting that directory produced the passing run. Hosted verification of the fix is pending. The separate hosted workbench run `40859642135` passed all three engines at `527793c`.

### Accessibility in cross-engine portable smoke

Commit `4f50470` extends the representative portable smoke to saved light and dark appearances, running WCAG-tagged axe scans on article, validated sign-in and filtered analytics with its chart-data disclosure open. Fresh integrated Chromium builds passed the existing interactions and reported no axe violations across 36 states. Axe marked color contrast incomplete in 16 scans: all 12 analytics states and four light Jekyll article/form states. The script logs affected rule IDs and node targets for manual review; incomplete is not a pass. Hosted Firefox/WebKit execution of this expanded check remains pending.

Hosted portable run `40860720186` at `1bb3e46` passed Firefox and WebKit smoke, analytics precision, the dashboard suite and the previously failing security/gallery composition step. Its main job later failed the 200% root-text assertion for Martlet's Jekyll analytics page: hosted Chromium reported 16px rather than the asserted 32px. Exact-head Jekyll builds passed the same test in local Chromium 151; the hosted cause remained undetermined at this observation, and the assertion was retained. The two longer fixture jobs were still running. Hosted workbench run `40860720427` passed Chromium, Firefox and WebKit.

All three fixture groups in `40860720186` subsequently passed. Commit `cd46bd0` adds failure-only root-style and browser diagnostics to the enlarged-text check without changing its assertion. Both Jekyll families passed the integrated local run; a forced-failure probe confirmed the diagnostic still fails the assertion. A new hosted run is required to determine whether the original failure recurs and, if so, why.

Commit `c156a8f` records and automates a bounded follow-up to the incomplete contrast results. Across the 12 framework/family/appearance filtered analytics states at 320px, the integrated Chromium check measured 17 SVG labels per state at 6.06:1 or higher, 75 source-table cells per state at 13.72:1 or higher, and verified keyboard horizontal scrolling. For the supplied Jekyll light mastheads, the current navy base and gradient endpoints measured at least 10.12:1 for Martlet and 17.06:1 for Krigsvold. The test rejects changed gradients, images or transparency assumptions for review; disposable mutations rejected a 2.85:1 SVG label and a changed gradient. It is wired into CI. These computed-color and screenshot observations are limited to the stated fixtures and Chromium viewport; axe's incomplete results remain incomplete, and custom hero images, SVG overlaps, other engines, hover and assistive technologies remain open. See `examples/page-archetypes/CONTRAST-VERIFICATION.md`.

### Scrolling Martlet header contrast

The expanded hosted Firefox smoke at `ba2de68` and `1b5056f` reported low contrast in the fixed Martlet Jekyll header after form validation. The source header animated from transparent to navy for 500 ms while its text remained light, allowing it to cross light page content with insufficient contrast; a deterministic Chromium scroll-opacity probe reproduced the issue. Commit `23d365b` changes the example adapter so header background and foreground roles switch immediately while non-color transitions remain, leaving the hash-verified source shell untouched. The first attempted background-only change also exposed a dark-mode foreground transition and was revised before commit. The final regression checks the scroll transition and light/dark header axe states. The full integrated dashboard suite passed 71/71 on system Chromium; Firefox and the complete hosted run need a fresh check.

At `815e9a6`, the expanded portable smoke passed Firefox and WebKit in both appearances, asserting no WCAG-tagged axe violations. Each engine logged 16 incomplete color-contrast results, principally chart labels, table content and Jekyll light mastheads; those results remain open. The earlier `ba2de68` main job passed the 32px enlarged-text assertion on rerun, so its intermittent earlier failure remains unexplained; it subsequently passed the large-directory and source-shell checks, and its final section-navigation step was still running at this observation.

### Portable report downloads

Commit `8e58ed7` adds a bounded optional download filename to the shared action schema and preserves it in section and plan actions across Jekyll, Astro and React. The report now suggests `observations.csv` in every port. Before the fix, Chromium downloaded a `text/csv` response but Astro suggested a fingerprinted filename; a `text/plain` response navigated away instead. Independent and integrated regressions passed both families × three frameworks × root/subpaths with and without JavaScript, checking keyboard downloads, exact bytes, names and preserved query/fragment. Schema-invalid hostile names were rejected and remained inert when deliberately rendered; full Astro/React catalog suites, strict React types, example model and source-archive checks passed independently. The regression is wired into CI. Browser same-origin rules and server `Content-Disposition` headers can affect final behavior; see `PORTING.md`.

### Reduced-motion root text race

The intermittent 16px result was reproduced: the Jekyll shells' universal reduced-motion rule sets a `.01ms` duration, activating an implicit `all` transition on the root. Reading font size in the same browser task that applies 200% can therefore capture the old 16px value. Commit `477302c` sets transition duration to zero under reduced motion in the shared example adapter, without modifying the source-shell hashes. The strengthened test checks 32px in that same task and again after fonts load; it failed before the fix and passed afterward. The integrated 200%/reduced-motion keyboard and reflow suite passed all six framework/family combinations at 320 and 768px in Chromium. This is not a genuine desktop browser zoom test.

### Workspace search fields

Commit `05c83af` aligns matching across the workspace records' title, status, summary, ID and owner, including the displayed `ID · owner` form. Before the fix, common cross-field queries matched only React while the displayed separator matched only Jekyll/Astro. Independent and integrated paired composition regressions passed both families, three frameworks and root/subpaths, including cross-field and negative queries, review-state changes, focus recovery, hostile owner text, axe and no-JS. Jekyll and Astro deliberately retain their former raw DOM-text fallback, so unusual queries dependent on literal rendered whitespace can still differ from React.

Hosted portable run `40863708561` at `815e9a6` completed successfully: its main example job, all three fixture groups and both expanded Firefox/WebKit smoke jobs passed. The smoke jobs each reported 16 axe color-contrast results requiring manual review; a green job does not resolve those incompletes. The later `abd3f5c` run was still underway at this observation.

### Local chat feedback

Commit `d372209` replaces stale “Added” feedback with an accessible validation status when a subsequent local chat submission is empty or whitespace-only, and restores the neutral status when the user edits. Existing messages and independent conversations are preserved. Before the change, the paired regression reproduced stale success after an invalid native submission. The independent 12-build composition test passed both families, three frameworks and root/subpaths, covering focus, invalid input, valid recovery, independent state, reset, axe and no-JS; related chat, React workspace, type, model and source-archive checks passed. An integrated rerun is in progress.

The integrated paired form/chat and chat composition reruns passed after `d372209`, along with `test:examples` and the source-manifest check.

Commit `182174e` prevents Jekyll and Astro from rewriting the unchanged neutral chat live-status text on every keystroke, matching React. Before the change, typing a 12-character draft caused 12 DOM mutations to `role=status`. The independent and integrated 12-build paired form/chat regression passed after the guard, including validation, focus, independent state, axe and no-JS. This is evidence about DOM updates, not certification of how a screen reader announces them.

Hosted portable run `40866154033` at `abd3f5c` passed all six jobs, including the strengthened reduced-motion and workspace checks and report-download regression. Firefox and WebKit smoke jobs still logged their axe incomplete color-contrast results for manual review.

### Search initialization fallback

Commit `72f7519` keeps Jekyll and Astro search controls disabled until initialization succeeds, and retains a browse-index fallback in all three ports when scripts are unavailable or initialization fails. It preserves the existing URL query on failure and isolates malformed embedded Jekyll/Astro indexes per search section. Before the fix, Jekyll and Astro left controls active without JavaScript despite stating that local search required it. Independent and integrated paired search checks passed both families × three frameworks × root/subpaths, covering no-JS, blocked resources, history initialization failure, malformed-index isolation, keyboard fallback, normal synchronized search, hostile text and axe. Full Astro/React catalog suites, strict types, search injection safety, source-archive and manifest checks passed independently. The integrated history test initially lacked its required Jekyll build path; after fresh paired root builds and setting that path, all six history cases and search-safety checks passed.

### Gallery modal failure fallback

Commit `60eb9e0` cancels a gallery image link only after modal opening succeeds. Before the fix, Jekyll reproduction showed that a throwing `showModal()` or an already-open non-modal dialog canceled the link without navigating. Independent and integrated checks passed both families × three frameworks at root and `/preview`, including missing modal support, thrown modal on pointer and keyboard activation, actual non-modal state, modified clicks, Escape/focus and no-JS. The non-modal test activates the link programmatically because the open dialog can overlap it. Independent two-gallery suites, model tests, strict types, source-archive and manifest checks also passed. These checks do not cover all external host interference.

Commit `3c52d70` extends the portable cross-engine smoke with light-appearance gallery Escape/focus restoration, queued-close handover, rapid reopen and native image navigation when `showModal()` throws. Independent and integrated runs passed all six framework/family combinations on Chromium, retaining the existing light/dark axe checks. Firefox and WebKit results for the new gallery cases require a fresh hosted run.

Hosted portable run `40870681820` at `e2f2341` passed the new gallery smoke in both Firefox and WebKit. The workbench workflow at that head passed all three engines; the portable main and long fixture jobs were still running at this observation.

### Local form initialization safety

Commit `619f460` removes Jekyll's global early enabling of demo and chat fieldsets. Each remains disabled until its own handlers are installed; all three ports show a visible unavailable explanation when scripts are absent or blocked. A synthetic failure immediately after the former global enable left a Jekyll sign-in form active without its submit handler and produced a native GET containing fictional email and password fields. Independent and integrated 12-build paired regressions passed both families × three frameworks × root/subpaths for no-JS, blocked scripts, partial initialization, disabled activation with no navigation, malformed first-form isolation, normal independent forms/chats, keyboard and axe. Full Astro/React catalog suites, dedicated chat, model, strict type, source-archive and manifest checks passed independently; integrated chat and model checks also passed. This is bounded failure-path evidence, not a guarantee against every host modification.

### Required free-text validation

Commit `db57e34` rejects whitespace-only required names in contact and sign-up examples and whitespace-only contact messages without trimming or rewriting entered text. Before the fix, a contact name containing only spaces produced a success status. Independent and integrated paired form-composition tests passed both families × three frameworks × root/subpaths, including correction, reset, scripted value changes, preservation of surrounding spaces, independent forms, password clearing, keyboard, axe and the blocked/partial initialization fallbacks. Model and manifest checks passed; strict React and source-archive checks passed independently. Existing CI runs the expanded composition test.

### Dashboard initialization failure safety

Commit `c22ccf1` keeps Jekyll/Astro dashboard controls disabled until their handlers and initial rendering succeed, and displays an unavailable/reload explanation when enhancement is blocked or fails. A synthetic interruption after the former early enable allowed a Jekyll administration editor to navigate with fictional person fields in a native GET. React administration also retains its static directory when an initial history write fails and retains locally saved records if a later write fails, returning to a disabled fallback; React analytics and operations provide the same visible blocked-script explanation. The independent and integrated 12-build Chromium matrix passed both families × three frameworks × root/subpaths, covering normal actions, JS/no-JS, blocked scripts, early interruption, applicable history failures, static tables, no unintended navigation and reload recovery. Focused dashboard behavior, model, strict React type, source-archive and manifest checks passed independently. The integrated follow-on parity command initially omitted its required Jekyll root path; after fresh paired builds and setting that path, all six parity cases and model checks passed. This is bounded failure-path evidence, not coverage of all later Jekyll/Astro host failures or every React hydration error. CI now runs the new initialization matrix.

An apparent React analytics Category naming mismatch was traced to Playwright's exact label-text locator, not the computed accessible name. Chromium's native accessibility tree reports `Category` for All, Research and Publications in both families and all three frameworks. Commit `1d9bcaf` adds role/name checks to the initialization regression; the independent full 12-build matrix and integrated four-build React subset passed. Firefox/WebKit native accessibility trees and screen readers were not inspected.

Hosted portable run `40870681820` at `e2f2341` subsequently passed all six jobs, including Firefox and WebKit gallery smoke; the separate workbench workflow passed all three engines. The later form-initialization fix has its own hosted run pending.

### Event time metadata

Commit `088b404` validates event start/end strings before emitting `<time datetime>`, leaving the authored display label escaped and marking invalid times instead of publishing impossible machine-readable dates. The shared conservative subset supports four-digit Gregorian years, uppercase `T` or space, uppercase `Z` or colon-separated offsets, optional seconds and one to three fractional digits; it rejects negative-zero offsets, lowercase separators, colonless offsets and longer fractions. Jekyll uses built-in Liquid validation and remains functional with `--safe`. Independent and integrated checks passed 28 JavaScript/Liquid grammar and calendar boundaries, both families × three frameworks × root/subpaths with JS/no-JS, hostile values and safe-mode Jekyll fixtures; model, source-archive and manifest checks passed. CI runs the parity check alongside the existing adversarial fixture matrix. The schema remains permissive; chronological ordering, display-label consistency and whether an IANA timezone matches the offset are not verified.

The first hosted event-time run failed its canonical-export check because the new porting-guide paragraph had not been synchronized into the two standalone Jekyll exports. Running the existing sync updated those two generated guides; the model and manifest checks passed afterward. The CI drift assertion remains in place, and a fresh hosted run is required.

### Event ordering

Commit `1d29e12` adds a visible warning when both event timestamps are valid but the end instant precedes the start, accounting for offsets and milliseconds. It retains valid `<time>` metadata, allows equal instants and makes no ordering claim when either timestamp is invalid. A reversed-offset fixture one millisecond apart reproduced the missing warning before the change. Independent and integrated checks passed 12 JavaScript/Liquid boundaries, including pre-1970 fractions and extreme offsets, plus both families × three frameworks × root/subpaths with JS/no-JS and Jekyll safe mode. The browser fixture covers reversed instants, equal instants across midnight, correctly ordered instants with reversed local dates and an invalid start. Source archive, manifest, model and strict React checks passed; CI includes both the parity and adversarial fixture tests. Display-label and named-timezone consistency remain unverified.

Hosted portable workflows at `d56f4c5` and `8e7eba3` completed successfully across all six jobs, including the event parity and adversarial tests. Firefox/WebKit smoke retains its documented axe incomplete results.

### Search after history update failure

Commit `3e3c427` keeps local search results synchronized when a later `history.replaceState` call fails and displays a warning that the address may not reflect the search. Before the fix, a synthetic later SecurityError left another search at the old query and produced an uncaught exception. Independent and integrated paired composition checks passed both families × three frameworks × root/subpaths, including failure and subsequent recovery, no-result browse links, initial failure, blocked scripts, keyboard, axe and no-JS. Separate independent six-case history checks preserved host state, unrelated query parameters and fragments; strict React types and model tests passed. The initial-failure browse fallback remains in place.

### Analytics export after history update failure

A synthetic failure of a later history update exposed a data-integrity defect: Jekyll and Astro retained the visible Research results but exported the newly selected Workshops records. The analytics implementations now retain the last applied results and CSV when the address cannot be updated, preserve the draft filters, and display a retry message; a successful retry applies the new view and export together. The existing dashboard initialization regression passed all 12 Chromium builds (both families, Jekyll/Astro/React, root and subpath), checking displayed rows and metrics, downloaded CSV bytes, URL, draft, failure message and successful retry, along with its initialization and static-fallback cases. The 28 example model tests, strict React analytics type check, canonical synchronization, source-manifest check and 300-cell inventory consistency check also passed. These checks inject a history failure and do not cover every possible browser or host failure.

Hosted workbench run `40879193093` and portable examples run `40879193134` at `22612d2` both passed; a hosted run for the analytics change remains pending. Firefox and WebKit axe smoke checks retain their documented incomplete color-contrast findings.

### Operations threshold error description

The operations dashboard now associates the threshold validation error with its input in both design languages and all three frameworks, while preserving the existing help description. Before this change, a rejected threshold was marked invalid and the error received focus, but the input's computed accessible description contained only the help text when users returned to it. A Chromium regression checks the computed description for invalid input and its removal after correction and reset. The 12 family/framework/base builds passed across an initial run and a React-only rerun: the initial run reported 11 passes before its execution transport disconnected; the React rerun passed all four cases. The checks also cover dashboard initialization and static fallbacks. The 28 example model tests, strict React operations type check, canonical synchronization and source-manifest checks passed. This is automated accessibility-tree evidence, not a manual screen-reader or cross-browser assessment.

### Administration history failure

Commit `405933a` keeps Jekyll/Astro directory changes visible if a later address update fails, reports the stale address separately, and resynchronizes all applied filter, sort, page and density state on retry. Previously a saved local person could be committed and the editor reset before an exception prevented the table and success feedback from updating. The 12-build Chromium administration matrix passed across both families, three frameworks and root/subpath URLs; four additional React builds confirmed its existing disabled fallback retains the local record and reload returns to the original fixture. The 28 example model tests and generated-source checks passed in the isolated implementation worktree.

### Scientific workspace increment

Commit `3db470e` adds an experimental paired React scientific specimen and a framework-independent bounded first-order thermal model. It separates draft parameters from the last successful calculation and keeps the chart, table and downloadable CSV aligned. The specimen composes existing React components; it is not a catalog route, and Jekyll/Astro ports and full cross-framework conformance remain open. Four model tests and the four family/root/subpath Chromium builds passed independently and again after integration, including validation and keyboard recovery, actual CSV bytes, no-JavaScript and blocked-script fallback, 320px reflow and light/dark axe. The implementing worktree also passed strict TypeScript and inspected narrow and wide screenshots for each family. See `examples/react-catalog/SCIENTIFIC.md` for model assumptions, provenance and remaining manual checks. No visual baseline was approved.

### Operations history recovery

Commit `6e3023e` makes Apply and Reset atomic with their address update: if the update fails, the prior applied scope, comparison link and local acknowledgements remain intact, the draft is retained, and a warning offers retry. Acknowledgement and undo do not require an address write. Previously a failed update could leave an internal 400 ms threshold behind a displayed 300 ms view and prevent an acknowledgement from rendering. The independent and integrated 12-build Chromium matrices passed for both families, all three frameworks and root/subpath hosting, including failure and retry, reset, acknowledgement/undo, focus and comparison-link scope. The integrated run also combines the administration and threshold-description fixes. Model tests, strict React types, generated-source synchronization and manifest checks passed.

### Analytics date error descriptions

Commit `416cb37` associates the existing validation message with both analytics date fields for invalid filters, removing the association after correction or for data-source errors. Before the fix Chromium reported the start date invalid without a computed description. The independent 12-build dashboard matrix and two 12-build precision-fixture matrices passed, including a transition from invalid range to data error, alongside model, React type and source-consistency checks. These are automated browser checks; manual screen-reader verification remains open.

### Scientific workspace ports

Commit `cb1f95d` adds experimental Jekyll and Astro scientific workspace pages for both families, using the same thermal model as the React specimen. They preserve static default results when scripting is unavailable. Independent and integrated eight-build Chromium matrices passed for both families, both frameworks and root/subpath hosting, including static chart/table agreement with the model, validation and retry, keyboard recovery, downloaded CSV bytes, responsive reflow, light/dark axe, and no-JS/blocked-script fallback. The implementing worktree also passed the four React scientific builds, strict types, example and thermal-model tests, source-archive checks and archived Jekyll builds (58 pages and 1,447 destinations each), and inspected narrow/wide screenshots for each family and port. The integrated model and canonical synchronization checks passed. No visual baseline was approved. The original 50-recipe catalog is unchanged; the new pages are experimental and unlinked, React remains a separate harness, and broader visual, assistive-technology and cross-browser review remains open. See `examples/page-archetypes/SCIENTIFIC.md` for assumptions and limitations.

### Consolidation checkpoint

Commit `a20e968` completes the scientific route and links it from each example index without changing the 50 canonical recipes. Independent and integrated 12-build Chromium matrices passed for both languages, Jekyll/Astro/React and root/subpath hosting. They cover index navigation, static model agreement, draft and validation recovery, keyboard focus, prior/new CSV bytes, 320/1440px reflow, light/dark axe and no-JS/blocked-script fallbacks. The independent source-archive, model, strict React type, synchronization and manifest checks also passed. The scientific example remains experimental; manual assistive-technology, Firefox/WebKit, physical print and comprehensive visual review remain open.

At `ea5a180`, hosted workbench run `40952808972` passed Chromium, Firefox and WebKit, and portable run `40952808982` passed its six jobs; the reference publication job was skipped on PRs. The subsequent consolidated head needs its own hosted checks. The [integration review](nightjar-integration-review.md) records the stacked ancestry, known defects in the intermediate #18 state and automatic reference publication/adoption on a main push; it is a dated observation, not permission to merge. The [architectural review](nightjar-architecture.md), [conformance review](nightjar-conformance-review.md) and [Jekyll extraction plan](nightjar-jekyll-extraction-plan.md) record evidence, unresolved gaps and review gates. Extraction is planning only. The conformance matrix records initial-state Chromium axe scans on all 300 canonical cells as sampled evidence, not certification; Firefox and WebKit each retain 16 incomplete contrast results in the reviewed smoke run.

The [security triage](nightjar-security-triage.md) records a Ruby advisory-database scan with no matches for both Jekyll locks, clean workbench and Astro npm audits at the recorded snapshot, and the precise access limitation for the 65 workbench default-branch Dependabot alerts. Separate source-site draft PRs update vulnerable Astro dependencies; both pass local audits, unit tests, Node 22.19 builds, Chromium checks and worker dry runs. Their major Astro upgrade and raised Node floor require human compatibility review; individual GitHub alert records and external hosting triggers remain unverified. No production release or deployment was performed.

Hosted theme verification passed at Martlet `6dfce87` (run `40975801734`) and Krigsvold `1a0f3c1` (run `40975805370`). Workbench run `40975340947` at `0d99dec` passed all three engines; its portable run was still in progress at this checkpoint. Commit `66162b6` extends the hosted portable-browser smoke to the scientific route, covering validation, keyboard recovery, CSV and no-JS behavior in light mode and axe in light/dark. The expanded suite passed locally in Chromium across both families and all three frameworks; the new Firefox and WebKit cases require hosted results. Incomplete automated contrast checks remain reported for manual review.
