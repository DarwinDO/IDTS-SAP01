# Knowledge: `app/user-administration-ui/webapp/controller/Main.controller.js`

## N5-Lite Digest normalization / Normalize Digest N5-Lite

English: the existing delivery normalizer accepts only the new `DIGEST` type/event labels and otherwise preserves the same safe fields. The server owns masking and authorization; the browser does not infer retryability and receives `canRetry=false` for Digest rows. Breakpoint `_normalizeDeliveryRow` to compare the CAP DTO with the JSON model row.

Tiếng Việt: normalizer delivery hiện có chỉ thêm label type/event `DIGEST`, còn lại giữ nguyên field an toàn. Server làm authority cho masking và authorization; browser không tự suy luận retry và nhận `canRetry=false` cho row Digest. Đặt breakpoint `_normalizeDeliveryRow` để so DTO CAP với row trong JSON model.

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

## Gate 6.3 Developer workload and Bug drill-down / Workload Developer và drill-down Bug Gate 6.3

### English

`onInit` creates the independent `workload` JSONModel with `items`, `query`, `nextSkip`, `pageSize: 100`, `hasMore`, `loaded`, `busy`, `error`, `selectedDeveloper`, `bugs`, `bugsBusy`, and `bugsError`. The selected Developer child tab is stored in session state so returning to User Administration does not silently switch the user to another Developer workspace. The `bugApi` model is deliberately separate from the User Administration default model.

The Workload `WORKLOAD_SELECT` allowlist requests `identityAccessReady`, and normalization consumes only that server-provided Boolean. It never infers access readiness from `active`, `developerUserID`, profile state, or assignment counts; the label is localized as `Access readiness`. The backend remains authoritative for identity-link readiness and DeveloperWorkloads authorization.

Allowlist `WORKLOAD_SELECT` của Workload có request field `identityAccessReady`, và normalize chỉ consume Boolean do server trả. Controller không tự suy luận readiness từ `active`, `developerUserID`, profile state hoặc assignment count; label được localize là `Access readiness`. Backend vẫn là authority cho identity-link readiness và authorization của DeveloperWorkloads.

- **Location**: `Main.controller.js:const WORKLOAD_ORDER`, `const WORKLOAD_SELECT`, and `const WORKLOAD_BUG_SELECT`.
  **IDTS concept**: The UI declares the exact server ordering and bounded field contracts for aggregate rows and Bug details.
  **Impact if broken**: Page-boundary order can drift, a detail read can expose descriptions/comments/audit/provider data, or later code can accidentally depend on a broad Bug payload.
  **Must check together**: named `bugApi` in `manifest.json`, `srv/service.cds` BugService projections, the approved Gate 6.3 design, and `test-user-admin-workload.js`.

- **Location**: `Main.controller.js:_loadDeveloperWorkloads`.
  **IDTS concept**: Read-only DeveloperWorkloads consumption. The binding requests the server order `isOverloaded desc, overdueOwnedBugCount desc, developerName asc, developerProfileID asc`, caps each page at 100, normalizes numeric values and the server `identityAccessReady` Boolean, preserves page order when appending, and de-duplicates only by the Developer Profile key.
  **Impact if broken**: PM could see a different priority order on the second page, duplicate Developers, misleading effort/count values, or a workload error could overwrite unrelated User Administration state.
  **Must check together**: `srv/bug-service/monitoring.js:readDeveloperWorkloads`, `Main.view.xml` Workload table, and page-boundary/error assertions in `scripts/qa/test-user-admin-workload.js`.

