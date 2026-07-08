# `srv/ai/bug-summary.js`

## English

### What this file is for

This file implements IDTS-68: a grounded AI-generated bug and handoff summary.

It reads an existing bug, its latest comments, and its latest history events, then returns a reviewable summary for the next person handling the bug. It does not change the bug, does not replace the History Timeline, and does not read attachment binary content.

### Beginner explanation

In IDTS, a bug can become hard to understand after several status changes, comments, and handoffs. A tester may request a fix, a developer may ask for more information, a PM may reassign, and the next person may need to understand the current situation quickly.

This file creates that short handoff view. The important rule is "grounded": the summary must come from stored IDTS data. If data is missing, the backend must say it is missing instead of pretending it knows.

The AI provider is optional. If AI is disabled, fails, times out, or returns malformed output, this module still returns a deterministic fallback built from the bug record. That keeps the normal bug workflow safe.

### Flow in IDTS

1. An authenticated client calls `POST /odata/v4/bug/summarizeBugHandoff` with `sourceBugID`.
2. The module reads the bug from `idts.cap.Bugs`.
3. It reads bounded context: latest comments, latest history events, and latest field-change logs.
4. It builds an allowlisted provider input. Attachment binary content, credentials, tokens, and private storage references are not included.
5. It calls the configured AI provider through `srv/ai/provider.js`.
6. If provider output is usable and safe, the module returns it with IDTS status/owner metadata.
7. If provider output is missing, unsafe, malformed, or the provider is disabled, the module returns a deterministic fallback.
8. It writes one sanitized `AiSuggestions` audit row with feature type `BUG_SUMMARY` when the request user can be resolved.

### Important source anchors

- **Location**: `summarizeBugHandoff()`
  - **IDTS concept**: public backend action for bug handoff summary.
  - **Impact if broken**: the UI or future review screen may not be able to get a safe summary for an existing bug.
  - **Must check together**: `srv/service.cds`, `srv/service.js`, and `scripts/qa/test-idts68-bug-summary.js`.

- **Location**: `readGroundedBugContext()`
  - **IDTS concept**: grounded data boundary.
  - **Impact if broken**: the summary may miss comments/history or accidentally include data that should not be sent to AI.
  - **Must check together**: `db/schema.cds` entities `Bugs`, `Comments`, `HistoryEvents`, `HistoryLogs`.

- **Location**: `providerInput()`
  - **IDTS concept**: minimum allowlisted AI payload.
  - **Impact if broken**: provider prompts could include attachment content, secrets, or irrelevant private data.
  - **Must check together**: `srv/ai/provider.js`, `srv/ai/safety.js`, and AI guardrail docs.

- **Location**: `normalizeProviderSummary()` and `deterministicSummary()`
  - **IDTS concept**: provider output is optional; IDTS remains usable without AI.
  - **Impact if broken**: AI disabled/provider failure could block the summary feature, or missing data may be invented.
  - **Must check together**: disabled-provider, provider-error, malformed-output, and sparse-data tests.

- **Location**: `recordSummaryAudit()`
  - **IDTS concept**: AI suggestions need review evidence.
  - **Impact if broken**: generated summaries may have no audit trail, or audit payloads may store raw provider detail.
  - **Must check together**: `srv/ai/audit.js`, `db/schema.cds` `AiSuggestions`, and `BugService.AiSuggestions`.

### Cross-folder impact

- `srv/service.cds` exposes `BugHandoffSummaryResult` and the `summarizeBugHandoff` OData action.
- `srv/service.js` wires the OData action to this module.
- `db/schema.cds` provides the source data and `AiSuggestions` audit entity.
- `scripts/qa/test-idts68-bug-summary.js` verifies normal, sparse-data, long-history, disabled-provider, provider-error, unsafe-provider, malformed-output, unknown-source, audit, and no-mutation behavior.
- Future Fiori task IDTS-70 can display this output, but must label it as AI-generated and require human review.

### Safe editing checklist

- Do not mutate `Bugs`, `Comments`, `HistoryEvents`, or workflow state from this action.
- Do not include attachment binary content or private storage references in provider input.
- Do not store raw prompts or raw provider responses in `AiSuggestions`.
- Keep missing data explicit.
- Keep provider failure safe and non-blocking.
- Update this mirror and the focused QA script if the response shape changes.

## Tiếng Việt

### File này dùng để làm gì

File này triển khai IDTS-68: tạo summary bug và handoff summary có căn cứ dữ liệu.

Nó đọc một bug đã tồn tại, các comment mới nhất, và các history event mới nhất, sau đó trả về một bản tóm tắt để người xử lý tiếp theo hiểu nhanh tình hình. Nó không sửa bug, không thay thế History Timeline, và không đọc nội dung binary của attachment.

### Giải thích cho người mới

Trong IDTS, một bug có thể khó hiểu sau nhiều lần đổi status, comment và chuyển người xử lý. Tester có thể báo lỗi, Developer có thể yêu cầu thêm thông tin, PM có thể reassign, và người tiếp theo cần hiểu nhanh bug đang ở đâu.

