# Sprint 1 Plan - Data Model Foundation

Last updated: 2026-05-28

## Sprint Goal

Replace the current minimal CAP model with a compile-ready MVP domain model for IDTS.

## Scope

Sprint 1 focuses only on the CDS data model and seed-data direction. It should not implement Fiori page behavior, complex handlers, external notifications, or deployment configuration.

## Planned Tasks

| Task | Description | Output |
| --- | --- | --- |
| S1-T01 | Review BA data dictionary and current `db/schema.cds`. | Confirm entity and field gaps. |
| S1-T02 | Add user/developer master data. | `Users`, `DeveloperProfiles`, responsibility-ready associations. |
| S1-T03 | Add classification master data. | `SAPModules`, `ApplicationComponents`, `DefectCategories`, `ComponentCategories`, optional module-component mapping. |
| S1-T04 | Expand `Bugs`. | Classification, assignment, lifecycle, reproduction, due date, nextProcessor, audit-ready fields. |
| S1-T05 | Add child data entities. | `Comments`, `HistoryLogs`, `Notifications`, `Attachments` metadata. |
| S1-T06 | Compile and update docs. | `cds compile srv --to edmx` result and PM task/status updates. |

## Acceptance Criteria

- `db/schema.cds` contains the core MVP entities from `docs/ba/05-data-dictionary.md`.
- `Bugs` supports the documented classification, assignment, status, nextProcessor, and planning fields.
- Developer Responsibility can represent a Developer's capability for Component Category and optional SAP Module.
- Comments, history, notifications, and attachments are modeled without implementing external storage or delivery.
- The model compiles to EDMX.
- No service endpoint, credential, or environment-specific value is hardcoded.

## Out of Sprint

- Fiori annotations and page layout.
- CAP handler transition logic.
- External notification delivery.
- Binary attachment storage.
- PM dashboard implementation.

## Verification

Run at minimum:

```powershell
cds compile srv --to edmx
npx ai-devkit@latest lint --json
```
