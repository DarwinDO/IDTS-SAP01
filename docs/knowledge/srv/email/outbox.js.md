# Knowledge: `srv/email/outbox.js`

## Immediate-kick handoff contract (2026-08-12)

### English

`writeNotificationRecord()` now returns the persisted delivery status together with its IDs. `PENDING` tells the worker orchestration to register a post-commit kick; `SKIPPED` explicitly prevents a kick. This return value is only orchestration metadata—the provider is still never contacted inside the business transaction.

### Vietnamese

`writeNotificationRecord()` nay trả trạng thái delivery đã ghi cùng các ID. `PENDING` báo cho worker orchestration đăng ký post-commit kick; `SKIPPED` ngăn kick một cách rõ ràng. Giá trị trả về này chỉ là metadata điều phối; provider vẫn tuyệt đối không được gọi bên trong business transaction.

## Beginner-first execution map (2026-07-18)

### English

Workflow code calls `writeNotificationRecord` inside its database transaction. That function writes the in-app Notification plus one EMAIL delivery snapshot as PENDING or SKIPPED; it never contacts the provider. Later the worker calls `processEmailDeliveries`: select retry-eligible rows → claim with lock token/expiry → call injected `sendMail` → update SENT with timestamps/message ID, or FAILED with sanitized error and next retry. `readBugEmailContext` deliberately selects only safe template fields. Debug in that order and inspect status/attempt/lock/timestamps, not body credentials. This separation is why Brevo failure cannot roll back assign/resolve/close.

### Vietnamese

Workflow gọi `writeNotificationRecord` bên trong transaction database. Hàm ghi Notification in-app và một snapshot delivery EMAIL ở trạng thái PENDING hoặc SKIPPED; nó không liên hệ provider. Sau đó worker gọi `processEmailDeliveries`: chọn row còn được retry → claim bằng lock token/expiry → gọi `sendMail` được inject → update SENT với timestamp/message ID, hoặc FAILED với lỗi đã sanitize và lịch retry. `readBugEmailContext` cố ý chỉ select field template an toàn. Debug theo thứ tự đó và xem status/attempt/lock/timestamp, không xem credential/body nhạy cảm. Nhờ tách như vậy, lỗi Brevo không rollback assign/resolve/close.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: NhanT. Flow: Notifications -> NotificationDeliveries -> claim/send/retry. Break at claim and status update to investigate `PENDING`, `SENT`, `FAILED`, or `SKIPPED`. A send failure must leave the already committed Bug change intact.

### Vietnamese

Primary owner: DonHV. Backup: NhanT. Flow: Notifications -> NotificationDeliveries -> claim/send/retry. Đặt breakpoint tại claim và status update để xem `PENDING`, `SENT`, `FAILED`, `SKIPPED`. Send failure phải giữ nguyên Bug change đã commit.

## English

### What this file is for

This file implements the durable email outbox. It creates the in-app notification and matching email delivery record, then later processes pending deliveries without coupling SMTP failure to the bug workflow.

### Beginner explanation

Sending email directly inside an Assign or Close request is risky: the SMTP server may be slow or unavailable, causing the business action to fail. The outbox pattern first writes an instruction into the database. A background worker reads that instruction later and tries to send it. The database therefore remembers what still needs delivery and what failed.

`Notifications` answers “what happened in IDTS?”. `NotificationDeliveries` answers “what happened when we tried to deliver that event by email?”. These are related but intentionally separate questions.

### IDTS flow

1. A lifecycle event in `history.js` calls `writeNotificationRecord` within the request transaction.
2. The function inserts an in-app notification as `IN_APP/SENT` and one email delivery as `PENDING` or `SKIPPED`.
3. The transaction commits together with the bug/history change.
4. The worker later calls `processEmailDeliveries` in a detached CAP transaction.
5. Success produces `SENT`; failure produces `FAILED` with a sanitized error and optional retry time.

### Important source anchors

