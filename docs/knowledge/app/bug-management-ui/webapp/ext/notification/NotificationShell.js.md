# NotificationShell.js — native personal notification shell

## English

`NotificationShell` owns the small authenticated Bug Management header surface: a native toolbar bell with a capped badge and a native `ResponsivePopover`. It consumes safe DTOs through `NotificationClient`; it never reads source/audit/delivery tables or chooses a recipient.

`init(component)` is idempotent per component through `WeakMap`. It waits for the asynchronous i18n resource bundle before rendering, places one toolbar in the stable index host, starts unread polling only while the document is visible, and refreshes on focus/visibility. The returned instance exposes only `refreshUnread` and `destroy`. Component teardown clears the timer/listeners and destroys native controls.

The popover keeps category/read filters, loaded rows and scroll state between closes. Each reset freezes a timestamp before the server page request; **Mark all as read** forwards that same snapshot so later arrivals remain unread. Page 1 contains 25 rows, **Load more** appends server order up to the service's 10,000 skip boundary. Request version counters ignore stale filter/count results.

Rows use literal **Unread/Read** text in addition to semantic state, wrap safe title/summary, show category/time and an **Action required** marker. Selection tries to mark read, refreshes the badge, then follows only `NotificationClient.safeTargetPath`; a transient read failure does not trap navigation. Closing restores focus to the bell and `InvisibleMessage` announces changed unread counts politely.

### Important source anchors

| Anchor | IDTS impact if broken | Check together |
| --- | --- | --- |
| `init` / `destroy` | Duplicate shells or leaked polling after logout/component reload | `Component.js`, index host |
| async `bundleFor` initialization | Raw i18n keys appear during startup | three i18n bundles, browser fixture |
| `loadPage` request version and frozen snapshot | Mixed filters, duplicate pages or marking unseen arrivals; success updates only local rows at/before snapshot | client paging, CAP mark-all predicate |
| `refreshUnread` visibility/timer | Background traffic or stale/false badge | count endpoint and visibility QA |
| `openNotification` | Navigation blocked by transient read error or unsafe route | client target allowlist, target CAP auth |

Owner: DonHV. Break first at `init`, then `loadPage`, `refreshUnread`, `markAll`, or `openNotification`. The shell also listens for the payload-free `idts:notification-change` signal after a relevant successful Bug action and removes it on destroy. Category icons and localized event labels accompany safe row text. Run shell/client QA, UI build, responsive browser checks (375/768/1366/1920), 200% zoom and keyboard focus checks. This UI does not authorize deployment, backfill or notification producer changes.

## Tiếng Việt

`NotificationShell` quản lý phần header nhỏ sau đăng nhập của Bug Management: chuông toolbar native có badge giới hạn và `ResponsivePopover` native. Shell dùng DTO an toàn qua `NotificationClient`; không đọc trực tiếp bảng source/audit/delivery hoặc tự chọn recipient.

`init(component)` idempotent theo component bằng `WeakMap`. Nó chờ resource bundle i18n bất đồng bộ trước khi render, đặt đúng một toolbar vào host index ổn định, chỉ poll unread khi document visible và refresh khi focus/visibility đổi. Instance chỉ expose `refreshUnread` và `destroy`. Khi component teardown, timer/listener được xóa và control native được destroy.

Popover giữ filter category/read, row đã nạp và scroll state khi đóng/mở. Mỗi lần reset đóng băng timestamp trước request page server; **Đánh dấu tất cả đã đọc** chuyển đúng snapshot đó để notification đến sau vẫn chưa đọc. Trang đầu có 25 row, **Tải thêm** nối tiếp thứ tự server tới giới hạn skip 10.000. Counter version bỏ kết quả filter/count cũ đến muộn.

Row có chữ **Chưa đọc/Đã đọc** ngoài semantic state, wrap title/summary an toàn, hiện category/thời gian và marker **Cần xử lý**. Khi chọn, shell thử mark-read, refresh badge rồi chỉ đi theo `safeTargetPath`; lỗi read tạm thời không nhốt user. Đóng popover trả focus về chuông, `InvisibleMessage` thông báo lịch sự khi unread count đổi.

### Anchor source quan trọng

| Anchor | Ảnh hưởng IDTS khi sai | Kiểm cùng |
| --- | --- | --- |
| `init` / `destroy` | Shell trùng hoặc poll rò sau logout/reload component | `Component.js`, host index |
| khởi tạo async `bundleFor` | Hiện key i18n thô lúc startup | ba bundle i18n, fixture browser |
| request version và snapshot trong `loadPage` | Trộn filter, trùng trang hoặc đánh dấu notification chưa xem; success chỉ cập nhật local row tại/trước snapshot | paging client, predicate mark-all CAP |
| `refreshUnread` visibility/timer | Request nền hoặc badge cũ/sai | endpoint count và QA visibility |
| `openNotification` | Lỗi read tạm thời chặn điều hướng hoặc đi route không an toàn | allowlist client, quyền CAP đích |

Owner: DonHV. Đặt breakpoint lần lượt tại `init`, `loadPage`, `refreshUnread`, `markAll`, `openNotification`. Shell còn nghe event không payload `idts:notification-change` sau Bug action thành công và gỡ listener khi destroy. Icon category cùng label event đã localize đi với row text an toàn. Chạy QA shell/client, build UI, browser responsive 375/768/1366/1920, zoom 200% và keyboard focus. UI này không cho phép deploy, backfill hoặc đổi notification producer.
