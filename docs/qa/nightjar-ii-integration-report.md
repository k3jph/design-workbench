# Nightjar II integration review — in progress

This is a review record, not authorization to merge, publish, deploy, change production controls, or extract Jekyll repositories. The frozen base is `5138a89fc2956d9019d5bd720c987b8b9e24533b` (tree `b0b513513d81106fe174b03ad1a21009a727e664`); [draft #37](https://github.com/k3jph/design-workbench/pull/37) contains the proposed integration. Its initial implementation commit is `6cba1ca29f71c44be858e9bb19ca48e566a42f69`. This document will be updated as exact-head results and remaining fixes are established. A commit cannot embed its own final hash: use the PR head for the complete candidate including this report.

## Individual review branches

The following are exact-head hosted runs observed when this record was written. Both listed workflows succeeded unless a failure is explicitly stated; a dash means the portable workflow was not triggered, not that it passed. These results do not prove the integrated tree.

| PR | Head | Workbench / portable run | Disposition |
| --- | --- | --- | --- |
| #22 | `5d28203` | `41142709611` / — | Progress ledger; reconcile into this report. |
| #23 | `a343569` | `41136267771` / — | Agent dependency and reproducible archive checks. |
| #24 | `6d0ec97` | `41136269006` / — | Publication-control proposal only. |
| #25 | `afa033b` | `41136583065` / `41136582747` | Preserve host history state. |
| #26 | `5682709` | `41136585687` / `41136585697` | Jekyll provenance and extraction readiness. |
| #27 | `0485b75` | `41136714860` / `41136714837` | Dynamic Tabs focus recovery. |
| #28 | `7178fb0` | `41137417375` / — | Worker initialization bounds; stacked on #23. |
| #29 | `c858a05` | `41139213837` / `41139213757` | Contrast evidence and actual Chromium zoom. |
| #30 | `8f6a976` | `41137956179` / `41137956098` | Scientific workspace overflow and status updates. |
| #31 | `31a572a` | `41139294083` / `41139294075` | Administration dialog race. |
| #32 | `ed186ab` | `41139367340` / `41139367376` | Article transfer assessment. |
| #33 | `4617766` | `41139614837` / `41139614869` | Astro family favicon. |
| #34 | `05d28d4` | `41141642682` / `41141642701` **failed Firefox** | Included only together with the corrective #40 stack; do not merge independently. |
| #35 | `adb9272` | `41140849634` / `41140849603` | Protect administration drafts and React field names. |
| #36 | `e765079` | `41142496477` / `41142496305` | React pagination focus in same-origin iframe; workspace-consumer test passed in all three engines. |
| #38 | diagnostic branch | pending | Firefox event-delivery investigation stacked on #34; not an integration change. |
| #39 | `e9cd8f` | pending | Prevent bulk changes from silently overwriting editor drafts; applied to the candidate and awaiting combined verification. |
| #40 | `caf8753` | `41152854132` / `41152854215` pending | Correct the Firefox popup obstruction with an associated inline custom error; stacked on #34. |
| #41 | `e37df1d` | `41153106952` / `41153106911` pending | Resolve iframe ErrorSummary targets in their own document. |

The integration applies #23 before its dependent #28, once each, and #34 together with its corrective #40 stack. #41 is also included; its hosted cross-browser verification remains pending. Overlapping dashboard, workflow and React component modifications require combined verification. #22 remains the historical progress ledger; this document consolidates it rather than suggesting that its previous baseline checks certify this candidate.

## Verification and remaining gates

At `6cba1ca`, local `npm run check`, the isolated source-archive test, Jekyll root and subpath builds with local-link verification, agent archive checks, hosted Worker checks, packed-package checks, public React consumer and component consumers in Chromium, and the 12-build administration and scientific matrices passed. The root and Astro npm lockfile audits reported zero vulnerabilities, which does not resolve repository Dependabot alerts or establish the safety of historical bundles. The public React check first failed to resolve GitHub when Node did not use the environment proxy; rerunning with `NODE_USE_ENV_PROXY=1` and the installed Chromium succeeded. Combined hosted workbench `41150654210` was cancelled after a subsequent push; portable `41150654211` is running. Further local matrices are running. The hosted results must be checked against the actual final head, including subsequent fixes. Manual assistive-technology review, physical print, and complete visual conformance are not represented as passes. There are 18 incomplete Firefox and 18 incomplete WebKit contrast results: #29 captures contexts and bounded measurements but does not turn these into passes.

At later integrated head `dbb7798`, `npm run check`, 178 local Chromium workbench browser tests, 71 Chromium Jekyll dashboard acceptance tests, and the combined 12-build administration and dashboard-initialization matrices passed. Hosted workbench `41151215981` passed Chromium, Firefox and WebKit, with publication skipped; portable `41151215866` was still running when the candidate advanced. These results predate the subsequently integrated #34/#40 and #41 changes. Exact-head checks on the complete proposed stack are required.

The original #34 hosted Firefox failure was traced in diagnostic [#38](https://github.com/k3jph/design-workbench/pull/38): headed run `41151897326` showed the native whitespace-validation popup physically covering the button after silent correction, consuming the next physical click before it reached the document. #40 reports the first custom whitespace error as an associated inline alert and preserves native reporting for ordinary constraints. The original immediate pointer retry remains asserted; product commit `775ef1d` passed the hosted Firefox and WebKit root-build form tests, and the newer head's exact-hosted and combined verification remain pending. This is not a claim that every possible native popup is unobstructed. Independent review reproduced an administration conflict where saving an old editor draft can undo a subsequent confirmed bulk status update. #39 blocks a bulk action affecting a dirty editor with save-or-discard guidance, and synchronizes a pristine editor after confirmation; its focused and combined 12-build Chromium regressions passed.

## Security, design and integration controls

The Worker guard limits initialization icon metadata; it does not demonstrate all SDK errors are bounded or update deployed Workers. Generated agent archives use Zod 4.6.7 and have local repeat-build checks, but no published archive or site was repointed. GitHub reported 65 default-branch Dependabot alerts (4 critical, 25 high, 24 moderate, 12 low); individual records require a security administrator. See [agent supply evidence](nightjar-ii-agent-supply.md) for the precise administrator query and artifact limitations. The separate [Martlet #32](https://github.com/martlettheme/martlettheme/pull/32) and [Krigsvold #31](https://github.com/krigsvoldtheme/krigsvoldtheme/pull/31) site-security drafts update Astro 5 to 7.3.3 and require Node 22.19 or later; their recorded hosted checks and Node 22.19 builds passed. A hosting administrator must separately verify Cloudflare build Node version and command, preview and production triggers, Worker routes/assets and compatibility dates before any deployment; other platforms were not established by those checks.

The [publication proposal](nightjar-ii-publication-proposal.md) is inactive. A main push can call the reference release pipeline and trigger archive upload, tag/prerelease publication, host adoption and deployment; a separate npm release path also exists. Do not merge the candidate to main until an administrator has separately authorized and independently verified fail-closed controls, including older runnable workflows, all callers, environment reviewer/bypass/ref rules, independent release paths and the treatment of internal CI artifacts. The proposal's offline graph tests are not proof of live GitHub settings. Jekyll extraction remains a plan, not an approved repository creation or transfer of source authority.

The review sequence is: resolve the blocked form and administration defects; validate the final combined tree and review its changes against the frozen baseline; separately decide publication controls and release authority; then obtain explicit human approval for integration. Keep #18/#19/#20 as historical review layers and do not merge #18 alone as a release. Future work should address unresolved contrast and manual AT, investigate React article transfer/hydration with shared behavior, finish security-admin alert triage, and complete the extraction ownership plan without weakening either design language's identity.
