# Knowledge: `app/bug-management-ui/webapp/ext/fragment/ClassificationReviewField.fragment.xml`

## IDTS-115 create-draft guard

The complete custom field is hidden for a root create draft and remains visible for an active Bug or an edit draft that has an active source. The action also repeats this check in JavaScript so an out-of-band trigger cannot call source-linked AI for a transient draft ID.

Vietnamese: Toàn bộ custom field bị ẩn trên root create draft, nhưng vẫn hiện với Bug active hoặc edit draft có active source. JavaScript kiểm lại để trigger ngoài UI cũng không gửi transient draft ID.

> **Ownership / debug anchor:** DatDT owns this Classification field extension (backup: SangVN). The button opens review UI in the existing business section; it is not a new workflow action.
> **Ownership / điểm debug:** DatDT sở hữu field extension Classification này (backup: SangVN). Nút mở review UI trong business section có sẵn, không phải workflow action mới.

## English

### What this file is for

This UI5 fragment places **Review Classification Suggestions** inside the Classification form, directly after Defect Category. It helps users review suggestions while looking at the values they will decide themselves.

### Beginner explanation

Classification means describing a bug with SAP Module, Application Component, and Defect Category. A suggestion is useful only next to those choices. This fragment avoids a separate AI area and keeps the action in the same form where the user selects or checks the final values.

The Fiori form supplies the short label **Classification suggestions**. The action opens a dialog; it does not write suggested values to the database. The user remains responsible for accepting, changing, or ignoring the suggestion.

### Flow in IDTS

1. `manifest.json` adds this fragment after Defect Category in `FieldGroup#Classification`.
2. The user selects **Review Classification Suggestions**.
3. `ClassificationReview.js` sends the current bug details to `BugService.suggestClassification`.
4. The dialog shows current values and safe suggestions for human review.

### Important source anchors

- **Location:** `Toolbar` with `ClassificationReview.openDialog`.
  **IDTS concept:** Classification help must remain beside classification fields, not in an independent process step.
  **Impact if broken:** Users can confuse a suggestion with an automatically approved classification.
  **Must check together:** `manifest.json`, `ClassificationReview.js`, `srv/service.cds`, and `scripts/qa/test-idts75-classification-review-ui.js`.

### Cross-folder impact

- `manifest.json` injects this field into the existing Fiori form.
- `app/bug-management-ui/annotations/object-page.cds` defines the Classification field group that hosts it.
- `srv/service.cds` exposes `suggestClassification`; its backend implementation validates and prepares safe results.

### Safe editing checklist

- Keep it immediately after Defect Category unless the classification form changes.
- Do not add automatic apply behavior without a separately approved workflow and backend validation.
- Keep the action in i18n and use UI5 controls only.
- Run focused IDTS-75 and IDTS-77 checks after a change.

## Vietnamese

### File này dùng để làm gì

Fragment UI5 này đặt **Review Classification Suggestions** bên trong form Classification, ngay sau Defect Category. Nó giúp user xem gợi ý trong lúc đang nhìn các giá trị classification mà mình sẽ tự quyết định.

### Giải thích cho người mới

Classification là việc mô tả bug bằng SAP Module, Application Component và Defect Category. Gợi ý chỉ có ích khi nằm cạnh các lựa chọn này. Fragment này tránh tạo một khu AI riêng và giữ action trong đúng form nơi user chọn hoặc kiểm tra giá trị cuối.

Form Fiori cung cấp label ngắn **Classification suggestions**. Action mở dialog; nó không ghi giá trị gợi ý vào database. User vẫn chịu trách nhiệm chấp nhận, thay đổi hoặc bỏ qua gợi ý.

### Flow hoạt động trong IDTS

1. `manifest.json` chèn fragment này sau Defect Category trong `FieldGroup#Classification`.
2. User bấm **Review Classification Suggestions**.
3. `ClassificationReview.js` gửi chi tiết bug hiện tại đến `BugService.suggestClassification`.
4. Dialog hiển thị giá trị hiện tại và các gợi ý an toàn để con người review.

### Các điểm neo quan trọng trong source

- **Vị trí:** `Toolbar` có `ClassificationReview.openDialog`.
  **Khái niệm IDTS:** Công cụ hỗ trợ classification phải nằm cạnh field classification, không phải là một bước quy trình độc lập.
  **Ảnh hưởng nếu sai:** User có thể hiểu nhầm gợi ý là classification đã được duyệt tự động.
  **Phải kiểm tra cùng:** `manifest.json`, `ClassificationReview.js`, `srv/service.cds`, và `scripts/qa/test-idts75-classification-review-ui.js`.

### Liên kết với file/folder khác

- `manifest.json` chèn field này vào form Fiori hiện có.
- `app/bug-management-ui/annotations/object-page.cds` định nghĩa field group Classification chứa fragment này.
- `srv/service.cds` expose `suggestClassification`; implementation phía backend validate và chuẩn bị kết quả an toàn.

### Checklist sửa an toàn

- Giữ nó ngay sau Defect Category trừ khi form Classification thay đổi.
- Không thêm hành vi tự apply nếu chưa có workflow được duyệt riêng và backend validation.
- Giữ action trong i18n và chỉ dùng UI5 control.
- Sau khi sửa, chạy focused check IDTS-75 và IDTS-77.

## Binding walkthrough / Walkthrough binding (2026-07-18)

**English.** The Classification annotation inserts this fragment into the existing Classification field group. `core:require` loads `ClassificationReview.js`; `press="ClassificationReview.openDialog"` transfers the button event and current control tree to that module. `SmartAssignmentSection` is a visual row wrapper only. If the button is absent, inspect annotation/fragment loading; if press does nothing, break in `openDialog()`.

**Tiếng Việt.** Annotation Classification chèn fragment vào field group Classification đang có. `core:require` nạp `ClassificationReview.js`; `press="ClassificationReview.openDialog"` chuyển event và control tree hiện tại sang module đó. `SmartAssignmentSection` chỉ là wrapper bố cục. Nút không hiện thì kiểm annotation/fragment; nút hiện nhưng bấm không chạy thì breakpoint ở `openDialog()`.
