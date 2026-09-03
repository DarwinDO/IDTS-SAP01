# Knowledge: `srv/notification.cds`

## English

This CDS file is the public OData contract for a signed-in user's own inbox. `NotificationSummary` is a deliberately small DTO: it contains display text, read state, safe navigation and timestamps, but no recipient email, provider response, lock, audit payload or identity data. `searchMyNotifications` accepts only bounded category/read-state/paging inputs; there is no cross-source free-text search in N1. `getMyUnreadNotificationCount` returns only the caller's count.

### Important source anchors

- **Location**: `@path: 'notification'` and service-level `authenticated-user`. **Concept**: dedicated authenticated endpoint. **Impact if broken**: anonymous or incorrectly routed requests can reach the inbox contract. **Check together**: `srv/notification.js`, AppRouter routing, CAP EDMX.
- **Location**: `NotificationSummary`. **Concept**: privacy-safe federated DTO. **Impact if broken**: source/provider/internal fields may leak. **Check together**: hydration allowlist in `srv/notification/inbox.js` and service QA.
- **Location**: the two functions. **Concept**: caller-only bounded read API. **Impact if broken**: clients may widen scope or request unbounded data. **Check together**: input normalization and authorization order in `inbox.js`.
- **Location**: `markMyNotificationRead` and `markAllMyNotificationsRead`. **Concept**: optimistic single-row read state and snapshot-bounded bulk read state. **Impact if broken**: two tabs can overwrite newer state or mark notifications that arrived after the user's action. **Check together**: conditional updates in `inbox.js` and race QA.
- **Location**: `NotificationMaintenanceResult` and `processNotificationSchedules(now:Timestamp)`. **Concept**: technical `OutboxProcessor` action for bounded SLA/Overdue discovery, not an end-user inbox operation. **Impact if broken**: an ordinary caller could trigger scheduled source writes, or Job Scheduler could not create the required idempotent events. **Must check together**: `srv/notification/scheduled.js`, `srv/notification.js`, `srv/service.cds:186-187` (`processEmailOutbox` remains separate), and scheduled QA.

## Tiếng Việt

File CDS này là hợp đồng OData công khai cho inbox của chính user đã đăng nhập. `NotificationSummary` là DTO nhỏ có chủ ý: chỉ chứa text hiển thị, read state, navigation an toàn và timestamp; không có email người nhận, phản hồi provider, lock, audit payload hoặc dữ liệu identity. `searchMyNotifications` chỉ nhận category/read-state/paging có giới hạn; N1 không có free-text search liên nguồn. `getMyUnreadNotificationCount` chỉ trả count của caller.

### Các điểm neo quan trọng

- **Vị trí**: `@path: 'notification'` và `authenticated-user` ở service. **Khái niệm**: endpoint xác thực riêng. **Ảnh hưởng nếu sai**: request anonymous hoặc route sai có thể chạm contract inbox. **Kiểm tra cùng**: `srv/notification.js`, route AppRouter và EDMX CAP.
- **Vị trí**: `NotificationSummary`. **Khái niệm**: DTO liên nguồn bảo vệ privacy. **Ảnh hưởng nếu sai**: field source/provider/internal có thể bị lộ. **Kiểm tra cùng**: allowlist hydration trong `srv/notification/inbox.js` và QA service.
- **Vị trí**: hai function. **Khái niệm**: API đọc bounded chỉ cho caller. **Ảnh hưởng nếu sai**: client có thể mở rộng scope hoặc yêu cầu dữ liệu không giới hạn. **Kiểm tra cùng**: normalize input và thứ tự authorization trong `inbox.js`.
- **Vị trí**: `markMyNotificationRead` và `markAllMyNotificationsRead`. **Khái niệm**: read state optimistic cho một row và read state hàng loạt theo snapshot. **Ảnh hưởng nếu sai**: hai tab có thể ghi đè state mới hoặc đánh dấu notification đến sau thao tác của user. **Kiểm tra cùng**: conditional update trong `inbox.js` và QA race.
- **Vị trí**: `NotificationMaintenanceResult` và `processNotificationSchedules(now:Timestamp)`. **Khái niệm**: action kỹ thuật `OutboxProcessor` để discovery SLA/Overdue bounded, không phải operation inbox cho end-user. **Ảnh hưởng nếu sai**: caller bình thường có thể kích hoạt source write theo lịch, hoặc Job Scheduler không tạo được event idempotent cần thiết. **Phải kiểm tra cùng**: `srv/notification/scheduled.js`, `srv/notification.js`, `srv/service.cds:186-187` (`processEmailOutbox` vẫn tách riêng) và QA scheduled.

## Safe editing / Sửa an toàn

Keep the DTO allowlisted and add no recipient selector. Keep `processNotificationSchedules` protected and do not merge it into `processEmailOutbox`; any new result field must be traced to a consumer test. / Giữ DTO theo allowlist và không thêm selector người nhận. Giữ `processNotificationSchedules` được bảo vệ và không gộp vào `processEmailOutbox`; mọi field result mới phải được trace tới consumer test.

## Activation cutoff / Cutoff kích hoạt

The protected action now has signature `processNotificationSchedules(now:Timestamp, discoveryFrom:Timestamp)`. `discoveryFrom` is not a recipient/filter selector; private server configuration is authoritative in production, while the parameter supports controlled environments when that configuration is absent. Invalid/blank values fail closed, and focused QA proves before/equal/after boundaries plus server-config precedence. / Action được bảo vệ giờ có signature `processNotificationSchedules(now:Timestamp, discoveryFrom:Timestamp)`. `discoveryFrom` không phải selector recipient/filter; private server config là authority ở production, còn tham số hỗ trợ môi trường kiểm soát khi config chưa có. Giá trị sai/blank fail-closed và QA focused chứng minh boundary trước/đúng/sau cutoff cùng precedence của server config.
# 2026-09-03 bounded Bug title context

`NotificationSummary` adds only `bugNumber` and `bugTitle` for caller-owned Bug notifications. It deliberately omits Bug description and retains all existing safe DTO exclusions.

`NotificationSummary` chỉ thêm `bugNumber` và `bugTitle` cho Bug notification thuộc caller. Contract chủ động không đưa Bug description và giữ toàn bộ loại trừ DTO an toàn hiện có.
