# 01 - MVP Scope

Status: BA baseline draft v1  
Last updated: 2026-06-01

## Purpose

IDTS is an Issue and Defect Tracking System for SAP software testing. The MVP should let the team record, classify, assign, review, track, retest, close, and monitor defects without becoming a full ALM or project-management platform.

## Must Have for MVP

| Area | MVP scope |
| --- | --- |
| Bug reporting | Tester creates a bug with title, description, priority, severity, environment, reproduction steps, actual result, expected result, and optional evidence/test references. |
| Duplicate checking | Tester can search existing bugs before creating a new one. MVP can be manual search/filter, not AI duplicate detection. |
| Classification | Bug is classified by optional SAP Module, required Application Component, and required Defect Category. |
| Assignment | System filters suitable Developers by Developer Responsibility using Component Category and optional SAP Module. |
| Pending Assignment | If no suitable Developer exists, bug can be submitted as Pending Assignment. |
| Developer review | Developer reviews assigned bug, requests more information, rejects wrong assignment/classification with reason and follow-up owner, moves to In Review/In Progress, and marks Resolved. |
| Retest and closure | Resolved bugs can move to Retest Required before Closed. Tester/PM controls final closure. |
| Comments | Tester, Developer, and PM can comment on a bug. Comments do not directly change status. |
| History log | Important changes are logged: create, edit, assign, reassign, status change, request info, reject, resolve, close, reopen, attachment/comment events. |
| PM monitoring | PM can monitor all bugs by status, priority, severity, assignee, next processor, overdue, SAP Module, Application Component, and Defect Category. |
| Notifications | MVP should model notification triggers; actual delivery can start as placeholder/logged notification. |

## Should Have if Time Allows

| Area | Scope |
| --- | --- |
| Attachments | Store attachment metadata and references. Actual file storage can remain local/simple in early development. |
| Workload warning | Warn when a Developer is overloaded based on assigned/open bug count. |
| Escalation | Highlight overdue, stale, rejected, or long-pending assignment bugs for PM. |
| Value lists | Maintain value lists for status, priority, severity, SAP Module, Application Component, and Defect Category. |
| Notification adapter | Add an adapter so email/SAP BTP/third-party channels can be added later without hardcoding. |

## Out of Scope

- Direct code fixing inside IDTS.
- Source-code management.
- CI/CD and deployment workflow.
- Code review workflow.
- Sprint planning.
- Full Jira replacement.
- Full SAP Cloud ALM or SAP Solution Manager replacement.
- Full test management module.
- Transport/release management.
- Complex approval workflow.
- Mandatory AI Root Cause Analysis.
- Hardcoded SAP BTP/HANA/service endpoints or credentials.

## Assumptions

- Local development uses SQLite.
- Future deployment can target SAP HANA Cloud or PostgreSQL, but no endpoint is hardcoded now.
- `SAP Module` is optional because some bugs are pure IDTS/application bugs.
- `Application Component` and `Defect Category` are required for assignment filtering.
- `nextProcessor` is maintained automatically by backend logic and does not replace `assignee`.
- `Rejected` is a follow-up status, not a final status. Every rejected bug must have a reason, nextProcessor, and next action.
- `Reassigned` is an action/history event, not a primary status.

Vietnamese:

- `Rejected` là status cần xử lý tiếp, không phải trạng thái kết thúc. Mỗi bug bị reject phải có lý do, nextProcessor và action tiếp theo rõ ràng.

## MVP Success Criteria

- Tester can create and classify a bug.
- Assignee list is filtered by responsibility rules.
- Bug can be submitted as Assigned or Pending Assignment.
- Developer can review, request more information, reject with follow-up ownership, progress, and resolve.
- Tester/PM can retest, close, or reopen.
- PM can see workload/overdue/status monitoring views.
- History logs show who did what, when, and why for key changes.
