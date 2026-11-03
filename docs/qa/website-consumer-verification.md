# Private website consumer verification ownership

Issue81 moves website source assertions into each authoritative private website
repository. The former public-workbench Core-site rehearsal attempted to clone
those now-private repositories with its repository-scoped GITHUB_TOKEN, failing
before any test. No broad cross-repository token is added to public CI.

The unchanged shared static HTML/link/fragment/heading/ID verifier is vendored in
each private repository with source Git-blob and SHA-256 provenance. Its former
assertions are retained: locked install and unit tests; all three browsers; builds
at root and `/preview`; browser checks for the embedded compatibility SPA and
local assets; a temporary output copy excluding that SPA for complete static
verification. Private CI additionally exercises the full consent/source-shell
suite and current independently pinned MCP/agent archive authority. The Krigsvold
proof also includes its demonstrated dark-hover contrast regression. Later source
or coverage changes require fresh verification. Original exact Chromium styling
checks remain.

All six replacement prerelease proof jobs passed before removal of the obsolete
public cross-private-checkout workflow:

- Martlet source `2ddc5674a44116287b03649180f5816e97432132`, workflow41563723221,
  Chromium/Firefox/WebKit success.
- Krigsvold source `29e00af450f4914bb35379d3d5ad1435eb15942b`, workflow41565290699,
  Chromium/Firefox/WebKit success.

[Job-level evidence](website-consumer-verification.json) records every actual job.
This proof reconstructs immutable reviewed public Astro source, verifies its exact
archive SHA-256/SHA-512, uses a temporary runner-only dependency override and
restores it on exit. No offline dependency lock is committed. It is explicitly
**prerelease consumer evidence**, not a claim that Astro2 is already published.

Final ordinary registry-backed website CI remains required after independent
Astro publication and before production adoption. New source changes require
new-head verification; these successes are not transferred to later heads. The
public shared static/recipe contracts and final live eight-host cross-browser
checks remain separate obligations. No failed assertion was skipped or waived to
retire the obsolete checkout path.
