# Knowledge: `srv/email/config.js`

## English

### What this file is for

This file turns private SMTP settings into one safe, predictable configuration object for the rest of IDTS.

Nodemailer should not read random environment variables throughout the codebase. Instead, this module reads `cds.env.idts.email`, applies harmless defaults, converts text values such as `"true"` into real booleans, and reports whether SMTP is ready. It never sends email and never writes credentials to the database.

### Beginner explanation

Think of this file as the checklist at the door of the email subsystem. Before the worker is allowed to contact an SMTP server, the checklist confirms that email is enabled and that host, port, username, password, and sender address are present. If the checklist is incomplete, IDTS continues running and new email deliveries become `SKIPPED`; the bug workflow does not crash.

### IDTS flow

1. `srv/bug-service/history.js` asks for the current email configuration when it creates a notification.
2. `srv/email/outbox.js` uses `enabled` and `ready` to choose `PENDING` or `SKIPPED`.
3. `srv/email/worker.js` starts only when the same configuration is ready.
4. `srv/email/sender.js` receives the normalized values and creates the Nodemailer transport.

### Important source anchors

- **Location**: `srv/email/config.js:5`
  `const DEFAULTS = Object.freeze(...)`
  **IDTS concept**: Safe email defaults. Email is off unless private configuration enables it; retry, polling, batch size, and connection count stay bounded.
  **Impact if broken**: A developer machine could unexpectedly send real email, or an aggressive worker could overload the SMTP provider.
  **Must check together**: `package.json` `cds.idts.email`, `.cdsrc-private.example.json`, `srv/email/worker.js`.

- **Location**: `srv/email/config.js:19`
  `normalizeEmailConfig(raw)`
  **IDTS concept**: One normalized contract shared by notification creation and delivery processing.
  **Impact if broken**: The writer and worker may disagree about whether email is enabled or which retry limits apply.
  **Must check together**: `srv/email/outbox.js`, `srv/email/sender.js`, IDTS-36 focused tests.

- **Location**: `srv/email/config.js:84`
  `isSafeEmailAddress(value)`
  **IDTS concept**: Basic protection against malformed or header-injection-style sender/test addresses.
  **Impact if broken**: Invalid private config or recipient data may reach Nodemailer and produce unsafe or confusing delivery failures.
  **Must check together**: `srv/email/outbox.js` recipient checks and `.cdsrc-private.example.json`.

### Cross-folder impact

- `package.json` provides non-secret defaults under `cds.idts.email`.
- `.cdsrc-private.json` supplies real private values at runtime and must remain untracked.
- `.cdsrc-private.example.json` documents placeholders only.
- `scripts/qa/test-email-outbox-programmatic.js` verifies disabled, incomplete, and valid configurations without real credentials.

### Safe editing checklist

- Never add a real password, SMTP hostname, private recipient, or token to this file.
- Keep `enabled` defaulted to `false`.
- If a configuration key changes, update the private example, PM handoff, tests, sender, and worker together.
- Do not log the normalized object because it contains the SMTP password at runtime.

## Vietnamese

### File này dùng để làm gì

File này biến cấu hình SMTP private thành một object cấu hình thống nhất và an toàn cho toàn bộ phần email của IDTS.

Nodemailer không nên tự đọc biến môi trường ở nhiều file khác nhau. Module này đọc `cds.env.idts.email`, gán giá trị mặc định an toàn, chuyển chuỗi như `"true"` thành boolean thật, rồi cho biết SMTP đã đủ cấu hình hay chưa. File này không gửi email và không ghi credential vào database.

### Giải thích cho người mới

Hãy hiểu file này như bảng kiểm tra ở cửa vào của hệ thống email. Trước khi worker được phép kết nối SMTP, bảng kiểm tra xác nhận đã có host, port, username, password và địa chỉ người gửi. Nếu thiếu cấu hình, IDTS vẫn chạy bình thường và delivery mới được đánh dấu `SKIPPED`; luồng xử lý bug không bị lỗi theo.

### Flow hoạt động trong IDTS

1. `srv/bug-service/history.js` lấy cấu hình email khi tạo notification.
2. `srv/email/outbox.js` dùng `enabled` và `ready` để chọn `PENDING` hoặc `SKIPPED`.
3. `srv/email/worker.js` chỉ khởi động khi cùng cấu hình đó đã sẵn sàng.
4. `srv/email/sender.js` nhận giá trị đã chuẩn hóa để tạo Nodemailer transport.

### Important source anchors

- **Vị trí**: `srv/email/config.js:5`
  `const DEFAULTS = Object.freeze(...)`
  **Khái niệm IDTS**: Giá trị mặc định an toàn. Email mặc định tắt; số lần retry, chu kỳ polling, batch size và connection đều bị giới hạn.
  **Ảnh hưởng nếu sai**: Máy developer có thể gửi email thật ngoài ý muốn hoặc worker tạo tải quá lớn lên SMTP provider.
  **Phải kiểm tra cùng**: `package.json` `cds.idts.email`, `.cdsrc-private.example.json`, `srv/email/worker.js`.

- **Vị trí**: `srv/email/config.js:19`
  `normalizeEmailConfig(raw)`
  **Khái niệm IDTS**: Contract cấu hình chung cho cả bước tạo delivery và bước gửi email.
  **Ảnh hưởng nếu sai**: Writer và worker có thể hiểu khác nhau về trạng thái bật/tắt email hoặc giới hạn retry.
  **Phải kiểm tra cùng**: `srv/email/outbox.js`, `srv/email/sender.js`, focused test IDTS-36.

- **Vị trí**: `srv/email/config.js:84`
  `isSafeEmailAddress(value)`
  **Khái niệm IDTS**: Kiểm tra cơ bản để chặn địa chỉ sender/test sai định dạng hoặc có ký tự xuống dòng nguy hiểm.
  **Ảnh hưởng nếu sai**: Cấu hình private hoặc dữ liệu người nhận không hợp lệ có thể đi tới Nodemailer và tạo lỗi gửi khó hiểu hoặc không an toàn.
  **Phải kiểm tra cùng**: Kiểm tra recipient trong `srv/email/outbox.js` và `.cdsrc-private.example.json`.

### Liên kết với folder khác

- `package.json` chứa default không có secret trong `cds.idts.email`.
- `.cdsrc-private.json` chứa giá trị private thật khi chạy và phải luôn untracked.
- `.cdsrc-private.example.json` chỉ chứa placeholder hướng dẫn.
- `scripts/qa/test-email-outbox-programmatic.js` kiểm tra cấu hình tắt, thiếu và hợp lệ mà không dùng credential thật.

### Lưu ý khi sửa

- Không ghi password, SMTP host private, recipient thật hoặc token vào file này.
- Luôn giữ `enabled` mặc định là `false`.
- Nếu đổi tên config key, phải cập nhật private example, PM handoff, test, sender và worker cùng lúc.
- Không log toàn bộ config object vì lúc runtime object này có SMTP password.

## Metadata

- Source: `srv/email/config.js`
- Related task: IDTS-36
- Last reviewed: 2026-06-30
