# Knowledge: `srv/notification/_i18n/notifications.properties`

## Comment-mentioned inbox copy (N3 Task 8)

**English:** `BUG_COMMENT_MENTIONED_*` supplies the safe localized inbox title and summary. It must not contain the selected recipient list, raw comment body, provider status, or delivery detail.

**Tiếng Việt:** `BUG_COMMENT_MENTIONED_*` cung cấp title/summary inbox đã localize và an toàn. Không đưa danh sách recipient đã chọn, raw comment body, provider status hoặc delivery detail vào copy này.

## English

This English fallback CAP bundle provides bounded display titles and summaries for the additive Bug event vocabulary: assignment/reassignment/removal, owner change, lifecycle progress and completion, pending assignment, overdue, and later mention/escalation codes, plus access role-change/reactivation. It contains no recipient, audit reason, provider data, or external URL. `srv/notification/inbox.js` selects keys only after validating source eligibility and passes the caller locale to CAP's native fallback. The unavailable key prevents unsupported records from making a false success claim.

Important anchor: the `BUG_*`, `ACCESS_*` and `UNAVAILABLE_TITLE` keys are a contract with the inbox mapper. Missing keys create blank DTO text; mismatched translation changes event meaning. Check both bundles, the mapper and English/Vietnamese HTTP service tests together. Owner DonHV; backup NhanT. Keep title <=160 and summary <=500 characters.

## Tiếng Việt

## N3 lifecycle keys

Bundle fallback tiếng Anh cung cấp cặp title/summary an toàn, có giới hạn cho vocabulary Bug additive: giao/giao lại/bỏ giao, đổi owner, tiến trình và hoàn tất lifecycle, pending assignment, overdue, và code mention/escalation sau này, cùng access role-change/reactivation. Không chứa recipient, audit reason, provider data hoặc URL ngoài. `srv/notification/inbox.js` chỉ chọn key sau khi validate source và truyền locale caller cho CAP fallback; key unavailable không biến record không hỗ trợ thành success claim. `ASSIGNMENT_REMOVED` mô tả previous Developer, còn `PENDING_ASSIGNMENT` mô tả PM queue.

Điểm neo: các key `BUG_*`, `ACCESS_*` và `UNAVAILABLE_TITLE` là contract với mapper. Thiếu key làm DTO trống; dịch không tương đương làm sai ý nghĩa event. Kiểm hai bundle, mapper và test HTTP Anh/Việt cùng nhau. Owner DonHV; backup NhanT. Giữ title <=160 và summary <=500 ký tự.

## Task 9 escalation copy

**English.** `BUG_PRIORITY_ESCALATED_*` and `BUG_SEVERITY_ESCALATED_*` describe only safe action semantics. They do not contain old/new values, recipient data, audit details, or mail status.

**Tiếng Việt.** `BUG_PRIORITY_ESCALATED_*` và `BUG_SEVERITY_ESCALATED_*` chỉ mô tả action semantics an toàn; không chứa giá trị cũ/mới, recipient, audit detail hoặc mail status.
