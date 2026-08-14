# Knowledge: `srv/bug-service/history.js`

## IDTS-89 exact command summaries and compatibility

`buildHistorySummary` now has an explicit case for each exact workflow ActionType. It does not infer Mark In Review or Start Progress from the destination status when the command code is already known. `actorForAction` recognizes the new developer/coordinator groups while preserving legacy fallbacks. `writeHistoryEvent` copies the exact code to both the parent event and every field-level log. Legacy categories remain readable and are not rewritten.

## Beginner-first execution map (2026-07-18)

### English

After-handlers and draft SAVE code call the four `record*SideEffects` entry points. They derive meaningful changes with `importantChanges`, choose action type/summary, enrich raw IDs/codes into display labels, and persist one HistoryEvent plus child HistoryLogs through `writeHistoryEvent`. Status events may call `writeNotificationForStatus`, which writes notification/outbox but does not send email. Attachment audit compares metadata only. Debug: source after-handler → change list → actor → enriched values → HistoryEvent INSERT → HistoryLogs INSERT → optional notification. `statusActionSummary` is user-facing wording; it must not expose internal “next processor” terminology. Audit should be created only after the primary change succeeds.

### Vietnamese

After-handler và code draft SAVE gọi bốn entry point `record*SideEffects`. Chúng lấy thay đổi có ý nghĩa bằng `importantChanges`, chọn action type/summary, enrich raw ID/code thành display label, rồi persist một HistoryEvent cùng HistoryLogs con qua `writeHistoryEvent`. Event status có thể gọi `writeNotificationForStatus`, hàm ghi notification/outbox chứ không gửi email trực tiếp. Audit attachment chỉ so metadata. Debug theo source after-handler → change list → actor → display value đã enrich → INSERT HistoryEvent → INSERT HistoryLogs → notification tùy chọn. `statusActionSummary` là wording user-facing; không được lộ thuật ngữ nội bộ “next processor”. Audit chỉ được tạo sau khi thay đổi chính thành công.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: SangVN. Flow: committed business change -> audit/history/notification. Break after a successful write to verify which event and notification should exist. Do not edit old audit rows merely to alter presentation text.

### Vietnamese

Primary owner: DonHV. Backup: SangVN. Flow: committed business change -> audit/history/notification. Đặt breakpoint sau write thành công để kiểm tra event/notification nào phải tồn tại. Không sửa audit row cũ chỉ để đổi presentation text.

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

## IDTS-122 Retest-owner audit display

History normalization maps `retestOwner` UUID values through `displayUserName`, and `REASSIGN_RETEST_OWNER` has its own human-readable summary. Raw IDs remain available in audit values, while the timeline uses Tester display names.

## IDTS-36 Notification Handoff Update

### English

This file still decides who receives a notification and for which bug lifecycle event. It no longer inserts only an in-app row itself. At `writeNotificationForStatus`, it passes the current request transaction to `srv/email/outbox.js`, which atomically creates both the source notification and email delivery record.

- **Location**: `srv/bug-service/history.js:29` and `:350`
  import and call of `writeNotificationRecord(cds.tx(req), ..., getEmailConfig())`
  **IDTS concept**: Keep history, notification, and outbox creation in the same business transaction while leaving SMTP network delivery to a later worker.
  **Impact if broken**: Status/history can commit without notification tracking, or SMTP can accidentally return to the critical workflow path.
  **Must check together**: `srv/email/outbox.js:18`, `db/schema.cds` notification entities, workflow notification tests.

### Vietnamese

File này vẫn quyết định ai nhận notification và lifecycle event nào cần thông báo. Tuy nhiên nó không còn tự insert duy nhất một in-app row. Tại `writeNotificationForStatus`, nó truyền request transaction hiện tại sang `srv/email/outbox.js`; module đó tạo source notification và email delivery một cách atomic.

- **Vị trí**: `srv/bug-service/history.js:29` và `:350`
  import và gọi `writeNotificationRecord(cds.tx(req), ..., getEmailConfig())`
  **Khái niệm IDTS**: Giữ history, notification và outbox trong cùng business transaction nhưng để việc kết nối SMTP cho worker chạy sau.
  **Ảnh hưởng nếu sai**: Status/history có thể commit mà thiếu notification tracking hoặc SMTP quay lại chặn critical workflow.
  **Phải kiểm tra cùng**: `srv/email/outbox.js:18`, các entity notification trong `db/schema.cds`, workflow notification tests.

## Immediate delivery handoff (2026-08-12)

**English.** `writeNotificationForStatus` now calls `writeNotificationAndSchedule(req, entry)`. The wrapper writes the notification/outbox in the current request transaction and registers one immediate worker kick only when the resulting email delivery is `PENDING`. The actual sender still runs only after `req.on('succeeded')`.

**Tiếng Việt.** `writeNotificationForStatus` nay gọi `writeNotificationAndSchedule(req, entry)`. Wrapper ghi notification/outbox trong transaction request hiện tại và chỉ đăng ký một immediate worker kick khi email delivery là `PENDING`. Sender thật vẫn chỉ chạy sau `req.on('succeeded')`.
## IDTS-125 attachment deletion audit (2026-08-06)

**English.** Attachment deletion history is derived at the authoritative draft `SAVE` boundary. The handler compares the pre-save active attachment snapshot with the post-save active metadata. A committed deletion produces one readable `HistoryEvent` and one field-level `HistoryLog`; a discarded draft produces no deletion history. Audit values contain only the attachment ID and a bounded filename. Storage URL, object key, hash, binary content, and provider diagnostics are excluded.

The SAP attachment plugin uses a transactional outbox for external object-store work. Therefore the history event proves that the business deletion was committed in CAP/HANA; it is not evidence that the S3 object was already physically removed at the same instant.

**Tiếng Việt.** Lịch sử xóa attachment được xác định tại boundary `SAVE` của draft. Handler so sánh snapshot attachment active trước Save với metadata active sau Save. Một thao tác xóa đã commit tạo đúng một `HistoryEvent` dễ đọc và một `HistoryLog` ở mức field; draft bị discard không tạo lịch sử xóa. Audit chỉ chứa attachment ID và filename đã giới hạn; không chứa storage URL, object key, hash, binary hoặc diagnostic của provider.

SAP attachment plugin dùng transactional outbox cho external object store. Vì vậy history chứng minh business deletion đã commit trong CAP/HANA, không khẳng định object S3 đã bị xóa vật lý ngay cùng thời điểm.
