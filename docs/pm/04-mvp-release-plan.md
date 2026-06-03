# MVP Release Plan

Last updated: 2026-05-28

## Release Objective

Release a local CAP/Fiori MVP that demonstrates the complete IDTS defect flow with maintainable data model, OData V4 service, Fiori UI, history, and PM monitoring.

## Release Content

| Capability | MVP expectation |
| --- | --- |
| Bug list | Search and filter by status, priority, severity, SAP Module, Application Component, Defect Category, assignee, nextProcessor, overdue. |
| Bug object page | Show core details, classification, assignment, lifecycle actions, comments, history, and notifications. |
| Bug creation | Support required classification and assignment selection. |
| Developer filtering | Use Developer Responsibility and optional SAP Module. |
| Status actions | Enforce allowed transitions and required comments/reasons. |
| nextProcessor | Auto-update on important actions. |
| PM monitoring | Show open work, pending assignment, overdue items, workload by Developer, and next action queues. |

## Not Included in MVP Release

- External email/SAP BTP notification delivery.
- File binary storage beyond attachment metadata.
- Jira-like boards, sprint planning, story management, or code review.
- Mandatory AI duplicate detection or AI root cause analysis.
- Production deployment to HANA Cloud or PostgreSQL.

## Release Acceptance Criteria

- `cds compile srv --to edmx` passes.
- Core create, assign, review, resolve, retest, close/reopen flow can be demonstrated.
- Business-critical transitions are enforced in backend handlers.
- Fiori UI follows SAP Fiori terminology, semantic statuses, and message handling.
- History logs are created for important changes.
- PM can identify who must act next through nextProcessor and status filters.
- No credentials, tokens, endpoints, or private environment files are committed.
