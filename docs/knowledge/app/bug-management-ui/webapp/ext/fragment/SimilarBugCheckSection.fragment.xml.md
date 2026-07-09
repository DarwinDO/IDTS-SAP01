# Knowledge: `app/bug-management-ui/webapp/ext/fragment/SimilarBugCheckSection.fragment.xml`

## English

### What this file is for

This XML fragment renders the thin Object Page section that contains the `Find Similar Bugs` AI review action.

The section is intentionally small: a short user-facing hint on the left and the action button on the right. The real duplicate/similar review behavior still lives in `DuplicateReview.js`.

### Beginner explanation

The `Find Similar Bugs` action helps a user check whether the current bug looks like an existing bug. That concept belongs near the bug summary, because duplicate checking is about the bug report itself, not about the developer assignment.

This fragment only places the button in the right part of the Object Page. It does not decide whether two bugs are duplicates, and it does not save any duplicate link automatically.

### Flow inside IDTS

1. `manifest.json` inserts this fragment as `IdtsSimilarBugCheck` after `BugDetails`.
2. The user opens a Bug Object Page.
3. The user sees the Similar Bug Check row after the bug summary area.
4. The user presses `Find Similar Bugs`.
5. `DuplicateReview.openDialog` opens the review dialog and calls the existing AI/OData flow.

### Important source anchors

- **Location**: `Text text="{i18n>similarBugReviewSectionHint}"`
  **IDTS concept**: Explains why the section exists without exposing AI/provider/internal implementation.
  **Impact if broken**: Users may not understand why they should run the duplicate check.
  **Must check together**: `i18n.properties`, `i18n_en.properties`, and UI copy gate in `AGENTS.md`.

- **Location**: `Button ... text="{i18n>duplicateReviewOpenButton}"`
  **IDTS concept**: Gives the user a clear action to review similar bug candidates.
  **Impact if broken**: The duplicate/similar review capability may exist but become hard to discover.
  **Must check together**: `DuplicateReview.js`, `AiReviewUi.js`, and `scripts/qa/test-idts77-ai-action-placement.js`.

- **Location**: `core:require="{ DuplicateReview: 'idts/bugmanagementui/ext/actions/DuplicateReview' }"`
  **IDTS concept**: Loads the action module only for this fragment.
  **Impact if broken**: The button can render but fail when pressed.
  **Must check together**: `app/bug-management-ui/webapp/ext/actions/DuplicateReview.js`.

### Cross-folder impact

- `manifest.json` owns the section title, template, and placement after `BugDetails`.
- `DuplicateReview.js` owns dialog behavior and the OData action call.
- `srv/service.cds` exposes the backend AI action; this fragment does not change the service contract.
- `docs/project-context.md` defines AI as suggestion-only, so this UI must remain review-only.

### Safe editing checklist

- Keep this section near Bug Summary, not Assignment.
- Do not add technical copy such as provider/model/prompt/debug/API details.
- Do not add automatic duplicate confirmation or writes from this fragment.
- If the button moves, update `manifest.json`, this mirror, and `scripts/qa/test-idts77-ai-action-placement.js`.

## Vietnamese

### File này dùng để làm gì

XML fragment này render section mỏng trên Object Page để chứa action AI `Find Similar Bugs`.

Section này cố ý rất gọn: bên trái là một câu hướng dẫn ngắn cho người dùng, bên phải là nút action. Toàn bộ logic review bug trùng/tương tự vẫn nằm trong `DuplicateReview.js`.

### Giải thích cho người mới

Action `Find Similar Bugs` giúp user kiểm tra bug hiện tại có giống bug đã tồn tại hay không. Ý nghĩa này thuộc về phần bug summary, vì kiểm tra trùng là kiểm tra nội dung bug report, không phải kiểm tra người được assign.

Fragment này chỉ đặt nút vào đúng vị trí trên Object Page. Nó không tự quyết định hai bug có trùng nhau hay không, và cũng không tự lưu duplicate link.

### Flow trong IDTS

1. `manifest.json` chèn fragment này bằng key `IdtsSimilarBugCheck` sau `BugDetails`.
2. User mở Bug Object Page.
3. User thấy dòng Similar Bug Check sau vùng bug summary.
4. User bấm `Find Similar Bugs`.
5. `DuplicateReview.openDialog` mở dialog review và gọi flow AI/OData đã có.

