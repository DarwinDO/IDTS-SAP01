# Knowledge: `app/user-administration-ui/webapp/controller/Main.controller.js`

## English

The controller keeps the existing Active Users detail flow and adds a state-bound existing-identity link dialog. `onOpenExistingIdentityLink` trusts only the safe server `linkEligible` flag, passes the safe current `businessRole` into the read-only dialog, and never passes provider/identity internals. `onConfirmExistingIdentityLink` validates the email, lowercases the action payload, prevents double submit, sends exactly `userID` and `email`, reloads Requests and Active Users through the shared action helper, and reports only queued status.

## Tiếng Việt

Controller giữ flow details Active Users hiện có và thêm dialog link identity theo state. `onOpenExistingIdentityLink` chỉ tin Boolean `linkEligible` an toàn do server trả, truyền `businessRole` hiện tại an toàn vào dialog read-only và không truyền provider/identity internals. `onConfirmExistingIdentityLink` validate email, lowercase payload action, chặn double submit, chỉ gửi `userID` và `email`, reload Requests và Active Users qua action helper dùng chung, và chỉ báo trạng thái queued.

## Gate 4 Developer responsibility administration

`onConfirmDeveloperProfile` requires a reason and one explicit confirmation before calling the existing optimistic `updateDeveloperProfile` action. A synchronous controller guard and the `developer>/submitting` state prevent double submit across the asynchronous confirmation/action boundary. Success reloads Access Requests and Active Users so readiness and impact counts do not stay stale; CAP remains authoritative for validation, version conflicts, persistence and assignment eligibility.

`onConfirmDeveloperProfile` yêu cầu reason và một confirmation rõ ràng trước khi gọi action optimistic `updateDeveloperProfile` hiện có. Guard đồng bộ ở controller cùng state `developer>/submitting` chặn double submit xuyên qua boundary confirm/action bất đồng bộ. Khi thành công, UI reload Access Requests và Active Users để readiness/impact count không bị cũ; CAP vẫn là nguồn chính cho validation, version conflict, persistence và assignment eligibility.

## Gate 5 Business Catalogs

### Gate 5 remediation detail / Chi tiet remediation Gate 5

#### English

The controller adds the read-first Business Catalogs tab while keeping CAP authoritative for authorization, normalization, uniqueness, ETag conflicts, dependency checks, and audit. UI5 reads use `requestContexts(0, Infinity)`: the service still caps each OData request at 100, but the binding follows next pages so local search and inactive filtering operate on the complete selected catalog. The controller keeps OData contexts for native ETag-aware writes and uses one explicit `catalogChanges` API update group.

#### Important source anchors

- **Location**: `app/user-administration-ui/webapp/controller/Main.controller.js:10-15` — `CATALOG_CONFIG`.
  **IDTS concept**: The UI payload is allowlisted per catalog: code/name for simple catalogs, optional `componentType`/`categoryType` for classification labels, and parent IDs for Component Category pairs.
  **Impact if broken**: The dialog can send unsupported fields, omit type metadata, or construct a Component Category without its two classification parents.
  **Must check together**: `srv/user-admin.cds:252-293`, `srv/user-admin/catalogs.js:14-52`, `EditCatalogItem.fragment.xml`, and the UI/CAP contract tests.

- **Location**: `app/user-administration-ui/webapp/controller/Main.controller.js:773-819` — `onConfirmCatalogEdit` and `_submitCatalogChanges`.
  **IDTS concept**: Required-field errors are exposed through JSON-model value-state messages; CREATE waits for `Context.created()`, while UPDATE waits for every `Context.setProperty` promise after `submitBatch`.
  **Impact if broken**: A 409/412 inside a successful HTTP batch can be mistaken for success, the dialog can close with a false toast, or the UI can hang on a transient context.
  **Must check together**: UI5 `ODataModel.submitBatch`, `Context.created`, `Context.setProperty`, `EditCatalogItem.fragment.xml`, and `scripts/qa/test-user-admin-ui.js:223-233,427-489`.

