# Knowledge: `db/data/idts.cap-ComponentCategories.csv`

## English

### What this file is for

Seed data for `ComponentCategories`. This is one of the most important relationship tables in IDTS.

`ComponentCategories` is the **assignment key**: it connects an `ApplicationComponent` with a `DefectCategory`. When a tester classifies a bug, the system uses (or validates) the matching ComponentCategory to find suitable developers via `DeveloperResponsibilities`.

### IDTS flow and business meaning

Tester selects Application Component + Defect Category in the create form.
→ The system looks up or validates the corresponding `ComponentCategory`.
→ This ComponentCategory is stored on the Bug and used for:
  - Filtering suitable developers (AssignableDevelopers read model)
  - DeveloperResponsibilities matching
  - PM monitoring and workload views

This is a core design decision: assignment is not done by SAP Module or separate component/category, but by the **pair** (ComponentCategory).

### Columns explained

- `ID`: UUID primary key.
- `component_ID`: Reference to ApplicationComponents.
- `defectCategory_ID`: Reference to DefectCategories.
- `active`: Whether this combination is currently valid for assignment.

### Impact if data is wrong or missing

- Missing ComponentCategory for a used pair → value help for assignee becomes empty or wrong; bugs cannot be assigned properly.
- Wrong links → developers get bugs outside their responsibility area.
- Inactive rows still referenced by demo bugs → assignment demo breaks.

### Cross-folder dependency map

- **db/schema.cds**: Entity `ComponentCategories` + associations from `Bugs.componentCategory` and `DeveloperResponsibilities.componentCategory`.
- **srv/service.cds**: `ValidDefectCategories` view + redirected `componentCategory` in DeveloperResponsibilities. Also used in `AssignableDevelopers`.
- **srv/bug-service/read-models.js**: `readAssignableDevelopers` and capability logic heavily use ComponentCategory.
- **srv/bug-service/bug-write.js**: `deriveOrValidateComponentCategory` during create/update.
- **app/bug-management-ui/annotations/value-helps.cds** and **ownership-assignment.cds**: Dependent value help (Component → Defect Category) and assignment section on Object Page.
- **db/data/idts.cap-DeveloperResponsibilities.csv**: Links developers to these categories.
- **db/data/idts.cap-Bugs.csv**: Demo bugs store specific `componentCategory_ID`.

### Safe editing checklist

- This file must stay in sync with ComponentCategories used in demo Bugs.csv and DeveloperResponsibilities.csv.
- When adding new classification pairs, also seed corresponding DeveloperResponsibilities if you want them assignable in demo.
- Changes affect create flow, value help, assignment, and PM views.
- After edit: verify dependent value help in browser + assignment behavior + backend tests.

## Vietnamese

### File này dùng để làm gì

Dữ liệu seed cho `ComponentCategories`. Đây là một trong những bảng quan trọng nhất của IDTS.

`ComponentCategories` là **khóa phân công**: nó nối `ApplicationComponent` với `DefectCategory`. Khi tester phân loại bug, hệ thống dùng (hoặc kiểm tra) ComponentCategory tương ứng để tìm developer phù hợp qua `DeveloperResponsibilities`.

### Flow nghiệp vụ IDTS

Tester chọn Application Component + Defect Category khi tạo bug.
→ Hệ thống tra cứu hoặc validate ComponentCategory tương ứng.
→ ComponentCategory này được lưu vào Bug và dùng cho:
  - Lọc developer phù hợp (AssignableDevelopers)
  - So khớp DeveloperResponsibilities
  - Theo dõi workload của PM

Đây là quyết định thiết kế cốt lõi: phân công không theo SAP Module hay component/category riêng lẻ, mà theo **cặp** (ComponentCategory).

### Giải thích các cột

- `ID`: Khóa chính UUID.
- `component_ID`: Tham chiếu đến ApplicationComponents.
- `defectCategory_ID`: Tham chiếu đến DefectCategories.
- `active`: Cặp này còn hợp lệ để phân công không.

### Ảnh hưởng nếu dữ liệu sai hoặc thiếu

- Thiếu ComponentCategory cho cặp đang dùng → value help assignee trống hoặc sai; không phân công được bug đúng cách.
- Liên kết sai → developer nhận bug ngoài phạm vi trách nhiệm.
- Dòng inactive vẫn được demo bugs tham chiếu → demo assignment hỏng.

### Liên kết với file/folder khác

- **db/schema.cds**: Entity `ComponentCategories` + các association từ `Bugs.componentCategory` và `DeveloperResponsibilities.componentCategory`.
- **srv/service.cds**: View `ValidDefectCategories` + componentCategory được redirect trong DeveloperResponsibilities. Dùng trong `AssignableDevelopers`.
- **srv/bug-service/read-models.js**: `readAssignableDevelopers` và logic capability dùng nhiều ComponentCategory.
- **srv/bug-service/bug-write.js**: Hàm `deriveOrValidateComponentCategory` khi create/update.
- **app/bug-management-ui/annotations/value-helps.cds** và **ownership-assignment.cds**: Value help phụ thuộc (Component → Defect Category) và phần assignment trên Object Page.
- **db/data/idts.cap-DeveloperResponsibilities.csv**: Liên kết developer với các category này.
- **db/data/idts.cap-Bugs.csv**: Dữ liệu demo lưu `componentCategory_ID` cụ thể.

### Khi sửa file này cần chú ý

- File này phải đồng bộ với ComponentCategories dùng trong Bugs.csv demo và DeveloperResponsibilities.csv.
- Khi thêm cặp phân loại mới, nên seed thêm DeveloperResponsibilities nếu muốn dùng được trong demo.
- Thay đổi ảnh hưởng create flow, value help, assignment và view PM.
- Sau khi sửa: kiểm tra value help phụ thuộc trên browser + hành vi phân công + test backend.

## Metadata

- Source file: `db/data/idts.cap-ComponentCategories.csv`
- Knowledge mirror: `docs/knowledge/db/data/idts.cap-ComponentCategories.csv.md`
- Source layer: `db/data`
- Documentation style: learning-oriented + IDTS domain impact
- Last reviewed: 2026-06-22