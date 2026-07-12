# IDTS Knowledge Gate Question Bank

## English

The agent selects questions from the relevant flow and may add one question derived from the current diff. Do not reveal answers before the member attempts a teach-back.

### Reproducible daily selection

From 2026-07-13 (Asia/Bangkok), run this before the first nontrivial task of a member's day:

```powershell
npm run learning:gate -- donhv authentication 2026-07-13 2026-07-10
```

The same member, flow, date, and mode always produce the same set, so a member cannot rerun it to seek easier questions. The optional fourth value is the last verified ownership-code activity date, not a meeting or arbitrary task. Add `additional` as the fifth value for a later new flow on the same day; use `-` as the fourth value when there is no date, for example `npm run learning:gate -- datdt dashboard 2026-07-13 - additional`. The first daily gate is three base questions plus inactivity questions, up to seven; a later new flow adds two flow-specific questions. The runner only prints prompts and an evidence template. It does not reveal answers, score a member, update Jira, or replace the real debug exercise and teach-back.

| Flow | Question prompts |
| --- | --- |
| Authentication | Trace Sign In from `login.html` to `AuthSessions`; explain why `auth.cds` and `auth.js` are both needed; identify the first safe backend breakpoint; explain where the bearer token is attached; describe what must never be returned after a database error. |
| Create/lifecycle | Identify the draft request in Browser Network; trace `NEW`, `PATCH`, and `SAVE`; explain where role validation happens; name the data written after create; identify a safe breakpoint for a wrong status transition. |
| Assignment/collaboration | Explain assignee versus current action owner; trace Smart Assign selection to backend validation; explain why no random developer is auto-selected; trace a comment or attachment write; explain metadata versus S3 binary content. |
| Dashboard/history | Identify the OData read used by the dashboard; explain a derived monitoring field; trace history rendering to its read model; explain why paging/history limits matter; identify the first breakpoint for a wrong KPI. |
| Email | Trace a workflow event into the outbox; explain why email failure cannot roll back the bug action; identify the worker claim/send/update sequence; explain `PENDING`, `SENT`, `FAILED`, and `SKIPPED`. |
| AI | Trace one review action to its OData action and audit row; explain suggestion-only behavior; describe provider unavailable fallback; identify forbidden provider payload data; explain why AI cannot change a lifecycle status. |
| QA | Explain the difference between browser smoke and API integration; identify required negative evidence; explain how a 401/403 can be an expected result; trace a failure from screenshot/log to a Jira bug; explain when evidence must be attached. |

## Vietnamese

Agent chọn câu hỏi theo flow liên quan và có thể thêm một câu từ diff hiện tại. Không được tiết lộ đáp án trước khi member tự teach-back.

### Chọn câu hỏi lặp lại được mỗi ngày

Từ 13/07/2026 theo múi giờ Asia/Bangkok, trước task không tầm thường đầu tiên trong ngày của một member, chạy lệnh sau:

```powershell
npm run learning:gate -- donhv authentication 2026-07-13 2026-07-10
```

Cùng member, flow, ngày và chế độ luôn cho ra cùng một bộ câu hỏi, nên member không thể chạy lại để tìm câu dễ hơn. Giá trị thứ tư (nếu có) là ngày ownership-code activity đã được xác minh, không phải ngày họp hoặc task bất kỳ. Thêm `additional` ở giá trị thứ năm nếu đây là flow mới tiếp theo trong cùng ngày; nếu không có ngày activity thì dùng `-` ở giá trị thứ tư, ví dụ `npm run learning:gate -- datdt dashboard 2026-07-13 - additional`. Gate đầu ngày gồm ba câu cơ bản cộng câu do không hoạt động, tối đa bảy câu; nếu cùng ngày bắt đầu một flow mới thì thêm hai câu riêng cho flow đó. Runner chỉ in prompt và mẫu evidence. Nó không tiết lộ đáp án, không tự chấm, không cập nhật Jira, và không thay thế debug exercise hay teach-back thật.

| Flow | Câu hỏi gợi ý |
| --- | --- |
| Authentication | Trace Sign In từ `login.html` tới `AuthSessions`; giải thích vì sao cần cả `auth.cds` và `auth.js`; chỉ breakpoint backend đầu tiên an toàn; nói token bearer được gắn ở đâu; mô tả dữ liệu nào tuyệt đối không được trả ra khi DB lỗi. |
| Create/lifecycle | Nhận diện draft request trong Browser Network; trace `NEW`, `PATCH`, `SAVE`; giải thích role validation nằm ở đâu; nêu dữ liệu được ghi sau create; chỉ breakpoint an toàn cho status transition sai. |
| Assignment/collaboration | Giải thích assignee khác current action owner thế nào; trace Smart Assign từ chọn UI đến backend validation; giải thích vì sao không auto-select developer ngẫu nhiên; trace comment hoặc attachment write; giải thích metadata khác S3 binary content thế nào. |
| Dashboard/history | Chỉ OData read dashboard dùng; giải thích một derived monitoring field; trace history render đến read model; giải thích vì sao cần limit/paging history; chỉ breakpoint đầu tiên khi KPI sai. |
| Email | Trace workflow event vào outbox; giải thích vì sao email fail không rollback bug action; chỉ chuỗi worker claim/send/update; giải thích `PENDING`, `SENT`, `FAILED`, `SKIPPED`. |
| AI | Trace một review action đến OData action và audit row; giải thích suggestion-only; mô tả fallback khi provider unavailable; nêu dữ liệu cấm gửi provider; giải thích vì sao AI không được đổi lifecycle status. |
| QA | Giải thích browser smoke khác API integration; chỉ negative evidence bắt buộc; giải thích lúc nào 401/403 là expected; trace failure từ screenshot/log tới Jira bug; giải thích khi nào phải attach evidence. |
