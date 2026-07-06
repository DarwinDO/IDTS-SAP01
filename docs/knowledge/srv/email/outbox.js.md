# Knowledge: `srv/email/outbox.js`

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
- Last reviewed: 2026-07-02
