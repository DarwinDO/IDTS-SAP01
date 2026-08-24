# Knowledge: `app/user-administration-ui/webapp/view/Main.view.xml`

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

- **IDTS concept**: operations support is a business-facing administration screen, not a BTP cockpit or log viewer.
- **Impact if broken**: UI could expose raw email/provider data, show blind Retry for ambiguous/permanent outcomes, or load all history at once.
- **Must check together**: `Main.controller.js:98-157,1176-1330`, the three safe detail fragments, `srv/user-admin.cds:109-224`, and UI5 linter/build output.

### Tiếng Việt

View thêm tab riêng `operations` với subtab `deliveries` và `provisioning` tại `Main.view.xml:276-383`, cùng tab `audit` riêng tại `Main.view.xml:385-425`. Mỗi table dùng JSON model riêng, có state load theo page server, empty text, `MessageStrip` lỗi, responsive `autoPopinMode`, dialog detail an toàn và button theo state. Delivery chỉ hiện recipient đã mask và safe error summary; action provisioning tái sử dụng Retry/Reconcile đã có guard; audit hiện fingerprint ngắn thay vì correlation raw hoặc identity hash.

- **Khái niệm IDTS**: Operations là màn hình administration hướng business, không phải BTP cockpit hoặc log viewer.
- **Ảnh hưởng nếu sai**: UI có thể lộ email/provider raw, hiện Retry mù cho ambiguous/permanent hoặc load toàn bộ history một lần.
- **Phải kiểm tra cùng**: `Main.controller.js:98-157,1176-1330`, ba fragment detail an toàn, `srv/user-admin.cds:109-224` và output UI5 linter/build.

### Safe editing / Sửa an toàn

Keep each tab bound to its own model and load only the selected operations subtab. Do not add raw persistence properties to XML bindings; add a safe DTO field and a contract test first. Keep technical support codes in controlled details, while table labels remain friendly and localized.

Giữ mỗi tab bind vào model riêng và chỉ load subtab operations đang chọn. Không bind raw persistence property vào XML; phải thêm safe DTO field và contract test trước. Code support kỹ thuật chỉ được hiện ở details có kiểm soát, còn label table phải thân thiện và được localize.
