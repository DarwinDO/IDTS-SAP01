# IDTS-63 - AI Assistance Guardrails and Human Review

Status: Approved baseline for implementation planning

Owner: DonHV

Support: NhanT

Decision date: 2026-07-07

## English

### 1. Purpose

IDTS may use AI to help users find similar bugs, suggest classification, summarize long bug context, and explain Smart Assign candidates. AI is an advisory layer. It does not own workflow decisions and must not replace CAP validation, role authorization, or the original bug record.

### 2. Approved v1 capabilities

| Capability | AI may do | Human must do | AI must never do |
| --- | --- | --- | --- |
| Duplicate/similar detection | Return ranked existing bugs with score and a short reason | Open candidates, compare evidence, and decide whether to follow, reopen, create, or later confirm a relationship | Block create, mark a bug duplicate, or create a `DuplicateLinks` record automatically |
| Classification suggestion | Suggest values from the active SAP Module, Application Component, Defect Category, Priority, and Severity catalogs | Review and explicitly apply or ignore each suggestion | Invent catalog values, persist changes, or bypass CAP validation |
| Bug/handoff summary | Produce a concise draft grounded in the current bug, selected comments, and history | Review the source bug and decide whether to copy or use the draft | Replace source content, hide conflicting facts, or change workflow state |
| Smart Assign explanation | Explain why an existing eligible Developer candidate may fit, using approved responsibility and workload data | Select or reject the candidate and submit assignment through the normal IDTS flow | Auto-select, auto-assign, rank an ineligible user, or override assignment validation |

### 3. Human-review rules

- Every AI result must be visibly presented as a suggestion, not as a confirmed fact or completed action.
- Accept, reject, ignore, and apply actions must be explicit user actions.
- CAP remains the final authority for catalog validity, role permission, assignment eligibility, and workflow transitions.
- Low-confidence, no-result, disabled, timeout, malformed-output, and provider-failure states must be safe and understandable.
- Ignoring or rejecting an AI result must not block or penalize the normal bug workflow.
- AI output must be escaped as text unless a separately reviewed safe-rendering path is approved.

### 4. Data boundary

Minimum-data principle: each capability sends only the fields needed for that request.

| Data group | Policy | Notes |
| --- | --- | --- |
| Bug title, description, reproduction steps, actual result, expected result | Allowed when needed | Trim length and remove secret-like content before provider calls |
| Bug number, status, priority, severity, environment, catalog display names | Allowed when needed | Prefer display names; technical UUIDs are normally unnecessary |
| Selected comments and readable history summaries | Conditional | Include only entries needed for summary/handoff; exclude unnecessary identity data |
| Developer capability, availability, and workload summaries | Conditional | Use only for Smart Assign explanation; do not send email or authentication data |
| Passwords, password hashes, bearer/session tokens, API keys, SMTP/AWS/database credentials | Forbidden | Must never enter prompts, logs, evidence, audit records, or provider payloads |
| User email, private recipient lists, private endpoints, DB URLs, S3 storage references | Forbidden by default | A later exception requires a separate security decision; none is approved for v1 |
| Attachment bytes, raw logs, screenshots, uploaded documents | Forbidden in v1 | Users may inspect these in IDTS, but v1 AI does not transmit them |
| Raw provider request/response and hidden reasoning | Do not persist | Store only the safe normalized suggestion needed for review/audit |

Before a provider call, IDTS must enforce field allowlisting, length limits, secret-pattern redaction, and safe logging. Bug text is untrusted input and cannot grant tools, permissions, or workflow authority.

### 5. Failure and fallback behavior

- AI is disabled by default. Disabled or incomplete configuration returns a safe unavailable/no-suggestion result.
- Provider timeout, rate limit, malformed output, or internal failure must not roll back create, edit, comment, assignment, or lifecycle actions.
- The UI must keep the normal non-AI workflow available.
- User-facing errors must not expose provider names when unnecessary, hostnames, stack traces, prompts, credentials, or private configuration.
- Server diagnostics may keep a sanitized error category, feature type, correlation identifier, duration, and retryability flag.
- Automatic retries must be bounded and must not repeat a user-visible workflow action.

