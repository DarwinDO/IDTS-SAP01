# MVP Scope Freeze

Last updated: 2026-06-01

This file freezes the first implementable MVP boundary. It is derived from the IDTS business markdown files, `docs/project-context.md`, and `docs/ba/`.

## MVP Goal

Deliver a focused Issue and Defect Tracking System for SAP testing teams that can create, classify, assign, review, update, comment on, audit, and monitor bugs.

## P0 MVP Scope

| Area | Included in MVP |
| --- | --- |
| Bug creation | Title, description, priority, severity, environment, reproduction context, expected/actual result, reporter, status. |
| Duplicate support | Search existing bugs before creation; no mandatory AI matching in MVP. |
| Classification | Optional SAP Module, required Application Component, required Defect Category, inferred Component Category. |
| Assignment | Filter suitable Developers by Developer Responsibility; allow Pending Assignment when no suitable Developer is selected. |
| Developer review | Accept, move to In Review/In Progress, request more information, reject unsuitable bug or classification with reason and follow-up owner. |
| Status lifecycle | New, Pending Assignment, Assigned, In Review, Need More Information, In Progress, Resolved, Retest Required, Rejected, Reopened, Closed. |
| Comments | Add discussion and action comments on a bug. |
| History logs | Record important changes such as status, assignee, nextProcessor, priority, severity, classification, and decisions. |
| Notifications | Store in-app notification records for important events. |
| PM monitoring | Filter and monitor workload, overdue bugs, Pending Assignment bugs, and nextProcessor queues. |

## P1 Deferred Scope

| Area | Reason for deferral |
| --- | --- |
| Attachment storage implementation | MVP can model attachment metadata first; physical storage can be integrated later. |
| External notifications | Avoid hardcoded email, webhook, or SAP BTP endpoints in early implementation. |
| Advanced workload warnings | Basic monitoring first; workload scoring can come later. |
| Duplicate relationship modeling | Useful, but not required before core create/assign/review works. |
| Advanced analytics | Needs stable transactional data first. |

## Explicitly Out of Scope

- Direct code fixing or source code editing from IDTS.
- Git integration, CI/CD, deployment pipelines, or code review workflow.
- Full Jira replacement, sprint management, story points, or release train planning.
- Mandatory AI root cause analysis.
- Hardcoded SAP BTP, HANA Cloud, PostgreSQL, email, or webhook endpoints.
- Complex enterprise incident management beyond the documented defect lifecycle.

## Scope Change Rule

A change can enter MVP only when it supports the core IDTS flows and has a clear owner, acceptance criteria, data impact, UI impact, and verification path.

English:

- `Rejected` remains part of the MVP status lifecycle, but it is not a terminal state. Rejected bugs must have a rejection reason, nextProcessor, and a clear follow-up action.

Vietnamese:

- `Rejected` vẫn thuộc MVP status lifecycle, nhưng không phải trạng thái kết thúc. Rejected phải có lý do, nextProcessor và follow-up action rõ ràng.
