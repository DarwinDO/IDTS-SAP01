# IDTS-108 — Technical Specification screens and collaboration package

- Owner: SangVN
- Support: DonHV for database evidence
- Due: 2026-07-30
- Status: Blocked by IDTS-105 and IDTS-106
- Jira: https://dutassociation.atlassian.net/browse/IDTS-108

## Gate sequence

1. Agent prepares Screen Layout/Definition and collaboration candidate evidence.
2. SangVN reviews and records Jira + repo approval.
3. Approved package is handed to IDTS-112 integration.

## Scope

Classification, assignment/Smart Assign, lifecycle UI, comments, attachment UI,
history UI, Object Page sections and UI/network/role evidence.

## Candidate progress — 2026-07-31

- Jira execution state: `In Progress`; local PM board remains `Blocked` for finalization because the dependency gates are still open.
- Branch: `docs/idts-108-screen-definitions-sangvn`
- Baseline: latest fetched `origin/dev` commit `5807313`
- Candidate package: `docs/pm/evidence/idts-108/README.md`
- Prepared: natural-numbered Screen Layout inventory, field/action-level Screen Definition inventory, Technical Implementation source trace, evidence register, and SangVN review checklist.
- Developer and Tester evidence prepared as partial: forty-seven sanitized BTP screenshots covering login/validation states, bidirectional Tester/Developer account switching, role List Reports, role dashboards, Object Page ownership states, lifecycle-action visibility and five parameter dialogs, comments, attachments, history, notifications, the post-rollout access regression, both Pending Assignment and Assigned Create/Reload variants, read-only Similar Bugs, Classification Suggestions, Handoff Summary and Smart Assign dialogs, and the BUG-0024 OData `$batch` reload response/headers.
- Deliberately not prepared as final: PM role evidence, Network evidence, mutating action results, DonHV database/provider evidence, template insertion, and any human approval statement.

## Current gates and handoff

