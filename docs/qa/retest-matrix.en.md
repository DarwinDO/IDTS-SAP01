# IDTS Retest Matrix

Last updated: 2026-06-18
Owner: DonHV

## Purpose

This matrix is the current source for Sprint 02 retest planning after the latest backend hardening, comment/attachment completion, and audit/UI refinements.

It is intended to drive:

- local backend verification,
- HTTP attachment/comment verification,
- mentor demo walkthrough preparation,
- later SAP490 `Unit_Test`, `Functional_Test`, and official test report updates.

## Test Layers

| Layer | Scope | Preferred execution |
| --- | --- | --- |
| Programmatic backend | status transitions, validation rules, derived fields, history/notification side effects | `node scripts/qa/test-idts6-programmatic.js` |
| HTTP integration | draft attachment upload/download, comment action, active persistence | `powershell -ExecutionPolicy Bypass -File scripts/qa/test-comments-attachments.ps1` |
| Manual Fiori UI | create page flow, value help behavior, action visibility, table rendering, UX quality | Browser QA executed on the local stack; rerun after each FE polish change |
| Static UI audit | annotation/layout review for discoverability and UX consistency | local code review in `annotations.cds`, `manifest.json`, `service.cds` |

## Scenario Matrix

| Scenario | Persona | Scope | Verify by | Expected result |
| --- | --- | --- | --- | --- |
| SC-01 | Tester | Create bug without assignee | programmatic + manual UI | bug saves successfully with `PENDING_ASSIGNMENT` |
| SC-02 | Tester | Create bug with assignee | programmatic + manual UI | bug saves successfully with `ASSIGNED` |
| SC-03 | Tester | Upload draft attachment | HTTP + manual UI | attachment is visible before save, remains after activation, downloads successfully |
| SC-04 | Tester / PM / Developer | Add comment | HTTP + manual UI | comment row appears with readable author name and history entry |
| SC-05 | Tester / PM | Assign Developer | programmatic + manual UI | assignee changes, status becomes `ASSIGNED`, notification exists |
| SC-06 | Assigned Developer | Mark In Review | programmatic + manual UI | status becomes `IN_REVIEW` |
| SC-07 | Assigned Developer | Start Progress | programmatic + manual UI | status becomes `IN_PROGRESS` |
| SC-08 | Assigned Developer / Tester | Request More Information and Resubmit | programmatic + manual UI | request-info path moves to `NEED_MORE_INFORMATION`; resubmit path brings the bug back to `ASSIGNED` with follow-up comment/notification |
| SC-09 | Assigned Developer | Reject Bug | programmatic + manual UI | with reason: `REJECTED`; without reason: reject |
| SC-10 | Tester / PM | Move to Pending Assignment | programmatic + manual UI | assignee clears and status becomes `PENDING_ASSIGNMENT` |
| SC-11 | Assigned Developer | Resolve Bug | programmatic + manual UI | with note: `RESOLVED`; without note: reject |
| SC-12 | Tester / PM | Send to Retest or Close | programmatic + manual UI | valid path can move bug to `RETEST_REQUIRED` or close directly from `RESOLVED` |
| SC-13 | Tester / PM | Reopen Bug | programmatic + manual UI | with reason: `REOPENED`; without reason: reject |
| SC-14 | Any allowed role | Audit and notification verification | programmatic + HTTP + manual UI | grouped history and readable notifications exist for important events |

## Detailed Retest Cases

