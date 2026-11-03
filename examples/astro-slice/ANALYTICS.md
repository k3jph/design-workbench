# Astro analytics dashboard: partial port

The explicit `/examples/dashboard-analytics/` route renders the shared Northlight fixture and uses the framework-neutral aggregation and chart code from `../page-archetypes/jekyll/assets/js`. It adds only the client enhancement needed for filtering, charts and CSV download; static source rows remain visible without JavaScript and controls are disabled. Native family Astro buttons and separate family tokens provide the respective interface treatments. Install with `npm ci --ignore-scripts` and run `CHROMIUM_PATH=/usr/bin/chromium npm run test:analytics` (or omit the override when Playwright Chromium is installed).

The isolated regression builds both families at root and `/preview/`, checking initial and filtered totals, exact chart tables, download, invalid-date recovery, 320px and 1440px page overflow, axe in light and dark, and no-JavaScript source data. It does not establish visual equivalence, manual screen-reader usability or cross-browser compatibility.

The dashboard is in the shared catalog and navigation. A cross-family comparison link appears when `NIGHTJAR_PEER_URL` specifies the other family's HTTP(S) base URL. The source shell uses a contextual translation and full cross-framework visual parity remains unverified.
