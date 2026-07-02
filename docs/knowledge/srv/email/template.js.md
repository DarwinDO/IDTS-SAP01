# Knowledge: `srv/email/template.js`

## English

### What this file is for

This file turns one IDTS notification into the actual email payload sent by the outbox worker.

It creates:

- the email subject;
- the plain-text body;
- the HTML body;
- the safe “open this bug” link back to the Fiori app;
- the template key stored with the delivery row.

It intentionally keeps the email small. It includes only summary-level information: bug number, bug title, notification type, current status, current action owner, notification message, and an optional IDTS link. It does not include full bug descriptions, comments, attachments, passwords, bearer tokens, SMTP config, or private environment values.

### Beginner explanation

An IDTS notification record is not automatically a readable email. The database has separate facts: which bug changed, who should receive the message, what event happened, and what the current status is. This module arranges those facts into something a person can read in Gmail or another email client.

There are two bodies because email clients work differently:

- `text` is the safe fallback. It is readable even if the email client blocks HTML.
- `html` is the styled version. In IDTS-50 it uses a simple SAP/Fiori-like card layout with a blue header, metadata table, primary action button, fallback link, and footer.

The link is also built here because it is part of the email experience. Fiori Elements uses hash-based routing, so the URL must keep `#` directly after `index.html`. A wrong slash such as `index.html/#/...` makes the browser request `index.html/` from the server, which fails on Render.

### Flow in IDTS

1. A workflow action creates an in-app `Notifications` row.
2. `srv/email/outbox.js` prepares an email delivery row.
3. `outbox.js` loads the bug, recipient, status label, and event label.
4. `outbox.js` calls `buildEmailMessage(...)` from this file.
5. The returned `subject`, `text`, and `html` are stored on `NotificationDeliveries`.
6. The worker sends that stored snapshot. If the worker retries later, it sends the same event snapshot instead of rebuilding from a newer bug state.

### Important source anchors

- **Location**: `srv/email/template.js:3`
  `buildEmailMessage(...)`
  **IDTS concept**: Converts one notification event into a stable email snapshot.
  **Impact if broken**: Users may receive unreadable email, wrong action wording, missing context, or unsafe HTML.
  **Must check together**: `srv/email/outbox.js`, `db/schema.cds` `NotificationDeliveries`, `scripts/qa/test-email-outbox-programmatic.js`, IDTS-37 notification readability.

- **Location**: `srv/email/template.js:20`
  Plain-text body creation.
  **IDTS concept**: Safe fallback for clients that do not render HTML.
  **Impact if broken**: Some users may receive an email that is technically sent but hard to understand.
  **Must check together**: HTML body labels in the same file. Text and HTML should explain the same event.

- **Location**: `srv/email/template.js:29`
  Metadata rows for notification type, current status, and current action owner.
  **IDTS concept**: Separates “what happened” from “what status the bug is in now” and “who acts next”.
  **Impact if broken**: Users may confuse event type with bug status, especially for flows like Need More Information where both values can look similar.
  **Must check together**: `docs/project-context.md` notification/ownership wording and Fiori Object Page labels for current action owner.

- **Location**: `srv/email/template.js:39`
  CTA button and fallback link.
  **IDTS concept**: Lets the recipient jump from email into the IDTS Fiori Object Page.
  **Impact if broken**: Delivery can be marked `SENT`, but the user still cannot act because the link is unusable.
  **Must check together**: `app/bug-management-ui/webapp/manifest.json` route pattern, Render `baseUrl` config, and browser smoke after deploy.

- **Location**: `srv/email/template.js:85`
  `buildBugLink(baseUrl, bugID)`.
  **IDTS concept**: Builds the Fiori deep link for an active draft-enabled bug.
  **Impact if broken**: The email may point to `index.html/` or omit `IsActiveEntity=true`, causing Render 404 or Fiori navigation failure.
  **Must check together**: `app/bug-management-ui/webapp/manifest.json:92`, CAP draft key requirements, and the route used in `scripts/qa/test-idts24-uat-playwright.js`.

- **Location**: `srv/email/template.js:92`
  `normalizeAppUrl(baseUrl)`.
  **IDTS concept**: Keeps private deployment config flexible. `baseUrl` may be the Render root, the Fiori app folder, or the exact `index.html` path.
  **Impact if broken**: Different environments may need different private config values, making local/Render behavior drift.
  **Must check together**: `.cdsrc-private.example.json`, Render env vars, and any shared-QA smoke script that reads the public app URL.

- **Location**: `srv/email/template.js:105`
  `escapeHtml(value)`.
  **IDTS concept**: Treats user-controlled bug title/message text as text, not executable HTML.
  **Impact if broken**: Email markup may be malformed or unsafe.
  **Must check together**: Template tests that use unsafe titles/messages and secret-scan output.

