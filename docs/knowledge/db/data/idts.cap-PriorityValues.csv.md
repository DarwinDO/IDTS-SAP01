# Knowledge: `db/data/idts.cap-PriorityValues.csv`

## English

### What this file is for

Seed for `PriorityValues` code list. Provides the priority levels (HIGH, MEDIUM, LOW...) used on bugs.

### IDTS impact

Priority affects:
- Visual highlighting in List Report (criticality)
- PM monitoring and overdue importance
- Demo data variety

Used in value helps and sorting.

### Cross-folder links

- `db/schema.cds` (Bugs.priority)
- `srv/service.cds`
- Fiori annotations for criticality and selection fields
- Demo bugs reference these codes

Keep codes stable. Changes affect UI display and any reporting logic.

## Vietnamese

### File này dùng để làm gì

Seed cho danh sách mức độ ưu tiên (HIGH, MEDIUM, LOW...).

### Ảnh hưởng IDTS

Ảnh hưởng màu sắc, theo dõi PM, dữ liệu demo.

### Liên kết

Schema Bugs.priority, service, annotation Fiori, Bugs.csv demo.

Giữ code ổn định.

## Metadata

- Source file: `db/data/idts.cap-PriorityValues.csv`
- Knowledge mirror: `docs/knowledge/db/data/idts.cap-PriorityValues.csv.md`
- Last reviewed: 2026-06-22