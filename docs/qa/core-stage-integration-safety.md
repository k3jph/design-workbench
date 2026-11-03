# Core staged release: integration safety follow-up

Preparation only. The maintainer reports both bootstrap sentinels were staged and both GitHub environments configured. The public registry independently returns the `0.0.0-stage` stub for each package; the staged queue, sentinel IDs and environment protections have not been independently inspected. The public stub is tagged `latest` by npm; this is not the intended release. Never approve a sentinel.

## Candidate trees and verification

| Repository | Complete draft against main | Head | Safeguard follow-up | Reviewed archive SHA-256 |
| --- | --- | --- | --- | --- |
| Martlet | [#13](https://github.com/martletdesign/core/pull/13) | `8bbc9493c7b580577595f3f3192d49d378dcb620` | [#12](https://github.com/martletdesign/core/pull/12), based on #11 | `1395eb206514b54500e4a098b1aafe59492c516c301a7e8c81a18672f6f4ce42` |
| Krigsvold | [#14](https://github.com/krigsvolddesign/core/pull/14) | `d03154614f8308b7485daa4a8126b2fccc29a3c4` | [#13](https://github.com/krigsvolddesign/core/pull/13), based on #12 | `c2088b2585e913c11f74a045805bcef186e8e830f5c626e46c0c299e6a6eb7c4` |

Both complete candidates retain the literal false guard on staged publication, add a literal false guard on the existing release-event direct-publish job, pin the reviewed archive digest, and do not alter package payloads. Offline install and builds passed; Martlet passed 15 tests and Krigsvold passed 16. An independent git-archive/pack of each proposed tree using npm 11.15.0 reproduced the listed hashes. The hosted combined-PR verification succeeded for [Martlet](https://github.com/martletdesign/core/actions/runs/41271964551) and [Krigsvold](https://github.com/krigsvolddesign/core/actions/runs/41271965140). These results do not exercise OIDC, environment approval or npm staging.

## Controls and integration gate

Current main in each repository still contains a release-triggered direct `npm publish` job; no release should be created. A guard in an unmerged PR is not a production control, and a workflow guard cannot prevent other publishers or tokens. Review both complete candidate diffs, branch/ruleset protections and all npm publishing credentials and trusted publishers before any later integration. Subject to a separate integration decision, land each complete candidate atomically onto its main so the disabled staged workflow and direct-publish guard arrive together. Preserve and review the original stacked PRs; do not sequentially land their intermediate trees and mistake those for the protected state. No merge or activation is authorized by this note.

An administrator must independently verify each existing `core-stage-review` environment: required reviewers are named and available, self-review is prevented, administrator bypass is disallowed where supported, deployment branches restrict to main, and the repository plan actually enforces these features. Also audit protection of main, workflow edits, environment configuration and GitHub Actions execution permissions. This session's GitHub connector rejects the environment API endpoint, and the shell GitHub session is unauthenticated, so configuration and enforcement remain unverified. An admin can inspect Settings → Environments → `core-stage-review` and, where authorized, `gh api repos/OWNER/core/environments/core-stage-review` and the environment's deployment branch policies. Record evidence without exporting secrets. A missing or recreated environment must not be assumed protected.

Only after separately authorized integration, independently verify main's actual tree and CI. Any activation must be a separate reviewed GitHub change removing the stage job's false guard, coupled with a decision on the guard regression test. Keep the direct-publish guard in place. Reconfirm branch SHA, package version, source state, and tarball digest before any authorized dispatch; stage review on npm with 2FA is a further independent gate. No activation or dispatch is authorized here.

## Future npm trusted-publisher configuration

Only after separate authorization, on npmjs.com open each new core package → Settings → Trusted publishing → add GitHub Actions. Configure stage-only, not direct publish or distribution-tag administration. Review other publishers and tokens separately, without changing either legacy `/theme` binding.

| Package | Organization | Repository | Workflow filename | GitHub environment |
| --- | --- | --- | --- | --- |
| `@martlet/core` | `martletdesign` | `core` | `core-stage.yml` | `core-stage-review` |
| `@krigsvold/core` | `krigsvolddesign` | `core` | `core-stage.yml` | `core-stage-review` |

Wait until the workflow file is on the approved default branch and configure close to the intended release; npm does not validate the entry when saved and unvalidated configurations expire after two days. The workflow must still remain disabled until separately authorized. Record the sentinel stage IDs from the authenticated npm Staged Packages view without approving either sentinel. The release versions remain unstaged and unpublished by this work.