### Cross-folder impact

- `db/schema.cds` defines `Notifications` and `NotificationDeliveries`, which store the subject/body snapshots created here.
- `srv/email/outbox.js` calls this module before the worker sends the message.
- `srv/service.cds` exposes safe delivery metadata but intentionally does not expose `htmlBody` or `textBody` to Fiori clients.
- `app/bug-management-ui/webapp/manifest.json` defines the Fiori Object Page route `Bugs({key})`; this file must generate a link compatible with that route.
- `scripts/qa/test-email-outbox-programmatic.js` protects the email template, link shape, escaping behavior, and outbox behavior.
- Render private environment config supplies `baseUrl`; this file must not hardcode deployment URLs.

### Safe editing checklist

- Keep plain text and HTML semantically equivalent.
- Escape every dynamic value before inserting it into HTML.
- Keep the Fiori link as `index.html#/Bugs(ID=<uuid>,IsActiveEntity=true)`, not `index.html/#/Bugs(...)`.
- Do not include full descriptions, comments, attachments, credentials, tokens, SMTP config, API keys, private endpoints, or full private recipient lists.
- If changing link logic, test at least these `baseUrl` forms:
  - Render root, for example `https://host.example`;
  - Fiori app folder, for example `https://host.example/bug-management-ui/webapp`;
  - exact app HTML, for example `https://host.example/bug-management-ui/webapp/index.html`.
- If changing email wording, keep “notification type”, “current status”, and “current action owner” distinct.

## Vietnamese

### File này dùng để làm gì

File này biến một notification của IDTS thành payload email thật mà outbox worker sẽ gửi.

Nó tạo:

- subject của email;
- nội dung plain text;
- nội dung HTML;
- link an toàn để mở bug trong Fiori app;
- template key được lưu cùng delivery row.

Email cố ý chỉ chứa thông tin tóm tắt: bug number, bug title, loại notification, trạng thái hiện tại, người/queue đang cần xử lý tiếp, message notification, và link IDTS nếu có cấu hình. Email không chứa description đầy đủ, comment, attachment, password, bearer token, SMTP config hoặc giá trị private environment.

### Giải thích cho người mới

Một record notification trong IDTS chưa phải là email dễ đọc. Database chỉ có các dữ kiện rời: bug nào thay đổi, ai nhận thông báo, event gì xảy ra, và trạng thái hiện tại là gì. Module này sắp xếp các dữ kiện đó thành email mà người dùng có thể đọc trong Gmail hoặc email client khác.

Email có hai phần nội dung vì email client hoạt động khác nhau:

- `text` là bản fallback an toàn. Nếu email client chặn HTML thì người nhận vẫn đọc được.
- `html` là bản có giao diện. Trong IDTS-50, phần này dùng layout dạng card gần với SAP/Fiori: header xanh, bảng metadata, nút hành động chính, fallback link và footer.

Link mở bug cũng được tạo trong file này vì nó là một phần của trải nghiệm email. Fiori Elements dùng hash-based routing, nên dấu `#` phải đứng ngay sau `index.html`. Nếu sinh sai thành `index.html/#/...`, browser sẽ request `index.html/` lên server trước, và Render sẽ trả 404.

### Flow hoạt động trong IDTS

1. Một workflow action tạo record `Notifications` trong app.
2. `srv/email/outbox.js` chuẩn bị email delivery row.
3. `outbox.js` đọc bug, người nhận, nhãn status và nhãn event.
4. `outbox.js` gọi `buildEmailMessage(...)` trong file này.
5. `subject`, `text`, và `html` trả về được lưu vào `NotificationDeliveries`.
6. Worker gửi snapshot đã lưu đó. Nếu gửi lỗi và retry sau, worker vẫn gửi đúng nội dung tại thời điểm event xảy ra, không tự rebuild theo trạng thái bug mới hơn.

### Important source anchors

- **Vị trí**: `srv/email/template.js:3`
  `buildEmailMessage(...)`
  **Khái niệm IDTS**: Chuyển một notification event thành snapshot email ổn định.
  **Ảnh hưởng nếu sai**: Người dùng có thể nhận email khó đọc, wording hành động sai, thiếu context hoặc HTML không an toàn.
  **Phải kiểm tra cùng**: `srv/email/outbox.js`, `db/schema.cds` `NotificationDeliveries`, `scripts/qa/test-email-outbox-programmatic.js`, readability task IDTS-37.

- **Vị trí**: `srv/email/template.js:20`
  Tạo plain-text body.
  **Khái niệm IDTS**: Fallback an toàn cho email client không render HTML.
  **Ảnh hưởng nếu sai**: Email vẫn gửi thành công về mặt kỹ thuật nhưng một số người dùng có thể không hiểu nội dung.
  **Phải kiểm tra cùng**: Các label trong HTML body cùng file. Text và HTML phải giải thích cùng một event.

