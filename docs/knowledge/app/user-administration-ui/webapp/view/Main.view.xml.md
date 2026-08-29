# Knowledge: `app/user-administration-ui/webapp/view/Main.view.xml`

## N5-Lite unified filter / Filter hợp nhất N5-Lite

English: Digest is one additional option in the existing Delivery type filter. No new tab, table or action is introduced. The same responsive table renders the safe DTO, and the existing retry button remains hidden because Digest rows are read-only.

Tiếng Việt: Digest chỉ là một option mới trong filter Delivery type hiện có. Không thêm tab, table hoặc action mới. Cùng responsive table render DTO an toàn và nút retry hiện có vẫn ẩn vì row Digest read-only.

## English

Gate 5 adds a Business Catalogs tab with one catalog selector, search, inactive filter, refresh, Add, Edit, Activate, and Deactivate actions. A responsive table shows only safe business labels and state. No hard-delete, infrastructure, credential, or provider control exists.

## Tiếng Việt

Gate 5 them tab Business Catalogs co catalog selector, search, filter inactive, refresh, Add, Edit, Activate va Deactivate. Responsive table chi hien business label va state an toan. Khong co hard-delete, infrastructure, credential hay provider control.

## Gate 5 source anchors / Anchor source Gate 5

### English

The Business Catalogs tab is one nested `IconTabBar` under User Administration. It deliberately keeps the four catalog types as explicit user tasks rather than exposing a generic entity browser. The table has busy, empty, inactive-filter, search, and error states, and exposes only Add/Edit/Activate/Deactivate actions; there is no Delete control.

- **Location**: `Main.view.xml:276-286`, `businessCatalogs` and `catalogTypeTabs`.
  **IDTS concept**: Four bounded subviews: `SAP_MODULE`, `APPLICATION_COMPONENT`, `DEFECT_CATEGORY`, and `COMPONENT_CATEGORY`.
  **Impact if broken**: A catalog type can become unreachable or be collapsed into a generic editor that bypasses its business-specific validation.
  **Must check together**: `Main.controller.js:707-710`, `CATALOG_CONFIG`, and `srv/user-admin.cds:234-280`.

- **Location**: `Main.view.xml:287-325`, toolbar and `businessCatalogsTable`.
  **IDTS concept**: Search/inactive filter are presentation controls over a complete server-backed result; the table shows code/name/type/status and safe state-bound actions.
  **Impact if broken**: PM may see stale or incomplete catalog choices, or the UI may suggest a hard-delete workflow that the backend forbids.
  **Must check together**: `Main.controller.js:863-913`, `EditCatalogItem.fragment.xml`, i18n catalog keys, and the UI contract’s 205-row fixture.

### Tiếng Việt

Tab Business Catalogs là một `IconTabBar` lồng trong User Administration. UI cố ý giữ bốn catalog thành bốn task rõ ràng thay vì expose generic entity browser. Table có busy, empty, filter inactive, search và error state; chỉ có Add/Edit/Activate/Deactivate, không có Delete.

- **Vị trí**: `Main.view.xml:276-286`, `businessCatalogs` và `catalogTypeTabs`.
  **Khái niệm IDTS**: Bốn subview có boundary rõ: `SAP_MODULE`, `APPLICATION_COMPONENT`, `DEFECT_CATEGORY`, `COMPONENT_CATEGORY`.
  **Ảnh hưởng nếu sai**: Một catalog type có thể không mở được hoặc bị gom vào generic editor bỏ qua validation nghiệp vụ riêng.
  **Phải kiểm tra cùng**: `Main.controller.js:707-710`, `CATALOG_CONFIG` và `srv/user-admin.cds:234-280`.

