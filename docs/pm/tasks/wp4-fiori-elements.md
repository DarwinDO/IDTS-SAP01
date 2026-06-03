# WP4 - Fiori Elements UX

Status: Ready after WP1 and WP2
Owner workstream: Fiori/UI5
Last updated: 2026-06-01

## Goal

Build the main IDTS List Report/Object Page experience using Fiori Elements where possible.

## Inputs

- `docs/ba/07-fiori-ux-requirements.md`
- WP1 data model.
- WP2 service contract.
- `app/bug-management-ui/`

## Tasks

| ID | Task | Status |
| --- | --- | --- |
| WP4-T01 | Review generated Fiori app structure. | Ready after WP2 |
| WP4-T02 | Configure list report filters and table columns. | Ready after WP2 |
| WP4-T03 | Configure object page sections for details, classification, assignment, comments, history, notifications. | Ready after WP2 |
| WP4-T04 | Add dependent value-help behavior where supported by annotations/service. | Ready after WP2 |
| WP4-T05 | Add semantic status display. | Ready after WP2 |
| WP4-T06 | Add visible Rejected follow-up information: rejection reason, nextProcessor/queue, and allowed follow-up actions. | Ready after WP2 |
| WP4-T07 | Verify UI with local preview and relevant lint/tooling. | Ready after WP2 |

## Definition of Done

- The user can inspect, create, and work with bug records through Fiori UI.
- UX follows SAP Fiori terminology and status semantics.
- Custom UI5 is used only when annotations are insufficient.
- Rejected bugs show why they were rejected and who must act next.

Vietnamese:

- UI Fiori phải làm rõ bug bị `Rejected` vì lý do gì và ai cần xử lý tiếp; không để user hiểu nhầm `Rejected` là đã kết thúc.
