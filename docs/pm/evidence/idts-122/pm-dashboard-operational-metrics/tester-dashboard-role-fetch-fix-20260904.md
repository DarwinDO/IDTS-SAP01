# Tester Dashboard role-aware workload fetch — 2026-09-04

## English

### Defect and root cause

Signed-in Browser Control reproduced the defect with NhanT as `TESTER`. `AuthService.me()` returned HTTP 200 and the correct Tester profile. `BugService.Bugs` returned HTTP 200 with 18 visible rows, including 17 reported by this Tester and one current-action/retest row. The same page unconditionally requested `BugService.DeveloperWorkloads`; the server correctly returned HTTP 403 because that read is limited to active PM and Developer users. Since all requests shared one `Promise.all`, the expected authorization rejection entered the common error handler and discarded valid Tester Bug data.

### Narrow correction

`dashboard-page.js` now requests DeveloperWorkloads only for PM or Developer. Tester receives `{ value: [] }` locally and continues building the three existing Tester tiles and attention list from Bugs. Backend authorization, Bug visibility, dashboard business rules, persistence, and role definitions are unchanged. Bug UI cache identity advances to `0.0.11`.

### TDD and verification

The focused VM regression executes the real dashboard script with a Tester session, a successful Bugs response, and a 403 workload response if that endpoint is called. RED failed because the workload URL was called. GREEN passes with no workload call, the normal Tester role message, three tiles, and one focus row. Dashboard static/runtime suites, My Notifications UI, User Administration UI, IDTS-43 Fiori UX, direct JavaScript syntax/lint, configured Bug UI lint, and UI5 build pass. Release/rollout evidence is appended only after its actual boundary.

Codex Security diff scan `3690e042-d1bf-401d-8f46-823c1bbf60aa` reviewed exact source range `ed61ad7c6993bc667045ec370221b1fcc8ea10e5..ece1e039522a2d18bf13cac1eac7832b36220ade` and completed with zero findings across seven security surfaces. It confirms the client branch only suppresses a forbidden request and does not replace the unchanged CAP authorization. TAC was unavailable and session policy required the documented parent-only review fallback. The scanner's measured usage coverage is partial because rollout accounting was unavailable; security surface coverage is complete.

### Merge and live acceptance

PR #384 passed `qa-depth-gate` and merged normally into `dev` at `764320e59a429f5a222f238d9577db2e548a75de`. Dedicated content-only artifact `idts-tester-dashboard-764320e5.mtar` has SHA-256 `D4D8345C0159D4DA1849B7E24DA9F2B8AAC0E20AD7C2FABFDF87FDECE77A8113`; its nested content contains only `bug-management-ui.zip` and `user-administration-ui.zip`. The Bug UI reports version `0.0.11` and contains the role-aware workload condition. The User Administration UI remains version `1.0.20`.

Cloud Foundry operation `bad40d4e-a813-11f1-9946-eeee0a9ffd0f` deployed only `idts-user-admin-ui-r3c-content` and finished successfully. The CAP droplet GUID stayed `2382e503-e645-4ba2-bd03-e1b2c2b2ff5f`; no CAP, AppRouter, HDI, schema, data, provider, user, or role mutation occurred. Post-deploy `npm run btp:demo:check` returned `DEMO READY` with CAP/AppRouter `1/1`, HTTP 200 health/readiness/web checks, and the expected anonymous protected-API HTTP 401.

Fresh cache-busted Browser Control acceptance at `dashboard.html?cb=764320e59a` used signed-in Tester NhanT. The page showed the normal Tester guidance, tiles `Created by me = 13`, `Need my input = 1`, `Retest required = 1`, and eight populated `Needs attention` rows. The former unavailable message was absent. Browser Control's CDP event buffer did not expose the refresh request sequence reliably, so request-level live evidence is not claimed; the no-DeveloperWorkloads behavior is instead proven by the executable VM regression and the deployed artifact inspection.

## Tiếng Việt

### Lỗi và nguyên nhân gốc

