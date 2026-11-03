# Standalone React reference composer

`compose.mjs` produces the shared component-reference application for both families while consuming only reviewed standalone React archives and genuine registry Core fonts. It never publishes packages, modifies source repositories or production locks, or deploys infrastructure.

Create an isolated npm consumer with React 19.3.1, react-dom 19.3.1, Vite 8.3.5, the exact reviewed React tarballs, and the exact public Core versions. Install with scripts disabled. Its Core lock entries must retain actual registry URLs and independently verified registry integrity. Temporary candidate tarball entries belong only in this scratch consumer, not production lockfiles. A previously verified lock and npm's content-addressed cache may be used with `npm ci --offline` during network outages; Core must still retain registry provenance.

Run:

    node infra/reference-sites/react-composition/compose.mjs --repo /path/to/design-workbench --consumer /path/to/isolated-consumer --inputs /path/to/inputs.json --out /path/to/output --source-ref FULL_COMMIT

All archive paths in the input manifest are relative to that manifest. `--source-ref` selects an immutable local Git commit; the script freezes the canonical docs application, language guidance and component contracts from that commit. Both implementations must match the version declared by that canonical application. It verifies archive SHA-256, installed JS/CSS/declaration/manifest bytes, genuine Core lock version/integrity, module graph ownership and both agent archives. Root and preview builds mount at `/reference/` and `/preview/reference/` respectively.

Without an independently verified public-source receipt, output provenance explicitly records `commit:null` and `publicSourceVerified:false`; it does not claim an unpublished local commit is publicly reachable. When connector publication changes commit metadata while preserving the exact Git tree, provide `publicSourceProof` with `localCommit`, `localTree`, `publicCommit`, `publicTree` and `readBackVerified:true`, derived from actual API readback. Both tree IDs must equal the frozen source tree.

React registry publication remains pending by default. An optional per-family `registryProof` requires genuine independent registry and provenance verification, the exact reviewed SHA-256 and actual attested source commit before enabling a published installation claim. Never manufacture these receipts from this build alone.

Agent artifacts are verified byte-for-byte. Mark them `final:true` only after the existing agent-package checks validate source-qualified archives. Candidate handoff artifacts can be used for review with `final:false`; replace them before rollout.

The coordinator's static delivery adapter is separate: enable its legacy-root-reference behavior only for React. Copy each family output's `root` directory into the final site's `reference/`, and `preview` into `preview/reference/`. The native 50-recipe gallery remains at `/examples/` and `/preview/examples/`, linked by the shared reference navigation. Preserve all query parameters when forwarding historical root queries.


The shared canonical HTML includes a meaningful non-JavaScript fallback and a
relative link to the native50-recipe gallery. No isolated HTML patch or duplicate
component implementation is needed. JavaScript-off readers are not promised
interactive component behavior. Current canonical production routing selects
React's component directory at every root/index alias through the separately
reviewed build-time adapter option.
