---
name: sap-cap
description: Query @cap-js/mcp-server before writing or reviewing SAP CAP artifacts for IDTS: CDS entities and aspects, CAP services, OData actions/functions, Node.js handlers, validation, CQL queries, SQLite/HANA/PostgreSQL portability, authorization annotations, audit/history logic, and bug workflow status transitions.
---

# CAP MCP-First Development

Before writing, modifying, debugging, or fixing CAP artifacts, query the CAP MCP server and apply its guidance.

Use community CAP/Capire skills only as secondary reading. Do not copy GPL-licensed templates or large examples into this repo; translate useful ideas into project-specific rules and verify current syntax with CAP MCP.

## Tools

Use `mcp__cap__*` tools when available:

- `mcp__cap__search_docs`
- `mcp__cap__search_model`

## Scope

This skill covers:

- CDS entities, types, aspects, associations, and compositions
- `db/schema.cds`
- `srv/*.cds`
- CAP Node.js service handlers in `srv/*.js`
- OData actions and functions
- Validation and transition logic for IDTS bug statuses

This skill does not cover Fiori annotations or custom UI5 code. Use `sap-fiori` or `sap-ui5` for those.

## IDTS Domain Rules

- Preserve the documented business scope.
- Model bug tracking concepts clearly: Bugs, Developers, SAPModules, ApplicationComponents, DefectCategories, ComponentCategories, DeveloperResponsibilities, Comments, Attachments, HistoryLogs, Notifications.
- Use UUID keys for Fiori-exposed entities unless there is a documented reason not to.
- Keep statuses aligned with New, Pending Assignment, Assigned, In Review, Need More Information, In Progress, Resolved, Rejected, Reopened, Closed.
- Implement business-critical validation in CAP, not only in the UI.
- Do not add direct code-fixing, CI/CD, code review, or full Jira features.
- Do not hardcode credentials, BTP endpoints, HANA Cloud URLs, PostgreSQL URLs, or webhook secrets.

## CAP Modeling Rules

- Prefer `cuid` and `managed` from `@sap/cds/common` for core business entities unless existing code uses a different convention for a clear reason.
- Use compositions for lifecycle-owned child records such as bug comments, attachments metadata, history logs, and notifications when they should belong to one bug.
- Use associations for reusable/master data such as Developers, SAPModules, ApplicationComponents, DefectCategories, PriorityValues, SeverityValues, and StatusValues.
- Keep persistence models in `db/`, service definitions and handlers in `srv/`, and UI artifacts in `app/`.
- Avoid database-specific SQL and vendor-specific data types while the project targets SQLite locally and HANA Cloud or PostgreSQL later.
- Add CSV seed data only under CAP-supported locations such as `db/data/`, and keep sample data free of personal credentials or production data.

## Service and Handler Rules

- Keep `BugService` focused on the defect-tracking workflow; create additional services only when a distinct role or API boundary is clear.
- Expose service projections instead of leaking every persistence entity and field by default.
- Add actions/functions only for real workflow operations such as submit, assign, reassign, request more information, reject, resolve, close, and reopen.
- Implement mandatory-field checks and status-transition checks in CAP handlers, not only in Fiori validation.
- Record status, assignment, comment, and attachment-impacting changes in history/audit logs in the same logical transaction as the business change.
- Use CAP's query APIs (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) and request-aware transactions; avoid raw SQL unless CAP MCP/docs confirm there is no better option.
- Use `cds.log` or project-standard logging in handlers; avoid production `console.log`.

## Authorization and Data Protection Rules

- Use CDS authorization annotations such as `@requires` and `@restrict` only after roles are aligned with Tester/Admin/Reporter, Developer, and PM.
- Do not rely on UI filters as authorization. Enforce sensitive read/write restrictions in CAP.
- Treat screenshots, log files, webhook URLs, service keys, and notification payloads as sensitive. Store only required metadata unless the user explicitly designs secure attachment storage.
- Keep authentication and XSUAA setup out of scope until deployment/auth requirements are explicit.

## CAPire-Derived Checklist for IDTS

Before committing a CAP backend change, check:

- Does the change still compile to OData V4 EDMX?
- Are entity relationships represented as managed associations or compositions instead of manual foreign-key plumbing?
- Are workflow operations modeled as explicit service actions/functions only when CRUD is not enough?
- Are queries explicit and scoped to required fields/results instead of broad reads?
- Is the change portable across SQLite now and HANA/PostgreSQL later?
- Are credentials, endpoints, and local secrets excluded from source control?
- Has CAP MCP been queried for any unfamiliar syntax or API?

## Verification

After CAP changes, run:

```bash
cds compile srv --to edmx
```

Run focused tests when test coverage exists or when adding behavior.
