# Debug Lab: QA, Release Evidence, and a Safe Failure

## English

### Goal and mental model

QA does not prove “the button worked once.” It tries to falsify the claim across success, denial, boundary, role, persistence, recovery, and UX paths, then stores evidence that another person can reproduce safely.

### Step 1 — Translate Jira into scenarios

In a fresh worktree, read Jira context and acceptance criteria. Write at least: one positive case, one negative/boundary case, one role/authorization case, one reload/persistence case, one failure/recovery case, and one UI/UX observation where relevant. Mark N/A only with a reason.

### Step 2 — Run deterministic checks first

Run `npm run qa:depth:self-test`, agent/ownership gates, secret scan, then the focused script for the changed flow. Save command, exit code, passed/failed count, and sanitized output path. A planned 400/401/403 may be PASS; unexpected 5xx, raw SQL/stack, secret, console error, or SAP error dialog is FAIL.

### Step 3 — Trace one browser scenario

Use the browser harness. Before clicking, capture the starting state. In Network identify the exact OData request and response. Watch `pageerror`, console errors, 5xx, and SAP dialogs. After the action, reload and read the entity again to prove persistence. Add one falsification action: double-click, refresh mid-flow, back/forward, invalid value, empty state, or expired session.

### Step 4 — Store evidence safely

Raw temporary artifacts may live under `scripts/qa/uat-evidence/`. Select only useful, sanitized items for `docs/pm/evidence/<jira-key>/`: report, screenshot/checkpoint, and command summary. Redact token, password, private URL, full private email, DB URL, SMTP/AWS/API key. The member attaches selected evidence to the matching Jira task; the agent may prepare files but does not invent human sign-off.

### Step 5 — Test the gate itself

Use a safe fixture/copy of a PR body. Remove a required evidence section, set score below 80%, or set critical/debug/teach-back to FAIL. The validator must reject it. Restore valid fixture and confirm PASS. Do not alter a real member result to manufacture PASS.

### Failure exercise and teach-back

Create one controlled test-harness failure and classify it separately from a product defect. Explain why green programmatic tests do not replace role-based browser/manual evidence, and why an administrator's ability to bypass Jira does not remove the team's evidence obligation.

## Vietnamese

### Mục tiêu và mô hình dễ nhớ

QA không chứng minh “nút chạy được một lần”. QA cố phá claim qua success, denial, boundary, role, persistence, recovery và UX, sau đó lưu evidence an toàn để người khác có thể làm lại.

### Bước 1 — Đổi Jira thành scenario

Trong fresh worktree, đọc Jira context và acceptance criteria. Viết tối thiểu: một positive case, một negative/boundary case, một role/authorization case, một reload/persistence case, một failure/recovery case và một nhận xét UI/UX khi phù hợp. Chỉ ghi N/A khi có lý do.

### Bước 2 — Chạy deterministic check trước

Chạy `npm run qa:depth:self-test`, agent/ownership gate, secret scan rồi focused script của flow đã đổi. Lưu command, exit code, số pass/fail và output path đã sanitize. 400/401/403 có chủ đích có thể là PASS; 5xx bất ngờ, raw SQL/stack, secret, console error hoặc SAP error dialog là FAIL.

### Bước 3 — Trace một browser scenario

Dùng browser harness. Trước khi click, chụp trạng thái ban đầu. Trong Network nhận diện đúng OData request và response. Theo dõi `pageerror`, console error, 5xx và SAP dialog. Sau action, reload và đọc entity lại để chứng minh persistence. Thêm một thao tác cố phá: double-click, refresh giữa flow, back/forward, giá trị sai, empty state hoặc session hết hạn.

### Bước 4 — Lưu evidence an toàn

Artifact thô tạm có thể nằm trong `scripts/qa/uat-evidence/`. Chỉ chọn phần hữu ích đã sanitize đưa vào `docs/pm/evidence/<jira-key>/`: report, screenshot/checkpoint và command summary. Che token, password, private URL, email private đầy đủ, DB URL, SMTP/AWS/API key. Member tự attach evidence đã chọn vào đúng Jira task; agent được chuẩn bị file nhưng không được bịa human sign-off.

### Bước 5 — Test chính gate

Dùng fixture/copy an toàn của PR body. Xóa một evidence section bắt buộc, đặt score dưới 80% hoặc đặt critical/debug/teach-back là FAIL. Validator phải reject. Khôi phục fixture đúng và xác nhận PASS. Không sửa kết quả thật của member để tạo PASS giả.

### Bài lỗi và teach-back

Tạo một test-harness failure có kiểm soát và phân loại riêng với product defect. Giải thích vì sao programmatic test xanh không thay thế browser/manual evidence theo role, và vì sao administrator có thể bypass Jira vẫn không làm mất nghĩa vụ evidence của team.
