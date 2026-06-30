# Knowledge: `srv/email/template.js`

## English

### What this file is for

This file converts one IDTS notification into a business-readable email in both plain text and HTML.

It deliberately uses only a small data set: bug number, title, event, status, next processor, notification message, and an optional IDTS link. Full descriptions, comments, attachments, passwords, and tokens are not included.

### Beginner explanation

The database row is not yet an email. It contains separate facts. This module arranges those facts into a subject and body that a Tester, Developer, or PM can understand. It also escapes dynamic HTML, so a title such as `<script>` is displayed as text instead of being interpreted as markup.

### IDTS flow

`outbox.js` reads the Bug, User, status, and event labels, then calls `buildEmailMessage`. The returned subject/text/HTML are saved as an immutable snapshot in `NotificationDeliveries`, so a retry sends the original event message even if the bug changes later.

### Important source anchors

- **Location**: `srv/email/template.js:3`
  `buildEmailMessage(...)`
  **IDTS concept**: Stable business email snapshot for one notification event.
  **Impact if broken**: Recipients may receive missing bug context, misleading status text, or content from a later bug state during retries.
  **Must check together**: `srv/email/outbox.js:18`, `db/schema.cds:189`, IDTS-37 readability review.

- **Location**: `srv/email/template.js:54`
  `buildBugLink(baseUrl, bugID)`
  **IDTS concept**: Optional navigation back to IDTS without hardcoding an environment URL.
  **Impact if broken**: Email links may point to a developer machine or a wrong deployment.
  **Must check together**: Private `baseUrl` configuration and the deployed Fiori route.

- **Location**: `srv/email/template.js:65`
  `escapeHtml(value)`
  **IDTS concept**: Safe rendering of user-controlled bug titles and notification messages.
  **Impact if broken**: Email HTML can be malformed or interpret untrusted text as markup.
  **Must check together**: Template tests in `scripts/qa/test-email-outbox-programmatic.js`.

### Cross-folder impact

- Input fields originate in `db/schema.cds` entities `Bugs`, `Users`, `StatusValues`, and `NotificationEventTypes`.
- The output snapshot is persisted by `srv/email/outbox.js` into `NotificationDeliveries`.
- IDTS-37 may display delivery subject/status, but the raw HTML body is intentionally not exposed by `srv/service.cds`.

### Safe editing checklist

- Keep text and HTML versions semantically equivalent.
- Escape every dynamic value inserted into HTML.
- Do not add full bug descriptions, comments, attachments, credentials, or bearer tokens.
- Do not hardcode a deployment URL; use private `baseUrl` and omit the link when absent.

## Vietnamese

### File này dùng để làm gì

File này chuyển một notification của IDTS thành email dễ đọc ở cả dạng plain text và HTML.

Email chỉ dùng tập dữ liệu nhỏ: bug number, title, event, status, next processor, notification message và link IDTS tùy chọn. Description đầy đủ, comment, attachment, password và token không được đưa vào email.

### Giải thích cho người mới

Một dòng trong database chưa phải là email hoàn chỉnh; nó chỉ chứa các dữ kiện rời. Module này sắp xếp các dữ kiện thành subject và body mà Tester, Developer hoặc PM có thể hiểu. Nó còn escape HTML động, nên title như `<script>` chỉ hiện thành chữ thay vì được hiểu là mã HTML.

### Flow hoạt động trong IDTS

`outbox.js` đọc Bug, User, nhãn status và event rồi gọi `buildEmailMessage`. Subject/text/HTML trả về được lưu thành snapshot cố định trong `NotificationDeliveries`. Vì vậy khi retry, hệ thống gửi đúng nội dung tại thời điểm event xảy ra, không lấy nhầm trạng thái bug mới hơn.

### Important source anchors

- **Vị trí**: `srv/email/template.js:3`
  `buildEmailMessage(...)`
  **Khái niệm IDTS**: Snapshot email nghiệp vụ ổn định cho một notification event.
  **Ảnh hưởng nếu sai**: Người nhận có thể thiếu context của bug, thấy status sai hoặc nhận nội dung của trạng thái mới hơn khi retry.
  **Phải kiểm tra cùng**: `srv/email/outbox.js:18`, `db/schema.cds:189`, review readability IDTS-37.

- **Vị trí**: `srv/email/template.js:54`
  `buildBugLink(baseUrl, bugID)`
  **Khái niệm IDTS**: Link tùy chọn quay lại IDTS mà không hardcode URL môi trường.
  **Ảnh hưởng nếu sai**: Link trong email có thể trỏ về máy developer hoặc sai deployment.
  **Phải kiểm tra cùng**: Cấu hình private `baseUrl` và route Fiori sau deploy.

- **Vị trí**: `srv/email/template.js:65`
  `escapeHtml(value)`
  **Khái niệm IDTS**: Render an toàn title và notification message do người dùng tạo.
  **Ảnh hưởng nếu sai**: HTML email có thể hỏng hoặc hiểu text không tin cậy thành markup.
  **Phải kiểm tra cùng**: Template tests trong `scripts/qa/test-email-outbox-programmatic.js`.

### Liên kết với folder khác

- Input bắt nguồn từ các entity `Bugs`, `Users`, `StatusValues`, `NotificationEventTypes` trong `db/schema.cds`.
- Snapshot output được `srv/email/outbox.js` lưu vào `NotificationDeliveries`.
- IDTS-37 có thể hiển thị subject/status delivery, nhưng raw HTML body cố ý không được expose trong `srv/service.cds`.

### Lưu ý khi sửa

- Giữ nội dung text và HTML tương đương về ý nghĩa.
- Escape mọi giá trị động trước khi đưa vào HTML.
- Không thêm description đầy đủ, comment, attachment, credential hoặc bearer token.
- Không hardcode deployment URL; dùng `baseUrl` private và bỏ link nếu chưa cấu hình.

## Metadata

- Source: `srv/email/template.js`
- Related task: IDTS-36
- Last reviewed: 2026-06-30
