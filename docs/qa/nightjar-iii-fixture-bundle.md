# Offline fixture and contract handoff rehearsal

The workbench remains the sole authority for the shared catalog, dashboard fixture and schemas. `nightjar-fixture-bundle.mjs` prepares a deterministic **review artifact** from four exact Git blobs at a full, locally available workbench commit. The same bundle can be reviewed for each proposed Martlet/Krigsvold Jekyll and React repository, and for Astro consumer tests. It creates no package, remote repository, branch, tag, release or deployment.

```sh
node scripts/qa/nightjar-fixture-bundle.mjs create /path/to/workbench FULL_COMMIT /new/path/fixtures.json
# Record and independently review the printed SHA-256 and source commit.
node /path/to/copied/nightjar-fixture-bundle.mjs unpack /path/to/fixtures.json FULL_COMMIT TRUSTED_SHA256 /new/output/directory
```

Creation ignores dirty worktree files, Git replacement refs and inherited Git selectors, does not fetch, refuses moving refs and non-regular tracked inputs, checks JSON syntax, and will not overwrite a bundle. Unpack needs only Node and a reviewed copy of the script, not Git or a workbench checkout. It requires an independently trusted expected commit and full bundle SHA-256, checks the exact ordered file list, every file hash, canonical base64 and JSON syntax, and creates a new destination. A checksum supplied by the same untrusted party as a modified bundle does not establish source authenticity: review or independently reproduce the source-to-bundle hash before accepting it. This verifies JSON syntax and bytes, not schema validity or behavior. The commands are not an enforced network sandbox.

For a future fixture change, the workbench owner reviews the exact fixture/schema commit and generates the bundle twice in clean environments; consumers pin the commit and reviewed bundle digest in their own review, unpack into a new temporary directory, inspect the changes and run their own builds and the pinned shared conformance tests. Their release and source trees do not silently become authorities for the copied fixture. Do not overwrite source files or accept changed fixture bytes automatically. If verification fails, retain the prior commit and digest and discard the proposed update. This is a deterministic transport and verification rehearsal, not a complete Jekyll page-regeneration or cross-repository synchronization mechanism: Jekyll generated pages, seeded shell transformations and stale-page deletion policy still require a separately reviewed deterministic update and maintainer decision.

At local Node 24.19, two independently created bundles at frozen workbench `80a5635abe4de7a07a1983de0b3ef796b101e047` both had SHA-256 `e6a696d9f51b5fdafc7c27f65e8f3a60dde63e8eaf8c90f38b9b9e5dbc1ac481`. A copy of the script outside the workbench verified and unpacked all four files into a new directory without Git metadata. `node --test tests/nightjar-fixture-bundle.test.mjs` covers deterministic output, dirty source, bad pin, altered data, wrong trusted digest, mismatched commit, changed inner payload and refusing an existing destination. Network isolation, remote distribution, cross-platform builds and authority transfer were not tested or authorized.

## Check generated Jekyll snapshot before accepting a fixture update

Copy `nightjar-fixture-bundle.mjs` and `nightjar-jekyll-fixture-check.mjs` together into a review environment. After independently reviewing the bundle commit and SHA-256, run:

```sh
node nightjar-jekyll-fixture-check.mjs BUNDLE FULL_COMMIT TRUSTED_SHA256 /path/to/standalone-jekyll-source
```

The check verifies the bundle, compares its catalog and dashboard JSON to the candidate, requires all 50 catalog source routes plus the index and experimental science route, rejects stale/missing HTML routes, and compares each canonical page's JSON front matter ID, permalink, title, summary and layout to the fixture. It never writes or deletes source. It does not generate updated pages, check rendered output, cover all front matter fields, enforce network isolation, evaluate science behavior, or establish accessibility and design fidelity. A stale page must be reviewed and resolved by an owner rather than automatically deleted. The source path is trusted local input, not a security sandbox.

At local Node 24.19, copies of both scripts outside the workbench checked no-Git archives of Martlet `9ae0b3609c82f1a27291d0934dab5ff4564ea9d0` and Krigsvold `6212d2bc076f959cd88e297023d40dff48dc6554` against the frozen fixture bundle above: each returned 50 canonical source routes. `node --test tests/nightjar-jekyll-fixture-check.test.mjs` independently rejects added stale routes, deleted routes, incorrect summaries, changed dashboard data and incorrect trusted bundle hashes. This reduces the risk of an unsafe handoff; it does not establish a complete cross-repository update process.
