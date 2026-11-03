# Astro operations dashboard increment

The operations route is a paired Astro adapter around the canonical synthetic fixture and the existing framework-neutral Jekyll dashboard model, rendering helpers, browser controller and layout CSS. It implements service and time scope, warning thresholds, alert severity and acknowledgement filters, local acknowledgement/undo, activity, reset, and accessible chart-data tables. No real service is contacted or changed. With JavaScript disabled, the initial service and alert tables remain visible and controls stay disabled.

```sh
npm ci --ignore-scripts
CHROMIUM_PATH=/usr/bin/chromium node test-operations.mjs
```

The independent test rebuilds both families at root and `/preview/` and checks thresholds, scoped services/alerts, acknowledgement and undo, pending control preservation, validation/focus, reset, responsive overflow at 320/768/1100/1440px, light/dark automated axe, and no-JS tables. It does not establish manual screen-reader or visual parity.

The dashboard is available in the shared catalog and workspace navigation. Set `NIGHTJAR_PEER_URL` to the other family's absolute HTTP(S) base URL to expose a comparison link; filter query state is retained. Source-shell identity and complete visual parity remain open for review. No deployment or release is implied.
