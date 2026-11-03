# Nightjar V evidence

All live-suite JSON records use actual Cloudflare R2 via the test-only S3 binding transport described in the parent report. Operation status 412 is a rejected precondition, not a test failure. Baseline malformed-metadata acceptance is explicitly characterized as a defect; `fixed-live-results.json` records its correction. Test-only failure injection occurs after durable storage acknowledgement and throws locally to simulate a lost acknowledgement. Native stream interruption is recorded separately.

No credential values or temporary credential responses are included. Run prefixes and nonsecret resource/source identifiers are retained for auditability. Disposable objects were subsequently removed; these records preserve their observed results, not permanent archive publications.
