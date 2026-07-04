# Knowledge: `app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml`

## English

### What this file is for

This XML fragment defines the custom Evidence / Attachments section on the Bug Object Page.

It gives users a clearer Fiori-style attachment area:

- upload button;
- short evidence guidance;
- responsive attachment table;
- download and remove actions.

### Beginner explanation

The actual files are not stored in this XML file. This file only draws the controls. The behavior lives in `BugCollaboration.js`, and the data comes from the CAP attachment entity `Bugs_attachments`.

The FileUploader control lets the user pick a local file. The table binds to the current bug's `attachments` navigation property, so each bug shows its own evidence files.

The UI deliberately shows normal product concepts: file name, type, size, uploader, uploaded time, and actions. It does not show storage references, S3 URLs, tokens, or backend configuration.

### Flow in IDTS

1. User opens a saved bug.
2. `manifest.json` inserts this fragment as the `IdtsAttachmentsCustom` Object Page section.
3. User chooses a file through the upload button.
4. `BugCollaboration.js` runs the safe CAP draft upload flow.
5. The table refreshes and shows the uploaded evidence.
6. User can download or remove the evidence through protected OData calls.

### Important source anchors

- **Location**: `app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml:11`
  `<unified:FileUploader ... />`
  **IDTS concept**: User-facing evidence upload control.
  **Impact if broken**: Users cannot attach screenshots, logs, or proof needed for bug investigation.
  **Must check together**: `sap.ui.unified` dependency in `manifest.json`, `BugCollaboration.js:onAttachmentSelected`, and attachment validation in `srv/bug-service/content.js`.

- **Location**: `app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml:20`
  `change="Collaboration.onAttachmentSelected"`
  **IDTS concept**: Starts the draft upload flow when the user chooses a file.
  **Impact if broken**: File selection succeeds visually but no evidence is stored.
  **Must check together**: `BugCollaboration.js:onAttachmentSelected`, `db/schema.cds` attachment composition, and `scripts/qa/test-comments-attachments.ps1`.

- **Location**: `app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml:40`
  `<Table id="idtsAttachmentsTable" ... items="{ path: 'attachments' ... }">`
  **IDTS concept**: Shows evidence files belonging to the current bug.
  **Impact if broken**: Users may see no evidence, stale evidence, or evidence from the wrong bug.
  **Must check together**: `srv/service.cds` `Bugs_attachments`, attachment metadata fields, and browser smoke reload/persistence checks.

- **Location**: `app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml:89`
  `press="Collaboration.onDownloadAttachment"`
  **IDTS concept**: Download evidence through the protected OData media endpoint.
  **Impact if broken**: Users can see evidence metadata but cannot retrieve the actual file.
  **Must check together**: `BugCollaboration.js:onDownloadAttachment`, `@cap-js/attachments`, and AWS S3/Render shared QA evidence.

- **Location**: `app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml:95`
  `press="Collaboration.onDeleteAttachment"`
  **IDTS concept**: Remove an evidence file from the bug.
  **Impact if broken**: Users may be unable to clean up incorrect evidence, or deletion can bypass the draft-safe sequence.
  **Must check together**: `BugCollaboration.js:onDeleteAttachment`, `srv/bug-service/history.js`, and attachment regression tests.

### Cross-folder impact

- `manifest.json` registers this fragment and the `sap.ui.unified` dependency.
- `BugCollaboration.js` performs upload/download/delete.
- `db/schema.cds` defines the attachment composition.
- `srv/service.cds` exposes `Bugs_attachments`.
- `srv/bug-service/content.js` validates upload permissions and content metadata.
- `scripts/qa/test-comments-attachments.ps1` verifies the full HTTP draft upload path.

### Safe editing checklist

- Do not expose private S3 URLs, credentials, storage references, or bearer tokens.
- Keep visible text user-facing and Fiori-like, not developer-facing.
- If file type/size rules change, update UI guidance, backend validation, and QA scripts together.
- Verify upload, refresh, download, delete, and reload persistence after changes.

## Vietnamese

### File này dùng để làm gì

XML fragment này định nghĩa custom Evidence / Attachments section trên Bug Object Page.

Nó tạo khu vực attachment rõ ràng hơn theo hướng Fiori:

- nút upload;
- hướng dẫn ngắn về evidence;
- bảng attachment responsive;
- hành động download và remove.

### Giải thích cho người mới

File thật không nằm trong XML này. File này chỉ vẽ control. Hành vi nằm trong `BugCollaboration.js`, còn dữ liệu đến từ CAP attachment entity `Bugs_attachments`.

Control FileUploader cho user chọn file từ máy. Bảng bind vào navigation property `attachments` của bug hiện tại, nên mỗi bug chỉ hiện evidence của chính bug đó.

UI cố ý chỉ hiển thị khái niệm sản phẩm bình thường: tên file, loại file, dung lượng, người upload, thời điểm upload, và action. Nó không hiển thị storage reference, S3 URL, token hoặc cấu hình backend.

### Flow trong IDTS

