# Knowledge: `app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml`

> **Ownership / debug anchor:** SangVN owns attachment UI (backup: DonHV). PostgreSQL stores attachment metadata while S3 stores bytes; trace upload/download through OData and never surface private storage credentials.
> **Ownership / điểm debug:** SangVN sở hữu UI attachment (backup: DonHV). PostgreSQL lưu metadata còn S3 lưu bytes; trace upload/download qua OData và không bao giờ lộ storage credential.

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
- Last reviewed: 2026-07-05

## IDTS-55 runtime fix notes

### English

This fragment now uses `BugCollaborationSection` as its root control. This gives the attachment table and action buttons the current Bug context, so the relative `attachments` binding points to the opened bug.

The upload/download/remove controls use the `Collaboration` module alias through `core:require`. Keep that alias consistent with `BugCollaboration.js`.

The Remove button sits inside an attachment row, so its own binding context is the attachment row, not the root bug. `BugCollaboration.js` must climb to the root bug context before running draft edit/delete.

If this file changes, browser smoke must verify:

- Upload shows the new file in the table.
- Download returns the selected file.
- Remove opens confirmation and deletes the file.

## IDTS-73 create-time attachment selection notes

### English

IDTS-73 changes this fragment so the upload button is enabled not only for saved active bugs, but also for a brand-new Create Bug draft. On create, selecting a file does not write to S3 yet. The selected file name appears in the pending list, and `BugCollaboration.js` keeps the real browser file object in memory. After Save, the normal attachment upload flow runs against the newly saved bug.

The Comments section is hidden on create, but Attachments remains visible because evidence can be part of the initial report. This gives testers a single Create Bug flow without needing to save first and then remember to upload evidence later.

Important anchors:

- **Location**: `multiple="true"`
  **IDTS concept**: A tester can select more than one evidence file before saving the bug.
  **Impact if broken**: Users may need repeated upload actions and can miss evidence during initial reporting.
  **Must check together**: `BugCollaboration.js:validateAttachments` and browser create smoke.

- **Location**: `enabled="{= ... ${HasActiveEntity} !== true ... }"`
  **IDTS concept**: File selection is allowed for create drafts but still blocked for unsafe edit-draft states.
  **Impact if broken**: Upload can be disabled on create, or enabled while an existing bug has a draft conflict.
  **Must check together**: CAP draft behavior and `BugCollaboration.js:isCreateDraftContext`.

- **Location**: `idtsPendingAttachmentsList`
  **IDTS concept**: Shows selected local files before they are uploaded after Save.
  **Impact if broken**: Button-only upload would give users no visible confirmation of which files are queued.
  **Must check together**: `attachmentsPendingNoData` i18n key and IDTS-73 static QA script.

### Vietnamese

IDTS-73 thay đổi fragment này để nút upload được bật không chỉ trên bug active đã lưu, mà cả trên draft của màn hình Create Bug. Khi đang create, chọn file chưa ghi lên S3. Tên file đã chọn sẽ hiện trong pending list, còn `BugCollaboration.js` giữ browser file object thật trong bộ nhớ. Sau khi Save, flow upload attachment bình thường sẽ chạy trên bug vừa được lưu.

Comments section bị ẩn khi create, nhưng Attachments vẫn hiện vì evidence có thể là một phần của báo cáo ban đầu. Cách này giúp tester tạo bug trong một flow duy nhất, không phải Save trước rồi nhớ quay lại upload evidence sau.

Các anchor quan trọng:

- **Vị trí**: `multiple="true"`
  **Khái niệm IDTS**: Tester có thể chọn nhiều file evidence trước khi lưu bug.
  **Ảnh hưởng nếu sai**: User phải upload lặp lại nhiều lần và có thể quên evidence trong lúc report ban đầu.
  **Phải kiểm tra cùng**: `BugCollaboration.js:validateAttachments` và browser smoke cho create.

- **Vị trí**: `enabled="{= ... ${HasActiveEntity} !== true ... }"`
  **Khái niệm IDTS**: Cho phép chọn file ở create draft nhưng vẫn chặn các trạng thái edit draft không an toàn.
  **Ảnh hưởng nếu sai**: Upload có thể bị disable khi create, hoặc bị enable khi bug đã có draft conflict.
  **Phải kiểm tra cùng**: CAP draft behavior và `BugCollaboration.js:isCreateDraftContext`.

- **Vị trí**: `idtsPendingAttachmentsList`
  **Khái niệm IDTS**: Hiện các file local đã chọn trước khi chúng được upload sau Save.
  **Ảnh hưởng nếu sai**: Nút upload dạng button-only sẽ không cho user biết file nào đang chờ upload.
  **Phải kiểm tra cùng**: i18n key `attachmentsPendingNoData` và static QA script của IDTS-73.
- The file row is gone after delete and no private storage URL is visible.

## IDTS-58 follow-up notes

### English

IDTS-58 tightened the Remove button state so it is enabled only when the opened bug is active and does not already have a draft. This keeps the row-level delete action aligned with the upload/comment controls and avoids offering a mutation path that CAP draft rules will reject.

Browser smoke for IDTS-58 verified the visible effect by entering draft edit on the Object Page and confirming that the Remove button switched to the disabled UI5 state.

### Vietnamese

Fragment này hiện dùng `BugCollaborationSection` làm root control. Control này giúp attachment table và action buttons nhận context của Bug hiện tại, để binding tương đối `attachments` trỏ đúng bug đang mở.

Các control upload/download/remove dùng module alias `Collaboration` qua `core:require`. Alias này phải khớp với `BugCollaboration.js`.

Nút Remove nằm trong một attachment row, nên binding context trực tiếp của nó là attachment row, không phải root bug. `BugCollaboration.js` phải đi lên root bug context trước khi chạy draft edit/delete.

Nếu sửa file này, browser smoke phải verify:

- Upload hiển thị file mới trong table.
- Download trả về đúng file được chọn.
- Remove mở confirmation và xóa file.
- Sau delete không còn row file và không lộ private storage URL.

## Binding walkthrough / Walkthrough binding (2026-07-18)

**English.** `BugCollaborationSection` supplies the root Bug context. FileUploader `change` calls `onAttachmentSelected`; the pending model shows files selected before SAVE; the main List binds persisted `attachments`. Download/Delete buttons pass each attachment row context to collaboration handlers. The browser never receives S3 credentials/private URLs—only CAP content endpoints. Missing row after SAVE: trace context activation and pending flush; content failure: trace CAP storage/S3 after metadata exists.

**Tiếng Việt.** `BugCollaborationSection` cấp root Bug context. FileUploader `change` gọi `onAttachmentSelected`; pending model hiện file chọn trước SAVE; List chính bind `attachments` đã persist. Nút Download/Delete chuyển row context attachment sang collaboration handler. Browser không nhận S3 credential/private URL—chỉ gọi CAP content endpoint. SAVE xong thiếu row thì trace context activation/pending flush; có metadata nhưng content lỗi thì trace CAP storage/S3.

## Retired by IDTS-116 (2026-08-03)

The source fragment was removed from the current application. This page is retained only as historical knowledge for IDTS-55/73. The current UI is the generated Fiori Elements `attachments/@UI.LineItem` facet backed by `@cap-js/attachments`; do not restore the custom FileUploader, browser-memory queue or manual draft activation chain.
