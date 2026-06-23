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