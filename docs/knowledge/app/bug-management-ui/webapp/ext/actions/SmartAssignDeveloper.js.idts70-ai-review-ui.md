# `SmartAssignDeveloper.js` - IDTS-70 AI review UI supplemental note

## English

### Why this supplemental note exists

The main Smart Assign mirrors explain the picker and IDTS-69 explanation action. IDTS-70 changes how those AI explanations are displayed so they follow one reusable review pattern.

### What changed

Smart Assign now imports `../ai/AiReviewUi` and uses it to decorate AI explanation rows before binding them into the table.

The visible result is still simple:

- explanation text,
- status such as `Ready for review` or `Review carefully`,
- confidence when available,
- safe fallback when suggestion support is disabled or fails,
- a reminder that the user must review the suggestion manually.

### Beginner explanation

Before this change, Smart Assign owned too much AI-display logic directly. That meant future AI screens could drift and show different wording for the same states.

After this change:

- backend still decides candidate eligibility,
- `explainSmartAssignment(...)` still returns AI explanation data,
- `AiReviewUi` converts that data into safe UI fields,
- Smart Assign only displays those fields and keeps the manual selection flow.

### Important source anchors

- **Location**: dependency import `../ai/AiReviewUi`
  **IDTS concept**: Shared AI suggestion review UI.
  **Impact if broken**: Smart Assign falls back to local or inconsistent AI wording.
  **Must check together**: `AiReviewUi.js`, `i18n.properties`, and `scripts/qa/test-idts70-ai-review-ui.js`.

- **Location**: `getAiText(view)`
  **IDTS concept**: i18n adapter for reusable helper text.
  **Impact if broken**: AI review helper can return raw keys instead of readable product copy.
  **Must check together**: both English i18n bundles and Smart Assign browser review.

- **Location**: `applyAssignmentExplanations(...)`
  **IDTS concept**: Backend AI result is converted into reviewable UI state.
  **Impact if broken**: A failed, disabled, or low-confidence suggestion can be shown as normal.
  **Must check together**: `AiReviewUi.decorateResult(...)`, IDTS-69 backend result shape, and IDTS-56 regression.

- **Location**: `aiDecisionHint` text binding
  **IDTS concept**: Human review remains mandatory.
  **Impact if broken**: Users can think the AI explanation is an automatic decision.
  **Must check together**: SAP Fiori AI guidance and QA Depth Gate UI/UX evidence.

### Cross-folder impact

- `app/bug-management-ui/webapp/ext/ai/AiReviewUi.js` owns the mapping from backend AI states to UI text/state.
- `app/bug-management-ui/webapp/i18n/i18n.properties` and `i18n_en.properties` provide the visible labels.
- `scripts/qa/test-idts56-smart-assign.js` verifies existing Smart Assign behavior still works.
- `scripts/qa/test-idts70-ai-review-ui.js` verifies the new shared AI review UI pattern.

### Safe editing checklist

- Do not reintroduce AI status wording directly in Smart Assign unless it is truly Smart Assign-specific.
- Do not show internal provider/model/debug terms.
- Do not auto-select the developer based on an AI explanation.
- Keep backend assignment validation as the final authority.
- Rerun `npm run qa:idts70:programmatic` and `npm run qa:idts56:programmatic`.

## Vietnamese

### Vì sao có note bổ sung này

Các mirror chính của Smart Assign đã giải thích picker và action explanation của IDTS-69. IDTS-70 thay đổi cách hiển thị explanation đó để đi theo một pattern review dùng chung.

### Đã thay đổi gì

Smart Assign bây giờ import `../ai/AiReviewUi` và dùng helper này để decorate các dòng AI explanation trước khi bind vào table.

Kết quả người dùng nhìn thấy vẫn đơn giản:

- nội dung explanation,
- trạng thái như `Ready for review` hoặc `Review carefully`,
- confidence nếu có,
- fallback an toàn khi suggestion support bị tắt hoặc lỗi,
- lời nhắc rằng người dùng phải tự review suggestion.

### Giải thích cho người mới

Trước thay đổi này, Smart Assign tự giữ quá nhiều logic hiển thị AI. Nếu các màn hình AI sau này tự làm riêng, wording có thể bị lệch nhau cho cùng một trạng thái.

Sau thay đổi này:

- backend vẫn quyết định candidate có hợp lệ hay không,
- `explainSmartAssignment(...)` vẫn trả dữ liệu AI explanation,
- `AiReviewUi` đổi dữ liệu đó thành field UI an toàn,
- Smart Assign chỉ hiển thị các field đó và giữ luồng chọn developer thủ công.

### Important source anchors

- **Vị trí**: import dependency `../ai/AiReviewUi`
  **Khái niệm IDTS**: UI review dùng chung cho AI suggestion.
  **Ảnh hưởng nếu sai**: Smart Assign có thể quay lại dùng wording AI riêng và không nhất quán.
  **Phải kiểm tra cùng**: `AiReviewUi.js`, `i18n.properties`, và `scripts/qa/test-idts70-ai-review-ui.js`.

- **Vị trí**: `getAiText(view)`
  **Khái niệm IDTS**: Adapter i18n cho text của helper dùng chung.
  **Ảnh hưởng nếu sai**: Helper AI review có thể trả raw key thay vì copy sản phẩm dễ đọc.
  **Phải kiểm tra cùng**: hai bundle i18n tiếng Anh và browser review Smart Assign.

- **Vị trí**: `applyAssignmentExplanations(...)`
  **Khái niệm IDTS**: Kết quả AI từ backend được đổi thành trạng thái UI có thể review.
  **Ảnh hưởng nếu sai**: Suggestion bị lỗi, bị tắt, hoặc confidence thấp có thể bị hiển thị như bình thường.
  **Phải kiểm tra cùng**: `AiReviewUi.decorateResult(...)`, shape backend của IDTS-69, và regression IDTS-56.

- **Vị trí**: binding text `aiDecisionHint`
  **Khái niệm IDTS**: Human review vẫn bắt buộc.
  **Ảnh hưởng nếu sai**: User có thể hiểu nhầm AI explanation là quyết định tự động.
  **Phải kiểm tra cùng**: SAP Fiori AI guidance và evidence UI/UX của QA Depth Gate.

### Liên kết với file khác

- `app/bug-management-ui/webapp/ext/ai/AiReviewUi.js` giữ mapping từ trạng thái AI backend sang text/state UI.
- `app/bug-management-ui/webapp/i18n/i18n.properties` và `i18n_en.properties` chứa label hiển thị.
- `scripts/qa/test-idts56-smart-assign.js` kiểm tra hành vi Smart Assign hiện có không bị hỏng.
- `scripts/qa/test-idts70-ai-review-ui.js` kiểm tra pattern AI review UI mới.

### Checklist sửa file an toàn

- Không đưa lại wording trạng thái AI trực tiếp vào Smart Assign trừ khi wording đó thật sự chỉ thuộc Smart Assign.
- Không hiển thị provider/model/debug term nội bộ.
- Không tự động chọn developer dựa trên AI explanation.
- Giữ backend assignment validation là lớp quyết định cuối.
- Chạy lại `npm run qa:idts70:programmatic` và `npm run qa:idts56:programmatic`.
