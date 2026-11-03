# Read-only CI status audit

Refresh the ledger's PR head first, then run:

```sh
node scripts/qa/nightjar-ci-status.mjs docs/qa/nightjar-iv-ledger.json OWNER/REPO PR_NUMBER
```

The script uses an already authenticated GitHub CLI with read access, compares the actual PR head to the ledger, and lists the latest observed run for each workflow on that exact head. It exits nonzero for a moved head, no runs, pending runs, skipped/failed runs, API errors, or more than 100 results. An `observed_success` result means only that all returned latest runs succeeded; it cannot prove that every required workflow was configured or triggered. Check the expected workflow list and individual jobs separately. Do not infer a production authorization from a CI result.
