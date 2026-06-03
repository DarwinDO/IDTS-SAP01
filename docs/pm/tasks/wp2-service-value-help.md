# WP2 - Service and Value Help

Status: Ready after WP1
Owner workstream: Backend CAP
Last updated: 2026-06-01

## Goal

Expose a clean OData V4 service contract for IDTS and provide value-help-ready projections for Fiori.

## Inputs

- WP1 data model.
- `docs/ba/07-fiori-ux-requirements.md`
- `srv/service.cds`
- `app/bug-management-ui/annotations.cds`

## Tasks

| ID | Task | Status |
| --- | --- | --- |
| WP2-T01 | Review current service projections. | Ready after WP1 |
| WP2-T02 | Expose Bugs and required child entities. | Ready after WP1 |
| WP2-T03 | Expose master data value helps for status, priority, severity, SAP Module, Application Component, Defect Category, and Developers. | Ready after WP1 |
| WP2-T04 | Add OData actions/functions only where needed for real user actions, including reject/follow-up actions if annotations alone are not enough. | Ready after WP1 |
| WP2-T05 | Compile service metadata. | Ready after WP1 |

## Definition of Done

- Service metadata exposes required entities and associations.
- Value helps can support dependent Fiori selection.
- No unnecessary generic workflow APIs are added.
- Rejected follow-up paths are visible in the service contract where required by the Fiori UI and CAP handlers.

Vietnamese:

- Service contract phải đủ để UI và handler xử lý flow `Rejected`: reject kèm lý do, hiển thị người xử lý tiếp, và đưa bug về `Assigned` hoặc `Pending Assignment` sau follow-up.
