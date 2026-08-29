# Knowledge: `app/user-administration-ui/webapp/manifest.json`

The application version follows package `1.0.18` for the N5-Lite content cache identity; routing and models are unchanged. / Version ứng dụng theo package `1.0.18` cho cache identity N5-Lite; routing và model không đổi.

## English

The UI5 manifest identifies the User Administration application, its OData V4 service, models, minimum UI5 version, libraries, and application release. `sap.app/applicationVersion/version` is the HTML5 application version presented to the repository and must match `package.json`. Version `1.0.9` forces the generic Cancel invitation resource bundle to be treated as new content instead of reusing the cached `1.0.8` application.

Version `1.0.10` publishes the Gate 4 responsibility-confirmation content as a distinct HTML5 release while keeping routes and data sources unchanged.

All routing and OData settings remain unchanged. A version-only release must not add destinations, credentials, private endpoints, or authorization decisions; CAP remains authoritative for `cancelEligible` and the mutation itself.

## Tiếng Việt

UI5 manifest định danh ứng dụng User Administration, OData V4 service, model, UI5 version tối thiểu, library và release ứng dụng. `sap.app/applicationVersion/version` là version HTML5 app đưa vào repository và phải khớp `package.json`. Version `1.0.9` buộc resource bundle Cancel invitation tổng quát được xem là content mới thay vì dùng lại app `1.0.8` đã cache.

Version `1.0.10` phát hành content confirmation responsibility Gate 4 thành một HTML5 release riêng và giữ nguyên route/data source.

Version `1.0.11` publishes the source-candidate Business Catalogs UI while keeping the same OData V4 data source, libraries, routes, and authorization boundary.

Version `1.0.11` phat hanh UI Business Catalogs source-candidate, van giu nguyen OData V4 data source, library, route va authorization boundary.

Version `1.0.15` publishes the Gate 6.3 Workload Actions-column remediation as a distinct browser-visible release while preserving the reviewed OData models, routes and authorization boundary.

Version `1.0.15` phát hành remediation cột Actions của Workload Gate 6.3 thành một release riêng cho browser, đồng thời giữ nguyên các OData model, route và authorization boundary đã review.

Toàn bộ routing và OData setting giữ nguyên. Release chỉ tăng version không được thêm destination, credential, endpoint private hoặc quyết định authorization; CAP vẫn là nguồn chính xác cho `cancelEligible` và mutation Cancel.

### Important source anchors

- **Location**: `sap.app.applicationVersion.version`.
  **IDTS concept**: Browser-visible HTML5 release version.
  **Impact if broken**: A successful content deployment can continue serving stale labels or controls.
  **Must check together**: app `package.json`, app `package-lock.json`, generated cache-buster metadata, and fresh live-browser acceptance.

## Gate 6.3 named BugService model / Model BugService có tên Gate 6.3

### English

The `sap.app.dataSources.bugService` declaration points User Administration to the existing same-origin `/odata/v4/bug/` endpoint. The named `sap.ui5.models.bugApi` model uses OData V4 server operation mode, `autoExpandSelect`, and `earlyRequests: false`, so the workload tab starts reads only when the Developer Workload area is selected. The model is read-only by use: the controller binds lists and requests contexts but never creates, updates, or deletes through it.

- **IDTS concept**: User Administration consumes BugService workload truth instead of introducing a second workload aggregate.
- **Impact if broken**: Workload rows could be calculated from stale browser data, the first page could be mistaken for the full result, or the UI could accidentally acquire a Bug mutation path.
- **Must check together**: `Main.controller.js:_loadDeveloperWorkloads` and `_loadDeveloperWorkloadBugs`, `srv/service.cds:420-444` (`BugService.DeveloperWorkloads` and safe `Bugs` projection), `srv/bug-service/monitoring.js`, and `scripts/qa/test-user-admin-workload.js`.

### Tiếng Việt

