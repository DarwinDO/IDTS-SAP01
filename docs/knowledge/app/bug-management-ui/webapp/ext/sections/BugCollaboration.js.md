# Knowledge: `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js`

> **Ownership / debug anchor:** SangVN owns collaboration behavior after a bug exists (backup: DonHV). Break at the UI action, inspect the OData request, then follow the service authorization and persistence path.
> **Ownership / điểm debug:** SangVN sở hữu collaboration sau khi bug đã tồn tại (backup: DonHV). Dừng tại UI action, xem OData request, rồi theo service authorization và persistence.

## English

### What this file is for

This file is the SAPUI5 controller-style helper for the custom Object Page collaboration sections added in IDTS-55.

It handles four user actions:

- post a comment;
- upload an evidence file;
- download an evidence file;
- remove an evidence file.

The important point for a new developer is that this file does not create a new backend feature. It connects the new Fiori-style UI to the existing CAP/OData contract: `Bugs.addComment`, the draft-enabled `Bugs` entity, and `Bugs_attachments`.

### Beginner explanation

Fiori Elements generates most of the Object Page automatically from annotations. That is good for standard enterprise pages, but the default comments and attachments tables were too plain for manual QA. IDTS-55 therefore adds custom XML fragments for comments and evidence files.

This JavaScript module is the "behavior" behind those fragments. The fragments draw the text area, feed, upload button, table, download button, and delete button. This file decides what happens when the user presses those controls.

For attachments, the flow must respect CAP draft behavior. The UI cannot directly change a child attachment row on an active bug. It must:

1. open a draft for the active bug;
2. create attachment metadata under that draft;
3. upload the binary content to the attachment media endpoint;
4. activate the draft so the attachment becomes part of the active bug.

That is why upload/delete looks longer than a normal one-call request.

### Flow in IDTS

- Tester, Developer, or PM opens a bug Object Page.
- `manifest.json` loads `CommentsSection.fragment.xml` and `AttachmentsSection.fragment.xml`.
- Those fragments call handlers from this module.
- Comment posting calls the existing `BugService.addComment` bound action.
- Evidence upload/delete uses CAP draft edit and draft activate around `Bugs_attachments`.
- Download reads attachment content through OData and saves it locally without exposing an S3 URL.

### Important source anchors

- **Location**: `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js:101`
  `function assertSavedBug(context)`
  **IDTS concept**: Comments and evidence belong to a saved bug, not to a brand-new unsaved draft or a bug with another draft already open.
  **Impact if broken**: Users can attempt comment/upload actions in an unsafe state and may see confusing CAP draft errors instead of clear product messages.
  **Must check together**: `app/bug-management-ui/webapp/ext/fragment/CommentsSection.fragment.xml`, `app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml`, `srv/service.cds` draft-enabled `Bugs`, and the HTTP QA script `scripts/qa/test-comments-attachments.ps1`.

- **Location**: `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js:144`
  `function requestJson(url, options)`
  **IDTS concept**: Shared JSON request helper for custom Object Page actions.
  **Impact if broken**: Comment posting, draft edit, metadata creation, draft activation, or delete can fail together.
  **Must check together**: `app/bug-management-ui/webapp/auth-guard.js`, because auth token injection is centralized there through `XMLHttpRequest`, not repeated in this module.

- **Location**: `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js:233`
  `onAddComment`
  **IDTS concept**: User-facing comment creation through the existing `BugService.addComment` action.
  **Impact if broken**: The Object Page can show a comment input but not actually create auditable comments; history and QA evidence can become incomplete.
  **Must check together**: `srv/service.cds` action `addComment`, `srv/bug-service/actions.js`, `app/bug-management-ui/annotations/history-notifications.cds`, and `CommentsSection.fragment.xml`.

- **Location**: `formatAuthorInfo(...)`
  **IDTS concept**: Feed metadata should complement the sender label, not repeat it.
  **Impact if broken**: The same author name can appear twice in one feed item, making the comment section noisy and less Fiori-like.
  **Must check together**: `CommentsSection.fragment.xml` sender/info bindings and browser smoke for comment rendering.

- **Location**: `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js:268`
  `onAttachmentSelected`
  **IDTS concept**: Evidence upload through CAP draft flow and `Bugs_attachments`.
  **Impact if broken**: Users may lose evidence upload, duplicate drafts, or create metadata without binary content.
  **Must check together**: `db/schema.cds` attachment composition, `srv/bug-service/content.js`, `srv/bug-service/history.js`, `scripts/qa/test-comments-attachments.ps1`, and AWS S3/Render QA attachment smoke evidence.

