# IDTS-106 English-only SAP490 audit candidate

Status: READ-ONLY CANDIDATE — BLOCKED BY IDTS-105 HUMAN ACKNOWLEDGMENTS

Audit date: 2026-08-03 (Asia/Bangkok)
Baseline: `fbea12cd996d8c1e13bd834fd6e054c8a37c32e6`
Audit branch: `docs/idts-106-english-only-donhv`
User/member context: DonHV

## Safety boundary

- No Google Drive write, rename, move, trash, delete, or synchronization was performed.
- No member acknowledgment or approval was created; `docs/pm/evidence/idts-105/member-read-acknowledgements.md` remains the human-owned gate.
- No archive, template, reference, previous-version, POC, workshop, app, srv, db, deployment, database, or seed artifact was changed.
- OfficeCLI preflight: `officecli --version` returned `1.0.143`; `officecli help` returned exit 0. OfficeCLI does not natively inspect Markdown or Google Drive metadata, so those areas were audited with repository reads and the read-only Google Drive connector.

## Repo current-tree inventory

The current `docs/sap490/generated/` tree contains 11 VI submission artifacts and 11 matching EN counterparts:

| VI artifact family | EN counterpart | VI SHA-256 available | Result |
|---|---|---:|---|
| Blueprint v0.6 | Blueprint EN v0.6 | yes | pair present |
| Configuration Note v0.5 | Configuration Note EN v0.5 | yes | pair present |
| Functional Specification v0.7 | Functional Specification EN v0.7 | yes | pair present |
| Functional Test v0.3 | Functional Test EN v0.3 | yes | pair present |
| Technical Specification v0.7 | Technical Specification EN v0.7 | yes | pair present |
| Test And Fix Bug v0.5 | Test And Fix Bug EN v0.5 | yes | pair present |
| Test Report v0.4 | Test Report EN v0.4 | yes | pair present |
| Test Scenario v0.3 | Test Scenario EN v0.3 | yes | pair present |
| TR Management v0.3 | TR Management EN v0.3 | yes | pair present |
| UAT prepared v0.2 | UAT EN prepared v0.2 | yes | pair present |
| Unit Test v0.4 | Unit Test EN v0.4 | yes | pair present |

Canonical BA Markdown also remains deliberately bilingual with matching `docs/ba/brd/brd.en.md`/`brd.vi.md`, `srs.en.md`/`srs.vi.md`, and `frs.en.md`/`frs.vi.md`; these are not Mentor Current submission artifacts.

## Drive Mentor Current read-only inventory

The folder named `SU26SAP01_GSU26SAP01_00_MENTOR_REVIEW_CURRENT` was read recursively through the Google Drive connector. A second full traversal resolved the earlier 12/13 discrepancy: it contains **13 VI artifacts and 13 EN counterparts**, all with matching family/version names. The initially missed family was `Test And Fix Bug`, because its folder is nested under the `Test Report` folder rather than listed as a direct child of `03_Testing_Evidence`.

| Family | VI current | EN current | Metadata result |
|---|---|---|---|
| BRD | `BRD_VI_v1_5_20260724.docx` | `BRD_EN_v1_5_20260724.docx` | both present |
| SRS | `SRS_VI_v1_4_20260724.docx` | `SRS_EN_v1_4_20260724.docx` | both present |
| FRS | `FRS_VI_v1_5_20260724.docx` | `FRS_EN_v1_5_20260724.docx` | both present |
| Blueprint | `Blueprint_VI_v0_6_20260725.docx` | `Blueprint_EN_v0_6_20260725.docx` | both present |
| Functional Specification | `Functional_Specification_VI_v0_7_20260725.xlsx` | `Functional_Specification_EN_v0_7_20260725.xlsx` | both present |
| Technical Specification | `Technical_Specification_VI_v0_7_20260726.xlsx` | `Technical_Specification_EN_v0_7_20260726.xlsx` | both present |
| Configuration Note | `Configuration_Note_VI_v0_5_20260725.xlsx` | `Configuration_Note_EN_v0_5_20260725.xlsx` | both present |
| Test Scenario | `Test_Scenario_VI_v0_3_20260724.xlsx` | `Test_Scenario_EN_v0_3_20260724.xlsx` | both present |
| Unit Test | `Unit_Test_VI_v0_4_20260726.xlsx` | `Unit_Test_EN_v0_4_20260726.xlsx` | both present |
| Functional Test | `Functional_Test_VI_v0_3_20260724.xlsx` | `Functional_Test_EN_v0_3_20260724.xlsx` | both present |
| Test Report | `Test_Report_VI_v0_4_20260724.xlsx` | `Test_Report_EN_v0_4_20260724.xlsx` | both present |
| Test And Fix Bug | `Test_And_Fix_Bug_VI_v0_5_20260724.xlsx` | `Test_And_Fix_Bug_EN_v0_5_20260724.xlsx` | both present; nested under Test Report |
| UAT prepared | `UAT_VI_PREPARED_v0_2_20260724.xlsx` | `UAT_EN_PREPARED_v0_2_20260724.xlsx` | both present |

Drive metadata readback exposed file sizes and modified timestamps. Raw Drive hashes and external raw backups were not produced in this candidate because that would require downloading/storing copies; no deletion or sync is authorized while IDTS-105 remains incomplete.

## EN-only/remediation findings

1. Current generated tree is not EN-only: 11 VI submission artifacts remain beside 11 EN artifacts.
2. Generator references still explicitly emit VI output and Vietnamese content, including `generate-blueprint-docx.py`, `generate-functional-and-bugfix-deliverables.py`, `generate-review-support-artifacts.py`, `generate-review-technical-config-spec.py`, `generate-retest-aligned-artifacts.py`, and `generate-generated-archive-manifest.py`.
3. Validators and template-fidelity checks still include VI files and bilingual parity, notably `validate-specification-pack.py`, `validate-test-pack.py`, `test-specification-quality-contract.py`, `test_template_fidelity.py`, and `test-test-pack-evidence-contract.py`.
4. `docs/sap490/generated-archive-manifest-20260726.md` is a historical/archive manifest and explicitly lists VI artifacts; it must not be edited as part of current-tree cleanup without preserving its historical meaning.
5. Existing historical guidance files (`*.vi.md`, mentor briefing, knowledge mirrors) are intentionally out of scope for English-only submission cleanup.

## Stale branch/PR evidence

- Remote branch `docs/idts-106-english-only-sap490-donhv` points to `31f0004ca9cba404abd78a94e80e964f33ff9c50` dated 2026-07-27.
- PR #193 is still OPEN and not merged.
- Compared with `origin/dev`, the branch is 168 commits behind and 1 commit ahead (`git rev-list --left-right --count origin/dev...origin/docs/idts-106-english-only-sap490-donhv`).
- Safe remediation candidate: close/supersede the stale PR only after DonHV reviews this candidate and IDTS-105 gate state; do not force-push or delete the branch in this task.

## Verification and blockers

- Fresh read-only evidence: OfficeCLI preflight PASS; repo file inventory and SHA-256 enumeration completed; Drive folder and nested child-folder metadata readback completed; Git remote/PR readback completed. The authoritative Drive count for this candidate is 13 VI + 13 EN.
- The initial validator bundle timed out, but all checks were rerun separately. `test-specification-quality-contract.py` completed in 110.1 seconds and PASS; the earlier timeout was a command-budget issue, not a quality failure.
- Blocker: IDTS-105 human acknowledgments are incomplete. Therefore this file is a candidate manifest only; it is not a PASS, approval, Drive synchronization authorization, or Jira Done evidence.