- **Location**: `srv/email/outbox.js:18`
  `writeNotificationRecord(tx, entry, config)`
  **IDTS concept**: Atomic creation of the source event and its email delivery instruction.
  **Impact if broken**: A bug transition may create notification without delivery tracking, or delivery may point to no source event.
  **Must check together**: `srv/bug-service/history.js:350`, `db/schema.cds:178-209`, notification regression tests.

- **Location**: `srv/email/outbox.js:100`
  `skippedDeliveryReason(config, recipient)`
  **IDTS concept**: Safe no-send outcomes for disabled config, inactive user, missing/invalid email, or incomplete SMTP setup.
  **Impact if broken**: IDTS may try to send to invalid recipients or incorrectly leave impossible deliveries pending forever.
  **Must check together**: `srv/email/config.js`, `Users.active/email`, IDTS-38 negative QA cases.

- **Location**: `srv/email/outbox.js:110`
  `processEmailDeliveries(...)`
  **IDTS concept**: Bounded at-least-once delivery with locking, retry count, backoff, and status tracking.
  **Impact if broken**: Duplicate sends, stuck locks, infinite retries, or failure status that hides the real delivery result.
  **Must check together**: `srv/email/worker.js`, `srv/email/sender.js`, `NotificationDeliveryStatuses` seed values.

- **Location**: `srv/email/outbox.js:196`
  `sanitizeTransportError(error)`
  **IDTS concept**: Operational evidence without leaking SMTP host, username, password, or raw stack trace.
  **Impact if broken**: Secrets or private infrastructure details could enter the database, OData, logs, Jira evidence, or screenshots.
  **Must check together**: `srv/service.cds` safe projection and secret-scan verification.

### Cross-folder impact

- `db/schema.cds` defines both persistence records and the unique notification/channel constraint.
- `srv/service.cds` exposes only safe delivery fields for IDTS-37.
- `srv/bug-service/history.js` is the current notification producer.
- `scripts/qa/test-email-outbox-programmatic.js` verifies transaction rollback, uniqueness, skip reasons, success, failure, retry, and read-only API behavior.

### Safe editing checklist

- Never call SMTP from `writeNotificationRecord`; it runs in the critical business transaction.
- Keep notification and delivery inserts in the same transaction.
- Never store raw transport errors or configuration.
- Do not retry `SENT` or `SKIPPED` rows.
- Treat delivery as at-least-once: locking reduces duplicates but cannot guarantee exactly-once across a crash after SMTP acceptance.

## Vietnamese

### File này dùng để làm gì

File này triển khai email outbox bền vững. Nó tạo notification trong app và email delivery tương ứng, sau đó xử lý delivery đang chờ mà không để lỗi SMTP kéo theo lỗi workflow bug.

### Giải thích cho người mới

Gửi email trực tiếp bên trong request Assign hoặc Close rất rủi ro: SMTP server có thể chậm hoặc ngừng hoạt động, khiến action nghiệp vụ thất bại. Outbox pattern ghi “yêu cầu cần gửi email” vào database trước. Worker nền đọc yêu cầu đó sau và thử gửi. Nhờ vậy database luôn nhớ email nào đang chờ, đã gửi hoặc đã lỗi.

`Notifications` trả lời “đã có sự kiện gì trong IDTS?”. `NotificationDeliveries` trả lời “khi giao sự kiện đó qua email thì kết quả ra sao?”. Hai câu hỏi liên quan nhưng phải được tách riêng.

### Flow hoạt động trong IDTS

1. Lifecycle event trong `history.js` gọi `writeNotificationRecord` ngay trong request transaction.
2. Hàm tạo notification `IN_APP/SENT` và một email delivery `PENDING` hoặc `SKIPPED`.
3. Các record commit cùng thay đổi bug/history.
4. Worker gọi `processEmailDeliveries` sau đó trong CAP transaction độc lập.
5. Gửi thành công thành `SENT`; gửi lỗi thành `FAILED`, lưu lỗi đã làm sạch và thời điểm retry nếu còn lượt.

### Important source anchors

