# Nightjar IV: eight-site readiness and rollback

This is a preparation record, not production approval. Read-only Cloudflare API and public HTTP observations were refreshed on 2026-11-02 UTC (2026-11-01 America/New_York). Earlier inaccessible probes are superseded where live observations below are available; endpoint failures remain unverified, not evidence of absence.

| Host | Intended owner/source | Prepared content | Outstanding |
| --- | --- | --- | --- |
| martletdesign.dev | private martletdesign/website | existing website proposals | Verify current origin, DNS, production branch and deployed commit |
| krigsvolddesign.dev | private krigsvolddesign/website | existing website proposals | Verify current origin, DNS, production branch and deployed commit |
| astro.martletdesign.dev | martletdesign/astro | #13 combines 50-recipe source reference with R2 prototype | Integrate full reference with archive; verify interactions, protected storage and serving, hosting and DNS |
| astro.krigsvolddesign.dev | krigsvolddesign/astro | #13 combines 50-recipe source reference with R2 prototype | Integrate full reference with archive; verify interactions, protected storage and serving, hosting and DNS |
| react.martletdesign.dev | martletdesign/react | 50-route React reference and local #6 archive adapter | Trusted remote archive, hosting and DNS |
| react.krigsvolddesign.dev | krigsvolddesign/react | 50-route React reference and local #6 archive adapter | Trusted remote archive, hosting and DNS |
| jekyll.martletdesign.dev | martletdesign/jekyll | 50-route Jekyll reference and local #6 archive adapter | Trusted remote archive, hosting and DNS |
| jekyll.krigsvolddesign.dev | krigsvolddesign/jekyll | 50-route Jekyll reference and local #6 archive adapter | Trusted remote archive, hosting and DNS |

## Routing contract

Each framework owns its version namespace under `/docs/v/<framework-version>/`; its manifest identifies the framework source and exact independent core package and integrity. Static assets and example links must work at root and subpaths. A separately verified stable pointer may select latest; prereleases and unsupported releases must be labeled. Stable archives cannot be replaced by normal release credentials. Full search indexing, canonical links, accessible version selection and no-JavaScript navigation remain acceptance work.

Main-site links should point to a framework host only after that host and the relevant reference version are verified. Do not repurpose either private site's Worker, Git branch deployment settings, or existing hostname as an implicit migration.

## Deployment and rollback sequence for later authorization

1. Inventory existing DNS records, proxied status, TLS certificates, Worker routes, account/zone ownership, production and preview branch filters, and deployed commit for every host. Record the actual values and owners; do not guess a CNAME target.
2. Review the immutable storage adapter and catalog trust anchor. Verify create-only writes, full archive bytes, old-version availability, latest promotion and interrupted-write recovery in a nonproduction account or test namespace.
3. Build each approved framework version from its locked dependencies; verify every archive at root and subpath, then verify browsers, keyboard, accessibility and no-JavaScript paths. Preserve old snapshots.
4. With separately granted deployment authorization, provision reviewed routing/DNS and publish framework hosts before changing main-site navigation. Check TLS, redirects, canonical URLs, all historical URLs, and origin ownership externally.
5. Roll back by restoring the previously recorded DNS/Worker route and previous separately stored stable pointer. Do not delete or overwrite version archives. Verify old public routes and cache behavior; investigate before attempting a repeat publication.

No DNS, Cloudflare, GitHub ruleset, npm trust, or deployed service was modified by this record. Manual screen-reader and physical-device testing remain outstanding.

## Authenticated infrastructure observations, 2026-11-02 UTC

Account `f6142510bef6212dfa78bc6932acc80f` contains the two intended zones: Martlet `69dea64caef3fdd16cbd2e46daa534b2`; Krigsvold `c59d0469424ebea0c460d455b30af1c6`. Account and zone listings, DNS, custom domains, certificate packs, Worker settings, deployment/version listings, Pages projects, and R2 bucket listing returned authenticated HTTP 200. The user-token verify endpoint returned 401 while these resource requests succeeded; this is endpoint-specific evidence and does not establish that all authentication is invalid.

| Host | Public HTTPS | Verified DNS/custom-domain association |
| --- | --- | --- |
| martletdesign.dev | 200 | Proxied AAAA `100::`; production Worker `martlettheme` |
| react.martletdesign.dev | 200 | Proxied AAAA `100::`; same production Worker `martlettheme` |
| astro.martletdesign.dev | Proxy CONNECT 403, no origin response | No record/domain association in returned complete zone/domain inventories |
| jekyll.martletdesign.dev | Proxy CONNECT 403, no origin response | No record/domain association in returned complete zone/domain inventories |
| krigsvolddesign.dev | 200 | Proxied AAAA `100::`; production Worker `krigsvoldtheme` |
| react.krigsvolddesign.dev | 200 | Proxied AAAA `100::`; same production Worker `krigsvoldtheme` |
| astro.krigsvolddesign.dev | Proxy CONNECT 403, no origin response | No record/domain association in returned complete zone/domain inventories |
| jekyll.krigsvolddesign.dev | Proxy CONNECT 403, no origin response | No record/domain association in returned complete zone/domain inventories |

Both apex and React custom domains report enabled production associations with `previews_enabled: false`. This domain setting is not proof that Git-connected Preview Builds are disabled. Keep the existing Worker names. React is currently served by the main-site Worker; an independently deployed React source cannot be inferred from HTTP 200.

Latest observed deployments: Martlet `34090854-95ee-49fa-8c5f-e00141b7d0c6`, version `e86442c3-905b-4c24-af1f-2073ee23786b` at 100%; Krigsvold `704f8d02-041f-4306-9617-e92285eb3693`, version `aeead116-1705-489a-b5e4-0fc71a8c86a1` at 100%. Both are recorded as Wrangler deployments on 2026-10-28. No source Git commit is exposed in the returned version annotations. Both settings responses show compatibility date `2026-10-12` and only an `ASSETS` binding; no R2 binding is configured in these returned settings.

Active certificate packs cover apex, www and React names. Both zones report minimum TLS `1.0`; Krigsvold SSL mode is `full` with active certificate status. Martlet SSL mode returned HTTP 400/header-format error and remains unverified. No TLS settings were changed.

The complete returned R2 bucket list contains one unrelated bucket and no Nightjar documentation bucket. This is scoped account-list evidence, not proof that no bucket exists in another account/jurisdiction or that object-level permissions exist. No R2 objects were read or written. Writer isolation, retention locks, create-only authorization, independent checkpoint protection, and S3 permissions remain unverified.

No relevant Pages project was present in the complete returned project list. Worker script-list and Krigsvold route-list endpoints returned 400 authentication errors; Martlet route list returned an empty array. Builds triggers/repos returned 401, so Git connections, production branches and Preview Build filters remain maintainer-reported rather than API-verified. Known-script settings/deployments requests succeeded despite script-list failure. No unavailable endpoint is treated as resource absence.

No infrastructure writes were performed. Production activation still requires demonstrated storage isolation, protected checkpoint/attestation, historical serving, and independent source/deployment reconciliation.
