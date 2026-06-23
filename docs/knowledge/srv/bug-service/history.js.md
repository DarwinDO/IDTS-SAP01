# Knowledge: `srv/bug-service/history.js`

## English

### What this file is for

Writes HistoryEvents and HistoryLogs for every significant change to a Bug, plus side effects for Comments and Attachments.

Also contains helpers to decide what changed and which actionType to record.

### IDTS flow

After CREATE/UPDATE of Bugs and after CREATE of Comments, the after hooks call the record*SideEffects functions. These create a HistoryEvent, attach the changed fields as HistoryLogs, and create in-app Notifications when appropriate.

This implements the required audit trail and the grouped history shown on the Object Page.

### Important source anchors

- `recordCreateSideEffects`, `recordUpdateSideEffects`, `recordCommentCreateSideEffects`, `writeHistoryEvent`.
  **IDTS concept**: Guarantees that create, every important field change, comments, and attachments produce immutable audit records + notifications.
  **Impact if broken**: No history visible for PM or developer, no notifications, broken SAP490 audit evidence.
  **Must check together**: `srv/service.js` (after hooks), `db/schema.cds` (HistoryEvents + HistoryLogs + Notifications), `history-read-models.js`, Fiori history facet.

- `importantChanges`, `actionTypeForChange`.
  **IDTS concept**: Decide which fields are worth recording as history and which high-level actionType the event represents.
  **Impact if broken**: History becomes either too noisy or misses important changes (status, assignee, rejectionReason, etc.).
  **Must check together**: constants (HISTORY_FIELD_LABELS, ACTION), the places that call writeHistoryEvent.

### Cross-folder dependency map

Wired exclusively through `srv/service.js` after hooks. Model in `db/schema.cds`. Display enrichment in history-read-models. Notifications created here are shown in the Notifications facet.

### Safe editing checklist

When you add a field that should be audited, add it to the important changes logic and HISTORY_FIELD_LABELS. When adding new notification triggers, add the corresponding writeNotification call. Update tests and the history facet annotations.

## Vietnamese

### File này dùng để làm gì

Ghi HistoryEvents + HistoryLogs cho mọi thay đổi quan trọng của Bug, comment, attachment. Chứa helper quyết định thay đổi gì và actionType nào.

### Flow hoạt động trong IDTS

Sau CREATE/UPDATE Bugs và CREATE Comments, after hooks gọi record side effects → tạo HistoryEvent + Logs + Notification.

Thực hiện audit trail và lịch sử nhóm trên Object Page.

### Các điểm neo quan trọng

record*SideEffects, writeHistoryEvent, importantChanges, actionTypeForChange.

### Liên kết

Chỉ gọi qua after hooks ở service.js. Model ở schema. Làm giàu hiển thị ở history-read-models. Notification facet.

### Checklist

Thêm field audit → cập nhật importantChanges + labels. Thêm trigger notification → thêm write. Cập nhật test và annotation history facet.

## Metadata

- Source file: `srv/bug-service/history.js`
- Knowledge mirror: `docs/knowledge/srv/bug-service/history.js.md`
- Source layer: `srv`
- Last reviewed: 2026-06-22