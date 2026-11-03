# Nightjar V — live Cloudflare R2 archive validation

This report records nonproduction Cloudflare testing on 2026-11-02. It is evidence accompanying the existing Nightjar archive candidates, not a replacement architecture or an authorization to deploy. No production archives, tags, releases, npm publications, merges or site deployments were created.

## Resources and effective authority

| Resource | Identifier / configuration |
| --- | --- |
| Cloudflare account | `f6142510bef6212dfa78bc6932acc80f` |
| New bucket | `nightjar-archive-sandbox` |
| Bucket identifier | `7777497ea52f4117be449baed8201c5f` |
| Creation time | `2026-11-02T22:49:53.819Z` |
| Storage / placement | Standard; no location hint supplied; Cloudflare selected ENAM, default jurisdiction |
| Public access | Managed r2.dev access disabled; no custom domains |
| Retention | No lock rules; no immutability claim |
| Disposable run prefix | `nv-b261923f3da7/` |

The existing configured account API token was verified active through the account-token verification endpoint. User-token verification returned 401 because it is an account token. Effective access was demonstrated by bucket creation and object operations, not inferred solely from a token label. Its permissions include R2 storage write, Workers script write and account API token write, and extend beyond the sandbox. It must not become the production gateway credential. Token values, token identifiers and temporary credential material are omitted.

Short-lived (1,800-second), bucket-and-prefix-scoped `object-read-write` S3 credentials were issued through the existing token. Writes outside each allowed prefix returned 403. No additional maintainer credentials were required. Temporary secrets remained in process memory.

## Execution method and limitations

The six existing gateway implementations and their catalog/promotion modules were imported unchanged for baseline testing. Requests entered each gateway's existing `fetch` handler locally. A test-only R2Bucket transport sent real signed S3 requests to Cloudflare, forwarded the gateway's conditional headers and mapped S3 HTTP 412 to the binding's failed-condition `null` result. There was no storage emulator in these live tests. All files were deterministic, disposable fixtures; the three files included a noindex HTML page, JavaScript and CSS. Jekyll used its actual checked-in legacy shell CSS and provenance, with `core:null` and git implementation authority.

Astro/React used their existing producer client. Jekyll has no corresponding client module: its existing gateway and Jekyll manifest contract were tested using the same generic Astro client orchestration with only the contract import redirected to Jekyll. This is test orchestration, not a new shipped Jekyll client. Initial Jekyll attempts failed at the nonexistent client import before gateway tests; corrected runs used a fresh prefix.

Wrangler remote-binding preview sessions authenticated but their upstream transport returned 400 and binding calls returned 500. They were disposed and are **not** counted as successful Worker-runtime tests. No permanent validator Worker exists (deployment lookup returned 404). Live Worker binding execution, Worker-only IAM and production routing remain unverified. Miniflare and local handler execution do not establish those guarantees.

## Exact behavioral tests

The baseline completed 79 cases across six gateways (including explicit characterizations of metadata acceptance and security limitations). The corrected gateways added 32 invalid-metadata rejections and four successful complete publications. Twenty-four independent management-API reads matched S3-written manifests and files byte for byte. The accompanying JSON records contain source commits, object namespaces, assertions, observed statuses and per-case timings. Both design families' Astro, React and Jekyll candidates were exercised.

