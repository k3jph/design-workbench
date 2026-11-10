# Current distribution and capability baseline

Reviewed 10 November 2026. [distribution.json](distribution.json) records exact package versions, source commits, release links, dependency contracts and artifact hashes. Package releases, design grammar snapshots and deployed references have independent versions.

| Implementation | Martlet | Krigsvold | Contract |
| --- | --- | --- | --- |
| Core | 3.0.0 | 3.0.0 | Canonical tokens, fonts and all shared visual rules; npm latest |
| Astro | 3.0.0 | 3.0.0 | Native Astro components with Core ^3.0.0; npm latest |
| React | 1.0.0 | 1.0.0 | Released React 19 components, exact Core 3.0.0 dependency; npm latest |
| Jekyll | 2.0.0 | 2.0.0 | GitHub source release with synchronized Core 3 CSS and fonts |

The six npm tarballs were downloaded and checked against registry SHA-512 integrity and matching GitHub release asset SHA-256 digests. Jekyll source ZIP digests come from GitHub release metadata. This record does not claim a fresh independent signature verification, reproducible build proof or current live deployment for every artifact. Older theme packages and original grammar snapshots retain their identities.

## Coherent systems with native implementations

Each family defines a complete design language for publishing, services and applications. Core owns its visual rules. Astro, React and Jekyll own native markup and behavior; shared content and interaction contracts do not require identical framework APIs or identical composition between families. Astro and Jekyll share the canonical family stylesheet. React's public styles.css entry delegates to Core's react.css.

The workbench owns 50 canonical examples, equivalent representative content and datasets, three dashboard applications, a scientific workspace, and shared interaction/recovery contracts. The independent Core and framework repositories own their implementations and releases. Reference data and simulated operations do not implement durable services.

## Adoption and migration

Install Core 3 for direct HTML/CSS. Install Astro 3 with Core 3 and a supported Astro runtime. Clone the separate family astro-starter repository for initial project files; starters are not bundled in the component package. React 1 installs its exact Core dependency and requires React 19. Jekyll 2 is consumed from its standalone repository or source release.

When moving from Core 2, replace canonical reference.css imports with martlet.css or krigsvold.css. Upgrade Astro to 3 together with Core; existing component names, props and slots remain available. Remove copied framework styling in favor of Core's exports. Keep the documented React styles.css import, and do not layer full.css over it. Follow each repository's migration notes and verify your application's complete interactions after upgrading.

Package versions follow their own semantic-versioning histories. Core/Astro 3, React 1 and Jekyll 2 describe different contracts; forcing their numbers to match would hide that history. Compatible fixes are patches, compatible additions are minor releases, and breaking changes require majors. The MCP catalog has its own version, independent of grammar 0.3 and package releases.

## Evidence and limits

Automated verification covers schema/data parity, model behavior, builds, exercised browser interactions, keyboard/focus, responsive layouts and reduced motion. Coverage applies to the states actually tested. Manual assistive technology, full localization/RTL and sustained consumer use remain open. Vue, Svelte and native platform APIs are not implemented.

Retrieve platform:Astro, platform:React or platform:Jekyll before choosing APIs. The canonicalGuidance snapshot preserves original source provenance; embedded implementation versions describe that snapshot. The current manifest and platform setup guidance describe today's releases. Private React 0.2.0 workspaces remain historical fixtures; the workbench runtime uses published React 1 through internal npm aliases.

## References and release process

| Framework | Martlet | Krigsvold |
| --- | --- | --- |
| Astro | https://astro.martletdesign.dev/ | https://astro.krigsvolddesign.dev/ |
| React | https://react.martletdesign.dev/ | https://react.krigsvolddesign.dev/ |
| Jekyll | https://jekyll.martletdesign.dev/ | https://jekyll.krigsvolddesign.dev/ |

Integration follows the existing GitFlow policy: feature work to develop, release or hotfix promotion to main, and backmerge to develop. Repository workflows publish accepted releases automatically. This guidance introduces no additional approval or deployment gate. A public URL is a destination, not proof that the latest release has deployed; check the live reference when deployment identity matters.
