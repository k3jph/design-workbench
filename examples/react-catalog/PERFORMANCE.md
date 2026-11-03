# React catalog performance observation

## Method

On 2026-10-29, root-path production builds were measured on the managed Debian 13 environment with Node 24.19.0, Chromium 151.0.7922.173 and an AMD EPYC 9V74 host. For each family and route, `measure-performance.mjs` used three fresh browser contexts at 1440×900, no throttling and no cache; the reported value is the median. A local loopback server gzipped HTML, JavaScript, CSS and SVG with Node's default gzip settings, served WOFF2 fonts as-is and set `Cache-Control: no-store`. No peer deployment URL was configured, and the runs observed no unexpected external requests. Values are response-body bytes, including the initial HTML document but excluding HTTP headers. They do not predict a particular CDN, cache, mobile network or production environment.

The DOM column is `DOMContentLoaded` from the browser's navigation entry. Ready is the observed upper bound when the browser automation first sees the hydrated source shell, and for dashboards also sees the first filter control enabled. It includes automation scheduling and is not a React profiler measurement or a claim of statistical significance. Measurements were made under shared-host activity; small timing differences should not be interpreted as speedups. The no-JavaScript check verifies a visible heading on each route, and a source table and disabled controls on each dashboard; it does not measure screen-reader use.

## Measured after page-scoped hydration data

| Family | Route | HTML bytes | JS bytes | CSS bytes | Font bytes | Image bytes | Total bytes | DOM ms | Ready ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Martlet | About | 1,916 | 74,407 | 9,801 | 71,432 | 9,194 | 166,750 | 122 | 155 |
| Martlet | Article | 2,167 | 74,407 | 9,801 | 71,432 | 9,194 | 167,001 | 97 | 164 |
| Martlet | Analytics | 4,046 | 81,999 | 11,023 | 71,432 | 9,194 | 177,694 | 122 | 219 |
| Martlet | Administration | 3,368 | 82,350 | 10,747 | 71,432 | 9,194 | 177,091 | 122 | 182 |
| Martlet | Operations | 3,562 | 82,278 | 11,111 | 71,432 | 9,194 | 177,577 | 125 | 205 |
| Krigsvold | About | 1,920 | 74,413 | 12,527 | 58,308 | 457 | 147,625 | 114 | 155 |
| Krigsvold | Article | 2,171 | 74,413 | 12,527 | 58,308 | 457 | 147,876 | 112 | 169 |
| Krigsvold | Analytics | 4,057 | 82,011 | 13,749 | 58,308 | 457 | 158,582 | 127 | 222 |
| Krigsvold | Administration | 3,386 | 82,363 | 13,473 | 58,308 | 457 | 157,987 | 115 | 202 |
| Krigsvold | Operations | 3,574 | 82,290 | 13,837 | 78,396 | 457 | 178,554 | 120 | 209 |

The Krigsvold operations page requested an additional Roboto math subset for its ≥ threshold notation. Martlet's image bytes are its existing source mark; Krigsvold's mark is smaller. These are actual requests in this run, not the sizes of every packaged font or asset.

## Before and after

Before this change, at workbench commit `52cf865`, both ordinary pages downloaded the full catalog and every pre-rendered Markdown body in their shared JavaScript bundle. Martlet About and Article each transferred 88,885 JS bytes; Krigsvold transferred 88,891. The new build sends 74,407/74,413 JS bytes respectively: **14,478 fewer bytes, or 16.3% less JavaScript**. The page-specific JSON increases About's compressed HTML by 294 bytes in Martlet and 292 bytes in Krigsvold. Its total cold body transfer fell from 180,934 to 166,750 bytes for Martlet and from 161,811 to 147,625 bytes for Krigsvold. Article totals fell from 181,160 to 167,001 and from 162,034 to 147,876 bytes respectively. Dashboard transfer sizes in this experiment were unchanged.

Each ordinary page now embeds only its own catalog record and rendered text as safely escaped inert JSON; index and search pages receive the compact catalog index they need. The source HTML remains available without JavaScript. The embedded data escapes `<` so authored text cannot close the JSON script element; the catalog suite includes a browser breakout regression. Dashboard code and synthetic fixture remain in separate route chunks, and the measurement asserts that ordinary pages do not request dashboard chunks.

## Dependencies and remaining work

The current example uses React/React DOM 19.3.1 and Vite 8.3.5 from the workbench, and the experimental `@martlet/react` and `@krigsvold/react` 0.1.0 workspace packages with theme 2.1.0. Charts are local SVG/React code using the shared calculation model; no chart library is added. Markdown parsing and its scoped sanitizer execute during the static build, not as a client-side Markdown parser.

The shared React/runtime and family component bundle is still the largest JavaScript request; each example currently hydrates even a static article. Moving to selective hydration or a static-first framework would need a separate architectural evaluation and behavior/accessibility regression work. Font requests remain a substantial fraction of total transfer and are driven by actual family typography and glyphs; removing subsets or weights without rendering and multilingual evidence could harm the design. This measurement does not establish long-term caching, interaction latency, layout shift, mobile network performance, or performance of the separately distributed theme packages.

