# Knowledge: `srv/notification/_i18n/notifications.properties`

## English

This English fallback CAP bundle provides bounded display titles and summaries for the six existing Bug event types and final access role-change/reactivation. It contains no recipient, audit reason, provider data or external URL. `srv/notification/inbox.js` selects keys only after validating source eligibility and passes the caller locale to CAP's native fallback. The unavailable key prevents unsupported records from making a false success claim.

Important anchor: the `BUG_*`, `ACCESS_*` and `UNAVAILABLE_TITLE` keys are a contract with the inbox mapper. Missing keys create blank DTO text; mismatched translation changes event meaning. Check both bundles, the mapper and English/Vietnamese HTTP service tests together. Owner DonHV; backup NhanT. Keep title <=160 and summary <=500 characters.

## Tiếng Việt

English fallback supplies bounded safe title/summary pairs for the additive Bug event vocabulary: assignment/reassignment/removal, owner change, lifecycle progress and completion, pending assignment, overdue, and later mention/escalation codes, plus access role-change/reactivation. It contains no recipient, audit reason, provider data, or external URL. `srv/notification/inbox.js` selects a key only after source validation and passes caller locale to CAP fallback; an unavailable key never turns an unsupported record into a success claim.

## N3 lifecycle keys

Vietnamese: bundle fallback cung cấp cặp title/summary an toàn, có giới hạn cho vocabulary Bug additive: giao/giao lại/bỏ giao, đổi owner, tiến trình và hoàn tất lifecycle, pending assignment, overdue, và code mention/escalation sau này, cùng access role-change/reactivation. Không chứa recipient, audit reason, provider data hoặc URL ngoài. `srv/notification/inbox.js` chỉ chọn key sau khi validate source và truyền locale caller cho CAP fallback; key unavailable không biến record không hỗ trợ thành success claim. `ASSIGNMENT_REMOVED` mô tả previous Developer, còn `PENDING_ASSIGNMENT` mô tả PM queue.

Điểm neo: các key `BUG_*`, `ACCESS_*` và `UNAVAILABLE_TITLE` là contract với mapper. Thiếu key làm DTO trống; dịch không tương đương làm sai ý nghĩa event. Kiểm hai bundle, mapper và test HTTP Anh/Việt cùng nhau. Owner DonHV; backup NhanT. Giữ title <=160 và summary <=500 ký tự.
