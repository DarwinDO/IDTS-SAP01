# `AiReviewUi.js` - Reusable AI suggestion review UI helper

> **Ownership / debug anchor:** DatDT owns AI result presentation (backup: DonHV). This module maps safe backend result states to UI wording and must not decide workflow or persist suggestions.
> **Ownership / điểm debug:** DatDT sở hữu phần hiển thị kết quả AI (backup: DonHV). Module này map trạng thái an toàn từ backend sang wording UI và không được quyết định workflow hoặc persist suggestion.

## English

### What this file is for

`AiReviewUi.js` is a small SAPUI5 helper for turning backend AI suggestion results into safe, user-facing UI text and states.

It does not call an AI provider. It does not save data. It only answers this UI question:

> "Given an AI suggestion result, what should the user see in the Fiori screen?"

IDTS uses this helper first in Smart Assign, where a Tester or PM reviews why a developer may be a good assignee. The same helper can later be reused for duplicate detection, classification suggestion, and bug handoff summary screens.

### Beginner explanation

The backend can return different AI result states:

- success,
- low confidence,
- AI disabled,
- provider error,
- unsafe output,
- timeout.

Without a helper, every UI screen would need to invent its own wording for those states. That is risky because one screen might accidentally show internal words like `provider`, `model`, `prompt`, `SQL`, or `debug`.

This file centralizes that decision. It converts technical backend states into simple Fiori-friendly messages:

- `Ready for review`
- `Review carefully`
- `Suggestion support is currently unavailable`
- `Suggestion could not be prepared`

The user still makes the final decision. The UI must never say that AI has decided the workflow.

### Flow in IDTS

1. A UI feature receives an AI suggestion result from the backend.
2. The UI calls `AiReviewUi.decorateResult(...)`.
3. The helper sanitizes the explanation and maps status/confidence to display fields.
4. The UI binds those display fields to SAPUI5 controls such as text, object status, or message strip.
5. The user reviews the suggestion and acts manually.

### Important source anchors

- **Location**: `INTERNAL_COPY_PATTERN`
  **IDTS concept**: User-facing copy gate for AI suggestion UI.
  **Impact if broken**: Internal implementation terms can leak into product screens and confuse end users.
  **Must check together**: `AGENTS.md` User-Facing UI/UX Copy Gate, `i18n.properties`, and browser UI review evidence.

- **Location**: `numberOrNull(...)`
  **IDTS concept**: Confidence formatting.
  **Impact if broken**: Missing confidence can appear as `0%`, which falsely implies the AI evaluated the suggestion with zero confidence.
  **Must check together**: `scripts/qa/test-idts70-ai-review-ui.js`.

- **Location**: `statusText(...)` and `stateFor(...)`
  **IDTS concept**: Fiori semantic state mapping for suggestion review.
  **Impact if broken**: Users may treat disabled, failed, unsafe, or low-confidence suggestions as normal recommendations.
  **Must check together**: Smart Assign explanation column and SAP Fiori AI/message guidance.

- **Location**: `decorateResult(...)`
  **IDTS concept**: Main UI contract for reviewable AI output.
  **Impact if broken**: Different AI features can show inconsistent status, warning, or review text.
  **Must check together**: `SmartAssignDeveloper.js`, future AI suggestion UI consumers, and IDTS-70 QA evidence.

### Cross-folder impact

- `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`
  uses this helper to decorate Smart Assign candidate explanations.
- `app/bug-management-ui/webapp/i18n/i18n.properties`
  and `i18n_en.properties` provide all user-facing labels returned by this helper.
- `scripts/qa/test-idts70-ai-review-ui.js`
  verifies the helper states and guards against internal/dev-facing UI copy.
- Backend files under `srv/ai/` produce the source statuses; this helper only formats them for UI.

### Safe editing checklist

- Do not add provider, prompt, token, model, SQL, stack trace, credential, or endpoint wording to user-visible copy.
- Keep AI wording advisory: "suggestion", "review", "could not be prepared".
- Do not imply the AI selected, approved, assigned, closed, or changed a bug.
- Missing confidence must stay blank, not become `0%`.
- Rerun `npm run qa:idts70:programmatic` after changing this helper.

## Vietnamese

### File này dùng để làm gì

`AiReviewUi.js` là helper SAPUI5 nhỏ dùng để chuyển kết quả gợi ý AI từ backend thành text và trạng thái hiển thị an toàn cho người dùng.

File này không gọi AI provider. File này không lưu dữ liệu. Nó chỉ trả lời câu hỏi ở tầng UI:

