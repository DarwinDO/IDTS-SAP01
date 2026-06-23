# Knowledge: `app/bug-management-ui/annotations/object-page.cds`

## English

### What this file is for

Fiori Elements annotations for the **Bug Object Page** (detail screen).

It defines:
- Header (bugNumber + title)
- Main facets and field groups (General Info, Supporting Info, Classification, Assignment)
- Layout of sections for comments, attachments, history, notifications (via other annotation files)

### IDTS flow

When opening a bug from the list, the Object Page shows all important information grouped logically:
- Core bug data
- Classification (module, component, defect category)
- Assignment (assignee + next processor)
- Child data: comments, attachments, history events, notifications

Action buttons are controlled by capability annotations (in other files).

### Important source anchors

- `UI.HeaderInfo`: Uses bugNumber as title and title as description.
  **IDTS concept**: Gives quick identification of the bug.

- `UI.Facets` with CollectionFacet for "Bug Summary" and "Classification and Assignment".
  **IDTS concept**: Groups fields so testers see reproduction info, while assignment and classification (the key for who should work on it) are clearly separated.

- References to FieldGroup#GeneralInfo, #SupportingInfo, #Classification, #Assignment.
  **IDTS concept**: Organizes mandatory fields (title, description, steps, actual/expected) near the top, while classification and ownership have dedicated sections.

### Cross-folder dependency map

- **srv/service.cds**: All fields and virtuals (assigneeDisplayName, nextProcessorRoleName, can* flags, componentCategory).
- **db/schema.cds**: Source entities (Bugs + associations to components, categories, users, developer profiles).
- **app/bug-management-ui/annotations/**: Other files (actions, capabilities, history-notifications, comments, attachments, ownership-assignment) contribute facets and buttons.
- **manifest.json**: Defines the Object Page route/target.

### Safe editing checklist

- Keep classification and assignment sections prominent (business rule: correct classification + assignment is core).
- When adding fields or changing facets, also update value helps and side-effect annotations.
- Test on real browser for different roles (what a Developer sees vs Tester vs PM).

## Vietnamese

### File này dùng để làm gì

Annotation cho trang chi tiết **Bug Object Page**.

Định nghĩa header, các facet và group trường (Thông tin chung, Phân loại, Phân công), và bố cục các phần con (comment, attachment, history, notification).

### Flow IDTS

Mở bug từ list → thấy đầy đủ thông tin được nhóm:
- Dữ liệu bug cốt lõi
- Phân loại (module, component, defect category)
- Phân công (assignee + next processor)
- Dữ liệu con: comment, attachment, lịch sử, thông báo

Nút action được điều khiển bởi capability (file annotation khác).

### Các điểm neo quan trọng trong source

- `UI.HeaderInfo`: bugNumber làm title.
- `UI.Facets`: Các CollectionFacet cho Bug Summary và Classification and Assignment.
- Các FieldGroup quan trọng.

### Liên kết với file/folder khác

- service.cds (field + virtual)
- db/schema.cds
- Các file annotation khác (actions, capabilities, history...)
- manifest.json

### Checklist sửa an toàn

Giữ phần phân loại và phân công nổi bật. Khi thêm trường phải cập nhật value help và annotation liên quan. Test trên browser với nhiều vai trò.

## Metadata

- Source file: `app/bug-management-ui/annotations/object-page.cds`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/annotations/object-page.cds.md`
- Source layer: `app`
- Last reviewed: 2026-06-22