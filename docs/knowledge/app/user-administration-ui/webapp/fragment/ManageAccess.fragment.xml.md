# Knowledge: `ManageAccess.fragment.xml`

## English

`ManageAccess.fragment.xml` is the shared SAPUI5 dialog for PM + UserAdmin access lifecycle requests. It displays the server-provided warning, collects the requested business role and optional UserAdmin capability for Change Role, collects Developer profile fields when the role is Developer, and requires a reason before the existing controller handler submits the action. CAP remains authoritative for authorization, optimistic version checks, provider reconciliation, and the actual state change.

Gate 6.1 adds an information `MessageStrip` at `ManageAccess.fragment.xml:15-20`. It is visible only when `access>/mode` is `CHANGE_ROLE` and tells the user to use Manage Responsibilities when only availability, workload, or responsibilities need changing. This is safe guidance only; it does not change bindings, action names, validation, or backend behavior.

### Important source anchors

- **Location**: `ManageAccess.fragment.xml:10-20`, warning and Change Role guidance strips.
  **IDTS concept**: The dialog separates server-owned access-risk warning from a user-facing choice between changing business access and maintaining Developer responsibilities.
  **Impact if broken**: A PM may start a role-change request for a profile-only update, or miss the local-access blocking warning attached to the existing operation.
  **Must check together**: `Main.view.xml:82-96`, `Main.controller.js` access dialog handlers, `i18n.properties`/`i18n_en.properties`/`i18n_vi.properties`, and the UI contract.

- **Location**: `ManageAccess.fragment.xml:21-56`, role/profile/reason controls.
  **IDTS concept**: Visibility remains state-bound to `CHANGE_ROLE` and `DEVELOPER`; the reason remains required before `.onConfirmAccessChange`.
  **Impact if broken**: The UI could expose the wrong fields or allow an access operation without its required human reason.
  **Must check together**: `Main.controller.js:onConfirmAccessChange`, CAP `requestRoleChange` contract, and access lifecycle tests.

### Safe editing

Keep the informational strip visible only for Change Role, keep all existing handlers and visibility expressions unchanged, and keep technical/provider details out of user-visible copy. Any new access action needs a focused contract test and safe localized text before XML exposure.

## Tiếng Việt

`ManageAccess.fragment.xml` là dialog SAPUI5 dùng chung cho request lifecycle quyền truy cập của PM + UserAdmin. Dialog hiển thị warning do server cung cấp, nhận business role và UserAdmin capability khi Change Role, nhận các field Developer profile khi role là Developer, và bắt buộc nhập reason trước khi handler hiện có gửi action. CAP vẫn là authority cho authorization, optimistic version check, provider reconciliation và thay đổi state thật.

Gate 6.1 thêm `MessageStrip` thông tin tại `ManageAccess.fragment.xml:15-20`. Strip chỉ hiện khi `access>/mode` là `CHANGE_ROLE` và hướng dẫn user dùng Manage Responsibilities nếu chỉ cần đổi availability, workload hoặc responsibility. Đây chỉ là hướng dẫn an toàn; không đổi binding, tên action, validation hay backend behavior.

### Important source anchors / Anchor nguồn quan trọng

- **Vị trí**: `ManageAccess.fragment.xml:10-20`, hai strip warning và hướng dẫn Change Role.
  **Khái niệm IDTS**: Dialog tách warning rủi ro quyền truy cập do server quản lý khỏi lựa chọn của user giữa đổi quyền nghiệp vụ và cập nhật responsibility Developer.
  **Ảnh hưởng nếu sai**: PM có thể bắt đầu request đổi role cho một thay đổi chỉ thuộc profile, hoặc bỏ qua warning khóa local access của operation hiện có.
  **Phải kiểm tra cùng**: `Main.view.xml:82-96`, handler dialog access trong `Main.controller.js`, ba file i18n và UI contract.

- **Vị trí**: `ManageAccess.fragment.xml:21-56`, control role/profile/reason.
  **Khái niệm IDTS**: Visibility vẫn bind theo `CHANGE_ROLE` và `DEVELOPER`; reason vẫn bắt buộc trước `.onConfirmAccessChange`.
  **Ảnh hưởng nếu sai**: UI có thể hiện nhầm field hoặc cho phép access operation không có reason bắt buộc của con người.
  **Phải kiểm tra cùng**: `Main.controller.js:onConfirmAccessChange`, CAP contract `requestRoleChange` và test access lifecycle.

### Sửa an toàn

Chỉ hiện strip thông tin khi Change Role, giữ nguyên handler và expression visibility hiện có, đồng thời không đưa chi tiết kỹ thuật/provider lên UI. Action access mới phải có contract test tập trung và text i18n an toàn trước khi expose trong XML.
## Gate 6.2 real role-transition boundary / Boundary chuyển role thật Gate 6.2

The Developer profile section is visible only when `currentRole` is not `DEVELOPER` and the selected target role is `DEVELOPER`. Existing Developers do not edit availability, workload or responsibilities through Change Role; they use Manage Responsibilities. Confirm remains disabled for the same role and for an incomplete transition-to-Developer profile.

Phần Developer profile chỉ hiện khi `currentRole` không phải `DEVELOPER` và role đích là `DEVELOPER`. Developer hiện có không sửa availability, workload hoặc responsibilities qua Change Role mà dùng Manage Responsibilities. Confirm bị disable nếu role không đổi hoặc profile chuyển sang Developer chưa đầy đủ.
