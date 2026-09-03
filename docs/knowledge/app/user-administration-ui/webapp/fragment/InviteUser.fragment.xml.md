# Knowledge: `app/user-administration-ui/webapp/fragment/InviteUser.fragment.xml`

## 2026-09-03 display name / Tên hiển thị 2026-09-03

The invitation form now requires `invite>/displayName` before email and sends changes through `onInviteDisplayNameChange`. The name is profile data, not an SAP login identifier. Check it with `Main.controller.js`, `srv/user-admin.cds`, and `UserOnboardingRequests.requestedDisplayName` so asynchronous provisioning never falls back to email for new requests.

Form mời hiện yêu cầu `invite>/displayName` trước email và chuyển thay đổi qua `onInviteDisplayNameChange`. Đây là dữ liệu hồ sơ, không phải định danh đăng nhập SAP. Phải kiểm tra cùng `Main.controller.js`, `srv/user-admin.cds` và `UserOnboardingRequests.requestedDisplayName` để provisioning bất đồng bộ không dùng email làm tên cho request mới.

## English

`InviteUser.fragment.xml` is the onboarding dialog. It binds email, role, UserAdmin capability, and the optional Developer profile to the `invite` JSON model. The role selector accepts `TESTER`, `DEVELOPER`, or `PM`; the UserAdmin checkbox and hint are visible only for `PM`.

When the selected role is `DEVELOPER`, the profile section reads its value-help rows from the independent `developerCatalogs` model: availability uses `availabilityStatuses` (`code`/`name`), Component Category uses `componentCategories` (`ID`/`label`), SAP Module uses `sapModules` (`ID`/`name`), and responsibility level uses `responsibilityLevels` (`code`/`name`). These bindings are read-only catalog choices and are not coupled to the `businessCatalogs` administration model. The dialog keeps the workload limit and responsibility rows in `invite>/developerProfile`.

The Send button is enabled only when the controller has marked the email and required Developer responsibility data valid, and while no submit is in flight. `onConfirmInvite` validates the email again, sends only the bounded onboarding inputs (`email`, `requestedRole`, PM-only `userAdminRequested`, and the role-shaped `developerProfile`) to `requestOnboarding`, then resets the dialog and reloads Requests. CAP remains authoritative for authorization, catalog validity, duplicate invitations, persistence, and provider execution; the fragment never exposes provider, identity, credential, or raw request data.

### Important source anchors

- **Location**: `InviteUser.fragment.xml:32-57`, Developer profile and `developerCatalogs` bindings.
  **IDTS concept**: Developer onboarding uses one stable value-help model for all four catalog types while the entered profile remains owned by `invite`.
  **Impact if broken**: The dialog can show stale or unrelated Business Catalog state, submit unsupported IDs, or make a valid Developer invitation impossible to complete.
  **Must check together**: `Main.controller.js:_ensureDeveloperCatalogs`, `_developerProfileForRole`, `srv/user-admin.cds:17-27`, and the focused UI contract.

- **Location**: `InviteUser.fragment.xml:58-80`, PM capability, submit and cancel controls.
  **IDTS concept**: UserAdmin capability is PM-only, and busy/validity state prevents duplicate or incomplete onboarding submits.
  **Impact if broken**: A caller could request capability for the wrong role, submit twice, or bypass the client-side completeness guard before CAP validation.
  **Must check together**: `Main.controller.js:onConfirmInvite`, `_updateInviteState`, the `requestOnboarding` action contract, and onboarding tests.

### Safe editing

Keep catalog value helps on `developerCatalogs`; do not bind invitation controls to `businessCatalogs` or copy persistence entities into the dialog. Keep visible text in i18n, preserve the busy/submit boundary, and add a focused contract assertion before exposing a new onboarding field.

## Tiếng Việt

`InviteUser.fragment.xml` là dialog onboarding. Fragment bind email, role, capability UserAdmin và Developer profile tùy chọn vào JSON model `invite`. Selector role nhận `TESTER`, `DEVELOPER` hoặc `PM`; checkbox và hint UserAdmin chỉ hiện khi role là `PM`.

Khi chọn role `DEVELOPER`, phần profile đọc các row value-help từ model độc lập `developerCatalogs`: availability dùng `availabilityStatuses` (`code`/`name`), Component Category dùng `componentCategories` (`ID`/`label`), SAP Module dùng `sapModules` (`ID`/`name`) và responsibility level dùng `responsibilityLevels` (`code`/`name`). Các binding này chỉ là lựa chọn catalog read-only và không nối với model quản trị `businessCatalogs`. Workload limit và các row responsibility vẫn thuộc `invite>/developerProfile`.

Button Send chỉ enabled khi controller đánh dấu email và dữ liệu responsibility bắt buộc của Developer hợp lệ, đồng thời không có submit nào đang chạy. `onConfirmInvite` validate lại email, chỉ gửi input onboarding có giới hạn (`email`, `requestedRole`, `userAdminRequested` chỉ cho PM và `developerProfile` theo role) tới `requestOnboarding`, rồi reset dialog và reload Requests. CAP vẫn là authority cho authorization, catalog hợp lệ, invitation trùng, persistence và provider execution; fragment không expose provider, identity, credential hoặc raw request data.

### Important source anchors / Anchor nguồn quan trọng

- **Vị trí**: `InviteUser.fragment.xml:32-57`, binding profile Developer và `developerCatalogs`.
  **Khái niệm IDTS**: Onboarding Developer dùng một model value-help ổn định cho bốn loại catalog, còn profile nhập vào vẫn thuộc `invite`.
  **Ảnh hưởng nếu sai**: Dialog có thể hiện state Business Catalog cũ/không liên quan, gửi ID không được hỗ trợ hoặc khiến invitation Developer hợp lệ không thể hoàn tất.
  **Phải kiểm tra cùng**: `Main.controller.js:_ensureDeveloperCatalogs`, `_developerProfileForRole`, `srv/user-admin.cds:17-27` và UI contract tập trung.

- **Vị trí**: `InviteUser.fragment.xml:58-80`, capability PM, control submit và cancel.
  **Khái niệm IDTS**: Capability UserAdmin chỉ dành cho PM; busy/validity state chặn submit trùng hoặc onboarding chưa đủ dữ liệu.
  **Ảnh hưởng nếu sai**: Caller có thể request capability cho role sai, submit hai lần hoặc bỏ qua guard đầy đủ phía client trước validation của CAP.
  **Phải kiểm tra cùng**: `Main.controller.js:onConfirmInvite`, `_updateInviteState`, contract action `requestOnboarding` và onboarding tests.

### Sửa an toàn

Giữ value-help catalog của invitation trên `developerCatalogs`; không bind control invitation vào `businessCatalogs` và không copy entity persistence vào dialog. Giữ text hiển thị trong i18n, bảo toàn boundary busy/submit và thêm assertion contract tập trung trước khi expose field onboarding mới.
