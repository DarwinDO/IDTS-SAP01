# Knowledge: `app/bug-management-ui/annotations/list-report.cds`

> **Ownership / debug anchor:** DatDT owns this List Report metadata (backup: SangVN). Debug a missing filter or column here, then confirm the property is exposed by `srv/service.cds`.
> **Ownership / điểm debug:** DatDT sở hữu metadata List Report này (backup: SangVN). Debug filter hoặc cột bị thiếu tại đây, rồi xác nhận property đã được expose bởi `srv/service.cds`.

## English

### What this file is for

Fiori Elements annotations that configure the **List Report** page for Bugs.

It defines:
- Which fields are available as filters (SelectionFields)
- The columns shown in the table (LineItem)
- Presentation variant and some capability fields for action visibility

### IDTS flow

This is the main entry screen for Tester and PM. They use filters like status, priority, component, assignee, nextProcessor, isOverdue, isPendingAssignment, etc. to find and manage bugs.

The table shows key information with semantic colors for status, priority, severity.

### Important source anchors

- `UI.SelectionFields`: Includes business filters such as `status_code`, `applicationComponent_ID`, `defectCategory_ID`, `assignee_ID`, `nextProcessorUser_ID`, plus the monitoring virtuals (`isOverdue`, `isPendingAssignment`, `isRejectedFollowUp`, `isRetestRequired`).
  **IDTS concept**: Allows PM and testers to quickly slice the bug list by classification, ownership, and monitoring flags.
  **Impact if broken**: Important filters disappear or monitoring flags cannot be used for views.

- `UI.LineItem`: Shows bugNumber, title, status (with criticality), priority, severity, SAP Module, Application Component, Defect Category, assigneeDisplayName, nextProcessorRoleName, dueDate, modifiedAt.
  **IDTS concept**: Surface the key business fields + assignment/ownership information + dates needed for workload management.
  **Impact if broken**: List becomes hard to scan; missing Component Category or next processor info hurts assignment and follow-up workflows.

- Reference to many `can*` fields in RequestAtLeast / PresentationVariant.
  **IDTS concept**: Ensures the backend capability flags are loaded so row-level action buttons or mass actions can be controlled.

### Cross-folder dependency map

- **srv/service.cds**: The Bugs projection + all virtual fields and display names used here.
- **srv/bug-service/read-models.js**: Computes the `can*` flags and display names.
- **db/schema.cds**: Source of status, component, assignee, nextProcessor fields.
- **app/bug-management-ui/annotations/value-helps.cds**: Many SelectionFields have dependent value helps defined elsewhere.
- **manifest.json**: The List Report route uses this metadata.

### Safe editing checklist

When adding/removing filters or columns, also consider:
- Performance (RequestAtLeast)
- Value help annotations
- Capability calculations in backend
- OPA tests that rely on specific columns/filters

Test the List Report with different roles and filter combinations after changes.

## Vietnamese

### File này dùng để làm gì

Annotation cấu hình trang **List Report** cho Bugs.

Định nghĩa bộ lọc, cột bảng, và một số trường capability để điều khiển action.

### Flow IDTS

Đây là màn hình chính cho Tester và PM. Họ dùng filter trạng thái, ưu tiên, component, người gán, nextProcessor, isOverdue... để tìm và quản lý bug.

Bảng hiển thị thông tin quan trọng kèm màu sắc semantic.

### Các điểm neo quan trọng trong source

- `UI.SelectionFields`: Bao gồm các filter nghiệp vụ quan trọng (status, applicationComponent, defectCategory, assignee, nextProcessor) và các virtual theo dõi PM.
- `UI.LineItem`: Các cột chính: bugNumber, title, status (có màu), priority, severity, component, assignee, nextProcessor, dueDate...
- Tham chiếu nhiều `can*` field.

### Liên kết với file/folder khác

- service.cds (virtual field và display name)
- read-models.js (tính can* và tên)
- schema.cds
- value-helps.cds
- manifest.json

### Checklist sửa an toàn

Khi thay đổi filter/cột phải xem xét hiệu năng, value help, capability backend và test OPA. Test lại List Report với nhiều vai trò.

## Metadata

- Source file: `app/bug-management-ui/annotations/list-report.cds`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/annotations/list-report.cds.md`
- Source layer: `app`
- Last reviewed: 2026-06-22

## Beginner-first execution map / Sơ đồ thực thi cho người mới (2026-07-18)

**English.** Caller: CAP metadata compilation through `annotations.cds`. The `@UI.LineItem`, selection fields, header information, and presentation variants tell Fiori Elements which Bug properties become columns, filters, titles, and default ordering. Callee: the List Report generated from `manifest.json` and `BugService.Bugs`. The browser later sends OData GET requests based on this metadata; this file itself sends none. Debug order: target/entity name → compiled `$metadata` → browser Network query → visible table. A wrong property can break rendering or produce an empty column without changing backend data.

**Tiếng Việt.** Caller là quá trình compile metadata qua `annotations.cds`. Các `@UI.LineItem`, selection field, header information và presentation variant nói cho Fiori Elements biết property Bug nào thành cột, filter, tiêu đề và thứ tự mặc định. Callee là List Report được sinh từ `manifest.json` và `BugService.Bugs`. Browser sẽ gửi OData GET theo metadata này; bản thân file không gửi request. Thứ tự debug: tên target/entity → `$metadata` đã compile → Network query → table hiển thị. Property sai có thể làm UI render lỗi hoặc cột trống nhưng không thay đổi database.
