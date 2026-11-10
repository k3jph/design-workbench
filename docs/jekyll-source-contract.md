# Standalone Jekyll source contract

Each family owns a standalone Jekyll repository, a 50-page canonical catalog, dashboard applications and a scientific workspace. Jekyll 2.0.0 is a Git/source release, not an invented npm package. The attached distribution record identifies its release, immutable source commit and source ZIP digest. Inspect the recorded verification method before describing artifact evidence.

The repository's Gemfile.lock pins Ruby/Jekyll dependencies. Follow its README: install the locked bundle and run `bundle exec jekyll build`; repeat with `--baseurl /preview` to exercise subpath assets and links. Its Node tooling synchronizes the exact Core 3 dependency into checked-in CSS and font assets. End-user Jekyll builds consume those assets; Node is needed when maintaining or updating them.

Core owns the canonical family stylesheet and fonts. Astro and Jekyll consume identical family CSS; their markup and controllers remain native to each framework. Use the repository's styles:sync and styles:check scripts when updating Core. Do not edit generated assets or add local style overrides to reproduce a shared rule. Core 3 replaces the canonical reference.css name with martlet.css or krigsvold.css. The source manifest records the Core version, dependency source and file hashes.

Preserve the canonical content, representative data, form/navigation/dashboard behavior and browser checks. React props, state and focus controllers are not Jekyll APIs. The host owns validation, routing, persistence and service integration. Example operations use local synthetic data.

Automated Chromium, Firefox and WebKit checks cover exercised states and root/subpath builds. Manual assistive technology, localization/RTL and sustained consumer use remain separate evidence.
