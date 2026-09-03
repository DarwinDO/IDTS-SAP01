# My Notifications metadata spacing — 2026-09-03

## English

### Scope

Fix the Bug Management `My Notifications` metadata row that visually concatenated category, event, read state, and action-required labels. Preserve all notification data, caller-only authorization, paging, read behavior, deep links, email, scheduler, and backend behavior.

### Root cause and implementation

`NotificationShell.js#createRowItem` placed five native controls in a wrapping `HBox` without sibling spacing. A focused shell contract first failed on the missing native end margin. The implementation applies `sapUiTinyMarginEnd` to the existing controls and advances the Bug Management HTML5 cache identity to `0.0.9`; no custom CSS or dependency is added.

### Verification and rollout ledger

- Baseline UI contract: PASS.
- TDD RED: expected spacing assertion failure.
- TDD GREEN: `npm run qa:my-notifications:ui` PASS.
- Caller-only service/title-summary contract: PASS after attaching an exact-lock dependency junction.
- My Notifications model/backfill/events/scheduled/digest and User Access notification contracts: PASS.
- Bug Management cross-app UI contract, ESLint, and UI5 production build: PASS; build reports version `0.0.9` and completed successfully.
- Repository gates: secret scan PASS, agent rules `8/8`, QA-depth self-test `8/8`, AI DevKit lint `5/5`, and `git diff --check` PASS.
- SAP UI5/Fiori MCP was not callable in this session; local UI5 lint/build and focused native-control contracts are the fallback evidence.
- Source PR #379 passed `qa-depth-gate` and merged at `61bdd23b012be36675d1769cbdc46376b5958a48`.
- Dedicated MTAR: 367,314 bytes; SHA-256 `0C7D8A02E90F846635A3CF7FAA678E06583AFC5EAEA9A53D548B0FD904649D58`. The outer archive contains only `META-INF` and `idts-user-admin-ui-r3c-content/app/data.zip`; the inner data ZIP contains exactly Bug Management and User Administration HTML5 ZIPs. Bug manifest is `0.0.9` and the packaged shell contains the native margin fix.
- Live content-only deploy operation `42c8b7a9-a787-11f1-866f-eeee0a815b5e` completed. No CAP, AppRouter, HDI, schema, database, provider, email, scheduler, user, role, Bug, or notification mutation was requested.
- Post-deploy `npm run btp:demo:check`: CAP/AppRouter `1/1`, liveness/readiness `200`, anonymous protected API `401`, Web `200`, `DEMO READY`; no active MTA operation remained.
- Edge Browser Control reloaded with browser cache disabled. Network readback returned manifest HTTP `200`, version `0.0.9`, and `Component-preload.js` HTTP `200` containing `sapUiTinyMarginEnd` and the NotificationShell module.
- Visual-row limit: available signed-in DonHV and NhanT sessions contained zero personal notification rows. No synthetic notification was created. The next naturally occurring row remains the only uncollected visual proof; source, package, live asset, and empty-popover behavior are verified.
- Build/tooling debt: locked `npm ci` reported existing dev-dependency audit counts (Bug UI 6 moderate/7 high; User Administration 6 moderate/5 high). The exact lock graph is unchanged. `cf html5-list` was unavailable; MTA operation readback and cache-disabled live assets were used instead.

## Tiếng Việt

### Phạm vi

Sửa row metadata `My Notifications` trong Bug Management đang làm category, event, trạng thái đọc và nhãn cần xử lý dính liền. Giữ nguyên toàn bộ dữ liệu notification, phân quyền caller-only, paging, hành vi read, deep link, email, scheduler và backend.

### Nguyên nhân và implementation

`NotificationShell.js#createRowItem` đặt năm control native trong `HBox` có wrap nhưng không có khoảng cách giữa các control. Contract shell focused trước tiên fail đúng tại margin native bị thiếu. Implementation gắn `sapUiTinyMarginEnd` cho các control hiện có và tăng cache identity HTML5 Bug Management lên `0.0.9`; không thêm custom CSS hoặc dependency.

### Verification và ledger rollout

- Contract UI baseline: PASS.
- TDD RED: fail đúng tại assertion spacing.
- TDD GREEN: `npm run qa:my-notifications:ui` PASS.
- Contract caller-only service/title-summary: PASS sau khi gắn junction dependency có lockfile khớp chính xác.
- Contract My Notifications model/backfill/events/scheduled/digest và User Access notification: PASS.
- Contract cross-app Bug Management, ESLint và UI5 production build: PASS; build báo version `0.0.9` và hoàn tất thành công.
- Gate repository: secret scan PASS, agent rules `8/8`, QA-depth self-test `8/8`, AI DevKit lint `5/5` và `git diff --check` PASS.
- SAP UI5/Fiori MCP không callable trong session này; UI5 lint/build local và contract native-control focused là evidence fallback.
- PR source #379 PASS `qa-depth-gate` và merge tại `61bdd23b012be36675d1769cbdc46376b5958a48`.
- MTAR chuyên dụng: 367.314 byte; SHA-256 `0C7D8A02E90F846635A3CF7FAA678E06583AFC5EAEA9A53D548B0FD904649D58`. Archive ngoài chỉ có `META-INF` và `idts-user-admin-ui-r3c-content/app/data.zip`; data ZIP bên trong có đúng hai ZIP HTML5 Bug Management/User Administration. Manifest Bug là `0.0.9` và shell đóng gói có native margin fix.
- Operation deploy content-only live `42c8b7a9-a787-11f1-866f-eeee0a815b5e` hoàn tất. Không yêu cầu mutation CAP, AppRouter, HDI, schema, database, provider, email, scheduler, user, role, Bug hoặc notification.
- `npm run btp:demo:check` sau deploy: CAP/AppRouter `1/1`, liveness/readiness `200`, protected API anonymous `401`, Web `200`, `DEMO READY`; không còn MTA operation active.
- Edge Browser Control reload khi tắt browser cache. Network readback trả manifest HTTP `200`, version `0.0.9`, và `Component-preload.js` HTTP `200` có `sapUiTinyMarginEnd` cùng module NotificationShell.
- Giới hạn visual row: hai session đã đăng nhập DonHV và NhanT đều có zero personal notification row. Không tạo notification giả. Visual proof của row tự nhiên tiếp theo là evidence duy nhất chưa thu; source, package, asset live và empty-popover đã verify.
- Debt build/tooling: `npm ci` theo lock hiện tại báo audit dev-dependency đã tồn tại (Bug UI 6 moderate/7 high; User Administration 6 moderate/5 high). Lock graph chính xác không đổi. `cf html5-list` không khả dụng; dùng MTA operation readback và live asset cache-disabled thay thế.
