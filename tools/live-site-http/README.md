# Read-only native Jekyll staging verification

This folder is self-contained and uses only Python's standard library. It contains no Cloudflare credentials, deployment commands, package publishing or filesystem dependencies outside this folder.

From this directory:

```sh
python3 verify-live-sites.py --state-root . --stage-ready --manifest targets.json --origin-map staged-origins.json --expectations expectations.json --output stage-http-results.json
```

The exact two authorized Workers.dev origins are hard-coded in the verifier as well as pinned in `staged-origins.json`. Expected source commits, all artifact-file hashes, metadata bytes, all four source ZIP copies, and independently verified public GitHub release asset hashes are included. `_headers` is reserved delivery configuration and is deliberately not treated as a public asset.

Checks cover root and /preview, all50 recipes in both, all50 recipes in both versioned static documentation snapshots, local links/assets/fonts/fragments, correct MIME, source metadata, complete snapshot inventories, package ZIP integrity and bounded GET/HEAD responses. No production write probe is performed.

Results explicitly report `staged-native-workers-read-only`, actual tested Workers.dev origins, and `canonicalDomainVerified:false`. A staging pass is not an eight-host or canonical-DNS pass. No administrator-immutable storage, independent anti-rollback or manual accessibility claim is made.

No workflow permissions beyond `contents:read` are needed. Normal TLS verification and proxy settings remain enabled. Default request deadline20s, response size32MiB, maximum4 requests concurrently, overall deadline1200s. Any timeout is a failure.
