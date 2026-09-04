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

## 2026-09-04 PR #386 remediation after DonHV review (comment 11041 & 11045)

- Reverted all policy bypasses: `mappingOnlyIsAtomicExecution` returned to `false`; 135 mapped cases remain `MAPPING_ONLY_CANDIDATE`.
- Restored canonical 188-case catalog (`docs/qa/idts-110-unit-test-catalog.json`) and review index (`docs/sap490/Unit_Test_Evidence_Report_EN.md`).
- Restored `docs/pm/evidence/idts-110/cases/` to canonical dev baseline; removed unapproved SVG/PNG overrides and unapproved extra folders.
- Maintained 13 BTP cases as `BLOCKED` (waiting for authorized live BTP environment).
- Maintained 2 held cases (`UT-ATT-007/008`) as `BLOCKED` pending exact-head runtime proof.
- Unified canonical evidence filename: Removed supplemental `local-primary-suites.json` and standardized on canonical `docs/pm/evidence/idts-110/local-primary-suite-results.json`.
- Fixed test suite execution timing: Captured true elapsed run duration (`startedAt`, `completedAt`, `durationMs`, and `recordedAt`) in `scripts/qa/test-idts110-local-primary-suites.js`.
- Candidate catalog proposal refined below addressing all 6 blockers from DonHV comment #11045:
  1. Traced requirement IDs strictly to existing SRS IDs (`SRS-FR-CLASS-001/003/004` and `SRS-FR-PM-001/002/003`).
  2. Enforced dual-role requirement: Catalog administration requires active `PM + UserAdmin`.
  3. Deduplicated proposed behaviors against the 188 canonical cases with an explicit Gap & Novelty Matrix.
  4. Fully specified `UT-USR-002` (exact service, entity, caller actor, target user state, expected result) and contrasted with inactive caller controls.

### Candidate Catalog Expansion Proposal (15 Novel Cases for DonHV Approval)

The canonical catalog remains strictly at 188 cases. The following 15 candidate cases are documented for review by DonHV before any decision to expand the catalog:

| Case ID | Domain | Title | Role / Actor | Classification | Coverage | Requirement ID |
| --- | --- | --- | --- | --- | --- | --- |
| `UT-USR-001` | User Management | read active Developer profiles returns accurate availability in BugService | PM | POSITIVE | POSITIVE, ROLE | SRS-FR-AUTH-002 |
| `UT-USR-002` | User Management | inactive developer target excluded from assignable developers in BugService | PM | NEGATIVE | NEGATIVE, BOUNDARY, FILTERING | SRS-FR-AUTH-002 |
| `UT-USR-003` | User Management | admin searchActiveUsers filters revoked identities unless includeNonActive flag set | PM + UserAdmin | POSITIVE | POSITIVE, FILTERING | SRS-FR-AUTH-002 |
| `UT-USR-004` | User Management | updateActiveUserDisplayName enforces optimistic locking via expectedModifiedAt version match | PM + UserAdmin | POSITIVE | POSITIVE, CONCURRENCY | SRS-FR-AUTH-002 |
| `UT-USR-005` | User Management | inactive caller is denied access to UserAdministrationService with 403 USER_ADMIN_REQUIRED | Inactive User | NEGATIVE | NEGATIVE, ROLE, AUTHORIZATION | SRS-FR-AUTH-002 |
| `UT-CAT-001` | Classification | create Application Component requires active PM + UserAdmin | PM + UserAdmin | POSITIVE | POSITIVE, ROLE | SRS-FR-CLASS-001 |
| `UT-CAT-002` | Classification | create Defect Category requires active PM + UserAdmin | PM + UserAdmin | POSITIVE | POSITIVE, ROLE | SRS-FR-CLASS-001 |
| `UT-CAT-003` | Classification | non-admin caller (PM lacking UserAdmin, Tester, Developer) cannot modify catalog entities | PM (no UserAdmin) / Tester / Developer | NEGATIVE | NEGATIVE, ROLE, AUTHORIZATION | SRS-FR-CLASS-001 |
| `UT-CAT-004` | Classification | resolve Component Category bridge from active component and defect category pair | PM + UserAdmin | POSITIVE | POSITIVE, BOUNDARY | SRS-FR-CLASS-004 |
| `UT-CAT-005` | Classification | inactive catalog item blocks new bug classification submission | Tester | NEGATIVE | NEGATIVE, BOUNDARY, VALIDATION | SRS-FR-CLASS-003 |
| `UT-OPS-001` | Monitoring | workload dashboard calculates cross-developer load distribution under team capacity limits | PM | POSITIVE | POSITIVE, MONITORING | SRS-FR-PM-002 |
| `UT-OPS-002` | Monitoring | SLA calculation accurately separates open aging bugs from closed bug historical durations | PM | POSITIVE | POSITIVE, BOUNDARY, MONITORING | SRS-FR-PM-001 |
| `UT-OPS-003` | Monitoring | developer workload handles multi-responsibility component weighting correctly | PM | POSITIVE | POSITIVE, MONITORING | SRS-FR-PM-002 |
| `UT-OPS-004` | Monitoring | PM dedicated queues (Pending Assignment, Retest, Overdue) return isolated paginated results | PM | POSITIVE | POSITIVE, ROLE, MONITORING | SRS-FR-PM-003 |
| `UT-OPS-005` | Monitoring | Developer cannot access PM custom operational and SLA reporting endpoints | Developer | NEGATIVE | NEGATIVE, ROLE, AUTHORIZATION | SRS-FR-PM-001 |

