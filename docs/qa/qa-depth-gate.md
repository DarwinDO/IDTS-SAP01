# QA Depth Gate for IDTS

## Purpose

The QA Depth Gate exists because a normal happy-path test can look clean while still missing the kind of issues found during IDTS-32 manual UAT: confusing Create permissions, duplicate History sections, invalid value entry, stale UI state, and unclear action wording.

For every PR that touches `app/`, `srv/`, `db/`, or `scripts/qa/`, the author must provide evidence from two modes:

1. Deterministic regression: commands or scripted checks that prove known behavior still works.
2. Falsification-first exploratory testing: explicit attempts to break the feature.

Vietnamese: QA Depth Gate ton tai vi happy-path test co the pass nhung van bo sot cac loi nhu IDTS-32: Create permission gay roi, History bi trung, value sai van nhap duoc, UI state stale, hoac wording action khong ro. Moi PR cham vao `app/`, `srv/`, `db/`, hoac `scripts/qa/` phai co regression evidence va evidence co gang pha feature.

## Required evidence groups

| Group | What to prove | Example |
| --- | --- | --- |
| Positive | The intended happy path works. | Tester creates a bug with valid catalog values. |
| Invalid / boundary input | Bad input is rejected cleanly. | Unknown priority code returns 400 and does not persist. |
| Role / authorization | Each relevant role sees and can do only what it should. | Developer cannot create; Tester/PM can. |
| Persistence / reload | The result survives reload/read-back. | Save, reload, and read the same value from OData/UI. |
| Repeated / interrupted action | Re-clicks, stale state, or interrupted flows do not corrupt data. | Submit twice, reload between action and read-back. |
| Failure / recovery | Expected failures produce safe messages and do not break unrelated work. | SMTP fail marks delivery FAILED but bug workflow commits. |
| UI/UX consistency and accessibility | The screen is readable, direct, and consistent with SAP Fiori expectations. | One History section, clear action labels, inline field errors. |

## PASS rule

A PR cannot claim PASS only from the happy path. If no bug is found, the PR must state:

- what was tried to break the change;
- what was not tested;
- why any `N/A` section is genuinely not applicable;
- whether any product defect was opened in Jira.

`N/A` without a reason fails the gate.

## Browser QA minimum

Browser QA scripts should use the shared helper in `scripts/qa/lib/browser-harness.js` or equivalent checks:

- capture `pageerror`;
- fail on unexpected console errors;
- fail on HTTP 5xx and unexpected 4xx;
- detect SAP error dialogs/message boxes;
- allow known local UI5 preview fallbacks only when explicitly classified;
- capture screenshots on failure;
- for persistence risk, perform save -> reload -> read-back.

## Execution lanes

| Lane | Purpose | Recommended checks |
| --- | --- | --- |
| Local fast | Developer loop before PR. | Focused script, CAP compile, relevant browser smoke. |
| PR gate | Protect `dev`. | PR body evidence check, focused backend/API tests, UI5 build, secret scan. |
| Scheduled / nightly | Broader QA sweep. | Full persona browser UAT, deeper exploratory checklist, report missing PRs/branches. |
| Release / mentor demo | Final confidence proof. | End-to-end happy flow plus negative role/input checks. |

Vietnamese: Local fast la vong lap nhanh cho dev. PR gate bao ve `dev`. Scheduled/nightly dung cho sweep rong hon. Release/mentor demo la bang chung cuoi cung truoc demo.