| Test | Required and observed behavior |
| --- | --- |
| Native concurrent create-only PUT | Four contenders: one 200, three 412; exact winning bytes retained |
| Native concurrent compare-and-swap | Four contenders sharing one parent ETag: one 200, three 412; exact winning bytes retained |
| Scoped credential boundary | Outside-prefix write rejected with 403 |
| Native interrupted upload | Abort after 65,536 of 1,048,576 bytes: GET 404; full create-only retry 200 and exact SHA-256 verified |
| Unauthorized gateway write | 401 |
| Incomplete file set | Manifest commit 409; public snapshot 404 |
| Idempotent upload retry | Identical files reused; complete manifest and every file verified |
| Committed version overwrite | 409; original bytes retained |
| Lost file-upload acknowledgement | Failure injected after a real durable PUT; incomplete version remained private; retry completed safely |
| Catalog/promotion | Genesis, next content-addressed history and promotion pointers verified; historical versions still readable |
| Lost promotion-history acknowledgement | Failure after durable write; retry recovered without changing committed history |
| Competing catalog publication | One 201 and one 409 from a common parent |
| Lost catalog-pointer acknowledgement | Failure after real CAS; withdrawn selected version failed closed with 503; retry reported recovery |
| Explicit rollback | Previous version selected; both committed archives and previous promotion history retained |
| Corrupt manifest digest | 400 |
| Privileged file corruption | Gateway returned 503 and client verification rejected; exact fixture bytes then restored |
| Conflicting same-version publications | Exactly one client completed; losing retries could not replace winning manifest |
| Privileged head rewind | Old valid anchored history accepted by anchor-only verifier; demonstrates need for independent current-head checkpoint; pointer restored |
| ABA pointer replay | A→B→A restored ETag; stale If-Match accepted; ETag is not a monotonic revision |
| Privileged overwrite/deletion | Scoped object-write credential could overwrite and delete directly; storage is not immutable against it |

The interrupted stream retry SHA-256 was `9110073e562ad3c7bba0f03d7ec3881bd05cb4e13bb7fab6a63e704f3c80e08c`. This is single-object PUT testing, not a multipart-upload test; the current gateway caps files at 16 MiB.

## Contract correction

Baseline Astro/React gateways accepted a manifest missing fixture provenance, toolchain and creation metadata (201), although their producer contract requires it. Both Jekyll gateways already reject this omission. Four small corrections align the existing gateways with their producer contract. They validate fixture source/workbench commit, pinned Node toolchain and canonical ISO creation timestamp before committing a manifest. No schema version, namespace, storage algorithm, browser assertion, release identity or publication/deployment gate changed.

Each corrected gateway rejected eight malformed metadata cases with 400 and left the snapshot unserved (404), then accepted a valid manifest (201) with all three file digests verified against actual R2. All local suites passed: 49 tests per Astro implementation and 38 per React implementation. All four pinned Miniflare smoke suites passed.

## Miniflare versus Cloudflare

Miniflare 4.20260730.0 and native R2 S3 agreed on a single create-only/CAS winner. Miniflare's binding returns null on a failed condition; S3 returns 412, explicitly translated by the test transport. Small single-PUT ETags matched MD5 in both; they are opaque concurrency tokens, not the archive SHA-256 integrity evidence. Existing unit doubles use SHA-256 ETags, so those tests alone cannot establish production ETag behavior.

The Cloudflare **management object REST endpoint ignored `If-None-Match:*`** and overwrote the disposable probe object with 200. Native S3 honored the same conditional intent with 412. No management-REST conditional adapter was introduced into the archive design. Miniflare cannot prove real account IAM, private bucket configuration, retention or administrator resistance. Node's external Miniflare bridge also required plain conditional objects rather than Node Headers; that bridge serialization limitation is distinct from Worker-native Headers handling.

## Security guarantees and production gates

The gateway verifies authorization, complete-file manifests, SHA-256 integrity, create-only version files and conditional pointer advancement. It rejects observed corruption rather than silently serving it. Content-addressed history preserves prior gateway publications. These are protocol guarantees when all writes follow the gateway.

Cloudflare enforced tested S3 preconditions and temporary credential prefixes. It did **not** prevent an authorized object writer from omitting preconditions, rewriting objects or deleting them. The broad account administrator can bypass the gateway. No WORM/administrator-proof retention guarantee was established. Private bucket access is not equivalent to Worker-only write isolation.

Before production approval:

- Validate the actual deployed Worker binding, route handling, authentication and resource/subrequest limits with production-equivalent nonproduction configuration.
- Establish least-privilege Worker-only write isolation, separate reader/admin authority, credential rotation and incident procedures; avoid broad account tokens in runtime.
- Maintain independently trusted current manifest/catalog/promotion head checkpoints and signed provenance outside the mutable R2 authority. A historical anchor alone permits valid-history rewind, and ETag CAS cannot detect ABA replay.
- Decide and verify independent retention/backups and administrator threat controls. Existing unlocked R2 history is not sufficient evidence of immutable retention.
- Exercise larger archives, multipart handling if introduced, concurrent load, operational recovery and public-serving cache behavior before rollout.
- Retain all reviewed publication, deployment and authority-cutover gates. These drafts grant no production release authority.

