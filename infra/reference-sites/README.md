# Independent static reference delivery

This shared adapter serves the independently built Astro, React and Jekyll
reference assets for both design families. It does not build a competing archive
service or host framework implementation sources. Each output remains owned by
its standalone repository. All three use native Cloudflare static assets
without user Worker JavaScript or runtime bindings in the current rollout plan.
The retained legacy adapter uses only an `ASSETS` binding. No account token, R2 writer, catalog
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


The historical copied component-directory SPA has an explicit compatibility
option, `createReferenceWorker({legacyQueryReference:true})`. It redirects root
aliases to its colocated `/reference/` frontend and preserves query values.
That option remains tested for the historical artifact. The standalone React
reference instead opens the 50-example gallery and static documentation; it has
no copied `/reference/` SPA. Its current plan therefore sets the option false.
`/examples/reference/` is the Shoreline protocol example, not a substitute SPA.
No hostname inference or extra runtime binding is needed. The top-level
`assetsRunWorkerFirst` and `allowedRuntimeBindings` fields describe the retained
optional adapter profile, which requires `assets.run_worker_first:true` when
selected; native entries declare their own empty binding lists.


The deployment plan records native-platform mode for all six references.
Actual binding readback must distinguish an
empty native list from an explicit ASSETS binding; neither proves the other.
The factory's default-false adapter remains a tested alternative if a static
framework later needs custom delivery. Platform HTTP behavior and each staged
Workers.dev URL must be verified before canonical-domain adoption, and the
native rollout does not depend on retiring an unrelated npm publisher.