- **Location**: `app/user-administration-ui/webapp/controller/Main.controller.js:885-937` — `_loadCatalogs`, `_ensureCatalogLookups`, `_applyCatalogFilters`.
  **IDTS concept**: Complete catalog/lookup reads feed display names for Component Category and include `displayType`; local search can match code, display name, or type beyond the first server page.
  **Impact if broken**: A PM could fail to find a valid catalog item simply because it is row 101+, or see an ID-only/ambiguous Component Category label.
  **Must check together**: `srv/user-admin.cds:236-293` query cap, `Main.view.xml:276-318`, and the 205-row paging/search fixture in `scripts/qa/test-user-admin-ui.js:380-489`.

- **Location**: `app/user-administration-ui/webapp/controller/Main.controller.js:803-861` — activation/deactivation and `_updateCatalogRow`.
  **IDTS concept**: Activation is direct; deactivation first invokes count-only `readCatalogImpact`, asks for a bounded reason, then submits the ETag-aware active change through the same explicit update group.
  **Impact if broken**: The UI could hide active dependencies, deactivate without an explanation, or update a stale row without CAP conflict protection.
  **Must check together**: `CatalogImpact.fragment.xml`, `srv/user-admin/catalogs.js:166-187,291-319`, and `srv/user-admin.cds:193-196`.

#### Tiếng Việt

Controller thêm tab Business Catalogs theo hướng read-first và vẫn giữ CAP là authority cho authorization, normalize, uniqueness, ETag conflict, dependency check và audit. UI5 read dùng `requestContexts(0, Infinity)`: service vẫn giới hạn mỗi OData request ở 100, nhưng binding tự đi qua next page để local search và filter inactive dùng toàn bộ catalog đang chọn. Controller giữ OData context cho write native có ETag và dùng một update group API tên `catalogChanges`.

#### Các điểm neo source quan trọng

- **Vị trí**: `app/user-administration-ui/webapp/controller/Main.controller.js:10-15` — `CATALOG_CONFIG`.
  **Khái niệm IDTS**: UI payload allowlist theo từng catalog: code/name cho catalog đơn, type tùy chọn `componentType`/`categoryType` cho nhãn classification và hai parent ID cho cặp Component Category.
  **Ảnh hưởng nếu sai**: Dialog có thể gửi field không hỗ trợ, bỏ type metadata hoặc tạo Component Category thiếu hai parent classification.
  **Phải kiểm tra cùng**: `srv/user-admin.cds:252-293`, `srv/user-admin/catalogs.js:14-52`, `EditCatalogItem.fragment.xml` và CAP/UI contract test.

- **Vị trí**: `app/user-administration-ui/webapp/controller/Main.controller.js:773-819` — `onConfirmCatalogEdit` và `_submitCatalogChanges`.
  **Khái niệm IDTS**: Lỗi required field được đưa vào JSON-model value-state message; CREATE chờ `Context.created()`, còn UPDATE chờ mọi promise `Context.setProperty` sau `submitBatch`.
  **Ảnh hưởng nếu sai**: Lỗi 409/412 bên trong batch HTTP thành công có thể bị coi là success, dialog đóng với toast giả hoặc UI treo ở transient context.
  **Phải kiểm tra cùng**: `ODataModel.submitBatch`, `Context.created`, `Context.setProperty` của UI5, `EditCatalogItem.fragment.xml` và `scripts/qa/test-user-admin-ui.js:223-233,427-489`.

- **Vị trí**: `app/user-administration-ui/webapp/controller/Main.controller.js:885-937` — `_loadCatalogs`, `_ensureCatalogLookups`, `_applyCatalogFilters`.
  **Khái niệm IDTS**: Read catalog/lookup đầy đủ dùng để hiện display name của Component Category và có `displayType`; local search match code, display name hoặc type kể cả sau page đầu.
  **Ảnh hưởng nếu sai**: PM không tìm được catalog hợp lệ chỉ vì row ở vị trí 101+, hoặc thấy Component Category bằng ID khó hiểu.
  **Phải kiểm tra cùng**: query cap trong `srv/user-admin.cds:236-293`, `Main.view.xml:276-318` và fixture paging/search 205 row trong `scripts/qa/test-user-admin-ui.js:380-489`.

