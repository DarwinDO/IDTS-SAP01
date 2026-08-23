# Knowledge: `EditCatalogItem.fragment.xml`

The dialog edits one allowlisted catalog payload. Component Category uses active parent selections; other catalogs require code and name. Save is the only emphasized action and the dialog contains no delete or technical administration field.

Dialog edit mot payload catalog allowlist. Component Category dung parent active; catalog khac bat buoc code va name. Save la emphasized action duy nhat; dialog khong co delete hay field quan tri ky thuat.

## Gate 5 source anchors / Anchor source Gate 5

### English

This fragment is the bounded editor for one selected catalog type. Simple catalogs show required code/name plus optional `componentType` or `categoryType`; Component Category shows active Application Component and Defect Category `Select` controls. The Save button is the one emphasized action and is disabled while the controller’s `catalogs>/edit/submitting` state is true.

- **Location**: `EditCatalogItem.fragment.xml:5-20`.
  **IDTS concept**: The form changes shape by `catalogs>/selectedType`, preserving the difference between a code catalog and a Component Category pair.
  **Impact if broken**: A PM could not maintain classification type labels, or could submit a pair with a stale/inactive parent selection.
  **Must check together**: `Main.controller.js:726-804`, `srv/user-admin/catalogs.js:88-164`, and `srv/user-admin.cds:246-280`.

- **Location**: `EditCatalogItem.fragment.xml:5-20` — `valueState`/`valueStateText` bindings.
  **IDTS concept**: Required-field failures are visible inline for code, name, and both Component Category parents; CAP remains the final validation authority.
  **Impact if broken**: The dialog would only show a generic warning, leaving the user unable to identify which field needs correction.
  **Must check together**: `Main.controller.js:773-795`, `i18n.properties` field messages, and `scripts/qa/test-user-admin-ui.js:223-233,451-459`.

### Tiếng Việt

Fragment này là editor có giới hạn cho một catalog type đang chọn. Catalog đơn hiện code/name bắt buộc cùng `componentType` hoặc `categoryType` tùy loại; Component Category hiện `Select` cho Application Component và Defect Category active. Save là action emphasized duy nhất và bị disable khi state `catalogs>/edit/submitting` đang true.

- **Vị trí**: `EditCatalogItem.fragment.xml:5-20`.
  **Khái niệm IDTS**: Form đổi theo `catalogs>/selectedType`, giữ khác biệt giữa code catalog và cặp Component Category.
  **Ảnh hưởng nếu sai**: PM không maintain được type label classification hoặc submit pair với parent cũ/inactive.
  **Phải kiểm tra cùng**: `Main.controller.js:726-804`, `srv/user-admin/catalogs.js:88-164` và `srv/user-admin.cds:246-280`.

- **Vị trí**: `EditCatalogItem.fragment.xml:5-20` — binding `valueState`/`valueStateText`.
  **Khái niệm IDTS**: Required-field failure hiện inline cho code, name và hai parent Component Category; CAP vẫn là authority validation cuối.
  **Ảnh hưởng nếu sai**: Dialog chỉ hiện warning chung, người dùng không biết field nào cần sửa.
  **Phải kiểm tra cùng**: `Main.controller.js:773-795`, field message trong `i18n.properties` và `scripts/qa/test-user-admin-ui.js:223-233,451-459`.

### Safe editing / Sửa an toàn

Do not add a Delete button or technical fields here. Keep both locales in parity and use the controller’s JSON-model validation messages rather than hardcoded technical error text. Any new field must be added to the CAP projection, handler allowlist, UI payload, test, and mirror.

Không thêm Delete button hoặc technical field vào fragment. Giữ parity hai locale và dùng validation message từ JSON model của controller thay vì hardcode technical error text. Field mới phải được thêm đồng thời vào CAP projection, handler allowlist, UI payload, test và mirror.
