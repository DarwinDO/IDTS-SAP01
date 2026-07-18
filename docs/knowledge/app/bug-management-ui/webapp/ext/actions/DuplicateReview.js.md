# Knowledge: `app/bug-management-ui/webapp/ext/actions/DuplicateReview.js`

> **Ownership / debug anchor:** DatDT owns similar-bug presentation (backup: DonHV). A no-result or unavailable response is safe and must not mutate bug workflow.
> **Ownership / điểm debug:** DatDT sở hữu phần hiển thị bug tương tự (backup: DonHV). No-result hoặc unavailable là an toàn và không được làm đổi workflow bug.

## English

### What this file is for

This file adds the user-visible review dialog for duplicate or similar bug suggestions on the Bug Object Page.

It does not create duplicate links, change the bug status, assign work, or save any user decision. Its only job is to call the existing backend action `BugService.suggestSimilarBugs`, show the returned candidates in a SAPUI5 dialog, and remind the user that the final decision is manual.

This is the IDTS-74 UI layer for the backend capability delivered in IDTS-66.

### Beginner explanation

The backend already knows how to compare the current bug with other bugs and return possible matches. Before IDTS-74, that capability was only visible through API/programmatic evidence. A tester or PM could not open the normal Fiori app and see the result directly.

This file bridges that gap. When the user presses `Find Similar Bugs`, the UI reads the current Bug binding context, calls `/suggestSimilarBugs(...)`, and displays a small table with the candidate bug number, title, status, match score, relation type, and reason.

The important rule is that this is a review surface, not an automation surface. The user still decides what to do next.

### Flow inside IDTS

1. `SmartAssignmentSection.fragment.xml` renders the `Find Similar Bugs` button in the Object Page Assignment section.
2. Pressing the button calls `DuplicateReview.openDialog`.
3. `DuplicateReview.js` finds the current Bug binding context from the SAPUI5 control tree.
4. It requests missing Bug properties that Fiori may not have loaded yet.
5. It invokes the existing OData V4 action `/suggestSimilarBugs(...)` as a direct user-triggered request.
6. It maps each returned row through `AiReviewUi.decorateResult` so confidence/status wording stays consistent with other AI suggestion UI.
7. It shows candidates in a `sap.m.Dialog` with a responsive `sap.m.Table`.
8. Closing the dialog changes nothing in the database.

### Important source anchors

- **Location**: `openDialog(...)`
  **IDTS concept**: Entry point from the Object Page button.
  **Impact if broken**: Users cannot open duplicate/similar review evidence from the product UI, leaving IDTS-72 visual acceptance incomplete.
  **Must check together**: `SmartAssignmentSection.fragment.xml`, `manifest.json`, and browser/object-page smoke.

- **Location**: `readSimilarBugs(...)`
  **IDTS concept**: Reuses the existing CAP action `suggestSimilarBugs`; no new backend API is introduced.
  **Impact if broken**: The UI may call the wrong action, fail silently, or stop showing backend-verified duplicate suggestions.
  **Must check together**: `srv/service.cds`, `srv/ai/duplicate-detection.js`, and `scripts/qa/test-idts66-duplicate-detection.js`.

- **Location**: `enrichCandidate(...)`
  **IDTS concept**: Converts backend candidate rows into safe user-facing review rows.
  **Impact if broken**: Match score, reason, or status can become confusing or expose technical wording.
  **Must check together**: `AiReviewUi.js`, `i18n.properties`, and `i18n_en.properties`.

- **Location**: `buildDialog(...)`
  **IDTS concept**: Shows suggestions as a temporary review dialog, not a new workflow page.
  **Impact if broken**: The UI can become too heavy, look inconsistent with Fiori, or imply that the system has already confirmed a duplicate.
  **Must check together**: SAP Fiori dialog/table guidance and `scripts/qa/test-idts74-duplicate-review-ui.js`.

### Cross-folder impact

- `srv/service.cds` defines the `suggestSimilarBugs` action and return type.
- `srv/ai/duplicate-detection.js` owns the ranking, fallback, and audit behavior.
- `app/bug-management-ui/webapp/ext/ai/AiReviewUi.js` owns reusable suggestion status/copy mapping.
- `app/bug-management-ui/webapp/ext/fragment/SmartAssignmentSection.fragment.xml` owns the button that opens this dialog.
- `scripts/qa/test-idts74-duplicate-review-ui.js` verifies that the UI calls the correct existing action and avoids internal/developer-facing copy.

### Safe editing checklist

- Do not make this dialog confirm duplicates automatically.
- Do not write `DuplicateLinks` from the UI.
- Do not add a new backend endpoint unless `suggestSimilarBugs` no longer covers the flow.
- Keep all user-facing text in i18n files.
- Keep internal words such as provider, token, prompt, stack, SQL, credential, or endpoint out of visible UI copy.
- Run `npm run qa:idts74:programmatic` after changes.

## Vietnamese

### File này dùng để làm gì

File này thêm dialog review bug trùng hoặc bug tương tự trên Bug Object Page.

Nó không tạo duplicate link, không đổi status của bug, không assign việc, và không lưu quyết định của user. Nhiệm vụ duy nhất của nó là gọi backend action đã có sẵn `BugService.suggestSimilarBugs`, hiển thị các candidate trả về trong một dialog SAPUI5, và nhắc user rằng quyết định cuối cùng vẫn là thủ công.

Đây là lớp UI của IDTS-74 cho capability backend đã làm ở IDTS-66.

### Giải thích cho người mới

Backend đã biết cách so sánh bug hiện tại với các bug khác và trả về các bug có khả năng giống nhau. Trước IDTS-74, khả năng này chỉ được chứng minh bằng API/programmatic evidence. Tester hoặc PM chưa thể mở app Fiori bình thường để xem kết quả trực tiếp.

