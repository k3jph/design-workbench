# React analytics component — integration pending

`src/dashboard/Analytics.tsx` renders the canonical Northlight analytics fixture using React state and the shared framework-neutral dashboard model. Filters and error recovery, charts and exact data alternatives, session and download comparisons, query state, and CSV export run entirely locally. Initial content is rendered on the server. Controls are disabled until hydration; source data remains available without JavaScript. `Button` comes from the selected family's existing React package, and family-specific semantic tokens and chart compositions remain separate.

This component is not yet wired into the catalog's route build or dashboard navigation. Integration must prerender it inside the existing family `AppShell`, use `/examples/dashboard-analytics/`, and make the analytics component a route-specific client chunk so ordinary content pages do not pay for its chart code and fixture. Add the canonical overview, navigation and configurable peer comparison as part of dashboard integration. Other dashboard routes remain unimplemented. Exact visual parity, manual assistive-technology use, print output, and non-Chromium engines are unverified.

From the workbench root, run `CHROMIUM_PATH=/usr/bin/chromium node examples/react-catalog/test-analytics.mjs` (or omit the override when Playwright's Chromium is installed). The isolated test harness builds and server-renders both family packages at `/` and `/preview/`, then tests hydration, initial/filtered figures, category and date scope, chart table alternatives, CSV content, invalid input/recovery, query restoration, 320/1440 overflow, axe in light and dark modes, console/runtime/network errors, and disabled controls plus source data without JavaScript. A standalone strict TypeScript check is:

```sh
npx tsc --ignoreConfig --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --strict --skipLibCheck --allowJs --resolveJsonModule --types node,vite/client examples/react-catalog/src/catalog-family.d.ts examples/react-catalog/src/dashboard/Analytics.tsx
```