## Source and correction provenance

Each code draft is stacked on its existing reviewed archive/integration branch. Ancestors remain intact; these are not direct-main integration PRs. Jekyll required no code correction for the metadata defect.

| Repository | Baseline source commit | Corrected commit | Draft PR |
| --- | --- | --- | --- |
| martletdesign/astro | `408907b0057ee236fdfb4817c48bfd8cbf92f3fd` | `bbc009169976115ff3c8e102eca8a74950bad3ed` | https://github.com/martletdesign/astro/pull/19 |
| martletdesign/react | `8d99ea4f1e02efee4b4241ad74d18ac1b7eb93e9` | `dfc75923c281cfffb623500594babdb6baf8a012` | https://github.com/martletdesign/react/pull/10 |
| krigsvolddesign/astro | `2d3adcdba60c3966c48d6b2642b3ccf4afc627a9` | `4c3361a6df683b408a33fd02dae8d017123c8608` | https://github.com/krigsvolddesign/astro/pull/19 |
| krigsvolddesign/react | `8b00cfbdcaee24d86a7d0414dabe2e1734024de0` | `a3b657bfddf019ffffeba8248b5636c3a690fe92` | https://github.com/krigsvolddesign/react/pull/10 |
| martletdesign/jekyll | `cb0abc2ba62736f12346893648f4cb92211b0f7b` | Unchanged | Existing archive candidate #7 |
| krigsvolddesign/jekyll | `859a12bffb3a02ce07a3b03b41a4853a98d9ee18` | Unchanged | Existing archive candidate #7 |

See [curated evidence](nightjar-v-evidence/README.md). Source hashes and exact object-operation statuses are included in each live result. The four correction commits touch only the gateway metadata boundary, test/smoke fixtures and their Nightjar V note. Publication/deployment configuration is unchanged.

“Historical version preservation” here means the archive protocol's distinct version keys and content-addressed catalog/promotion history. It does not mean R2 bucket object-versioning or administrator-proof retention. The corruption tests demonstrate detection and fail-closed serving, not autonomous recovery from an administrator destroying all trusted copies.

## Cleanup and infrastructure safety

Cleanup deleted **218 disposable objects** under the guarded `nv-b261923f3da7/` prefix. A subsequent full bucket listing returned zero objects. The bucket remains provisioned, private and empty; r2.dev access remains disabled. Temporary credentials expire automatically after 1,800 seconds and were not persisted. No other bucket was written or changed.

Production Worker deployments were unchanged before and after testing:

- `martlettheme`: deployment `34090854-95ee-49fa-8c5f-e00141b7d0c6`, version `e86442c3-905b-4c24-af1f-2073ee23786b` at 100%.
- `krigsvoldtheme`: deployment `704f8d02-041f-4306-9617-e92285eb3693`, version `aeead116-1705-489a-b5e4-0fc71a8c86a1` at 100%.

No permanent sandbox validator Worker was deployed. No public endpoint, custom domain, production archive, package publication, release, merge or website deployment was created.

## Draft review and hosted verification

All four code candidates are draft PRs; none was merged. Each branch was pushed once. PRs were submitted in successive cohorts, waiting for the previous repository's checks before opening the next. No workflow dispatches or matrix reruns were issued. The preserved CI concurrency/cancellation and publication gates remain in force.

Martlet Astro's 16 checks, Martlet React's 21 checks and Krigsvold Astro's 15 checks completed successfully at the exact correction heads before the next cohort was submitted. Krigsvold React's hosted follow-up is available on [PR #10](https://github.com/krigsvolddesign/react/pull/10/checks), tied to `a3b657bfddf019ffffeba8248b5636c3a690fe92`. Its local suite, pinned emulator and actual-R2 correction verification had already passed before submission. Hosted check status does not substitute for live-R2 or live-Worker-binding evidence.

The production-readiness requirements above remain blockers to production approval. These drafts can be reviewed as nonproduction validation and narrowly scoped contract corrections; they do not authorize release, deployment or integration merges.
