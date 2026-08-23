# Knowledge: `app/user-administration-ui/webapp/manifest.json`

## English

The UI5 manifest identifies the User Administration application, its OData V4 service, models, minimum UI5 version, libraries, and application release. `sap.app/applicationVersion/version` is the HTML5 application version presented to the repository and must match `package.json`. Version `1.0.9` forces the generic Cancel invitation resource bundle to be treated as new content instead of reusing the cached `1.0.8` application.

Version `1.0.10` publishes the Gate 4 responsibility-confirmation content as a distinct HTML5 release while keeping routes and data sources unchanged.

All routing and OData settings remain unchanged. A version-only release must not add destinations, credentials, private endpoints, or authorization decisions; CAP remains authoritative for `cancelEligible` and the mutation itself.

## Tiếng Việt

UI5 manifest định danh ứng dụng User Administration, OData V4 service, model, UI5 version tối thiểu, library và release ứng dụng. `sap.app/applicationVersion/version` là version HTML5 app đưa vào repository và phải khớp `package.json`. Version `1.0.9` buộc resource bundle Cancel invitation tổng quát được xem là content mới thay vì dùng lại app `1.0.8` đã cache.

Version `1.0.10` phát hành content confirmation responsibility Gate 4 thành một HTML5 release riêng và giữ nguyên route/data source.

Toàn bộ routing và OData setting giữ nguyên. Release chỉ tăng version không được thêm destination, credential, endpoint private hoặc quyết định authorization; CAP vẫn là nguồn chính xác cho `cancelEligible` và mutation Cancel.

### Important source anchors

- **Location**: `sap.app.applicationVersion.version`.
  **IDTS concept**: Browser-visible HTML5 release version.
  **Impact if broken**: A successful content deployment can continue serving stale labels or controls.
  **Must check together**: app `package.json`, app `package-lock.json`, generated cache-buster metadata, and fresh live-browser acceptance.
