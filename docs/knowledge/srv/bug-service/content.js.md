# Knowledge: `srv/bug-service/content.js`

## IDTS-122 child-content boundary

Comment and attachment mutations resolve their parent Bug first and reject the request when that Bug is Closed. Existing child rows remain readable and existing attachment content remains downloadable. After Reopen, the normal role and attachment/comment validations apply again.

## Beginner-first execution map (2026-07-18)

### English

`service.js` registers these handlers before writes to Comments and `Bugs.attachments`, for both active and draft targets. `prepareCommentCreate` resolves the parent Bug and authenticated actor, checks role/content, and overwrites author fields before INSERT. `prepareAttachmentWrite` resolves the parent Bug, checks role/action and metadata/MIME/size rules before the attachment adapter persists metadata/binary. PostgreSQL keeps attachment metadata/storage reference; S3 keeps file content. Break at the matching handler → parent Bug ID resolution → actor/role → normalized `req.data` → storage adapter. Rejecting here must occur before history/notification side effects.

### Vietnamese

`service.js` đăng ký các handler này trước thao tác ghi Comments và `Bugs.attachments`, cho cả target active lẫn draft. `prepareCommentCreate` resolve Bug cha và actor đã xác thực, kiểm role/content, rồi ghi đè author trước INSERT. `prepareAttachmentWrite` resolve Bug cha, kiểm role/action và rule metadata/MIME/size trước khi attachment adapter persist metadata/binary. PostgreSQL giữ metadata/storage reference; S3 giữ nội dung file. Break theo handler tương ứng → resolve Bug cha → actor/role → `req.data` đã normalize → storage adapter. Reject tại đây phải xảy ra trước side effect history/notification.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: SangVN. Flow: comments and attachments. Break at the preparation functions to distinguish client-side validation from final server authorization/file validation. Check the collaboration UI and attachment storage adapter as linked boundaries.

### Vietnamese

Primary owner: DonHV. Backup: SangVN. Flow: comments và attachments. Đặt breakpoint tại preparation function để phân biệt client validation với server authorization/file validation cuối. Kiểm tra collaboration UI và attachment storage adapter như boundary liên kết.

## English

### What this file is for

Prepares and guards write operations for Comments and Attachments (including draft handling).

### IDTS flow

Before CREATE of Comments and before any write on Attachments (including draft), the service calls the prepare functions here to set author, authorRole, and enforce size/media type rules.

After comment creation, side effects are recorded.

### Important source anchors

- `prepareCommentCreate`, `prepareAttachmentWrite`.
  **IDTS concept**: Ensures comments always have the correct author and role, and attachments respect the 10MB + allowed MIME types defined on the model.
  **Impact if broken**: Comments can be created anonymously or with wrong role; invalid or oversized attachments can be uploaded.
  **Must check together**: `srv/service.js` (before hooks on Comments and Bugs.attachments), `db/schema.cds` (Comments, BugAttachments), `history.js` (side effects), Fiori attachment and comment facets.

### Cross-folder dependency map

Wired in `srv/service.js`. Model rules in `db/schema.cds`. Side effects go to history. UI facets in the Object Page annotations.

### Safe editing checklist

Changes to attachment rules or comment authorship must be reflected here, in the schema annotations, and in any upload tests.

## Vietnamese

### File này dùng để làm gì

Chuẩn bị và bảo vệ ghi Comments và Attachments (kể cả draft).

### Flow hoạt động trong IDTS

Trước khi tạo Comment và trước mọi write Attachment, gọi prepare để set author/authorRole và kiểm tra quy tắc size/media type.

### Các điểm neo quan trọng

prepareCommentCreate, prepareAttachmentWrite.

### Liên kết

Wired ở service.js. Model ở schema. Side effect history. UI ở Object Page annotations.

### Checklist

Thay đổi quy tắc attachment/comment phải cập nhật ở đây + schema annotation + test upload.

## Metadata

- Source file: `srv/bug-service/content.js`
- Knowledge mirror: `docs/knowledge/srv/bug-service/content.js.md`
- Source layer: `srv`
- Last reviewed: 2026-06-22

## IDTS-122 Closed aggregate boundary