File này tạo ra bản handoff ngắn đó. Quy tắc quan trọng là "có căn cứ": summary phải dựa trên dữ liệu đang lưu trong IDTS. Nếu thiếu dữ liệu, backend phải nói rõ là thiếu, không được tự bịa.

AI provider chỉ là tùy chọn. Nếu AI bị tắt, lỗi, timeout, hoặc trả output sai format, module này vẫn trả fallback deterministic dựa trên bản ghi bug. Nhờ vậy workflow xử lý bug bình thường không bị hỏng.

### Flow hoạt động trong IDTS

1. Client đã đăng nhập gọi `POST /odata/v4/bug/summarizeBugHandoff` với `sourceBugID`.
2. Module đọc bug từ `idts.cap.Bugs`.
3. Nó đọc context có giới hạn: comment mới nhất, history event mới nhất, và các field-change log mới nhất.
4. Nó dựng input đã allowlist để gửi vào provider. Nội dung attachment, credential, token và private storage reference không được đưa vào.
5. Nó gọi AI provider thông qua `srv/ai/provider.js`.
6. Nếu output provider dùng được và an toàn, module trả output đó kèm status/owner metadata của IDTS.
7. Nếu provider thiếu output, không an toàn, sai format, hoặc AI bị tắt, module trả fallback deterministic.
8. Nó ghi một dòng audit `AiSuggestions` đã sanitize với feature type `BUG_SUMMARY` nếu resolve được user đang request.

### Các điểm neo quan trọng trong source

- **Vị trí**: `summarizeBugHandoff()`
  - **Khái niệm IDTS**: action backend public để tạo handoff summary cho bug.
  - **Ảnh hưởng nếu sai**: UI hoặc màn review AI sau này không lấy được summary an toàn cho bug hiện có.
  - **Phải kiểm tra cùng**: `srv/service.cds`, `srv/service.js`, và `scripts/qa/test-idts68-bug-summary.js`.

- **Vị trí**: `readGroundedBugContext()`
  - **Khái niệm IDTS**: ranh giới dữ liệu có căn cứ.
  - **Ảnh hưởng nếu sai**: summary có thể thiếu comment/history hoặc vô tình gửi dữ liệu không nên gửi cho AI.
  - **Phải kiểm tra cùng**: các entity `Bugs`, `Comments`, `HistoryEvents`, `HistoryLogs` trong `db/schema.cds`.

- **Vị trí**: `providerInput()`
  - **Khái niệm IDTS**: payload AI tối thiểu và đã allowlist.
  - **Ảnh hưởng nếu sai**: prompt gửi provider có thể chứa attachment content, secret, hoặc dữ liệu riêng tư không cần thiết.
  - **Phải kiểm tra cùng**: `srv/ai/provider.js`, `srv/ai/safety.js`, và tài liệu guardrail AI.

- **Vị trí**: `normalizeProviderSummary()` và `deterministicSummary()`
  - **Khái niệm IDTS**: output provider là tùy chọn; IDTS vẫn dùng được khi không có AI.
  - **Ảnh hưởng nếu sai**: AI bị tắt/lỗi có thể làm hỏng summary feature, hoặc dữ liệu thiếu bị AI/backend tự bịa.
  - **Phải kiểm tra cùng**: test AI disabled, provider error, malformed output, và sparse-data.

- **Vị trí**: `recordSummaryAudit()`
  - **Khái niệm IDTS**: AI suggestion cần có bằng chứng review.
  - **Ảnh hưởng nếu sai**: summary được sinh ra có thể không có audit trail, hoặc audit payload lưu raw provider detail.
  - **Phải kiểm tra cùng**: `srv/ai/audit.js`, `db/schema.cds` `AiSuggestions`, và `BugService.AiSuggestions`.

### Liên kết với folder khác

- `srv/service.cds` expose `BugHandoffSummaryResult` và action OData `summarizeBugHandoff`.
- `srv/service.js` nối action OData vào module này.
- `db/schema.cds` cung cấp dữ liệu nguồn và entity audit `AiSuggestions`.
- `scripts/qa/test-idts68-bug-summary.js` kiểm tra normal, thiếu dữ liệu, history dài, AI disabled, provider error, unsafe provider, malformed output, source bug không tồn tại, audit và no-mutation.
- Task Fiori tương lai IDTS-70 có thể hiển thị output này, nhưng phải ghi rõ đây là nội dung AI-generated và cần human review.

### Checklist sửa file an toàn

- Không mutate `Bugs`, `Comments`, `HistoryEvents`, hoặc workflow state từ action này.
- Không đưa attachment binary content hoặc private storage reference vào provider input.
- Không lưu raw prompt hoặc raw provider response trong `AiSuggestions`.
- Dữ liệu thiếu phải được nói rõ.
- Provider failure phải an toàn và không được block workflow.
- Nếu đổi response shape, cập nhật mirror này và focused QA script.