- **Location**: `Main.controller.js:_loadDeveloperWorkloadBugs` and `_normalizeDeveloperWorkloadBug`.
  **IDTS concept**: A selected Developer receives only non-Closed Bugs assigned to the technical `assignee_ID`, with the allowlisted fields `ID`, `bugNumber`, `title`, status/priority/severity codes, due date, effort, technical assignee display name, and current action owner display name.
  **Impact if broken**: The Workload area could change assignment/status, confuse technical ownership with next action ownership, or leak collaboration, identity, provider, or audit content.
  **Must check together**: `srv/service.cds:Bugs`, `srv/bug-service/monitoring.js` ownership semantics, `DeveloperWorkloadDetails.fragment.xml`, and the closed-exclusion/current-owner/field-allowlist assertions.

- **Location**: `Main.controller.js:_isWorkloadBugOverdue`, `_bugObjectPageUrl`, and `openBugInManagement`.
  **IDTS concept**: Overdue is a UTC date-only comparison; the current date is not overdue. A valid UUID becomes the exact relative Bug Object Page route `/idtsbugmanagementui/index.html#/Bugs(ID=<uuid>,IsActiveEntity=true)`. Invalid IDs produce no navigation.
  **Impact if broken**: Bugs due today could be incorrectly escalated, a malformed link could navigate to an unintended route, or the code could hard-code a tenant domain/new authentication flow.
  **Must check together**: Bug Management routing, `DeveloperWorkloadDetails.fragment.xml`, and malformed-ID/deep-link/UTC-boundary tests.

### Tiếng Việt

`onInit` tạo JSONModel độc lập `workload` với `items`, `query`, `nextSkip`, `pageSize: 100`, `hasMore`, `loaded`, `busy`, `error`, `selectedDeveloper`, `bugs`, `bugsBusy` và `bugsError`. Tab con Developer được lưu trong session state để khi quay lại User Administration, màn hình không tự chuyển sang Developer workspace khác. Model `bugApi` được tách khỏi default model của User Administration.

- **Vị trí**: `Main.controller.js:const WORKLOAD_ORDER`, `const WORKLOAD_SELECT` và `const WORKLOAD_BUG_SELECT`.
  **Khái niệm IDTS**: UI khai báo order phía server và contract field bounded cho aggregate row và detail Bug.
  **Ảnh hưởng nếu sai**: Thứ tự giữa các page có thể lệch, detail read có thể lộ description/comment/audit/provider data hoặc code sau này phụ thuộc vào payload Bug quá rộng.
  **Phải kiểm tra cùng**: model `bugApi` trong `manifest.json`, projection BugService trong `srv/service.cds`, design Gate 6.3 đã duyệt và `test-user-admin-workload.js`.

- **Vị trí**: `Main.controller.js:_loadDeveloperWorkloads`.
  **Khái niệm IDTS**: Đọc DeveloperWorkloads chỉ đọc. Binding yêu cầu order `isOverloaded desc, overdueOwnedBugCount desc, developerName asc, developerProfileID asc`, giới hạn mỗi page tối đa 100, normalize numeric value và Boolean `identityAccessReady` do server trả, giữ thứ tự khi append và chỉ deduplicate theo key Developer Profile.
  **Ảnh hưởng nếu sai**: PM có thể thấy page sau khác thứ tự ưu tiên, Developer bị lặp, count/effort sai hoặc lỗi workload ghi đè state khác của User Administration.
  **Phải kiểm tra cùng**: `srv/bug-service/monitoring.js:readDeveloperWorkloads`, table Workload trong `Main.view.xml` và assertion page-boundary/error trong `scripts/qa/test-user-admin-workload.js`.

- **Vị trí**: `Main.controller.js:_loadDeveloperWorkloadBugs` và `_normalizeDeveloperWorkloadBug`.
  **Khái niệm IDTS**: Developer được chọn chỉ nhận Bug chưa Closed có `assignee_ID` là technical owner, cùng allowlist `ID`, `bugNumber`, `title`, status/priority/severity code, due date, effort, tên technical assignee và current action owner.
  **Ảnh hưởng nếu sai**: Khu vực Workload có thể đổi assignment/status, đánh đồng ownership kỹ thuật với người xử lý bước tiếp theo hoặc lộ collaboration, identity, provider hay audit content.
  **Phải kiểm tra cùng**: `srv/service.cds:Bugs`, ownership semantics trong `srv/bug-service/monitoring.js`, `DeveloperWorkloadDetails.fragment.xml` và assertion closed-exclusion/current-owner/field-allowlist.

