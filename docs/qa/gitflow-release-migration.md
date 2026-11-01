# GitFlow and release migration: preparation record

This branch is a proposal, not a production release system. No workflow in this branch publishes. The machine-readable [pre-change inventory](gitflow-inventory.json) records branch heads and open PR relationships. `develop` was created from the inventoried `main` head for each of the 13 nonempty repositories. The four empty React and Jekyll repositories cannot have branches until an authorized source transfer creates their first commit. The two private websites are outside this migration.

Initial policy drafts, all targeting `develop`:

| Repository type | Martlet | Krigsvold |
| --- | --- | --- |
| Core | [#15](https://github.com/martletdesign/core/pull/15) | [#16](https://github.com/krigsvolddesign/core/pull/16) |
| Astro | [#7](https://github.com/martletdesign/astro/pull/7) | [#7](https://github.com/krigsvolddesign/astro/pull/7) |
| Vim | [#1](https://github.com/martletdesign/vim/pull/1) | [#1](https://github.com/krigsvolddesign/vim/pull/1) |
| Emacs | [#1](https://github.com/martletdesign/emacs/pull/1) | [#1](https://github.com/krigsvolddesign/emacs/pull/1) |
| Chrome | [#1](https://github.com/martletdesign/chrome/pull/1) | [#1](https://github.com/krigsvolddesign/chrome/pull/1) |
| Firefox | [#1](https://github.com/martletdesign/firefox/pull/1) | [#1](https://github.com/krigsvolddesign/firefox/pull/1) |

The workbench proposal is [#71](https://github.com/k3jph/design-workbench/pull/71). All 13 hosted policy checks passed at their initial reviewed commits; package and browser workflows must be checked separately for their current results. The policy is not protected against modification by a PR and must not be treated as an enforcement boundary by itself.

| Repositories | Current distribution and remaining work |
| --- | --- |
| `martletdesign/core`, `krigsvolddesign/core` | Unpublished `@*/core` candidates. Preserve private source manifests, hash-pinned packaging, and current stage-only trust. Replace the disabled release-event direct-publish path only through a reviewed, tested tag-release design; do not reuse legacy `/theme` tags. |
| `martletdesign/astro`, `krigsvolddesign/astro` | Existing npm packages; release-event workflows currently publish. Build and test a tag-triggered replacement and remove the old trigger in the same approved change. `krigsvolddesign/astro` is private; administrator must make it public as requested. |
| Both organizations' `vim`, `emacs`, `chrome`, `firefox` | Private npm manifests are build helpers, not public npm packages. Establish branch policy and retain distribution-specific packaging; do not invent npm distribution. |
| Both organizations' `react` | Empty; retain workbench candidate and publication authority pending separately authorized source transfer, validation and cutover. Do not issue a placeholder release workflow. |
| Both organizations' `jekyll` | Empty; distribution format and source transfer must be resolved before initializing repository and release mechanics. Do not invent an npm package. |
| `k3jph/design-workbench` | Preserve the frozen Nightjar integration branches and stacked PRs. Current release-triggered experimental React publication and reference adoption are independent paths; move React authority only after validated dedicated repositories exist. Its main push also invokes reference publication/adoption. |

## GitFlow controls

Use PR merge commits: `feature/*` from `develop` back to `develop`; `release/*` from `develop` to `main`, then merge the resulting main release back to `develop`; `hotfix/*` from `main` to `main`, then back to `develop`. `main` remains the default branch for integrations. Stable and prerelease production tags use `vX.Y.Z` and `vX.Y.Z-identifier` respectively; creation is restricted to authorized actors, and updates and deletions are prohibited. This branch's executable policy demonstrates permissible source names and tests an isolated feature, release and hotfix cycle. It does not itself guarantee branch provenance, required merge commits, protections or tag immutability.

An authorized administrator must configure repository/organization rulesets for main, develop and `v*`: require pull requests and CI, prohibit bypass, force pushes and tag deletion/update, restrict tag creation, require merge commits and protect the policy workflow and ruleset changes. Require an independently controlled policy check: a PR can otherwise edit a workflow or its checker to make its own check pass. A branch-name check cannot prove a branch was created from the correct base or that a release was merged back; those are additional required checks and review conditions. Validate ruleset enforcement, bypass roles and plan support in each repository. Do not claim these controls are active merely because a workflow names them.

The available GitHub connection returned an empty repository-ruleset list for both core repositories, Martlet Astro and the workbench; this does not establish the absence of inherited rules. The Krigsvold Astro ruleset endpoint returned 403 stating that the repository must be public or the account upgraded. Reading legacy branch protection returned `Resource not accessible by integration` (403). The shell GitHub session is unauthenticated. Therefore neither these protections nor the requested Astro visibility change can be administered through the available connection; an administrator must make `krigsvolddesign/astro` public and inspect and configure the controls with administration access.

The independent core type PRs and Astro core-migration PRs were retargeted to `develop` while its base matched their original main commit; their head commits were unchanged. Their historical `nightjar/*` and `migration/*` branch names still need explicit transition handling or reconstruction before branch-source enforcement. Preserve all Nightjar PR stacks, frozen commits and migration branches; do not bulk retarget them. New ordinary work should target develop.

## Release design and failure boundaries

Tag workflows are not yet implemented or authorized to run. An implementation must bind a protected, immutable new tag to the triggering commit, require it on main's first-parent production history and protected by reviewed merge policy, check package and source version consistency, distinguish a verified registry 404 from network/authentication errors, and reject existing versions. Lock dependencies, build and test; package in a disposable directory, including core's `private:false` only there. Inspect the exact archive and publish that archive once with npm OIDC and provenance. Re-fetch the registry's tarball and verify integrity and package identity before creating the matching GitHub Release. Stable tags use `latest`, prereleases `next`.

Publishing is irreversible. If registry publication succeeds but registry verification or GitHub Release creation fails, do not republish or create another tag: a separate recovery path must verify the already-published artifact and create the release only after human review. Tag protection and production approval are administrative controls, not properties established by tag syntax or a shell test. A main ancestor can be an unapproved side-branch commit, hence the first-parent requirement. Races and unexpected tag movement must fail closed.

Each npm publisher needs exact repository, workflow and environment identity; configure a separate direct-publish trusted publisher only after the new workflow is present and verified, and within npm's validation deadline. Retain existing stage-only publishers until the replacement is verified. A dry-run cannot prove OIDC, npm trust, registry publication, provenance, GitHub Release creation or an environment gate. No direct publisher or token was changed in this preparation.

## Evidence and outstanding gates

`node --test scripts/gitflow/*.test.mjs` exercises tag syntax/channel selection, version mismatches, missing or unknown registry status, unverified protection, isolated GitFlow merge history including first-parent rejection, simulated failed build/test rejection and post-publish verification failure. The registry preflight prototype fails closed for inaccessible packages, malformed responses and network errors, using injected responses in its tests. A public-registry version 404 cannot reveal a private staged version or guarantee freedom from races; npm remains the final authority on version reservation. The release rehearsal uses injected fake adapters; it does not exercise a production publisher. Separately, `npm publish --dry-run --ignore-scripts --tag next --registry=http://127.0.0.1:9` passed for each reviewed core tarball with npm 11.15.0; it warned that the deliberately unreachable local registry had no authentication. These checks do not verify OIDC or a real registry transaction. Integrating and testing preflight with an actual tag workflow, package inspection and post-publish recovery remains outstanding. No production tag, package, release, branch rule or npm trust configuration was changed by this proposal.
