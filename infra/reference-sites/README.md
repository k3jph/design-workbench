# Independent static reference delivery

This shared adapter serves the independently built Astro, React and Jekyll
reference assets for both design families. It does not build a competing archive
service or host framework implementation sources. Each output remains owned by
its standalone repository. Cloudflare runtime receives only an `ASSETS` binding;
no account token, R2 writer, catalog authority or publication secret is deployed.

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
