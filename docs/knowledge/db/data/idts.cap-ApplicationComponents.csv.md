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

## 2026-08-06 catalog update

### English

The catalog now has exactly eight deterministic component IDs (`...001` through `...008`). Row `...008` is exactly `IDTS_AI_ADVISORY`, `IDTS AI Advisory`, `AI_SERVICE`, and `true`. It is a bounded classification entry, not a new AI provider, runtime, or deployment setting.

### Important source anchors

- **Location**: `db/data/idts.cap-ApplicationComponents.csv:9`
  `40000000-0000-0000-0000-000000000008,IDTS_AI_ADVISORY,IDTS AI Advisory,AI_SERVICE,true`
  **IDTS concept**: Stable application-component master data for the AI Advisory classification area.
  **Impact if broken**: Testers cannot select the controlled AI-advisory component, or its dependent ComponentCategory choices point at the wrong component.
  **Must check together**: `db/data/idts.cap-ComponentCategories.csv` rows `...028`–`...031`, `db/schema.cds` entity `ApplicationComponents`, and `scripts/qa/test-idts122-classification-catalog.js`.

### Tiếng Việt

Catalog hiện có đúng tám component ID xác định (`...001` đến `...008`). Dòng `...008` phải đúng là `IDTS_AI_ADVISORY`, `IDTS AI Advisory`, `AI_SERVICE` và `true`. Đây là entry phân loại có giới hạn, không phải provider AI, runtime hoặc cấu hình deploy mới.

### Important source anchors

- **Vị trí**: `db/data/idts.cap-ApplicationComponents.csv:9`
  `40000000-0000-0000-0000-000000000008,IDTS_AI_ADVISORY,IDTS AI Advisory,AI_SERVICE,true`
  **Khái niệm IDTS**: Master data application-component ổn định cho khu vực phân loại AI Advisory.
  **Ảnh hưởng nếu sai**: Tester không thể chọn component AI-advisory có kiểm soát, hoặc các lựa chọn ComponentCategory phụ thuộc trỏ nhầm component.
  **Cần kiểm tra cùng**: các dòng `...028`–`...031` trong `db/data/idts.cap-ComponentCategories.csv`, entity `ApplicationComponents` trong `db/schema.cds` và `scripts/qa/test-idts122-classification-catalog.js`.

## Metadata

- Source file: `db/data/idts.cap-ApplicationComponents.csv`
- Knowledge mirror: `docs/knowledge/db/data/idts.cap-ApplicationComponents.csv.md`
- Last reviewed: 2026-08-06