- **Vị trí**: `app/user-administration-ui/webapp/controller/Main.controller.js:803-861` — activate/deactivate và `_updateCatalogRow`.
  **Khái niệm IDTS**: Activate đi thẳng; deactivate phải gọi `readCatalogImpact` count-only, yêu cầu reason có giới hạn rồi submit active change có ETag qua cùng update group.
  **Ảnh hưởng nếu sai**: UI có thể bỏ qua dependency active, deactivate không reason hoặc update row cũ mà không có conflict protection CAP.
  **Phải kiểm tra cùng**: `CatalogImpact.fragment.xml`, `srv/user-admin/catalogs.js:166-187,291-319` và `srv/user-admin.cds:193-196`.

#### Safe editing / Sửa an toàn

Do not move authorization or conflict rules into this controller. Keep user-visible text in both locale files, preserve the same OData context for ETag updates, and never report success until the inner create/update promise resolves. If the service cap changes, rerun the complete-result test and inspect loading performance before changing the UI to a different paging design.

Không chuyển authorization hoặc conflict rule vào controller. Giữ text user-facing ở cả hai locale, giữ cùng OData context cho update có ETag và không báo success trước khi promise create/update bên trong resolve. Nếu service cap đổi, phải chạy lại test complete-result và kiểm tra performance load trước khi đổi thiết kế paging UI.

The controller loads at most 100 rows from one selected catalog, applies local search/inactive display filtering, preserves OData contexts for native ETag-aware updates, prevents double submit, and requests count-only impact before deactivation. CAP remains authoritative for authorization, normalization, conflicts, dependencies, and audit.

Controller load toi da 100 row cua catalog dang chon, filter search/inactive o UI, giu OData context cho update native co ETag, chan double submit va doc impact count-only truoc deactivate. CAP van la authority cho authorization, normalization, conflict, dependency va audit.

## Gate 6 Operations and Audit controller flow / Luồng controller Operations và Audit Gate 6

### English

The controller creates separate `deliveries`, `operations`, `audit`, and `adminReadiness` JSON models in `onInit`. `onTabSelect` and `onOperationsTabSelect` provide lazy loading: only the selected Operations subtab is requested, while Audit is loaded only when selected. `_loadDeliveries`, `_loadOperations`, and `_loadAudit` pass explicit server filters with skip/top 25-page state and preserve loading/error/empty behavior through the models. `onOpenDeliveryDetails`, `onOpenOperationDetails`, and `onOpenAuditDetails` open only safe detail fragments.

Delivery retry passes only `deliveryID` plus the optimistic `modifiedAt` and reloads the delivery list/readiness after success. Provisioning Retry/Reconcile uses the existing action names and sends only operation ID/version. Session storage now retains Operations/Audit tab and filter state without storing credentials or raw response data.

- **Location**: `Main.controller.js:98-157` — tab/filter/action entry points.
  **IDTS concept**: UI state is bound to server-owned safe DTOs and state-valid actions.
  **Impact if broken**: stale filters or duplicate submits can make the UI claim an operation that CAP rejected.
  **Must check together**: `Main.view.xml:276-425`, `scripts/qa/test-user-admin-ui.js`, and CAP action contracts.

- **Location**: `Main.controller.js:1176-1330` — lazy loaders and operation action helper.
  **IDTS concept**: bounded server pagination and post-action reload keep operational data current without merging it into Requests/Active Users.
  **Impact if broken**: the UI may enumerate oversized results, show stale retry eligibility, or load provider data eagerly.
  **Must check together**: `srv/user-admin/operations-audit.js:65-286`, `adminReadiness`, and UI5 linter/build.

- **Location**: `Main.controller.js:_normalizeAuditDate` and `_loadAudit`.
  **IDTS concept**: DatePicker `yyyy-MM-dd` values are converted explicitly to valid UTC `Edm.DateTimeOffset` boundaries (`T00:00:00.000Z` / `T23:59:59.999Z`); empty or invalid values become `null`.
  **Impact if broken**: browser-dependent coercion could reject audit requests or silently shift the selected date range.
  **Must check together**: `srv/user-admin.cds` Timestamp parameters and `scripts/qa/test-user-admin-ui.js` runtime parameter assertions.

