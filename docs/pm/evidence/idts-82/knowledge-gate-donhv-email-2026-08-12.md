# IDTS-82 DonHV Knowledge Gate — Notification and Email Outbox

## English

### Assessment record

- Member: DonHV
- Ownership flow: Notification and email outbox
- Gate date and reproducible selector: 2026-08-12 (Asia/Bangkok)
- Interactive assessment completed: 2026-08-13 (Asia/Bangkok)
- Selector: `npm run learning:gate -- donhv email 2026-08-12 2026-07-23`
- Questions: 7 (3 base + 4 inactive-day + 0 additional-flow)
- Score: 7/7 = 100%
- Critical security/data-integrity questions: PASS
- Controlled debug exercise: PASS
- Teach-back: PASS
- Result: PASS

This record assesses DonHV's own answers from the interactive mentor session. It is not a signature or acknowledgment written on DonHV's behalf.

### Knowledge demonstrated

DonHV explained in his own words that:

1. A workflow transition calls `writeNotificationForStatus()`, which delegates to `writeNotificationRecord()` to persist one in-app `Notifications` record and one EMAIL `NotificationDeliveries` outbox row.
2. `writeNotificationRecord()` writes `PENDING` or `SKIPPED` inside the Bug request transaction and does not call SMTP or Brevo. Provider delivery therefore cannot roll back the already committed Bug transition and History.
3. On SAP BTP, Job Scheduling Service sends an authenticated HTTP `POST` to the unbound OData action `processEmailOutbox`. XSUAA grants the technical `OutboxProcessor` scope to the bound scheduler, and CAP enforces it through `@requires`.
4. `IDTS_EMAIL_WORKER_MODE=scheduler` disables the in-process polling timer on BTP, preventing two scheduling mechanisms from processing the same outbox.
5. `PENDING` waits for processing; `SENT` proves provider acceptance but not inbox delivery; `SKIPPED` means no provider attempt was made because configuration or recipient data was unsuitable; `FAILED` means a provider attempt failed and may be retried while attempts remain.
6. A worker must claim a delivery before sending by conditionally setting `lockToken` and `lockedUntil`. Sending before claim could allow two workers to send duplicate email.
7. Before calling the sender, the processor increments `attemptCount` and records `lastAttemptAt`. Success records `SENT`, `sentAt`, and the provider message ID and clears retry/error/lock fields. Failure records sanitized `FAILED` diagnostics, schedules `nextAttemptAt` when eligible, and clears the lock.

### Controlled debug exercise

DonHV completed a controlled `ESOCKET` failure analysis against the current `processEmailDeliveries()` flow:

- Expected Bug status and History to remain committed and not roll back.
- Expected the delivery to become `FAILED` with an incremented `attemptCount`, `lastAttemptAt`, a bounded `nextAttemptAt` while attempts remain, sanitized `lastErrorCode`/`lastErrorSummary`, and cleared `lockToken`/`lockedUntil`.
- Distinguished the temporary `retryAt` variable from the persisted `nextAttemptAt` field.
- Identified safe PASS evidence as committed workflow data plus managed retry state without secret or personal-data disclosure.

### Critical security and data-integrity assessment

PASS. DonHV stated that evidence must not contain API keys, passwords, secret keys, tokens, Authorization headers, cookies, private endpoints, stack traces, raw provider responses, full personal email/PII, or other credentials. He also explained that delivery errors are sanitized and that claim-before-send protects against duplicate delivery.

### Teach-back assessment

PASS. DonHV traced the complete flow from `transitionBug()` through notification/outbox persistence, Job Scheduler and the protected OData action, batch processing, conditional claim, sender invocation, success/failure state updates, retry behavior, and the workflow transaction boundary. Corrections during mentoring were incorporated into his final explanation rather than copied as a canned answer.

### Safe evidence note

No credential, token, private endpoint, full personal email, provider response, or private infrastructure detail is recorded here. No runtime implementation, deployment, email send, Jira transition, PR, or external mutation was performed.

## Vietnamese

### Bản ghi đánh giá

