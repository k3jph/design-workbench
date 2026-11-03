# Independent static reference delivery

This shared adapter serves the independently built Astro, React and Jekyll
reference assets for both design families. It does not build a competing archive
service or host framework implementation sources. Each output remains owned by
its standalone repository. Astro/Jekyll can use native Cloudflare static assets
without user Worker JavaScript or runtime bindings. React uses this custom
adapter with only an `ASSETS` binding. No account token, R2 writer, catalog
authority or publication secret is deployed.

The deployment plan names six new reference Workers and preserves the two
existing main-site Worker names and their observed rollback versions. It is a
reviewable intended rollout, not proof that deployment has occurred. The
integration coordinator records the exact tested main source and registry-backed
build identity before deploying, then verifies each live host in all three
browser engines. A material regression restores the recorded prior revision.

The advanced archive extension is disabled: `/_archive` requests return404 and
other write methods return405. Existing static/versioned documentation remains
readable. Retention against administrators, independent anti-rollback checkpoints
and privileged archive writers are not guarantees of this static adapter.

Historical manifest, catalog, promotion, integrity and recovery tests remain in
the standalone repositories. Re-enabling a production archive requires separate
runtime-isolation and current-head authority evidence; this delivery plan grants
no such security claim.


React compatibility uses a compile-time factory option. The deployment entry for
React imports `createReferenceWorker` and exports
`createReferenceWorker({legacyQueryReference:true})`; Astro and Jekyll use the
default false option. No hostname inference or extra runtime binding is needed.
The option redirects every React root/index alias to the colocated `/reference/`
component-directory frontend, with or without page/component/workspace/shell
selectors and preserving every query value.
Example pagination and all non-React asset routing remain unchanged. Cloudflare
must set `assets.run_worker_first:true` for these guarded routes to execute.


The deployment plan records native-platform mode for Astro/Jekyll and custom
ASSETS-only Worker mode for React. Actual binding readback must distinguish an
empty native list from an explicit ASSETS binding; neither proves the other.
The factory's default-false adapter remains a tested alternative if a static
framework later needs custom delivery. Platform HTTP behavior and each staged
Workers.dev URL must be verified before canonical-domain adoption, and the
native rollout does not depend on retiring an unrelated npm publisher.
