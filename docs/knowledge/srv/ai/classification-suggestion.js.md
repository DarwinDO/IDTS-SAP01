# `srv/ai/classification-suggestion.js`

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
