# Grammar decisions and executable evidence

Grammar 0.3 remains experimental. This document makes the settled review requirements and their scope explicit; it does not promote a specimen into a universal layout. The canonical family grammar, decisions and pattern contracts remain the pinned files in `docs/languages/{family}/canonical.json`. Their hashes and offline copies are checked by `scripts/sync-language.mjs --check` before knowledge generation.

## Authority and scope

An observed origin object is the baseline for that object. A host translation must identify its context. An application extension must explain its task, relationships, states and recovery. Later owner direction can supersede a host translation without rewriting the historical origin evidence. Tests enforce those distinctions, rather than treating every visible reference choice as a requirement for adopting applications.

The [documentation navigation decision](documentation-navigation.md) is the current owner-directed host rule: Martlet uses the origin dark hero and transparent-to-dark-navy scroll transition in light appearance, and reverses to a lighter hero and transparent-to-white transition in dark appearance; Krigsvold floats a dark menu with white text over its hero in light mode, and a white menu with dark text in dark mode. Both retain bounded contents and original family identity. The latest Martlet choice supersedes its earlier white/grey translation. It does not prescribe an application's header, appearance controller, or navigation orientation. Krigsvold's white desktop popup and transparent in-flow mobile submenu remain distinct objects.

## Independent compositional rules

| Decision | Martlet | Krigsvold | Scope |
| --- | --- | --- | --- |
| Related information | Establish a readable progression through proximity, proportion and hierarchy. | Assign regions explicit jobs; align comparable information inside them. | Family application grammar; no mandatory card or panel template. |
| Relational spacing | Field / group / region defaults: 0.5 / 1.5 / 2.5rem. | Field / group / region defaults: 0.5 / 1.5 / 3rem. | Experimental comfortable application roles, not origin page-section spacing or a public compact-density API. |
| Typography | Cambo for sustained prose and appropriate headings; Lato for interface work; Cinzel selective. | Roboto for body/interface work; Roboto Slab for headings; Roboto Mono for code/comparison where useful. | Existing family roles; original marks identify the system, adopting apps supply their own identity. |
| Assistance and actions | Keep assistance at the decision and commands with the affected object or collection. | Make command scope and current region explicit; align commands with their work. | Task contract, with shared native semantics and precise consequences. |
| Change and recovery | Preserve place, input and readable continuity. | Preserve useful context and distinguish requested, committed and failed state. | Complete transitions; a screenshot cannot demonstrate this rule. |
| Frame | Top, side and focused frames are available. | Top, side and focused frames are available. | Choose from the task; neither direction defines a family. |

## Executable review requirements

The IDs refer to the canonical eighteen-domain coverage ledgers. The named checks run for both families unless noted. `tests/reference-browser/conformance.spec.ts` measures rendered relationships, rather than only inspecting token declarations. Existing state checks remain in `tests/reference-browser/grammar.spec.ts`; shell and component checks remain in `tests/docs.test.mjs` and the workbench browser suite.

| Domain | Requirement being checked | Automated evidence |
| --- | --- | --- |
| G01 source authority | Pinned grammar/decisions, offline references and native marks retain provenance. | Knowledge build hash checks; documentation mark blob verification. |
| G02 spacing | Assistance stays inside its field; adjacent fields remain closer than distinct decision groups, including enlarged text. | `G02: field, group and region relationships survive enlarged text` |
| G03 density | Readable controls and grouping survive narrow/enlarged layouts; compact remains an open proposal. | Existing pattern reflow checks; no blanket target-size certification. |
| G04 typography | Rendered headings, wordmark and input use the intended family roles with loaded fonts. | `G04: loaded type roles preserve family hierarchy` |
| G05 layers | Krigsvold desktop navigation is a white anchored popup; at narrow widths it becomes transparent and in flow, with Escape returning focus. | `G05: popup becomes an in-flow mobile submenu` (Krigsvold); existing modal cancellation and focus-return checks. |
| G06 action scope | Field errors target their controls; collection commands reflect committed selection. | Existing form and result workflow checks. |
| G07 adaptation | Relationships, navigation and grouped footer remain usable at narrow/enlarged sizes. | New conformance checks plus existing light/dark pattern reflow checks. |
| G08 forms | Invalid input, changed reset, pending, failed save, retry and success retain the intended work. | Existing full form workflow check. |
| G09–G11 query and selection | Draft/applied scope differ; failure retains committed results/selection; changed committed scope resets selection; no-match and empty-source differ. | Existing result workflow check. |
| G12 focus/recovery | Summary links focus controls; temporary tasks restore focus; cancelled preparation ignores late completion. | Existing form and modal preparation checks. |
| G13 frames | Top/side/none remain available without introducing another family's composition. | Existing shell export/render and browser checks. |
| G14 reading and footer | Unnumbered parent/child contents retain hierarchy; supporting information and footer identity remain distinct. | `G14: contents retain parent and child hierarchy`; `G14: footer preserves identity and grouped destinations`; existing Article checks. |
| G15 frameworks | Exact platform APIs and publication status remain separate from shared grammar. | Existing compiled examples, package checks and pinned implementation/distribution records; independent adoption is separate evidence. |
| Host navigation | Martlet’s transparent/scrolled/open states and Krigsvold’s inverse floating surfaces retain their independent rules. | Martlet scroll/menu transition checks, Krigsvold hero/overlay/appearance checks, and the main sites' cross-renderer checks. |

## Current React consumer integration

The workbench's archived source shell contains global heading and label ink rules. Its React content adapter resolves those roles through the installed Core semantic tokens, including dark appearance, and uses the Core heading-weight token for the Krigsvold application masthead. Core Fieldset owns field spacing through its grid gap; the host must not add another adjacent-field margin. These are consumer integration rules. The archived source bytes and canonical grammar records remain unchanged.

## What a passing check means

These are repeatable reference requirements for the current implementation and explicit owner decisions. They do not certify all adopting applications or establish that either grammar is stable. A new composition can satisfy a relationship differently; it must explain that choice and preserve task outcomes. Do not copy reference dimensions indiscriminately into unrelated contexts.

G16 broader content vocabulary, G17 manual assistive technology/localization/RTL, and G18 sustained use/application breadth remain open. Consumer evidence is tracked separately from automated specimen evidence. Claude's [independent adoption brief](qa/claude-adoption-brief.md) defines the next external exercise without supplying previous findings or implementation-specific remedies.

The first [operator-reported connection observation](qa/mcp-connection-observation-2026-10-25.md) records successful setup and surprise at the lack of login. It does not count as a completed adoption build or a verified retrieval trace.

When a rule changes, record its authority and scope, revise the relevant contract, and exercise both the successful and failed transitions affected. Cross-framework changes require each renderer's own evidence. Do not mark an open gate complete because another framework or a static rendering passes.
