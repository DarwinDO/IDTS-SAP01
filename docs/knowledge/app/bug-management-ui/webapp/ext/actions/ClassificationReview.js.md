# Knowledge: `app/bug-management-ui/webapp/ext/actions/ClassificationReview.js`

## English

### What this file is for

This file opens the user-visible classification suggestion dialog on the Bug Object Page.

It calls the existing CAP action `BugService.suggestClassification`, then shows the current and suggested SAP Module, Application Component, Defect Category, Priority, and Severity values. It does not write any value back to the Bug.

### Beginner explanation

The backend from IDTS-67 already knows how to prepare classification suggestions and validate them against active IDTS catalogs. Before IDTS-75, those results could only be seen through API tests.

This file connects that backend capability to the Fiori screen. The dialog lets a person compare:

- the value currently stored on the Bug;
- the value suggested by the backend;
- the confidence and review status;
- a short, safe reason.

The dialog has only a Close action. This is deliberate: AI may help a person review classification, but it cannot silently change business data.

### Flow inside IDTS

1. `ClassificationAssistanceSection.fragment.xml` renders the review button.
2. `openDialog(...)` finds the current Bug OData binding context.
3. `readBugData(...)` reads Bug text, current classification IDs/codes, and readable catalog names.
4. `readClassificationSuggestions(...)` invokes `/suggestClassification(...)`.
5. Persisted bugs send `sourceBugID`; a new unsaved Bug sends its entered fields without pretending that an active Bug already exists.
6. `enrichSuggestion(...)` converts backend rows into safe current/suggested/review columns.
7. `buildDialog(...)` renders the rows with SAPUI5 `Dialog`, `Table`, and `ObjectStatus`.
8. Closing the dialog performs no Save, PATCH, status transition, or classification update.

### Important source anchors

- **Location**: `readBugData(...)`
  **IDTS concept**: Collects the minimum current Bug context needed for a useful comparison.
  **Impact if broken**: Current values may appear missing or the backend may receive incomplete classification context.
  **Must check together**: `db/schema.cds`, `srv/service.cds`, Object Page annotations, and the IDTS-75 browser test.

- **Location**: `readClassificationSuggestions(...)`
  **IDTS concept**: Reuses the existing IDTS-67 action instead of creating a second AI endpoint.
  **Impact if broken**: The UI may stop matching backend catalog validation or may fail for new Bug drafts.
  **Must check together**: `srv/ai/classification-suggestion.js`, `scripts/qa/test-idts67-classification-suggestion.js`, and OData metadata.

- **Location**: `statusText(...)` and `stateFor(...)`
  **IDTS concept**: Makes valid, low-confidence, invalid, unavailable, and no-suggestion results visually distinct.
  **Impact if broken**: A user could mistake an invalid or uncertain suggestion for an approved classification.
  **Must check together**: i18n keys, `AiReviewUi.js`, and guarded-state browser evidence.

- **Location**: `buildDialog(...)`
  **IDTS concept**: Presents comparison evidence without applying it.
  **Impact if broken**: The UI may imply autonomous AI behavior or expose internal diagnostics.
  **Must check together**: SAP Fiori dialog/table guidance, failure-state evidence, and the UI copy gate.

### Cross-folder impact

- `srv/service.cds` defines `suggestClassification` and `ClassificationSuggestionCandidate`.
- `srv/ai/classification-suggestion.js` owns catalog validation, safe fallback, audit, and no-mutation behavior.
- `db/schema.cds` defines the Bug classification associations and code-list fields.
- `app/bug-management-ui/webapp/ext/ai/AiReviewUi.js` supplies reusable safe reason and human-review wording.
- `scripts/qa/test-idts67-classification-suggestion.js` verifies backend invalid/inactive/low-confidence handling.
- `scripts/qa/test-idts75-classification-review-browser.js` verifies the actual product UI and no-mutation behavior.

### Safe editing checklist

- Do not add automatic apply behavior without a separate business decision and backend-authorized flow.
- Do not bypass CAP catalog validation.
- Do not display raw provider status, raw prompts, stack traces, SQL, credentials, or endpoints.
- Keep user-facing text in both i18n files.
- Keep new-Bug draft support separate from persisted `sourceBugID` handling.
- Run IDTS-67, IDTS-75, and IDTS-72 verification after changes.

## Vietnamese

### File này dùng để làm gì

File này mở dialog gợi ý phân loại mà user nhìn thấy trên Bug Object Page.

Nó gọi CAP action có sẵn `BugService.suggestClassification`, sau đó hiển thị giá trị hiện tại và giá trị được gợi ý cho SAP Module, Application Component, Defect Category, Priority và Severity. File này không ghi ngược bất kỳ giá trị nào vào Bug.

### Giải thích cho người mới

