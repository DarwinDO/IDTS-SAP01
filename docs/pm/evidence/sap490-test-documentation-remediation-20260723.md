# SAP490 Test Documentation Remediation Evidence — 2026-07-23

## Verdict

`CONDITIONALLY READY — UAT execution and mentor sign-off pending`

No open P1 test-documentation defect remains in the 12 current EN/VI workbooks. This verdict does not claim UAT execution, mentor sign-off, Final Project Report completion, live-provider acceptance, project completion, or a Knowledge Gate result.

Knowledge Gate: `IN PROGRESS — handled in dedicated learning thread`.

## Scope and controls

- Branch: `docs/mentor-readiness-20260725-donhv`.
- Runtime source remained read-only: no task change under `app/`, `srv/`, or `db/`.
- Workshop EN/VI and Blueprint EN/VI were not edited by this workstream.
- No staging, commit, push, merge, PR, Drive copy, or Drive delete was performed.
- All 12 current workbooks were regenerated from repository source and replaced in place on Drive.

## Canonical source and generator

- Canonical catalog: `docs/qa/test-catalog.json`.
- Generator: `scripts/sap490/generate-review-test-pack.py`.
- Validator: `scripts/sap490/validate-test-pack.py`.
- The catalog contains 32 requirements, 27 cases, six fresh execution runs, and 12 real tracked defects.
- EN/VI workbooks are generated from the same case IDs and execution facts.

## Current artifacts

| Deliverable | EN | VI |
| --- | --- | --- |
| Test Scenario v0.3 | `Test_Scenario_IDTS_SAP01_en_v0.3.xlsx` | `Test_Scenario_IDTS_SAP01_vi_v0.3.xlsx` |
| Unit Test v0.3 | `Unit_Test_IDTS_SAP01_en_v0.3.xlsx` | `Unit_Test_IDTS_SAP01_vi_v0.3.xlsx` |
| Functional Test v0.2 | `Functional_Test_IDTS_SAP01_en_v0.2.xlsx` | `Functional_Test_IDTS_SAP01_vi_v0.2.xlsx` |
| Test Report v0.3 | `Test_Report_IDTS_SAP01_en_v0.3.xlsx` | `Test_Report_IDTS_SAP01_vi_v0.3.xlsx` |
| UAT Prepared v0.2 | `UAT_IDTS_SAP01_en_prepared_v0.2.xlsx` | `UAT_IDTS_SAP01_vi_prepared_v0.2.xlsx` |
| Test And Fix Bug v0.5 | `Test_And_Fix_Bug_IDTS_SAP01_en_v0.5.xlsx` | `Test_And_Fix_Bug_IDTS_SAP01_vi_v0.5.xlsx` |

## Case and execution truth

| Metric | Result | Formula/scope |
| --- | ---: | --- |
| Planned cases | 27 | 5 Unit + 16 functional/API/UI + 6 UAT |
| Executed cases | 12 | `PASSED + FAILED` |
| Passed | 12 | Fresh evidence and required execution metadata present |
| Failed | 0 | Executed cases with failed outcome |
| Blocked | 0 | Cases blocked from execution |
| Not Run / Prepared | 15 | 9 `NOT_RUN` + 6 `PREPARED` |
| Case execution rate | 44.444% | `12 / 27` |
| Pass rate over executed | 100% | `12 / 12` |
| Planned requirement traceability | 100% | `32 / 32` requirements linked to at least one planned case |
| Executed requirement coverage | 53.125% | `17 / 32` requirements linked to a passed case |
| Suite execution rate | 100% | `6 / 6` exact npm commands executed |
| Automated assertion/check count | 160 | Fresh suite-reported or script-inspected checks |
| Defect count | 12 | Real tracked defects; no synthetic defect |

Case distribution:

- Unit: 5 `PASSED`.
- Functional/API/UI/programmatic: 7 `PASSED`, 9 `NOT_RUN`.
- UAT: 6 `PREPARED`; actual result, defect, decision, tester, execution date, and sign-off remain blank.

## Fresh command evidence

| Command | Exit | Result | Limitation |
| --- | ---: | --- | --- |
| `npm run qa:auth:programmatic` | 0 | 28 pass, 0 fail, 0 skipped | Local in-memory SQLite |
| `npm run qa:email-outbox:programmatic` | 0 | 58 checks, 0 fail | Fake transport; live disabled rows remain skipped and are not claimed as PASS |
| `npm run qa:pm-monitoring:programmatic` | 0 | 20 pass, 0 fail | Programmatic local scope |
| `npm run qa:idts41:programmatic` | 0 | 18 pass, 0 fail | Programmatic local scope |
| `npm run qa:comments-attachments:programmatic` | 0 | 2 comment-persistence checks, 0 fail | Attachment HTTP flow remains `NOT_RUN` |
| `npm run qa:idts64:programmatic` | 0 | 34 pass, 0 fail | Mock/fake AI provider; no live OpenAI or full Fiori human-review claim |

Compilation is not counted as a test suite.

## Requirement traceability

All 32 requirements have planned traceability. The executed/not-run split is explicit:

- Passed coverage: create, required-field and catalog validation, create authorization, transition validation, comments/no-status-change, in-app notification, email outbox/isolation, login/session/Bearer authorization, PM filters/workload/action queues, AI no-mutation, and AI safe-data boundary.
- Planned but not yet executed: duplicate checking, classification/assignment/reassignment/Pending Assignment, Developer review, Request More Information, rejection/follow-up, Resolve/Retest/Close/Reopen, full attachment persistence, and full Fiori AI human-review UI.
- Every uncovered execution path remains `NOT_RUN` or UAT `PREPARED`; it is not hidden or converted to PASS.