- **Vị trí**: `Main.view.xml:287-325`, toolbar và `businessCatalogsTable`.
  **Khái niệm IDTS**: Search/filter inactive là control trình bày trên result đầy đủ từ server; table chỉ hiện code/name/type/status và action an toàn theo state.
  **Ảnh hưởng nếu sai**: PM có thể thấy lựa chọn catalog cũ/thiếu hoặc UI gợi ý hard-delete mà backend cấm.
  **Phải kiểm tra cùng**: `Main.controller.js:863-913`, `EditCatalogItem.fragment.xml`, i18n catalog keys và fixture 205 row của UI contract.

### Safe editing / Sửa an toàn

Keep visible text in i18n and keep CAP authorization/validation out of XML expressions. When adding a column or action, verify responsive behavior, no-delete semantics, value-state/fragment contracts, and CAP metadata together.

Giữ text hiển thị trong i18n và không đưa authorization/validation CAP vào XML expression. Khi thêm column/action, phải verify responsive behavior, no-delete semantics, contract value-state/fragment và metadata CAP cùng nhau.

## Gate 6 Operations and Audit tabs / Tab Operations và Audit Gate 6

### English

The view adds a separate `operations` tab with `deliveries` and `provisioning` subtabs at `Main.view.xml:276-383`, plus a separate `audit` tab at `Main.view.xml:385-425`. Each table has a dedicated JSON model, server-page load state, empty text, error `MessageStrip`, responsive `autoPopinMode`, safe detail dialog, and state-bound action buttons. Delivery shows only masked recipient and safe error summary; provisioning actions use the existing guarded Retry/Reconcile actions; audit shows a short fingerprint rather than a raw correlation or identity hash.

The readiness strip binds `emailDeliveryState`, `provisioningBrokerState`, and `lastSuccessfulReconciliationAt` with absolute named-model paths (`adminReadiness>/...`), while the error strip remains `adminReadiness>/error`. This keeps formatter inputs in the `adminReadiness` JSON model instead of relying on a row context. The three detail fragments use the proven `sapUiSmallMargin` container inset from `ActiveUserDetails` and keep `sapUiSmallMarginTop` between labels.

- **IDTS concept**: operations support is a business-facing administration screen, not a BTP cockpit or log viewer.
- **Impact if broken**: UI could expose raw email/provider data, show blind Retry for ambiguous/permanent outcomes, or load all history at once.
- **Must check together**: `Main.controller.js:98-157,1176-1330`, the three safe detail fragments, `srv/user-admin.cds:109-224`, and UI5 linter/build output.

### Tiếng Việt

View thêm tab riêng `operations` với subtab `deliveries` và `provisioning` tại `Main.view.xml:276-383`, cùng tab `audit` riêng tại `Main.view.xml:385-425`. Mỗi table dùng JSON model riêng, có state load theo page server, empty text, `MessageStrip` lỗi, responsive `autoPopinMode`, dialog detail an toàn và button theo state. Delivery chỉ hiện recipient đã mask và safe error summary; action provisioning tái sử dụng Retry/Reconcile đã có guard; audit hiện fingerprint ngắn thay vì correlation raw hoặc identity hash.

Readiness strip bind `emailDeliveryState`, `provisioningBrokerState` và `lastSuccessfulReconciliationAt` bằng path absolute của named model (`adminReadiness>/...`), còn error strip vẫn là `adminReadiness>/error`. Nhờ vậy formatter nhận input từ JSON model `adminReadiness`, không phụ thuộc row context. Ba fragment detail dùng inset container `sapUiSmallMargin` đã proven từ `ActiveUserDetails` và vẫn giữ `sapUiSmallMarginTop` giữa các label.

- **Khái niệm IDTS**: Operations là màn hình administration hướng business, không phải BTP cockpit hoặc log viewer.
- **Ảnh hưởng nếu sai**: UI có thể lộ email/provider raw, hiện Retry mù cho ambiguous/permanent hoặc load toàn bộ history một lần.
- **Phải kiểm tra cùng**: `Main.controller.js:98-157,1176-1330`, ba fragment detail an toàn, `srv/user-admin.cds:109-224` và output UI5 linter/build.

### Safe editing / Sửa an toàn

