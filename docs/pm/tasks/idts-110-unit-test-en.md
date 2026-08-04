# IDTS-110 — Unit Test EN v0.5 expansion

- Catalog owner and approver: DonHV
- Workbook generator and final integrator: DonHV
- Test executor and case-evidence owner: NhanT
- Due: 2026-08-05
- Status: Remediation candidate merged with latest dev; current exact-head package has 38 atomic candidate PASS, 135 mapping-only candidates, 0 FAIL, 13 BTP blockers, and 2 SAP-standard attachment UI runtime blockers
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
- Current candidate truth: 38 atomic candidate PASS, 135 `MAPPING_ONLY_CANDIDATE`, 0 FAIL, and 15 BLOCKED.
- Exact LOCAL result: 38 PASS / 0 FAIL / 2 BLOCKED. `UT-AUTH-004` returns a safe HTTP 400 contract with no session mutation; `UT-ATT-007/008` require generated-control runtime proof/rebaseline after latest dev retired the approved custom handler.
- Corrected local-primary result: 135/135 cases have fresh suite-to-case traceability and 0 failed mappings. They are explicitly not atomic executions or PASS evidence; DonHV retains case-level acceptance ownership.
- The 13 true BTP integration cases remain blocked because `cf`/authorized BTP readiness, controlled identities, S3 injection, and Job Scheduler proof are unavailable. The two attachment UI cases have valid replacement CDS contracts but no fresh generated-control runtime evidence on the merged head.
- Evidence inventory: 188 manifests, 278 PNGs, and 0 SVGs. Duplicate SVG sources were removed and structured JSON evidence is linked from manifests.
- All 188 manifests name exact tested baseline `56b4a4f3d92ef2f9558869caab4b393b07d8b5e7`; evidence reconciliation found 0 missing references.
- DonHV review is pending. The approved catalog remains 188 `NOT_RUN`, and `Unit_Test_EN`/Drive have not been changed by NhanT/agent.
- Jira handoff comments: previous `10861`; final remediation handoff `10924` after commit `c409335` and PR #269 QA-depth PASS.

No Unit Test VI is created. No command-only, script-only, shared-only, or unsanitized evidence is accepted.

## DonHV review of PR #269

- Exact reviewed head: `8957cbaa20f9c629818901f9b988884337a7ff82`
- Candidate result: `34 PASS / 2 FAIL / 152 BLOCKED`

## 2026-08-04 generated-control runtime update

- NhanT completed `UT-ATT-007/008` on deployed SAP BTP; both are candidate PASS with screenshot hashes in their manifests.
- Current review truth is `40 atomic candidate PASS / 135 MAPPING_ONLY_CANDIDATE / 0 FAIL / 13 BTP BLOCKED`.
- Remaining action is DonHV review plus an authorized CF/BTP rerun of the 13 integrations. `Unit_Test_EN` and Drive remain unchanged.
- Corrected primary taxonomy: 175 locally executable cases and 13 true BTP integration cases
- `UT-AUTH-004`: catalog corrected so malformed CDS type is verified through the OData 400 boundary, while wrong string credentials retain generic 401
- `UT-VAL-REPORTER`: catalog corrected to test unresolved authenticated actor; client omission remains valid because reporter is server-owned
- Evidence cards are generated summaries, not browser/runtime proof by themselves
- Required before merge: latest briefing acknowledgment, local rerun of false blockers, controlled BTP rerun of the 13 integration cases, evidence cleanup and fresh QA Depth Gate

Evidence:

- `docs/pm/evidence/idts-110/donhv-execution-review-matrix.md`
- `docs/pm/evidence/idts-110/donhv-case-taxonomy.json`
