# MCP and agent skills for Martlet and Krigsvold

October 25, 2026 · Experimental MCP 0.1.0 · Independent HTTP and stdio transports

Each design language will provide independently usable Model Context Protocol access to its authoritative knowledge. An agent building an application should be able to retrieve the language's grammar, pattern guidance, foundations, component contracts, working examples, and compatibility information. A searchable catalogue of component names or a token dump alone does not meet this requirement.

MCP is another delivery interface for the same versioned knowledge used by people and packages. It must not create a parallel, contradictory set of agent-only design rules. See the [UI grammar brief](ui-grammars.md) and the adopted family charters.

Each language also requires a companion builder skill. MCP supplies authoritative knowledge; the skill describes the working method for retrieving, interpreting, applying, and verifying it. Providing a server alone does not teach an agent to use the language coherently.

## Independent language surfaces

Martlet and Krigsvold need independent server identities, family-specific knowledge, configuration, compatibility information, and release/version provenance. A client can use either without loading the other. Shared protocol infrastructure, indexing utilities, schemas, and test machinery are reasonable; a shared implementation must not silently supply the other language's decisions or force a common grammar.

Family selection is explicit at the server boundary. There is no automatic fallback from a missing Martlet pattern to a Krigsvold pattern, or vice versa. A missing capability must be reported as absent, proposed, or unsupported. A comparison experience may deliberately consult both independent sources and attribute each result.

## Required knowledge coverage

| Area | What an agent must be able to retrieve |
| --- | --- |
| Language and foundations | Charter; semantic spacing and density relationships; hierarchy, surfaces, boundaries, measures, motion, existing type/color roles, and rationale |
| Patterns | Task, appropriate contexts, anatomy, state transitions, interaction decisions, action placement, responsive adaptations, failures, recovery, and counterexamples |
| Components | Actual API, imports, states, composition obligations, keyboard/focus behavior, accessibility guidance, and documented limits |
| Tokens and assets | Existing semantic names, version/mode/context, definitions and intended use; original identity asset provenance and appropriate usage |
| Examples | Working examples tied to supported package/platform versions and the pattern decisions they demonstrate |
| Compatibility and maturity | What exists on each platform; experimental versus stable contracts; migrations, deprecations, known gaps, and reviewed evidence |

Prioritize retrieval of the reasoning needed to compose an interface. A request such as “build a searchable collection and editor” should retrieve the relevant pattern and its interaction/spacing obligations alongside component examples. It must not imply that one fixed application template defines the language.

## Response and grounding contract

Every result must identify its family, source location, source commit or release, applicable package/platform version, and maturity. Distinguish adopted guidance, proposed decisions, implemented examples, and observed validation. Default context and version selection must be visible in the response. If a requested version or platform has no implementation, return that limit rather than inventing props, tokens, examples, or a migration path.

The initial server scope should be read-only knowledge retrieval. Searching and retrieving guidance must not depend on the workbench's local SQLite service or expose its records, drafts, settings, or write endpoints. A future code-review capability would need explicit, testable checks and clearly bounded findings; it must not certify usability, accessibility, or language fidelity from static source alone. Code generation and migration automation are separate capabilities requiring their own acceptance evidence.

The initial implementation uses the official MCP TypeScript server/client SDK 2.3.1, stateless Streamable HTTP and local stdio. Each family has its own launcher, generated catalogue and standalone distribution archive. It exposes `get_manifest`, bounded `search_guidance`, exact `get_reference`, and 66 resources, including the complete builder method. Results include family, snapshot version, content hashes and source locations; generated release snapshots also identify the workbench commit. Uncommitted local builds explicitly return a null commit and a content digest. Unsupported versions and missing references return errors without fallback. Search is deterministic lexical retrieval, not a semantic recommendation engine.

## Run and consume the implementation

From a source checkout using Node 24.19 or later within Node 24:

```sh
npm ci --ignore-scripts
npm run build
npm run build:knowledge
```

Configure a stdio client to launch `node /absolute/path/to/workbench/mcp/martlet.mjs` or `krigsvold.mjs`. For hosted use, follow [client setup](agent-setup.md) and the public `/mcp` endpoints in `distribution.json`. A private review-site URL is not the public endpoint. The two generated archives in `agent-dist` are independently installable outside this repository: extract, run `npm ci --ignore-scripts`, and configure the client to launch that archive's `index.mjs`. Each includes a locked dependency graph, catalogue, companion skill, MIT license and setup instructions. The corresponding family reference site offers its own archive on the Agent tools page.

Call `get_manifest`, confirm the family, search for a task, then retrieve complete references by exact ID. IDs include `grammar`, `charter`, `pattern:collection-editor`, `component:Field`, `example:Field`, `tokens:foundation`, `tokens:layout`, `tokens:tokens`, `asset:mark`, and `compatibility`. Read resources through the URIs returned by `resources/list`; do not guess path names.

