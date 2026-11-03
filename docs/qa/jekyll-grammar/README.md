# Paired Jekyll grammar reconciliation

This ledger implements the audit portion of [issue #91](https://github.com/k3jph/design-workbench/issues/91). It records decisions about all 50 routes while implementation and visual acceptance proceed in paired waves. The canonical authorities remain [jameshoward.us](https://jameshoward.us/) and [krigsvold.org](https://krigsvold.org/). Grammar and framework catalogs support the judgment; they do not replace those authorities.

The [machine-readable disposition matrix](disposition.json) has one row per canonical recipe, with its actual layout, section roles and anchors, independent family reasoning, retained differences, proposed additions, test obligations, wave and evidence state. The initial disposition is **13 targeted composition changes and 37 retained structures**. A retained semantic structure still needs its assigned visual and state review. It does not freeze CSS: source-justified spacing, reading measure or regional-layout corrections are recorded separately as actual composition changes. These counts are starting judgments, not a target and not a claim of universal fidelity. Update a disposition when observed evidence warrants it, recording why.

## Accepted baseline and PR92 reconciliation

The original audit in [PR92](https://github.com/k3jph/design-workbench/pull/92), commit `9f14abb2c7607522cea4c98c714c80e6a9576dd8`, is preserved as an ancestor and in [its original document](../jekyll-grammar-reconciliation-baseline.md). That audit did not record exact checked Jekyll SHAs, so the current checks below are a new, pinned observation rather than a reconstruction of its historical checkout.

| Source | Accepted commit |
| --- | --- |
| Workbench `develop` before this audit | `8dfb0ffe374cdc07dca370f80122ccd7c49edb50` |
| Martlet Jekyll `develop`, merged [PR20](https://github.com/martletdesign/jekyll/pull/20) | `ac0a64c6cd5167ccbdf96bb20e46e5d547a49a5d` |
| Krigsvold Jekyll `develop`, merged [PR18](https://github.com/krigsvolddesign/jekyll/pull/18) | `35c7f54aa9418286956f8aa50c2a3dd141006ab2` |

The complete `_data/examples.json` bytes match, not just the number of pages: SHA-256 `4795e34b2eaea8fa506cca6d7679e93f38c6019cea704834ae736ef2064afd37`. There are exactly 50 unique recipe IDs. The FAQ include, recipe include and document layout remain byte-identical. Both `examples-family.css` and `dashboard-family.css` differ; their existing editorial/region/collection differences must survive. Per-file hashes are in `baselineChecks` in the JSON ledger.

Two points in PR92 need dated qualification:

- Its “pending” hero PRs are now accepted into the pinned `develop` baselines. Their host artwork, three-tier hero contract, footer integration, source archives and deployment authority are existing work to preserve.
- `dashboard-components` is **four capability-reference sections**, named `composition`, `metrics`, `behaviour` and `authority`. It is not a local catalog of 22 component records. The React catalog can inform browsing and inspection organization; this task must not invent component rows, fields or product capabilities. The generic fixture prose also does not describe the actual specialized dashboard templates; those are separately audited.

PR92's screenshot observation is retained as reported evidence. The new paired baseline capture and identity/photo-masked comparison provide the reproducible observation for this run; they must be attached before claiming that a route has passed visual acceptance.

The [rendered baseline contract summary](baseline-contract-summary.json) covers all 50 routes per family: 692 captured human-meaning chunks, including table headers/cells, plus stable IDs, links, forms, controls, machine-readable times and native disclosures. Six generic fixture placeholder values on the three specialized dashboards are not literal baseline output; their actual specialized headings, summaries, data and controls are captured separately. The frozen v2 raw baseline and tool are hash-pinned in the summary. The earlier 616-checkpoint summary is preserved separately; its original raw packet was not retained, and its unversioned path is explicitly superseded. This is an explicit observed model/rendering boundary, not permission to drop new content or a claim that every raw JSON leaf appears verbatim.

## Source judgment and boundaries

[Martlet grammar](../../languages/martlet/grammar.md) and [source decisions](../../languages/martlet/decisions.md) establish proximity, readable sequence, bounded reading and continuity. They also support compact controls, comparison tables and simultaneous reference when the task warrants them. The warm gold-forward Jekyll host expression does not rewrite the canonical origin's blue tokens.

[Krigsvold grammar](../../languages/krigsvold/grammar.md) and [source decisions](../../languages/krigsvold/decisions.md) establish purposeful regions, common edges, scope and precise state. They also support focused reading and simple native forms. A sidebar, a table and a decorative accent are not mandatory regional anatomy.

Each ledger judgment is classified as a contextual application translation. It is not a claim that an exact FAQ, changelog or dashboard object was observed at the origin. Shared native accessibility and familiar form semantics remain intentional. Neither family is defined by being the mechanical opposite of the other.

Both hosted MCP endpoints returned HTTP 403 to the read-only `tools/list` probe during this audit. The repository's versioned grammar and decisions are the explicit fallback, with live origin DOM/CSS and actual framework precedent evidence gathered separately. Do not promote old experimental API/version labels in grammar prose into claims about current packages.

## Accepted first wave

The three exemplars are accepted into `develop` through [Martlet PR21](https://github.com/martletdesign/jekyll/pull/21), head `cff96a8586ab5300a38c68847cdbdee8c6aa5dab`, normal merge `0701a83e948964fd5bf2e05ee31e7385af7752d6`, and [Krigsvold PR19](https://github.com/krigsvolddesign/jekyll/pull/19), head `8dfcca47b5c312e125ac320643c442b1a00f8490`, normal merge `9f443d42608acf3f15df10c980003a128eea0428`. The [wave-one acceptance receipt](wave1-acceptance.json) pins required-check URLs, preview URLs, source/artifact hashes, native build verification and paired visual/state results.

Each head passed six genuine CI checks. Independent native verification compared 1,128 files in total; actual HTTPS acceptance covered 48 route/state cases, 56 check records, 12 axe scans and 738 pixel-contrast samples. Both families have 36 normal and 36 strictly masked exemplar frames. The stronger v2 semantic contract passes all 50 routes at both base paths for these heads. These are scoped observations, not independent build-token attestation or manual assistive-technology certification.

Global accessibility is **not yet complete**. Actual early all-route audits found the same six duplicate region-name failures in both families: reference, event, report, integrations, stress-test and dashboard-operations. Generic table-region labels are scheduled for wave2; operations is tracked in wave4. Behavior checks otherwise have the same 448 tested keys: 436 passes and 12 known failures per family. Their state outcomes are tested against expected behavior, not merely equality. These failures remain failures until corrected and rechecked.

## Accepted reading wave

[Martlet PR22](https://github.com/martletdesign/jekyll/pull/22), checked head `0e507e424a787c6631d631f4264c9bd08da01321`, normally merged as `d983fcc22218de9e96dd932d5d0cb149740b1dbd`. [Krigsvold PR20](https://github.com/krigsvolddesign/jekyll/pull/20), checked head `45a4166d5bbb6e2b0daf96db6a0d2353ae9c5303`, normally merged as `bdbf62c0d37b705b6dbd35900bcaf40cd7dfb787`. The [reading-wave acceptance receipt](wave2-acceptance.json) pins their source trees, CI/native/public artifact and actual-review evidence.

Both passed six genuine CI checks and independent verification of 567/561 files. Actual HTTPS acceptance covered 198 states, 44 clean axe scans, 60 native table/data cases and 4,316 measured contrast samples. Initial offscreen samples were explicitly unmeasured, never treated as passes; real native-scroll supplemental captures resolved their coverage. The five generic duplicate-region names are fixed. Operations remains a separate unresolved global accessibility item.

Fourteen unique routes have accepted recipe-local composition/CSS/accessibility changes so far. Retained semantic anatomy can still have a measured CSS or accessible-name correction. A separate preexisting Krigsvold host-header collision at true 200% text/1440px is now a final blocker; zero document overflow was insufficient to detect it. Its eventual shared-host correction must be recorded separately from recipe restyling and from genuinely unchanged views.

## Paired implementation waves

| Wave | Work | Concrete decision |
| --- | --- | --- |
| 1 | FAQ, changelog, capability-reference document | Preserve every fixture string/anchor; distinguish topical editorial grouping versus scoped regions, chronology versus comparable release fields, and annotated document versus inspectable four-section register. |
| 2 | Documents and sustained reading | Refine guide/reference/integration/documentation relationships where useful; retain article, policies and stress-test semantics where their existing structure serves the task. |
| 3 | Collections, detail, landing and dossiers | Preserve existing family list/metadata distinctions. Refine documentation navigation, evidence report composition and query/result scope where the task supplies a concrete reason. |
| 4 | Workspaces, dashboards, forms and recovery | Preserve working family-specific collection/detail compositions. Refine dashboard command/state relationships; retain conventional form/error anatomy and all behavior contracts. |

FAQ grouping derives from the four existing questions: two concern the fixture/languages, and two concern local behavior/capability boundaries. Group labels are shared presentation annotations, not new fixture content. Native `details` remains available without JavaScript.

Changelog titles contain versions and human-readable dates, not a separately authored machine-time field. Keep their full original titles and Markdown bodies, including Added/Migration text, and stable release anchors. Presentation may expose existing version/date relationships but may not invent release status, migration facts or timezone/timestamp semantics. Martlet’s current fixed-fixture date-only `time` attributes are derived from those authored titles and pinned by tests; this is not a new date field or an arbitrary-title parser contract.

The capability-reference route retains its four full sections. Krigsvold inspection may use native disclosures; Martlet annotated reading may remain expanded. Whether a disclosure is initially open is presentation, not a deletion of content or replacement of a native interaction.

## Measured document composition review

The shared `.example-reading` rule limits the entire document wrapper to `46rem`, while the family document grids place a `14rem`/`13rem` index and a responsive gap inside that wrapper. Actual 1440px baseline geometry now confirms the same 736px outer wrapper across all ten document routes: Martlet has a 224px index, 72px gap and 440px article; Krigsvold has 208px, 57.6px and 470.4px respectively. The ledger pins the geometry report and the remaining seven document corrections. The source reading composition separates its index from its bounded text. FAQ exemplar corrections do not prove that privacy, terms, guide or stress-test bounds are adequate. Record computed geometry and actual CSS corrections separately from preserving section semantics; do not fabricate measurements from declarations.

## Evidence lifecycle

The ledger distinguishes a source decision, implementation, automated verification and visual acceptance. A row is not complete because a CSS selector changed or a browser test passed. Record exact PR/head, isolated preview URL, test result and paired visual findings in `evidence` and `pullRequests`; record a justified exception in `exceptions` rather than inventing a universal pass.

The complete visual review covers all 50 paired routes, with contact sheets and focused state inspections; the six initial specimens are a baseline, not system-wide evidence. Keep browser capture concurrency bounded to two processes. Baseline and after captures cover 320/768/1440px, both appearances, representative open and recovery states, plus a comparison with identities and photographs masked. Broader route checks include 200% text, keyboard/focus, no JavaScript, forced colors, reduced motion, print, root and `/preview`, and representative Chromium/Firefox/WebKit behavior. Shared fixture/data equivalence is necessary throughout.

Feature PRs target `develop`; live isolated PR previews and required checks precede integration. Production promotion, canonical origin changes and npm publication are outside this work. Keep source attribution, archival guarantees and the accepted nonproduction deployment controls intact.