Keep each tab bound to its own model and load only the selected operations subtab. Do not add raw persistence properties to XML bindings; add a safe DTO field and a contract test first. Keep technical support codes in controlled details, while table labels remain friendly and localized.

Giữ mỗi tab bind vào model riêng và chỉ load subtab operations đang chọn. Không bind raw persistence property vào XML; phải thêm safe DTO field và contract test trước. Code support kỹ thuật chỉ được hiện ở details có kiểm soát, còn label table phải thân thiện và được localize.

## Gate 6.2 state and action ownership / State và ownership action Gate 6.2

### English

The main `administrationTabs` `IconTabBar` at `Main.view.xml:28-35` has five parent business areas: Access, Developers, Operations, Business Catalogs and Audit. Access owns the `accessSubtabs` child boundary for Requests and Active Users; Developers owns `developerSubtabs` for Responsibilities and reserves the same native child boundary for the later Workload increment. The parent bar keeps native SAPUI5 `headerMode="Inline"`, compact density and end overflow, with one localized tooltip per parent area.

- **Location**: `Main.view.xml:37-221`, Access and its child tabs.
  **IDTS concept**: Requests and Active Users are sibling views under one Access area, so a filtered request list cannot define the availability of Active User actions.
  **Impact if broken**: Navigation and action ownership can drift, or a details action can disappear merely because Requests is filtered.
  **Must check together**: `Main.controller.js:onOpenActiveUserDetails`, `ActiveUserDetails.fragment.xml`, the Active Users contract, and the focused UI test.

- **Location**: `Main.view.xml:41-108`, the Access Requests table.
  **IDTS concept**: Request rows expose only request-owned Approve, Retry, Reconcile and Cancel controls, with visibility derived from request state or the server-owned `cancelEligible` flag.
  **Impact if broken**: A request row could suggest a lifecycle or Developer-profile mutation that belongs to an Active User or Developer workspace.
  **Must check together**: `Main.controller.js` request action handlers, `srv/user-admin.cds` action inputs, and the filtered-request regression.

Active User details owns the lifecycle actions Change Role, Suspend, Reactivate and Revoke. The detail fragment gates those actions by the server-derived access state and Developer role; the request table does not duplicate them.

- **Location**: `Main.view.xml:222-281`, Developers and the Responsibilities table.
  **IDTS concept**: Manage Responsibilities is a Developer-owned action. The table is fed by Developer rows, and the Manage button is visible only when `activeUsers>accessState` is `ACTIVE`; Active User details does not duplicate this action.
  **Impact if broken**: A non-active Developer could be offered a profile mutation, or a non-Developer could receive a misleading responsibility action.
  **Must check together**: `ActiveUserDetails.fragment.xml`, `Main.controller.js:onOpenDeveloperProfile`, `ManageDeveloperProfile.fragment.xml`, and the focused UI contract.

### Tiếng Việt

`IconTabBar` chính `administrationTabs` tại `Main.view.xml:28-35` có năm khu vực nghiệp vụ cấp cao: Access, Developers, Operations, Business Catalogs và Audit. Access sở hữu boundary child `accessSubtabs` cho Requests và Active Users; Developers sở hữu `developerSubtabs` cho Responsibilities và giữ cùng boundary native cho increment Workload sau này. Parent bar vẫn dùng `headerMode="Inline"`, compact density và end overflow native của SAPUI5, cùng một tooltip đã localize cho mỗi khu vực.

- **Vị trí**: `Main.view.xml:37-221`, Access và các child tab.
  **Khái niệm IDTS**: Requests và Active Users là hai view cùng cấp dưới Access, vì vậy filtered request list không được quyết định việc Active User action có tồn tại hay không.
  **Ảnh hưởng nếu sai**: Navigation và ownership action có thể lệch nhau, hoặc action ở details biến mất chỉ vì Requests đang bị filter.
  **Phải kiểm tra cùng**: `Main.controller.js:onOpenActiveUserDetails`, `ActiveUserDetails.fragment.xml`, contract Active Users và UI test tập trung.