Khai báo `sap.app.dataSources.bugService` trỏ User Administration tới endpoint cùng origin đã có `/odata/v4/bug/`. Model có tên `sap.ui5.models.bugApi` dùng OData V4 với server operation mode, `autoExpandSelect` và `earlyRequests: false`, nên tab Workload chỉ bắt đầu đọc khi user mở khu vực Developer Workload. Cách sử dụng model là read-only: controller chỉ bind list và request context, không create, update hoặc delete qua model này.

- **Khái niệm IDTS**: User Administration dùng workload truth từ BugService thay vì tạo aggregate workload thứ hai.
- **Ảnh hưởng nếu sai**: Row workload có thể bị tính từ dữ liệu browser cũ, page đầu bị hiểu là toàn bộ kết quả hoặc UI vô tình có đường mutation Bug.
- **Phải kiểm tra cùng**: `Main.controller.js:_loadDeveloperWorkloads` và `_loadDeveloperWorkloadBugs`, `srv/service.cds:420-444` (`BugService.DeveloperWorkloads` và projection `Bugs` an toàn), `srv/bug-service/monitoring.js` và `scripts/qa/test-user-admin-workload.js`.

### Safe editing / Sửa an toàn

Keep `bugService` same-origin and keep `bugApi` named and server-paged. Do not add credentials, hard-coded domains, destinations, or mutation settings. If the BugService contract changes, update the controller `$select` allowlist, the workload mirror, and the focused contract test together.

Giữ `bugService` cùng origin và giữ `bugApi` là model có tên, paging phía server. Không thêm credential, domain hard-code, destination hoặc setting mutation. Nếu contract BugService đổi, phải cập nhật cùng nhau allowlist `$select` của controller, mirror workload và contract test tập trung.

## Gate 6.4 release identity / Release identity Gate 6.4

**English.** `sap.app.applicationVersion.version` is `1.0.16`, aligned with `package.json` and both lockfile root versions. This gives the Back action a fresh HTML5 cache identity without changing models, routes, dependencies, or runtime behavior.

**Tiếng Việt.** `sap.app.applicationVersion.version` là `1.0.16`, đồng bộ `package.json` và cả hai version root trong lockfile. Nhờ vậy action Back có cache identity HTML5 mới mà không đổi model, route, dependency hoặc behavior runtime.

## Gate 6.5 release identity / Release identity Gate 6.5

### English

`sap.app.applicationVersion.version` is now `1.0.17`, aligned with package and lock metadata. Gate 6.5 changes no data source, route, model, component dependency, or AppRouter path; the existing `mainService` continues to serve the new bounded actions.

- **Location**: `app/user-administration-ui/webapp/manifest.json:10` — application version.
  **IDTS concept**: cache-safe delivery of the reviewed unified Operations UI.
  **Impact if broken**: deployed content may serve stale controls/copy or claim a version different from the package.
  **Must check together**: `package.json:3`, `package-lock.json:3,9`, UI build, and later live content readback.

### Tiếng Việt

`sap.app.applicationVersion.version` giờ là `1.0.17`, đồng bộ package và lock metadata. Gate 6.5 không đổi data source, route, model, component dependency hoặc AppRouter path; `mainService` hiện có tiếp tục phục vụ action bounded mới.

- **Vị trí**: `app/user-administration-ui/webapp/manifest.json:10` — version ứng dụng.
  **Khái niệm IDTS**: phân phối UI Operations hợp nhất đã review với cache an toàn.
  **Ảnh hưởng nếu sai**: content deploy có thể phục vụ control/copy cũ hoặc khai báo version khác package.
  **Phải kiểm tra cùng**: `package.json:3`, `package-lock.json:3,9`, UI build và readback content live ở gate sau.

**Safe editing / Sửa an toàn:** Keep the main OData model and routing unchanged in this version-only manifest delta. / Giữ nguyên main OData model và routing trong delta manifest chỉ đổi version này.
