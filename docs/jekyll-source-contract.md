# Standalone Jekyll source contract

Each design family owns its public standalone Jekyll repository and full 50-page
reference catalog. Jekyll is consumed as Git/source releases, not an invented npm
package. The attached current distribution record identifies the immutable source
commit and, only after independent verification, the public release tag, source
ZIP URL and SHA-256. A public source commit and a published release are distinct
facts; inspect `published` and `sourceZip.available` before claiming release availability.

The standalone repository's Gemfile.lock pins Ruby/Jekyll dependencies. Follow its
README: install the locked bundle and run `bundle exec jekyll build`; run again
with `--baseurl /preview` to exercise subpath assets and links. Preserve its 50
canonical recipes, representative data, form/navigation/dashboard behavior and
all browser/accessibility checks. Do not translate React props, state or focus
controllers into Jekyll APIs. Family composition and typography remain independent.

Jekyll's current foundation authority is its checked-in legacy theme shell CSS
and source-shell provenance, recorded in `scripts/source-shell-provenance.json`.
Its manifest has `core:null`, `implementation.kind:git`, and explicit legacyTheme
name/version/integrity/sourceShellSha256. This is not an npm Core dependency or
permission to rename or overwrite historical @martlet/theme or @krigsvold/theme.

The advanced remote archive write pathway remains disabled in production. The
working static/versioned-documentation build path can ship independently. Do not
claim administrator-proof immutability, Worker-only R2 write isolation or independent
anti-rollback checkpoints from a source ZIP or static site deployment.

Automated Chromium, Firefox and WebKit checks are evidence for the exercised
states, root/subpath builds and synthetic examples. Manual assistive technology,
localization/RTL and sustained use are not certified by these automated checks.
