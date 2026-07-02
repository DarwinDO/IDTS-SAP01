# Knowledge: `srv/bug-service/drafts.js`

## English

### What this file is for

Handles draft-specific preparation and the SAVE event for Bug drafts.

### IDTS flow

Before PATCH on Bugs.drafts, `prepareDraftPatch` runs. On SAVE of the draft, `handleDraftSave` performs final preparation (similar to prepareBugWrite) and lets the draft activation proceed.

This is how the "create with attachments + assignee in one go" flow works cleanly.

### Important source anchors

- `prepareDraftPatch`, `handleDraftSave`.
  **IDTS concept**: Ensures draft editing also goes through the same business rules (componentCategory derivation, initial status decision when assignee is chosen) before the draft is activated into a real Bug.
  **Impact if broken**: Drafts can activate with bad data (missing componentCategory, wrong initial status).
  **Must check together**: `bug-write.js`, `srv/service.js` (before PATCH on drafts + on SAVE), `db/schema.cds`, Fiori create flow.

### Cross-folder dependency map

Called from `srv/service.js`. Shares logic with the non-draft write path.

### Safe editing checklist

Keep the draft and active write paths in sync. Test the full create + draft + activate path (including attachments) in the browser.

## Vietnamese

### File này dùng để làm gì

Xử lý chuẩn bị draft và sự kiện SAVE cho Bug draft.

### Flow hoạt động trong IDTS

Trước PATCH draft và khi SAVE draft, đảm bảo áp dụng cùng quy tắc nghiệp vụ trước khi activate thành Bug thật.

### Các điểm neo quan trọng

prepareDraftPatch, handleDraftSave.

### Liên kết

Gọi từ service.js. Chia sẻ logic với bug-write.

### Checklist

Giữ draft path và active path đồng bộ. Test create + draft + activate + attachment trên browser.

## Metadata

- Source file: `srv/bug-service/drafts.js`
- Knowledge mirror: `docs/knowledge/srv/bug-service/drafts.js.md`
- Source layer: `srv`
- Last reviewed: 2026-06-22

## 2026-07-01 update: validate while editing and before activation

### English

A Fiori draft is a temporary database copy while the user edits a form. `prepareDraftPatch()` now checks catalog values after combining the saved draft with the latest partial PATCH. Before `SAVE`, `validateDraftForSave()` reads the complete draft, checks required fields, and checks active catalog rows before activation.

- **Location**: `prepareDraftPatch()` and `validateDraftForSave()`
  **IDTS concept**: Validate once during editing for early feedback and again before a temporary draft becomes the official Bug.
  **Impact if broken**: Partial or interrupted draft flows can carry invalid classification data into activation.
  **Must check together**: `bug-write.js`, `service.js` PATCH/SAVE registration, `db/schema.cds`, and Object Page draft tests.

The two checks are deliberate: PATCH usually contains only one changed field, while SAVE is the final integrity gate over the complete draft.

### Vietnamese

Fiori draft là bản dữ liệu tạm trong database khi user đang sửa form. `prepareDraftPatch()` hiện kiểm tra catalog sau khi ghép draft đang lưu với phần PATCH mới nhất. Trước `SAVE`, `validateDraftForSave()` đọc lại toàn bộ draft, kiểm tra required fields và các dòng catalog active rồi mới cho activate.

- **Vị trí**: `prepareDraftPatch()` và `validateDraftForSave()`
  **Khái niệm IDTS**: Kiểm tra lúc edit để báo sớm và kiểm tra lần cuối trước khi bản tạm trở thành Bug chính thức.
  **Ảnh hưởng nếu sai**: Luồng draft gửi từng phần hoặc bị gián đoạn có thể mang dữ liệu phân loại sai vào activation.
  **Phải kiểm tra cùng**: `bug-write.js`, đăng ký PATCH/SAVE trong `service.js`, `db/schema.cds` và draft test trên Object Page.

Hai lần kiểm tra là có chủ ý: PATCH thường chỉ chứa một field vừa đổi, còn SAVE là cổng toàn vẹn cuối trên toàn bộ draft.