- **Vị trí**: `Main.controller.js:_isWorkloadBugOverdue`, `_bugObjectPageUrl` và `openBugInManagement`.
  **Khái niệm IDTS**: Overdue dùng so sánh date-only theo UTC; Bug đến hạn hôm nay chưa quá hạn. UUID hợp lệ tạo exact relative Bug Object Page route `/idtsbugmanagementui/index.html#/Bugs(ID=<uuid>,IsActiveEntity=true)`. ID sai không tạo navigation.
  **Ảnh hưởng nếu sai**: Bug đến hạn hôm nay có thể bị đánh dấu sai, link hỏng có thể đi tới route ngoài ý muốn hoặc code hard-code domain tenant/new auth flow.
  **Phải kiểm tra cùng**: routing Bug Management, `DeveloperWorkloadDetails.fragment.xml` và test malformed-ID/deep-link/UTC-boundary.

### Safe editing / Sửa an toàn

Keep workload reads read-only and keep the two ownership concepts visible as separate fields. Do not add write actions, persistence, client-side aggregation, raw IDs to rendered text, or broad Bug `$select` fields. Changes to ordering, page size, or allowlist require a focused RED/GREEN contract update first.

Giữ workload read-only và giữ hai khái niệm ownership hiển thị thành hai field riêng. Không thêm write action, persistence, client-side aggregation, raw ID vào text render hoặc field Bug ngoài allowlist. Mọi thay đổi order, page size hoặc allowlist phải cập nhật contract RED/GREEN tập trung trước.
## Gate 6.2 state and action ownership / State và ownership action Gate 6.2

### English

The controller owns two independent catalog models. `developerCatalogs` contains only availability, responsibility-level, SAP-module and Component Category value helps used by invitation, role-transition and responsibility forms. `businessCatalogs` contains only the selected administration catalog, complete rows, filters, edit state, impact and lookup rows. Loading or failing one model cannot overwrite the other.

Top-level session state is now `access`, `developers`, `operations`, `businessCatalogs` or `audit`. Access and Developers retain their selected child tab separately. Lifecycle actions continue to use the existing CAP actions but are opened from Active User details; responsibility administration accepts either an Active User summary/detail row and always resolves the same server-owned user ID.

`onOpenActiveUserDetails` invokes `readActiveUserDetails` and builds the lifecycle action snapshot only from the details DTO: an integer `accessRequestVersion`, `businessRole`, `userAdminCapability`, and the server-owned `userID`. It does not search `requests>/items` or depend on the current Access Requests filter. When the details DTO has no safe integer version, `_request` is null and the lifecycle handlers do not open an action. The resulting minimal snapshot carries only the optimistic token needed by CAP; it is not a copy of a request row and contains no provider or identity internals.

`onOpenActiveUserRoleChange`, Suspend, Reactivate and Revoke are therefore opened from the Active User details state and pass that details-derived version to the existing CAP action. Manage Responsibilities is a separate Developer-owned path exposed by the Developers table only; the table contains only Developer rows and requires `accessState === 'ACTIVE'`. The controller loads the independent `developerCatalogs` model before the profile dialog and never uses Business Catalog edit state as a value-help source.

Change Role starts with `currentRole === role` and no Developer profile read. A Developer profile is created only when the target changes from a non-Developer role to `DEVELOPER`; same-role confirmation is rejected before any OData action.

### Tiếng Việt

Controller sở hữu hai catalog model độc lập. `developerCatalogs` chỉ chứa value help availability, responsibility level, SAP module và Component Category cho invitation, chuyển role và form responsibility. `businessCatalogs` chỉ chứa catalog quản trị đang chọn, toàn bộ row, filter, edit state, impact và lookup. Load hoặc lỗi của model này không được ghi đè model kia.

