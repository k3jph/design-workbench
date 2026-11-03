# Nightjar conformance evidence snapshot

Snapshot of evidence through workbench commit `22612d2` (October 29, 2026). The machine-readable [matrix](nightjar-conformance.json) contains all 300 example × language × framework cells. Each table entry below applies to both Martlet and Krigsvold because the cited suites ran both; visual identities were not compared for pixel equality.

**B**: route generated and checked in the recorded build; **I**: at least one relevant interaction was exercised; **A**: automated axe checks were run on this example; **R**: recorded responsive checks include this example. A dash means this snapshot does not attribute that check to that specific example. Every I, A and R is partial evidence, not a comprehensive pass. The A marker records initial-state Chromium axe scans on all 50 routes in both families and frameworks, in default and saved-dark appearances. These scans do not cover all states and do not turn incomplete contrast findings into passes. The catalog suites check all 47 content routes at 320px for Astro and React; dedicated suites cover dashboards. The Jekyll baseline checked every generated route and local link; its dashboard suite includes reflow checks. Some additional Jekyll non-dashboard sweeps are documented in the ledger without a per-route result set, so they are not attributed here.

No cell claims complete visual conformance, manual assistive-technology review, or performance conformance. Limited screenshot reviews and local transfer-size measurements are recorded in the [progress ledger](nightjar-status.md); these do not establish full coverage. Automated axe checks and a route build do not certify accessibility, behavior, visual parity or release readiness. Error-page examples demonstrate content and do not set host HTTP error statuses. Hosted Firefox and WebKit smoke covered a bounded selection of routes and states; 16 contrast scans per engine reported incomplete results. Broader cross-engine interactions, screen-reader testing, print-on-paper, source-shell fidelity and full cross-framework comparisons remain open.

| Example | Jekyll | Astro | React |
| --- | --- | --- | --- |
| home | B — A — | B — A R | B — A R |
| about | B — A — | B — A R | B — A R |
| article | B — A — | B — A R | B — A R |
| archive | B — A — | B I A R | B I A R |
| category | B — A — | B — A R | B — A R |
| categories | B — A — | B — A R | B — A R |
| person | B — A — | B — A R | B — A R |
| projects | B — A — | B — A R | B — A R |
| case-study | B — A — | B — A R | B — A R |
| documentation | B — A — | B — A R | B — A R |
| guide | B — A — | B — A R | B — A R |
| reference | B — A — | B — A R | B — A R |
| contact | B — A — | B I A R | B — A R |
| faq | B — A — | B I A R | B I A R |
| privacy | B — A — | B — A R | B — A R |
| terms | B — A — | B — A R | B — A R |
| service | B — A — | B — A R | B — A R |
| place | B — A — | B — A R | B — A R |
| pricing | B — A — | B — A R | B — A R |
| careers | B — A — | B — A R | B — A R |
| opportunity | B — A — | B — A R | B — A R |
| software | B — A — | B — A R | B — A R |
| product | B — A — | B — A R | B — A R |
| collection | B — A — | B — A R | B — A R |
| collection-item | B — A — | B — A R | B — A R |
| events | B — A — | B — A R | B — A R |
| event | B — A — | B — A R | B — A R |
| report | B — A — | B — A R | B — A R |
| gallery | B I A — | B I A R | B I A R |
| changelog | B — A — | B — A R | B — A R |
| search | B I A — | B I A R | B I A R |
| sign-in | B I A — | B I A R | B I A R |
| sign-up | B — A — | B I A R | B — A R |
| password-reset | B — A — | B I A R | B — A R |
| two-factor | B — A — | B I A R | B I A R |
| coming-soon | B — A — | B I A R | B — A R |
| not-found | B — A — | B — A R | B — A R |
| server-error | B — A — | B — A R | B — A R |
| workspace | B I A — | B I A R | B I A R |
| chat | B I A — | B I A R | B I A R |
| sensors | B I A — | B I A R | B I A R |
| fleet | B — A — | B I A R | B I A R |
| scene | B I A — | B I A R | B I A R |
| integrations | B — A — | B — A R | B — A R |
| stress-test | B — A — | B — A R | B — A R |
| patterns | B — A — | B — A R | B — A R |
| dashboard-analytics | B I A R | B I A R | B I A R |
| dashboard-components | B — A — | B — A R | B — A R |
| dashboard-administration | B I A R | B I A R | B I A R |
| dashboard-operations | B I A R | B I A R | B I A R |

## Experimental scientific workspace

The separate scientific-workspace route is experimental and is not part of the 50-recipe canonical matrix. At evidence commit `a20e968`, 12 local Chromium builds covered both families × Jekyll/Astro/React × root/subpath, including index navigation, static model agreement, validation and recovery, actual CSV bytes, keyboard focus, 320/1440px reflow, light/dark axe and no-JavaScript/blocked-script fallbacks. Its B/I/A/R evidence is sampled; Firefox/WebKit, manual assistive technology, physical print and full visual parity remain unassessed. See [the scientific notes](../../examples/page-archetypes/SCIENTIFIC.md).

See [the structured conformance review](nightjar-conformance-review.md), [the bounded contrast review](../../examples/page-archetypes/CONTRAST-VERIFICATION.md), [the ledger](nightjar-status.md), [Jekyll verification](../../examples/page-archetypes/VERIFICATION.md), [dashboard contracts](../../examples/page-archetypes/DASHBOARDS.md), [Astro notes](../../examples/astro-slice/README.md) and [React notes](../../examples/react-catalog/README.md) for the scope and limitations of the recorded runs. This is a dated snapshot; regenerate only after reviewing new evidence, and update the snapshot identifier and evidence lists.

To check that the checked-in matrix still matches the canonical catalog and route inventories, run `node scripts/qa/nightjar-conformance.mjs --check`. A successful check verifies consistency, not that a historical browser test was rerun.
