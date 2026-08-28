# Knowledge: `srv/notification.js`

## English

This is the thin CAP service adapter. It registers the N1 read functions, read-state actions and the protected N4 schedule action, then delegates authorization, validation, querying and mapping to the focused modules under `srv/notification/`. Keeping the adapter thin avoids a second policy implementation.

### Important source anchors

- **Location**: `NotificationService.init`. **Concept**: one registration point for the public contract. **Impact if broken**: CDS functions compile but have no runtime behavior. **Check together**: function names in `srv/notification.cds` and exported handlers in `inbox.js`.
- **Location**: `srv/notification.js:12,18`. **Concept**: `processNotificationSchedules` is wired to the scheduler module while inbox reads remain in `inbox.js`. **Impact if broken**: Job Scheduler can receive a valid OData action but no SLA/Overdue discovery runs, or read-state policy can be mixed with technical scheduling. **Must check together**: `srv/notification.cds:43-44`, `srv/notification/scheduled.js:21`, and `scripts/qa/test-my-notifications-scheduled.js`.

## Tiếng Việt

Đây là adapter CAP mỏng. File đăng ký các read function N1, action read-state và action schedule N4 được bảo vệ, rồi giao authorization, validation, query và mapping cho các module tập trung trong `srv/notification/`. Adapter mỏng giúp không tạo policy implementation thứ hai.

### Các điểm neo quan trọng

- **Vị trí**: `NotificationService.init`. **Khái niệm**: một điểm đăng ký cho contract public. **Ảnh hưởng nếu sai**: function CDS compile được nhưng không có behavior runtime. **Kiểm tra cùng**: tên function trong `srv/notification.cds` và handler export từ `inbox.js`.
- **Vị trí**: `srv/notification.js:12,18`. **Khái niệm**: `processNotificationSchedules` được nối vào module scheduler, còn read inbox/read-state vẫn nằm ở `inbox.js`. **Ảnh hưởng nếu sai**: Job Scheduler gọi được action OData nhưng không phát hiện SLA/Overdue, hoặc policy inbox bị trộn với schedule kỹ thuật. **Phải kiểm tra cùng**: `srv/notification.cds:43-44`, `srv/notification/scheduled.js:21` và `scripts/qa/test-my-notifications-scheduled.js`.

## Safe editing / Sửa an toàn

Do not put business rules in this adapter; keep registration names exactly aligned with CDS and keep schedule discovery separate from `processEmailOutbox`. / Không đặt business rule trong adapter; giữ tên đăng ký khớp tuyệt đối với CDS và tách discovery khỏi `processEmailOutbox`.
