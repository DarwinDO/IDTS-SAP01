# IDTS-110 — Unit Test EN v0.5 expansion

- Catalog owner and approver: DonHV
- Workbook generator and final integrator: DonHV
- Test executor and case-evidence owner: NhanT
- Due: 2026-08-02
- Status: Catalog candidate prepared; pending DonHV content approval
- Jira: https://dutassociation.atlassian.net/browse/IDTS-110

## Workflow

1. DonHV generates an English-only atomic condition-branch catalog from the frozen source baseline.
2. DonHV reviews and approves the catalog before execution.
3. NhanT executes the approved cases and captures sanitized, case-specific image evidence.
4. DonHV reviews actual results and evidence.
5. DonHV generates Unit Test EN v0.5 and synchronizes the approved workbook to the same Drive file ID.

## Current candidate

- Catalog: `docs/qa/idts-110-unit-test-catalog.json`
- Generator: `scripts/qa/generate-idts110-unit-test-catalog.js`
- Frozen baseline: `bc0c47e522ae208384d4b23dda21535dcc683683`
- Cases: 188
- Execution truth: 188 `NOT_RUN`; no historical PASS was inherited
- Review evidence: `docs/pm/evidence/idts-110/unit-test-catalog-review.md`

No Unit Test VI is created. No command-only, script-only, shared-only, or unsanitized evidence is accepted.
