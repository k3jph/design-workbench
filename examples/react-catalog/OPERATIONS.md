# React operations component — integration pending

`src/dashboard/Operations.tsx` renders the canonical Northlight operational snapshot with the existing family React Button and shared framework-neutral operations model. Controlled form drafts remain separate from the applied scope, so acknowledging an alert does not silently apply pending edits; this includes invalid threshold drafts. Filtering, chart data, status and availability summaries, alerts, acknowledgements, undo, timeline and reset are local to the page and never contact a service. Acknowledgements preserve focus on the replacement button, or return focus to the hide-acknowledged control when the row disappears. Server-rendered service/alert tables remain available without JavaScript; controls are disabled until hydration.

This component still needs a prerendered `/examples/dashboard-operations/` catalog route inside the selected family's existing `AppShell` and shared dashboard navigation. Keep it route-split so simple pages do not load the chart code or data fixture. Peer-family comparison and dashboard overview remain integration work. Exact visual parity, manual assistive-technology use, print output, and other browser engines are unverified.

Run `CHROMIUM_PATH=/usr/bin/chromium node examples/react-catalog/test-operations.mjs` from the workbench root (or omit the override when Playwright Chromium is installed). The isolated harness server-renders both languages at `/` and `/preview/` and tests scope/thresholds, pending-draft preservation, acknowledgement/undo, filtering and focus recovery, reset, URL restoration, light/dark axe, 320/1440 reflow, browser errors and the no-JavaScript fallback. Strict TypeScript can be checked with:

```sh
npx tsc --ignoreConfig --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --strict --skipLibCheck --allowJs --resolveJsonModule --types node,vite/client examples/react-catalog/src/catalog-family.d.ts examples/react-catalog/src/dashboard/Operations.tsx
```
