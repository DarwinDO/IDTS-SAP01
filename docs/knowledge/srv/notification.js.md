# Knowledge: `srv/notification.js`

## English

This is the thin CAP service adapter. It registers the two N1 read functions and two read-state actions, then delegates authorization, validation, querying and mapping to `srv/notification/inbox.js`. Keeping the adapter thin avoids a second policy implementation.

### Important source anchors

- **Location**: `NotificationService.init`. **Concept**: one registration point for the public contract. **Impact if broken**: CDS functions compile but have no runtime behavior. **Check together**: function names in `srv/notification.cds` and exported handlers in `inbox.js`.

## Tiếng Việt

Đây là adapter CAP mỏng. File đăng ký hai read function và hai read-state action N1 rồi giao authorization, validation, query và mapping cho `srv/notification/inbox.js`. Adapter mỏng giúp không tạo policy implementation thứ hai.

### Các điểm neo quan trọng

- **Vị trí**: `NotificationService.init`. **Khái niệm**: một điểm đăng ký cho contract public. **Ảnh hưởng nếu sai**: function CDS compile được nhưng không có behavior runtime. **Kiểm tra cùng**: tên function trong `srv/notification.cds` và handler export từ `inbox.js`.

## Safe editing / Sửa an toàn

Do not put business rules in this adapter; keep registration names exactly aligned with CDS. / Không đặt business rule trong adapter; giữ tên đăng ký khớp tuyệt đối với CDS.