- **Vị trí**: `srv/email/outbox.js:18`
  `writeNotificationRecord(tx, entry, config)`
  **Khái niệm IDTS**: Tạo source event và email delivery instruction một cách atomic.
  **Ảnh hưởng nếu sai**: Bug transition có thể tạo notification nhưng thiếu delivery tracking hoặc delivery không còn source event.
  **Phải kiểm tra cùng**: `srv/bug-service/history.js:350`, `db/schema.cds:178-209`, notification regression tests.

- **Vị trí**: `srv/email/outbox.js:100`
  `skippedDeliveryReason(config, recipient)`
  **Khái niệm IDTS**: Kết quả không gửi an toàn khi config tắt/thiếu, user inactive hoặc email thiếu/sai.
  **Ảnh hưởng nếu sai**: IDTS có thể gửi tới recipient không hợp lệ hoặc để delivery không thể gửi nằm `PENDING` mãi mãi.
  **Phải kiểm tra cùng**: `srv/email/config.js`, `Users.active/email`, negative QA cases IDTS-38.

- **Vị trí**: `srv/email/outbox.js:110`
  `processEmailDeliveries(...)`
  **Khái niệm IDTS**: Gửi at-least-once có giới hạn với lock, số lần retry, backoff và status tracking.
  **Ảnh hưởng nếu sai**: Email bị gửi trùng, lock bị kẹt, retry vô hạn hoặc status không phản ánh đúng kết quả.
  **Phải kiểm tra cùng**: `srv/email/worker.js`, `srv/email/sender.js`, seed `NotificationDeliveryStatuses`.

- **Vị trí**: `srv/email/outbox.js:196`
  `sanitizeTransportError(error)`
  **Khái niệm IDTS**: Giữ evidence vận hành nhưng không làm lộ SMTP host, username, password hoặc raw stack trace.
  **Ảnh hưởng nếu sai**: Secret hoặc thông tin hạ tầng private có thể đi vào DB, OData, log, Jira evidence hoặc screenshot.
  **Phải kiểm tra cùng**: Safe projection trong `srv/service.cds` và secret scan.

### Liên kết với folder khác

- `db/schema.cds` định nghĩa hai record và unique constraint notification/channel.
- `srv/service.cds` chỉ expose field delivery an toàn cho IDTS-37.
- `srv/bug-service/history.js` là nơi hiện tại tạo notification.
- `scripts/qa/test-email-outbox-programmatic.js` kiểm tra rollback, uniqueness, skip reason, success, failure, retry và API read-only.

### Lưu ý khi sửa

- Không gọi SMTP trong `writeNotificationRecord` vì hàm đó nằm trong business transaction quan trọng.
- Giữ insert notification và delivery trong cùng transaction.
- Không lưu raw transport error hoặc config.
- Không retry row `SENT` hoặc `SKIPPED`.
- Hiểu delivery là at-least-once: locking giảm gửi trùng nhưng không thể bảo đảm exactly-once nếu process chết sau khi SMTP nhận mail.

### IDTS-48 update: provider-neutral delivery results

IDTS-48 keeps the outbox pattern exactly where it was. The database still stores one `NotificationDeliveries` row per email delivery attempt, and `processEmailDeliveries` still receives a generic `sendMail` function. The only change here is wording and error handling: the result is now called `providerResult` instead of `smtpResult`, and sanitized error summaries also cover Brevo API failures.

For a new developer, the key idea is: outbox does not care which provider is used. SMTP, Brevo API, or a later provider must all return the same small result shape, mainly `{ messageId }`, or throw a sanitized error. That lets retry, lock, status, and rollback behavior remain stable.

Cross-folder check for this change:

- `srv/email/sender.js` turns provider-specific responses into `{ messageId }`.
- `srv/email/worker.js` passes the selected sender to `processEmailDeliveries`.
- `scripts/qa/test-email-outbox-programmatic.js` protects existing SMTP/outbox behavior.
- `scripts/qa/test-email-brevo-api-integration.js` proves Brevo API success and failure still update delivery rows correctly.

