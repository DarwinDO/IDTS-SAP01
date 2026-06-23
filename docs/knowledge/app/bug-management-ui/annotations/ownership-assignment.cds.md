# Knowledge: `app/bug-management-ui/annotations/ownership-assignment.cds`

## English

### What this file is for

Annotations for the **Assignment** section on the Object Page.

It controls visibility and editability of assignee and nextProcessor fields, and related actions.

### IDTS concept

Assignment is a core business concept. The file uses `@UI.Hidden` based on capability fields and `@Common.FieldControl` to make assignee read-only or editable depending on context and user role.

It also handles display of next processor (the current action owner).

### Impact and links

- Works with `canAssign`, `canMoveToPending`, `assigneeFieldControl` from backend.
- Closely related to DeveloperResponsibilities and ComponentCategory logic.
- Affects Tester (can assign) vs Developer (mostly read-only) experience.

See also value-helps and capabilities annotations.

## Vietnamese

### File này dùng để làm gì

Annotation cho phần **Assignment** trên Object Page.

Điều khiển ẩn/hiện và khả năng sửa của assignee và nextProcessor, cũng như action liên quan.

### Khái niệm IDTS

Phân công là khái niệm nghiệp vụ cốt lõi. File dùng `@UI.Hidden` theo capability và FieldControl để assignee có thể sửa hay chỉ đọc tùy ngữ cảnh và vai trò.

Cũng hiển thị next processor (người phải hành động tiếp).

### Ảnh hưởng và liên kết

Làm việc với canAssign, canMoveToPending, assigneeFieldControl từ backend.
Liên quan chặt với DeveloperResponsibilities và ComponentCategory.
Ảnh hưởng trải nghiệm của Tester (có thể gán) so với Developer.

Xem thêm value-helps và capabilities.

## Metadata

- Source file: `app/bug-management-ui/annotations/ownership-assignment.cds`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/annotations/ownership-assignment.cds.md`
- Source layer: `app`
- Last reviewed: 2026-06-22