Backend từ IDTS-67 đã biết cách tạo gợi ý phân loại và kiểm tra gợi ý đó có nằm trong catalog IDTS đang active hay không. Trước IDTS-75, kết quả này chỉ nhìn thấy qua API test.

File này nối capability backend đó vào màn hình Fiori. Dialog giúp người dùng so sánh:

- giá trị đang lưu trên Bug;
- giá trị backend gợi ý;
- confidence và trạng thái cần review;
- một lý do ngắn, an toàn.

Dialog chỉ có nút Close. Đây là chủ ý: AI hỗ trợ người dùng review, nhưng không được âm thầm đổi dữ liệu nghiệp vụ.

### Flow trong IDTS

1. `ClassificationAssistanceSection.fragment.xml` render nút mở review.
2. `openDialog(...)` tìm OData binding context của Bug hiện tại.
3. `readBugData(...)` đọc nội dung Bug, classification ID/code hiện tại và tên catalog dễ hiểu.
4. `readClassificationSuggestions(...)` gọi `/suggestClassification(...)`.
5. Bug đã lưu gửi `sourceBugID`; Bug mới chưa lưu gửi các field user đã nhập và không giả vờ rằng active Bug đã tồn tại.
6. `enrichSuggestion(...)` chuyển row backend thành các cột current/suggested/review an toàn.
7. `buildDialog(...)` render bằng SAPUI5 `Dialog`, `Table` và `ObjectStatus`.
8. Đóng dialog không Save, không PATCH, không đổi status và không đổi classification.

### Anchor quan trọng

- **Vị trí**: `readBugData(...)`
  **Khái niệm IDTS**: Thu thập context tối thiểu của Bug để so sánh có ý nghĩa.
  **Ảnh hưởng nếu sai**: Giá trị hiện tại có thể bị trống hoặc backend nhận thiếu context phân loại.
  **Phải kiểm tra cùng**: `db/schema.cds`, `srv/service.cds`, annotation Object Page và browser test IDTS-75.

- **Vị trí**: `readClassificationSuggestions(...)`
  **Khái niệm IDTS**: Tái sử dụng action IDTS-67 thay vì tạo AI endpoint thứ hai.
  **Ảnh hưởng nếu sai**: UI có thể lệch validation catalog của backend hoặc fail với draft Bug mới.
  **Phải kiểm tra cùng**: `srv/ai/classification-suggestion.js`, `scripts/qa/test-idts67-classification-suggestion.js` và OData metadata.

- **Vị trí**: `statusText(...)` và `stateFor(...)`
  **Khái niệm IDTS**: Phân biệt rõ gợi ý hợp lệ, confidence thấp, giá trị không hợp lệ, không khả dụng và không có gợi ý.
  **Ảnh hưởng nếu sai**: User có thể hiểu nhầm gợi ý không hợp lệ hoặc chưa chắc chắn là classification đã được duyệt.
  **Phải kiểm tra cùng**: i18n keys, `AiReviewUi.js` và browser evidence guarded states.

- **Vị trí**: `buildDialog(...)`
  **Khái niệm IDTS**: Hiển thị bằng chứng so sánh mà không tự áp dụng.
  **Ảnh hưởng nếu sai**: UI có thể làm user tưởng AI tự quyết định hoặc làm lộ diagnostic nội bộ.
  **Phải kiểm tra cùng**: guideline SAP Fiori cho dialog/table, failure evidence và UI copy gate.

### Liên kết với folder/file khác

- `srv/service.cds` khai báo `suggestClassification` và `ClassificationSuggestionCandidate`.
- `srv/ai/classification-suggestion.js` xử lý catalog validation, fallback an toàn, audit và no-mutation.
- `db/schema.cds` định nghĩa association và code-list field dùng để phân loại Bug.
- `app/bug-management-ui/webapp/ext/ai/AiReviewUi.js` cung cấp reason an toàn và wording human-review dùng chung.
- `scripts/qa/test-idts67-classification-suggestion.js` verify xử lý invalid/inactive/low-confidence ở backend.
- `scripts/qa/test-idts75-classification-review-browser.js` verify UI sản phẩm thật và no-mutation.

### Checklist sửa an toàn

- Không thêm auto-apply nếu chưa có business decision riêng và flow backend có authorization.
- Không bypass CAP catalog validation.
- Không hiển thị raw provider status, raw prompt, stack trace, SQL, credential hoặc endpoint.
- Mọi text user-facing phải có trong cả hai file i18n.
- Giữ xử lý draft Bug mới tách biệt với `sourceBugID` của Bug đã persist.
- Chạy verify IDTS-67, IDTS-75 và IDTS-72 sau khi sửa.

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/actions/ClassificationReview.js`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/actions/ClassificationReview.js.md`
- Source layer: `app`
- Last reviewed: 2026-07-09