Session state cấp cao giờ chỉ là `access`, `developers`, `operations`, `businessCatalogs` hoặc `audit`; Access và Developers giữ child tab riêng. Action lifecycle vẫn gọi CAP action hiện có nhưng được mở từ Active User details. Manage Responsibilities nhận row summary/details và luôn dùng cùng user ID do server quản lý.

`onOpenActiveUserDetails` gọi `readActiveUserDetails` và chỉ dựng snapshot action lifecycle từ DTO details: `accessRequestVersion` là integer, `businessRole`, `userAdminCapability` và `userID` do server quản lý. Controller không tìm trong `requests>/items` và không phụ thuộc Access Requests đang filter thế nào. Nếu DTO details không có version integer an toàn, `_request` là null và lifecycle handler không mở action. Snapshot tối thiểu này chỉ giữ optimistic token cần cho CAP; nó không copy nguyên request row và không chứa identity/provider internals.

Vì vậy `onOpenActiveUserRoleChange`, Suspend, Reactivate và Revoke đều mở từ state của Active User details và gửi version lấy từ details tới CAP action hiện có. Manage Responsibilities là path riêng thuộc Developer và chỉ được expose ở table Developers; table chỉ chứa row Developer và yêu cầu `accessState === 'ACTIVE'`. Controller load model `developerCatalogs` độc lập trước dialog profile và không dùng edit state của Business Catalog làm value-help source.

Change Role khởi tạo `currentRole === role` và không đọc Developer profile. Profile chỉ được tạo khi chuyển thật từ role không phải Developer sang `DEVELOPER`; chọn lại cùng role bị chặn trước mọi OData action.

## Gate 6.4 same-session navigation / Điều hướng cùng session Gate 6.4

**English.** `onOpenBugManagement()` calls guarded `window.location.assign("/idtsbugmanagementui/index.html")`. The fixed same-origin path keeps the current tab and AppRouter session, and it carries no token, domain, query, fragment, or `returnTo`. The guard makes the method a no-op when the browser navigation API is unavailable. This handler performs no OData call or data mutation.

**Tiếng Việt.** `onOpenBugManagement()` gọi có guard `window.location.assign("/idtsbugmanagementui/index.html")`. Path cùng origin cố định giữ tab hiện tại và AppRouter session, không mang token, domain, query, fragment hoặc `returnTo`. Guard làm handler không thao tác khi API navigation của browser không có. Handler không gọi OData và không thay đổi dữ liệu.

## Gate 6.5 unified Delivery controller / Controller Delivery hợp nhất Gate 6.5

### English

The existing `deliveries` JSON model gains one persisted allowlisted type (`ALL`, `INVITATION`, `ACCESS_CHANGE`). `_loadDeliveries` calls only `searchAdministrationDeliveries`, preserves busy/error/refresh/load-more request ordering, and normalizes the approved DTO into friendly localized type/event labels, masked/safe text, and em-dash timestamp fallbacks. `onRetryDelivery` accepts exactly the two concrete row types and dispatches the corresponding OData action; unknown or missing types show the existing safe error and call no action.

- **Location**: `Main.controller.js:20-31,1266-1297` — label allowlists and `_normalizeDeliveryRow`.
  **IDTS concept**: UI consumes only the safe DTO and never infers raw access/provider meaning.
  **Impact if broken**: unknown codes can be shown as valid events, empty details become ambiguous, or unsafe fields can leak into the model.
  **Must check together**: three i18n bundles, `DeliveryDetails.fragment.xml`, and safe-field UI tests.
- **Location**: `Main.controller.js:247-250,1570-1593` — type filter and unified loader.
  **IDTS concept**: one Operations table over server-bounded invitation/access data with preserved paging state.
  **Impact if broken**: changing filters can mix stale pages, duplicate rows, or call the legacy invitation-only endpoint.
  **Must check together**: `Main.view.xml:386-410`, `srv/user-admin/operations-audit.js:107-202`, and paging tests.
