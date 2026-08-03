# IDTS-110 — Unit Test EN v0.5 expansion

- Catalog owner and approver: DonHV
- Workbook generator and final integrator: DonHV
- Test executor and case-evidence owner: NhanT
- Due: 2026-08-02
- Status: NhanT execution package ready for DonHV review with 2 FAIL and 152 blocked cases
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

## NhanT execution progress — 2026-08-03

- All 188 approved cases now have individual candidate packages under `docs/pm/evidence/idts-110/cases/`.
- Execution truth: 34 PASS, 2 FAIL, and 152 BLOCKED.
- The two FAIL cases are `UT-AUTH-004` and `UT-VAL-REPORTER`; details are in `docs/pm/evidence/idts-110/execution-summary.md`.
- Of the blocked cases, 150 require BTP/HANA/live-service execution without an authorized target/session, and 2 LOCAL attachment UI cases require an approved browser runtime.
- Evidence inventory: 188 manifests, 269 PNGs, and 269 SVGs. Persistence cases include before/after and reload/readback images.
- DonHV review is pending. The approved catalog remains 188 `NOT_RUN`, and `Unit_Test_EN`/Drive have not been changed by NhanT/agent.
- Consolidated Jira handoff comment: `IDTS-110` comment `10861`.

No Unit Test VI is created. No command-only, script-only, shared-only, or unsanitized evidence is accepted.