- **Vị trí**: `srv/email/template.js:29`
  Metadata rows cho notification type, current status và current action owner.
  **Khái niệm IDTS**: Tách rõ “chuyện gì vừa xảy ra”, “bug đang ở trạng thái nào”, và “ai cần xử lý tiếp”.
  **Ảnh hưởng nếu sai**: Người dùng có thể nhầm event type với bug status, nhất là flow Need More Information khi hai giá trị có thể giống nhau.
  **Phải kiểm tra cùng**: Wording trong `docs/project-context.md` về notification/ownership và label Current Action Owner trên Object Page.

- **Vị trí**: `srv/email/template.js:39`
  CTA button và fallback link.
  **Khái niệm IDTS**: Cho phép người nhận đi từ email vào đúng Object Page của bug trong Fiori.
  **Ảnh hưởng nếu sai**: Delivery có thể là `SENT`, nhưng người dùng vẫn không xử lý được vì link không mở được.
  **Phải kiểm tra cùng**: Route pattern trong `app/bug-management-ui/webapp/manifest.json`, Render `baseUrl` config, và browser smoke sau deploy.

- **Vị trí**: `srv/email/template.js:85`
  `buildBugLink(baseUrl, bugID)`.
  **Khái niệm IDTS**: Tạo Fiori deep link cho active bug trong entity có draft.
  **Ảnh hưởng nếu sai**: Email có thể trỏ tới `index.html/` hoặc thiếu `IsActiveEntity=true`, gây Render 404 hoặc Fiori không điều hướng đúng.
  **Phải kiểm tra cùng**: `app/bug-management-ui/webapp/manifest.json:92`, yêu cầu key của CAP draft, và route trong `scripts/qa/test-idts24-uat-playwright.js`.

- **Vị trí**: `srv/email/template.js:92`
  `normalizeAppUrl(baseUrl)`.
  **Khái niệm IDTS**: Giữ cấu hình private deployment linh hoạt. `baseUrl` có thể là Render root, folder Fiori app, hoặc đúng path `index.html`.
  **Ảnh hưởng nếu sai**: Mỗi môi trường phải cấu hình kiểu khác nhau, làm local và Render dễ lệch hành vi.
  **Phải kiểm tra cùng**: `.cdsrc-private.example.json`, Render env vars, và shared-QA smoke script đọc public app URL.

- **Vị trí**: `srv/email/template.js:105`
  `escapeHtml(value)`.
  **Khái niệm IDTS**: Xem bug title/message do người dùng nhập là text, không phải HTML chạy được.
  **Ảnh hưởng nếu sai**: HTML email có thể bị hỏng hoặc không an toàn.
  **Phải kiểm tra cùng**: Template tests dùng unsafe title/message và kết quả secret scan.

### Liên kết với folder khác

- `db/schema.cds` định nghĩa `Notifications` và `NotificationDeliveries`, nơi lưu subject/body snapshot được tạo ở đây.
- `srv/email/outbox.js` gọi module này trước khi worker gửi email.
- `srv/service.cds` expose metadata delivery an toàn nhưng cố ý không expose `htmlBody` hoặc `textBody` cho Fiori client.
- `app/bug-management-ui/webapp/manifest.json` định nghĩa route Object Page `Bugs({key})`; file này phải tạo link tương thích route đó.
- `scripts/qa/test-email-outbox-programmatic.js` bảo vệ template email, format link, behavior escape HTML và outbox behavior.
- Render private environment config cung cấp `baseUrl`; file này không được hardcode deployment URL.

### Lưu ý khi sửa

- Giữ bản plain text và HTML tương đương về ý nghĩa.
- Escape mọi giá trị động trước khi đưa vào HTML.
- Giữ link Fiori theo dạng `index.html#/Bugs(ID=<uuid>,IsActiveEntity=true)`, không dùng `index.html/#/Bugs(...)`.
- Không đưa description đầy đủ, comment, attachment, credential, token, SMTP config, API key, private endpoint hoặc danh sách recipient thật vào email.
- Nếu sửa logic link, phải test ít nhất ba dạng `baseUrl`:
  - Render root, ví dụ `https://host.example`;
  - folder Fiori app, ví dụ `https://host.example/bug-management-ui/webapp`;
  - đúng app HTML, ví dụ `https://host.example/bug-management-ui/webapp/index.html`.
- Nếu sửa wording email, phải giữ rõ ba khái niệm “notification type”, “current status”, và “current action owner”.

## Metadata

- Source: `srv/email/template.js`
- Related task: IDTS-50
- Last reviewed: 2026-07-02
