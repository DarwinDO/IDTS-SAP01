# WP1 - Data Model Foundation

Status: Ready
Owner workstream: Backend CAP
Last updated: 2026-06-01

## Goal

Create the compile-ready CDS data model for the IDTS MVP.

## Inputs

- `docs/ba/05-data-dictionary.md`
- `docs/ba/08-implementation-gap-analysis.md`
- `docs/project-context.md`
- `db/schema.cds`
- `srv/service.cds`

## Tasks

| ID | Task | Status |
| --- | --- | --- |
| WP1-T01 | Compare current `db/schema.cds` with BA data dictionary. | Ready |
| WP1-T02 | Add user/developer master data entities. | Ready |
| WP1-T03 | Add SAP Module, Application Component, Defect Category, Component Category, and optional module-component mapping. | Ready |
| WP1-T04 | Add Developer Responsibility model. | Ready |
| WP1-T05 | Expand Bugs with classification, assignment, lifecycle, rejection reason support, nextProcessor, reproduction, planning, and audit fields. | Ready |
| WP1-T06 | Add Comments, HistoryLogs, Notifications, and Attachments metadata. | Ready |
| WP1-T07 | Compile with `cds compile srv --to edmx`. | Ready |
| WP1-T08 | Update PM status and docs if business meaning changes. | Ready |

## Definition of Done

- CDS model compiles.
- Core MVP entities exist.
- Relationship choices match the BA data dictionary.
- No credentials or deployment endpoints are introduced.
- Rejected bug follow-up can be represented through either a dedicated rejection reason field or auditable HistoryLogs reason plus nextProcessor/queue ownership.

Vietnamese:

- Data model phải hỗ trợ bug bị `Rejected` có lý do reject và người/queue xử lý tiếp. Có thể dùng field riêng hoặc dùng `HistoryLogs.reason`, miễn là UI và audit vẫn đọc lại được rõ ràng.
