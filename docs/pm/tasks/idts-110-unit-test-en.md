# IDTS-110 — Unit Test EN v0.5 expansion

- Catalog owner and approver: DonHV
- Workbook generator and final integrator: DonHV
- Test executor and case-evidence owner: NhanT
- Due: 2026-08-05
- Status: Execution candidate under DonHV remediation; PR #269 is not merge-ready
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
- Approval: DonHV, 2026-08-02; execution truth remains 188 `NOT_RUN`

No Unit Test VI is created. No command-only, script-only, shared-only, or unsanitized evidence is accepted.

## DonHV review of PR #269

- Exact reviewed head: `8957cbaa20f9c629818901f9b988884337a7ff82`
- Candidate result: `34 PASS / 2 FAIL / 152 BLOCKED`
- Correct primary taxonomy: 171 locally executable cases and 17 true BTP integration cases
- `UT-AUTH-004`: catalog corrected so malformed CDS type is verified through the OData 400 boundary, while wrong string credentials retain generic 401
- `UT-VAL-REPORTER`: catalog corrected to test unresolved authenticated actor; client omission remains valid because reporter is server-owned
- Evidence cards are generated summaries, not browser/runtime proof by themselves
- Required before merge: latest briefing acknowledgment, catalog correction by DonHV, local rerun of false blockers, controlled BTP rerun of the 17 integration cases, evidence cleanup and fresh QA Depth Gate

Evidence:

- `docs/pm/evidence/idts-110/donhv-execution-review-matrix.md`
- `docs/pm/evidence/idts-110/donhv-case-taxonomy.json`
