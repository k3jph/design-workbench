# GitFlow and publication administrator checklist

This is a configuration proposal, not evidence of active enforcement. Preserve the original Nightjar review stacks and exempt or reconstruct historical non-GitFlow branches through a reviewed transition before requiring source-branch checks.

For each non-website repository after reviewing its existing protections and plan support:

1. Keep `main` default where npm trust and integrations require it. Protect `main` and `develop`: require pull requests, required CI, review and resolution of threads; prohibit force pushes and deletion. Prevent or tightly limit administrator bypass. Configure repository merge settings to use merge commits and verify that required checks use the correct contexts for that repository.
2. Protect `v*` tags with a ruleset that restricts creation to approved release actors and prohibits updates and deletions. Verify that it covers prerelease tags, historical tags and privileged bypass. A workflow's `github.ref_protected` value alone cannot prove all these properties.
3. Enforce that only reviewed `release/*` or `hotfix/*` PRs enter `main`; allow reviewed feature, release, hotfix and production back-merge PRs into `develop`. A PR-editable workflow or script is not an independent enforcement boundary. Require a protected ruleset-required workflow or equivalently independent check, and test attempted policy edits and bypasses. Also review branch origin and mandatory release/hotfix back-merges; branch names alone do not prove ancestry.
4. For each eventual npm release workflow, configure the named environment and its permitted tag policy without routine required reviewers: creation of the protected immutable tag on approved main history is the release authorization. Protect the environment configuration and any readiness variable against repository/organization fallback and bypass; confirm the plan enforces the settings. An additional human gate is appropriate only for a documented exceptional security reason. Do not activate publishing until the full workflow, recovery, provenance, registry integrity and protected-tag rehearsal have been reviewed.
5. Only after separate authorization configure each npm package's direct-publishing trusted publisher with its exact owner, repository, workflow filename and environment. Retain existing stage-only publishers until the replacement is verified. npm configurations may expire when not validated; coordinate timing, avoid long-lived npm tokens, and keep legacy `/theme` settings untouched.
6. `krigsvolddesign/astro` is public, as independently confirmed through GitHub. Preserve both private website repositories and do not change Cloudflare, DNS, deployment or trusted-publisher settings as part of this checklist.

For a concrete administrator configuration, create **separate active branch rulesets** targeting `refs/heads/main` and `refs/heads/develop`. On both, require a pull request with at least one independent approval, dismiss stale approvals, require resolved review threads, require the repository's actual passing CI job contexts, block force pushes and deletions, and disable bypass except for a separately reviewed break-glass policy. Enable merge commits and disable squash and rebase merges in repository settings after checking the effect on existing PRs. Set source-branch policy as a separately protected required check; do not require the current PR-editable prototype as the sole authority. Verify normal developers cannot push directly to either protected branch, modify the check, or alter the rulesets.

For tags, target `refs/tags/v*` with an update-and-deletion ruleset that has no normal release-actor bypass, and a **separate** creation-restriction ruleset whose narrowly scoped bypass permits only the approved release actor. Using one bypassable ruleset for all three operations could allow the creator to move or delete tags. Test unauthorized creation, authorized creation, attempted update and attempted deletion using disposable nonproduction refs and the actual GitHub plan; preserve existing production tags. Confirm how administrators and organization owners are treated. The final CI check must identify a protected tag and verified production commit on main's first-parent history; it cannot infer review or tag immutability from ancestry alone.

The currently active Astro release-event workflows and workbench reference/React publication paths require coordinated replacement. The core tag-release drafts are disabled, and their existing stage-only workflow is separate. Do not activate tag publication before resolving those paths and independently verifying all controls.

## Draft release identities and remaining work

| Package | Proposed repository | Proposed workflow | Proposed environment |
| --- | --- | --- | --- |
| `@martlet/core` | `martletdesign/core` | `tag-release.yml` | `core-production-release` |
| `@krigsvold/core` | `krigsvolddesign/core` | `tag-release.yml` | `core-production-release` |
| `@martlet/astro` | `martletdesign/astro` | `tag-release.yml` | `astro-production-release` |
| `@krigsvold/astro` | `krigsvolddesign/astro` | `tag-release.yml` | `astro-production-release` |

These are proposed inputs for **future** direct-publish trust; no npm configuration is made here. Separate stage-only core publishers remain in place. The drafts are [Martlet core #16](https://github.com/martletdesign/core/pull/16), [Krigsvold core #17](https://github.com/krigsvolddesign/core/pull/17), [Martlet Astro #8](https://github.com/martletdesign/astro/pull/8), and [Krigsvold Astro #8](https://github.com/krigsvolddesign/astro/pull/8). Both prerequisite CI and release jobs remain disabled. Core has a separate manual staged-publishing path; its ultimate relationship to direct tag publication remains an explicit decision. Astro drafts remove the release-event publisher in their proposed trees, but that old path remains active on current main.

Each Vim, Emacs, Chrome and Firefox repository has a disabled artifact-only proposal:

| Platform | Martlet | Krigsvold |
| --- | --- | --- |
| Vim | [#2](https://github.com/martletdesign/vim/pull/2) | [#2](https://github.com/krigsvolddesign/vim/pull/2) |
| Emacs | [#2](https://github.com/martletdesign/emacs/pull/2) | [#2](https://github.com/krigsvolddesign/emacs/pull/2) |
| Chrome | [#2](https://github.com/martletdesign/chrome/pull/2) | [#2](https://github.com/krigsvolddesign/chrome/pull/2) |
| Firefox | [#2](https://github.com/martletdesign/firefox/pull/2) | [#2](https://github.com/krigsvolddesign/firefox/pull/2) |

These do not create releases, upload to stores or sign browser extensions. Native store publication, authentication, channel policy, review and rollback are not designed or verified. Standalone React and Jekyll repositories are empty; implement their release paths only after independently validated source transfer. A complete release design must integrate versioned documentation snapshots before activating framework release publication.

## Proposed activation sequence, subject to separate approval

1. Complete and review the unresolved implementation, hosted verification, package and documentation compatibility, protected-tag enforcement, publication recovery and platform-specific release mechanisms. Resolve historical PR branch names and configure independent required checks before enforcing GitFlow.
2. An administrator verifies main and tag protections, environment rules and provider plan support. Inventory the existing npm publishers and credentials without removing any stage-only binding. Confirm every next version is absent from both the registry and staged queues and does not collide with a historical Git tag.
3. With separate integration authorization, integrate the reviewed disabled workflow and conflict removal through the approved release process. Verify the resulting main tree and rerun all required CI. A false guard is intentional; the ASTRO and core drafts each have **two** false guards, on prerequisite verification and publication.
4. Only after separate npm authorization and close to the intended first release, configure the matching direct-publishing trusted publisher from the table above. Check that its environment and workflow names match exactly. npm may expire a configuration that is not validated; a dry-run alone does not establish OIDC trust or provenance.
5. With separate activation authorization, review a change to enable both guarded jobs. Thereafter creation of a protected immutable release tag on approved main history is the intended authorization for automatic publication; no routine environment approval is required. The first tag-triggered publish is an irreversible registry mutation, not a rehearsal. Verify the published bytes, registry integrity and provenance and only then create the corresponding GitHub Release. Follow the documented recovery process if publication succeeds but later steps fail.
6. Keep stage-only publishers and legacy package identities until the new path has been independently verified and an authorized maintainer explicitly decides their future. Framework releases and any documentation archive or latest-pointer promotion require separate review and must not alter the private websites or their deployment controls.
