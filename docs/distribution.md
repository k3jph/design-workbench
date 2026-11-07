# Current distribution and capability baseline

Verified inventory: 7 November 2026. [distribution.json](distribution.json) records exact package channels, source identities and artifact integrity. Availability, contract maturity, and a verified deployment are separate facts.

| Implementation | Martlet | Krigsvold | Current position |
| --- | --- | --- | --- |
| Core | 2.2.3, npm `latest` | 2.2.4, npm `latest` | Published independently; optional application/source-profile rules remain documented extensions |
| Astro | 2.0.0, npm `latest` | 2.0.0, npm `latest` | Published with matching Core peer dependencies; native Astro APIs and host-owned controllers |
| React | 0.2.0, npm `latest` | 0.2.0, npm `latest` | Published from independent repositories with Core dependencies; component APIs remain experimental |
| Legacy theme | 2.1.0 `latest`, 2.2.2 `next` | 2.1.0 `latest`, 2.2.3 `next` | Existing consumers and historical snapshots retain their explicit dependencies |
| Jekyll | [1.1.0 source release](https://github.com/martletdesign/jekyll/releases/tag/v1.1.0) | [1.1.0 source release](https://github.com/krigsvolddesign/jekyll/releases/tag/v1.1.0) | Accepted, deployed and source-published milestone; no npm package or new Jekyll release |

The earlier inventory advertised Astro 1.2.2, React 0.1.0 and Jekyll 1.0.0. The current record corrects those facts using registry metadata, downloaded React bytes and the accepted Jekyll source-release verification. Astro 1.2.2 and React 0.1.0 still exist under `next`; that older channel does not supersede `latest`. A genuine npm publication does not imply a matching GitHub Release exists. At this review, the standalone React repositories have no GitHub Releases; their actual npm packages are nevertheless available.

## Demonstrated contracts and remaining scope

| Capability | Baseline and completed work | Limits |
| --- | --- | --- |
| Language grammar | Independent charters, origin observations and versioned source decisions; both languages support reading and complex applications | Original experimental snapshots remain attributed and unchanged; publication does not make every extension stable |
| Canonical examples | 50 records, eight composition families, common schemas and representative data | Equivalent content and capabilities permit independent family layouts and framework APIs |
| Applications | Three dashboard applications, directory/editor, applied-query recovery and a separate scientific workspace | Local synthetic state; no identity, payments, messaging, device or durable-service implementation is implied |
| Domain verification | Schema/destination/data parity and dashboard, event/date and thermal model tests | Browser, visual and manual accessibility evidence are separate from these fast checks |
| Agent discovery | Existing example, interaction/recovery, dashboard and scientific contracts are exposed through the existing read-only MCP catalogue | No new controller API, write endpoint, migration service or reporting system |
| Responsive acceptance | Existing enlarged-text regression checks whole dashboard words after layout settles, alongside overflow, keyboard and reduced-motion behavior | Root text scaling is not real browser zoom or full localization/RTL certification |

Canonical records and shared representative data remain owned by the workbench. Core and framework repositories own their implementations and releases. Jekyll 1.1.0 remains an accepted reference, not an export to regenerate over its independent source.

Use the current `platform:React`, `platform:Astro` and `platform:Jekyll` references before choosing installation paths. The immutable `canonicalGuidance` snapshot records historical grammar/source provenance; its embedded implementation versions describe that snapshot, not today's npm channels. Manual assistive technology, full localization/RTL, sustained use and unsupported Vue/Svelte/native APIs remain explicit limitations rather than invented implementation claims.

Integration follows [GitFlow acceptance](GITFLOW-ACCEPTANCE.md): one required check, zero required human reviewers, advisory extended suites, and exact accepted source/artifact verification at deployment. This document adds no approval stage or publication authority.
