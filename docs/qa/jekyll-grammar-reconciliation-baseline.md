# Jekyll grammar reconciliation: baseline audit and inventory

*Started 2026-11-03; tracks [issue #91](https://github.com/k3jph/design-workbench/issues/91). This is an evidence-backed starting inventory, **not** a claim of audited visual fidelity or completed implementation.*

## Facts independently checked
- Both standalone Jekyll repositories have exactly **50** entries in `_data/examples.json`; their `pages` arrays are identical at the checked `develop` refs.
- The `_includes/examples/faq.html`, `_includes/examples/recipe.html` and `_layouts/example-document.html` files are textually identical between the families at the same refs.
- Their `assets/css/examples-family.css` files are **not** identical and already implement meaningful family differences for some compositions. Changes must preserve these, not overwrite them.
- The current screenshot comparison of FAQ and changelog reveals weak perceived differentiation even when the families' type and selected layout rules differ.
- Canonical origin: Martlet from `jameshoward.us`, Krigsvold from `krigsvold.org`. React variants show useful differentiated catalog structures but do not supersede the originals.
- Pending Jekyll tiered hero PRs (as of audit): Martlet #20 and Krigsvold #18; check status and reconcile before merging work.

## Independent family review criteria

| Evaluation | Martlet | Krigsvold |
| --- | --- | --- |
| Underlying question | What relates, and what sequence makes it understandable? | What region/scope is this and what can I compare? |
| Editorial structure | Grouping, reading rhythm, hierarchy of annotations | Intentional boundaries, common alignment, explicit labels |
| Collection | Browseable annotated groups; retained context | Scannable records, stable columns/regions and comparisons |
| FAQ | Consider grouped reference entries; don't replace native disclosure semantics | Consider scoped question register; don't force tables where details are better |
| Changelog | Editorial version history / dated narrative and marginal notes | Explicit version and change fields, aligned metadata and release scope |
| Interaction | Proximity of assistance, continuity and recovery | Explicit scope, state, region identity and recovery |
| Cannot be sole distinguishing signal | Tint, font, decorative stripe, photograph | Tint, font, decorative stripe, photograph |

These are evaluation criteria, **not universal mandated layouts**. Same structure is justified where tasks genuinely call for it. Record a source/grammar reason for each changed or unchanged route.

## 50-route audit ledger

Every row below identifies a required paired visual/semantic review. The priority bucket is preliminary, not an audited disposition. Fill in disposition, actual UI evidence, screenshots, accessibility observations, and PR references as the work progresses.

| # | Route ID | Semantic class | Composition | Review wave | Disposition |
|---:|---|---|---|---|---|
| 01 | `home` | `landing` | `landing` | 2: collection/landing | Not yet dispositioned |
| 02 | `about` | `organization` | `landing` | 2: collection/landing | Not yet dispositioned |
| 03 | `article` | `article` | `reading` | 2: editorial/reference | Not yet dispositioned |
| 04 | `archive` | `archive` | `collection` | 2: collection/landing | Not yet dispositioned |
| 05 | `category` | `taxonomy` | `collection` | 2: collection/landing | Not yet dispositioned |
| 06 | `categories` | `taxonomy-index` | `collection` | 2: collection/landing | Not yet dispositioned |
| 07 | `person` | `person` | `detail` | 2: collection/landing | Not yet dispositioned |
| 08 | `projects` | `project-index` | `collection` | 2: collection/landing | Not yet dispositioned |
| 09 | `case-study` | `case-study` | `dossier` | 2: collection/landing | Not yet dispositioned |
| 10 | `documentation` | `documentation-index` | `collection` | 2: collection/landing | Not yet dispositioned |
| 11 | `guide` | `guide` | `document` | 2: editorial/reference | Not yet dispositioned |
| 12 | `reference` | `reference` | `document` | 2: editorial/reference | Not yet dispositioned |
| 13 | `contact` | `contact` | `detail` | 2: collection/landing | Not yet dispositioned |
| 14 | `faq` | `faq` | `document` | 1: exemplar | Not yet dispositioned |
| 15 | `privacy` | `policy` | `document` | 2: editorial/reference | Not yet dispositioned |
| 16 | `terms` | `policy` | `document` | 2: editorial/reference | Not yet dispositioned |
| 17 | `service` | `service` | `landing` | 2: collection/landing | Not yet dispositioned |
| 18 | `place` | `place` | `detail` | 2: collection/landing | Not yet dispositioned |
| 19 | `pricing` | `comparison` | `landing` | 2: collection/landing | Not yet dispositioned |
| 20 | `careers` | `opportunity-index` | `collection` | 2: collection/landing | Not yet dispositioned |
| 21 | `opportunity` | `opportunity` | `document` | 2: editorial/reference | Not yet dispositioned |
| 22 | `software` | `software` | `landing` | 2: collection/landing | Not yet dispositioned |
| 23 | `product` | `product` | `detail` | 2: collection/landing | Not yet dispositioned |
| 24 | `collection` | `collection` | `collection` | 2: collection/landing | Not yet dispositioned |
| 25 | `collection-item` | `collection-item` | `detail` | 2: collection/landing | Not yet dispositioned |
| 26 | `events` | `event-index` | `collection` | 2: collection/landing | Not yet dispositioned |
| 27 | `event` | `event` | `detail` | 2: collection/landing | Not yet dispositioned |
| 28 | `report` | `report` | `dossier` | 2: collection/landing | Not yet dispositioned |
| 29 | `gallery` | `exhibition` | `landing` | 2: collection/landing | Not yet dispositioned |
| 30 | `changelog` | `changelog` | `document` | 1: exemplar | Not yet dispositioned |
| 31 | `search` | `search` | `collection` | 2: collection/landing | Not yet dispositioned |
| 32 | `sign-in` | `account` | `reading` | 2: editorial/reference | Not yet dispositioned |
| 33 | `sign-up` | `account` | `reading` | 2: editorial/reference | Not yet dispositioned |
| 34 | `password-reset` | `account` | `reading` | 2: editorial/reference | Not yet dispositioned |
| 35 | `two-factor` | `account` | `reading` | 2: editorial/reference | Not yet dispositioned |
| 36 | `coming-soon` | `announcement` | `reading` | 2: editorial/reference | Not yet dispositioned |
| 37 | `not-found` | `error` | `reading` | 2: editorial/reference | Not yet dispositioned |
| 38 | `server-error` | `error` | `reading` | 2: editorial/reference | Not yet dispositioned |
| 39 | `workspace` | `record-workspace` | `workspace` | 2: operational | Not yet dispositioned |
| 40 | `chat` | `messaging` | `workspace` | 2: operational | Not yet dispositioned |
| 41 | `sensors` | `device-controls` | `workspace` | 2: operational | Not yet dispositioned |
| 42 | `fleet` | `record-workspace` | `workspace` | 2: operational | Not yet dispositioned |
| 43 | `scene` | `scene-viewer` | `landing` | 2: collection/landing | Not yet dispositioned |
| 44 | `integrations` | `integration-guide` | `document` | 2: editorial/reference | Not yet dispositioned |
| 45 | `stress-test` | `content-test` | `document` | 2: editorial/reference | Not yet dispositioned |
| 46 | `patterns` | `section-library` | `landing` | 2: collection/landing | Not yet dispositioned |
| 47 | `dashboard-analytics` | `analytics-dashboard` | `dashboard` | 2: operational | Not yet dispositioned |
| 48 | `dashboard-components` | `reference` | `document` | 1: exemplar | Not yet dispositioned |
| 49 | `dashboard-administration` | `administration-dashboard` | `dashboard` | 2: operational | Not yet dispositioned |
| 50 | `dashboard-operations` | `operations-dashboard` | `dashboard` | 2: operational | Not yet dispositioned |
  
## Initial three exemplars

1. `faq`: both Jekyll FAQ includes currently render identical native `details` markup. Preserve semantic disclosures; experiment with editorial question groupings for Martlet and scoped/ordered question regions for Krigsvold. Validate answer text, tab sequence and native toggles unchanged.
2. `changelog`: currently both share an example-document frame and generic section renderer. Reconcile the exact same version history with editorial chronology versus structured release comparison; do not invent fields or alter date semantics.
3. `dashboard-components` (plus the primary React catalog as precedent): compare annotated Martlet component browsing with Krigsvold's structured register, without altering the 22 shared components or their accessibility.

## Checklist for each paired change

- [ ] Attach source URLs and before/after screenshots at 320px/768px/1440px in light/dark.
- [ ] Preserve exact fixture content, IDs, routes, anchors and behavior.
- [ ] Record expected reading sequence and region/grouping criteria.
- [ ] Test keyboard/focus, no-JS, reduced motion, forced colors, print and root/`/preview`.
- [ ] Check screenshots with identities and photos masked: distinguish language by organization rather than superficial color.
- [ ] Run Jekyll CI/Playwright/axe and visual review; record pending tests rather than asserting full accessibility.
- [ ] Link reviewable feature-to-`develop` PR previews in both families.

## Do not change
The canonical source websites, protected `main`, npm publication, unrelated Cloudflare bindings, shared dataset/route contracts, or the imagery work already under review.
