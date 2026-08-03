# IDTS-111 — UAT EN v0.3 catalog, execution and integration

- Catalog owner/approver and final integrator: DonHV
- Execution support: NhanT, SangVN and DatDT
- Due: 2026-08-03
- Status: NhanT candidate package complete; 57/57 assigned cases are packaged for one DonHV review, including explicit precondition-blocked cases
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
- NhanT candidate execution batch: 57/57 packaged; 32 `EXECUTED_PENDING_DONHV_REVIEW` (19 candidate `MEETS_EXPECTED_RESULT`, 13 candidate `DOES_NOT_MEET_EXPECTED_RESULT`) and 25 `EXECUTION_BLOCKED_PENDING_PRECONDITION`. No NhanT-assigned case remains unattempted or unpackaged. The case manifests and consolidated summary preserve exact evidence, blockers, and rerun conditions; none changes the approved catalog before DonHV review.
- Candidate execution summary: `docs/pm/evidence/idts-111/execution-summary.md`.
- Catalog merge SHA: `6f01affc2c2945e51d18199137c8a89a20c77600`.
- BTP runtime SHA: `67b1bf86169e9696c9365ef4846b99ffae30d4e2`.
- Readiness: `DEMO READY` at `2026-08-02T23:06:59+07:00`.
- Execution baseline: `docs/pm/evidence/idts-111/execution-baseline.md`.
- Assignment: `docs/pm/evidence/idts-111/execution-assignment.md`.
- Workbook and Drive: unchanged in this phase.

Assigned members may now execute after running the readiness check for their session. No UAT VI, fabricated sign-off, shared member session, or historical Render evidence is allowed. AI provider-primary success and safe fallback must be reported separately.

NhanT's completed candidate package uses the authenticated SAP BTP UI and member-owned Tester identity. It contains 61 hash-verified sanitized screenshots, 57 manifests, explicit candidate outcomes for 32 executed cases, and case-specific rerun conditions for 25 cases whose required identity, role, state, service, or fixture was unavailable. The session was signed out after the final auth case. DonHV still owns review, catalog result decisions, Jira disposition, final workbook generation, and same-ID Drive synchronization.
