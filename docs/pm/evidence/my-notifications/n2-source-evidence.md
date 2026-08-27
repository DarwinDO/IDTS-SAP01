# My Notifications N2 source evidence

## English

### Scope and baseline

- Owner: DonHV; branch `feature/wp7-notifications-inbox-ui-donhv`.
- Exact N2 base: N1 merge commit `e35d09c0deef129f0d986457c847fe7fc28b90d4` from PR #361.
- Scope: Bug Management UI only — named NotificationService client, native bell/badge/popover, filters, read actions, paging, safe deep link and responsive/accessibility behavior.
- No backend/schema/producer/email/provider/data/user/role/deployment or live migration/backfill change.

### TDD and implementation evidence

Task 5 RED failed because `NotificationClient.js` did not exist. GREEN proves exact OData operation names/parameters, default and maximum page constraints, actual awaited invocation plus `requestObject`, binding cleanup, original high-precision optimistic timestamp, safe error copy and strict same-app route allowlist. Component RED failed before shell startup/teardown wiring and now passes.

Task 6 uses native SAPUI5 `Toolbar`, transparent `Button`, `BadgeCustomData`, `ResponsivePopover`, filters, list/status/message controls and `InvisibleMessage`; no notification CSS was added. Resource bundle loading is awaited so raw i18n keys are not rendered. Polling is 30 seconds only while visible; focus/visibility refresh and teardown are covered. Reset freezes mark-all time before its page request, request versions ignore stale results, and client/server row order is preserved.

Luna received only shell/i18n/shell-QA/mirror scope. It produced the initial shell/i18n/test and then ended before reporting/mirroring. Coordinator reviewed the exact diff, added the missing mirror and fixed integration issues: asynchronous i18n, native badge/right placement, WeakMap simplification, pre-request snapshot and awaited OData `requestObject`. No unreviewed Luna commit/push/PR exists.

### Verification and boundaries

- PASS: `npm run qa:my-notifications:ui`, `npm run qa:my-notifications:service`, focused Bug UI ESLint, Bug UI build, secret scan, agent rules 8/8 and QA-depth self-test 15/15.
- Local synthetic browser PASS: English/Vietnamese; native bell/badge and dialog; first 25 and Load More to 50; mark-all updates badge to zero; Escape returns focus; no horizontal page overflow at 375/768/1366/1920; dialog/load-more remain usable at 200% zoom.
- The browser fixture uses generated non-personal records and a fake client only for visual interaction. Programmatic client QA and N1 service QA cover the real client/service contract. This is not BTP, persistence migration, production data, real email, or NVDA acceptance.
- UI5/Fiori MCP tools were not callable. Official UI5 API/search evidence, established repository patterns, local runtime controls, lint/build and browser accessibility tree were used instead.
- Baseline app-wide Fiori ESLint config imports an absent dev-only `@babel/eslint-parser`. N2 adds a focused config using existing locked root `@eslint/js` recommended rules only for changed notification files/Component; no install or dependency/lock graph mutation. It does not claim to repair app-wide lint.
- First exact-head review at `a3a61435d1affc73525baff1af6d30a989504ac3` returned NO-GO: 0 Critical / 1 Major / 3 Important / 3 Minor. Fix wave covers mark-all local-state races, category/event icon/label, immediate post-assignment badge refresh, shared error reset, native ResponsivePopover behavior, official `InvisibleMessageMode.Polite`, and stale mirror wording. NVDA is not installed on this host; no NVDA PASS is fabricated. Existing Knowledge Gate PASS is reused by DonHV's explicit confirmation; no new assessment/score/date is created. Fresh exact-head re-review, commit/push and one Draft N2 PR remain. Ready/merge/deploy/N3 are not authorized.

## Tiếng Việt

### Scope và baseline

- Owner DonHV; branch `feature/wp7-notifications-inbox-ui-donhv`.
- Base N2 chính xác là merge N1 `e35d09c0deef129f0d986457c847fe7fc28b90d4` từ PR #361.
- Scope chỉ Bug Management UI: client NotificationService, chuông/badge/popover native, filter, read action, paging, deep link an toàn và responsive/accessibility.
- Không đổi backend/schema/producer/email/provider/data/user/role/deploy hoặc migration/backfill thật.

### Evidence TDD và implementation

Task 5 RED vì chưa có `NotificationClient.js`. GREEN chứng minh đúng operation/parameter OData, page mặc định/tối đa, chờ invocation thật và `requestObject`, cleanup binding, giữ timestamp optimistic đủ precision, lỗi an toàn và allowlist route cùng app. Component RED trước khi nối startup/teardown shell, hiện GREEN.

Task 6 dùng `Toolbar`, `Button` transparent, `BadgeCustomData`, `ResponsivePopover`, filter, list/status/message và `InvisibleMessage` native; không thêm CSS notification. Chờ bundle i18n nên không hiện key thô. Poll 30 giây chỉ khi visible; refresh focus/visibility và teardown có coverage. Snapshot mark-all được đóng băng trước request page, request version bỏ kết quả cũ, giữ thứ tự row server.

Luna chỉ nhận shell/i18n/QA shell/mirror. Luna tạo shell/i18n/test ban đầu rồi kết thúc trước report/mirror. Coordinator review diff chính xác, thêm mirror còn thiếu và sửa async i18n, badge native/vị trí phải, bỏ fallback WeakMap, snapshot trước request và chờ OData `requestObject`. Không có commit/push/PR Luna chưa review.

### Kiểm định và boundary

- PASS: QA UI/service, ESLint tập trung Bug UI, build Bug UI, secret scan, agent rules 8/8, QA-depth 15/15.
- Browser synthetic local PASS: Anh/Việt; chuông/badge/dialog native; 25 row đầu và Load More tới 50; mark-all đưa badge về 0; Escape trả focus; không overflow trang ở 375/768/1366/1920; dialog/load-more dùng được ở zoom 200%.
- Fixture browser dùng record giả không có PII và fake client chỉ cho interaction trực quan. QA client programmatic cùng QA service N1 kiểm contract client/service thật. Không phải acceptance BTP, migration persistence, data production, email thật hay NVDA.
- UI5/Fiori MCP không gọi được; dùng API/search UI5 chính thức, pattern repo, control runtime local, lint/build và accessibility tree browser.
- Config Fiori ESLint toàn app baseline import `@babel/eslint-parser` dev-only bị thiếu. N2 thêm config tập trung dùng `@eslint/js` đã lock cho file notification/Component đã đổi; không install hoặc đổi dependency/lock graph và không tuyên bố sửa lint toàn app.
- Review exact-head đầu tại `a3a61435d1affc73525baff1af6d30a989504ac3` trả NO-GO: 0 Critical / 1 Major / 3 Important / 3 Minor. Fix wave xử lý race local mark-all, icon/label category-event, refresh badge ngay sau assignment, reset error chung, bỏ setting ResponsivePopover thừa, dùng `InvisibleMessageMode.Polite` chính thức và sửa mirror cũ. Host không cài NVDA nên không tự tạo NVDA PASS. Tái sử dụng Knowledge Gate PASS theo xác nhận DonHV, không tạo assessment/điểm/ngày mới. Còn re-review exact-head mới, commit/push và một Draft N2 PR; chưa duyệt Ready/merge/deploy/N3.
