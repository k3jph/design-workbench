# Current distribution and capability baseline

Verified inventory: 7 November 2026. [distribution.json](distribution.json) records exact package channels, source identities and artifact integrity. Availability, contract maturity, and a verified deployment are separate facts.

| Implementation | Martlet | Krigsvold | Current position |
| --- | --- | --- | --- |
| Core | 2.2.4, npm `latest` | 2.2.5, npm `latest` | Published independently; optional application/source-profile rules remain documented extensions |
| Astro | 2.0.3, npm `latest` | 2.0.6, npm `latest` | Published with matching Core peer dependencies; native Astro APIs and host-owned controllers |
| React | 0.2.1, npm `latest` | 0.2.2, npm `latest` | Published from independent repositories with Core dependencies; component APIs remain experimental |
| Legacy theme | 2.1.0 `latest`, 2.2.2 `next` | 2.1.0 `latest`, 2.2.3 `next` | Existing consumers and historical snapshots retain their explicit dependencies |
| Jekyll | [1.1.0 source release](https://github.com/martletdesign/jekyll/releases/tag/v1.1.0) | [1.1.1 source release](https://github.com/krigsvolddesign/jekyll/releases/tag/v1.1.1) | Accepted, deployed and source-published milestone; independent source releases, with no Jekyll npm package |

All six current Core, Astro and React packages are independently installable from npm `latest`. Fresh qualified registry installs, npm signatures and exact trusted-publisher workflow provenance passed. Each now has a genuine GitHub source release with a protected version tag, matching archive and verified SHA256SUMS downloads. The registry and GitHub archive bytes match the independently reproduced accepted-main packages. Release assets themselves are not asserted immutable against administrators. Exact source commits, artifact hashes, release URLs and peer dependencies are recorded in distribution.json. Astro 1.2.2 and React 0.1.0 remain historical `next` channels; they do not supersede `latest`.

## Demonstrated contracts and remaining scope

| Capability | Baseline and completed work | Limits |
| --- | --- | --- |
| Language grammar | Independent charters, origin observations and versioned source decisions; both languages support reading and complex applications | Original experimental snapshots remain attributed and unchanged; publication does not make every extension stable |
| Canonical examples | 50 records, eight composition families, common schemas and representative data | Equivalent content and capabilities permit independent family layouts and framework APIs |
| Applications | Three dashboard applications, directory/editor, applied-query recovery and a separate scientific workspace | Local synthetic state; no identity, payments, messaging, device or durable-service implementation is implied |
| Domain verification | Schema/destination/data parity and dashboard, event/date and thermal model tests | Browser, visual and manual accessibility evidence are separate from these fast checks |
| Agent discovery | Existing example, interaction/recovery, dashboard and scientific contracts are exposed through the existing read-only MCP catalogue | No new controller API, write endpoint, migration service or reporting system |
| Responsive acceptance | Existing enlarged-text regression checks whole dashboard words after layout settles, alongside overflow, keyboard and reduced-motion behavior | Root text scaling is not real browser zoom or full localization/RTL certification |

Canonical records and shared representative data remain owned by the workbench. Core and framework repositories own their implementations and releases. Each accepted Jekyll implementation remains its family’s visual reference, not an export to regenerate over its independent source.

The approved Martlet reference palette is intentional; source-origin comparison does not replace it with jameshoward.us colors. Krigsvold has no automatic/default page TOC. An explicitly authored contents list stays inline above prose; site navigation and application sidebars retain their separate roles.

Use the current `platform:React`, `platform:Astro` and `platform:Jekyll` references before choosing installation paths. The immutable `canonicalGuidance` snapshot records historical grammar/source provenance; its embedded implementation versions describe that snapshot, not today's npm channels. Manual assistive technology, full localization/RTL, sustained use and unsupported Vue/Svelte/native APIs remain explicit limitations rather than invented implementation claims.

Integration follows [GitFlow acceptance](GITFLOW-ACCEPTANCE.md): one required check, zero required human reviewers, advisory extended suites, and exact accepted source/artifact verification at deployment. This document adds no approval stage or publication authority.

## Adoption and migration

For new direct-HTML or CSS use, choose the corresponding Core package. Astro uses native components with matching Core peers; install the exact current pair and a supported Astro version. Each current React package brings its exact matching Core dependency and retains React 19 as a peer. Follow `platform:Astro` or `platform:React` for framework-native imports, styles, fonts and controller ownership. Do not layer Core full.css over React component styling or translate framework-specific event and focus APIs.

Existing legacy-theme consumers and the accepted Jekyll references retain their pinned dependencies. The private workbench React 0.2.0 workspaces remain historical test fixtures; the workbench app and current token references consume published Martlet React 0.2.1, Krigsvold React 0.2.2 and their matching Core packages. No private fixture is relabeled as a new release, and publication does not change the original grammar snapshots or every contract maturity record.

## Verified native references

Both Astro and React families now serve their accepted main releases on the canonical reference domains:

| Reference | Martlet | Krigsvold |
| --- | --- | --- |
| Astro | https://astro.martletdesign.dev/ | https://astro.krigsvolddesign.dev/ |
| React | https://react.martletdesign.dev/ | https://react.krigsvolddesign.dev/ |

Complete canonical live-payload comparisons verified the accepted source SHA and deterministic artifact inventory for all four sites. The distribution record includes the exact source, artifact digest, verification time and file count. This automated artifact proof is separate from manual accessibility or service behavior; R2 publication remains disabled.

The workbench uses internal npm runtime aliases for published React packages because npm gives the same-named private workspace priority even when the root asks for a newer version. The aliases retain the genuine registry package name, tarball and integrity. Public installation examples continue to use the canonical `@martlet/react` and `@krigsvold/react` names; fixture manifests and private source histories stay unchanged.
