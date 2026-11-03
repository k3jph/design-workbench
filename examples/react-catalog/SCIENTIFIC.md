# Thermal analysis specimen

This experimental, paired React specimen explores the first advanced application requested by Operation Nightjar. The specimen is available at `/examples/scientific-workspace/` in all three frameworks and is linked separately from the example index; it is not one of the 50 canonical recipes. Full cross-framework conformance remains open. See `examples/page-archetypes/SCIENTIFIC.md`.

A fictional lumped, first-order response uses `T(t) = ambient + (initial − ambient) × exp(−t / time constant)`. The calculation assumes a constant ambient temperature and a fixed time constant. The result is neither an observation nor an engineering prediction. Input ranges are bounded; six evenly spaced samples are shown to two decimal places. The chart uses the displayed rounded values and identifies its sampled bounds; the table provides the same values, and the CSV exports exactly the displayed rows. The calculation runs locally without network or persistent storage.

Draft inputs and last successful results are separate. Invalid inputs preserve both the draft and previous results, focus an error summary with links to fields, and leave export scoped to the previous run. After a successful retry, the chart, table, run parameters and CSV use the new values together. Server-rendered default results remain readable without JavaScript; calculation and download controls remain disabled until hydration.

The standalone test harness uses `AppShell`; the integrated route uses the existing source shell. Both compose the workbench React `Field`, `TextInput`, `Button` and `DataTable` exports. Jekyll, Astro and React use the same framework-independent model. A comparison-oriented two-region layout is an experimental application extension, not a claim about either language's original website anatomy. The paired controls retain family typography, colors and component styles. Offline Martlet grammar/source guidance was read at `martlettheme/npm` revision `8190e1ad71788c15bec19eac4875af7e15f4f8cf`; offline Krigsvold guidance was read at `krigsvoldtheme/npm` revision `f567b51abbe199f89cbb09b5a8cb9e77bed1e117`. These are experimental guidance snapshots; connected design MCP tools were unavailable. React 0.1.0 contracts use theme 2.1.0. Manual assistive-technology testing, physical print, localization and sustained-use review remain open.

From the repository root, after installing dependencies and building the workspace packages:

```sh
node --test examples/page-archetypes/tests/thermal-model.test.mjs
CHROMIUM_PATH=/usr/bin/chromium node examples/react-catalog/test-scientific.mjs
npx tsc --ignoreConfig --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --strict --skipLibCheck --allowJs --resolveJsonModule --types node,vite/client examples/react-catalog/src/catalog-family.d.ts examples/react-catalog/src/scientific/Workspace.tsx
```

Omit `CHROMIUM_PATH` when Playwright's own Chromium is installed. The browser test builds both families at root and `/preview/` and checks server rendering, applied versus draft state, validation and correction, keyboard recovery, CSV bytes, reflow, light/dark automated axe checks, blocked/no-JavaScript behavior and unexpected network requests. These checks are bounded evidence and do not establish overall accessibility, visual or cross-framework parity. Optional `NIGHTJAR_SCIENCE_SCREENSHOTS` writes inspection screenshots to an explicitly supplied directory; no baseline is accepted by the test.
