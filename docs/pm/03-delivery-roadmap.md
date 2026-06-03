# Delivery Roadmap

Last updated: 2026-05-28

## Recommended Sequence

| Stage | Focus | Main output | Exit gate |
| --- | --- | --- | --- |
| Stage 0 | PM and BA baseline | `docs/ba/` and `docs/pm/` are aligned | Scope and work packages accepted |
| Sprint 1 | Data Model Foundation | Expanded CDS model and seed-data direction | `cds compile srv --to edmx` passes |
| Sprint 2 | Service and Value Help | OData service projections and value helps | Service metadata exposes required entities and relationships |
| Sprint 3 | Handler Rules | Assignment, transitions, nextProcessor, history | Targeted backend tests or manual verification scenarios pass |
| Sprint 4 | Fiori Elements UX | Create/edit/view bug flow, list filters, object page sections | User can complete core bug flow in UI |
| Sprint 5 | Comments, History, PM Monitoring | Comments/history sections and PM monitoring filters | PM can identify workload, overdue, pending, and next-action items |
| Sprint 6 | Notifications, Attachments, Hardening | In-app notifications, attachment metadata, cleanup | MVP demo scenario passes end to end |

## Gate Principles

- Do not start custom UI5 work before confirming whether Fiori Elements annotations are sufficient.
- Do not build monitoring pages before core status and ownership fields are implemented.
- Do not introduce external integrations before the local MVP is stable.
- Every sprint should end with updated PM status and verification notes.

## Suggested Demo Path

1. Tester checks existing bugs and creates a new bug.
2. Tester classifies it by SAP Module if relevant, Application Component, and Defect Category.
3. System filters Developers by responsibility.
4. Tester assigns a Developer or submits as Pending Assignment.
5. Developer reviews, requests more information or accepts.
6. Developer resolves the bug.
7. Tester retests, closes or reopens.
8. PM monitors workload, overdue, pending assignment, and nextProcessor queues.
