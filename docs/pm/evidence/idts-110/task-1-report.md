# IDTS-110 Task 1 report — extension manifest and compact number map

## Scope and baseline

- Worktree branch: `test/idts-110-unit-test-execution-donhv`.
- Parent/source starting head: `c0e2e8aff766b290a6ccdb3cce0d6ce60f78db48`.
- Execution source baseline recorded in the generated artifacts: `6eb6f73840d7150598a993f8656d2b44e5b0cd4b` (PR #388 merge).
- Historical gap-package base: `9d5aad699662bde65a747de4c0d631678de639e4`.
- Historical 188-case catalog baseline: `bc0c47e522ae208384d4b23dda21535dcc683683`.
- OfficeCLI preflight: `officecli --version` → `1.0.147` (read-only Markdown/JSON work; no workbook operation).

## RED → GREEN evidence

### RED

Before regeneration, the three stalled generated inputs were moved to a named recoverable temporary folder and restored unchanged afterward. Running:

```text
node scripts/qa/test-idts110-extension-manifest.js
```

failed with exit `1` because `docs/qa/idts-110-extension-cases.json` did not exist (`ENOENT`).

### GREEN

The deterministic `scripts/qa/generate-idts110-extension.js` reads the approved catalog, matrix, and feature inventory, validates source traces, derives the 90 rows, and writes the extension, map, and approval receipt. It supports `--check` for no-write reproducibility.

```text
node scripts/qa/generate-idts110-extension.js
IDTS-110 extension generated: 10 retained, 80 feature, 90 total; map 278; adapters 11/33/1.

node scripts/qa/test-idts110-extension-manifest.js
IDTS-110 extension manifest PASS: 10 retained, 80 feature, 90 total; compact 278-entry map; adapters 11/33/1.
```

The contract validates the exact retained/inventory order, contiguous and bijective mentor map `1..278`, source paths and symbols, required definition fields, planned assertion IDs, `NOT_RUN` execution truth, visual-case evidence boundary, corrected adapter ledger, and DonHV approval receipt. `node scripts/qa/generate-idts110-extension.js --check` passes after generation.

## Counts and status truth

| Item | Count/result |
| --- | ---: |
| Existing catalog rows represented in the map | 188 |
| Retained Task 2 rows | 10 |
| Task 3 feature rows | 80 |
| New extension rows | 90 |
| Compact map entries | 278 |
| New-row candidate status | 90 `NOT_RUN` |
| New-row review status | 90 `PENDING_DONHV_REVIEW` |
| Adapter ledger | 11 `EXISTING_EXACT`, 33 `ADD_TO_EXISTING`, 1 `NEW_ROLE_RUNNER` |
| Approval result pre-approved | `false` |

## Boundaries and concerns

- `IDTS110-P191` intentionally points to the not-yet-created `scripts/qa/test-user-admin-role-contract.js`; it is the single `NEW_ROLE_RUNNER` entry for the next execution task.
- The 188-case canonical catalog, product source, workbook/template, dependencies, runtime data, BTP/HANA, Drive, Jira, email, and other external state were not changed.
- This package defines execution candidates only. No new case has an actual result or PASS claim; DonHV result review remains pending.

## Coverage uniqueness fix — review round 1

- RED contract added: every new definition must contain unique `coverage` tags.
- RED result before regeneration: `node scripts/qa/test-idts110-extension-manifest.js` exited `1` at `IDTS110-P191 duplicate coverage tag` (`2 !== 3`). A focused count identified 63 affected rows caused by repeated `ROLE` tags.
- Fix: the generator now applies one order-preserving `unique` helper to retained and feature coverage arrays, including P191’s policy values. No source trace symbol or adapter mapping was changed.
- GREEN results after regeneration: `node scripts/qa/generate-idts110-extension.js --check` passed; manifest contract passed; both generator/test files passed `node --check`; secret scan passed; staged diff check passed.
- Coverage result: all 90 new definitions now have unique coverage tags while retaining deterministic source order.