### 6. Audit baseline

When an AI suggestion is generated, IDTS may store only a safe normalized audit record containing:

- Feature type and source bug.
- Sanitized suggestion payload and optional normalized confidence.
- Provider/model aliases that contain no credential or private endpoint.
- Created time and requesting user.
- Review state: `PENDING`, `ACCEPTED`, `REJECTED`, `IGNORED`, or `EXPIRED`.
- Reviewer and review time when an explicit review occurs.

Do not persist raw prompts, raw provider responses, hidden reasoning, credentials, tokens, attachment content, or unnecessary personal data. Audit records must not be publicly writable through OData.

### 7. Feature acceptance gate

An AI feature cannot be accepted until it proves:

- Useful positive output and an unrelated/no-result case.
- AI-disabled and provider-failure fallback.
- Malformed output handling.
- Role and authorization boundaries.
- Prompt-injection text cannot trigger actions or reveal protected data.
- Safe rendering and secret scan.
- Human acceptance/rejection/ignore behavior and audit evidence where applicable.
## Tiếng Việt

### 1. Mục đích

IDTS có thể dùng AI để hỗ trợ tìm bug tương tự, gợi ý phân loại, tóm tắt ngữ cảnh bug dài và giải thích ứng viên Smart Assign. AI chỉ là lớp tư vấn. AI không sở hữu quyết định workflow và không được thay thế validation của CAP, phân quyền role hoặc dữ liệu bug gốc.

### 2. Các khả năng v1 đã được duyệt

| Khả năng | AI được làm | Người dùng phải làm | AI tuyệt đối không được làm |
| --- | --- | --- | --- |
| Phát hiện bug trùng/tương tự | Trả danh sách bug hiện có theo độ liên quan, kèm điểm và lý do ngắn | Mở từng candidate, so sánh evidence và quyết định follow, reopen, tạo mới hoặc xác nhận quan hệ sau | Chặn tạo bug, tự đánh dấu duplicate hoặc tự tạo `DuplicateLinks` |
| Gợi ý phân loại | Gợi ý giá trị thuộc catalog active của SAP Module, Application Component, Defect Category, Priority và Severity | Review rồi chủ động áp dụng hoặc bỏ qua từng gợi ý | Tự tạo giá trị catalog, tự lưu thay đổi hoặc vượt qua validation CAP |
| Tóm tắt bug/handoff | Tạo bản nháp ngắn dựa trên bug hiện tại, comment được chọn và history | Đọc lại dữ liệu nguồn rồi quyết định có dùng/copy bản nháp hay không | Thay thế dữ liệu nguồn, che giấu thông tin mâu thuẫn hoặc đổi trạng thái workflow |
| Giải thích Smart Assign | Giải thích vì sao một Developer hợp lệ có thể phù hợp dựa trên responsibility và workload đã duyệt | Chọn hoặc từ chối candidate rồi submit assignment bằng flow IDTS bình thường | Tự chọn, tự assign, xếp hạng user không hợp lệ hoặc vượt qua assignment validation |

### 3. Quy tắc human review

- Mọi kết quả AI phải được hiển thị rõ là gợi ý, không phải sự thật đã xác nhận hoặc action đã hoàn tất.
- Accept, reject, ignore và apply phải là hành động rõ ràng do người dùng thực hiện.
- CAP vẫn là lớp quyết định cuối cho catalog, quyền role, điều kiện assignee và transition workflow.
- Trường hợp confidence thấp, không có kết quả, AI bị tắt, timeout, output sai format hoặc provider lỗi phải an toàn và dễ hiểu.
- Bỏ qua hoặc từ chối gợi ý AI không được chặn hay làm bất lợi cho workflow bug bình thường.
- Output AI phải được escape như text, trừ khi sau này có một đường render an toàn được review riêng.

### 4. Ranh giới dữ liệu

