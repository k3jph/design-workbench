# Independent React language references

October 24, 2026 · Experimental 0.1.0 · MIT

**Current authority, 7 November 2026.** Native React implementations and reference catalogs now belong to https://github.com/martletdesign/react and https://github.com/krigsvolddesign/react. Their published npm version is 0.2.0 (`latest`), and current reference destinations are https://react.martletdesign.dev/ and https://react.krigsvolddesign.dev/. The workbench owns shared contracts and representative data. The original 0.1.0 review-site and host-copy investigation below is preserved as historical evidence; its unpublished status and staging commands are not current deployment instructions. Use each independent repository's native build/deploy process and verify its actual live source identity. See [current distribution](distribution.md).

The two reference applications have separate experimental layouts, existing system marks, theme semantic palettes, and proposed application grammars. They demonstrate a collection/reading/editor pattern in each language alongside all 22 component specimens, API and keyboard contracts, standalone JSX examples, and agent-tooling setup. The [October 23 origin audit](qa/origin-audit-2026-10-23.md) is a fixed baseline. Its [67-item reconciliation ledger](qa/origin-reconciliation.md) now records restored source objects, removed unsupported decoration, explicit application extensions and remaining vocabulary. Neither grammar is locked.

| Family | Private review site | Public preview home | Output |
| --- | --- | --- | --- |
| Martlet | https://martlet-react-reference.k3jph.chatgpt.site | https://martletdesign.dev/react/ | docs-dist/martlet |
| Krigsvold | https://krigsvold-react-reference.k3jph.chatgpt.site | https://krigsvolddesign.dev/react/ | docs-dist/krigsvold |

Both review Sites retain their existing owner-private audience. The 0.3 public references are distributed separately on the design domains; the owner-private review Sites retain their audience. The React packages remain unpublished and experimental; no npm publication, source-site replacement, or public access change is implied.

## Language, patterns, and components

Martlet's Commonplace composition uses a folder shelf, grouped collection entries, and a focused reading/editing progression. Krigsvold's Notes workspace uses an explicit scope/search command region and aligned results beside a current-note region when space permits. These are task-specific compositions derived from their respective grammars, not exclusive family templates. Both support top, side, or no primary navigation through AppShell. See [the grammar brief](ui-grammars.md), [Martlet](languages/martlet/grammar.md), and [Krigsvold](languages/krigsvold/grammar.md).

Both patterns use identical fictional note content and shared domain invariants. Finding, creating, reading, editing, title validation, changed-draft departure, pending saves, deliberately failed saves and retry, and reversible removal work in the session. Reload restores the examples; no durable storage or backend retrieval is claimed. A clearly separated failure-inspection control is documentation tooling. Width inspection uses an independent document at full, 768px, or 320px available width; changing width or mode preserves its draft. Focused workspace links open the same pattern without the documentation navigation.

Original theme-site SVGs remain byte-for-byte verified, with paths and Git blob hashes in docs-app/brand/provenance.json. React light roles now follow source object use rather than relying on token membership alone. Martlet restores its left hierarchical index and separate inline contents. Krigsvold restores the white desktop popup and transparent mobile submenu. Both documentation frames use source-derived navigation/footer anatomy with explicit host translations. Full-page dark mode and application controls remain extensions. See the source-decision profiles on each language page and the reconciliation ledger for exact limits.

## Agent access

Each family has an independent hosted HTTP MCP and local stdio distribution, 58 attributed references, and its own builder skill. The Agent tools page provides a standalone locked-dependency archive that installs and serves outside the workbench. It includes only that family's catalogue and skill. Public MCPs live at https://martletdesign.dev/mcp and https://krigsvolddesign.dev/mcp through the existing Cloudflare theme sites. Claude Code 2.1.310 connects successfully to both. Static review Sites retain their private audience; account-specific ChatGPT/Claude installation is separate. Read [setup, behavior, evidence and limits](mcp.md).

## Build and isolation

```sh
npm ci --ignore-scripts
npm run check
npm run test:packages
npm run test:agents
```

The Vite build selects one family package, layout, pattern, grammar, styles, fonts, and original mark. Shared examples, contracts and task state do not force shared rendered composition. Output checks reject cross-family package styles/tokens and registry API code. Every standalone copied example compiles and renders. The AppShell example and working-pattern width inspection use separate documents so each document has one main landmark.

The knowledge generator uses checked-in rules and contracts, actual copied examples, and pinned theme JSON. Release builds set DESIGN_SOURCE_COMMIT to the verified full source SHA; uncommitted local knowledge explicitly reports a null commit plus content digest. API and examples are not authored independently for agents.

## Stage and publish

Retain each Site's existing identity and audience. Build from committed source, then stage:

```sh
DESIGN_SOURCE_COMMIT=FULL_SOURCE_COMMIT npm run build:docs
node scripts/stage-docs.mjs martlet /absolute/martlet-site-checkout FULL_SOURCE_COMMIT
node scripts/stage-docs.mjs krigsvold /absolute/krigsvold-site-checkout FULL_SOURCE_COMMIT
```

Staging copies one static output, its agent archive, font/runtime licenses, and exact source provenance. The Sites source helper pushes and packages that same staged tree for owner-private publication. No registry service, SQLite data, user drafts, or application write endpoint is included.

## Verification boundaries

The Node suite checks actual package exports, all copied examples, family output isolation, original-mark provenance, AppShell placements, notebook state transitions, and real MCP client/server exchanges. Isolated consumer checks install both React tarballs and both agent archives. The existing workbench browser suite remains a separate regression surface.

Manual cloud-browser review exercises the actual language references and their working patterns. Independent builder-skill evaluations produce additional synthetic contact-directory fixtures in different frames; their source, rationale, checks and limits are retained under docs/qa/skill-evaluation. Their automated accessibility observations do not certify the deployed documentation pages. Manual assistive technology, localization/RTL, forced colors, sustained use and broader pattern coverage remain open. The complete languages are not declared stable by this milestone.