> "Với một kết quả gợi ý AI như vậy, người dùng nên nhìn thấy gì trên màn hình Fiori?"

IDTS dùng helper này trước tiên trong Smart Assign, nơi Tester hoặc PM xem lý do vì sao một developer có thể phù hợp để nhận bug. Sau này cùng helper có thể dùng lại cho duplicate detection, classification suggestion, và bug handoff summary.

### Giải thích cho người mới

Backend có thể trả về nhiều trạng thái AI khác nhau:

- thành công,
- confidence thấp,
- AI đang tắt,
- provider lỗi,
- output không an toàn,
- timeout.

Nếu không có helper chung, mỗi màn hình UI sẽ tự nghĩ ra wording riêng cho các trạng thái đó. Điều này dễ gây lỗi vì một màn hình có thể vô tình hiển thị các từ nội bộ như `provider`, `model`, `prompt`, `SQL`, hoặc `debug`.

File này gom quyết định đó vào một nơi. Nó đổi trạng thái kỹ thuật từ backend thành các thông báo dễ hiểu theo kiểu Fiori:

- `Ready for review`
- `Review carefully`
- `Suggestion support is currently unavailable`
- `Suggestion could not be prepared`

Người dùng vẫn là người quyết định cuối cùng. UI không được nói rằng AI đã quyết định workflow.

### Flow hoạt động trong IDTS

1. Một UI feature nhận kết quả gợi ý AI từ backend.
2. UI gọi `AiReviewUi.decorateResult(...)`.
3. Helper làm sạch explanation và đổi status/confidence thành field hiển thị.
4. UI bind các field đó vào control SAPUI5 như text, object status, hoặc message strip.
5. Người dùng review suggestion và tự thao tác thủ công.

### Important source anchors

- **Vị trí**: `INTERNAL_COPY_PATTERN`
  **Khái niệm IDTS**: Cổng chặn copy nội bộ khi hiển thị AI suggestion.
  **Ảnh hưởng nếu sai**: Các từ kỹ thuật nội bộ có thể lọt lên UI sản phẩm và làm người dùng khó hiểu.
  **Phải kiểm tra cùng**: rule User-Facing UI/UX Copy Gate trong `AGENTS.md`, `i18n.properties`, và evidence review UI bằng browser.

- **Vị trí**: `numberOrNull(...)`
  **Khái niệm IDTS**: Format confidence.
  **Ảnh hưởng nếu sai**: Confidence bị thiếu có thể bị hiển thị thành `0%`, làm người dùng hiểu nhầm rằng AI đã đánh giá suggestion với mức tin cậy bằng không.
  **Phải kiểm tra cùng**: `scripts/qa/test-idts70-ai-review-ui.js`.

- **Vị trí**: `statusText(...)` và `stateFor(...)`
  **Khái niệm IDTS**: Mapping trạng thái semantic theo Fiori cho AI suggestion.
  **Ảnh hưởng nếu sai**: User có thể xem suggestion bị tắt, lỗi, không an toàn, hoặc confidence thấp như một recommendation bình thường.
  **Phải kiểm tra cùng**: cột explanation của Smart Assign và guideline SAP Fiori cho AI/message.

- **Vị trí**: `decorateResult(...)`
  **Khái niệm IDTS**: Contract UI chính cho AI output có thể review.
  **Ảnh hưởng nếu sai**: Các AI feature khác nhau có thể hiển thị status, warning, hoặc text review không nhất quán.
  **Phải kiểm tra cùng**: `SmartAssignDeveloper.js`, các UI AI consumer sau này, và evidence IDTS-70.

### Liên kết với file khác

- `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`
  dùng helper này để decorate explanation của candidate trong Smart Assign.
- `app/bug-management-ui/webapp/i18n/i18n.properties`
  và `i18n_en.properties` chứa toàn bộ label hiển thị cho helper này.
- `scripts/qa/test-idts70-ai-review-ui.js`
  kiểm tra các trạng thái của helper và chặn copy nội bộ/dev-facing trên UI.
- Các file backend trong `srv/ai/` tạo ra status nguồn; helper này chỉ format chúng cho UI.

### Checklist sửa file an toàn

- Không thêm chữ provider, prompt, token, model, SQL, stack trace, credential, hoặc endpoint vào copy user nhìn thấy.
- Giữ wording AI ở mức tư vấn: "suggestion", "review", "could not be prepared".
- Không viết như thể AI đã chọn, approve, assign, close, hoặc thay đổi bug.
- Confidence bị thiếu phải để trống, không biến thành `0%`.
- Chạy lại `npm run qa:idts70:programmatic` sau khi sửa helper này.
