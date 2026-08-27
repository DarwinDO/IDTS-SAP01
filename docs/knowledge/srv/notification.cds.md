# Knowledge: `srv/notification.cds`

## English

This CDS file is the public OData contract for a signed-in user's own inbox. `NotificationSummary` is a deliberately small DTO: it contains display text, read state, safe navigation and timestamps, but no recipient email, provider response, lock, audit payload or identity data. `searchMyNotifications` accepts only bounded category/read-state/paging inputs; there is no cross-source free-text search in N1. `getMyUnreadNotificationCount` returns only the caller's count.

### Important source anchors

- **Location**: `@path: 'notification'` and service-level `authenticated-user`. **Concept**: dedicated authenticated endpoint. **Impact if broken**: anonymous or incorrectly routed requests can reach the inbox contract. **Check together**: `srv/notification.js`, AppRouter routing, CAP EDMX.
- **Location**: `NotificationSummary`. **Concept**: privacy-safe federated DTO. **Impact if broken**: source/provider/internal fields may leak. **Check together**: hydration allowlist in `srv/notification/inbox.js` and service QA.
- **Location**: the two functions. **Concept**: caller-only bounded read API. **Impact if broken**: clients may widen scope or request unbounded data. **Check together**: input normalization and authorization order in `inbox.js`.

## Tiếng Việt

File CDS này là hợp đồng OData công khai cho inbox của chính user đã đăng nhập. `NotificationSummary` là DTO nhỏ có chủ ý: chỉ chứa text hiển thị, read state, navigation an toàn và timestamp; không có email người nhận, phản hồi provider, lock, audit payload hoặc dữ liệu identity. `searchMyNotifications` chỉ nhận category/read-state/paging có giới hạn; N1 không có free-text search liên nguồn. `getMyUnreadNotificationCount` chỉ trả count của caller.

### Các điểm neo quan trọng

- **Vị trí**: `@path: 'notification'` và `authenticated-user` ở service. **Khái niệm**: endpoint xác thực riêng. **Ảnh hưởng nếu sai**: request anonymous hoặc route sai có thể chạm contract inbox. **Kiểm tra cùng**: `srv/notification.js`, route AppRouter và EDMX CAP.
- **Vị trí**: `NotificationSummary`. **Khái niệm**: DTO liên nguồn bảo vệ privacy. **Ảnh hưởng nếu sai**: field source/provider/internal có thể bị lộ. **Kiểm tra cùng**: allowlist hydration trong `srv/notification/inbox.js` và QA service.
- **Vị trí**: hai function. **Khái niệm**: API đọc bounded chỉ cho caller. **Ảnh hưởng nếu sai**: client có thể mở rộng scope hoặc yêu cầu dữ liệu không giới hạn. **Kiểm tra cùng**: normalize input và thứ tự authorization trong `inbox.js`.

## Safe editing / Sửa an toàn

Keep the DTO allowlisted and add no recipient selector. Any new field must be traced from source query through hydration to a consumer test. / Giữ DTO theo allowlist và không thêm selector người nhận. Field mới phải được trace từ source query qua hydration tới test consumer.