### Disambiguation & Exact Specification: `UT-USR-002` vs Inactive Caller Controls

- **`UT-USR-002` (Inactive Target Exclusion)**:
  - **Service**: `BugService`
  - **Entity**: `BugService.AssignableDevelopers`
  - **Caller Actor**: Active PM user (`pm1@idts.local` with role `PM`)
  - **Target Subject**: Developer user profile with `active = false` or status `REVOKED` (`dev-inactive@idts.local`)
  - **Input Action**: `GET BugService.AssignableDevelopers?$filter=developerProfileID eq ...`
  - **Expected Result**: HTTP 200 OK with empty result array (inactive developer profile is excluded by `filterAssignableDeveloperRow` and `!row.developerActive`; never presented in assignment value help).
- **`UT-USR-005` (Inactive Caller Rejection - Contrastive Control)**:
  - **Service**: `UserAdministrationService`
  - **Entity / Action**: `UserAdministrationService.readActiveUserDetails` or `searchActiveUsers`
  - **Caller Actor**: Inactive user / disabled PM credentials (`active = false`)
  - **Input Action**: Any administrative query or action invocation
  - **Expected Result**: HTTP 403 Forbidden with error code `USER_ADMIN_REQUIRED` / `USER_INACTIVE` (`PM and UserAdmin authorization is required.`).

### Deduplication & Novelty Gap Matrix against Canonical 188 Cases

| Proposed Case | Overlap Candidate in 188 Catalog | Why 188 Case is Insufficient (Novel Behavior Covered) |
| --- | --- | --- |
| `UT-USR-001..002` | `UT-AUTH-001` | `UT-AUTH-001` validates user session creation; `UT-USR-001..002` specifically tests `BugService.AssignableDevelopers` dynamic projection, developer availability status, and exclusion of inactive developer profiles from value help. |
| `UT-USR-003..004` | `UT-AUTH-007` | `UT-AUTH-007` validates public current user profile resolution; `UT-USR-003..004` exercises `UserAdministrationService` administrative features: `searchActiveUsers` filtering revoked accounts and `updateActiveUserDisplayName` concurrency control (`expectedModifiedAt` version match). |
| `UT-USR-005` | `UT-AUTH-006` | `UT-AUTH-006` prevents login session creation for inactive users; `UT-USR-005` validates that `UserAdministrationService` middleware independently asserts caller activity and denies deactivated admin accounts with 403 `USER_ADMIN_REQUIRED`. |
| `UT-CAT-001..003` | `UT-VAL-PAIR-*` | `UT-VAL-PAIR-*` tests bug creation validation against existing component-category pairs; `UT-CAT-001..003` tests administrative CRUD on the catalog entities themselves in `UserAdministrationService`, asserting dual-role authorization (`PM + UserAdmin`) and negative rejection of PM without UserAdmin, Tester, and Developer. |
| `UT-CAT-004..005` | `UT-VAL-PAIR-NOMAP` | `UT-VAL-PAIR-NOMAP` checks unmapped pairs; `UT-CAT-004..005` exercises dynamic bridge resolution between active entities and verifies that deactivating a catalog entity prevents subsequent bug submissions while keeping existing bugs intact. |
| `UT-OPS-001..003` | `UT-MON-001, UT-MON-003` | `UT-MON-001` checks single-bug overdue flags and `UT-MON-003` checks developer open counts; `UT-OPS-001..003` tests aggregate team capacity distribution headroom and multi-responsibility component weighting. |
| `UT-OPS-004` | `UT-MON-006` | `UT-MON-006` tests deterministic ordering; `UT-OPS-004` tests dedicated queue isolation across `Pending Assignment`, `Retest Required`, and `Overdue` pagination partitions. |
| `UT-OPS-005` | `UT-MON-007` | `UT-MON-007` tests `readAiOperationalMetrics` authorization; `UT-OPS-005` tests access restrictions across PM operational workload and SLA summary endpoints. |
