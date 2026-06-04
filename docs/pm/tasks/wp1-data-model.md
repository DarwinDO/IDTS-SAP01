# WP1 - Data Model Foundation

Status: Done
Owner workstream: Backend CAP
Last updated: 2026-06-04

## Goal

Create the compile-ready CDS data model for the IDTS MVP.

## Inputs

- `docs/ba/05-data-dictionary.md`
- `docs/ba/08-implementation-gap-analysis.md`
- `docs/ba/09-database-model-review.md`
- `docs/project-context.md`
- `db/schema.cds`
- `srv/service.cds`

## Tasks

| ID | Task | Status |
| --- | --- | --- |
| WP1-T01 | Compare current `db/schema.cds` with BA data dictionary. | Done |
| WP1-T02 | Add user/developer master data entities. | Done |
| WP1-T03 | Add SAP Module, Application Component, Defect Category, Component Category, and optional module-component mapping. | Done |
| WP1-T04 | Add Developer Responsibility model. | Done |
| WP1-T05 | Expand Bugs with classification, assignment, lifecycle, rejection reason support, nextProcessor, reproduction, planning, and audit fields. | Done |
| WP1-T06 | Add Comments, HistoryLogs, Notifications, and Attachments metadata. | Done |
| WP1-T07 | Compile with `cds compile srv --to edmx`. | Done |
| WP1-T08 | Update PM status and docs if business meaning changes. | Done |

## Implementation Result

WP1 implemented the CAP data model foundation in `db/schema.cds`, exposed compile-ready projections in `srv/service.cds`, and added CAP seed data under `db/data/`.

Vietnamese: WP1 đã implement nền tảng data model trong `db/schema.cds`, expose projection compile-ready trong `srv/service.cds`, và thêm seed data CAP trong `db/data/`.

## Verification Evidence

| Command | Result |
| --- | --- |
| `cds compile srv --to edmx` | Exit 0; OData V4 EDMX generated. |
| `cds deploy --to sqlite::memory:` | Exit 0; all CAP CSV seed files initialized into an in-memory SQLite database. |
| `git diff --check` | Exit 0; only existing CRLF warnings reported. |

Vietnamese:

| Lệnh | Kết quả |
| --- | --- |
| `cds compile srv --to edmx` | Exit 0; đã generate OData V4 EDMX. |
| `cds deploy --to sqlite::memory:` | Exit 0; tất cả file seed CSV CAP đã init vào SQLite in-memory. |
| `git diff --check` | Exit 0; chỉ có warning CRLF sẵn có. |

## Follow-Up

WP2 should add service/value-help refinements and Fiori-facing annotations. WP3 should implement handler rules for `bugNumber`, classification consistency, assignment validation, status transition, `nextProcessor`, and history logging.

Vietnamese: WP2 nên bổ sung service/value-help refinement và annotation phía Fiori. WP3 nên implement handler rule cho `bugNumber`, consistency classification, validation assignment, status transition, `nextProcessor` và history logging.

## Definition of Done

- CDS model compiles.
- Core MVP entities exist.
- Relationship choices match the BA data dictionary.
- DB-Q01 to DB-Q08 in `docs/ba/09-database-model-review.md` are applied or any deviation is explicitly documented.
- No credentials or deployment endpoints are introduced.
- Rejected bug follow-up can be represented through either a dedicated rejection reason field or auditable HistoryLogs reason plus nextProcessor/queue ownership.

Vietnamese:

- Data model phải hỗ trợ bug bị `Rejected` có lý do reject và người/queue xử lý tiếp. Có thể dùng field riêng hoặc dùng `HistoryLogs.reason`, miễn là UI và audit vẫn đọc lại được rõ ràng.
