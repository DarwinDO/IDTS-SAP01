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

## IDTS-43 update - keep one readable History section

### English

IDTS-43 removes the raw `History` table facet that pointed to `historyEvents/@UI.LineItem`.

For a new Fiori learner, a facet is a section/part of the Object Page. Before this cleanup, the Object Page could show both a generated history table and the custom timeline/history section configured through the manifest. That made the same audit concept appear twice and confused manual QA.

The data is not deleted. `HistoryEvents` and `HistoryLogs` still exist in the backend and can still be used by tests/API consumers. The UI simply keeps the friendlier custom History section as the main user-facing view.

Important anchor:

- Location: removed raw facet with `Target : 'historyEvents/@UI.LineItem'`
  - IDTS concept: History should be readable event history, not duplicate raw audit tables.
  - Impact if broken: Users may see two History sections and not know which one is the official audit view.
  - Must check together: `app/bug-management-ui/webapp/manifest.json` custom `History` section, `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`, `srv/service.cds` history projections, and `srv/bug-service/history.js`.

### Vietnamese

IDTS-43 bỏ raw facet `History` từng trỏ tới `historyEvents/@UI.LineItem`.

Với người mới học Fiori, facet là một section/phần trên Object Page. Trước khi cleanup, Object Page có thể hiển thị cả bảng history tự sinh và section history/timeline custom trong manifest. Điều này làm cùng một khái niệm audit xuất hiện hai lần và gây rối khi QA thủ công.

Dữ liệu không bị xóa. `HistoryEvents` và `HistoryLogs` vẫn tồn tại ở backend và vẫn dùng được cho test/API. UI chỉ giữ section History thân thiện hơn làm view chính cho người dùng.

Điểm neo quan trọng:

- Vị trí: raw facet bị bỏ với `Target : 'historyEvents/@UI.LineItem'`
  - Khái niệm IDTS: History nên là lịch sử sự kiện dễ đọc, không phải nhiều bảng audit thô bị lặp.
  - Ảnh hưởng nếu sai: User có thể thấy hai section History và không biết view nào là audit chính thức.
  - Phải kiểm tra cùng: custom section `History` trong `app/bug-management-ui/webapp/manifest.json`, `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`, history projections trong `srv/service.cds`, và `srv/bug-service/history.js`.

## Metadata

- Source file: `app/bug-management-ui/annotations/object-page.cds`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/annotations/object-page.cds.md`
- Source layer: `app`
- Last reviewed: 2026-07-01

## IDTS-55 update - hide raw comments and attachments facets

### English

IDTS-55 does not delete comments or attachments from the backend. It only hides the old generated Object Page facets for comments and attachments because the user-facing experience now comes from custom sections registered in `manifest.json`.

For a Fiori beginner: a facet is a section of the Object Page. If the old facets stay visible while the custom sections are also registered, users see duplicate comments and duplicate attachment areas. That makes QA confusing and weakens the polished Fiori UX.

Important anchors:

- **Location**: `app/bug-management-ui/annotations/object-page.cds:116`
  `ID : 'Attachments' ... ![@UI.Hidden] : true`
  **IDTS concept**: Hide the raw generated attachment facet while keeping the attachment data and service contract.
  **Impact if broken**: The Object Page may show both the generated attachment table and the custom Evidence / Attachments section.
  **Must check together**: `manifest.json:IdtsAttachmentsCustom`, `AttachmentsSection.fragment.xml`, `BugCollaboration.js`, and `srv/service.cds:Bugs_attachments`.

- **Location**: `app/bug-management-ui/annotations/object-page.cds:123`
  `ID : 'Comments' ... ![@UI.Hidden] : true`
  **IDTS concept**: Hide the old generated comments collection facet while keeping `Comments` and `addComment` available.
  **Impact if broken**: The Object Page may show duplicate comment UX or expose the old action/table combination again.
  **Must check together**: `manifest.json:IdtsCommentsCustom`, `CommentsSection.fragment.xml`, `BugCollaboration.js`, and `srv/service.cds:addComment`.

### Vietnamese

IDTS-55 không xóa comments hoặc attachments khỏi backend. Thay đổi này chỉ ẩn các facet generated cũ trên Object Page, vì trải nghiệm người dùng mới được cung cấp qua custom sections trong `manifest.json`.

Với người mới học Fiori: facet là một section/phần trên Object Page. Nếu facet cũ vẫn hiện trong khi custom section mới cũng được đăng ký, user sẽ thấy trùng khu vực comments và trùng khu vực attachments. Điều đó gây rối khi QA và làm UX kém polish.

Các anchor quan trọng:

- **Vị trí**: `app/bug-management-ui/annotations/object-page.cds:116`
  `ID : 'Attachments' ... ![@UI.Hidden] : true`
  **Khái niệm IDTS**: Ẩn raw generated attachment facet nhưng giữ nguyên data và service contract.
  **Ảnh hưởng nếu sai**: Object Page có thể hiện cả bảng attachment generated và custom Evidence / Attachments section.
  **Phải kiểm tra cùng**: `manifest.json:IdtsAttachmentsCustom`, `AttachmentsSection.fragment.xml`, `BugCollaboration.js`, và `srv/service.cds:Bugs_attachments`.

- **Vị trí**: `app/bug-management-ui/annotations/object-page.cds:123`
  `ID : 'Comments' ... ![@UI.Hidden] : true`
  **Khái niệm IDTS**: Ẩn comments collection facet cũ nhưng vẫn giữ `Comments` và action `addComment`.
  **Ảnh hưởng nếu sai**: Object Page có thể hiện trùng comment UX hoặc lộ lại action/table cũ.
  **Phải kiểm tra cùng**: `manifest.json:IdtsCommentsCustom`, `CommentsSection.fragment.xml`, `BugCollaboration.js`, và `srv/service.cds:addComment`.