- **Location**: `Main.controller.js:282-294` — `onRetryDelivery`.
  **IDTS concept**: exact-type fail-closed retry dispatch while CAP remains authoritative.
  **Impact if broken**: an unknown/access row can fall back to `retryOnboardingDelivery` or bypass confirmation.
  **Must check together**: `srv/user-admin.cds:242-248`, backend retry guards, and unknown/missing-type regression.
- **Location**: `Main.controller.js:1705-1761` — session-state type read/write.
  **IDTS concept**: Delivery filter state survives dialogs/refresh without accepting arbitrary stored values.
  **Impact if broken**: stale or malicious session state can request an invalid delivery type.
  **Must check together**: filter options and `administrationDeliveryType` server validation.

### Tiếng Việt

JSON model `deliveries` hiện có thêm một type allowlist được lưu trong session (`ALL`, `INVITATION`, `ACCESS_CHANGE`). `_loadDeliveries` chỉ gọi `searchAdministrationDeliveries`, giữ busy/error/refresh/load-more và thứ tự request, rồi normalize DTO đã duyệt thành label type/event thân thiện đã localize, text đã che/an toàn và fallback timestamp em dash. `onRetryDelivery` chỉ nhận hai type row cụ thể và dispatch action OData tương ứng; type lạ hoặc thiếu hiện lỗi an toàn hiện có và không gọi action.

- **Vị trí**: `Main.controller.js:20-31,1266-1297` — allowlist label và `_normalizeDeliveryRow`.
  **Khái niệm IDTS**: UI chỉ dùng DTO an toàn và không suy diễn raw access/provider meaning.
  **Ảnh hưởng nếu sai**: code lạ có thể hiện như event hợp lệ, detail rỗng mơ hồ hoặc field không an toàn leak vào model.
  **Phải kiểm tra cùng**: ba i18n bundle, `DeliveryDetails.fragment.xml` và test safe field UI.
- **Vị trí**: `Main.controller.js:247-250,1570-1593` — filter type và loader hợp nhất.
  **Khái niệm IDTS**: một bảng Operations trên dữ liệu invitation/access bounded từ server với paging state được giữ.
  **Ảnh hưởng nếu sai**: đổi filter có thể trộn page stale, trùng row hoặc gọi endpoint chỉ invitation cũ.
  **Phải kiểm tra cùng**: `Main.view.xml:386-410`, `srv/user-admin/operations-audit.js:107-202` và test paging.
- **Vị trí**: `Main.controller.js:282-294` — `onRetryDelivery`.
  **Khái niệm IDTS**: dispatch retry fail-closed theo exact type, CAP vẫn authoritative.
  **Ảnh hưởng nếu sai**: row lạ/access có thể fallback sang `retryOnboardingDelivery` hoặc bỏ confirmation.
  **Phải kiểm tra cùng**: `srv/user-admin.cds:242-248`, guard retry backend và regression type lạ/thiếu.
- **Vị trí**: `Main.controller.js:1705-1761` — đọc/ghi type trong session state.
  **Khái niệm IDTS**: filter Delivery sống qua dialog/refresh mà không nhận giá trị stored tùy ý.
  **Ảnh hưởng nếu sai**: session state stale hoặc độc hại có thể request delivery type không hợp lệ.
  **Phải kiểm tra cùng**: option filter và validation server `administrationDeliveryType`.

### Safe editing / Sửa an toàn

Reuse the one model, table, dialog, formatter, and action helper. Keep unknown types fail-closed, never add raw body/provider/audit/lock fields, and do not treat UI `canRetry` as authorization.

Tái sử dụng một model, table, dialog, formatter và action helper. Giữ type lạ fail-closed, không thêm raw body/provider/audit/lock field và không xem `canRetry` UI là authorization.
