# Knowledge: `app/bug-management-ui/annotations/value-helps.cds`

## English

### What this file is for

Defines ValueList annotations for various fields on Bugs, especially the dependent value helps for classification and assignment.

Key examples:
- Status, Priority, Severity (with fixed values)
- Application Component → Defect Category (dependent)
- Assignee (AssignableDevelopers with rich columns)

### IDTS flow

When creating or editing a bug, the tester gets smart filtered lists:
- After choosing Application Component, only relevant Defect Categories appear.
- Assignee value help only shows developers responsible for the current ComponentCategory (and optional SAP Module).

This is a major usability feature for correct classification and assignment.

### Important source anchors

- Annotations for `applicationComponent_ID` and `defectCategory_ID` with dependent ValueList.
  **IDTS concept**: Enforces that only valid ComponentCategory combinations are chosen. Directly supports the assignment key concept.

- Annotation for assignee using `AssignableDevelopers` with multiple display columns (name, email, availability, component, defect category...).
  **IDTS concept**: Gives rich context so the tester can pick the right developer based on workload and responsibility.

### Cross-folder links

- `srv/service.cds` (ValidDefectCategories, AssignableDevelopers, StatusValues...)
- `srv/bug-service/read-models.js` (the actual query logic)
- `db/data/` seeds for the lookup tables
- `ownership-assignment.cds` and actions annotations

### Safe editing

Changes here must stay in sync with the backend read models and seed data. Test dependent filtering thoroughly in the browser.

## Vietnamese

### File này dùng để làm gì

Định nghĩa ValueList annotation cho các trường trên Bugs, đặc biệt là value help phụ thuộc cho phân loại và phân công.

Ví dụ quan trọng:
- Status, Priority, Severity
- Application Component → Defect Category (phụ thuộc)
- Assignee (AssignableDevelopers)

### Flow IDTS

Khi tạo/sửa bug, tester được danh sách thông minh:
- Chọn Application Component trước → chỉ hiện Defect Category hợp lệ.
- Value help Assignee chỉ hiện developer có responsibility cho ComponentCategory hiện tại.

Đây là tính năng sử dụng quan trọng để phân loại và gán đúng.

### Các điểm neo quan trọng

- Annotation cho applicationComponent và defectCategory (dependent ValueList).
- Annotation cho assignee dùng AssignableDevelopers với nhiều cột thông tin.

### Liên kết

service.cds, read-models.js, seed data, các file annotation liên quan.

### Checklist

Phải đồng bộ với backend read model và seed. Test lọc phụ thuộc kỹ trên browser.

## Metadata

- Source file: `app/bug-management-ui/annotations/value-helps.cds`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/annotations/value-helps.cds.md`
- Source layer: `app`
- Last reviewed: 2026-06-22