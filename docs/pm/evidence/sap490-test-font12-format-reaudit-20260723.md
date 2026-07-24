# SAP490 Test Pack Font-12 and Format Re-audit — 2026-07-23

## Verdict

`CONDITIONALLY READY — UAT execution and mentor sign-off pending`

This evidence closes the font/readability defect reported from Google Sheets. It does not claim UAT execution, mentor sign-off, Final Project Report completion, a Knowledge Gate result, or any runtime behavior change.

Knowledge Gate remains:

`IN PROGRESS — handled in dedicated learning thread`

## Scope and safety

- Scope: the 12 current Test Scenario, Unit Test, Functional Test, Test Report, UAT Prepared, and Test And Fix Bug workbooks in EN/VI; their generator/validator; same-ID Drive copies; and PM evidence.
- Pre-change snapshot: `E:\IDTS-SAP01-backups\sap490-before-font12-20260723-171713`.
- Snapshot verification: 12/12 files copied, 0 missing, 0 hash mismatch.
- No Drive file was copied or deleted.
- Workshop EN/VI, Blueprint EN/VI, `app/`, `srv/`, and `db/` were not changed.
- Workshop metadata readback remained unchanged: EN `1ryHhjqcPAujoojvvA_NQmY9UxD8SdRwN` = 9,982,093 bytes and VI `1brySv4cAR6MK5YFFkzoqcwZsqimCEl66` = 9,982,381 bytes, both with their original 2026-07-10 modified timestamps and archive parent.
- Blueprint EN/VI SHA-256 values matched the verified pre-task working-tree snapshot exactly.
- No stage, commit, push, merge, PR, Jira learning/behavior transition, or Jira Done transition was performed.

## Finding and remediation

The user screenshot showed the current Functional Test workbook rendered with body fonts below 12pt and the Result value `Passed` wrapping as `Pass` / `ed`. A complete local scan confirmed this was systemic:

- Populated cells scanned before remediation: 2,934.
- Populated cells below 12pt: 2,610.
- Affected artifacts: all 12 current workbooks.

The generator now applies a minimum 12pt Normal style and minimum 12pt font to every populated mentor-facing cell while preserving bold, italic, color, family, and other font properties. Column widths, row heights, and dense content blocks were adjusted at generator source. Functional and Unit case descriptions were de-duplicated without removing canonical catalog fields, so the official template remains readable at 12pt. The validator now fails on any populated cell below 12pt and on format-height regressions.

Post-remediation scan:

- Populated cells: 2,934.
- Populated cells below 12pt: 0.
- Normal styles below 12pt: 0.
- Rotated populated cells: 0.

## Current workbooks

| Deliverable | Language | Version | Drive ID |
| --- | --- | --- | --- |
| Test Scenario | EN | v0.3 | `1z_P8xYfiEf4-B5wv2h8Vipj_tdcVKBSx` |
| Test Scenario | VI | v0.3 | `1vxufjbEuFbrn2AJ0E0uwLXDytmGGZ8io` |
| Unit Test | EN | v0.3 | `1wyno-7uTUudV_T_cB2VWSSP6a8yWsA0T` |
| Unit Test | VI | v0.3 | `1hqAdhMYZHo2Ah4J_OYNfmVV7ZhG2_KF6` |
| Functional Test | EN | v0.2 | `10euD4971cy857onC-wd5wDE-paAVPPne` |
| Functional Test | VI | v0.2 | `1dnVVOtHv8mVwxYNM3_AKPeEdDy3xwwJF` |
| Test Report | EN | v0.3 | `12ysnM_7KekEbwM5mCmgeacwCUEqIrOb_` |
| Test Report | VI | v0.3 | `14QABwYHkir1cHuYpYqJyeKRquAzVH7aS` |
| UAT Prepared | EN | v0.2 | `1p4l2i3DAn6ingrRdSJ2pmw4Kan6X2hWR` |
| UAT Prepared | VI | v0.2 | `1Yy21d944EDhvc0m8UfDRYVJUzDWaptZQ` |
| Test And Fix Bug | EN | v0.5 | `1fIs5OVOgXw1VoWDSzbcTMJiASr3cYZy5` |
| Test And Fix Bug | VI | v0.5 | `1r1-Zeif2Vq9RMQ8fDQ8BtOMz_QPBiG6G` |

All 12 files were updated in place. Readback preserved every listed ID, filename, XLSX MIME type, and parent. Drive-reported sizes matched local bytes for all 12 files.

## Validation results

- OfficeCLI preflight: `officecli --version` → `1.0.140`.
- Template fidelity: PASS 12/12.
- Canonical content/format validator: PASS 12/12, 0 warnings, 0 errors.
- OfficeCLI: `validate` exit 0 and `view issues` returned zero issues for 12/12; all files were closed afterward.
- Font scan: 2,934 populated cells, 0 below 12pt, 0 rotated.
- LibreOffice conversion: 12/12 XLSX converted successfully.
- Cross-renderer visual review: PASS for 12/12 workbooks and 94/94 PDF pages.
- Google Sheets: PASS for the critical content sheet in all 12 Drive files at 100% zoom. Functional EN/VI no longer split `Passed`; Test Statistics percentages remain `44.44%` and `100.00%` without duplication; UAT remains Prepared.
- EN/VI parity: PASS; matching case IDs, status truth, metrics, and sheet contracts remain aligned.

OfficeCLI is a structural/format gate, not the sole quality proof. The verdict also uses the canonical validator, font inventory, template-fidelity test, LibreOffice page review, Drive metadata/byte-size readback, and live Google Sheets inspection.

## Execution truth retained

- Planned cases: 27.
- Executed cases: 12.
- Passed: 12.
- Failed: 0.
- Blocked: 0.
- Not Run: 9.
- UAT Prepared: 6.
- Case execution rate: `12 / 27 = 44.44%`.
- Pass rate over executed cases: `12 / 12 = 100.00%`.
- Exact npm suites executed: 6/6.
- Automated checks/assertions: 160.
- Traceable real defects: 12.

No Pending, Not Run, Prepared, skipped-provider path, compile command, or unexecuted UI/UAT case was converted to Pass.

## Tooling observations

- The initial Vietnamese font inventory hit a Windows console `UnicodeEncodeError`; rerunning with UTF-8 output completed without changing artifacts.
- The first generator rerun exposed a missing `get_column_letter` import; the import was added and the complete pipeline was rerun before Drive update.
- A validator row-height rule for Functional Test Result remained at 90pt while the deliberate 12pt layout uses 95pt; the narrow sheet-specific allowance was corrected to 100pt.
- LibreOffice returned exit 0 and complete output while emitting its known `Could not find platform independent libraries <prefix>` warning.
- The first local MD5/size PowerShell readback used an invalid pipeline after `foreach`; the corrected variable-based command completed. No artifact or Drive content changed during the failed command.
- Google Sheets logged non-blocking viewer console noise while each file rendered and remained saved on Drive; no workbook content or layout failure was observed.
- Final `git diff --check` exited 0 and reported only existing Windows LF→CRLF working-copy warnings; there was no whitespace error.

## Remaining limitations

- Six UAT cases are Prepared only; actual result, defect, acceptance decision, tester/date, and sign-off remain intentionally blank.
- Nine functional/UI/live-provider cases remain Not Run.
- Live email/OpenAI provider behavior, attachment HTTP acceptance, and full Fiori UI/UAT are outside the passed local execution scope.
- Final Project Report remains a template.
- Knowledge Gate remains `IN PROGRESS — handled in dedicated learning thread`.
