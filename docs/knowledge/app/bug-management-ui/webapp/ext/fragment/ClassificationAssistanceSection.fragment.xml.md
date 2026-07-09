# Knowledge: `app/bug-management-ui/webapp/ext/fragment/ClassificationAssistanceSection.fragment.xml`

## English

### What this file is for

This fragment renders the `Classification Assistance` Object Page section and its `Review Classification Suggestions` button.

### Beginner explanation

A Fiori Elements Object Page is mostly generated from CDS annotations. When IDTS needs a small interaction that annotations do not provide directly, the manifest can insert a custom XML fragment.

This fragment is that small insertion point. It does not contain AI logic. It only shows a short user-facing hint and routes the button press to `ClassificationReview.openDialog`.

### Flow inside IDTS

1. `manifest.json` inserts this fragment after the standard Classification and Planning section.
2. `SmartAssignmentSection` propagates the nearest Bug binding context into the custom section.
3. The button loads `ClassificationReview.js` through `core:require`.
4. Pressing the button opens the review-only classification dialog.

### Important source anchors

- **Location**: root `section:SmartAssignmentSection`
  **IDTS concept**: Gives the custom fragment the current Bug context without reading DOM or private Fiori control IDs.
  **Impact if broken**: The action cannot determine which Bug is being reviewed.
  **Must check together**: `SmartAssignmentSection.js`, Object Page browser smoke, and manifest section placement.

- **Location**: button `core:require`
  **IDTS concept**: Loads the action as an asynchronous UI5 module.
  **Impact if broken**: The button may render but fail when pressed.
  **Must check together**: `ClassificationReview.js`, UI5 linter, and UI5 build.

### Cross-folder impact

- `manifest.json` owns where this section appears.
- `ClassificationReview.js` owns dialog behavior.
- `srv/service.cds` and `srv/ai/classification-suggestion.js` own the actual suggestions.
- `scripts/qa/test-idts75-classification-review-browser.js` proves the section works with a real Object Page binding.

### Safe editing checklist

- Keep this fragment small; business logic belongs in the action module or CAP backend.
- Keep all visible copy in i18n.
- Do not add raw HTML/CSS.
- Do not use framework-internal control IDs or DOM traversal.

## Vietnamese

### File này dùng để làm gì

Fragment này render section `Classification Assistance` trên Object Page và nút `Review Classification Suggestions`.

### Giải thích cho người mới

Fiori Elements Object Page chủ yếu được generate từ CDS annotation. Khi IDTS cần một tương tác nhỏ mà annotation không cung cấp trực tiếp, manifest có thể chèn một XML fragment custom.

Fragment này là điểm chèn nhỏ đó. Nó không chứa logic AI. Nó chỉ hiển thị một câu hướng dẫn cho user và chuyển sự kiện nhấn nút sang `ClassificationReview.openDialog`.

### Flow trong IDTS

1. `manifest.json` chèn fragment này sau section Classification and Planning chuẩn.
2. `SmartAssignmentSection` truyền Bug binding context gần nhất vào custom section.
3. Button load `ClassificationReview.js` qua `core:require`.
4. Khi nhấn, app mở dialog review classification và không tự ghi dữ liệu.

### Anchor quan trọng

- **Vị trí**: root `section:SmartAssignmentSection`
  **Khái niệm IDTS**: Cho custom fragment nhận Bug context mà không đọc DOM hoặc private control ID của Fiori.
  **Ảnh hưởng nếu sai**: Action không biết user đang review Bug nào.
  **Phải kiểm tra cùng**: `SmartAssignmentSection.js`, browser smoke Object Page và vị trí section trong manifest.

- **Vị trí**: button `core:require`
  **Khái niệm IDTS**: Load action dưới dạng UI5 module bất đồng bộ.
  **Ảnh hưởng nếu sai**: Button có thể hiện nhưng bấm không chạy.
  **Phải kiểm tra cùng**: `ClassificationReview.js`, UI5 linter và UI5 build.

### Liên kết với folder/file khác

- `manifest.json` quyết định section nằm ở đâu.
- `ClassificationReview.js` xử lý dialog.
- `srv/service.cds` và `srv/ai/classification-suggestion.js` xử lý suggestion thật.
- `scripts/qa/test-idts75-classification-review-browser.js` chứng minh section chạy với Object Page binding thật.

### Checklist sửa an toàn

- Giữ fragment nhỏ; business logic phải nằm trong action module hoặc CAP backend.
- Mọi copy hiển thị phải nằm trong i18n.
- Không thêm raw HTML/CSS.
- Không dùng private control ID hoặc DOM traversal của framework.

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/fragment/ClassificationAssistanceSection.fragment.xml`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/fragment/ClassificationAssistanceSection.fragment.xml.md`
- Source layer: `app`
- Last reviewed: 2026-07-09
