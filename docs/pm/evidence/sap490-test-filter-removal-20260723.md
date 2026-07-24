# SAP490 test workbook AutoFilter removal — 2026-07-23

## Verdict

`CONDITIONALLY READY — UAT execution and mentor sign-off pending`

Knowledge Gate: `IN PROGRESS — handled in dedicated learning thread`.

## Scope and cause

- Scope: the 12 current SAP490 test workbooks only.
- User-visible defect: Google Sheets rendered repeated green filter controls across merged headers, spacer columns, and empty result-entry areas.
- Root cause: `scripts/sap490/generate-review-test-pack.py` assigned broad worksheet `auto_filter.ref` ranges to official-template layouts containing many narrow physical columns.
- Source fix: final save now removes worksheet and table AutoFilters from every generated sheet.
- Regression gate: `scripts/sap490/validate-test-pack.py` fails on any worksheet or table AutoFilter.
- Official template structure, content, Workshop, Blueprint, and runtime code were not changed by this correction.

## Safety and before/after inventory

- Pre-change backup: `E:\IDTS-SAP01-backups\sap490-before-filter-removal-20260723-190428`.
- Backup verification: 12/12 files, 0 SHA-256 mismatches.
- Before: 36 worksheet AutoFilters on 36 sheets; 0 table AutoFilters.
- After: 12 workbooks, 48 sheets, 0 worksheet AutoFilters, 0 table AutoFilters, and 0 raw `<autoFilter>` XML nodes.

## Verification

- Generator: PASS; regenerated the explicit 12-file allowlist.
- LibreOffice round-trip: PASS 12/12. Warning retained: `Could not find platform independent libraries <prefix>`; all outputs existed and were non-empty.
- OpenXML normalization: PASS 12/12.
- Official template-fidelity regression: PASS 12/12.
- Content validator: 27 catalog cases, 32 requirements, 12 defects, 12 workbooks, 0 warnings, 0 errors.
- Font/rotation gate: 2,934 populated cells, 0 below 12pt, 0 rotated.
- OfficeCLI 1.0.140: PASS 12/12; `validate` exit 0, `view issues` reported 0, and `close` exit 0 for every file.
- PDF visual review: PASS 12/12 workbooks and 94/94 pages; no repeated filter controls, vertical character wrapping, clipping, or template replacement observed.
- Google Sheets Office viewer: updated XLSX files opened successfully; direct critical-grid checks showed clean headers without the repeated green controls. The Sheets API metadata endpoint cannot inspect Office files and returned the expected `FAILED_PRECONDITION`; exhaustive proof therefore uses the 48-sheet OpenXML audit plus live viewer spot checks.

## Drive same-ID update

All 12 binaries were replaced in place. Names, XLSX MIME types, parents, and IDs were preserved; post-upload sizes matched the local files. No copy, move, conversion, duplicate, or delete was performed.

| Deliverable | Language | Drive ID | Post-upload bytes |
| --- | --- | --- | ---: |
| Test Scenario v0.3 | EN | `1z_P8xYfiEf4-B5wv2h8Vipj_tdcVKBSx` | 41,978 |
| Test Scenario v0.3 | VI | `1vxufjbEuFbrn2AJ0E0uwLXDytmGGZ8io` | 42,303 |
| Unit Test v0.3 | EN | `1wyno-7uTUudV_T_cB2VWSSP6a8yWsA0T` | 30,732 |
| Unit Test v0.3 | VI | `1hqAdhMYZHo2Ah4J_OYNfmVV7ZhG2_KF6` | 30,966 |
| Functional Test v0.2 | EN | `10euD4971cy857onC-wd5wDE-paAVPPne` | 59,045 |
| Functional Test v0.2 | VI | `1dnVVOtHv8mVwxYNM3_AKPeEdDy3xwwJF` | 59,268 |
| Test Report v0.3 | EN | `12ysnM_7KekEbwM5mCmgeacwCUEqIrOb_` | 47,952 |
| Test Report v0.3 | VI | `14QABwYHkir1cHuYpYqJyeKRquAzVH7aS` | 48,325 |
| UAT Prepared v0.2 | EN | `1p4l2i3DAn6ingrRdSJ2pmw4Kan6X2hWR` | 39,760 |
| UAT Prepared v0.2 | VI | `1Yy21d944EDhvc0m8UfDRYVJUzDWaptZQ` | 40,030 |
| Test And Fix Bug v0.5 | EN | `1fIs5OVOgXw1VoWDSzbcTMJiASr3cYZy5` | 13,373 |
| Test And Fix Bug v0.5 | VI | `1r1-Zeif2Vq9RMQ8fDQ8BtOMz_QPBiG6G` | 13,574 |

## Controls

- `git diff --check`: exit 0; existing LF→CRLF warnings only.
- `git diff -- app srv db`: empty.
- `git status --short -- app srv db`: empty.
- Staged file list: empty.
- No commit, push, merge, PR, Jira transition, or Knowledge Gate PASS/FAIL evaluation.

## Remaining limitation

- Six UAT cases remain `Prepared`; actual result, acceptance decision, tester/date, defects, and sign-off remain intentionally blank until real execution.
