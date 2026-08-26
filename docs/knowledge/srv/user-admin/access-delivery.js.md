# Knowledge: `srv/user-admin/access-delivery.js`

## Gate 6.5 access-change delivery outbox / Outbox delivery thay đổi access Gate 6.5

### English

### Purpose and flow

This module owns the access-change email outbox policy. A final access audit enters `writeUserAccessDelivery`; the function validates the exact `APPLIED` action/event pair, locks the persisted audit event, returns the existing row on replay, reads the target email, builds sanitized text/HTML snapshots, and inserts either `PENDING` or a safe `SKIPPED` row. `processUserAccessDeliveries` later claims eligible rows, uses the shared sender, and persists `SENT` or sanitized `FAILED` retry state.

### Main parts

- `ACCESS_EVENT_BY_ACTION` allows only role change, suspend, reactivate, and revoke.
- `buildAccessDeliveryMessage` renders allowlisted role/access labels, an ISO completion time, and an HTTPS same-origin application link.
- `writeUserAccessDelivery` enforces source-audit idempotency and creates no row for non-APPLIED or mismatched actions.
- `processUserAccessDeliveries` reuses the shared retry delay, sender formatting, transport error sanitizer, attempt ceiling, and optimistic lock token.

### Important source anchors

- **Location**: `srv/user-admin/access-delivery.js:13-18` — `ACCESS_EVENT_BY_ACTION`.
  **IDTS concept**: only material final access actions are email-eligible.
  **Impact if broken**: queued, no-op, Developer-responsibility, or unrelated audits can generate misleading email.
  **Must check together**: `srv/provisioning-broker.js:225-252`, `srv/user-admin/access-lifecycle.js:57-80`, and no-spam tests.
- **Location**: `srv/user-admin/access-delivery.js:63-107` — `writeUserAccessDelivery`.
  **IDTS concept**: append-only final audit is both the authorization context and idempotency key for one delivery.
  **Impact if broken**: concurrent completion can duplicate email or a missing/unsafe recipient can enter the provider queue.
  **Must check together**: `db/schema.cds:393-416` and concurrent outer-transaction tests.
- **Location**: `srv/user-admin/access-delivery.js:110-176` — `processUserAccessDeliveries`.
  **IDTS concept**: durable claim/send/retry through the single email worker.
  **Impact if broken**: rows can double-send, remain locked, retry beyond policy, or store raw provider errors.
  **Must check together**: `srv/email/worker.js:28-61`, `srv/email/outbox.js`, and failure/retry tests.
- **Location**: `srv/user-admin/access-delivery.js:179-203` — configuration/link/time validation.
  **IDTS concept**: fail closed before sending an unsafe recipient, URL, or completion timestamp.
  **Impact if broken**: email can expose a credential-bearing URL, invalid address, or false completion time.
  **Must check together**: private email configuration rules and secret/privacy scans.

### Safe editing

Keep this module domain-owned but provider-neutral. Never add a new scheduler, sender SDK, live provider call in the business transaction, raw audit/provider snapshot, historical backfill, or user-selected URL. Preserve the audit lock plus unique constraint when changing idempotency.

### Tiếng Việt

### Mục đích và luồng

Module này sở hữu policy outbox email cho thay đổi access. Audit access cuối đi vào `writeUserAccessDelivery`; function validate đúng cặp action/event `APPLIED`, lock audit event đã persist, trả row hiện có khi replay, đọc email user đích, dựng snapshot text/HTML đã sanitize và insert row `PENDING` hoặc `SKIPPED` an toàn. Sau đó `processUserAccessDeliveries` claim row đủ điều kiện, dùng sender chung và persist trạng thái `SENT` hoặc `FAILED` đã sanitize để retry.

### Thành phần chính

- `ACCESS_EVENT_BY_ACTION` chỉ cho phép đổi role, suspend, reactivate và revoke.
- `buildAccessDeliveryMessage` render label role/access allowlist, completion time ISO và application link HTTPS cùng origin.
- `writeUserAccessDelivery` enforce idempotency theo source audit và không tạo row cho action không APPLIED hoặc mismatch.
- `processUserAccessDeliveries` dùng chung retry delay, sender formatting, sanitizer lỗi transport, attempt ceiling và optimistic lock token.

### Important source anchors

- **Vị trí**: `srv/user-admin/access-delivery.js:13-18` — `ACCESS_EVENT_BY_ACTION`.
  **Khái niệm IDTS**: chỉ action access cuối có ý nghĩa mới đủ điều kiện email.
  **Ảnh hưởng nếu sai**: audit queued, no-op, Developer responsibility hoặc không liên quan có thể tạo email sai lệch.
  **Phải kiểm tra cùng**: `srv/provisioning-broker.js:225-252`, `srv/user-admin/access-lifecycle.js:57-80` và test no-spam.
- **Vị trí**: `srv/user-admin/access-delivery.js:63-107` — `writeUserAccessDelivery`.
  **Khái niệm IDTS**: audit cuối append-only vừa là context authorization vừa là idempotency key cho một delivery.
  **Ảnh hưởng nếu sai**: completion đồng thời có thể gửi trùng hoặc recipient thiếu/không an toàn lọt vào provider queue.
  **Phải kiểm tra cùng**: `db/schema.cds:393-416` và test concurrent outer transaction.
- **Vị trí**: `srv/user-admin/access-delivery.js:110-176` — `processUserAccessDeliveries`.
  **Khái niệm IDTS**: claim/send/retry bền vững qua email worker duy nhất.
  **Ảnh hưởng nếu sai**: row có thể gửi trùng, kẹt lock, retry vượt policy hoặc lưu raw provider error.
  **Phải kiểm tra cùng**: `srv/email/worker.js:28-61`, `srv/email/outbox.js` và test failure/retry.
- **Vị trí**: `srv/user-admin/access-delivery.js:179-203` — validate cấu hình/link/thời gian.
  **Khái niệm IDTS**: fail closed trước khi gửi recipient, URL hoặc completion timestamp không an toàn.
  **Ảnh hưởng nếu sai**: email có thể lộ URL chứa credential, địa chỉ sai hoặc thời điểm completion không đúng.
  **Phải kiểm tra cùng**: quy tắc email config private và secret/privacy scan.

### Sửa an toàn

Giữ module theo domain nhưng không phụ thuộc provider. Không thêm scheduler mới, sender SDK, provider call live trong business transaction, raw audit/provider snapshot, historical backfill hoặc URL do user chọn. Khi đổi idempotency phải giữ audit lock cùng unique constraint.
