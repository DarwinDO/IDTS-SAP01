# Knowledge: `srv/email/sender.js`

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: NhanT. Flow: outbox message -> configured provider. This thin adapter must not decide retry or workflow success. Diagnose provider failures through sanitized code/status from `outbox.js`, never through raw credentials or request headers.

### Vietnamese

Primary owner: DonHV. Backup: NhanT. Flow: outbox message -> configured provider. Adapter mỏng này không quyết định retry hoặc workflow success. Chẩn đoán provider failure bằng code/status đã sanitize từ `outbox.js`, không dùng credential hay request header thô.

## English

### What this file is for

This file is the small boundary between IDTS and Nodemailer. It creates a pooled SMTP transport and exposes only `sendMail` and `close`.

### Beginner explanation

SMTP is the protocol used to hand an email to a mail server. Nodemailer knows how to speak that protocol. IDTS business code should not know Nodemailer's internal options, so this wrapper keeps provider-specific connection details in one place.

### IDTS flow

The worker creates one sender when valid private configuration is available. Several queued emails can reuse the same small connection pool. On application shutdown, the worker calls `close` so open SMTP connections are released cleanly.

### Important source anchors

- **Location**: `srv/email/sender.js:5`
  `createSmtpSender(config)`
  **IDTS concept**: Provider-portable SMTP transport boundary.
  **Impact if broken**: The worker cannot deliver email, may open too many connections, or may fail to release resources.
  **Must check together**: `srv/email/config.js`, `srv/email/worker.js`, `scripts/qa/test-email-smtp-integration.js`.

- **Location**: `srv/email/sender.js:8`
  `nodemailer.createTransport({ pool: true, maxConnections: ... })`
  **IDTS concept**: Reuse a bounded number of SMTP connections when processing an outbox batch.
  **Impact if broken**: Batch delivery becomes slower or can exceed provider connection limits.
  **Must check together**: IDTS-36 Nodemailer spike results and private SMTP provider limits.

### Cross-folder impact

- Nodemailer is a runtime dependency in `package.json`.
- `smtp-server` is a test-only dependency used by the local integration script.
- Credentials come from private config through `config.js`; they must never be added to source, docs, Jira, or test output.

### Safe editing checklist

- Keep this wrapper thin; business status/retry rules belong in `outbox.js`.
- Never log transporter options or authentication values.
- Preserve pooling limits and close the transport during shutdown.
- Verify changes against the local SMTP integration test.

## Vietnamese

### File này dùng để làm gì

File này là ranh giới nhỏ giữa IDTS và Nodemailer. Nó tạo SMTP transport có connection pool rồi chỉ expose `sendMail` và `close`.

### Giải thích cho người mới

SMTP là giao thức dùng để giao email cho mail server. Nodemailer biết cách nói chuyện bằng giao thức đó. Code nghiệp vụ IDTS không cần biết chi tiết option bên trong Nodemailer, nên wrapper này gom toàn bộ phần kết nối provider vào một chỗ.

### Flow hoạt động trong IDTS

Worker tạo một sender khi cấu hình private hợp lệ. Nhiều email trong outbox có thể dùng lại connection pool nhỏ này. Khi ứng dụng tắt, worker gọi `close` để giải phóng connection SMTP đúng cách.

### Important source anchors

- **Vị trí**: `srv/email/sender.js:5`
  `createSmtpSender(config)`
  **Khái niệm IDTS**: Ranh giới SMTP không khóa hệ thống vào một provider cụ thể.
  **Ảnh hưởng nếu sai**: Worker không gửi được email, mở quá nhiều connection hoặc không giải phóng tài nguyên.
  **Phải kiểm tra cùng**: `srv/email/config.js`, `srv/email/worker.js`, `scripts/qa/test-email-smtp-integration.js`.

- **Vị trí**: `srv/email/sender.js:8`
  `nodemailer.createTransport({ pool: true, maxConnections: ... })`
  **Khái niệm IDTS**: Tái sử dụng số lượng connection SMTP có giới hạn khi xử lý một batch outbox.
  **Ảnh hưởng nếu sai**: Gửi batch chậm hơn hoặc vượt giới hạn connection của provider.
  **Phải kiểm tra cùng**: Kết quả spike Nodemailer IDTS-36 và giới hạn SMTP provider private.

### Liên kết với folder khác

- Nodemailer là runtime dependency trong `package.json`.
- `smtp-server` là dependency chỉ dùng cho local integration test.
- Credential đi từ private config qua `config.js`; không được đưa vào source, docs, Jira hoặc test output.

### Lưu ý khi sửa

- Giữ wrapper này mỏng; rule status/retry thuộc `outbox.js`.
- Không log transporter options hoặc authentication values.
- Giữ giới hạn pool và đóng transport khi shutdown.
- Verify thay đổi bằng local SMTP integration test.

### IDTS-48 update: SMTP and Brevo API transports

This file now contains two transport adapters:

- `createSmtpSender(config)` keeps the existing Nodemailer SMTP path.
- `createBrevoApiSender(config)` sends the same email message through Brevo's HTTP Transactional API.
- `createEmailSender(config)` is the small selector used by the worker.

The important point for a new developer: the rest of IDTS still calls `sendMail(message)`. The outbox and worker do not need to know whether that call is implemented by SMTP or by HTTPS. This keeps the business rule stable: a bug action writes a delivery row, and the worker tries to deliver it later.

Brevo API sends JSON to `/v3/smtp/email`. The API key is sent only in the HTTP header at runtime. The code must not print it, store it in `NotificationDeliveries`, or copy it to Jira evidence.

Cross-folder check for this change:

- `srv/email/config.js` decides whether provider is `smtp` or `brevo-api`.
- `srv/email/worker.js` calls `createEmailSender`.
- `scripts/qa/test-email-smtp-integration.js` protects the old SMTP path.
- `scripts/qa/test-email-brevo-api-integration.js` protects the new API path with a local fake HTTP server.

### Cap nhat IDTS-48: transport SMTP va Brevo API

File nay hien co hai adapter gui email:

- `createSmtpSender(config)` giu luong Nodemailer SMTP cu.
- `createBrevoApiSender(config)` gui cung message email qua Brevo Transactional API bang HTTP.
- `createEmailSender(config)` la selector nho de worker dung dung provider.

Diem quan trong cho nguoi moi: cac phan con lai cua IDTS van chi goi `sendMail(message)`. Outbox va worker khong can biet ben trong la SMTP hay HTTPS. Nhu vay business rule van on dinh: action bug ghi delivery row, worker thu deliver sau.

Brevo API gui JSON toi `/v3/smtp/email`. API key chi nam trong HTTP header luc runtime. Code khong duoc in API key, khong luu vao `NotificationDeliveries`, va khong copy len Jira evidence.

Can kiem tra chung khi sua:

- `srv/email/config.js` quyet dinh provider la `smtp` hay `brevo-api`.
- `srv/email/worker.js` goi `createEmailSender`.
- `scripts/qa/test-email-smtp-integration.js` bao ve luong SMTP cu.
- `scripts/qa/test-email-brevo-api-integration.js` bao ve luong API moi bang fake HTTP server local.

## Metadata

- Source: `srv/email/sender.js`
- Related task: IDTS-36, IDTS-48
- Last reviewed: 2026-07-02
