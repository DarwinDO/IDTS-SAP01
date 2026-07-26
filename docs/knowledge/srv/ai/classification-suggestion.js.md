# `srv/ai/classification-suggestion.js`

## IDTS-97 operational evidence

`recordClassificationAudit()` copies only normalized provider status and duration into the audit row. Classification inputs, catalog payloads, raw provider output, and error detail are not operational metric fields.

## Beginner-first execution map (2026-07-18)

### English

`suggestClassification` resolves Bug text/current values, reads active catalogs, sends a closed-set structured request when provider is available, and calls `buildClassificationSuggestions`. Each provider value is normalized and must match a real active catalog row; otherwise `fallbackSuggestion` uses deterministic keyword/current-context scoring or returns no-result. `suggestionRow` always includes review/status/provider/grounding information. Audit stores sanitized grounded output. This module never PATCHes priority, severity, module, component or category. Debug input → catalog counts → sanitized provider payload → row lookup → fallback score → final candidates/audit. If UI applies a suggestion, that is a separate explicit user action followed by normal backend validation.

### Vietnamese

`suggestClassification` resolve text/giá trị hiện tại của Bug, đọc catalog active, gửi structured request dạng closed set khi provider sẵn sàng, rồi gọi `buildClassificationSuggestions`. Mỗi provider value được normalize và phải match catalog row active thật; nếu không, `fallbackSuggestion` dùng keyword/current-context score deterministic hoặc trả no-result. `suggestionRow` luôn có thông tin review/status/provider/grounding. Audit lưu output grounded đã sanitize. Module không PATCH priority, severity, module, component hay category. Debug theo input → số row catalog → provider payload đã sanitize → lookup row → fallback score → candidate/audit cuối. Nếu UI áp suggestion, đó là thao tác user riêng và vẫn qua backend validation bình thường.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: DatDT/NhanT. Flow: classification review. Inspect candidate confidence and active-catalog validation before a result reaches the dialog. A suggestion never writes the selected category for the user.

### Vietnamese

Primary owner: DonHV. Backup: DatDT/NhanT. Flow: classification review. Quan sát candidate confidence và active-catalog validation trước khi result tới dialog. Suggestion không tự lưu category cho user.

## English

### What this file is for

This file implements IDTS-67: AI-assisted classification suggestion for bugs.

It suggests existing catalog values for SAP Module, Application Component, Defect Category, Priority, and Severity. It does **not** save those values into the bug. It only returns reviewable suggestions and, when the request is tied to a saved bug, writes a safe `AiSuggestions` audit record.

### Beginner explanation

In IDTS, fields such as Priority or Defect Category are not free text. They come from controlled catalogs in the database. That matters because reporting, filtering, assignment, and QA evidence depend on consistent values.

AI can help the user pick likely values, but AI must not invent a new catalog value. This file treats AI as a helper, not as an authority:

1. It sends only safe bug context and the active catalogs to the AI provider seam.
2. It reads the provider's structured answer.
3. It checks every suggested value against IDTS catalogs.
4. If the value is unknown or inactive, it returns `INVALID_PROVIDER_VALUE`.
5. If confidence is low, it returns `LOW_CONFIDENCE`.
6. If AI is disabled or fails, it uses deterministic fallback matching and keeps the workflow usable.

The user or a later UI task can review these suggestions. Nothing is automatically applied to the bug.

### Flow in IDTS

1. An authenticated client calls `POST /odata/v4/bug/suggestClassification`.
2. The request can reference an existing `sourceBugID`, or send draft-like bug text before the bug is saved.
3. The module loads active and inactive catalog rows. It needs inactive rows so it can distinguish "unknown" from "exists but inactive".
4. `srv/ai/provider.js` runs a structured AI request through the configured provider.
5. This module normalizes the provider output and validates each value against the catalog.
6. The action returns five review rows, one per classification field.
7. If `sourceBugID` exists, the result is stored as a sanitized `AiSuggestions` audit row.
8. The bug itself is not changed.

### Important source anchors

- **Location**: `suggestClassification()`
  - **IDTS concept**: public suggestion-only classification action.
  - **Impact if broken**: the API could mutate bug classification, leak provider diagnostics, or skip catalog validation.
  - **Must check together**: `srv/service.cds`, `srv/service.js`, `srv/ai/provider.js`, and `scripts/qa/test-idts67-classification-suggestion.js`.

