# React dashboard navigation — integration pending

`DashboardNav` provides the three canonical dashboard links and a link to the catalog, using a validated absolute directory base (`import.meta.env.BASE_URL` by default). Its native navigation is visible in server-rendered/no-JavaScript output. After hydration, narrow screens use a disclosure button; Escape closes it and restores focus. It remains visible at desktop widths and is hidden for print. Family tokens and Krigsvold's aligned bounded treatment remain separate without importing the other family's CSS.

`DashboardPeerLink` renders nothing unless the deployer supplies a peer-family HTTP(S) base URL. It rejects credentials, query strings, fragments and unsafe schemes, appends the current dashboard route and updates the link with the current URL query before activation, so applied filter state can carry across. The base is a deployment-specific public URL; do not invent a production host. The no-JavaScript link has no dynamic query, because these dashboard filters are disabled without hydration.

Example integration inside the existing `AppShell`'s main region:

```tsx
<div className="dashboard-layout">
  <DashboardNav current="analytics" />
  <div>
    <DashboardPeerLink current="analytics" peerBase={configuredPeerBase} />
    <Analytics />
  </div>
</div>
```

The host supplies responsive layout styling, `configuredPeerBase`, and the three built dashboard routes. The peer link should sit with the dashboard's snapshot metadata. Ensure ordinary content routes do not import dashboard code and fixture data. The provided harness is not a finished catalog route or deployment; exact source-shell parity, physical print output, manual assistive-technology checks, and other browser engines remain open.

From the workbench root, run `CHROMIUM_PATH=/usr/bin/chromium node examples/react-catalog/test-dashboard-nav.mjs` (or omit the override with Playwright Chromium installed). It checks both family builds and base paths, SSR/no-JS navigation, keyboard open/Escape/focus, route links and current page, query-preserving peer links and URL rejection, CSS isolation, responsive behavior, browser errors and light/dark axe. Type-check with:

```sh
npx tsc --ignoreConfig --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --strict --skipLibCheck --allowJs --resolveJsonModule --types node,vite/client examples/react-catalog/src/catalog-family.d.ts examples/react-catalog/src/dashboard/DashboardNav.tsx
```