Browser Control đã đăng nhập tái hiện lỗi bằng NhanT role `TESTER`. `AuthService.me()` trả HTTP 200 với profile Tester đúng. `BugService.Bugs` trả HTTP 200 với 18 row nhìn thấy được, gồm 17 Bug do Tester này report và một row đang chờ action/retest. Cùng page lại gọi `BugService.DeveloperWorkloads` vô điều kiện; server trả HTTP 403 đúng vì read này chỉ dành cho PM và Developer active. Vì mọi request nằm trong một `Promise.all`, lỗi phân quyền mong đợi đi vào error handler chung và xóa dữ liệu Bug Tester hợp lệ.

### Sửa hẹp

`dashboard-page.js` giờ chỉ gọi DeveloperWorkloads cho PM hoặc Developer. Tester nhận `{ value: [] }` cục bộ và tiếp tục dựng ba tile Tester cùng attention list hiện có từ Bugs. Phân quyền backend, visibility của Bug, business rule Dashboard, persistence và định nghĩa role không đổi. Cache identity Bug UI tăng lên `0.0.11`.

### TDD và kiểm định

Regression VM focused chạy script Dashboard thật với session Tester, response Bugs thành công và response workload 403 nếu endpoint đó bị gọi. RED fail vì workload URL đã bị gọi. GREEN pass khi không gọi workload, có role message Tester bình thường, ba tile và một focus row. Suite Dashboard static/runtime, My Notifications UI, User Administration UI, IDTS-43 Fiori UX, syntax/lint JavaScript trực tiếp, lint Bug UI theo config và UI5 build đều pass. Evidence release/rollout chỉ được bổ sung sau boundary thực tế.

Codex Security diff scan `3690e042-d1bf-401d-8f46-823c1bbf60aa` review exact source range `ed61ad7c6993bc667045ec370221b1fcc8ea10e5..ece1e039522a2d18bf13cac1eac7832b36220ade` và hoàn tất với zero finding trên bảy security surface. Scan xác nhận client branch chỉ bỏ request bị cấm và không thay thế authorization CAP không đổi. TAC không khả dụng và policy session yêu cầu fallback review parent-only đã document. Coverage thống kê usage của scanner là partial vì rollout accounting không khả dụng; coverage security surface là complete.

### Merge và kiểm tra live

PR #384 pass `qa-depth-gate` và được merge bình thường vào `dev` tại `764320e59a429f5a222f238d9577db2e548a75de`. Artifact content-only riêng `idts-tester-dashboard-764320e5.mtar` có SHA-256 `D4D8345C0159D4DA1849B7E24DA9F2B8AAC0E20AD7C2FABFDF87FDECE77A8113`; nested content chỉ gồm `bug-management-ui.zip` và `user-administration-ui.zip`. Bug UI báo version `0.0.11` và chứa điều kiện workload theo role. User Administration UI vẫn là version `1.0.20`.

Cloud Foundry operation `bad40d4e-a813-11f1-9946-eeee0a9ffd0f` chỉ deploy `idts-user-admin-ui-r3c-content` và hoàn tất thành công. CAP droplet GUID giữ nguyên `2382e503-e645-4ba2-bd03-e1b2c2b2ff5f`; không có mutation CAP, AppRouter, HDI, schema, data, provider, user hay role. Sau deploy, `npm run btp:demo:check` trả `DEMO READY`, CAP/AppRouter `1/1`, health/readiness/web HTTP 200 và protected API anonymous HTTP 401 đúng mong đợi.

Browser Control acceptance mới với cache-bust `dashboard.html?cb=764320e59a` dùng Tester NhanT đã đăng nhập. Page hiển thị hướng dẫn Tester bình thường, ba tile `Created by me = 13`, `Need my input = 1`, `Retest required = 1`, cùng tám row `Needs attention`. Thông báo unavailable cũ không còn. CDP event buffer của Browser Control không cung cấp ổn định chuỗi request khi Refresh, nên không claim network live; hành vi không gọi DeveloperWorkloads được chứng minh bằng regression VM thực thi và kiểm tra artifact đã deploy.
