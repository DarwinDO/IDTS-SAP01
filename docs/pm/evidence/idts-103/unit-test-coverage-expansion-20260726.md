# IDTS-103 Unit Test Coverage Expansion — 2026-07-26

## Scope and baseline

- Baseline commit: `c4815475b5f62698de2efcdf212deaee5fef7000`.
- Scope: expand the official Unit Test EN/VI workbooks and their reproducible generator only.
- Runtime impact: none; `app/`, `srv/`, and `db/` were not changed.

## Test truth

- Total Unit Test specifications per workbook: **26**.
- Existing executed cases retained as `Passed`: **5** (`UT-AI-001` to `UT-AI-005`).
- Newly specified cases retained as `Pending / Not Run`: **21**.
- The new cases cover authentication, validation, authorization, lifecycle, history, attachments, and email/outbox.
- No pending case was promoted to `Passed`, and no evidence was fabricated.

## Verification

- OfficeCLI `1.0.141`: EN PASS, VI PASS.
- SAP490 test-pack validator: 12 workbooks, 0 warnings, 0 errors.
- Template fidelity: PASS after restoring explicit `fitToWidth=1` for the Unit Test tab.
- Evidence contract: PASS.
- Secret scan: PASS.
- Local SHA-256:
  - EN: `643E08F2DB948DCFC296605CE6CB6A044524530D33D38F6A18A7206463FC8C69`.
  - VI: `136D10869BC00C7A38B417160D675D5AA443B1C138526EEA14B8E24733BD896E`.

## Google Drive update

- EN file ID: `1wyno-7uTUudV_T_cB2VWSSP6a8yWsA0T`.
- VI file ID: `1hqAdhMYZHo2Ah4J_OYNfmVV7ZhG2_KF6`.
- Both files were replaced in place and renamed with date `20260726`.
- Parent folder, XLSX MIME type, file IDs, and existing permissions were preserved.
- Metadata size readback matched local bytes: EN 40,215 bytes; VI 40,561 bytes.

## Tooling note

- Google Sheets cell APIs cannot inspect raw Office XLSX files and returned `FAILED_PRECONDITION`; this is a connector limitation, not a workbook defect. OfficeCLI, local workbook inspection, validator results, and Drive metadata readback were used instead.
