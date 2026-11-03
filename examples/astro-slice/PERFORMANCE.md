# Astro performance and dependency-isolation review

Measured in the managed Debian 13 environment with Node 24.19.0, Astro 7.4.4 and system Chromium 151.0.7922.173 at 1440×900. Both family sites were built for `/`; each route loaded in a fresh browser page and an uncached local static server. The browser's requested scripts, stylesheets and font files were counted once per page. HTML is measured separately. Sizes are bytes, not timings. The table's gzip numbers are the sum of each requested file compressed locally at gzip level 9; they estimate transfer size and exclude headers, Brotli, cache reuse, images and network latency. Inline script/style bytes are included in HTML, not external script/CSS totals. Fonts shown are raw file sizes; they are already compressed WOFF/WOFF2 files.

Baseline commit `9a4c9b6` is compared with the family-specific print palette, conditional pagination controller, and per-dashboard fixture subsets. Both use the same canonical content. Reproduce from this directory with `npm ci --ignore-scripts`, `NIGHTJAR_FAMILY=martlet npm run build`, `NIGHTJAR_FAMILY=krigsvold npm run build`, then `CHROMIUM_PATH=/usr/bin/chromium node measure-performance.mjs`. The script reads both root builds and prints asset paths and JSON totals; choose an installed Chromium or omit the override for Playwright's installed Chromium.

| Family / page | HTML raw before → after | External JS raw / gzip before → after | External CSS raw / gzip after | Fonts raw after |
| --- | ---: | ---: | ---: | ---: |
| Martlet About | 4,328 → 4,226 | 1,891 / 856 → 1,312 / 537 | 54,493 / 9,027 | 48,392 |
| Martlet Archive | 5,287 → 5,298 | 1,891 / 856 → 1,891 / 856 | 54,493 / 9,027 | 71,432 |
| Martlet Gallery | 5,232 → 5,130 | 2,430 / 1,149 → 1,851 / 830 | 54,493 / 9,027 | 48,392 |
| Martlet Analytics | 11,072 → 30,955 | 42,892 / 9,666 → 12,643 / 5,326 | 58,940 / 10,308 | 71,432 |
| Martlet Administration | 46,488 → 15,491 | 24,780 / 8,950 → 24,780 / 8,950 | 62,364 / 11,423 | 71,432 |
| Martlet Operations | 44,383 → 21,845 | 24,780 / 8,950 → 24,780 / 8,950 | 62,201 / 11,362 | 71,432 |
| Krigsvold About | 4,340 → 4,238 | 1,891 / 856 → 1,312 / 537 | 83,979 / 12,227 | 58,308 |
| Krigsvold Archive | 5,303 → 5,314 | 1,891 / 856 → 1,891 / 856 | 83,979 / 12,227 | 58,308 |
| Krigsvold Gallery | 5,246 → 5,144 | 2,430 / 1,149 → 1,851 / 830 | 83,979 / 12,227 | 58,308 |
| Krigsvold Analytics | 11,120 → 31,003 | 42,892 / 9,666 → 12,643 / 5,326 | 88,426 / 13,508 | 58,308 |
| Krigsvold Administration | 46,778 → 15,781 | 24,780 / 8,950 → 24,780 / 8,950 | 91,850 / 14,623 | 58,308 |
| Krigsvold Operations | 44,292 → 21,754 | 24,780 / 8,950 → 24,780 / 8,950 | 91,687 / 14,562 | 91,092 |

About and Gallery no longer request the 579-byte pagination controller; Archive still requests it because its listing needs it. The shared source-header enhancement remains on static content pages for responsive navigation and appearance. The inspected pages contain no Astro hydration islands; dashboard and interactive behavior use page-specific client scripts. The ordinary content pages did not request dashboard JavaScript.

Analytics now embeds only analytics rows and categories in its HTML instead of bundling the entire fixture into JavaScript. Its HTML increases, so the JS reduction alone is not the transfer saving: for Martlet the measured sum of gzip HTML + CSS + JS falls from 23,044 to 21,111 bytes, excluding fonts and other assets. Administration and Operations embed only their own required records, reducing Martlet HTML from 46,488 to 15,491 and 44,383 to 21,845 bytes respectively. Their shared dashboard controller remains the same size. All values remain derived from the same source fixture; the per-route subset is not a separate dataset.

The common family CSS still contains rules for gallery, workspace and form components even on About because the shared content renderer imports those components. The generated base CSS declares 58 Martlet and 104 Krigsvold font faces, but the measured About pages fetched only three font files each. Consider route-level component/style splitting if future measurements show that its complexity is justified; do not remove font subsets without testing supported scripts and weights. The administration and operations pages still load the common dashboard controller, which contains code for other dashboard types. A later split by controller could reduce their JS, provided that navigation, shared behavior and existing regression coverage remain intact.

The route measurements are not a claim about production caching, first-render timing, real user devices, layout stability or accessibility. They are a reproducible local payload comparison.