To reproduce, from the workbench root with locked dependencies installed and workspaces built:

```sh
NIGHTJAR_FAMILY=martlet NIGHTJAR_BASE=/ node examples/react-catalog/build.mjs
NIGHTJAR_FAMILY=krigsvold NIGHTJAR_BASE=/ node examples/react-catalog/build.mjs
CHROMIUM_PATH=/usr/bin/chromium node examples/react-catalog/measure-performance.mjs
```

Omit `CHROMIUM_PATH` when the Playwright browser is installed. The script emits one JSON line per family/route, including request paths, byte categories and median timings, and asserts content/dashboard chunk separation and the no-JavaScript baseline.

## Nightjar II static-article assessment

On 2026-10-30, the article route was measured from fresh root-path builds at candidate `5138a89` in all three frameworks using `examples/page-archetypes/tests/measure-article-transfer.mjs`. This compares the same authored article **within each family**; the shells and navigation are different implementations and do not offer identical features or asset sets. Node 24.19 and Chromium 151 ran on managed Debian 13. Each value is the median of three fresh 1440×900 browser contexts against a loopback server with `Cache-Control: no-store`, gzip at Node's default settings for HTML, JavaScript, CSS and SVG, and WOFF/WOFF2 sent as stored. Numbers are response-body bytes for resources actually requested, not HTTP headers, all possible fonts, cached/CDN traffic, timings or total page-load measurements. Inline scripts count in HTML. No unexpected external requests or page errors occurred; Astro's browser-generated `/favicon.ico` request returned 404 and its error body is excluded. No-JavaScript checks confirmed the article heading and links, not full accessibility.

| Family | Framework | HTML | JS | CSS | Requested fonts | SVG/images | Total response bodies |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Martlet | Jekyll | 2,345 | 4,623 | 24,341 | 86,636 | 18,388 | 136,333 |
| Martlet | Astro | 1,908 | 545 | 9,710 | 71,432 | 9,194 | 92,789 |
| Martlet | React | 2,301 | 76,945 | 10,475 | 71,432 | 9,194 | 170,347 |
| Krigsvold | Jekyll | 2,519 | 4,626 | 86,471 | 80,508 | 6,620 | 180,744 |
| Krigsvold | Astro | 1,916 | 545 | 13,069 | 58,308 | 457 | 74,295 |
| Krigsvold | React | 2,308 | 76,975 | 12,901 | 58,308 | 457 | 150,949 |

React requests about 76.4 KB more compressed external JavaScript than Astro for this article in each family. Of the React JavaScript, the `SourceShell`-named shared chunk is 66,507 bytes for Martlet and 66,509 for Krigsvold (86.4%); its build contains React DOM hydration as well as shared shell/runtime code. This is a chunk attribution, not a measurement of CPU, render latency or what can safely be removed. Krigsvold's Jekyll `shell.css` alone is 593,642 raw / 80,900 gzip bytes in this build, accounting for most of its measured CSS; it contains source-informed rules and should not be reduced without cascade, provenance and visual-regression review. These observations should not be compared directly to the earlier measurement as a controlled before/after: the candidate and build graph changed.

No selective-hydration change is included in this assessment. The static article has no local form, search, pagination or gallery state, but its React `SourceShell` owns menu state, Escape/focus return, appearance and storage, responsive visibility, initialization and no-JavaScript fallback. Replacing it only on selected routes with a second imperative controller would duplicate that contract and create different failure and focus behavior; hydrating a React-only header island would still need a reviewed ownership and SSR-ID boundary for the shared shell. Neither approach has yet established enough behavior and maintenance evidence to justify changing all static pages. Do not remove hydration or fonts merely because the byte difference is large.

The existing React source-shell regression passed both families at root and `/preview` after these measurements, covering menu keyboard/Escape focus, saved appearance, links, narrow reflow, dark axe, print and no-JavaScript fallback. This is Chromium evidence, not screen-reader or cross-browser certification. A follow-up should prototype a **single shared** shell interaction boundary, define ownership and SSR/hydration failure behavior, compare actual before/after response bytes and changes to the shipped bundle, and run those checks plus blocked scripts, hash/deep links, both families, root/subpath and all affected interactive recipes before adopting it. Review the Krigsvold Jekyll source-shell CSS separately; do not infer unused or safe-to-remove rules from its size alone.

To reproduce the cross-framework article observation after installing locked dependencies and building the React workspaces, build the two Jekyll sites at `/` into a paired directory, build both Astro and React families at `/`, then run:

```sh
CHROMIUM_PATH=/usr/bin/chromium NIGHTJAR_JEKYLL_ROOT=/absolute/path/to/paired-jekyll node examples/page-archetypes/tests/measure-article-transfer.mjs
```

Set `NIGHTJAR_ASTRO_ROOT` or `NIGHTJAR_REACT_ROOT` to override their paired output directories. Run the source-shell behavior suite separately with `CHROMIUM_PATH=/usr/bin/chromium node examples/react-catalog/test-source-shell.mjs`; it rebuilds its own root and subpath outputs.
