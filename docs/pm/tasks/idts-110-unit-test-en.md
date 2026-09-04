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

## 2026-09-04 PR #386 remediation after DonHV review (comment 11041)

- Reverted all policy bypasses: `mappingOnlyIsAtomicExecution` returned to `false`; 135 mapped cases remain `MAPPING_ONLY_CANDIDATE`.
- Restored canonical 188-case catalog (`docs/qa/idts-110-unit-test-catalog.json`) and review index (`docs/sap490/Unit_Test_Evidence_Report_EN.md`).
- Restored `docs/pm/evidence/idts-110/cases/` to canonical dev baseline; removed unapproved SVG/PNG overrides and unapproved extra folders.
- Maintained 13 BTP cases as `BLOCKED` (waiting for authorized live BTP environment).
- Maintained 2 held cases (`UT-ATT-007/008`) as `BLOCKED` pending exact-head runtime proof.
- 15 candidate cases (`UT-USR-001..005`, `UT-CAT-001..005`, `UT-OPS-001..005`) are documented below with corrected roles, classifications, and negative/positive coverage for DonHV review before any catalog expansion from 188 to 203.

### Candidate Catalog Expansion Proposal (15 Cases for DonHV Approval)

| Case ID | Domain | Title | Role | Classification | Coverage | Requirement |
| --- | --- | --- | --- | --- | --- | --- |
| `UT-USR-001` | User Management | read active Developer profiles returns accurate availability | PM | POSITIVE | POSITIVE, ROLE | SRS-FR-AUTH-002 |
| `UT-USR-002` | User Management | read inactive user returns no profile data | PM | NEGATIVE | NEGATIVE, ROLE, SANITIZATION | SRS-FR-AUTH-002 |
| `UT-USR-003` | User Management | user role check strictly validates TESTER | Tester | ROLE_AUTHORIZATION | ROLE, POSITIVE | SRS-FR-AUTH-002 |
| `UT-USR-004` | User Management | user role check strictly validates DEVELOPER | Developer | ROLE_AUTHORIZATION | ROLE, POSITIVE | SRS-FR-AUTH-002 |
| `UT-USR-005` | User Management | user role check strictly validates PM | PM | ROLE_AUTHORIZATION | ROLE, POSITIVE | SRS-FR-AUTH-002 |
| `UT-CAT-001` | Classification | create Application Component requires PM role | PM | POSITIVE | POSITIVE, ROLE | SRS-FR-CLS-001 |
| `UT-CAT-002` | Classification | create Defect Category requires PM role | PM | POSITIVE | POSITIVE, ROLE | SRS-FR-CLS-001 |
| `UT-CAT-003` | Classification | non-PM role cannot modify catalog entities | Tester | NEGATIVE | NEGATIVE, ROLE, AUTHORIZATION | SRS-FR-CLS-001 |
| `UT-CAT-004` | Classification | active pair bridge validation applies across entities | PM | POSITIVE | POSITIVE, BOUNDARY | SRS-FR-CLS-002 |
| `UT-CAT-005` | Classification | inactive catalog item blocks new classification | Tester | NEGATIVE | NEGATIVE, BOUNDARY, VALIDATION | SRS-FR-CLS-002 |
| `UT-OPS-001` | Monitoring | workload dashboard calculates active bugs correctly | PM | POSITIVE | POSITIVE, MONITORING | SRS-FR-MON-001 |
| `UT-OPS-002` | Monitoring | overdue bugs reflect accurate SLA thresholds | PM | POSITIVE | POSITIVE, BOUNDARY, MONITORING | SRS-FR-MON-001 |
| `UT-OPS-003` | Monitoring | closed bugs are excluded from active workload | PM | POSITIVE | POSITIVE, MONITORING | SRS-FR-MON-001 |
| `UT-OPS-004` | Monitoring | developer filter isolated accurately | PM | POSITIVE | POSITIVE, ROLE, MONITORING | SRS-FR-MON-001 |
| `UT-OPS-005` | Monitoring | PM operational metrics enforce access controls | Developer | NEGATIVE | NEGATIVE, ROLE, AUTHORIZATION | SRS-FR-MON-002 |