The detailed requirement → scenario/case → latest status → defect → evidence mapping is in the Test Scenario and Test Report traceability sheets.

## Content and format remediation

- Test Scenario now separates test data, numbered steps, and predicted result; the predicted-result column is populated in EN/VI.
- Unit Test contains true module-level input/assertion/actual/evidence rows; regression suites are not mislabeled as Unit.
- Functional Test records actor, initial state, preconditions, concrete data, numbered steps, checkpoints, actual result, persistence check, status, evidence, and defect ID.
- UAT remains Prepared but is executable by a mentor/user; no fabricated actual result or sign-off exists.
- Test Report reconciles detailed cases and separates execution rate, pass rate over executed cases, planned traceability, executed requirement coverage, suite execution rate, assertions, and defects.
- Test And Fix Bug contains 12 real defects with reproduce, expected/actual, environment, severity/priority, owner, requirement/case, evidence, fix/root cause, and retest fields; unused sample sheets were removed.
- No merged-cell blocks, vertical text, abnormal 200–300 point rows, row-1000 formatting tail, empty sample sheets, `#REF!`, placeholder, or forbidden authoring trace remains in the 12 current workbooks.

## Automated validation

`python scripts/sap490/validate-test-pack.py`

- Workbooks: 12
- Warnings: 0
- Errors: 0
- Result: PASS

The validator checks duplicate IDs, required requirement/step/result fields, valid statuses, execution evidence requirements, Pending/Prepared truth, defect links, EN/VI ID parity, report totals, coverage labels, placeholders, `#REF!`, authoring traces, merges, excessive dimensions/row heights, rotated text, filters, freeze panes, print areas, and unintended English generator labels in VI.

## Office and visual verification

- `officecli --version`: `1.0.140`.
- For each of the 12 files: `officecli validate <file>` exit 0; `officecli view <file> issues` found 0; `officecli close <file>` exit 0.
- LibreOffice `26.2.3.2` was used for cross-renderer round-trip/render verification.
- Full first visual pass: 98 rendered pages across all 12 workbooks.
- Scoped recheck after traceability correction: 50 pages across Unit/Functional/UAT EN/VI.
- Result: no clipping, one-character vertical wrapping, oversized merged result block, abnormal row height, blank template remnant, or unreadable one-paragraph evidence sheet.
- OfficeCLI is only one gate; content reconciliation, EN/VI parity, formula/statistic checks, LibreOffice rendering, and Google Sheets inspection were applied separately.

## Google Drive and Google Sheets

All updates used in-place Drive file replacement. Post-upload metadata and raw download sizes matched, and IDs/names/parents remained unchanged.

| Artifact | Drive ID | Size after upload |
| --- | --- | ---: |
| Scenario EN | `1z_P8xYfiEf4-B5wv2h8Vipj_tdcVKBSx` | 23,619 |
| Scenario VI | `1vxufjbEuFbrn2AJ0E0uwLXDytmGGZ8io` | 24,098 |
| Unit EN | `1wyno-7uTUudV_T_cB2VWSSP6a8yWsA0T` | 17,902 |
| Unit VI | `1hqAdhMYZHo2Ah4J_OYNfmVV7ZhG2_KF6` | 18,204 |
| Functional EN | `10euD4971cy857onC-wd5wDE-paAVPPne` | 25,556 |
| Functional VI | `1dnVVOtHv8mVwxYNM3_AKPeEdDy3xwwJF` | 26,041 |
| Report EN | `12ysnM_7KekEbwM5mCmgeacwCUEqIrOb_` | 44,916 |
| Report VI | `14QABwYHkir1cHuYpYqJyeKRquAzVH7aS` | 45,462 |
| UAT EN | `1p4l2i3DAn6ingrRdSJ2pmw4Kan6X2hWR` | 16,772 |
| UAT VI | `1Yy21d944EDhvc0m8UfDRYVJUzDWaptZQ` | 17,189 |
| Defect EN | `1fIs5OVOgXw1VoWDSzbcTMJiASr3cYZy5` | 15,837 |
| Defect VI | `1r1-Zeif2Vq9RMQ8fDQ8BtOMz_QPBiG6G` | 16,161 |

Google Sheets result:

- 12/12 raw XLSX files opened in the Google Sheets viewer as `.xlsx` and showed `Đã lưu vào Drive`.
- Covers and tab structures were checked for EN/VI.
- Critical views checked: Test Scenario predicted result, UAT case table, Test Report metrics, and detailed defect table.
- Mentor Index `1hMYNKK42HUP3htKbZ1ylYL0SHkCJczK165pxStXNkXk` was updated and read back at exact ranges; its verdict/Drive control/test rows were visually checked after wrap/row-height repair.
- Initial import and screenshot calls were intermittently slow, but subsequent live renders and screenshots succeeded. This was a browser-capture tooling issue, not a workbook/data defect.

## EN/VI parity

- Same case IDs, requirement IDs, statuses, suite facts, defects, and report totals: PASS.
- VI generator-owned labels and flow text localized while technical IDs, commands, status enums, and the exact Knowledge Gate text remain unchanged: PASS.
- No unintended English generator label detected by the validator: PASS.

## Remaining limitations

- UAT execution and mentor sign-off are pending.
- Nine functional/UI/live-provider paths remain `NOT_RUN`.
- Live Brevo/email provider, live OpenAI provider, attachment HTTP, and complete Fiori human-review UI acceptance are not established by the fresh local suites.
- Final Project Report remains a template and is not complete.
- Knowledge Gate remains `IN PROGRESS — handled in dedicated learning thread`.
