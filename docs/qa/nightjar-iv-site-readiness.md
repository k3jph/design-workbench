# Nightjar IV: eight-site readiness and rollback

This is a preparation record, not a declaration that any hostname, DNS record, Worker, or deployment exists. On 2026-11-01 the available public web inspection service could not access any of the eight intended hosts; this observation does not establish whether they resolve or serve traffic. Obtain read-only DNS, TLS, routing, and Cloudflare inventory from the hosting administrator before changing anything.

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
