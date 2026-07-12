# Knowledge: `srv/bug-service/content.js`

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