- **Location**: `readCatalogs()`
  - **IDTS concept**: controlled vocabulary boundary.
  - **Impact if broken**: AI may suggest values that do not exist in IDTS reports or value helps.
  - **Must check together**: `db/schema.cds`, catalog CSV seed files, and code-list validation tests.

- **Location**: `resolveProviderSuggestion()`
  - **IDTS concept**: AI output is checked before it becomes user-facing.
  - **Impact if broken**: invented or inactive values may look valid to the reviewer.
  - **Must check together**: `srv/ai/provider.js`, `srv/ai/safety.js`, and the IDTS-67 QA script.

- **Location**: `fallbackSuggestion()`
  - **IDTS concept**: graceful degradation.
  - **Impact if broken**: disabled AI or provider errors could block classification help or expose raw error details.
  - **Must check together**: provider disabled/error tests and safety scan.

- **Location**: `recordClassificationAudit()`
  - **IDTS concept**: traceable AI assistance.
  - **Impact if broken**: saved-bug suggestions may have no review trail, or raw provider payloads may be persisted.
  - **Must check together**: `db/schema.cds` `AiSuggestions`, `srv/ai/audit.js`, and `BugService.AiSuggestions`.

### Cross-folder impact

- `srv/service.cds` exposes the `suggestClassification` OData action and result type.
- `srv/service.js` routes the action to this module.
- `db/schema.cds` provides the catalogs and `AiSuggestions` audit table.
- `db/data/idts.cap-*.csv` provides active catalog values used by validation and fallback.
- `scripts/qa/test-idts67-classification-suggestion.js` proves valid, invalid, inactive, low-confidence, disabled-provider, provider-error, audit, and no-mutation behavior.
- Future Fiori work under IDTS-70 can show these rows, but must still present them as suggestions requiring review.

### Safe editing checklist

- Do not auto-apply classification suggestions to `Bugs`.
- Do not accept provider output unless it matches an active IDTS catalog value.
- Do not store raw prompts, raw provider responses, credentials, tokens, emails, attachments, or private URLs in audit payloads.
- Keep the action usable when AI is disabled or the provider fails.
- Keep responses readable for UI review: status, confidence, reason, and catalog value must be explicit.
- Update this mirror, `srv/service.cds.md`, `srv/service.js.md`, and the QA script when the action contract changes.

## IDTS-71 security hardening note

English:

`classification-suggestion.js` now treats unsafe AI provider output as a security event, not as ordinary low-confidence text. If the provider returns content that looks like SQL diagnostics, password hashes, tokens, database URLs, API keys, stack traces, or other internal details, the module marks the provider status as `AI_OUTPUT_UNSAFE`.

That means the provider value is not trusted, the provider reason is not shown, and the user only receives a safe review/fallback message. The bug record is still not changed. The audit record stores sanitized review information only, so the AI feature remains suggestion-only and human-reviewed.

Important source anchor:

- **Location**: `buildClassificationSuggestions()` and `safeReason()`
  - **IDTS concept**: AI can help classification, but it cannot become a data-leak path.
  - **Impact if broken**: a provider prompt-injection or provider-side error could expose SQL, tokens, private endpoints, or stack traces in the UI or `AiSuggestions`.
  - **Must check together**: `srv/ai/safety.js`, `srv/ai/provider.js`, `srv/ai/audit.js`, `scripts/qa/test-idts67-classification-suggestion.js`, and `scripts/qa/test-idts71-ai-security-review.js`.

Vietnamese:

`classification-suggestion.js` hiện xem output AI không an toàn là một tình huống bảo mật, không phải chỉ là một lý do có độ tin cậy thấp. Nếu provider trả về nội dung giống SQL diagnostic, password hash, token, database URL, API key, stack trace hoặc chi tiết nội bộ khác, module sẽ đánh dấu trạng thái provider là `AI_OUTPUT_UNSAFE`.

Điều đó có nghĩa là giá trị provider gợi ý sẽ không được tin, lý do provider đưa ra sẽ không hiển thị, và người dùng chỉ nhận được thông điệp review/fallback an toàn. Bản ghi bug vẫn không bị thay đổi. Bản ghi audit chỉ lưu thông tin review đã sanitize, nên tính năng AI vẫn giữ đúng nguyên tắc: chỉ gợi ý, cần con người review.

