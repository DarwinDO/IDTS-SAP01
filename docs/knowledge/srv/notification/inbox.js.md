# Knowledge: `srv/notification/inbox.js`

## English

This module is the server-authoritative personal inbox boundary. It resolves one active internal actor through the existing immutable-identity/platform-role helper before reading any inbox row. The recipient predicate is applied before category, read-state, order and paging, so PM or UserAdmin capability never grants another user's inbox.

`readInboxPage` enforces default 25, maximum 100, maximum skip 10000, and stable `occurredAt desc, ID desc` ordering. `hydrateNotificationPage` performs at most one bulk Bug-notification read and one bulk access-audit read for a page. It maps only safe DTO fields; missing or unsupported sources have no deep link, and access navigation is limited to final applied role-change/reactivation events.

`markMyNotificationRead` updates only the caller-owned unread row whose `modifiedAt` still matches. A second tab that repeats the same version receives the already-read DTO; an unread stale row returns a safe conflict, while another user's ID is indistinguishable from not found. `markAllMyNotificationsRead` includes `occurredAt <= throughOccurredAt`, so later arrivals remain unread.

### Important source anchors

- **Location**: `resolveNotificationActor` before `normalizeSearch`/`readInboxPage`. **Concept**: identity and role alignment precede all client input/query work. **Impact if broken**: filter/count timing or predicates can leak cross-user existence. **Check together**: `srv/bug-service/helpers.js`, `srv/auth/identity-map.js`, `srv/auth/platform-role.js`, XSUAA QA.
- **Location**: `readInboxPage`. **Concept**: recipient-first bounded stable paging. **Impact if broken**: a client can widen scope, exhaust the service or see duplicates across pages. **Check together**: schema recipient association and service paging tests.
- **Location**: `hydrateNotificationPage`. **Concept**: two-read maximum with safe source mapping. **Impact if broken**: N+1 load or raw source/audit/provider data may escape. **Check together**: `NotificationSummary`, source entities and hydration-read-count QA.
- **Location**: `markMyNotificationRead` and `markAllMyNotificationsRead`. **Concept**: caller-owned optimistic updates and snapshot race safety. **Impact if broken**: stale tabs or bulk actions can change unintended rows. **Check together**: managed `modifiedAt`, `readAt`, action CDS and service race tests.

## Tiếng Việt

Module này là boundary inbox cá nhân có server làm authority. Nó resolve đúng một actor nội bộ active qua helper immutable-identity/platform-role hiện có trước khi đọc bất kỳ inbox row nào. Predicate người nhận được áp trước category, read-state, order và paging, nên quyền PM hoặc UserAdmin không cho phép đọc inbox user khác.

`readInboxPage` enforce mặc định 25, tối đa 100, skip tối đa 10000 và thứ tự ổn định `occurredAt desc, ID desc`. `hydrateNotificationPage` chạy tối đa một bulk read Bug notification và một bulk read access audit cho mỗi page. Module chỉ map field DTO an toàn; source thiếu/không hỗ trợ không có deep link, còn navigation access chỉ dành cho role-change/reactivation cuối đã applied.

`markMyNotificationRead` chỉ update row unread thuộc caller khi `modifiedAt` còn khớp. Tab thứ hai lặp cùng version nhận DTO đã đọc; row còn unread nhưng stale trả conflict an toàn, còn ID của user khác trông giống not found. `markAllMyNotificationsRead` có điều kiện `occurredAt <= throughOccurredAt`, nên notification đến sau vẫn unread.

### Các điểm neo quan trọng

- **Vị trí**: `resolveNotificationActor` trước `normalizeSearch`/`readInboxPage`. **Khái niệm**: alignment identity/role đứng trước mọi input/query từ client. **Ảnh hưởng nếu sai**: filter/count timing hoặc predicate có thể lộ tồn tại dữ liệu user khác. **Kiểm tra cùng**: `srv/bug-service/helpers.js`, `srv/auth/identity-map.js`, `srv/auth/platform-role.js`, QA XSUAA.
- **Vị trí**: `readInboxPage`. **Khái niệm**: paging bounded, ổn định và scope recipient trước. **Ảnh hưởng nếu sai**: client có thể mở rộng scope, làm quá tải service hoặc thấy row trùng giữa page. **Kiểm tra cùng**: association recipient trong schema và test paging service.
- **Vị trí**: `hydrateNotificationPage`. **Khái niệm**: tối đa hai read với source mapping an toàn. **Ảnh hưởng nếu sai**: N+1 hoặc dữ liệu source/audit/provider thô có thể bị lộ. **Kiểm tra cùng**: `NotificationSummary`, entity nguồn và QA đếm hydration read.
- **Vị trí**: `markMyNotificationRead` và `markAllMyNotificationsRead`. **Khái niệm**: optimistic update thuộc caller và an toàn race theo snapshot. **Ảnh hưởng nếu sai**: tab stale hoặc bulk action có thể đổi row ngoài ý muốn. **Kiểm tra cùng**: `modifiedAt` managed, `readAt`, action CDS và test race service.

## Safe editing / Sửa an toàn

Never accept a recipient ID from the client, never hydrate before caller scope, and never add external URLs. New sources require one bounded bulk read and an allowlisted mapper. / Không nhận recipient ID từ client, không hydrate trước khi scope caller và không thêm URL ngoài. Source mới cần một bulk read bounded và mapper theo allowlist.
