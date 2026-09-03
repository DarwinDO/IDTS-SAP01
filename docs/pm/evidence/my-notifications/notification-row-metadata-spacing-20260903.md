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
- Remaining merge, content-only rollout, signed-in Edge acceptance, and cleanup evidence will be appended after each boundary is completed.

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
- Evidence merge, rollout content-only, acceptance Edge đã đăng nhập và cleanup còn lại sẽ được bổ sung sau từng boundary.