Điểm neo quan trọng trong source:

- **Vị trí**: `buildClassificationSuggestions()` và `safeReason()`
  - **Khái niệm IDTS**: AI có thể hỗ trợ phân loại, nhưng không được trở thành đường làm lộ dữ liệu.
  - **Ảnh hưởng nếu sai**: prompt-injection hoặc lỗi phía provider có thể làm lộ SQL, token, private endpoint hoặc stack trace trên UI hoặc trong `AiSuggestions`.
  - **Phải kiểm tra cùng**: `srv/ai/safety.js`, `srv/ai/provider.js`, `srv/ai/audit.js`, `scripts/qa/test-idts67-classification-suggestion.js`, và `scripts/qa/test-idts71-ai-security-review.js`.

## Tiếng Việt

### File này dùng để làm gì

File này triển khai IDTS-67: gợi ý phân loại bug bằng AI.

Nó gợi ý các giá trị catalog có sẵn cho SAP Module, Application Component, Defect Category, Priority và Severity. Nó **không** tự lưu các giá trị đó vào bug. Nó chỉ trả về các gợi ý để con người review và, nếu request gắn với bug đã lưu, ghi một dòng audit an toàn trong `AiSuggestions`.

### Giải thích cho người mới

Trong IDTS, các field như Priority hay Defect Category không phải text nhập tự do. Chúng lấy từ catalog được quản lý trong database. Điều này quan trọng vì report, filter, assignment và evidence QA đều cần giá trị nhất quán.

AI có thể giúp người dùng chọn giá trị có khả năng đúng, nhưng AI không được tự bịa ra catalog mới. File này xem AI là trợ lý, không phải người ra quyết định:

1. Nó chỉ gửi context bug an toàn và danh sách catalog active vào lớp AI provider.
2. Nó đọc câu trả lời structured từ provider.
3. Nó kiểm tra từng giá trị AI gợi ý với catalog của IDTS.
4. Nếu giá trị không tồn tại hoặc inactive, nó trả `INVALID_PROVIDER_VALUE`.
5. Nếu độ tin cậy thấp, nó trả `LOW_CONFIDENCE`.
6. Nếu AI bị tắt hoặc lỗi, nó dùng fallback deterministic để workflow vẫn chạy được.

Người dùng hoặc task UI sau này có thể review các gợi ý này. Không có thay đổi nào được tự động apply vào bug.

### Flow hoạt động trong IDTS

1. Client đã đăng nhập gọi `POST /odata/v4/bug/suggestClassification`.
2. Request có thể gửi `sourceBugID` của bug đã lưu, hoặc gửi nội dung bug giống draft trước khi bug được lưu.
3. Module đọc cả catalog active và inactive. Cần đọc inactive để phân biệt "không tồn tại" với "có tồn tại nhưng đã bị tắt".
4. `srv/ai/provider.js` chạy structured AI request qua provider đang cấu hình.
5. Module này normalize output của provider và validate từng giá trị với catalog.
6. Action trả năm dòng review, mỗi dòng cho một field phân loại.
7. Nếu có `sourceBugID`, kết quả được lưu thành một dòng `AiSuggestions` đã sanitize.
8. Bản ghi bug không bị thay đổi.

### Các điểm neo quan trọng trong source

- **Vị trí**: `suggestClassification()`
  - **Khái niệm IDTS**: action public chỉ dùng để gợi ý phân loại.
  - **Ảnh hưởng nếu sai**: API có thể tự sửa classification của bug, lộ diagnostic từ provider, hoặc bỏ qua validation catalog.
  - **Phải kiểm tra cùng**: `srv/service.cds`, `srv/service.js`, `srv/ai/provider.js`, và `scripts/qa/test-idts67-classification-suggestion.js`.

- **Vị trí**: `readCatalogs()`
  - **Khái niệm IDTS**: ranh giới controlled vocabulary.
  - **Ảnh hưởng nếu sai**: AI có thể gợi ý giá trị không tồn tại trong report hoặc value help của IDTS.
  - **Phải kiểm tra cùng**: `db/schema.cds`, các file CSV seed catalog, và test validation code list.

