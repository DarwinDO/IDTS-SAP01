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
