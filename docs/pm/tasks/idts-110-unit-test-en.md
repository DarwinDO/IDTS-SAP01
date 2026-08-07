# IDTS-110 — Unit Test EN v0.5 expansion

- Catalog owner/approver: DonHV
- Workbook generator/final integrator: DonHV
- Test executor/case-evidence owner: NhanT
- Due: 2026-08-05
- Jira: https://dutassociation.atlassian.net/browse/IDTS-110
- Status: In Progress; evidence package curated, member-owned reruns remain

## Workflow

1. DonHV owns and approves the English-only 188-case catalog.
2. NhanT executes cases and captures sanitized, case-specific evidence.
3. DonHV reviews candidate truth without rewriting execution history.
4. Only accepted results may later enter Unit Test EN v0.5.
5. DonHV alone generates and synchronizes the workbook to the existing Drive ID.

## Current catalog truth

- Catalog: `docs/qa/idts-110-unit-test-catalog.json`
- Frozen catalog baseline: `bc0c47e522ae208384d4b23dda21535dcc683683`
- Cases: 188
- Canonical execution state: 188 `NOT_RUN`
- Workbook/Drive: unchanged

## PR #269 candidate and reviewer truth

| Layer | Accepted/PASS | Held | Mapping-only | Blocked |
| --- | ---: | ---: | ---: | ---: |
| NhanT candidate | 40 | 0 | 135 | 13 |
| DonHV review | 38 | 2 | 135 | 13 |

- Held: `UT-ATT-007/008`, pending exact-head acceptance.
- Mapping-only: traceability, not execution PASS.
- Blocked: 13 member-owned BTP/HANA/XSUAA/S3/Job Scheduler integrations.
- Malformed-login sanitizer: merged separately under IDTS-39 / PR #283 at `e55a863d0cc4ada6c421ce940c1986162756c176`.

## Evidence

- `docs/pm/evidence/idts-110/execution-summary.md`
- `docs/pm/evidence/idts-110/donhv-execution-review-matrix.md`
- `docs/pm/evidence/idts-110/donhv-case-taxonomy.json`
- `docs/pm/evidence/idts-110/cases/`

No Unit Test VI is created. No command-only, script-only, generated-card-only, shared-account, or unsanitized evidence is accepted as final execution proof.

## 2026-08-08 workbook candidate handoff

- English candidate generated from the hashed OFFICIAL SUBMISSIONS authority: `docs/sap490/generated/Unit_Test_IDTS_SAP01_en_candidate_v0.5.xlsx`.
- Candidate SHA-256: `62E1F35982C8B917944831AC615D4412518D4F0D1DF447E05D1079849747B59D`.
- Coverage: 188/188 catalog rows; 280 embedded images; 188 internal evidence links.
- Catalog truth remains 188 `NOT_RUN`; compact workbook dispositions do not create PASS.
- OfficeCLI schema and repo fidelity policy PASS. Excel, LibreOffice and artifact-tool focused renders were reviewed; OfficeCLI screenshot rendering itself was unavailable for the wide merged ranges.
- Manifest: `docs/pm/evidence/idts-110-111-workbook-candidates/unit-test-candidate-manifest.md`.
- Status remains In Progress. No Drive update or Jira Done transition occurred because DonHV must personally acknowledge baseline `8d4e78b71d7cde2c54b2671577f1a90629864482`, add the matching Jira comment, and approve the exact candidate hash.