- **Vị trí**: `resolveProviderSuggestion()`
  - **Khái niệm IDTS**: output của AI phải được kiểm tra trước khi hiển thị cho người dùng.
  - **Ảnh hưởng nếu sai**: giá trị AI bịa ra hoặc inactive có thể nhìn giống giá trị hợp lệ.
  - **Phải kiểm tra cùng**: `srv/ai/provider.js`, `srv/ai/safety.js`, và QA script của IDTS-67.

- **Vị trí**: `fallbackSuggestion()`
  - **Khái niệm IDTS**: graceful degradation, tức là lỗi AI không được làm hỏng workflow.
  - **Ảnh hưởng nếu sai**: AI bị tắt hoặc provider lỗi có thể làm mất gợi ý phân loại hoặc làm lộ lỗi thô.
  - **Phải kiểm tra cùng**: test provider disabled/error và safety scan.

- **Vị trí**: `recordClassificationAudit()`
  - **Khái niệm IDTS**: lưu vết AI assistance để review sau này.
  - **Ảnh hưởng nếu sai**: suggestion cho bug đã lưu có thể không có audit trail, hoặc raw provider payload bị persist.
  - **Phải kiểm tra cùng**: `db/schema.cds` entity `AiSuggestions`, `srv/ai/audit.js`, và `BugService.AiSuggestions`.

### Liên kết với file/folder khác

- `srv/service.cds` expose action OData `suggestClassification` và result type.
- `srv/service.js` route action đó vào module này.
- `db/schema.cds` cung cấp catalog và bảng audit `AiSuggestions`.
- `db/data/idts.cap-*.csv` cung cấp giá trị catalog active dùng cho validation và fallback.
- `scripts/qa/test-idts67-classification-suggestion.js` chứng minh các case: valid, invalid, inactive, low-confidence, AI disabled, provider error, audit và không mutate bug.
- Task Fiori sau này như IDTS-70 có thể hiển thị các dòng này, nhưng vẫn phải ghi rõ đây là gợi ý cần review.

### Checklist sửa file an toàn

- Không tự apply suggestion vào `Bugs`.
- Không chấp nhận output provider nếu nó không khớp catalog active của IDTS.
- Không lưu raw prompt, raw provider response, credential, token, email, attachment hoặc private URL vào audit payload.
- Giữ action dùng được khi AI bị tắt hoặc provider lỗi.
- Giữ response dễ review cho UI: status, confidence, reason và catalog value phải rõ ràng.
- Cập nhật mirror này, `srv/service.cds.md`, `srv/service.js.md` và QA script khi contract action thay đổi.

## IDTS-92/93 persisted review contract

### English

For a saved source Bug, `suggestClassification()` now returns the persisted audit `suggestionID` on every review row. `recordClassificationAudit()` also stores a safe `sourceClassification` snapshot containing only the five controlled classification values. The ID lets the existing dialog invoke Accept/Reject/Ignore; the snapshot lets `classification-apply.js` reject a stale apply after a person has manually changed classification.

Primary owner: DonHV. Backup: DatDT. Debug at `recordClassificationAudit()`: compare source values, the returned audit ID, and the sanitized payload. Check together with `review.js`, `classification-apply.js`, the two service files, and IDTS-67/91/93 tests. Never add private Bug content, user email, raw provider output, token, or endpoint to the snapshot.

### Vietnamese

Với Bug nguồn đã lưu, `suggestClassification()` hiện trả `suggestionID` của audit đã persist trên mọi review row. `recordClassificationAudit()` cũng lưu snapshot `sourceClassification` an toàn chỉ gồm năm giá trị classification có kiểm soát. ID cho phép dialog hiện tại gọi Accept/Reject/Ignore; snapshot giúp `classification-apply.js` chặn apply stale sau khi một người đã sửa classification thủ công.

Owner chính: DonHV. Backup: DatDT. Khi debug, bắt đầu tại `recordClassificationAudit()`: so giá trị nguồn, audit ID trả về và payload đã sanitize. Kiểm cùng `review.js`, `classification-apply.js`, hai file service và test IDTS-67/91/93. Không thêm nội dung Bug riêng tư, email user, raw provider output, token hoặc endpoint vào snapshot.
