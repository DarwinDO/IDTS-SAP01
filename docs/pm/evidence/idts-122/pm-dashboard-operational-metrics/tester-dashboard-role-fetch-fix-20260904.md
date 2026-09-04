# Tester Dashboard role-aware workload fetch — 2026-09-04

## English

### Defect and root cause

Signed-in Browser Control reproduced the defect with NhanT as `TESTER`. `AuthService.me()` returned HTTP 200 and the correct Tester profile. `BugService.Bugs` returned HTTP 200 with 18 visible rows, including 17 reported by this Tester and one current-action/retest row. The same page unconditionally requested `BugService.DeveloperWorkloads`; the server correctly returned HTTP 403 because that read is limited to active PM and Developer users. Since all requests shared one `Promise.all`, the expected authorization rejection entered the common error handler and discarded valid Tester Bug data.

### Narrow correction

`dashboard-page.js` now requests DeveloperWorkloads only for PM or Developer. Tester receives `{ value: [] }` locally and continues building the three existing Tester tiles and attention list from Bugs. Backend authorization, Bug visibility, dashboard business rules, persistence, and role definitions are unchanged. Bug UI cache identity advances to `0.0.11`.

### TDD and verification

The focused VM regression executes the real dashboard script with a Tester session, a successful Bugs response, and a 403 workload response if that endpoint is called. RED failed because the workload URL was called. GREEN passes with no workload call, the normal Tester role message, three tiles, and one focus row. Dashboard static/runtime suites, My Notifications UI, User Administration UI, IDTS-43 Fiori UX, direct JavaScript syntax/lint, configured Bug UI lint, and UI5 build pass. Release/rollout evidence is appended only after its actual boundary.

## Tiếng Việt

### Lỗi và nguyên nhân gốc

Browser Control đã đăng nhập tái hiện lỗi bằng NhanT role `TESTER`. `AuthService.me()` trả HTTP 200 với profile Tester đúng. `BugService.Bugs` trả HTTP 200 với 18 row nhìn thấy được, gồm 17 Bug do Tester này report và một row đang chờ action/retest. Cùng page lại gọi `BugService.DeveloperWorkloads` vô điều kiện; server trả HTTP 403 đúng vì read này chỉ dành cho PM và Developer active. Vì mọi request nằm trong một `Promise.all`, lỗi phân quyền mong đợi đi vào error handler chung và xóa dữ liệu Bug Tester hợp lệ.

### Sửa hẹp

`dashboard-page.js` giờ chỉ gọi DeveloperWorkloads cho PM hoặc Developer. Tester nhận `{ value: [] }` cục bộ và tiếp tục dựng ba tile Tester cùng attention list hiện có từ Bugs. Phân quyền backend, visibility của Bug, business rule Dashboard, persistence và định nghĩa role không đổi. Cache identity Bug UI tăng lên `0.0.11`.

### TDD và kiểm định

Regression VM focused chạy script Dashboard thật với session Tester, response Bugs thành công và response workload 403 nếu endpoint đó bị gọi. RED fail vì workload URL đã bị gọi. GREEN pass khi không gọi workload, có role message Tester bình thường, ba tile và một focus row. Suite Dashboard static/runtime, My Notifications UI, User Administration UI, IDTS-43 Fiori UX, syntax/lint JavaScript trực tiếp, lint Bug UI theo config và UI5 build đều pass. Evidence release/rollout chỉ được bổ sung sau boundary thực tế.