- **Location**: `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js:324`
  `onDownloadAttachment`
  **IDTS concept**: Download evidence through the protected OData media endpoint, not by exposing object storage details.
  **Impact if broken**: Users may be unable to download evidence, or the UI may accidentally reveal implementation details such as S3/private storage URLs.
  **Must check together**: `@cap-js/attachments` media configuration in `db/schema.cds`, `srv/bug-service/content.js`, and browser smoke for download.

- **Location**: `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js:347`
  `onDeleteAttachment`
  **IDTS concept**: Evidence removal through the same safe draft edit/activate pattern used for upload.
  **Impact if broken**: A deleted file may remain in the active bug, or draft activation may fail after metadata deletion.
  **Must check together**: `AttachmentsSection.fragment.xml`, `scripts/qa/test-comments-attachments.ps1`, and attachment history side effects in `srv/bug-service/history.js`.

### Cross-folder impact

- `app/bug-management-ui/webapp/manifest.json` registers the fragments that call this module.
- `srv/service.cds` exposes the `Bugs.addComment` action and the `Bugs_attachments` media entity.
- `db/schema.cds` defines the attachment composition and managed attachment fields.
- `srv/bug-service/content.js` validates and prepares attachment writes.
- `srv/bug-service/history.js` records attachment side effects into history.
- `scripts/qa/test-comments-attachments.ps1` is the closest test reference for the exact draft upload flow.

### Safe editing checklist

- Keep all user-facing errors generic and product-friendly. Do not show SQL, S3, OData internals, draft technical terms, tokens, or stack traces.
- Do not read auth tokens directly here. `auth-guard.js` owns request authentication for the Fiori app.
- If the attachment draft sequence changes, update this module and `scripts/qa/test-comments-attachments.ps1` together.
- Do not expose private object storage links in the UI.
- Rerun UI5 build and comments/attachments QA after changes.

## Vietnamese

### File này dùng để làm gì

File này là helper xử lý hành vi SAPUI5 cho hai section custom trên Bug Object Page trong IDTS-55.

Nó xử lý bốn hành động của người dùng:

- đăng comment;
- upload file evidence;
- download file evidence;
- xóa file evidence.

Điểm quan trọng cho người mới là file này không tạo nghiệp vụ backend mới. Nó nối UI mới với contract CAP/OData đã có sẵn: action `Bugs.addComment`, entity `Bugs` có draft, và media entity `Bugs_attachments`.

### Giải thích cho người mới

Fiori Elements tự sinh phần lớn Object Page từ annotation. Cách này rất tốt cho màn hình enterprise chuẩn, nhưng bảng comments và attachments mặc định hơi thô, khó dùng khi QA thủ công. Vì vậy IDTS-55 thêm hai XML fragment riêng cho comments và evidence files.

JavaScript module này là phần “hành vi” phía sau hai fragment đó. Fragment vẽ text area, feed, nút upload, bảng file, nút download và nút delete. File này quyết định khi user bấm các control đó thì gọi backend như thế nào.

Với attachment, flow phải đi theo CAP draft. UI không nên sửa trực tiếp attachment con trên bug active. Nó cần:

1. mở một draft từ bug active;
2. tạo metadata attachment trong draft đó;
3. upload binary content vào media endpoint của attachment;
4. activate draft để attachment trở thành dữ liệu active của bug.

Vì vậy upload/delete dài hơn một request thông thường.

### Flow trong IDTS

- Tester, Developer hoặc PM mở Bug Object Page.
- `manifest.json` load `CommentsSection.fragment.xml` và `AttachmentsSection.fragment.xml`.
- Hai fragment gọi handler trong module này.
- Đăng comment gọi action có sẵn `BugService.addComment`.
- Upload/delete evidence dùng draft edit và draft activate quanh `Bugs_attachments`.
- Download đọc nội dung file qua OData, không để lộ URL S3/private storage.

### Các điểm neo quan trọng trong source

- **Vị trí**: `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js:101`
  `function assertSavedBug(context)`
  **Khái niệm IDTS**: Comment và evidence phải gắn với bug đã lưu, không gắn với bug mới chưa lưu hoặc bug đang có draft khác.
  **Ảnh hưởng nếu sai**: User có thể bấm comment/upload ở trạng thái không an toàn và gặp lỗi draft khó hiểu thay vì thông báo sản phẩm rõ ràng.
  **Phải kiểm tra cùng**: `CommentsSection.fragment.xml`, `AttachmentsSection.fragment.xml`, `srv/service.cds` draft-enabled `Bugs`, và script `scripts/qa/test-comments-attachments.ps1`.

