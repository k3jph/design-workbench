# React publishing authority cutover

This draft removes the workbench's release-event React npm publisher. It is a
cutover proposal, not evidence that the dedicated publishers are active or
that the published packages have moved. Do not merge this draft until both
standalone repositories and their protected-tag workflows are reviewed and
independently validated, including the documentation archive gate, and the
maintainer authorizes the coordinated transition. Existing npm versions and
their provenance remain untouched.

Before cutover, `.github/workflows/publish.yml` on current main can publish
both React packages for a prerelease `react-v*` GitHub Release. Its release
event also calls the reference-archive publication and adoption workflow.
This draft removes that event trigger and the competing npm OIDC publisher as
one change. The separately invoked, opt-in `prepare-release.yml` reference
publication path and its reusable `reference-release.yml` remain present;
they can create GitHub releases and adoption pull requests and must be
reviewed independently before dispatch. They do not publish npm packages.

The reviewed transition must inventory pending releases, ensure all release
and adoption workflows are idle, verify the dedicated package identities and
proposed trust, integrate this removal with the independently authorized
standalone authority handoff, and inspect the effective workflow set on the
resulting main commit. Do not disable the current npm publisher or change
trusted publishers prematurely. Never use the workbench as a fallback
publisher after the dedicated repositories become authoritative.

If the cutover fails before an npm version is published, stop and review the
candidate workflows; do not create a tag or switch publishers automatically.
If npm publication has succeeded, verify the registry artifact and provenance
and use the dedicated repository's recovery procedure rather than republishing
or restoring a competing authority. Restoration of any legacy publisher is a
separate production change requiring maintainer authorization.