- **Vị trí**: `Main.view.xml:41-108`, table Access Requests.
  **Khái niệm IDTS**: Dòng request chỉ expose Approve, Retry, Reconcile và Cancel thuộc request; visibility lấy từ request state hoặc flag `cancelEligible` do server quản lý.
  **Ảnh hưởng nếu sai**: Dòng request có thể gợi ý mutation lifecycle hoặc Developer profile vốn thuộc Active User hoặc workspace Developer.
  **Phải kiểm tra cùng**: handler request action trong `Main.controller.js`, input action của `srv/user-admin.cds` và regression filtered-request.

Active User details sở hữu các lifecycle action Change Role, Suspend, Reactivate và Revoke. Fragment details gate các action này theo access state và role Developer do server suy ra; table request không lặp lại chúng.

- **Vị trí**: `Main.view.xml:222-281`, Developers và table Responsibilities.
  **Khái niệm IDTS**: Manage Responsibilities là action thuộc Developer. Table nhận các row Developer, còn button Manage chỉ visible khi `activeUsers>accessState` là `ACTIVE`; Active User details không lặp lại action này.
  **Ảnh hưởng nếu sai**: Developer không active có thể bị gợi ý mutation profile, hoặc user không phải Developer nhận action responsibility gây hiểu nhầm.
  **Phải kiểm tra cùng**: `ActiveUserDetails.fragment.xml`, `Main.controller.js:onOpenDeveloperProfile`, `ManageDeveloperProfile.fragment.xml` và UI contract tập trung.

### Safe editing / Sửa an toàn

Keep the five parent areas, the Access/Developers child boundaries, and the ownership-specific visibility expressions aligned. Keep request actions on request rows, lifecycle actions in Active User details, and Developer profile maintenance on active Developer paths. Do not move CAP authorization or server-owned state decisions into XML.

Giữ đồng bộ năm khu vực cấp cao, boundary child Access/Developers và expression visibility theo ownership. Giữ request action trên dòng request, lifecycle action trong Active User details và profile maintenance trên path Developer active. Không chuyển authorization CAP hoặc quyết định state do server quản lý vào XML.

## Gate 6.3 Workload overview / Tổng quan workload Gate 6.3

### English

The Developers child `IconTabBar` places `developerWorkload` before `developerResponsibilities`. The Workload view is a responsive read-only table bound to `workload>/items`; it has search, Refresh, independent error/busy state, server-page `Load more`, and a `View workload` action. It displays safe business fields: Developer name/email, availability, server-derived identity access readiness, open/limit, current Developer action count, overdue count, effort, and workload state. The localized column is `Access readiness`; internal profile/user IDs are not bound into the visible XML.

- **Location**: `Main.view.xml` Workload `IconTabFilter`, `developerWorkloadTable`, and the `View workload` button.
  **IDTS concept**: Developer workload is a business-owned read-only workspace; responsibility mutation stays in the separate Responsibilities area and Bug mutation stays in Bug Management.
  **Impact if broken**: Users may confuse capacity monitoring with profile editing or believe a Workload button changes assignment/status.
  **Must check together**: `Main.controller.js:onDeveloperTabSelect`, `onOpenDeveloperWorkload`, the `workload` JSONModel, `DeveloperWorkloadDetails.fragment.xml`, and `test-user-admin-ui.js`/`test-user-admin-workload.js`.

- **Location**: Workload table bindings for `openLimit`, `needsDeveloperAction`, `overdue`, `estimatedEffort`, and workload state.
  **IDTS concept**: Semantic states communicate overload and overdue attention only; color is not an authorization decision. The explanatory strip separates technical assignee from the current action owner.
  **Impact if broken**: An overloaded color could be read as access denial, or a Developer could mistake the next workflow processor for the technical assignee.
  **Must check together**: `formatter.js` workload functions, localized keys in all three bundles, and Bug detail ownership columns.