| Case ID | Scenario | Preconditions | Method | Expected result |
| --- | --- | --- | --- | --- |
| SC-01a | Create bug without assignee | valid component/category pair, no assignee selected | backend + UI | persisted status is `PENDING_ASSIGNMENT` |
| SC-01b | Create bug missing title | all other required fields filled | backend + UI | request is rejected with validation error |
| SC-02a | Create bug with assignee | valid assignee mapped to selected classification | backend + UI | persisted status is `ASSIGNED` |
| SC-03a | Create draft attachment metadata | draft bug exists | HTTP + UI | attachment row exists in draft |
| SC-03b | Upload attachment binary | attachment metadata row exists | HTTP + UI | stream upload succeeds |
| SC-03c | Activate draft with attachment | draft has uploaded file | HTTP + UI | attachment remains visible after activation |
| SC-03d | Download active attachment | active bug has attachment | HTTP | downloaded bytes match uploaded content |
| SC-04a | Add comment | active bug exists | HTTP + UI | comment row appears |
| SC-04b | Verify comment history | comment has just been added | HTTP | history contains readable comment entry |
| SC-05a | Assign developer | bug in `PENDING_ASSIGNMENT` or assignable context | backend + UI | assignee saved, status changes, notification exists |
| SC-05b | Assign without parameter | action called without assignee ID | backend | request is rejected |
| SC-06a | Mark In Review | bug in `ASSIGNED` | backend + UI | status becomes `IN_REVIEW` |
| SC-07a | Start Progress | bug in `IN_REVIEW` | backend + UI | status becomes `IN_PROGRESS` |
| SC-08a | Request more info with reason | bug on valid developer path | backend + UI | status becomes `NEED_MORE_INFORMATION` |
| SC-08b | Request more info without reason | same as above | backend | request is rejected |
| SC-08c | Resubmit to developer | bug in `NEED_MORE_INFORMATION` | backend + UI | status becomes `ASSIGNED` again |
| SC-08d | Verify resubmit side effects | resubmit just executed | backend + UI | follow-up comment and developer notification both exist |
| SC-09a | Reject with reason | bug on valid developer path | backend + UI | status becomes `REJECTED` |
| SC-09b | Reject without reason | same as above | backend | request is rejected |
| SC-10a | Move to pending assignment | bug in `REJECTED` | backend + UI | status becomes `PENDING_ASSIGNMENT` and assignee is cleared |
| SC-11a | Resolve with note | bug in `IN_PROGRESS` | backend + UI | status becomes `RESOLVED` |
| SC-11b | Resolve without note | same as above | backend | request is rejected |
| SC-12a | Send to retest | bug in `RESOLVED` | backend + UI | status becomes `RETEST_REQUIRED` |
| SC-12b | Close bug | bug in `RESOLVED` | backend + UI | status becomes `CLOSED` |
| SC-13a | Reopen with reason | bug in close/retest path | backend + UI | status becomes `REOPENED` |
| SC-13b | Reopen without reason | same as above | backend | request is rejected |
| SC-14a | Verify grouped history | create, assign, comment, attachment, lifecycle actions already executed | HTTP + UI | history uses readable actor/field/value text and remains read-only |
| SC-14b | Verify notifications | assign / reject / request-info path already executed | HTTP + UI | notification rows show readable recipient/event names |

## Manual UI/UX Checklist

These items need browser-based retest, not only backend verification.

| ID | Check | Expected |
| --- | --- | --- |
| UX-01 | Create page section order | Bug Summary -> Classification and Assignment -> Reproduction and Test Context -> Evidence / Attachments |
| UX-02 | Required field signaling | every required create field shows clear mandatory signal |
| UX-03 | Assignee value help | rows are business-readable and classification-relevant |
| UX-04 | Attachment discoverability | upload control is clearly visible in create flow |
| UX-05 | Comment discoverability | user can clearly find how to add a comment |
| UX-06 | Header action clutter | only context-valid actions are visible per role/status |
| UX-07 | Read-only hardening | system-managed fields are not editable in normal edit mode |
| UX-08 | History readability | actor, field, old/new value, reason are human-readable |
| UX-09 | Notification readability | recipient and event labels are business-readable |

## Current UX Status

| Gap | Status | Recommended next step |
| --- | --- | --- |
| Assign Developer action parameter selected-text | Fixed (`IDTS-9`) | keep as regression check only; current live runtime shows the selected developer name (`DatDT`) |
| Comments section local `Add Comment` entry point | Fixed (`IDTS-11`) | keep as regression check only; no further action unless section CTA disappears again |

## Latest Browser Execution Note

Execution date: 2026-06-18 on `http://localhost:4004/idts.bugmanagementui/index.html?sap-ui-xx-viewCache=false`

- PASS: List Report loads and seed/demo rows are visible after `Go`.
- PASS: Create Bug `NewPage` opens with the expected section order.
- PASS: Valid value-help-driven classification selection works for create.
- PASS: Real file upload during create remains visible after save on the active Object Page.
- PASS: Add Comment persists and shows readable author text.
- PASS: Comments section now exposes a local `Add Comment` CTA near the table and it opens the action dialog successfully.
- PASS: Role-based action visibility is separated correctly for Tester, Developer, and PM.
- PASS: Developer `Start Progress` changes backend state successfully and the Object Page refreshes to the new status/button state immediately after submit.
- PASS: The focused create/classification browser probe no longer reproduces the earlier `componentCategory_ID` drill-down warning after the redundant derivation side effect was removed.
- PASS: the Assign Developer action parameter now renders the selected developer name instead of the UUID on the current verified runtime.

## SAP490 Sync Rule

After backend and UI retest execution is complete:

1. update this matrix if the flow changed,
2. fill `Unit_Test` with executed evidence,
3. fill the official SAP490 test report workbook with actual pass/fail counts,
4. append new defects to `Test_And_Fix_Bug`,
5. update PM status and handover docs.
