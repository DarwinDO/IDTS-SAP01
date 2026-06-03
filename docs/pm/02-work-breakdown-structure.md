# Work Breakdown Structure

Last updated: 2026-05-28

## Work Packages

| WP | Name | Owner workstream | Depends on | Output |
| --- | --- | --- | --- | --- |
| WP1 | Data Model Foundation | Backend CAP | BA baseline | Expanded `db/schema.cds`, seed-data direction, compile-ready model |
| WP2 | Service and Value Help | Backend CAP | WP1 | OData projections, value helps, service contract |
| WP3 | Handler Rules and Validation | Backend CAP | WP1, WP2 | CAP Node.js handlers for transitions, assignment, nextProcessor, history |
| WP4 | Fiori Elements UX | Fiori/UI5 | WP1, WP2 | List Report/Object Page configuration, annotations, semantic status UI |
| WP5 | Comments and History | Backend CAP / Fiori/UI5 | WP1, WP3, WP4 | Comment/history display and write behavior |
| WP6 | PM Monitoring | Backend CAP / Fiori/UI5 | WP1, WP2, WP3 | Monitoring views, filters, workload and overdue pages/sections |
| WP7 | Notifications and Attachments | Backend CAP / Fiori/UI5 | WP1, WP3 | In-app notification records and attachment metadata behavior |

## Dependency Notes

- WP1 must happen first because all later work depends on the correct domain model.
- WP2 should expose stable projections and value helps before Fiori UI work expands.
- WP3 should own business-critical validations; the UI must not be the only guardrail.
- WP4 should prefer Fiori Elements annotations before custom UI5 code.
- WP6 should wait until status, assignee, due date, and nextProcessor behavior are stable enough to monitor.

## Work Package Completion Rule

A work package is complete only when its task file is updated, relevant docs are synchronized, and verification results are recorded.
