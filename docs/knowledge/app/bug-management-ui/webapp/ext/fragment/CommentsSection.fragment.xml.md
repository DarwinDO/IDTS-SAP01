# Knowledge: `app/bug-management-ui/webapp/ext/fragment/CommentsSection.fragment.xml`

## Selected mention picker (N3 Task 8)

**English:** The comment composer has a visibly labelled native `MultiComboBox` for server-authorized internal recipients. It deliberately does not use `loadItems` because SAPUI5 documents that `MultiComboBox` does not support that inherited event. Typing `@name` in the TextArea remains ordinary comment text.

**Tiếng Việt:** Comment composer có `MultiComboBox` native với label rõ ràng cho recipient nội bộ đã được server authorize. Control cố ý không dùng `loadItems` vì SAPUI5 nêu rõ `MultiComboBox` không hỗ trợ inherited event này. Gõ `@name` trong TextArea vẫn chỉ là text comment thông thường.

## IDTS-122 update

The comment composer and Post action are disabled/hidden for a Closed Bug; the historical comment list remains visible.

## IDTS-116 update — refreshable relative OData binding

The comments feed is relative to the current Bug context. It declares `$$ownRequest: true` so UI5 OData V4 supports `requestRefresh("$direct")` after `addComment` succeeds. Without this parameter, the write can persist while the visible feed remains stale. This is a read-refresh setting only; CAP remains responsible for creating the comment and history event.

Vietnamese: Feed comment bind tương đối theo Bug hiện tại. `$$ownRequest: true` cho phép UI5 đọc lại riêng feed sau khi ghi thành công; nó không thay đổi logic lưu comment ở backend.

> **Ownership / debug anchor:** SangVN owns comments UI (backup: DonHV). Comments require a saved bug key; the create page hides this section so no orphan comment can be created.
> **Ownership / điểm debug:** SangVN sở hữu UI comments (backup: DonHV). Comment cần bug key đã lưu; trang create ẩn section này để không tạo comment mồ côi.

## English

### What this file is for

This XML fragment defines the custom Comments section on the Bug Object Page.

It replaces the older generated comments table with a clearer Fiori-style area:

- a comment input;
- a Post Comment button;
- a feed/list of existing comments.

### Beginner explanation

In Fiori Elements, an XML fragment is a reusable piece of UI inserted into a generated page. The generated Object Page still owns the page shell, header, save behavior, and routing. This fragment only owns the comment area.

The fragment does not call the backend by itself. Its button uses `core:require` to load `BugCollaboration.js`, then calls `Collaboration.onAddComment`.

The comment list binds to the current bug's `comments` navigation property. That means each opened bug automatically shows only its own comments.

### Flow in IDTS

1. User opens a bug.
2. `manifest.json` inserts this fragment as the `IdtsCommentsCustom` Object Page section.
3. The user writes a comment and presses Post Comment.
4. `BugCollaboration.js` calls `BugService.addComment`.
5. The model refreshes and the new comment appears in the feed.

### Important source anchors

- **Location**: `app/bug-management-ui/webapp/ext/fragment/CommentsSection.fragment.xml:18`
  `<TextArea id="idtsCommentTextArea" ... />`
  **IDTS concept**: User-facing input for adding a follow-up note to a bug.
  **Impact if broken**: Users may not be able to write a comment, or the handler may not find the input field.
  **Must check together**: `BugCollaboration.js:onAddComment`, i18n keys `commentsInputLabel` and `commentsInputPlaceholder`, and action `addComment` in `srv/service.cds`.

- **Location**: `app/bug-management-ui/webapp/ext/fragment/CommentsSection.fragment.xml:34`
  `press="Collaboration.onAddComment"`
  **IDTS concept**: Connects the visible Post Comment button to the CAP action that creates the comment.
  **Impact if broken**: The button remains visible but does nothing.
  **Must check together**: `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js` and browser smoke on the Object Page.

- **Location**: `app/bug-management-ui/webapp/ext/fragment/CommentsSection.fragment.xml:51`
  `items="{ path: 'comments', parameters: { $orderby: 'createdAt desc' } }"`
  **IDTS concept**: Shows comments belonging to the currently opened bug, newest first.
  **Impact if broken**: The section may show no comments, stale comments, or comments from the wrong bug.
  **Must check together**: `srv/service.cds` projection `Comments`, `app/bug-management-ui/annotations/history-notifications.cds`, and comment QA scripts.