- **Vị trí**: `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js:144`
  `function requestJson(url, options)`
  **Khái niệm IDTS**: Helper gọi request JSON dùng chung cho action custom trên Object Page.
  **Ảnh hưởng nếu sai**: Post comment, draft edit, tạo metadata, draft activate hoặc delete có thể hỏng cùng lúc.
  **Phải kiểm tra cùng**: `app/bug-management-ui/webapp/auth-guard.js`, vì token được inject tập trung qua `XMLHttpRequest`, không tự đọc lại trong module này.

- **Vị trí**: `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js:233`
  `onAddComment`
  **Khái niệm IDTS**: Tạo comment qua action `BugService.addComment` đã có sẵn.
  **Ảnh hưởng nếu sai**: Object Page có ô nhập comment nhưng không tạo được comment audit được; history và evidence QA có thể thiếu.
  **Phải kiểm tra cùng**: action `addComment` trong `srv/service.cds`, `srv/bug-service/actions.js`, `app/bug-management-ui/annotations/history-notifications.cds`, và `CommentsSection.fragment.xml`.

- **Vị trí**: `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js:268`
  `onAttachmentSelected`
  **Khái niệm IDTS**: Upload evidence qua CAP draft flow và `Bugs_attachments`.
  **Ảnh hưởng nếu sai**: User có thể không upload được evidence, tạo draft trùng, hoặc tạo metadata nhưng thiếu binary content.
  **Phải kiểm tra cùng**: attachment composition trong `db/schema.cds`, `srv/bug-service/content.js`, `srv/bug-service/history.js`, `scripts/qa/test-comments-attachments.ps1`, và evidence upload trên shared QA/Render.

- **Vị trí**: `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js:324`
  `onDownloadAttachment`
  **Khái niệm IDTS**: Download evidence qua OData media endpoint được bảo vệ, không expose chi tiết object storage.
  **Ảnh hưởng nếu sai**: User không tải được evidence, hoặc UI vô tình để lộ chi tiết lưu trữ như URL S3/private storage.
  **Phải kiểm tra cùng**: cấu hình media attachment trong `db/schema.cds`, `srv/bug-service/content.js`, và browser smoke download.

- **Vị trí**: `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js:347`
  `onDeleteAttachment`
  **Khái niệm IDTS**: Xóa evidence bằng cùng pattern draft edit/activate như upload.
  **Ảnh hưởng nếu sai**: File đã xóa có thể vẫn còn trên bug active, hoặc draft activate fail sau khi metadata bị xóa.
  **Phải kiểm tra cùng**: `AttachmentsSection.fragment.xml`, `scripts/qa/test-comments-attachments.ps1`, và side effect history trong `srv/bug-service/history.js`.

### Liên kết với file/folder khác

- `app/bug-management-ui/webapp/manifest.json` đăng ký fragment gọi module này.
- `srv/service.cds` expose action `Bugs.addComment` và media entity `Bugs_attachments`.
- `db/schema.cds` định nghĩa composition attachment và các field managed attachment.
- `srv/bug-service/content.js` validate và chuẩn bị ghi attachment.
- `srv/bug-service/history.js` ghi side effect attachment vào history.
- `scripts/qa/test-comments-attachments.ps1` là test reference gần nhất cho đúng draft upload flow.

### Checklist sửa an toàn

