# IDTS-111 — UAT EN v0.3 catalog, execution and integration

- Catalog owner/approver and final integrator: DonHV
- Execution support: NhanT, SangVN and DatDT
- Due: 2026-08-04
- Status: NhanT candidate execution package is under DonHV review; final UAT and Drive remain pending
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

## NhanT candidate execution review — 2026-08-03

- PR #270 exact head: `44721f53fe2f7588d38f6d6c79ffb0c33026d5d3`.
- Candidate package: 57 manifests and 61 images; file/hash verification found 0 missing files and 0 mismatches.
- Candidate truth: 19 `MEETS_EXPECTED_RESULT`, 13 `DOES_NOT_MEET_EXPECTED_RESULT`, and 25 `NOT_EXECUTABLE_WITH_CURRENT_PRECONDITION`.
- DonHV disposition: `docs/pm/evidence/idts-111/donhv-execution-review-matrix.md`.
- Confirmed defects are separated from catalog mismatch, environment/session blockers, test-harness limitations and insufficient evidence.
- The 57-case package is not the complete 90-case UAT and does not authorize final workbook or Drive synchronization.
- Merge remains gated by NhanT personally acknowledging briefing SHA `3e78b495cb8feb56188cc446b827d47e040e1b98` and a fresh exact-head QA gate.