- **Location**: `app/bug-management-ui/webapp/ext/fragment/CommentsSection.fragment.xml:60`
  `<FeedListItem ... />`
  **IDTS concept**: Presents comments as a readable conversation feed instead of a raw table.
  **Impact if broken**: Manual QA can still see data, but the comment UX becomes harder to read and less Fiori-like.
  **Must check together**: `Comments.authorDisplayName`, `Comments.authorRoleName`, and the formatter functions in `BugCollaboration.js`.

### Cross-folder impact

- `manifest.json` registers this fragment.
- `BugCollaboration.js` handles the Post Comment action.
- `srv/service.cds` exposes `Comments` and the `addComment` action.
- `srv/bug-service/actions.js` writes comment side effects.
- `scripts/qa/test-comments-attachments-programmatic.js` verifies the backend comment path.

### Safe editing checklist

- Do not add internal/developer-facing text to the screen.
- Add every visible string to both i18n files.
- Keep the section disabled or blocked when the bug is not safe for comment changes.
- If the binding path changes, verify the Object Page still shows only comments of the current bug.

## Vietnamese

### File này dùng để làm gì

XML fragment này định nghĩa custom Comments section trên Bug Object Page.

Nó thay phần bảng comment tự sinh cũ bằng khu vực dễ đọc hơn theo hướng Fiori:

- ô nhập comment;
- nút Post Comment;
- feed/list các comment đã có.

### Giải thích cho người mới

Trong Fiori Elements, XML fragment là một mảnh UI được chèn vào page tự sinh. Object Page generated vẫn giữ phần shell, header, save behavior và routing. Fragment này chỉ phụ trách khu vực comment.

Fragment không tự gọi backend. Nút bấm dùng `core:require` để load `BugCollaboration.js`, sau đó gọi `Collaboration.onAddComment`.

Danh sách comment bind vào navigation property `comments` của bug hiện tại. Vì vậy khi mở bug nào thì section chỉ hiện comment của bug đó.

### Flow trong IDTS

1. User mở một bug.
2. `manifest.json` chèn fragment này vào Object Page section `IdtsCommentsCustom`.
3. User nhập comment và bấm Post Comment.
4. `BugCollaboration.js` gọi `BugService.addComment`.
5. Model refresh và comment mới hiện trong feed.

### Các điểm neo quan trọng trong source

- **Vị trí**: `app/bug-management-ui/webapp/ext/fragment/CommentsSection.fragment.xml:18`
  `<TextArea id="idtsCommentTextArea" ... />`
  **Khái niệm IDTS**: Ô nhập note/follow-up cho một bug.
  **Ảnh hưởng nếu sai**: User có thể không nhập được comment, hoặc handler không tìm thấy ô nhập.
  **Phải kiểm tra cùng**: `BugCollaboration.js:onAddComment`, i18n keys `commentsInputLabel`/`commentsInputPlaceholder`, và action `addComment` trong `srv/service.cds`.

- **Vị trí**: `app/bug-management-ui/webapp/ext/fragment/CommentsSection.fragment.xml:34`
  `press="Collaboration.onAddComment"`
  **Khái niệm IDTS**: Nối nút Post Comment trên UI với CAP action tạo comment.
  **Ảnh hưởng nếu sai**: Nút vẫn hiện nhưng bấm không có tác dụng.
  **Phải kiểm tra cùng**: `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js` và browser smoke trên Object Page.

- **Vị trí**: `app/bug-management-ui/webapp/ext/fragment/CommentsSection.fragment.xml:51`
  `items="{ path: 'comments', parameters: { $orderby: 'createdAt desc' } }"`
  **Khái niệm IDTS**: Hiện comment của bug đang mở, mới nhất ở trên.
  **Ảnh hưởng nếu sai**: Section có thể trống, stale, hoặc hiện comment của bug khác.
  **Phải kiểm tra cùng**: projection `Comments` trong `srv/service.cds`, `app/bug-management-ui/annotations/history-notifications.cds`, và comment QA scripts.

- **Vị trí**: `app/bug-management-ui/webapp/ext/fragment/CommentsSection.fragment.xml:60`
  `<FeedListItem ... />`
  **Khái niệm IDTS**: Hiển thị comment như conversation feed dễ đọc, thay vì bảng raw.
  **Ảnh hưởng nếu sai**: QA vẫn có thể thấy data, nhưng UX comment trở nên khó đọc và kém Fiori-like.
  **Phải kiểm tra cùng**: `Comments.authorDisplayName`, `Comments.authorRoleName`, và formatter trong `BugCollaboration.js`.

### Liên kết với file/folder khác

