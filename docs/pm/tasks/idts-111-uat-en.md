# IDTS-111 — UAT EN v0.3 catalog, execution and integration

- Catalog owner/approver and final integrator: DonHV
- Execution support: NhanT, SangVN and DatDT
- Due: 2026-08-04
- Status: DonHV latest disposition applied; current package retains 19 positives and 20 valid blockers, marks 5 stale blockers plus 2 old-runtime negatives for rerun, and keeps diagnostic/manual limitations explicit
- Jira: https://dutassociation.atlassian.net/browse/IDTS-111

## Workflow

1. DonHV produces and approves the detailed English-only user-action catalog.
2. NhanT executes Tester cases and captures case-specific sanitized evidence.
3. SangVN and DatDT execute the assigned Developer-role cases with their own SAP identities.
4. DonHV executes PM, database and integration cases, then reviews every result.
5. DonHV alone generates UAT EN v0.3 and updates the same Drive ID after reviewed execution evidence is complete.

## Current candidate

- Catalog: `docs/qa/idts-111-uat-catalog.json`.
- Frozen baseline: `447da1dab80418847d806040e6b2060b0916cb63`.
- Cases: 90 atomic English-only cases.
- Approval: DonHV approved for execution on 2026-08-02.
- Approved catalog truth remains unchanged: 90 `PREPARED`, 0 reviewer-approved PASS, 0 reviewer-approved FAIL.
- NhanT package: 57/57 manifests preserved. DonHV's latest review partition is 19 retained candidate positives, 20 valid blockers, 5 stale blockers, 3 defect rechecks, 5 semantic corrections, 1 physical-keyboard limitation, 2 AI diagnostic reruns and 2 historical old-runtime negatives. No category is final UAT PASS and the approved catalog remains unchanged.
- DonHV disposition: 19 positive evidence packages accepted; 25 blockers accepted without PASS; 13 negatives split into 3 confirmed product defects (`UAT-AUTH-005`, `UAT-BUG-008`, `UAT-UX-002`), 5 catalog mismatches, 1 environment/session blocker, 3 targeted reruns, and 1 test-harness limitation. See `docs/pm/evidence/idts-111/donhv-execution-review-matrix.md`.
- Current rerun state: `UAT-COM-001` and `UAT-ATT-001` are historical old-runtime negatives after IDTS-116; five stale blockers also require current-runtime execution. AI diagnostics still require immutable suggestion ID plus sanitized Network/audit and no-mutation proof. The required Browser control tool is unavailable in this session, so no current-runtime result was fabricated or promoted. `UAT-UX-003` still requires NhanT's physical Tab-key confirmation.
- Knowledge gate: NhanT acknowledged briefing SHA `3e78b495cb8feb56188cc446b827d47e040e1b98`; Jira comments `10908` (IDTS-110) and `10909` (IDTS-111).
- Final targeted-rerun handoff: commit `adb66e8`, PR #270 body refreshed, Jira IDTS-111 comment `10925`.
- Candidate execution summary: `docs/pm/evidence/idts-111/execution-summary.md`.
- Catalog merge SHA: `6f01affc2c2945e51d18199137c8a89a20c77600`.
- BTP runtime SHA: `67b1bf86169e9696c9365ef4846b99ffae30d4e2`.
- Readiness: `DEMO READY` at `2026-08-02T23:06:59+07:00`.
- Execution baseline: `docs/pm/evidence/idts-111/execution-baseline.md`.
- Assignment: `docs/pm/evidence/idts-111/execution-assignment.md`.
- Workbook and Drive: unchanged in this phase.

Assigned members may now execute after running the readiness check for their session. No UAT VI, fabricated sign-off, shared member session, or historical Render evidence is allowed. AI provider-primary success and safe fallback must be reported separately.

NhanT's completed candidate package uses the authenticated SAP BTP UI and member-owned Tester identity. It contains 63 sanitized screenshots referenced by 57 manifests after the targeted comment/upload reruns, explicit candidate outcomes for 32 executed cases, and case-specific rerun conditions for 25 cases whose required identity, role, state, service, or fixture was unavailable. DonHV still owns review, catalog result decisions, Jira disposition, final workbook generation, and same-ID Drive synchronization.