1. User mở một bug đã lưu.
2. `manifest.json` chèn fragment này vào Object Page section `IdtsAttachmentsCustom`.
3. User chọn file bằng nút upload.
4. `BugCollaboration.js` chạy CAP draft upload flow an toàn.
5. Bảng refresh và hiện evidence vừa upload.
6. User có thể download hoặc remove evidence qua OData được bảo vệ.

### Các điểm neo quan trọng trong source

- **Vị trí**: `app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml:11`
  `<unified:FileUploader ... />`
  **Khái niệm IDTS**: Control upload evidence cho user.
  **Ảnh hưởng nếu sai**: User không thể đính kèm screenshot, log hoặc bằng chứng cần cho điều tra bug.
  **Phải kiểm tra cùng**: dependency `sap.ui.unified` trong `manifest.json`, `BugCollaboration.js:onAttachmentSelected`, và validation attachment trong `srv/bug-service/content.js`.

- **Vị trí**: `app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml:20`
  `change="Collaboration.onAttachmentSelected"`
  **Khái niệm IDTS**: Bắt đầu draft upload flow khi user chọn file.
  **Ảnh hưởng nếu sai**: UI cho chọn file nhưng evidence không được lưu.
  **Phải kiểm tra cùng**: `BugCollaboration.js:onAttachmentSelected`, attachment composition trong `db/schema.cds`, và `scripts/qa/test-comments-attachments.ps1`.

- **Vị trí**: `app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml:40`
  `<Table id="idtsAttachmentsTable" ... items="{ path: 'attachments' ... }">`
  **Khái niệm IDTS**: Hiện evidence files của bug đang mở.
  **Ảnh hưởng nếu sai**: User có thể không thấy evidence, thấy stale evidence, hoặc thấy evidence của bug khác.
  **Phải kiểm tra cùng**: `Bugs_attachments` trong `srv/service.cds`, attachment metadata fields, và browser smoke reload/persistence.

- **Vị trí**: `app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml:89`
  `press="Collaboration.onDownloadAttachment"`
  **Khái niệm IDTS**: Download evidence qua OData media endpoint được bảo vệ.
  **Ảnh hưởng nếu sai**: User thấy metadata evidence nhưng không lấy được file thật.
  **Phải kiểm tra cùng**: `BugCollaboration.js:onDownloadAttachment`, `@cap-js/attachments`, và evidence trên AWS S3/Render shared QA.

- **Vị trí**: `app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml:95`
  `press="Collaboration.onDeleteAttachment"`
  **Khái niệm IDTS**: Xóa evidence file khỏi bug.
  **Ảnh hưởng nếu sai**: User không xóa được evidence sai, hoặc delete đi lệch khỏi draft-safe sequence.
  **Phải kiểm tra cùng**: `BugCollaboration.js:onDeleteAttachment`, `srv/bug-service/history.js`, và attachment regression tests.

### Liên kết với file/folder khác

- `manifest.json` đăng ký fragment này và dependency `sap.ui.unified`.
- `BugCollaboration.js` xử lý upload/download/delete.
- `db/schema.cds` định nghĩa attachment composition.
- `srv/service.cds` expose `Bugs_attachments`.
- `srv/bug-service/content.js` validate quyền upload và metadata content.
- `scripts/qa/test-comments-attachments.ps1` verify full HTTP draft upload path.

### Checklist sửa an toàn

- Không expose S3 URL private, credential, storage reference hoặc bearer token.
- Text trên UI phải là text sản phẩm, không phải text dev-facing.
- Nếu đổi rule file type/size, cập nhật UI guidance, backend validation và QA script cùng lúc.
- Sau khi sửa, verify upload, refresh, download, delete và reload persistence.

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml.md`
- Source layer: `app`
- Last reviewed: 2026-07-04

## IDTS-55 runtime fix notes

### English

This fragment now uses `BugCollaborationSection` as its root control. This gives the attachment table and action buttons the current Bug context, so the relative `attachments` binding points to the opened bug.

The upload/download/remove controls use the `Collaboration` module alias through `core:require`. Keep that alias consistent with `BugCollaboration.js`.

The Remove button sits inside an attachment row, so its own binding context is the attachment row, not the root bug. `BugCollaboration.js` must climb to the root bug context before running draft edit/delete.

If this file changes, browser smoke must verify:

- Upload shows the new file in the table.
- Download returns the selected file.
- Remove opens confirmation and deletes the file.
- The file row is gone after delete and no private storage URL is visible.

### Vietnamese

Fragment này hiện dùng `BugCollaborationSection` làm root control. Control này giúp attachment table và action buttons nhận context của Bug hiện tại, để binding tương đối `attachments` trỏ đúng bug đang mở.

Các control upload/download/remove dùng module alias `Collaboration` qua `core:require`. Alias này phải khớp với `BugCollaboration.js`.

Nút Remove nằm trong một attachment row, nên binding context trực tiếp của nó là attachment row, không phải root bug. `BugCollaboration.js` phải đi lên root bug context trước khi chạy draft edit/delete.

Nếu sửa file này, browser smoke phải verify:

- Upload hiển thị file mới trong table.
- Download trả về đúng file được chọn.
- Remove mở confirmation và xóa file.
- Sau delete không còn row file và không lộ private storage URL.
