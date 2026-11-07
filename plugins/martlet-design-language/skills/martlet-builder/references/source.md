# Source and framework support

Canonical guidance: https://github.com/martlettheme/npm/tree/0ee1de92350aa3c1f6c4abacc253a0a0e02fab1b. The bundled grammar and source decisions are exact copies of that revision; implementation.json records framework availability. Grammar 0.3 remains experimental.

Current publication is recorded separately in docs/distribution.json and the connected MCP manifest: Core 2.2.4, Astro 2.0.1 and React 0.2.1 are published from the independent design-family repositories. The canonical grammar/source/implementation files above remain exact historical snapshots; their embedded version and maturity records describe that revision. Read react-setup.md and astro.md for current installation, Core dependencies and framework APIs. Legacy React 0.1.0 retains its tested theme 2.1.0 dependency; do not transfer that instruction to the independent 0.2 line. Shared grammar does not imply shared props or event/focus APIs.

The hosted read-only endpoint is https://martletdesign.dev/mcp when available. The skill directory contains instructions and references only. The optional full agent archive contains a stdio server for offline/local transport; installing the skill does not install that server or create a remote connection. Check manifest family, sourceCommit and sourceDigest. Manual accessibility, localization/RTL and sustained use remain open.
