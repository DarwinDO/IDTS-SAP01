# NotificationClient.js — personal inbox OData boundary

## English

This module connects the Bug Management shell to `NotificationService`. Authentication stays in the existing OData model; CAP resolves the active caller. The browser never selects a recipient or replaces authorization.

`search` validates enums and integer page bounds, then returns the server's order unchanged. `unreadCount` returns a nonnegative integer. `markRead` preserves the original `modifiedAt` precision for optimistic concurrency. `markAllRead` sends the frozen list snapshot: its result counts changed rows, not remaining unread items.

The shared `call` sets parameters on a deferred binding, awaits `invoke("$direct")`, reads its result and destroys it in `finally`. It adds no fetch/CSRF/token logic. Errors are reduced to a safe code so the shell can localize feedback without raw server details. `safeTargetPath` accepts only the Bug landing and active UUID Object Page route; target CAP authorization still applies.

### Important source anchors

| Anchor | IDTS impact if broken | Check together |
| --- | --- | --- |
| `search` / model `notifications` | Wrong service/parameters or client sorting corrupt the personal page | `manifest.json`, `srv/notification.cds` |
| `call` / `invoke` / `finally` | Premature success or leaked bindings | UI5 OData model, client QA |
| `markRead` / `expectedModifiedAt` | Version rounding creates false conflicts | server handler, shell |
| `markAllRead` | Late snapshot can mark unseen new arrivals | server predicate, shell snapshot |
| `safeTargetPath` | Arbitrary or external navigation | `srv/email/template.js`, shell selection |

Owner: DonHV. Trace shell event -> client -> CAP handler. Run client/shell tests, browser fixture, lint/build and N1 regression when changing this boundary. UI-only work must preserve server identity/privacy and email behavior.

## Tiếng Việt

Module nối shell Bug Management với `NotificationService`. Xác thực vẫn ở OData model có sẵn; CAP resolve caller active. Browser không chọn recipient hay thay authorization.

`search` kiểm enum và giới hạn paging số nguyên rồi trả nguyên thứ tự server. `unreadCount` trả số nguyên không âm. `markRead` giữ chính xác chuỗi `modifiedAt` cho optimistic concurrency. `markAllRead` gửi snapshot cố định của danh sách: kết quả là số row đổi, không phải số chưa đọc còn lại.

Helper `call` gán parameter lên deferred binding, chờ `invoke("$direct")`, đọc result và destroy trong `finally`. Không thêm fetch/CSRF/token. Lỗi được rút về code an toàn để shell localize, không lộ chi tiết server. `safeTargetPath` chỉ nhận landing Bug và Object Page active với UUID; CAP đích vẫn kiểm quyền.

### Anchor source quan trọng

| Anchor | Ảnh hưởng IDTS khi sai | Kiểm cùng |
| --- | --- | --- |
| `search` / model `notifications` | Sai service/parameter hoặc sort client làm sai trang cá nhân | `manifest.json`, `srv/notification.cds` |
| `call` / `invoke` / `finally` | Báo thành công sớm hoặc rò binding | OData model, QA client |
| `markRead` / `expectedModifiedAt` | Làm tròn version gây conflict giả | server handler, shell |
| `markAllRead` | Snapshot muộn có thể đánh dấu thông báo mới chưa xem | predicate server, snapshot shell |
| `safeTargetPath` | Điều hướng tùy ý hoặc ra ngoài | `srv/email/template.js`, chọn item shell |

Owner: DonHV. Trace event shell -> client -> handler CAP. Khi đổi boundary, chạy test client/shell, fixture browser, lint/build và regression N1. Công việc UI không đổi identity/privacy server hoặc hành vi email.
