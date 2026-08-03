# IDTS-110 — Unit Test EN v0.5 expansion

- Catalog owner and approver: DonHV
- Workbook generator and final integrator: DonHV
- Test executor and case-evidence owner: NhanT
- Due: 2026-08-05
- Status: Remediation candidate verified; PR #269 is ready for DonHV review with 175 local candidate PASS and 13 explicit BTP blockers
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

## NhanT remediation progress — 2026-08-03

- All 188 approved cases now have individual candidate packages under `docs/pm/evidence/idts-110/cases/`.
- Current candidate truth: 175 PASS, 0 FAIL, and 13 BLOCKED.
- Exact LOCAL result: 40 PASS / 0 FAIL / 0 BLOCKED. `UT-AUTH-004` now returns a safe HTTP 400 contract with no session mutation; `UT-ATT-007/008` execute the production UI validation function in the isolated component harness.
- Corrected local-primary result: 135/135 mapped candidates have fresh passing domain-suite evidence; DonHV retains case-level acceptance ownership.
- The 13 true BTP integration cases remain blocked because `cf`/authorized BTP readiness, controlled identities, S3 injection, and Job Scheduler proof are unavailable. The two UI component cases are resolved locally; the signed-in deployed List Report is healthy, while a full local Fiori render is limited by the unreachable UI5 CDN redirect.
- Evidence inventory: 188 manifests, 278 PNGs, and 0 SVGs. Duplicate SVG sources were removed and structured JSON evidence is linked from manifests.
- DonHV review is pending. The approved catalog remains 188 `NOT_RUN`, and `Unit_Test_EN`/Drive have not been changed by NhanT/agent.
- Previous Jira handoff comment: `10861`; a final remediation comment is required after this exact-head verification is pushed.

No Unit Test VI is created. No command-only, script-only, shared-only, or unsanitized evidence is accepted.

## DonHV review of PR #269

- Exact reviewed head: `8957cbaa20f9c629818901f9b988884337a7ff82`
- Candidate result: `34 PASS / 2 FAIL / 152 BLOCKED`
- Corrected primary taxonomy: 175 locally executable cases and 13 true BTP integration cases
- `UT-AUTH-004`: catalog corrected so malformed CDS type is verified through the OData 400 boundary, while wrong string credentials retain generic 401
- `UT-VAL-REPORTER`: catalog corrected to test unresolved authenticated actor; client omission remains valid because reporter is server-owned
- Evidence cards are generated summaries, not browser/runtime proof by themselves
- Required before merge: latest briefing acknowledgment, local rerun of false blockers, controlled BTP rerun of the 13 integration cases, evidence cleanup and fresh QA Depth Gate

Evidence:

- `docs/pm/evidence/idts-110/donhv-execution-review-matrix.md`
- `docs/pm/evidence/idts-110/donhv-case-taxonomy.json`