### Anchor quan trọng

- **Vị trí**: `Text text="{i18n>similarBugReviewSectionHint}"`
  **Khái niệm IDTS**: Giải thích vì sao section tồn tại mà không lộ chi tiết provider/model/internal.
  **Ảnh hưởng nếu sai**: User có thể không hiểu vì sao cần chạy duplicate check.
  **Phải kiểm tra cùng**: `i18n.properties`, `i18n_en.properties`, và UI copy gate trong `AGENTS.md`.

- **Vị trí**: `Button ... text="{i18n>duplicateReviewOpenButton}"`
  **Khái niệm IDTS**: Cho user một action rõ ràng để review candidate bug tương tự.
  **Ảnh hưởng nếu sai**: Capability review duplicate/similar vẫn tồn tại nhưng user khó tìm thấy.
  **Phải kiểm tra cùng**: `DuplicateReview.js`, `AiReviewUi.js`, và `scripts/qa/test-idts77-ai-action-placement.js`.

- **Vị trí**: `core:require="{ DuplicateReview: 'idts/bugmanagementui/ext/actions/DuplicateReview' }"`
  **Khái niệm IDTS**: Load module action riêng cho fragment này.
  **Ảnh hưởng nếu sai**: Nút có thể hiện nhưng bấm vào bị lỗi.
  **Phải kiểm tra cùng**: `app/bug-management-ui/webapp/ext/actions/DuplicateReview.js`.

### Liên kết với file/folder khác

- `manifest.json` quản lý title, template và vị trí section sau `BugDetails`.
- `DuplicateReview.js` quản lý dialog và việc gọi OData action.
- `srv/service.cds` expose backend AI action; fragment này không đổi service contract.
- `docs/project-context.md` định nghĩa AI là suggestion-only, nên UI này phải giữ hướng chỉ review.

### Checklist sửa an toàn

- Giữ section này gần Bug Summary, không đưa vào Assignment.
- Không thêm copy kỹ thuật như provider/model/prompt/debug/API details.
- Không thêm logic tự xác nhận duplicate hoặc tự ghi dữ liệu từ fragment này.
- Nếu nút bị chuyển vị trí, cập nhật `manifest.json`, mirror này và `scripts/qa/test-idts77-ai-action-placement.js`.

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/fragment/SimilarBugCheckSection.fragment.xml`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/fragment/SimilarBugCheckSection.fragment.xml.md`

## 2026-07-10 Update: Similar bug review is an action row, not a standalone section

### English

IDTS-78 keeps this fragment but changes its meaning in the Object Page layout. It is no longer presented as a visible section titled `Similar Bug Check`. It is only a thin helper row near Bug Summary, with helper text on the left and the `Find Similar Bugs` button on the right.

Important anchor:

- **Location**: root `section:SmartAssignmentSection` with `DuplicateReview.openDialog`
  **IDTS concept**: Similar-bug review helps the user compare the current bug against existing reports; it is not an assignment area and not a separate workflow section.
  **Impact if broken**: The action can drift back into Assignment or become a standalone section again.
  **Must check together**: `manifest.json` key `IdtsSimilarBugActionRow`, `DuplicateReview.js`, and `scripts/qa/test-idts77-ai-action-placement.js`.

### Vietnamese

IDTS-78 giữ fragment này nhưng đổi ý nghĩa của nó trong layout Object Page. Nó không còn được trình bày như section có tiêu đề `Similar Bug Check`. Nó chỉ là một action row mỏng gần Bug Summary, có helper text bên trái và nút `Find Similar Bugs` bên phải.

Anchor quan trọng:

- **Vị trí**: root `section:SmartAssignmentSection` có `DuplicateReview.openDialog`
  **Khái niệm IDTS**: Review bug tương tự giúp user so sánh bug hiện tại với report đã có; nó không thuộc Assignment và không phải workflow section riêng.
  **Ảnh hưởng nếu sai**: Action có thể trôi ngược về Assignment hoặc lại thành một section riêng.
  **Phải kiểm tra cùng**: `manifest.json` key `IdtsSimilarBugActionRow`, `DuplicateReview.js`, và `scripts/qa/test-idts77-ai-action-placement.js`.
- Source layer: `app`
- Last reviewed: 2026-07-09
