# Nightjar III clean-room adoption — bounded local evidence

This is a reproducible developer exercise, not a claim that all 50 recipes have been reproduced by independent packages, an accessibility certification, or authorization to publish. Each consumer was created outside the workbench from a local candidate snapshot or npm tarball. The browser harness itself uses the workbench's Playwright and axe dependencies. Builds and browser servers are local; npm dependency installation used the configured registry proxy. Nothing was deployed.

## Inputs and provenance

| Framework | Martlet | Krigsvold |
| --- | --- | --- |
| Jekyll | Local snapshot `08b7606eeafe9c24b2f34990db0d61f5736650b0` | Local snapshot `da09141624ee4c1490c9632528fecbdc4cd03111` |
| React | Local package source `af9b22320cca37b8d39951a071b2a2813655a926` | Local package source `8e639da4b4ad2ef6f5fe5ea87c9a2809b656cc6f` |
| Astro | Local package source `3c43243653a1f5a3acf3bca23e776177a53e2402` | Local package source `9e2cced9b4397c04f444a864c8eda4c0b43e75b2` |

The Jekyll snapshots carry the reviewed [#48](https://github.com/k3jph/design-workbench/pull/48) landmark correction and pin its workbench source `5141857be03d103732275fb18e05e042505381df`; the original frozen Nightjar II snapshots are preserved separately. Their files were extracted using local `git archive` into new directories with **no Git metadata** before installation/build. Ruby 3.2.3 and the locked gems were already present in `/workspace/nightjar/toolchains/gems`; `bundle check` and ordinary `bundle exec jekyll build` required neither network nor workbench checkout after extraction. This does not prove an offline first-time gem installation on a new machine.

The React tarball SHA-256 values were Martlet `0076ab2a48121a208613481d1dc3e60f205bb747489ef7a57f0ea5471a03d2a8` and Krigsvold `4f30769df17b3a5f485d03432eafe950fb387a39a3a68f25973eb8ff1172e6a2`. Clean npm consumers installed the local tarball, React/React DOM 19.3.1 and Vite 8.3.5; both resolved their own theme at 2.1.0. Their generated locks contained 49 and 48 package entries respectively. No published React version was changed. npm installation was networked; consumer build did not use the workbench source.

The Astro tarball SHA-256 values were Martlet `fd897ef825878ae427e8cdd173ccbb527f0c729bb6ea90d08d1f97554c3b96ee` and Krigsvold `2de53082bb1f92c2354aab1d313bdba59ea5d2a3df41d518b99dfb405b215a2e`. Each clean consumer followed the shipped-starter extraction instructions, installed that local candidate tarball, and resolved Astro 7.4.4 with the published family theme at 2.2.2 or 2.2.3. Generated locks contained 266 and 265 entries. `npm ls --depth=0` also reported optional WASM/sharp runtime packages as extraneous in this ignored-scripts install; no conclusion about other platforms or vulnerabilities follows from that observation. Astro 7 and the applicable deployment platform's Node floor must be assessed before any production use.

## Observed adoption and gaps

All six family/framework combinations passed the stated Chromium checks at `/` and `/preview/` (12 builds total):

| Framework | What a consumer actually exercised | Explicit boundary |
| --- | --- | --- |
| Jekyll | Authored a new post using the documented `post` layout; navigated the supplied project, submitted its contact example by keyboard, filtered its supplied administration sample, checked 320px, full default axe rules, and verified no-JS forms are disabled while sample rows remain readable. | The dashboard was the existing sample, not a newly composed independent dashboard. Preinstalled locked gems were required. No deployment environment was tested. |
| React | Installed each candidate tarball in an independent Vite application and composed `AppShell`, `Article`, `Field`, `TextInput`, `Button`, `Notice` and `DataTable`: article/nav, keyboard form submission, scoped directory, no-match and clear recovery. 320px and default axe checks passed. | The application supplied its own static two-row fallback for disabled **and blocked** scripts. Package components do not independently provide server rendering, persistence, a dashboard controller, or this host fallback. This simple two-row directory is not the workbench administration dashboard. |
| Astro | Copied each packed starter, authored a reading page and a small directory from documented `Layout`, `SiteHeader`, `Container`, `SectionHeading`, `Card`, `Button` and native HTML, and exercised starter keyboard navigation and registration failure/retry. The directory supports keyboard search, no-match and clear. 320px, axe, no-JS, `script-src 'none'`, and injected listener-setup failure checks passed; controls remained disabled until initialization and static rows remained visible. | The directory's small progressive-enhancement controller is host-authored. The package does not supply data fetching, query, selection or a dashboard controller; external hosting/CSP/deployment settings remain unverified. |

The new React and Astro directories use the same synthetic rows, `Mara / Active` and `Pavel / Pending`; both apply a case-insensitive name query, announce a local result, show the same no-match guidance, and Clear restores the input and both rows while retaining button focus. Without scripts both show the static rows and an unavailable message. React replaces a host-authored static fallback during client rendering; Astro retains the table and disables its controls until the host script is ready. The fallback wording differs, and neither example provides a real data service, persistence, or the full workbench dashboard. A separately documented Jekyll clean-room composition in [#53](https://github.com/k3jph/design-workbench/pull/53), `c2e112b11abd016ea2a2ddb3ae84853ad06dcfa6`, exercises this same contract: both families at root and subpath passed Chromium ready, blocked, and partially initialized axe checks, 320/1440px and keyboard/focus checks; true no-JS static content received Chromium accessibility-tree sampling rather than axe. Its guide and sample are included in the tested source archives. These separate results are not included in the original Jekyll measurements above.

Clean-room testing found two real adoption problems. The original Jekyll and Astro administration pages exposed duplicate named section/table landmarks; whole-page default axe reported `landmark-unique` after filtering in both families. #48 names the nested region `People directory table`, matching the React contract. The new built-site check passed eight Jekyll/Astro family/root-subpath builds; its unchanged React comparison passed both family subpath builds. Separately, the original Astro candidate starter rendered root-absolute `/article/` and `/form/` links when built at `/preview`, escaping the configured base in both families. The newer local source commits above fixed the links and passed the same clean-consumer navigation checks. These are independently verified local commits, not published Astro package releases.

Manual assistive-technology, physical-print, real user onboarding and sustained use, Firefox/WebKit for these new clean consumers, broader state/keyboard coverage, and complete visual fidelity remain unverified. Do not reclassify Nightjar II's 18 Firefox and 18 WebKit contrast incompletes as passes. The family grammars and source identities were reviewed separately; identical behavior does not require pixel equality.

## Measured footprint

The browser loaded the authored reading page or the React page at 320×900 from fresh Chromium contexts on loopback. The local server sent gzip-compressed JS/CSS and uncompressed already-compressed WOFF2 fonts; values below sum **requested response-body Content-Length**, exclude protocol overhead, and are not production timings or a full-site download. React's composed page bundles its interactive directory with the article; the Jekyll/Astro readings are static, so they are not identical implementations. Unrequested font assets are not counted.

| Family | Framework | Root JS | Root CSS | Root WOFF2 |
| --- | --- | ---: | ---: | ---: |
| Martlet | Jekyll | 5,247 B | 24,341 B | 100,764 B |
| Krigsvold | Jekyll | 5,250 B | 86,471 B | 94,476 B |
| Martlet | React | 69,617 B | 27,825 B | 56,248 B |
| Krigsvold | React | 69,622 B | 44,969 B | 72,276 B |
| Martlet | Astro | 0 B observed | 27,259 B | 56,248 B |
| Krigsvold | Astro | 0 B observed | 44,648 B | 72,276 B |

Fresh extracted Jekyll source directories built at root in 1,183 ms (Martlet) and 999 ms (Krigsvold) with preinstalled gems; the React first Vite builds took 510 ms and 541 ms after npm install; Astro first builds reported 680 ms and 707 ms after npm install for the reading-page exercise. The React fixture uses `createRoot`, so it performs **client rendering, not hydration of server markup**. A mark immediately before `createRoot` through the first effect measured 84.9 ms and 61.5 ms in the two root runs; subpath runs measured 52.2 ms and 51.2 ms. Those figures show run-to-run variation, exclude download/parse time, and should not be compared as family performance. The static Astro authored reading page requested no JS in this check; its interactive form and directory use host scripts. These are single warm-machine observations, not benchmarks or regression thresholds. The React transfer result supports further investigation of article-only hydration, but replacing a shared shell with an untested duplicate would not be justified by this measurement alone.

## Repeat the checks

From this branch, run `npm ci --ignore-scripts`. Set `CHROMIUM_PATH=/usr/bin/chromium` or omit it when Playwright's Chromium is installed. For React, pass the two already-built candidate tarballs:

```sh
CHROMIUM_PATH=/usr/bin/chromium node scripts/qa/nightjar-iii-react-adoption.mjs /absolute/martlet-react-0.1.0.tgz /absolute/krigsvold-react-0.1.0.tgz
```

The script creates separate temporary applications, pins React/React DOM 19.3.1 and Vite 8.3.5, installs the supplied tarballs, runs root and `/preview/` builds, and prints its retained sandbox path, results and transfer measurements. It does not install the workbench into either consumer. Review and authorize the exact local candidate inputs before repeating; `npm install` requires registry access for their published dependencies.

For Jekyll, export the two exact local candidate commits to separate directories with `git archive`, add `_posts/2026-10-31-clean-room.md` with front matter `layout: post`, `title: Clean room reading`, `date: 2026-10-31`, and body `A local editorial page built using the documented post layout.` Build each extracted copy with `bundle exec jekyll build --destination <root-output>` and `bundle exec jekyll build --baseurl /preview --destination <preview-output>`, using the locked gems. For Astro, extract `package/starter` from each candidate tarball as documented, add `src/pages/clean-room.astro` using the package's README imports, install the local tarball, and create the independently authored directory using `node scripts/qa/nightjar-iii-astro-fixture.mjs <family> <disposable-starter-dir>`. The fixture command refuses to overwrite an existing page. Run `npm run build -- --base / --outDir <root-output>` in that starter and the same with `--base /preview --outDir <preview-output>`. The authored Astro reading page has heading `Clean room reading` and text `This page uses the documented package components.`

Run the corresponding browser check with the four absolute output directories in family/root/preview order:

```sh
CHROMIUM_PATH=/usr/bin/chromium node scripts/qa/nightjar-iii-jekyll-adoption.mjs <martlet-root> <martlet-preview> <krigsvold-root> <krigsvold-preview>
CHROMIUM_PATH=/usr/bin/chromium node scripts/qa/nightjar-iii-astro-adoption.mjs <martlet-root> <martlet-preview> <krigsvold-root> <krigsvold-preview>
```

The local Jekyll starter README initially omitted its new archive helper and bundled a guide referring to absent workbench paths. That was reported to the extraction worker, who added a standalone helper link and an upstream-path notice with attributed provenance. Existing production consumers and source authority remain unchanged. Before migration, agree how independently maintained family repositories consume pinned workbench fixtures without creating two owners, and separately authorize any remote creation, package publication or deployment.
