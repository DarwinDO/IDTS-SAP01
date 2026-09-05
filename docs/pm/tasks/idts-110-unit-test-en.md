# IDTS-110 — Unit Test EN v0.5 expansion

- Catalog owner/approver: DonHV
- Workbook generator/final integrator: DonHV
- Test executor/case-evidence owner: NhanT
- Due: 2026-08-05
- Jira: https://dutassociation.atlassian.net/browse/IDTS-110
- Status: In Progress; evidence package curated, member-owned reruns remain

## Workflow

1. DonHV owns and approves the English-only 188-case catalog.
2. NhanT executes cases and captures sanitized, case-specific evidence.
3. DonHV reviews candidate truth without rewriting execution history.
4. Only accepted results may later enter Unit Test EN v0.5.
5. DonHV alone generates and synchronizes the workbook to the existing Drive ID.

## Current catalog truth

- Catalog: `docs/qa/idts-110-unit-test-catalog.json`
- Frozen catalog baseline: `bc0c47e522ae208384d4b23dda21535dcc683683`
- Cases: 188
- Canonical execution state: 188 `NOT_RUN`
- Workbook/Drive: unchanged

## PR #269 candidate and reviewer truth

| Layer | Accepted/PASS | Held | Mapping-only | Blocked |
| --- | ---: | ---: | ---: | ---: |
| NhanT candidate | 40 | 0 | 135 | 13 |
| DonHV review | 38 | 2 | 135 | 13 |

- Held: `UT-ATT-007/008`, pending exact-head acceptance.
- Mapping-only: traceability, not execution PASS.
- Blocked: 13 member-owned BTP/HANA/XSUAA/S3/Job Scheduler integrations.
- Malformed-login sanitizer: merged separately under IDTS-39 / PR #283 at `e55a863d0cc4ada6c421ce940c1986162756c176`.

## Evidence

- `docs/pm/evidence/idts-110/execution-summary.md`
- `docs/pm/evidence/idts-110/donhv-execution-review-matrix.md`
- `docs/pm/evidence/idts-110/donhv-case-taxonomy.json`
- `docs/pm/evidence/idts-110/cases/`

No Unit Test VI is created. No command-only, script-only, generated-card-only, shared-account, or unsanitized evidence is accepted as final execution proof.

## 2026-09-04 PR #372 integration boundary

- The review index remains limited to the approved 188-case catalog and links the existing canonical case evidence instead of duplicating generated summary cards.
- Reviewer truth remains 38 accepted candidate, 2 held, 135 mapping-only, and 13 blocked. Mapping-only and blocked rows are not represented as PASS.
- The index is not the official SAP490 workbook and does not change the task's In Progress status, workbook, or Drive artifact.
- Attachment source traces now follow the current metadata-driven `@cap-js/attachments` contract through `@Validation.Maximum` and `@Core.AcceptableMediaTypes`; the removed custom UI constant is no longer referenced.

## 2026-09-04 PR #386 evidence-truth remediation

- `mappingOnlyIsAtomicExecution` remains `false`; all 135 mapped cases remain `MAPPING_ONLY_CANDIDATE`.
- The approved catalog remains 188 cases, with DonHV review truth unchanged at 38 accepted, 2 held, 135 mapping-only, and 13 blocked.
- `docs/pm/evidence/idts-110/local-primary-suite-results.json` and its runner remain unchanged from the accepted `dev` baseline; the failed fresh rerun was not committed as new evidence.
- DonHV did not approve the proposed 15-case expansion. It contained existing-case overlap and requirements that do not yet define User Administration catalog CRUD or the proposed operational calculations.
- Any future expansion must be handled separately with an exact gap matrix against the 188 cases, a source-backed implemented behavior, a valid approved requirement, the complete role/capability boundary, and an atomic test/evidence plan.

## 2026-09-04 local-primary harness repair

- DonHV repaired the existing test harness on behalf of NhanT without changing product source, persistence, dependencies, or the approved 188-case catalog.
- The affected suites now identify seeded users by exact fixture email instead of mutable display name, and assignment fixtures include the active identity-access state required by the current authorization contract.
- The runner now executes every declared script independently; previously, additional script names in the Bug and Lifecycle mappings were passed as command-line arguments to only the first script.
- The resubmit notification assertion now uses the current `RESUBMITTED` event type.
- Fresh evidence at final source commit `f468aa7605e86025a6d7de3e3bea4b09b2234e48` reports 135 mapping-only candidates and 0 failed mappings. Its command pins and verifies that source SHA before writing evidence. This remains suite-to-case traceability, not 135 atomic case PASS results.
- The accepted reviewer truth remains 38 accepted, 2 held, 135 mapping-only, and 13 blocked. The rejected 15-case expansion is not restored.

## 2026-09-05 — Task 4 catalog-gap approval package

- The deterministic approval report is `docs/pm/evidence/idts-110/catalog-gap-review.md`, generated from the frozen proposal input, Task 2 matrix, and Task 3 feature inventory.
- Task 2 disposition truth is `KEEP=7`, `REWRITE=3`, `MERGE=3`, and `DROP=2`. Only the 10 `KEEP`/`REWRITE` rows are retained candidates; the three `MERGE` rows reuse existing atomic boundaries and add no catalog row.
- Task 3 identifies 80 implemented-but-missing atomic candidates, labeled `Case 204` through `Case 283`, all `NOT_RUN`, across `USER_ACCESS`, `USER_PROFILE`, `DEVELOPER_WORKLOAD`, `BUSINESS_CATALOGS`, `MY_NOTIFICATIONS`, `ACCESS_EMAIL`, and `BUG_EMAIL`.
- The candidate final count is `278 = 188 current catalog + 10 retained Task 2 candidates + 80 Task 3 candidates`. The official catalog remains 188 and is not changed by this package.
- Mentor-facing labels use sequential numbers and `Case N` only. Technical keys remain repository-internal and are excluded from the report's mentor-facing preview.
- PR #387 is merged at `9d5aad699662bde65a747de4c0d631678de639e4`; all analysis is anchored to `origin/dev@9d5aad699662bde65a747de4c0d631678de639e4`.
- No canonical catalog, workbook, Drive, Jira, BTP, product source, live data, dependency, lockfile, email, deployment, or atomic test execution was mutated. Proposed rows are not PASS.
- DonHV approval is required for the 15-row disposition set, the seven-family/80-case expansion, the candidate count of 278, and the sequential-only presentation before a catalog-extension or execution plan is written.
