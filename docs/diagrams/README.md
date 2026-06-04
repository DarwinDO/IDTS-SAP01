# IDTS BA Diagram Pack

This folder contains business analysis diagrams for the Issue and Defect Tracking System in SAP.

Source documents:

- `IDTS-SUMMARY.md`
- `IDTS-Business-Rule.md`
- `IDTS-PROJECT-SCOPE-SAP01.md`
- `docs/project-context.md`
- Current CAP/Fiori structure in `db/`, `srv/`, and `app/bug-management-ui/`

## Diagram Index

Read in this order:

1. `01-system-context-and-architecture.md`
   - System context.
   - SAP CAP/Fiori architecture.
2. `02-use-cases.md`
   - PlantUML use case diagram by role.
3. `03-business-process-flows.md`
   - End-to-end defect flow.
   - Duplicate checking flow.
   - Assignment decision flow.
4. `04-status-lifecycle.md`
   - Bug status lifecycle.
   - Status ownership notes.
5. `05-conceptual-data-model.md`
   - Conceptual entity relationship model.
6. `06-notification-audit-monitoring.md`
   - Submit/review notification sequence.
   - PM monitoring and escalation flow.
7. `07-srs-system-context.md`
   - Concise SRS system context diagram.
8. `08-frs-functional-workflows.md`
   - FRS workflow diagrams for defect tracking, rejection, assignment, review, request information, retest, and PM monitoring.

## BA Modeling Decisions

- `Reassign` is modeled as an action and history event, not as a primary status. The business rules describe reassignment as changing the assignee while the bug remains assignable. If the team later wants `Reassigned` as a real status, update `04-status-lifecycle.md` and the CAP status model together.
- `Retest Required` is modeled as a primary status between `Resolved` and `Closed`. This keeps closure controlled by Tester/PM and borrows the useful retest loop from SAP Cloud ALM / Focused Build without adding full test management.
- Bug classification separates real `SAP Module` from `Application Component`. `Defect Category` is filtered by Application Component, and `Assignee` is filtered by the valid Component/Category responsibility mapping, optionally scoped by SAP Module.
- Test context is modeled as lightweight references (`testCaseRef`, `testRunRef`, `environment`) on the bug, not as a full Test Case/Test Run module.
- PM can request reassignment. Tester performs reassignment unless a later authorization rule explicitly gives PM direct reassignment rights.
- Developer review means reviewing the defect information and updating status/notes. It does not mean fixing code inside IDTS.
- Notification is modeled as a module or adapter. The diagrams do not lock the project to email, Slack, Teams, Telegram, or a specific SAP BTP notification service.
- PM dashboard and workload monitoring are modeled as read/derived views over Bugs, Developers, status, due date, and history. They are not a separate project management system.

## Out of Scope Excluded from Diagrams

The diagrams intentionally exclude:

- Source code editing inside IDTS.
- Deploy fix.
- Code review workflow.
- CI/CD.
- Sprint planning.
- Full Jira/SAP Solution Manager/ServiceNow replacement.
- Mandatory AI root cause analysis.
- Complex multi-level approval workflow.
