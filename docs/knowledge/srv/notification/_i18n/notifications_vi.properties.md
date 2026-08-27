# Knowledge: `srv/notification/_i18n/notifications_vi.properties`

## English

This Vietnamese CAP bundle provides bounded display titles and summaries for the six existing Bug event types and final access role-change/reactivation. It contains no recipient, audit reason, provider data or external URL. `srv/notification/inbox.js` selects keys only after validating source eligibility and passes the caller locale to CAP's native fallback. The unavailable key prevents unsupported records from making a false success claim.

Important anchor: the `BUG_*`, `ACCESS_*` and `UNAVAILABLE_TITLE` keys are a contract with the inbox mapper. Missing keys create blank DTO text; mismatched translation changes event meaning. Check both bundles, the mapper and English/Vietnamese HTTP service tests together. Owner DonHV; backup NhanT. Keep title <=160 and summary <=500 characters.

## Tiếng Việt

Bundle CAP Vietnamese cung cấp title/summary có giới hạn cho sáu loại event Bug hiện có và role-change/reactivation cuối. Không chứa recipient, audit reason, provider data hoặc URL ngoài. `srv/notification/inbox.js` chỉ chọn key sau khi validate source, rồi truyền locale caller cho fallback native CAP. Key không khả dụng ngăn record không hỗ trợ phát thông báo thành công giả.

Điểm neo: các key `BUG_*`, `ACCESS_*` và `UNAVAILABLE_TITLE` là contract với mapper. Thiếu key làm DTO trống; dịch không tương đương làm sai ý nghĩa event. Kiểm hai bundle, mapper và test HTTP Anh/Việt cùng nhau. Owner DonHV; backup NhanT. Giữ title <=160 và summary <=500 ký tự.