- Thành viên: DonHV
- Flow ownership: Notification và email outbox
- Ngày gate và selector lặp lại được: 2026-08-12 (Asia/Bangkok)
- Hoàn tất phiên đánh giá tương tác: 2026-08-13 (Asia/Bangkok)
- Selector: `npm run learning:gate -- donhv email 2026-08-12 2026-07-23`
- Số câu: 7 (3 câu cơ bản + 4 câu do ngày không hoạt động + 0 flow bổ sung)
- Điểm: 7/7 = 100%
- Câu critical về security/data integrity: PASS
- Bài debug có kiểm soát: PASS
- Teach-back: PASS
- Kết quả: PASS

Bản ghi này đánh giá câu trả lời do DonHV tự trình bày trong phiên mentor tương tác. Đây không phải chữ ký hoặc acknowledgment do agent ghi thay DonHV.

### Kiến thức đã thể hiện

DonHV đã tự giải thích được:

1. Workflow transition gọi `writeNotificationForStatus()`, rồi gọi `writeNotificationRecord()` để ghi một `Notifications` in-app và một `NotificationDeliveries` EMAIL.
2. `writeNotificationRecord()` chỉ ghi `PENDING` hoặc `SKIPPED` trong transaction request của Bug, không gọi SMTP/Brevo. Vì vậy provider lỗi không rollback Bug transition và History đã commit.
3. Trên SAP BTP, Job Scheduling Service gửi HTTP `POST` có xác thực tới unbound OData action `processEmailOutbox`. XSUAA cấp scope kỹ thuật `OutboxProcessor` cho scheduler đã bind và CAP kiểm tra bằng `@requires`.
4. `IDTS_EMAIL_WORKER_MODE=scheduler` tắt polling timer trong CAP trên BTP để tránh hai cơ chế lịch cùng xử lý outbox.
5. `PENDING` chờ xử lý; `SENT` chỉ chứng minh provider chấp nhận request, không chứng minh thư vào inbox; `SKIPPED` là không thử provider vì config/recipient không phù hợp; `FAILED` là đã thử provider nhưng lỗi và có thể retry nếu còn lượt.
6. Worker phải claim delivery trước khi gửi bằng `lockToken` và `lockedUntil`. Nếu gửi trước claim, hai worker có thể gửi trùng email.
7. Trước khi gọi sender, processor tăng `attemptCount` và ghi `lastAttemptAt`. Thành công ghi `SENT`, `sentAt`, provider message ID và xóa retry/error/lock. Thất bại ghi `FAILED` đã sanitize, đặt `nextAttemptAt` khi còn lượt và xóa lock.

### Bài debug có kiểm soát

DonHV đã hoàn thành phân tích lỗi `ESOCKET` có kiểm soát theo flow `processEmailDeliveries()` hiện hành:

- Bug status và History phải giữ nguyên trạng thái đã commit, không rollback.
- Delivery phải thành `FAILED`, tăng `attemptCount`, ghi `lastAttemptAt`, có `nextAttemptAt` khi còn lượt, ghi `lastErrorCode`/`lastErrorSummary` đã sanitize, đồng thời xóa `lockToken`/`lockedUntil`.
- Phân biệt biến tạm `retryAt` với field persist `nextAttemptAt`.
- Dấu hiệu PASS an toàn là workflow vẫn commit và retry được quản lý mà không lộ secret hoặc dữ liệu cá nhân.

### Đánh giá security và data integrity critical

PASS. DonHV nêu rõ evidence không được chứa API key, password, secret key, token, Authorization header, cookie, private endpoint, stack trace, raw provider response, email/PII đầy đủ hoặc credential khác. DonHV cũng giải thích lỗi delivery phải được sanitize và claim-before-send bảo vệ khỏi gửi trùng.

### Đánh giá teach-back

PASS. DonHV đã trace liền mạch từ `transitionBug()` qua ghi notification/outbox, Job Scheduler và OData action được bảo vệ, batch processing, conditional claim, gọi sender, cập nhật success/failure, retry và transaction boundary của workflow. Các điểm được mentor sửa trong quá trình học đã được DonHV diễn đạt lại bằng lời của mình, không sao chép đáp án mẫu.

### Ghi chú evidence an toàn

Không credential, token, private endpoint, email cá nhân đầy đủ, provider response hoặc chi tiết hạ tầng riêng nào được ghi ở đây. Phiên này không implementation runtime, deploy, gửi email, chuyển Jira, tạo PR hoặc mutation hệ thống ngoài.