`prepareCommentCreate`, `prepareCommentMutation`, and `prepareAttachmentWrite` resolve the parent Bug and call the shared Closed-state guard. New comments, existing comment mutation, and attachment create/update/delete are denied while the parent Bug is `CLOSED`; reads and downloads remain allowed. CAP draft composition routing may reject an invalid direct child request before this custom guard, so deployed browser/API evidence is still required for the final route contract.
## IDTS-125 attachment ownership (2026-08-06)

**English.** Comment creation remains available to active Tester/Developer/PM users on open Bugs. Attachment create/update keeps the existing coordination rule: Tester/PM or the current Developer assignee. Attachment deletion is narrower: PM may delete any attachment on an open Bug, while a Tester or Developer may delete only an attachment that they uploaded. The guard reads the persisted attachment row to obtain `up__ID` and `createdBy`; it never trusts a client-supplied parent ID for authorization. `filename`, MIME type and size are metadata; the binary stream is handled by the SAP attachment adapter and must never be logged.

**Tiếng Việt.** Comment vẫn dành cho Tester/Developer/PM active trên Bug mở. Create/update attachment giữ rule điều phối hiện hành: Tester/PM hoặc Developer assignee hiện tại. Quyền delete chặt hơn: PM được xóa mọi attachment của Bug đang mở; Tester hoặc Developer chỉ được xóa attachment do chính mình upload. Guard đọc dòng attachment đã persist để lấy `up__ID` và `createdBy`, không tin parent ID do client gửi lên khi phân quyền. `filename`, MIME type và size là metadata; binary do SAP attachment adapter xử lý và không được ghi log.

Unmapped authenticated identities are rejected before comment authorship or attachment persistence. / Identity đã xác thực nhưng không map được IDTS user bị reject trước khi ghi author comment hoặc persist attachment.

## IDTS-110 draft-only attachment mutations (2026-09-08)

**English.** `rejectActiveAttachmentWrite` is the fail-closed guard for direct active attachment CREATE/PUT/UPDATE/PATCH/DELETE. Draft attachment mutations retain the existing actor, parent Bug, Closed-state, assignment, uploader and metadata validation in `prepareAttachmentWrite`. This prevents an API caller from bypassing draft activation and its add/remove History comparison.

**Tiếng Việt.** `rejectActiveAttachmentWrite` chặn fail-closed mọi CREATE/PUT/UPDATE/PATCH/DELETE trực tiếp lên attachment active. Mutation trên draft vẫn giữ toàn bộ kiểm tra actor, Bug cha, trạng thái Closed, assignee, uploader và metadata trong `prepareAttachmentWrite`. Nhờ vậy API caller không thể né draft activation và bước so sánh History add/remove.

## IDTS-127 comment length boundary (2026-09-12)

**English.** `validateCommentContent` is the shared CAP trust-boundary validator for comment text. It trims the submitted value, rejects empty content, and rejects more than 1000 JavaScript string units with a field-targeted HTTP 400 before author lookup or persistence. `prepareCommentCreate` uses it for the guarded Comment entity path, while `actions.js#addComment` uses the same function for the supported Object Page bound action. The UI intentionally does not set `maxLength`: SAPUI5 would otherwise silently shorten pasted input before CAP can reject the original value. If this limit changes, update this validator, the UI boundary regression, the bound-action regression, and the UAT expectation together.

**Tiếng Việt.** `validateCommentContent` là validator dùng chung tại trust boundary CAP cho nội dung comment. Hàm trim giá trị gửi lên, chặn nội dung rỗng và chặn chuỗi dài hơn 1000 đơn vị string JavaScript bằng HTTP 400 gắn đúng field trước khi tìm author hoặc ghi dữ liệu. `prepareCommentCreate` dùng hàm này cho đường Comment entity được bảo vệ, còn `actions.js#addComment` dùng cùng hàm cho bound action được Object Page hỗ trợ. UI cố ý không đặt `maxLength`, vì SAPUI5 có thể âm thầm cắt nội dung paste trước khi CAP kiểm tra giá trị gốc. Nếu đổi giới hạn, phải cập nhật validator này, regression boundary UI, regression bound action và kỳ vọng UAT cùng lúc.
