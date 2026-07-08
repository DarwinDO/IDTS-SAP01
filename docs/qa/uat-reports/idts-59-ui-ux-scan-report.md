# IDTS-59 UI/UX Scan Report

Date: 2026-07-08

Tester: SangVN lane, executed by Codex support

Environment: local `dev` branch on `localhost:4004`, commit `35516dc`

Jira: `IDTS-59` moved to In Progress. Follow-up evidence comment posted as Jira comment `10416`.

Pull request: https://github.com/DarwinDO/IDTS-SAP01/pull/104

Reviewer follow-up: DonHV Jira comment `10415` asked for reviewable evidence in repo/PR or Jira, screenshot/evidence summary, PR link when repo files changed, and a clear shared-QA statement.

## Scope Covered

This pass checked the completed Sprint 4 UI surfaces available on local `dev`:

| Surface | Positive check | Edge / break check | Result |
| --- | --- | --- | --- |
| Login | Valid PM/Tester/Developer login through custom login page | Wrong password and empty submit attempt | Pass |
| Profile / sign out | Profile button and sign-out menu visible | Back navigation after logout remains guarded by login page | Pass |
| Dashboard | Direct `dashboard.html` desktop and mobile render with tiles and needs-attention list | Narrow mobile viewport, profile/Refresh overlap check | Pass |
| Object Page | PM/Tester/Developer can open a known bug Object Page | Invalid bug route does not crash app | Pass |
| Comments | Comment section renders and HTTP add-comment creates comment/history | Long comment input retains 620 characters without layout break | Pass |
| Attachments | Evidence / Attachments section renders with Upload Evidence action | HTTP metadata, stream upload, activate, download, and history flow | Pass |
| Smart Assign | Smart Assign dialog opens from Assignee value help | Search for `SangVN` responds | Pass |

## Commands And Evidence

- `npm run dev:sqlite:refresh-views` -> pass.
- Local app probe `http://localhost:4004/idts.bugmanagementui/index.html` -> HTTP 200.
- First `npm run qa:idts57:browser` -> failed due missing Playwright Chromium runtime; fixed by `npx playwright install chromium`.
- Rerun `npm run qa:idts57:browser` -> pass for negative login, PM profile/list/Object Page, Smart Assign, reload persistence, invalid bug route, logout, Tester role, and Developer role.
- `npm run qa:idts60:browser` -> pass for PM login, Evidence / Attachments section rendering, Upload Evidence visibility, and logout.
- First `npm run qa:comments-attachments:http` -> failed HTTP 401 without bearer token; rerun with bearer token from `AuthService.login` -> pass for comment, comment history, attachment metadata, upload, activation, download, and attachment history.
- Custom IDTS-59 responsive probe -> pass:
  - `MOBILE_PROFILE_REFRESH_OVERLAP=false`
  - `BACK_AFTER_LOGOUT_GUARDED=true`
  - `LONG_COMMENT_INPUT_LENGTH=620`
  - `VISIBLE_INTERNAL_TEXT_FOUND=false`
  - `HTTP_5XX_COUNT=0`
  - `PAGE_ERROR_COUNT=0`
- Dashboard-specific probe -> pass:
  - `DESKTOP_HAS_DASHBOARD=true`
  - `MOBILE_HAS_DASHBOARD=true`
  - `DESKTOP_PROFILE_REFRESH_OVERLAP=false`
  - `HTTP_5XX_COUNT=0`
  - `PAGE_ERROR_COUNT=0`

Screenshot evidence was generated locally under:

- `scripts/qa/uat-evidence/idts-57/`
- `scripts/qa/uat-evidence/idts-60/`
- `scripts/qa/uat-evidence/idts-59/`

These folders are local QA evidence and should be uploaded to Jira manually if needed; do not include passwords, bearer tokens, or private environment data.

## Shared QA Route Smoke

The shared QA Render app public routes were checked without credentials:

- `https://idts-sap01-qa.onrender.com/idts.bugmanagementui/login.html` -> HTTP 200.
- `https://idts-sap01-qa.onrender.com/idts.bugmanagementui/dashboard.html` -> HTTP 200.

This confirms the shared QA UI routes are reachable. It does not replace the authenticated shared-QA UI/UX scan because private Render QA login credentials/session are not stored in the repository and were not available in this Codex session.

## Findings

No product defect was reproduced in the local `dev` pass.

Resolved during this session:

- Environment/tooling issue: missing Playwright Chromium runtime.
- Test-harness issue: comments/attachments HTTP script requires bearer token under custom auth.
- Test-harness issue: first custom responsive probe used the wrong Playwright viewport API.

## Limitation

This was primarily a local `dev` UI/UX scan plus unauthenticated shared-QA route smoke. The original IDTS-59 scope asks for shared QA. Full authenticated shared-QA execution still requires private Render QA login credentials/session that are not stored in the repository and were not available in this Codex session.
