# IDTS-110 Task 2 report — deterministic 278-case catalog

## Scope and frozen inputs

- Worktree branch: `test/idts-110-unit-test-execution-donhv`.
- Parent/source starting head: `ab17f911b5dffefdd2610dcc716d32b8c24ea0b5`.
- Execution source baseline: `6eb6f73840d7150598a993f8656d2b44e5b0cd4b` (PR #388 merge).
- Historical 188-case catalog baseline: `bc0c47e522ae208384d4b23dda21535dcc683683`.
- Extension input: `docs/qa/idts-110-extension-cases.json` (10 retained + 80 feature rows).
- Number-map input: `docs/qa/idts-110-case-number-map.json` (compact 1..278 map).
- OfficeCLI preflight: `officecli --version` → `1.0.147`; OfficeCLI does not author repository Markdown or JSON, so native repository scripts and `apply_patch` were used.

No product source, workbook/template, result record, evidence directory, dependency, runtime, BTP/HANA, Drive, Jira, email, or other external state was changed.

## RED → GREEN evidence

### RED

Before changing the canonical generator, running:

```text
node scripts/qa/test-idts110-extended-catalog.js
```

failed with exit `1` at the expected count assertion: the generated catalog had `188` rows instead of `278`.

After the first extended generation, the existing Task 1 manifest test exposed the expected old-catalog assumption (`188` versus `278`), and the gap contract exposed the same assumption while calculating the final proposal count. Both were corrected to use the explicit 188-row historical boundary.

### GREEN

The canonical generator now accepts `--extended --source-baseline=<exact 40-character SHA>`, consumes the approved extension in retained-then-feature order, and emits only fresh `NOT_RUN` execution state for all appended rows. The first 188 definitions remain untouched and the generated output is reproducible with `--check`.

```text
node scripts/qa/generate-idts110-unit-test-catalog.js --extended --source-baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b
Wrote docs\\qa\\idts-110-unit-test-catalog.json with 278 NOT_RUN cases.

node scripts/qa/test-idts110-extended-catalog.js
IDTS-110 extended catalog PASS: 188 existing + 10 retained + 80 feature = 278 NOT_RUN cases.
```

## Verification checks

| Check | Result |
| --- | --- |
| `node scripts/qa/generate-idts110-unit-test-catalog.js --check` | PASS; 278 `NOT_RUN` cases; source traces resolved. |
| `node scripts/qa/generate-idts110-unit-test-catalog.js --extended --source-baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --check` | PASS; deterministic extended output. |
| `node scripts/qa/generate-idts110-extension.js --check` | PASS; Task 1 extension/map/approval artifacts remain reproducible from the first 188 catalog rows. |
| `node scripts/qa/test-idts110-extension-manifest.js` | PASS; 10 retained, 80 feature, 90 total; compact 278-entry map; adapters 11/33/1. |
| `node scripts/qa/test-idts110-extended-catalog.js` | PASS; metadata, map, boundaries, first-188 definition hash, and 90 appended `NOT_RUN` rows. |
| `node scripts/qa/test-idts110-catalog-gap.js` | PASS; 7 KEEP, 3 REWRITE, 3 MERGE, 2 DROP, 10 retained, 80 feature, 278 final proposal count. |
| `node --check` on changed JavaScript files | PASS. |
| `git diff --check` | PASS. |
| `node scripts/qa/secret-scan.js` | PASS; no credential-like key patterns found. |
| `node scripts/qa/check-agent-rules.js` | PASS; 8 required rules. |

## Review checkpoint

- Catalog count is exactly `278`; `catalog.summary.execution` is `NOT_RUN: 278`.
- The first 188 case definitions are byte-stable after JSON serialization: SHA-256 of `JSON.stringify(cases.slice(0, 188))` is `d63468390bad54ae9e6af97a7a847937d5981b48e2ad0944273e0a8005fe4484`, matching the frozen 188-case catalog.
- Compact boundaries are `UT-SEC-008` at catalog index 188 / mentor case 188, `IDTS110-P189` at mentor 189, `IDTS110-P203` at mentor 198, `IDTS110-F204` at mentor 199, and `IDTS110-F253` at mentor 278.
- Catalog metadata records `sourceBaselineSha`, `historicalCatalogBaselineSha`, `approvalReference`, `mentorNumbering: SEQUENTIAL_ONLY`, `existingCaseOrder`, and the exact 188/10/80/278 extension summary.
- The number map is contiguous and bijective across all 278 catalog keys; appended source proposal sequences remain repository-only metadata. `F242` is absent.
- No execution/result/evidence data was read or imported. The 90 appended rows have `candidateStatus: NOT_RUN`, `reviewStatus: PENDING_DONHV_REVIEW`, and the unchanged execution object shape with null executor/timestamps/baselines/results and empty evidence IDs.

## Self-review and concerns

- The Task 1 extension generator was made compatible with the extended catalog by explicitly reading only its first 188 rows for extension/map regeneration; this prevents the Task 1 artifact check from duplicating the 90 appended rows.
- The gap contract now reads `catalog.existingCaseOrder.length` for its historical 188-row arithmetic; its approved source/gap inputs and 278 proposal assertions remain unchanged.
- `IDTS110-P191` still points to the planned `scripts/qa/test-user-admin-role-contract.js`, which is intentionally not created in this catalog task.
- This task defines catalog candidates only. No new case has an actual result or PASS claim; execution and DonHV result review remain pending for the next tasks.
