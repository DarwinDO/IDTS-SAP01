# IDTS-111 — UAT EN v0.3 catalog, execution and integration

- Catalog owner/approver and final integrator: DonHV
- Execution support: NhanT, SangVN and DatDT
- Due: 2026-08-03
- Status: Candidate catalog prepared; pending DonHV content approval before execution
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
- Execution truth: 90 `PREPARED`, 0 executed, 0 passed, 0 failed.
- Workbook and Drive: unchanged in this phase.

No UAT VI, fabricated sign-off, shared member session, or historical Render evidence is allowed. AI provider-primary success and safe fallback must be reported separately.