- Giữ thông báo lỗi cho user ở mức dễ hiểu và an toàn. Không hiện SQL, S3, OData internals, draft technical details, token hoặc stack trace.
- Không tự đọc auth token ở đây. `auth-guard.js` chịu trách nhiệm authentication request cho app Fiori.
- Nếu đổi sequence draft attachment, phải update module này và `scripts/qa/test-comments-attachments.ps1` cùng lúc.
- Không expose private object storage link lên UI.
- Sau khi sửa, chạy lại `npx eslint app/bug-management-ui/webapp/ext/sections/BugCollaboration.js`, UI5 build, và QA comments/attachments.

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/sections/BugCollaboration.js.md`
- Source layer: `app`
- Last reviewed: 2026-07-05

## IDTS-55 runtime fix notes

### English

After browser smoke, this file has three important runtime rules:

- `isBugContext()` must accept only the root bug path `/Bugs(...)`. It must not accept child paths such as `/Bugs(...)/attachments(...)`.
- After changing comments or attachments, refresh the owning Bug context with `requestRefresh()`. Direct refresh on the relative `comments` or `attachments` OData V4 list binding is not supported in this runtime.
- Formatter and event-handler module aliases are loaded from `core:require` in the XML controls. If alias names change in the fragments, this file and browser smoke must be checked together.

These rules were added because the browser found real runtime failures that static build checks could not catch: missing formatter resolution, missing section context, stale list data after comment post, and wrong context selection during attachment delete.

## IDTS-58 follow-up notes

### English

IDTS-58 kept the comment sender in `FeedListItem.sender` and changed `formatAuthorInfo(...)` so the info line shows role/timestamp context without repeating the same display name again. Browser smoke should therefore confirm that the page no longer contains patterns like `DonHV - Project Manager` while the sender label itself still shows `DonHV`.

## IDTS-73 create-page attachment notes

### English

IDTS-73 changes this module so attachments can be selected while the user is still creating a new bug. The file is not uploaded immediately because a new draft bug does not yet have a stable active bug record. Instead, the selected browser `File` objects are kept only in memory, keyed by the draft bug ID. After Fiori Elements saves the new bug and the Object Page receives the active bug context, `flushPendingCreateAttachments(...)` reuses the same saved-bug upload sequence that existing attachments already use: draft edit, create attachment metadata, PUT binary content, then draft activate.

This is intentionally a UI-only pending queue. There is no temporary S3 object, no extra backend temp table, and no public temporary upload endpoint. If the browser tab is closed before Save, the selected files are lost, which is safer than leaving orphan files in object storage.

Important anchors added by IDTS-73:

- **Location**: `pendingCreateAttachmentsByBugId`
  **IDTS concept**: Browser-memory holding area for files selected during Create Bug.
  **Impact if broken**: Files selected before Save may disappear silently or upload to the wrong bug.
  **Must check together**: `AttachmentsSection.fragment.xml`, `BugCollaborationSection.js`, and `scripts/qa/test-idts73-create-attachments-ui.js`.

- **Location**: `isCreateDraftContext(context)`
  **IDTS concept**: A brand-new bug draft is different from editing an existing active bug.
  **Impact if broken**: The UI may either block valid create-time file selection or allow unsafe writes to an edit draft.
  **Must check together**: Fiori Object Page create flow and draft properties `IsActiveEntity`, `HasActiveEntity`, and `HasDraftEntity`.

- **Location**: `uploadFilesToSavedBug(...)`
  **IDTS concept**: One shared upload implementation for both existing bugs and files selected during create.
  **Impact if broken**: IDTS may pass one path but fail the other, creating inconsistent attachment behavior.
  **Must check together**: `scripts/qa/test-comments-attachments-programmatic.js`, the HTTP draft attachment script, and shared QA upload smoke.

### Vietnamese

IDTS-73 thay đổi module này để người dùng có thể chọn attachment ngay khi đang tạo bug mới. File chưa được upload ngay vì draft bug mới chưa có bản ghi active ổn định. Thay vào đó, các browser `File` object chỉ được giữ trong bộ nhớ của tab, theo draft bug ID. Sau khi Fiori Elements lưu bug mới và Object Page nhận context của bug active, `flushPendingCreateAttachments(...)` dùng lại đúng sequence upload đã có cho bug đã lưu: draft edit, tạo metadata attachment, PUT binary content, rồi draft activate.

Đây là hàng đợi tạm chỉ ở phía UI. Không có file tạm trên S3, không có bảng temp backend mới, và không có public temporary upload endpoint. Nếu đóng tab trước khi Save, các file đã chọn sẽ mất; cách này an toàn hơn việc để lại file mồ côi trong object storage.

Các anchor quan trọng thêm bởi IDTS-73:

- **Vị trí**: `pendingCreateAttachmentsByBugId`
  **Khái niệm IDTS**: Nơi giữ file trong bộ nhớ browser khi user chọn file trong lúc Create Bug.
  **Ảnh hưởng nếu sai**: File chọn trước khi Save có thể mất âm thầm hoặc bị upload vào sai bug.
  **Phải kiểm tra cùng**: `AttachmentsSection.fragment.xml`, `BugCollaborationSection.js`, và `scripts/qa/test-idts73-create-attachments-ui.js`.

- **Vị trí**: `isCreateDraftContext(context)`
  **Khái niệm IDTS**: Draft của bug mới khác với draft khi đang chỉnh một bug active đã tồn tại.
  **Ảnh hưởng nếu sai**: UI có thể chặn nhầm việc chọn file khi tạo mới, hoặc cho phép ghi không an toàn vào edit draft.
  **Phải kiểm tra cùng**: Fiori Object Page create flow và các draft property `IsActiveEntity`, `HasActiveEntity`, `HasDraftEntity`.

- **Vị trí**: `uploadFilesToSavedBug(...)`
  **Khái niệm IDTS**: Một implementation upload dùng chung cho cả bug đã lưu và file được chọn trong lúc tạo bug.
  **Ảnh hưởng nếu sai**: Một flow có thể pass còn flow còn lại fail, làm behavior attachment không nhất quán.
  **Phải kiểm tra cùng**: `scripts/qa/test-comments-attachments-programmatic.js`, HTTP draft attachment script, và shared QA upload smoke.

The same smoke also verified that attachment upload still works after the UI cleanup. That matters because this module owns both the visible comment/feed behavior and the draft-based attachment sequence.

### Vietnamese

Sau browser smoke, file này có ba rule runtime quan trọng:

- `isBugContext()` chỉ được nhận root bug path `/Bugs(...)`. Không được nhận path con như `/Bugs(...)/attachments(...)`.
- Sau khi đổi comments hoặc attachments, phải refresh context Bug sở hữu bằng `requestRefresh()`. Runtime hiện tại không hỗ trợ refresh trực tiếp trên relative OData V4 list binding `comments` hoặc `attachments`.
- Formatter và event handler module alias được load từ `core:require` trong XML controls. Nếu đổi alias trong fragment, phải kiểm tra file này và browser smoke cùng lúc.

Các rule này được thêm vì browser đã phát hiện lỗi runtime thật mà static build không thấy được: formatter không resolve, custom section thiếu context, list không cập nhật sau post comment, và chọn nhầm context khi delete attachment.

## Detailed request lifecycle / Vòng đời request chi tiết (2026-07-18)

**English.** Comments: button → `onAddComment()` → locate root Bug and TextArea → bound `BugService.addComment` → backend persists comment/history → `refreshBugContext()` reloads navigation. Attachments after save: select → validate → edit draft → POST metadata → PUT binary content → activate draft → refresh. Before save, `queuePendingCreateAttachments()` keeps browser `File` objects only in memory; `flushPendingCreateAttachments()` runs after the Bug becomes active. PostgreSQL stores metadata; CAP's storage adapter sends bytes to S3. Breakpoint order: event handler → `request()`/Network → CAP endpoint → refresh.

**Tiếng Việt.** Comment: nút → `onAddComment()` → tìm root Bug và TextArea → bound action `BugService.addComment` → backend persist comment/history → `refreshBugContext()` nạp lại navigation. Attachment sau save: chọn → validate → edit draft → POST metadata → PUT binary → activate draft → refresh. Trước save, `queuePendingCreateAttachments()` chỉ giữ `File` trong memory browser; `flushPendingCreateAttachments()` chạy khi Bug thành active. PostgreSQL giữ metadata; storage adapter CAP gửi bytes lên S3. Breakpoint: event handler → `request()`/Network → CAP endpoint → refresh.

## IDTS-116 current SAP-standard flow (2026-08-03)

The IDTS-73 custom attachment sequence above is historical and is superseded. `BugCollaboration.js` now owns only the custom Comments section. `onAddComment()` invokes the bound `BugService.addComment(...)` operation through the UI5 OData V4 model, so UI5 owns CSRF/session handling and the controller never sends a raw write request.

Attachment upload, download, delete, draft Save and draft Discard are now owned by the generated Fiori Elements facet from `@cap-js/attachments`. The custom browser-memory file queue and manual `draftEdit → metadata POST → content PUT → draftActivate` chain were removed. Debug attachments through the generated `attachments/@UI.LineItem` facet, CAP attachment plugin and storage adapter, not through this controller.

Luồng IDTS-73 bên trên chỉ còn giá trị lịch sử. File này hiện chỉ xử lý Comments. Comment gọi bound action bằng OData V4 model để UI5 tự quản lý CSRF/session. Attachment dùng facet chuẩn do Fiori Elements và `@cap-js/attachments` sinh; Fiori Elements sở hữu draft lifecycle, còn CAP plugin quản lý metadata/content/storage.