File này nối khoảng trống đó. Khi user bấm `Find Similar Bugs`, UI đọc binding context của bug hiện tại, gọi `/suggestSimilarBugs(...)`, rồi hiển thị một bảng nhỏ gồm bug number, title, status, match score, relation type và reason.

Quy tắc quan trọng là đây chỉ là màn hình review, không phải automation. User vẫn tự quyết định bước tiếp theo.

### Flow trong IDTS

1. `SmartAssignmentSection.fragment.xml` render nút `Find Similar Bugs` trong section Assignment của Object Page.
2. Khi bấm nút, Fiori gọi `DuplicateReview.openDialog`.
3. `DuplicateReview.js` tìm Bug binding context hiện tại từ cây control SAPUI5.
4. Nó request thêm các field Bug mà Fiori có thể chưa load.
5. Nó gọi trực tiếp OData V4 action đã có `/suggestSimilarBugs(...)` khi user bấm nút.
6. Nó map từng row trả về qua `AiReviewUi.decorateResult` để wording confidence/status thống nhất với các UI suggestion khác.
7. Nó hiển thị candidate bằng `sap.m.Dialog` và `sap.m.Table` responsive.
8. Đóng dialog không làm thay đổi dữ liệu trong database.

### Anchor quan trọng

- **Vị trí**: `openDialog(...)`
  **Khái niệm IDTS**: Entry point từ button trên Object Page.
  **Ảnh hưởng nếu sai**: User không mở được duplicate/similar review từ UI sản phẩm, khiến visual acceptance của IDTS-72 vẫn thiếu.
  **Phải kiểm tra cùng**: `SmartAssignmentSection.fragment.xml`, `manifest.json`, và browser/object-page smoke.

- **Vị trí**: `readSimilarBugs(...)`
  **Khái niệm IDTS**: Tái sử dụng CAP action `suggestSimilarBugs`; không thêm backend API mới.
  **Ảnh hưởng nếu sai**: UI có thể gọi sai action, fail im lặng, hoặc không còn hiển thị suggestion duplicate đã được backend verify.
  **Phải kiểm tra cùng**: `srv/service.cds`, `srv/ai/duplicate-detection.js`, và `scripts/qa/test-idts66-duplicate-detection.js`.

- **Vị trí**: `enrichCandidate(...)`
  **Khái niệm IDTS**: Chuyển candidate backend thành row review an toàn, dễ hiểu cho user.
  **Ảnh hưởng nếu sai**: Match score, reason hoặc status có thể khó hiểu hoặc lộ wording kỹ thuật.
  **Phải kiểm tra cùng**: `AiReviewUi.js`, `i18n.properties`, và `i18n_en.properties`.

- **Vị trí**: `buildDialog(...)`
  **Khái niệm IDTS**: Hiển thị suggestion trong dialog review tạm thời, không tạo thêm workflow page.
  **Ảnh hưởng nếu sai**: UI có thể trở nên quá nặng, lệch Fiori, hoặc làm user hiểu nhầm rằng hệ thống đã xác nhận duplicate.
  **Phải kiểm tra cùng**: guideline SAP Fiori cho dialog/table và `scripts/qa/test-idts74-duplicate-review-ui.js`.

### Liên kết với folder/file khác

- `srv/service.cds` khai báo action `suggestSimilarBugs` và return type.
- `srv/ai/duplicate-detection.js` xử lý ranking, fallback và audit.
- `app/bug-management-ui/webapp/ext/ai/AiReviewUi.js` xử lý mapping status/copy chung cho suggestion UI.
- `app/bug-management-ui/webapp/ext/fragment/SmartAssignmentSection.fragment.xml` chứa button mở dialog này.
- `scripts/qa/test-idts74-duplicate-review-ui.js` kiểm tra UI gọi đúng action đã có và không đưa copy nội bộ/dev-facing lên UI.

### Checklist sửa an toàn

- Không để dialog này tự xác nhận duplicate.
- Không ghi `DuplicateLinks` từ UI.
- Không thêm endpoint backend mới nếu `suggestSimilarBugs` vẫn đủ dùng.
- Mọi text user-facing phải nằm trong i18n.
- Không đưa các từ nội bộ như provider, token, prompt, stack, SQL, credential hoặc endpoint vào UI.
- Chạy `npm run qa:idts74:programmatic` sau khi sửa.

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/actions/DuplicateReview.js`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/actions/DuplicateReview.js.md`
- Source layer: `app`
- Last reviewed: 2026-07-09

## Detailed request lifecycle / Vòng đời request chi tiết (2026-07-18)

**English.** Bug Summary button → `openDialog()` → root context discovery → `requestMissingBugProperties()` → `readSimilarBugs()` invokes `findSimilarBugs(...)` → backend embedding/similarity service returns candidates → `enrichCandidate()` sanitizes and decorates each row → `buildDialog()` displays review evidence. Watch source Bug text/ID, candidate IDs/scores, provider status, and row count. Empty/unavailable results must leave the Bug unchanged; this module never creates `DuplicateLinks`.

**Tiếng Việt.** Nút trong Bug Summary → `openDialog()` → tìm root context → `requestMissingBugProperties()` → `readSimilarBugs()` invoke `findSimilarBugs(...)` → backend embedding/similarity trả candidate → `enrichCandidate()` sanitize/decorate từng row → `buildDialog()` hiển thị evidence để review. Quan sát text/ID Bug nguồn, candidate ID/score, provider status và số row. Kết quả rỗng/unavailable phải giữ Bug nguyên; module không bao giờ tạo `DuplicateLinks`.
