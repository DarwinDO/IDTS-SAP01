# Knowledge: `db/data/idts.cap-NotificationEventTypes.csv`

## English

### What this file is for

Seed dataset for `NotificationEventTypes`. Read this file as local/demo data that CAP loads into the database. It affects dropdowns, value helps, sample bugs, workflow labels, and demo behavior.

### How to read this file

This file belongs to the data layer. It defines schema or seed data consumed through CAP services and Fiori value helps.

Read it through three practical questions:

- What screen, API, data model, or developer workflow does this file support?
- Which other layer consumes the output of this file?
- If this file changes, which service/UI/data/test file must be checked next?

### Runtime / project flow

- During local database deployment, CAP imports this CSV into `NotificationEventTypes`.
- Service projections and value helps expose the seeded rows to the UI.
- Changing codes/IDs here can change dropdown choices, demo records, and workflow lookups.

### Main concepts explained

- This CSV loads `6` seed rows into `NotificationEventTypes`.
- Header columns: `code, name, descr, sortOrder, active, criticality`.
- For code-list CSV files, `code` is often what backend logic compares; do not rename codes casually.
- For relationship CSV files, foreign-key columns must point to valid IDs from related seed files.

### Important source anchors

These anchors are deliberately short. They are not the main explanation; they only point you back to the most useful source locations after you understand the flow above.

- Line 1: `code, name, descr, sortOrder, active, criticality` — The header defines the columns CAP imports into the matching seed entity.
- Line 2: `ASSIGNED, Assigned, Bug was assigned to a developer, 10, true, 1` — The first data row is a concrete example loaded into the local development database.

### Cross-folder dependency map

This section answers: which file in another main folder is linked, where the link appears, and how the linked files affect each other.

- **CSV filename/entity → `db/schema.cds`**: CAP loads this file into the `NotificationEventTypes` entity. Impact: Column names and foreign keys must match the schema.
- **Seeded values → `srv/service.cds`**: BugService exposes or uses `NotificationEventTypes` directly or indirectly. Impact: Changing seed codes/names can change dropdowns, workflow matching, status labels, and demo data.
- **Value-help data → `app/bug-management-ui/annotations/value-helps.cds`**: Fiori value helps often display these master-data rows. Impact: Missing/inactive seed rows can make dropdowns empty or confusing.

### Safe editing checklist

- Update this knowledge note in the same task whenever the source file changes meaning, dependency, API shape, UI behavior, validation, or seed data.
- Do not put secrets, AWS keys, passwords, private endpoints, or local-only credential values into the note.
- After changing linked CAP/Fiori files, verify metadata or UI behavior instead of assuming the service/UI contract still matches.
- Keep IDs/codes stable unless related service logic, tests, and demo data are updated together.
- Validate that referenced IDs exist in related seed files.

## Vietnamese

### File này dùng để làm gì

Seed dataset for `NotificationEventTypes`. File này nằm ở lớp dữ liệu. Nó định nghĩa schema hoặc seed data mà service và Fiori dùng thông qua CAP/OData.

### Cách đọc file này cho dễ hiểu

- Đừng đọc file này như danh sách dòng code rời rạc.
- Hãy đọc theo flow: người dùng/UI làm gì, CAP service nhận gì, backend xử lý gì, và dữ liệu nào bị ảnh hưởng.
- Nếu phần English dài hơn, hãy xem đó là bản giải thích đầy đủ; phần Vietnamese này giúp nắm ý chính trước.

### Flow chính

- During local database deployment, CAP imports this CSV into `NotificationEventTypes`.
- Service projections and value helps expose the seeded rows to the UI.
- Changing codes/IDs here can change dropdown choices, demo records, and workflow lookups.

### Các ý quan trọng cần hiểu

- This CSV loads `6` seed rows into `NotificationEventTypes`.
- Header columns: `code, name, descr, sortOrder, active, criticality`.
- For code-list CSV files, `code` is often what backend logic compares; do not rename codes casually.
- For relationship CSV files, foreign-key columns must point to valid IDs from related seed files.

### Liên kết với file ở folder khác

Phần này nói rõ file này liên kết với file nào, liên kết nằm ở đâu, và nếu sửa một bên thì bên kia bị ảnh hưởng thế nào.

- **CSV filename/entity → `db/schema.cds`**: CAP loads this file into the `NotificationEventTypes` entity. Impact: Column names and foreign keys must match the schema.
- **Seeded values → `srv/service.cds`**: BugService exposes or uses `NotificationEventTypes` directly or indirectly. Impact: Changing seed codes/names can change dropdowns, workflow matching, status labels, and demo data.
- **Value-help data → `app/bug-management-ui/annotations/value-helps.cds`**: Fiori value helps often display these master-data rows. Impact: Missing/inactive seed rows can make dropdowns empty or confusing.

### Khi sửa file này cần chú ý

- Update this knowledge note in the same task whenever the source file changes meaning, dependency, API shape, UI behavior, validation, or seed data.
- Do not put secrets, AWS keys, passwords, private endpoints, or local-only credential values into the note.
- After changing linked CAP/Fiori files, verify metadata or UI behavior instead of assuming the service/UI contract still matches.
- Keep IDs/codes stable unless related service logic, tests, and demo data are updated together.
- Validate that referenced IDs exist in related seed files.

## Metadata

- Source file: `db/data/idts.cap-NotificationEventTypes.csv`
- Knowledge mirror: `docs/knowledge/db/data/idts.cap-NotificationEventTypes.csv.md`
- Source layer: `db`
- Source type: `.csv`
- Source line count at documentation time: 7
- Documentation style: learning-oriented explanation, not line listing only
- Last reviewed: 2026-06-22

## N3 lifecycle codes

**English.** N3 adds additive stable codes for lifecycle, ownership, mention and escalation producers without rewriting legacy rows. `RESOLVED`, `RETEST_REQUIRED`, `REOPENED`, `RESUBMITTED`, `REASSIGNED`, `RETEST_OWNER_CHANGED`, and `PENDING_ASSIGNMENT` are consumed by the server inbox mapper and UI labels.

**Tiếng Việt.** N3 thêm code ổn định theo kiểu additive cho producer lifecycle, ownership, mention và escalation, không sửa legacy row. `RESOLVED`, `RETEST_REQUIRED`, `REOPENED`, `RESUBMITTED`, `REASSIGNED`, `RETEST_OWNER_CHANGED` và `PENDING_ASSIGNMENT` được dùng bởi inbox mapper server và UI label.