### Tiếng Việt

`IconTabBar` con của Developers đặt `developerWorkload` trước `developerResponsibilities`. View Workload là table responsive chỉ đọc bind vào `workload>/items`; có search, Refresh, error/busy state độc lập, `Load more` theo page server và action `View workload`. View chỉ hiện field nghiệp vụ an toàn: tên/email Developer, availability, access readiness do server tính, open/limit, số action hiện tại của Developer, overdue, effort và workload state. Column được localize là `Access readiness`; internal profile/user ID không được bind vào XML hiển thị.

- **Vị trí**: `IconTabFilter` Workload, `developerWorkloadTable` và button `View workload` trong `Main.view.xml`.
  **Khái niệm IDTS**: Workload Developer là workspace chỉ đọc thuộc Developers; mutation responsibility nằm ở khu vực Responsibilities riêng, mutation Bug nằm ở Bug Management.
  **Ảnh hưởng nếu sai**: User có thể nhầm monitoring capacity với chỉnh profile hoặc nghĩ button Workload sẽ đổi assignment/status.
  **Phải kiểm tra cùng**: `Main.controller.js:onDeveloperTabSelect`, `onOpenDeveloperWorkload`, JSONModel `workload`, `DeveloperWorkloadDetails.fragment.xml` và `test-user-admin-ui.js`/`test-user-admin-workload.js`.

- **Vị trí**: binding table Workload cho `openLimit`, `needsDeveloperAction`, `overdue`, `estimatedEffort` và workload state.
  **Khái niệm IDTS**: Semantic state chỉ truyền đạt overload và overdue cần chú ý; màu không phải quyết định authorization. Info strip tách technical assignee với current action owner.
  **Ảnh hưởng nếu sai**: Màu overloaded có thể bị hiểu là access bị từ chối hoặc Developer nhầm processor bước tiếp theo với technical assignee.
  **Phải kiểm tra cùng**: function workload trong `formatter.js`, key localize ở cả ba bundle và các column ownership trong detail Bug.

### Safe editing / Sửa an toàn

Keep native IconTabBar/table responsiveness and keep the Workload table read-only. Do not bind internal IDs, raw errors, provider fields, or write actions into the view. Update all locale keys and the focused UI tests when labels, states, columns, or action ownership changes.

Giữ responsive native của IconTabBar/table và giữ table Workload chỉ đọc. Không bind internal ID, raw error, provider field hoặc write action vào view. Khi đổi label, state, column hoặc ownership action, phải cập nhật cả locale keys và UI test tập trung.

## Gate 6.3 Actions-column alignment remediation / Remediation alignment cột Actions Gate 6.3

### English

The Workload table declares a dedicated localized `Workload status` column between Estimated effort and Actions. This keeps the nine declared columns aligned with the nine row cells, so the existing workload-state `ObjectStatus` remains informational and the existing transparent `View workload` button renders in the final Actions cell. No controller, handler, write action, or backend contract changes.

- **Impact if broken**: the status cell can consume the Actions column and UI5 can omit the extra button cell, making workload details and the Bug Management deep-link unreachable.
- **Must check together**: all three i18n bundles, `scripts/qa/test-user-admin-workload.js`, `DeveloperWorkloadDetails.fragment.xml`, and browser acceptance.

### Tiếng Việt

Table Workload khai báo cột i18n `Trạng thái workload` riêng giữa Effort ước tính và Actions. Nhờ đó chín cột khai báo khớp với chín cell của row, `ObjectStatus` trạng thái workload hiện có vẫn chỉ cung cấp thông tin và nút transparent `View workload` hiện có được render ở cell Actions cuối. Không đổi controller, handler, write action hoặc contract backend.

- **Ảnh hưởng nếu sai**: cell trạng thái có thể chiếm cột Actions và UI5 có thể bỏ cell nút bị dư, khiến details workload và deep-link Bug Management không thể truy cập.
- **Phải kiểm tra cùng**: cả ba bundle i18n, `scripts/qa/test-user-admin-workload.js`, `DeveloperWorkloadDetails.fragment.xml` và browser acceptance.