- **Location**: `Main.controller.js:_loadReadiness`.
  **IDTS concept**: SAPUI5 `ODataContextBinding.invoke()` resolves to a `Context`; the controller calls that returned context's `requestObject()` (or the bound context fallback), then normalizes a direct structured result or `{ value: structuredResult }` before setting top-level `adminReadiness` fields and clearing busy/error.
  **Impact if broken**: readiness indicators can remain `UNKNOWN` even after a successful action, or a stale busy state can block Operations UI recovery.
  **Must check together**: `srv/user-admin.cds:readAdministrationReadiness`, `scripts/qa/test-user-admin-ui.js` readiness runtime cases, and the `adminReadiness` bindings in `Main.view.xml`.

### Tiếng Việt

Controller tạo riêng các JSON model `deliveries`, `operations`, `audit` và `adminReadiness` trong `onInit`. `onTabSelect` và `onOperationsTabSelect` lazy load: chỉ request subtab Operations đang chọn, còn Audit chỉ load khi được chọn. `_loadDeliveries`, `_loadOperations` và `_loadAudit` gửi filter server explicit với page skip/top 25 và giữ state loading/error/empty trong model. `onOpenDeliveryDetails`, `onOpenOperationDetails` và `onOpenAuditDetails` chỉ mở fragment detail an toàn.

Retry delivery chỉ gửi `deliveryID` và optimistic `modifiedAt`, sau success reload list/readiness. Retry/Reconcile provisioning dùng đúng action hiện có và chỉ gửi operation ID/version. Session storage giữ tab/filter Operations/Audit mà không lưu credential hoặc raw response.

- **Vị trí**: `Main.controller.js:98-157` — entry point tab/filter/action.
  **Khái niệm IDTS**: UI state bind vào safe DTO và action do server kiểm soát.
  **Ảnh hưởng nếu sai**: filter cũ hoặc submit trùng có thể làm UI báo operation mà CAP đã reject.
  **Phải kiểm tra cùng**: `Main.view.xml:276-425`, `scripts/qa/test-user-admin-ui.js` và CAP action contract.

- **Vị trí**: `Main.controller.js:1176-1330` — lazy loader và operation action helper.
  **Khái niệm IDTS**: server pagination có giới hạn và reload sau action giúp operational data mới mà không trộn vào Requests/Active Users.
  **Ảnh hưởng nếu sai**: UI có thể enumerate result quá lớn, hiện retry eligibility cũ hoặc eager-load provider data.
  **Phải kiểm tra cùng**: `srv/user-admin/operations-audit.js:65-286`, `adminReadiness` và UI5 linter/build.

- **Vị trí**: `Main.controller.js:_normalizeAuditDate` và `_loadAudit`.
  **Khái niệm IDTS**: value `yyyy-MM-dd` của DatePicker được đổi explicit thành boundary UTC hợp lệ cho `Edm.DateTimeOffset` (`T00:00:00.000Z` / `T23:59:59.999Z`); value rỗng/invalid thành `null`.
  **Ảnh hưởng nếu sai**: coercion tùy browser có thể reject audit request hoặc lệch ngày filter.
  **Phải kiểm tra cùng**: parameter Timestamp trong `srv/user-admin.cds` và assertion runtime trong `scripts/qa/test-user-admin-ui.js`.

- **Vị trí**: `Main.controller.js:_loadReadiness`.
  **Khái niệm IDTS**: `ODataContextBinding.invoke()` của SAPUI5 resolve thành `Context`; controller gọi `requestObject()` của context đó (hoặc bound context fallback), rồi normalize result structured trực tiếp hoặc `{ value: structuredResult }` trước khi set field top-level `adminReadiness` và clear busy/error.
  **Ảnh hưởng nếu sai**: indicator readiness có thể vẫn `UNKNOWN` dù action thành công, hoặc busy cũ chặn UI Operations recovery.
  **Phải kiểm tra cùng**: `readAdministrationReadiness` trong `srv/user-admin.cds`, readiness runtime cases trong `scripts/qa/test-user-admin-ui.js` và binding `adminReadiness` trong `Main.view.xml`.

### Safe editing / Sửa an toàn

Keep CAP authorization, optimistic checks, and safe mapping out of the controller. Any new operation action needs a model, lazy-load path, disabled/busy state, safe error copy, reload behavior, and a UI contract test before it is exposed in XML.

Giữ authorization CAP, optimistic check và safe mapping ở backend, không chuyển vào controller. Action operation mới phải có model, lazy-load path, busy/disabled state, error copy an toàn, reload behavior và UI contract test trước khi expose trong XML.
