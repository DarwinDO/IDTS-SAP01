# Knowledge: `srv/bug-service/history-read-models.js`

## English

### What this file is for

Enriches HistoryEvents for the UI: computes `changeCount` and a readable `groupedChangeContext` summary so the Object Page history section shows human-friendly grouped changes instead of raw field-by-field logs.

### IDTS flow

After reading HistoryEvents (or drafts), the after hook calls `enrichHistoryEventPayload`. It looks at the child HistoryLogs and builds a compact summary of what changed in that event.

This supports the "grouped history" requirement so PM and developers can quickly understand what happened to a bug.

### Important source anchors

- `enrichHistoryEventPayload` + `HISTORY_FIELD_ORDER`, `LONG_TEXT_FIELDS`.
  **IDTS concept**: Turns the append-only HistoryLogs into a readable event for the UI timeline.
  **Impact if broken**: History on Object Page becomes a long list of tiny field changes instead of useful grouped summaries.
  **Must check together**: `srv/service.cds` (HistoryEvents with virtuals), `history.js` (writing the events/logs), Fiori history facet / annotations.

### Cross-folder dependency map

Registered in `srv/service.js`. Depends on the HistoryEvents + HistoryLogs model in `db/schema.cds`. Used by the history facet in the Fiori Object Page.

### Safe editing checklist

When changing what fields are recorded in history or how grouped context is built, update both this file and the Fiori history annotations/tests.

## Vietnamese

### File này dùng để làm gì

Làm giàu HistoryEvents cho UI: tính changeCount và groupedChangeContext để phần lịch sử Object Page hiện tóm tắt thay đổi theo nhóm thay vì log chi tiết từng field.

### Flow hoạt động trong IDTS

Sau khi đọc HistoryEvents, hook after gọi enrich để xây dựng tóm tắt từ child HistoryLogs.

Hỗ trợ yêu cầu "grouped history" để PM và developer dễ hiểu chuyện gì đã xảy ra với bug.

### Các điểm neo quan trọng

enrichHistoryEventPayload + các hằng HISTORY_FIELD_ORDER, LONG_TEXT_FIELDS.

### Liên kết

Đăng ký ở service.js. Dựa schema HistoryEvents/HistoryLogs. Dùng bởi history facet Fiori.

### Checklist

Khi thay đổi field ghi history hoặc cách nhóm, cập nhật cả file này và annotation/test Fiori.

## Metadata

- Source file: `srv/bug-service/history-read-models.js`
- Knowledge mirror: `docs/knowledge/srv/bug-service/history-read-models.js.md`
- Source layer: `srv`
- Last reviewed: 2026-06-22