- SangVN personally acknowledged the IDTS-105/shared-artifact workflow in Jira comment `10780` and updated the repository acknowledgment register to `READ`. This satisfies the briefing gate but is not candidate approval.
- IDTS-106 English-only cleanup remains a dependency before final template integration.
- The candidate contains explicit `MISSING EVIDENCE` markers so absent runtime and database proof cannot be mistaken for verified evidence.
- Developer screenshots are marked `PARTIAL`; the failed comment flow is tracked by IDTS-116, the failed attachment flow by IDTS-113, and the logout/re-login failure by IDTS-117. IDTS-39 is related but not a duplicate. These captures do not substitute for remaining Network, successful action, persistence/reload or database evidence.
- A Tester credential was supplied for evidence. The first attempt incorrectly started at standalone IDTS `login.html`; its result/screenshot were withdrawn and corrected in Jira comment `10784`. The correct SAP BTP/approuter flow then authenticated successfully and produced Tester List Report, Dashboard, Object Page, Close dialog and Reopen dialog captures without mutation. PM access is still unavailable. SangVN may finish and hand off the currently executable role/source work, but the package is only `ready with documented blockers`, not full PASS/Done or final-approved.
- SangVN authorized creation of a dedicated test Bug for Create-flow evidence. After the earlier Tester tab was cleaned up, a fresh BTP tab and the source-defined `/do/logout` flow repeatedly returned the safe access alert; even a user-visible SAP Account logout/profile reauthentication did not restore the IDTS role shell. No Bug or draft was created, and Create evidence remains blocked by IDTS-117 until an authenticated Tester shell is restored.
- DonHV marked IDTS-117 Done after rollout acceptance comment `10804`, but the 2026-08-01 19:19 retest produced a blank shell/safe access alert after SangVN switched between two authorized accounts through logout/login. Sanitized evidence `27-tester-post-rollout-access-blocker.png` was saved, regression comments `10806` and `10807` were added to the matching issue, and IDTS-117 was reopened to `In Progress`. No duplicate bug or application data was created.
- A later direct Tester sign-in succeeded. The authorized evidence flow created `BUG-0023` as `Pending Assignment`; screenshots 29–33 prove empty form, nine required-field validations, valid value-help selections, Object created, and persistence after full reload. Jira IDTS-108 comment `10809` records the result. The direct login success does not close IDTS-117 cross-account switching.
- Screenshot 34 proves the normal Similar Bugs dialog on BUG-0023; screenshot 42 proves BUG-0024 Classification Suggestions; screenshot 45 proves Handoff Summary; screenshot 47 proves the filtered Smart Assign candidate explanation with capability, availability, confidence and manual-choice controls. All remained read-only with no review, apply, assign or duplicate-confirmation mutation. The fallback, review persistence and AI Network variants remain missing.
- A second authorized Tester draft completed the Assigned-save variant after SangVN manually selected the three SAP value-help entries that the browser-control layer could not activate: IDTS Bug Report, SAP CAP Backend and SangVN. Screenshots 35–38 prove the sanitized draft, selected technical assignee, active BUG-0024 in Assigned status, SangVN as technical/current owner, and persistence after full reload. The first Create attempt safely failed validation because Steps to Reproduce and Actual Result had not remained committed across section navigation; re-entering and blurring those fields resolved it before the successful activation.
- SangVN captured the corresponding Edge DevTools Network evidence. Screenshot 40 shows `POST /odata/v4/bug/$batch` and outer `200 OK`; screenshot 39 shows the inner `HTTP/1.1 200 OK` OData response with BUG-0024, status `ASSIGNED`, SangVN technical/current ownership, Developer next role and `IsActiveEntity:true`. No Cookie, Authorization, token, password or email is visible. This closes only the BUG-0024 reload/read Network slice; the remaining traced functions stay open.
- The 30-row Technical Implementation trace was rechecked against current source and now includes a compact line-level anchor table for authentication, draft/create, lifecycle/assignment, four AI flows, collaboration, history/notifications and dashboard/metrics. Source existence is verified separately from runtime evidence; no missing runtime row was upgraded merely because its code anchor exists.
- DonHV owns the deferred database/provider evidence and later IDTS-112 integration after SangVN review/approval. Deferral is allowed for SangVN's handoff, but that evidence must be supplied or explicitly accepted before final completion.

## Verification evidence — 2026-07-31

- `officecli --version` -> `1.0.143` (documentation preflight PASS; OfficeCLI was not used to author Markdown because no native Markdown edit route was needed).
- `npm run qa:secret-scan` -> PASS.
- `npm run qa:agent-rules` -> PASS.
- `npx ai-devkit@latest lint --json` -> PASS, 5/5 checks.
- `npx cds compile srv --to edmx -s all` -> exit 0 with one pre-existing attachment vocabulary warning recorded in SangVN status.
- `npx ui5 build --config ui5.yaml --clean-dest` from `app/bug-management-ui` -> PASS.
- `git diff --check` -> PASS; legacy primary prefixes `FN-`, `FLOW-`, and `SCR-` -> 0 matches in the candidate.
- Current BTP evidence: forty-seven accepted PNG files under `docs/pm/evidence/idts-108/screenshots/`; login captures contain only blank fields or `developer@example.invalid`, with no password/token/real identifier visible. The incorrect standalone-IDTS Tester capture was withdrawn. Tester/Developer captures 22–47 contain no credential-bearing page. Screenshot 27 records the post-switch access blocker; 28–33 prove direct login plus BUG-0023 Pending Assignment create/reload; 34 proves Similar Bugs; 35–38 prove BUG-0024 Assigned create/reload; 39–40 prove its OData `$batch` response/headers; 41–42 prove a fresh Tester shell and Classification Suggestions; 43–44 prove Tester→Developer role shell/dashboard; 45 proves Handoff Summary; 46 proves Developer→Tester dashboard; 47 proves filtered Smart Assign. Authorized Developer comment/upload attempts failed without persistence. Five lifecycle dialogs were dismissed without submission; BUG-0003 remained `In Progress` and BUG-0011 remained `Retest Required`.