Nguyên tắc dữ liệu tối thiểu: mỗi chức năng chỉ gửi đúng field cần thiết cho request đó.

| Nhóm dữ liệu | Chính sách | Lưu ý |
| --- | --- | --- |
| Title, description, steps to reproduce, actual result, expected result | Được phép khi cần | Giới hạn độ dài và loại bỏ nội dung giống secret trước khi gọi provider |
| Bug number, status, priority, severity, environment, tên hiển thị catalog | Được phép khi cần | Ưu tiên display name; UUID kỹ thuật thường không cần gửi |
| Comment được chọn và history summary dễ đọc | Có điều kiện | Chỉ lấy entry cần cho summary/handoff; bỏ identity không cần thiết |
| Tóm tắt capability, availability và workload của Developer | Có điều kiện | Chỉ dùng cho giải thích Smart Assign; không gửi email hoặc dữ liệu đăng nhập |
| Password, password hash, bearer/session token, API key, SMTP/AWS/database credential | Cấm | Không được xuất hiện trong prompt, log, evidence, audit hoặc provider payload |
| Email người dùng, danh sách recipient private, endpoint private, DB URL, S3 storage reference | Mặc định cấm | Muốn ngoại lệ phải có quyết định security riêng; v1 chưa duyệt ngoại lệ nào |
| Nội dung attachment, raw log, screenshot, tài liệu upload | Cấm trong v1 | Người dùng có thể xem trong IDTS nhưng AI v1 không truyền các dữ liệu này |
| Raw provider request/response và hidden reasoning | Không persist | Chỉ lưu suggestion chuẩn hóa, an toàn và cần cho review/audit |

Trước khi gọi provider, IDTS phải allowlist field, giới hạn độ dài, redaction pattern giống secret và dùng logging an toàn. Nội dung bug là input không đáng tin cậy, không thể tự cấp tool, quyền hoặc quyền đổi workflow.

### 5. Hành vi khi lỗi và fallback

- AI mặc định tắt. Config thiếu hoặc chưa bật phải trả trạng thái unavailable/no-suggestion an toàn.
- Timeout, rate limit, output sai format hoặc lỗi provider không được rollback create, edit, comment, assignment hoặc lifecycle action.
- UI luôn phải giữ flow không dùng AI hoạt động bình thường.
- Lỗi cho người dùng không được lộ provider khi không cần thiết, hostname, stack trace, prompt, credential hoặc config private.
- Log server chỉ nên giữ loại lỗi đã làm sạch, feature type, correlation ID, thời gian xử lý và cờ có thể retry hay không.
- Retry tự động phải có giới hạn và không được lặp lại action workflow mà người dùng nhìn thấy.

### 6. Baseline audit

Khi tạo gợi ý AI, IDTS chỉ được lưu audit record chuẩn hóa và an toàn gồm:

- Feature type và bug nguồn.
- Suggestion payload đã làm sạch và confidence chuẩn hóa nếu có.
- Alias provider/model không chứa credential hoặc private endpoint.
- Thời gian tạo và người yêu cầu.
- Trạng thái review: `PENDING`, `ACCEPTED`, `REJECTED`, `IGNORED` hoặc `EXPIRED`.
- Người review và thời gian review khi có hành động review rõ ràng.

Không persist raw prompt, raw provider response, hidden reasoning, credential, token, attachment content hoặc dữ liệu cá nhân không cần thiết. Audit record không được cho client ghi trực tiếp qua OData.

### 7. Điều kiện nghiệm thu feature AI

Một feature AI chỉ được accept khi chứng minh được:

- Kết quả positive có ích và case unrelated/no-result.
- Fallback khi AI disabled và provider lỗi.
- Xử lý output sai format.
- Ranh giới role và authorization.
- Text prompt injection không kích hoạt action hoặc làm lộ dữ liệu được bảo vệ.
- Render an toàn và secret scan pass.
- Hành vi accept/reject/ignore của con người và evidence audit khi phù hợp.