### Cap nhat IDTS-48: ket qua delivery khong phu thuoc provider

IDTS-48 giu nguyen outbox pattern. Database van luu mot row `NotificationDeliveries` cho moi email delivery, va `processEmailDeliveries` van nhan mot ham `sendMail` chung. Thay doi chinh o file nay la cach goi ten va sanitize loi: ket qua bay gio la `providerResult` thay vi `smtpResult`, va summary loi da bao gom ca loi Brevo API.

Y quan trong cho nguoi moi: outbox khong can biet provider nao dang duoc dung. SMTP, Brevo API, hay provider sau nay deu phai tra ve cung shape nho, chu yeu la `{ messageId }`, hoac throw loi da sanitize. Nho vay retry, lock, status va rollback behavior khong bi doi.

Can kiem tra chung khi sua:

- `srv/email/sender.js` bien response rieng cua provider thanh `{ messageId }`.
- `srv/email/worker.js` dua sender da chon vao `processEmailDeliveries`.
- `scripts/qa/test-email-outbox-programmatic.js` bao ve behavior SMTP/outbox hien co.
- `scripts/qa/test-email-brevo-api-integration.js` chung minh Brevo API success/failure cap nhat delivery row dung.

## Metadata

- Source: `srv/email/outbox.js`
- Related task: IDTS-36, IDTS-48
- Last reviewed: 2026-08-12

## Gate 6.5 shared sender formatting / Dùng chung định dạng sender Gate 6.5

### English

Gate 6.5 exports the existing `formatFrom(config)` helper rather than duplicating sender-name sanitization in the invitation and access outboxes. The helper strips quote/newline characters from the display name and returns no `From` value when the configured address is absent; provider selection and delivery policy remain elsewhere.

- **Location**: `srv/email/outbox.js:228-234` — `module.exports.formatFrom`.
  **IDTS concept**: Bug, invitation, and access deliveries use one provider-neutral sender representation.
  **Impact if broken**: domain outboxes can format different senders or reintroduce header-injection risk.
  **Must check together**: `srv/user-admin/delivery.js:6,150`, `srv/user-admin/access-delivery.js:6,145`, and sender regression tests.

### Tiếng Việt

Gate 6.5 export helper `formatFrom(config)` hiện có thay vì nhân đôi logic sanitize tên sender trong outbox invitation và access. Helper loại quote/newline khỏi display name và không trả `From` khi thiếu địa chỉ cấu hình; việc chọn provider và policy delivery vẫn ở module khác.

- **Vị trí**: `srv/email/outbox.js:228-234` — `module.exports.formatFrom`.
  **Khái niệm IDTS**: delivery Bug, invitation và access dùng chung biểu diễn sender không phụ thuộc provider.
  **Ảnh hưởng nếu sai**: các outbox domain có thể format sender khác nhau hoặc đưa lại rủi ro header injection.
  **Phải kiểm tra cùng**: `srv/user-admin/delivery.js:6,150`, `srv/user-admin/access-delivery.js:6,145` và regression sender.

**Safe editing / Sửa an toàn:** Keep this a small pure formatter export; do not move sending, retry, or provider configuration into this module. / Giữ đây là export formatter thuần nhỏ; không đưa việc gửi, retry hoặc cấu hình provider vào module này.

## N3 source and channel policy

**English.** `writeNotificationRecord` writes the Bug notification and its personal inbox index in the same transaction. A supplied source key reuses the existing record; `emailRequired:false` returns `IN_APP_ONLY` without an EMAIL row, while explicit prompt paths create one PENDING delivery for the existing post-commit worker.

**Tiếng Việt.** `writeNotificationRecord` ghi Bug notification và index inbox cá nhân trong cùng transaction. Source key được cung cấp sẽ dùng lại record có sẵn; `emailRequired:false` trả `IN_APP_ONLY` không tạo EMAIL row, còn đường prompt tạo một PENDING delivery cho worker post-commit hiện có.
