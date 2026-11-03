# Read-only live browser verification

This isolated package verifies real HTTPS sites with Playwright 1.64.1 and
@axe-core/playwright 4.11.1 under Node 24.19.0. It contains no Cloudflare/npm
publication code, credentials or workspace-specific imports.

Copy this directory to `tools/live-site-browser/` (excluding `node_modules/`)
and the supplied workflow to `.github/workflows/live-browser-verification.yml`
on the coordinator-owned `ops/live-site-verification` branch. A push starts only
this bounded verification matrix; maximum two browser jobs run concurrently.
Root owns branch publication, trigger timing, deployment and target-map selection.
Use `SITE_TARGET_MAP` or the workflow input to select only a checked-in map:

- `jekyll-stage`: two genuine-release workers.dev hosts, root, preview and both
  corresponding static versioned-documentation namespaces.
- `jekyll-stage-root-preview`: the same hosts, root and preview only.
- `jekyll-canonical`: the two final Jekyll custom domains, all four namespaces.

The maps pin the published main source commits and reviewed source ZIP SHA-256.
Changing a URL or source pin requires changing the reviewed map; arbitrary URL
inputs are not accepted. `node run.mjs --validate-only` performs no HTTP request.

Every namespace runs all 50 canonical recipes with and without JavaScript,
checking exact heading/summary, one main/h1, 320px document reflow, and local
asset/page failures. Deep cases preserve contact validation/error focus, native
keyboard auth validation and secret clearing, three dashboard fixture/state
contracts, scoped bulk confirmation, Escape focus, retained dirty drafts,
blocked conflicting commands, explicit save/discard, and no-JS data/fallbacks.
Contact's axe scan rejects violations and records incomplete checks separately.
Five representative routes additionally test measured 200% root-font text
resize, half-width viewport reflow, wide layout and emulated print visibility.
Those methods are not native browser UI zoom or physical print certification.

Navigation, font loading, axe, scenario and overall engine execution have
explicit deadlines. Timeouts fail nonzero. Progress identifies each family,
namespace, route and operation. Firefox no-JS routing still runs every assertion;
it avoids awaiting document.fonts.ready in that known nonsettling browser state.
Source proof is verified before and after a host so deployment changes cannot
silently receive the same acceptance. Proofs must explicitly disable advanced
archive serving; their binding claim does not itself prove administrator
immutability or runtime IAM. No write probes are performed.

Results are JSON artifacts. Manual assistive technology, visual equivalence,
RTL/localization, sustained use and physical print remain unassessed.
