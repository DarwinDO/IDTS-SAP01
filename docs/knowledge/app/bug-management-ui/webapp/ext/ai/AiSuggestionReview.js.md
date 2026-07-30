# `AiSuggestionReview.js` - Shared persisted suggestion review helper

## English

This SAPUI5 helper contains the behavior shared by the Similar Bugs and Classification dialogs when a user chooses Accept, Reject, or Ignore. It sends the persisted `suggestionID` to the named CAP action, maps the returned state to Fiori semantics, formats reviewer time with the UI5 locale, displays only generic failure copy, and clears busy state. If the OData invocation fails before CAP confirms the decision, the review buttons are restored for a safe retry. If CAP already completed the decision but reading the result fails, the buttons stay locked so the UI cannot replay a persisted decision blindly.

Primary owner: DatDT. Backup: DonHV. Flow: dialog review decision. Start debugging at `submit()`, then inspect the suggestion ID, dynamic action name, returned `reviewStateCode`, reviewer/time, and final busy state.

Linked files: `DuplicateReview.js`, `ClassificationReview.js`, both i18n property files, `srv/ai/review.js`, and `scripts/qa/test-idts92-ai-review-ui.js`.

Safe editing impact:

- Keep the helper limited to suggestion-audit review; it must not PATCH a Bug or apply classification.
- Take the action name only from the three fixed dialog button callbacks.
- Do not display caught backend messages or raw OData responses.
- Restore retry only when the backend decision did not complete; keep repeated decisions disabled after completion and always clear busy state.

## Tiếng Việt

Helper SAPUI5 này chứa hành vi dùng chung của dialog Similar Bugs và Classification khi user chọn Accept, Reject hoặc Ignore. Nó gửi `suggestionID` đã persist tới CAP action được chỉ định, map trạng thái trả về sang Fiori semantic state, format thời gian reviewer theo locale UI5, chỉ hiện lỗi chung và tắt busy state. Nếu OData invocation lỗi trước khi CAP xác nhận quyết định, các nút review được mở lại để user retry an toàn. Nếu CAP đã hoàn tất quyết định nhưng bước đọc kết quả lỗi, các nút vẫn bị khóa để UI không vô tình phát lại một quyết định đã persist.

Owner chính: DatDT. Backup: DonHV. Flow: quyết định review trong dialog. Khi debug, bắt đầu tại `submit()`, rồi xem suggestion ID, tên action động, `reviewStateCode` trả về, reviewer/time và busy state cuối.

File liên kết: `DuplicateReview.js`, `ClassificationReview.js`, hai file i18n, `srv/ai/review.js` và `scripts/qa/test-idts92-ai-review-ui.js`.

Ảnh hưởng khi sửa:

- Giữ helper chỉ phục vụ review audit suggestion; không PATCH Bug hoặc apply classification.
- Chỉ nhận action name từ ba callback nút cố định trong dialog.
- Không hiển thị message backend đã catch hoặc raw OData response.
- Chỉ mở retry khi quyết định backend chưa hoàn tất; khóa quyết định lặp sau khi đã hoàn tất và luôn tắt busy state.
