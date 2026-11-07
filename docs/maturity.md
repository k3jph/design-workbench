# Maturity and compatibility

Maturity describes the component contract. Availability describes a particular implementation. A platform target is intent. These are separate facts.

| Stage | Meaning | Gate for the next stage |
| --- | --- | --- |
| Proposed | Requirements recorded; implementation may not exist | Working implementation and explicit acceptance criteria |
| Experimental | Usable contract under evaluation; APIs may change | Recorded real consumer, manual accessibility review, behavioral regressions, documented compatibility and migrations |
| Stable | Reviewed public contract with documented support obligations | Continuing evidence and compatible maintenance |
| Deprecated | Replacement and migration instructions published | Announced removal window and supported migration |

The editor requires evidence before choosing stable, but it cannot establish whether a written claim is true. Review evidence manually. A published package does not retrospectively certify all of its components as stable. Seed records therefore start experimental.

| Implementation | Current inventory | Contract position |
| --- | --- | --- |
| @martlet/core / @krigsvold/core | 2.2.3 / 2.2.4 published, `latest` | Independent foundations; application extensions retain documented limits |
| @martlet/theme / @krigsvold/theme | 2.1.0 `latest`; 2.2.2 / 2.2.3 `next` | Existing legacy consumers and original snapshots remain supported explicitly |
| @martlet/astro / @krigsvold/astro | 2.0.0 published, `latest` | Native Astro exports with matching Core peers; API maturity and availability remain separate |
| @martlet/react / @krigsvold/react | 0.2.0 published, `latest` | Experimental; React 19; matching Core dependencies; independent repositories own publication |
| Martlet / Krigsvold Jekyll | 1.1.0 accepted source releases | Deployed and source-published; not npm packages |
| Registry API and database | API/export 1; SQLite 2 | Experimental; Node 24.19+ within Node 24 |
| Vue, Svelte, native components, web components | Planned | No implementation support claimed |

The private React workspace copies remain local fixtures. They are not the publication authority for the genuine independent npm releases. Keep their private flags and use the independent repositories' established trusted-publishing workflows. No npm token is committed or required to build. Exact current versions, channels and artifacts are recorded in [distribution.json](distribution.json), with the baseline and remaining capability limits in [distribution.md](distribution.md).

The [source consolidation review](qa/source-consolidation.md) preserves the historical Core 2.2.0/Astro 1.2.0 candidate investigation. Later releases are now published; the old report is not the current inventory. Canonical grammar and source decisions remain pinned to exact original revisions and hashes. Current installation references identify the independent packages separately. Grammar 0.3 and unobserved application extensions retain explicit experimental status; a published version is not universal consumer or accessibility evidence.

For stable APIs, compatible fixes use patch versions, compatible additions minor versions, and breaking changes major versions. Experimental releases still describe every breaking change and provide upgrade notes. Stable deprecation requires a named replacement, steps, examples, an announced minimum support window, and a major-version removal. The exact support window must be adopted before the first stable React release. No window is invented retroactively.

Database updates need ordered, transactional migrations, backup guidance, and a test using an earlier saved database. This schema does not migrate package availability or seed updates automatically. Explicit bundled-inventory previews can add records and update metadata without replacing saved specifications or removing implementations; they append revision history transactionally. JSON export is a portable current-state snapshot, not a full database backup. Changing family appearance does not require a data migration: both views edit the same records.

Structured readiness reviews record six local observation areas, bound to the complete saved specification and both implementation inventories. A changed basis requires renewed outcomes. Neither a current fingerprint nor six recorded passes proves evidence true, promotes maturity, or publishes an implementation. The existing editor evidence gate remains a separate decision record. See [review policy and schema-1 upgrade guidance](readiness-reviews.md).



[Experimental React release policy](release-policy.md) preserves pre-1.0 version increments, changelogs, exact-tarball verification and rollback/migration obligations, alongside the historical workbench release process. The proposed six-month stable deprecation window remains a proposal. Current independent publication uses its existing workflows; private workspace manifests remain private. Browser recovery/preferences use independent versioned origin-scoped formats and do not change database schema 2 or API/export 1. Product maturity records are separate from [GitFlow acceptance](GITFLOW-ACCEPTANCE.md) and do not add repository approval or deployment gates.
