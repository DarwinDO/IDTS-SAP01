# IDTS-111 — UAT EN v0.3 catalog, execution and integration

- Catalog owner/approver and final integrator: DonHV
- Execution support: NhanT, SangVN and DatDT
- Due: 2026-08-03
- Status: Catalog approved and execution baseline published; assigned human execution may begin
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
- Execution truth: 90 `PREPARED`, 0 executed, 0 passed, 0 failed.
- Catalog merge SHA: `6f01affc2c2945e51d18199137c8a89a20c77600`.
- BTP runtime SHA: `67b1bf86169e9696c9365ef4846b99ffae30d4e2`.
- Readiness: `DEMO READY` at `2026-08-02T23:06:59+07:00`.
- Execution baseline: `docs/pm/evidence/idts-111/execution-baseline.md`.
- Assignment: `docs/pm/evidence/idts-111/execution-assignment.md`.
- Workbook and Drive: unchanged in this phase.

Assigned members may now execute after running the readiness check for their session. No UAT VI, fabricated sign-off, shared member session, or historical Render evidence is allowed. AI provider-primary success and safe fallback must be reported separately.
