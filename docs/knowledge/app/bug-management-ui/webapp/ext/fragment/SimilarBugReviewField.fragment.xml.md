# Knowledge: `app/bug-management-ui/webapp/ext/fragment/SimilarBugReviewField.fragment.xml`

## IDTS-115 create-draft guard

The wrapper is visible only when `IsActiveEntity` or `HasActiveEntity` is true. A brand-new root draft has neither an active source Bug nor a stable audit target, so the complete label/button row stays hidden. An edit draft of an existing active Bug keeps the action visible.

Vietnamese: Wrapper chỉ hiện khi `IsActiveEntity` hoặc `HasActiveEntity` là true. Root draft mới chưa có Bug active làm nguồn/audit target nên ẩn toàn bộ label/nút; edit draft của Bug active vẫn dùng được.

> **Ownership / debug anchor:** DatDT owns this Bug Summary extension (backup: SangVN). It opens candidate review only and cannot create `DuplicateLinks` by itself.
> **Ownership / điểm debug:** DatDT sở hữu extension Bug Summary này (backup: SangVN). Nó chỉ mở candidate review và không thể tự tạo `DuplicateLinks`.

## English

### What this file is for

This small UI5 fragment places the **Find Similar Bugs** action directly inside the Bug Summary form. It lets a Tester or PM review possible duplicate reports while they are reading the current bug's title and description.

### Beginner explanation

A Fiori Elements Object Page normally builds a form from CDS annotations. The Bug Summary form already contains fields such as Title and Description. Instead of creating a new page section only for AI assistance, this fragment is inserted as one extra row in that existing form.

The Fiori form supplies the short label **Similar bugs**. This fragment supplies the button that opens the existing review dialog. The dialog only shows candidates; it never changes a bug automatically.

### Flow in IDTS

1. `manifest.json` adds this fragment after the Description field in `FieldGroup#GeneralInfo`.
2. The user selects **Find Similar Bugs**.
3. `DuplicateReview.js` reads the current Bug context and calls `BugService.suggestSimilarBugs`.
4. The user reviews the returned candidates and keeps the final decision.

### Important source anchors

- **Location:** `Toolbar` with `DuplicateReview.openDialog`.
  **IDTS concept:** Similar-bug checking belongs to bug information because title and description are the main matching inputs.
  **Impact if broken:** The action can disappear or drift into Assignment, which makes users wrongly connect duplicate checking with choosing a developer.
  **Must check together:** `manifest.json`, `DuplicateReview.js`, `srv/service.cds`, and `scripts/qa/test-idts74-duplicate-review-ui.js`.

### Cross-folder impact

- `app/bug-management-ui/webapp/manifest.json` decides that this is a field inside Bug Summary, not a standalone section.
- `srv/service.cds` defines the `suggestSimilarBugs` service action used by the review dialog.
- `srv/` handles candidate retrieval and authorization; the UI must not become the security gate.

### Safe editing checklist

- Keep all visible wording in i18n files.
- Keep the action as review-only; do not auto-link duplicates from this button.
- Do not wrap it in `SmartAssignmentSection` or add it under Assignment again.
- Run the focused IDTS-74 and IDTS-77 checks after a change.

## Vietnamese

### File này dùng để làm gì

Fragment UI5 nhỏ này đặt action **Find Similar Bugs** trực tiếp bên trong form Bug Summary. Nó giúp Tester hoặc PM xem các bug có khả năng trùng khi đang đọc tiêu đề và mô tả của bug hiện tại.

### Giải thích cho người mới

Object Page của Fiori Elements thường tự tạo form từ annotation CDS. Form Bug Summary vốn đã có các field như Title và Description. Thay vì tạo thêm một section mới chỉ để đặt công cụ AI, fragment này được chèn như một dòng bổ sung ngay trong form có sẵn đó.

Form Fiori cung cấp label ngắn **Similar bugs**. Fragment này cung cấp nút mở dialog review đã có. Dialog chỉ hiển thị các ứng viên có thể trùng; nó không tự thay đổi bug.

### Flow hoạt động trong IDTS

1. `manifest.json` chèn fragment này sau field Description của `FieldGroup#GeneralInfo`.
2. User bấm **Find Similar Bugs**.
3. `DuplicateReview.js` đọc context Bug hiện tại và gọi `BugService.suggestSimilarBugs`.
4. User tự xem các candidate được trả về và giữ quyền quyết định cuối cùng.

### Các điểm neo quan trọng trong source

- **Vị trí:** `Toolbar` có `DuplicateReview.openDialog`.
  **Khái niệm IDTS:** Kiểm tra bug tương tự thuộc về thông tin bug vì Title và Description là dữ liệu chính để so khớp.
  **Ảnh hưởng nếu sai:** Action có thể biến mất hoặc trôi về Assignment, làm user hiểu sai rằng kiểm tra bug trùng là một phần của việc chọn developer.
  **Phải kiểm tra cùng:** `manifest.json`, `DuplicateReview.js`, `srv/service.cds`, và `scripts/qa/test-idts74-duplicate-review-ui.js`.

### Liên kết với file/folder khác

- `app/bug-management-ui/webapp/manifest.json` quyết định đây là field trong Bug Summary, không phải section riêng.
- `srv/service.cds` khai báo action `suggestSimilarBugs` mà dialog review dùng.
- `srv/` xử lý việc lấy candidate và kiểm tra quyền; UI không được là lớp bảo mật cuối cùng.

### Checklist sửa an toàn

- Giữ toàn bộ wording hiển thị cho user trong file i18n.
- Giữ action ở dạng review-only; không tự link duplicate từ nút này.
- Không bọc nó trong `SmartAssignmentSection` hoặc đưa nó lại dưới Assignment.
- Sau khi sửa, chạy focused check IDTS-74 và IDTS-77.

## Binding walkthrough / Walkthrough binding (2026-07-18)

**English.** The Bug Summary annotation inserts this fragment beside summary content. `core:require` loads `DuplicateReview.js`; button press calls `DuplicateReview.openDialog`. The wrapper only aligns explanatory text and action; it does not calculate similarity. Missing button means metadata/fragment placement; failed request means continue from `openDialog()` to `readSimilarBugs()` and the CAP action.

**Tiếng Việt.** Annotation Bug Summary chèn fragment cạnh nội dung summary. `core:require` nạp `DuplicateReview.js`; nhấn nút gọi `DuplicateReview.openDialog`. Wrapper chỉ căn text và action, không tính similarity. Mất nút thì kiểm metadata/vị trí fragment; request lỗi thì trace từ `openDialog()` đến `readSimilarBugs()` rồi CAP action.
