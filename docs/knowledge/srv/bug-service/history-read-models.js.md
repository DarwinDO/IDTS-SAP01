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

## IDTS History Wording Normalization

### English

This file now normalizes history field labels before sending them to the UI.

The reason is subtle: `HistoryLogs.fieldLabel` is persisted in the database when the event is written. Older rows can therefore still contain `Next Processor User` and `Next Processor Role` even after the source constants are renamed. Without read-time normalization, old bugs keep showing outdated wording in the History Timeline forever.

The read model now does two things:

1. For known field names, it prefers the current label from `HISTORY_FIELD_LABELS`.
2. For legacy persisted labels, it maps:
   - `Next Processor User` -> `Current Action Owner`
   - `Next Processor Role` -> `Action Owner Role`

This affects both `groupedChangeContext` and expanded `logs`, so the short timeline sentence and the detail table stay consistent.

- **Location**: `srv/bug-service/history-read-models.js:50-54`
  **IDTS concept**: Legacy label compatibility for persisted audit rows.
  **Impact if broken**: Existing Render/local history can still show old “Next Processor” wording even if new history rows are correct.
  **Must check together**: `srv/bug-service/constants.js`, `scripts/qa/test-history-events-programmatic.js`, Fiori History Timeline fragment.

- **Location**: `srv/bug-service/history-read-models.js:120-139`
  **IDTS concept**: One normalized display label is used for both summary and expanded log table.
  **Impact if broken**: Timeline summary and expanded table can disagree, making the audit trail look inconsistent.
  **Must check together**: `HistoryEvents.groupedChangeContext`, `HistoryEvents.logs/fieldLabel`, browser smoke on the Object Page History section.

### Vietnamese

File này hiện normalize label của history trước khi trả dữ liệu về UI.

Lý do hơi dễ bị bỏ sót: `HistoryLogs.fieldLabel` được lưu cứng vào database ngay lúc event được ghi. Vì vậy các row cũ vẫn có thể chứa `Next Processor User` và `Next Processor Role` dù source constant đã đổi tên. Nếu không normalize khi đọc, các bug cũ sẽ tiếp tục hiện wording cũ trong History Timeline mãi.

Read model hiện làm hai việc:

1. Với field name đã biết, ưu tiên label mới nhất từ `HISTORY_FIELD_LABELS`.
2. Với label cũ đã lưu trong database, map lại:
   - `Next Processor User` -> `Current Action Owner`
   - `Next Processor Role` -> `Action Owner Role`

Việc này áp dụng cho cả `groupedChangeContext` và `logs` mở rộng, nên câu tóm tắt ngắn trong timeline và bảng detail bên dưới dùng cùng một cách gọi.

- **Vị trí**: `srv/bug-service/history-read-models.js:50-54`
  **Khái niệm IDTS**: Tương thích label cũ cho audit row đã lưu trước đó.
  **Ảnh hưởng nếu sai**: History hiện có trên Render/local vẫn có thể hiện chữ “Next Processor” dù history mới đã đúng.
  **Phải kiểm tra cùng**: `srv/bug-service/constants.js`, `scripts/qa/test-history-events-programmatic.js`, Fiori History Timeline fragment.

- **Vị trí**: `srv/bug-service/history-read-models.js:120-139`
  **Khái niệm IDTS**: Dùng một label hiển thị đã normalize cho cả summary và bảng log mở rộng.
  **Ảnh hưởng nếu sai**: Timeline summary và bảng detail có thể dùng hai wording khác nhau, làm audit trail trông không nhất quán.
  **Phải kiểm tra cùng**: `HistoryEvents.groupedChangeContext`, `HistoryEvents.logs/fieldLabel`, browser smoke ở Object Page History section.
