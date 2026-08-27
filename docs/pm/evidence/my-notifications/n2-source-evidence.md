# My Notifications N2 source evidence

## English

Draft handoff: exactly one PR was created — [#362](https://github.com/DarwinDO/IDTS-SAP01/pull/362), OPEN/Draft targeting `dev`, initially pushed at `d5035f873e9da9eb2619e5939b8ebad2182f8c4c`. Reviewed source remains `8b902ce3e4b44c15d04e6a99f1b22f79348a5bbc`; post-review/PR closure is documentation only. Final GitHub head/check readback is recorded in the handoff. Worktree and exact-lock-parity dependency junctions remain preserved.

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
- First exact-head review at `a3a61435d1affc73525baff1af6d30a989504ac3` returned NO-GO: 0 Critical / 1 Major / 3 Important / 3 Minor. Fix wave closed mark-all local-state races, category/event icon/label, immediate post-assignment badge refresh, shared error reset, native ResponsivePopover behavior and stale mirror wording. Re-review at `5acb98f21eec456a2232ac1e1aa07064118e6406` closed those findings but found one new Major: an invalid standalone `InvisibleMessageMode` module import. RED now checks the real module; exact-head `8b902ce3e4b44c15d04e6a99f1b22f79348a5bbc` imports supported `sap/ui/core/library`. Final same-reviewer scoped verdict is GO with 0 Critical / 0 Major / 0 Important. NVDA is not installed; no NVDA PASS is fabricated. Existing Knowledge Gate PASS is reused by DonHV confirmation; no new assessment/score/date. Push and one Draft N2 PR are authorized; Ready/merge/deploy/N3 are not.

## Tiếng Việt

Bàn giao Draft: đã tạo đúng một PR [#362](https://github.com/DarwinDO/IDTS-SAP01/pull/362), OPEN/Draft vào `dev`, head push đầu `d5035f873e9da9eb2619e5939b8ebad2182f8c4c`. Source đã review giữ tại `8b902ce3e4b44c15d04e6a99f1b22f79348a5bbc`; closure sau review/PR chỉ đổi docs. Exact head/check cuối đọc từ GitHub trong handoff. Giữ worktree và junction dependency đúng lock parity.

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
- Review đầu tại `a3a61435` NO-GO 0 Critical / 1 Major / 3 Important / 3 Minor. Fix wave đóng race local mark-all, icon/label category-event, refresh badge sau assignment, reset error chung, ResponsivePopover native và mirror cũ. Re-review `5acb98f2` đóng finding đó nhưng phát hiện một Major import module `InvisibleMessageMode` không tồn tại. RED mới kiểm module thật; exact head `8b902ce3e4b44c15d04e6a99f1b22f79348a5bbc` import `sap/ui/core/library` được hỗ trợ. Cùng reviewer trả GO cuối với 0 Critical / 0 Major / 0 Important. Host không cài NVDA nên không tạo NVDA PASS. Dùng Knowledge Gate PASS đã xác nhận, không tạo assessment/điểm/ngày mới. Được push và mở một Draft N2 PR; chưa duyệt Ready/merge/deploy/N3.

## 2026-08-27 Browser Control accessibility follow-up

### English

- Environment: Microsoft Edge Browser Control against the local synthetic fixture only. The fixture contained 55 generated non-personal notifications and did not access BTP, production data, providers, email, users or roles.
- The initial accessibility tree exposed the bell as a button named `Open My Notifications (55 unread)`.
- Keyboard Enter opened a dialog named `My Notifications`. Its tree exposed the `Mark all as read` button, `Read state` listbox with `All`/`Unread`/`Read`, `Category` combobox with `All`/`Bug`/`Access`, notification titles, literal unread/read state, category, localized event label, action-required state, summary and occurred time.
- Paging showed 25 rows initially and 50 after `Load more`. The read-state and category controls exposed selected-state semantics.
- `Mark all as read` changed the bell name to `Open My Notifications (0 unread)`. Escape closed the dialog and returned DOM focus to that exact bell button.
- Edge console readback returned zero warnings and zero errors.
- Scope statement: this is a Browser Control keyboard/accessibility-tree/focus PASS. NVDA 2026.1.1 was installed successfully, but Browser Control cannot capture NVDA speech output; therefore no NVDA audio/speech PASS is claimed. A human listening pass with NVDA remains the final optional assistive-technology acceptance item.

### Tiếng Việt

- Môi trường: Browser Control trên Microsoft Edge chỉ chạy fixture local. Fixture có 55 notification giả, không có dữ liệu cá nhân và không truy cập BTP, dữ liệu production, provider, email, user hoặc role thật.
- Accessibility tree ban đầu nhận nút chuông là button có tên `Open My Notifications (55 unread)`.
- Enter bằng bàn phím mở dialog tên `My Notifications`. Tree nhận được nút `Mark all as read`, listbox `Read state` với `All`/`Unread`/`Read`, combobox `Category` với `All`/`Bug`/`Access`, title notification, trạng thái unread/read dạng chữ, category, event label đã dịch, action-required, summary và thời điểm xảy ra.
- Paging hiển thị 25 row đầu và 50 row sau `Load more`. Bộ lọc trạng thái đọc và category expose semantics selected đúng.
- `Mark all as read` đổi tên nút chuông thành `Open My Notifications (0 unread)`. Escape đóng dialog và trả DOM focus về đúng nút chuông đó.
- Edge console readback có 0 warning và 0 error.
- Giới hạn kết luận: đây là PASS về keyboard/accessibility tree/focus bằng Browser Control. NVDA 2026.1.1 đã cài thành công, nhưng Browser Control không thu được nội dung giọng đọc NVDA; vì vậy không tự nhận NVDA audio/speech PASS. Một lượt người thật nghe NVDA vẫn là hạng mục acceptance công nghệ hỗ trợ cuối, mang tính tùy chọn.