## Gate 6.4 Back to Bug Management action / Action quay lại Bug Management Gate 6.4

**English.** `DynamicPageTitle.actions` places one transparent, localized `nav-back` button before the existing emphasized Invite User button. It calls `.onOpenBugManagement`; no custom CSS or second navigation shell is introduced. If the order or handler breaks, PMs lose the clear return path while Invite remains the page's primary action. Check `Main.controller.js`, all three i18n bundles, and `scripts/qa/test-user-admin-ui.js` together.

**Tiếng Việt.** `DynamicPageTitle.actions` đặt một nút transparent `nav-back` đã localize trước nút Invite User emphasized hiện có. Nút gọi `.onOpenBugManagement`; không thêm custom CSS hoặc navigation shell thứ hai. Nếu thứ tự hoặc handler sai, PM mất đường quay lại rõ ràng trong khi Invite vẫn phải là primary action của trang. Kiểm tra cùng `Main.controller.js`, cả ba bundle i18n và `scripts/qa/test-user-admin-ui.js`.

## Gate 6.5 one Delivery table and type filter / Một bảng Delivery và filter type Gate 6.5

### English

Operations → Delivery keeps the existing table and uses one native `Select` for All types, Invitation, Access change, and read-only Daily digest plus two localized columns for Type and Event. Existing recipient/status/attempt/time/details/retry cells remain in the same row. Retry calls `.onRetryDelivery` only when server `canRetry` is true; no new tab, dialog, page, or custom CSS is introduced.

- **Location**: `Main.view.xml:386-393` — delivery type `Select`.
  **IDTS concept**: PM filters three delivery domains without splitting operational diagnosis.
  **Impact if broken**: access rows can be hidden, mislabeled, or loaded through an invalid type.
  **Must check together**: controller filter/session state, all i18n bundles, and server type allowlist.
- **Location**: `Main.view.xml:397-414` — Type/Event columns and normalized row labels.
  **IDTS concept**: users can distinguish invitation from the four material access events while recipient remains masked.
  **Impact if broken**: row/column parity can hide the retry/details action or expose technical codes.
  **Must check together**: `_normalizeDeliveryRow`, exact column/cell contract, and responsive build.

### Tiếng Việt

Operations → Delivery giữ bảng hiện có và dùng một `Select` native cho Tất cả loại, Thư mời, Thay đổi quyền truy cập và Bản tổng hợp hằng ngày read-only, cùng hai cột localized Loại và Sự kiện. Các cell recipient/status/attempt/time/details/retry hiện có vẫn trong cùng row. Retry chỉ gọi `.onRetryDelivery` khi `canRetry` từ server là true; không thêm tab, dialog, page hoặc custom CSS.

- **Vị trí**: `Main.view.xml:386-393` — `Select` delivery type.
  **Khái niệm IDTS**: PM filter ba domain delivery mà không tách chẩn đoán vận hành.
  **Ảnh hưởng nếu sai**: row access có thể bị ẩn, gắn nhãn sai hoặc load qua type không hợp lệ.
  **Phải kiểm tra cùng**: filter/session state controller, toàn bộ i18n bundle và allowlist type server.
- **Vị trí**: `Main.view.xml:397-414` — cột Type/Event và label row đã normalize.
  **Khái niệm IDTS**: user phân biệt invitation với bốn event access có ý nghĩa trong khi recipient vẫn được che.
  **Ảnh hưởng nếu sai**: parity row/column có thể làm mất action retry/details hoặc lộ technical code.
  **Phải kiểm tra cùng**: `_normalizeDeliveryRow`, contract exact column/cell và responsive build.

**Safe editing / Sửa an toàn:** Keep native responsive controls and one table/dialog; preserve existing handlers and visibility expressions. / Giữ control responsive native và một table/dialog; giữ handler cùng visibility expression hiện có.