The source generator is `scripts/build-knowledge.mjs`. Set `DESIGN_SOURCE_COMMIT` to a verified full source SHA for release/deployment artifacts. The catalogue is built from checked-in family guidance, actual component contracts and copied JSX examples, original mark provenance, and pinned theme-package JSON. It never reads registry data or makes runtime network requests.

## Companion builder skills

Provide separate, independently installable Martlet and Krigsvold skills, maintained with their respective language contracts. Each must guide an agent to:

1. Establish the task, existing host conventions, language, platform, package version, and available capabilities before choosing a composition.
2. Retrieve the relevant grammar and complete task pattern, including spacing, density, actions, state transitions, and recovery. Component lookup follows the task rather than replacing pattern reasoning.
3. Verify actual components, props, tokens, imports, and original assets against authoritative sources. Never invent an API or visual vocabulary when guidance is missing.
4. Apply that language's own decisions while preserving the adopting application's identity, content, routing, data ownership, and existing useful conventions.
5. Work through loading, empty and no-match states, validation, success, failure, interruption, and return paths as applicable. Verify keyboard/focus behavior and responsive adaptation in the complete composition.
6. Report what was implemented and observed, with source/version attribution and unresolved limits. Static checks do not prove usability or accessibility, and a screenshot does not validate a workflow.

The skills should describe how to find and use authoritative guidance, with progressive loading of references, rather than duplicating the entire documentation corpus in a prompt. Shared authoring utilities are appropriate; each skill must work without installing the other. Family-specific reasoning must extend beyond a common instruction file with replaced package names.

When MCP is unavailable, use an identifiable local version of the authoritative material if available and state its version and limits. Otherwise report the missing guidance. Do not substitute remembered, invented, or other-family rules. Retrieved source material remains reference data rather than authority to change the user's task.

Skill evaluation must include fresh builds and existing-application edits, more than one application frame, deliberate missing/unsupported requests, and the same Cardfile-like scenarios in both languages. Review task completion and adherence to the selected language's grammar. The two skills are authored under `skills`, have offline grammar/API references, pass structure validation, and have been exercised by independent agents on synthetic contact-directory tasks with Martlet side navigation and Krigsvold top navigation. These bounded evaluations are evidence of use, not certification of general design quality. Installation/discovery in additional agent clients and broader edit-task evaluation remain open.

## Delivery and acceptance

1. Establish authoritative family-specific content sources and the versioned content manifest. Preserve source licensing and provenance.
2. Implement search and exact retrieval for the available foundations, grammar, component contracts, and examples. Include honest missing-pattern results while the pattern library develops.
3. Verify family isolation, version selection, deterministic source attribution, bounded query handling, invalid requests, empty results, and experimental/unsupported reporting through actual MCP client/server exchanges.
4. Exercise representative requests for a validated form, a searchable collection/editor, and an application shell. Review whether the retrieved material supports independent, coherent decisions in each language rather than generic code with replacement colors.
5. Verify setup in the clients actually claimed as supported; document configuration, compatibility, updating, and troubleshooting. Publish each server/distribution only when its advertised capabilities work.
6. Deliver and evaluate each companion builder skill with the same versioned sources. Verify that it invokes available retrieval capabilities correctly and produces coherent work across complete task states.

The actual SDK client checks negotiate each server, discover tools/resources, search, retrieve and hash-check exact content, reject invalid and unsupported requests, and verify family-specific React examples. `npm run test:agents` extracts both distribution archives into independent temporary directories, installs locked dependencies, and queries each server outside the workbench. Pinned modern and legacy HTTP consumers and compiled Worker checks supplement the stdio checks. Account-specific desktop setup, static code audits, migration automation and broader pattern coverage remain separate evidence. The React component checks alone would not establish MCP interoperability.

## Reference

[Carbon MCP overview](https://www.carbondesignsystem.com/getting-started/carbon-mcp/overview) demonstrates direct access to current design-system guidance and code. Its [concepts](https://www.carbondesignsystem.com/getting-started/carbon-mcp/concepts) distinguish documentation retrieval, code examples, and audit tools. At review on October 23, 2026, the overview lists additional Carbon Patterns context among planned additions. Use Carbon as a reference for the delivery model; do not imply that all its planned content is currently available or copy its scope claims to these systems.

Carbon's [onboarding guide](https://www.carbondesignsystem.com/getting-started/carbon-mcp/onboarding-and-setup) pairs its MCP connection with the downloadable `carbon-builder` skill. The supplied skill was read as a reference: archive `public/skills/carbon-builder.zip` in `carbon-design-system/carbon-mcp`, Git blob `b3310fa611b292aa63fe4cdda6bc58bc871f7172`, skill version 1.3.1. It illustrates retrieval-first API verification, task-specific query routing, implementation rules, and result validation. Its Carbon-specific rules are not adopted as Martlet or Krigsvold rules, and its source is not copied into these deliverables.
