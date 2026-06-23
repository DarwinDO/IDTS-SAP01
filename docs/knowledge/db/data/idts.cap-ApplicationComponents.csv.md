# Knowledge: `db/data/idts.cap-ApplicationComponents.csv`

## English

### What this file is for

Seed data for `ApplicationComponents`. These represent the SAP application components or modules where bugs are found (e.g. specific Fiori apps, backend modules, etc.).

Together with DefectCategories they form ComponentCategories — the assignment key.

### IDTS flow

Tester chooses Application Component when reporting a bug.
This choice (combined with Defect Category) determines which developers can be assigned the bug.

### Cross-folder impact

- Links to `ComponentCategories` and `Bugs.applicationComponent`
- Used in value helps and assignment filtering in read-models
- Affects `AssignableDevelopers` and DeveloperWorkloads

Bad data here breaks classification and assignment UX.

### Safe editing

Keep IDs stable. Changes require updating related ComponentCategories, demo bugs, and DeveloperResponsibilities.

## Vietnamese

### File này dùng để làm gì

Seed cho ApplicationComponents – nơi bug được phát hiện trong hệ thống SAP.

Kết hợp với Defect Category tạo thành ComponentCategory (khóa phân công).

### Flow IDTS

Tester chọn Application Component khi báo bug → quyết định developer nào có thể nhận bug.

### Liên kết

Ảnh hưởng ComponentCategories, Bugs, value help, assignment logic.

### Checklist

Giữ ID ổn định, cập nhật các file liên quan khi thay đổi.

## Metadata

- Source file: `db/data/idts.cap-ApplicationComponents.csv`
- Knowledge mirror: `docs/knowledge/db/data/idts.cap-ApplicationComponents.csv.md`
- Last reviewed: 2026-06-22