# Knowledge: `CatalogImpact.fragment.xml`

The deactivation dialog shows count-only Bug, responsibility, and child-catalog impact, explains that history remains, and requires a bounded reason before the negative confirmation action.

Dialog deactivate hien count-only impact cua Bug, responsibility va child catalog, noi ro history van duoc giu va bat buoc reason gioi han truoc action xac nhan negative.

## Gate 5 source anchors / Anchor source Gate 5

### English

The impact dialog is a confirmation boundary, not a second authorization or dependency engine. It shows count-only `readCatalogImpact` results, a bounded reason text area, one negative deactivation action, and Cancel. The controller opens it only after a currently active row has been selected.

- **Location**: `CatalogImpact.fragment.xml:5-10`.
  **IDTS concept**: PM sees Bug references, active Developer responsibilities, and active child catalog counts without seeing Bug/user records.
  **Impact if broken**: The UI could leak business data or give a false impression that deactivation is safe without impact evidence.
  **Must check together**: `srv/user-admin.cds:109-115`, `srv/user-admin/catalogs.js:291-319`, and `Main.controller.js:803-843`.

- **Location**: `CatalogImpact.fragment.xml:13-14`.
  **IDTS concept**: Deactivation is an interrupting negative decision requiring a non-empty bounded reason; the action is disabled while the request is submitting.
  **Impact if broken**: PM could submit unexplained deactivation or double-submit conflicting ETag updates.
  **Must check together**: `Main.controller.js:835-861`, `i18n.properties`, and `scripts/qa/test-user-admin-catalogs.js:209-228`.

### Tiếng Việt

Dialog impact là boundary xác nhận, không phải authorization engine hay dependency engine thứ hai. Dialog hiện kết quả `readCatalogImpact` chỉ dạng count, TextArea reason có giới hạn, một action deactivate negative và Cancel. Controller chỉ mở dialog sau khi chọn row đang active.

- **Vị trí**: `CatalogImpact.fragment.xml:5-10`.
  **Khái niệm IDTS**: PM thấy count Bug reference, Developer responsibility active và child catalog active mà không thấy record Bug/user.
  **Ảnh hưởng nếu sai**: UI có thể làm lộ business data hoặc tạo cảm giác deactivate an toàn giả khi chưa có impact evidence.
  **Phải kiểm tra cùng**: `srv/user-admin.cds:109-115`, `srv/user-admin/catalogs.js:291-319` và `Main.controller.js:803-843`.

- **Vị trí**: `CatalogImpact.fragment.xml:13-14`.
  **Khái niệm IDTS**: Deactivate là quyết định negative cần reason không rỗng có giới hạn; action bị disable trong lúc request submit.
  **Ảnh hưởng nếu sai**: PM có thể deactivate không giải thích hoặc double-submit update đang conflict ETag.
  **Phải kiểm tra cùng**: `Main.controller.js:835-861`, `i18n.properties` và `scripts/qa/test-user-admin-catalogs.js:209-228`.

### Safe editing / Sửa an toàn

Keep impact responses count-only and keep dependency enforcement in CAP. Do not add raw Bug lists, user identities, provider details, or direct database controls to this fragment.

Giữ impact response chỉ có count và giữ dependency enforcement ở CAP. Không thêm danh sách Bug raw, identity user, provider detail hoặc control database trực tiếp vào fragment.
## Gate 6.2 isolated model / Model tách biệt Gate 6.2

All impact bindings use `businessCatalogs`; Developer value-help loading cannot alter the selected impact row, reason or counts.

Mọi binding impact dùng `businessCatalogs`; load value help Developer không thể đổi impact row, reason hoặc count đang chọn.