- `manifest.json` đăng ký fragment này.
- `BugCollaboration.js` xử lý hành động Post Comment.
- `srv/service.cds` expose `Comments` và action `addComment`.
- `srv/bug-service/actions.js` ghi side effect comment.
- `scripts/qa/test-comments-attachments-programmatic.js` verify backend comment path.

### Checklist sửa an toàn

- Không đưa text nội bộ/dev-facing lên màn hình.
- Text nào hiện lên UI phải thêm vào cả hai file i18n.
- Giữ section bị disable hoặc bị chặn khi bug chưa ở trạng thái an toàn để thêm comment.
- Nếu đổi binding path, phải verify Object Page vẫn chỉ hiện comment của bug hiện tại.

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/fragment/CommentsSection.fragment.xml`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/fragment/CommentsSection.fragment.xml.md`
- Source layer: `app`
- Last reviewed: 2026-07-04

## IDTS-55 runtime fix notes

### English

This fragment now uses `BugCollaborationSection` as its root control. That is intentional. A plain `VBox` rendered, but it did not reliably inherit the current Bug binding context from the Fiori Elements Object Page.

The Post Comment button uses `Collaboration.onAddComment` through `core:require`. The alias must stay consistent with `BugCollaboration.js`; otherwise the button can render but fail at runtime.

If this file changes, browser smoke must verify:

- Add Comment is enabled on a saved active bug with no open draft.
- A new comment appears immediately.
- The same comment is still visible after page reload.
- No formatter fatal error appears in the console.

### Vietnamese

Fragment này hiện dùng `BugCollaborationSection` làm root control. Đây là chủ ý. `VBox` thường vẫn render được, nhưng không kế thừa ổn định binding context của Bug hiện tại từ Fiori Elements Object Page.

Nút Post Comment gọi `Collaboration.onAddComment` qua `core:require`. Alias này phải khớp với `BugCollaboration.js`; nếu sai, nút vẫn hiện nhưng có thể fail ở runtime.

Nếu sửa file này, browser smoke phải verify:

- Add Comment enabled trên bug active đã lưu và không có draft mở.
- Comment mới hiện ngay.
- Reload trang vẫn thấy comment đó.
- Console không có formatter fatal error.
## IDTS-73 create-page hiding notes

### English

IDTS-73 marks the root `BugCollaborationSection` with `hideOnCreate="true"`. This means the Comments section is not shown while a user is creating a brand-new bug. That behavior is intentional: comments are follow-up conversation after a bug exists, while the create page should focus on the initial report fields and optional evidence files.

Important anchor:

- **Location**: root `<collab:BugCollaborationSection hideOnCreate="true">`
  **IDTS concept**: Create Bug should not show collaboration-only UI.
  **Impact if broken**: Users see a disabled Comments section during create and may think comments are required or broken.
  **Must check together**: `BugCollaborationSection.js`, `BugCollaboration.js:isCreateDraftContext`, and browser create-page smoke.

### Vietnamese

IDTS-73 đánh dấu root `BugCollaborationSection` bằng `hideOnCreate="true"`. Điều này nghĩa là Comments section không hiện khi user đang tạo bug mới. Đây là hành vi có chủ ý: comment là phần trao đổi sau khi bug đã tồn tại, còn create page nên tập trung vào các field báo lỗi ban đầu và các evidence file nếu có.

Anchor quan trọng:

- **Vị trí**: root `<collab:BugCollaborationSection hideOnCreate="true">`
  **Khái niệm IDTS**: Create Bug không nên hiện UI chỉ dành cho cộng tác sau khi bug đã được tạo.
  **Ảnh hưởng nếu sai**: User thấy Comments section bị disabled khi create và có thể nghĩ comment là bắt buộc hoặc bị lỗi.
  **Phải kiểm tra cùng**: `BugCollaborationSection.js`, `BugCollaboration.js:isCreateDraftContext`, và browser smoke cho create page.

## Binding walkthrough / Walkthrough binding (2026-07-18)

**English.** Parent control hides the subsection for an unsaved NEW draft. After SAVE, TextArea holds local input, Post calls `Collaboration.onAddComment`, and the List binds the Bug's persisted comments navigation. The fragment does not write directly or choose author/role; backend derives those from the authenticated session. Debug hidden state at the parent control, submit in `onAddComment`, then backend action/history writer.

**Tiếng Việt.** Control cha ẩn subsection khi NEW draft chưa lưu. Sau SAVE, TextArea giữ input local, Post gọi `Collaboration.onAddComment`, List bind navigation comments đã persist của Bug. Fragment không ghi trực tiếp và không tự chọn author/role; backend lấy từ session authenticated. Debug visibility ở control cha, submit trong `onAddComment`, rồi backend action/history writer.
