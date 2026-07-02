# Knowledge: `app/bug-management-ui/webapp/ext/actions/BugListActions.js`

## English

### What this file is for

This file contains the custom Fiori Elements List Report action handler for `Create Bug`.

The standard Fiori-generated Create button is hidden in `app/bug-management-ui/annotations/capabilities.cds`. This file provides the replacement button behavior so IDTS can show Create only to roles that should create bug reports: Tester and PM.

### Beginner explanation

Fiori Elements normally generates many buttons from service metadata. That is useful, but the standard Create button does not know enough about the custom IDTS login session. IDTS login stores a safe user profile in browser session storage, and `LoginController.getUser()` reads that profile.

This action module uses that profile only for UI convenience:

- Tester and PM see the custom `Create Bug` action.
- Developer does not see the action.
- If a Developer somehow invokes the function directly in the browser, the function rejects before trying to create a draft.

This is not the main security layer. Real security stays in CAP backend handlers, especially `srv/service.js` and `srv/bug-service/permissions.js`. The UI hides the button to avoid confusing users; the backend rejects unauthorized calls to protect data.

### Flow in IDTS

1. `manifest.json` registers a List Report header action named `CreateBug`.
2. Fiori loads this module for the action.
3. `isCreateVisible()` reads the logged-in user's `role_code`.
4. If the role is `TESTER` or `PM`, Fiori shows/enables the `Create Bug` button.
5. When the user presses it, `createBug()` gets the OData model from the Fiori action runtime context, binds to `/Bugs`, and calls Fiori Elements `editFlow.createDocument(...)`.
6. Fiori opens the draft create page using `creationMode: "NewPage"`.
7. CAP backend still validates the draft-create request and later validates mandatory fields/catalog values on save.

### Important source anchors

- Location: dependency `../login/LoginController`
  - IDTS concept: reuse the custom login session helper instead of duplicating browser storage parsing.
  - Impact if broken: the UI may not know the current role, so Create can disappear for valid users or appear for the wrong user.
  - Must check together: `app/bug-management-ui/webapp/ext/login/LoginController.js`, `app/bug-management-ui/webapp/index.html`, and `srv/auth/custom-auth.js`.

- Location: `canCreateBug()`
  - IDTS concept: only Tester and PM should start bug creation in the UI.
  - Impact if broken: Developer can see a create path that backend later rejects, or Tester/PM lose the create path.
  - Must check together: `srv/bug-service/permissions.js`, `srv/service.js` `NEW` draft guard, and role seed data in `db/data/idts.cap-Users.csv`.

- Location: `getModelFromActionContext(this)` and `model.bindList("/Bugs")`
  - IDTS concept: create a new Bug through the OData `Bugs` collection, not through a separate custom endpoint.
  - Impact if broken: Fiori may create the wrong entity or fail before reaching backend validation. A previous runtime bug happened because the handler assumed `this.getView()` existed, while the actual manifest action context exposed `editFlow` and `_view`.
  - Must check together: `srv/service.cds` `Bugs` projection, `app/bug-management-ui/webapp/manifest.json` List Report target, CAP draft behavior on `BugService.Bugs`, and role-based browser smoke.

- Location: `getEditFlowFromActionContext(this)` and `editFlow.createDocument(..., { creationMode: "NewPage" })`
  - IDTS concept: use the supported Fiori Elements edit flow to open a draft create page.
  - Impact if broken: create navigation can fail at runtime even if static checks pass.
  - Must check together: browser smoke for Tester/PM create flow, `app/bug-management-ui/annotations/object-page.cds`, and mandatory-field validation in `srv/bug-service/bug-write.js`.

### Cross-folder impact

- `app/bug-management-ui/webapp/manifest.json` wires this module into the List Report header action.
- `app/bug-management-ui/annotations/capabilities.cds` hides the standard Create button so this custom one is the visible entry point.
- `srv/service.js` and `srv/bug-service/permissions.js` enforce the same rule server-side.
- `srv/bug-service/bug-write.js` validates the actual bug content when the draft is saved.
- `db/schema.cds` and `srv/service.cds` define/expose the `Bugs` entity that this module creates through Fiori draft flow.

### Safe editing checklist

- Do not parse raw session storage here if `LoginController.getUser()` can provide the profile.
- Do not rely on this file for security; keep backend authorization in place.
- Do not call private/internal Fiori controls or DOM IDs. Use supported Fiori Elements controller extension context such as `editFlow`.
- If the manifest action runtime context changes, update `getModelFromActionContext(...)` and rerun browser smoke. Static checks alone are not enough for this file because Fiori decides the `this` context at runtime.
- If the create route changes, update `manifest.json`, this file, and the focused IDTS-43 QA script together.
- Browser-smoke the create button with at least Developer, Tester, and PM roles.

## Vietnamese

### File này dùng để làm gì

File này chứa handler cho custom action `Create Bug` trên Fiori Elements List Report.

Nút Create chuẩn do Fiori tự sinh đã bị ẩn trong `app/bug-management-ui/annotations/capabilities.cds`. File này cung cấp hành vi thay thế để IDTS chỉ hiện Create cho các role nên được tạo bug report: Tester và PM.

### Giải thích cho người mới

Fiori Elements thường tự sinh nhiều button từ metadata của service. Điều này tiện, nhưng nút Create chuẩn không biết đủ về custom login session của IDTS. Login của IDTS lưu một user profile an toàn trong browser session storage, và `LoginController.getUser()` đọc profile đó.

Module action này dùng profile đó chỉ để hỗ trợ UI:

- Tester và PM thấy custom action `Create Bug`.
- Developer không thấy action này.
- Nếu Developer bằng cách nào đó gọi trực tiếp function trong browser, function sẽ reject trước khi thử tạo draft.

Đây không phải lớp bảo mật chính. Bảo mật thật vẫn nằm ở CAP backend handlers, đặc biệt là `srv/service.js` và `srv/bug-service/permissions.js`. UI ẩn nút để tránh gây rối cho user; backend mới là nơi chặn request không hợp lệ để bảo vệ dữ liệu.

### Flow hoạt động trong IDTS

1. `manifest.json` đăng ký một List Report header action tên `CreateBug`.
2. Fiori load module này cho action đó.
3. `isCreateVisible()` đọc `role_code` của user đang login.
4. Nếu role là `TESTER` hoặc `PM`, Fiori hiện/enable button `Create Bug`.
5. Khi user bấm, `createBug()` bind tới `/Bugs` và gọi Fiori Elements `editFlow.createDocument(...)`.
6. Fiori mở draft create page với `creationMode: "NewPage"`.
7. CAP backend vẫn kiểm tra quyền draft-create và sau đó validate mandatory fields/catalog values khi save.

### Các điểm neo quan trọng

- Vị trí: dependency `../login/LoginController`
  - Khái niệm IDTS: dùng lại helper custom login session thay vì tự parse browser storage thêm lần nữa.
  - Ảnh hưởng nếu sai: UI có thể không biết role hiện tại, làm Create biến mất với user hợp lệ hoặc hiện với user sai.
  - Phải kiểm tra cùng: `app/bug-management-ui/webapp/ext/login/LoginController.js`, `app/bug-management-ui/webapp/index.html`, và `srv/auth/custom-auth.js`.

- Vị trí: `canCreateBug()`
  - Khái niệm IDTS: chỉ Tester và PM nên bắt đầu tạo bug từ UI.
  - Ảnh hưởng nếu sai: Developer có thể thấy đường tạo bug rồi bị backend reject, hoặc Tester/PM mất đường tạo bug.
  - Phải kiểm tra cùng: `srv/bug-service/permissions.js`, draft guard `NEW` trong `srv/service.js`, và dữ liệu role seed trong `db/data/idts.cap-Users.csv`.

- Vị trí: `this.getView().getModel().bindList("/Bugs")`
  - Khái niệm IDTS: tạo Bug mới qua OData collection `Bugs`, không tạo qua endpoint custom riêng.
  - Ảnh hưởng nếu sai: Fiori có thể tạo sai entity hoặc fail trước khi tới backend validation.
  - Phải kiểm tra cùng: projection `Bugs` trong `srv/service.cds`, List Report target trong `app/bug-management-ui/webapp/manifest.json`, và CAP draft behavior trên `BugService.Bugs`.

- Vị trí: `this.editFlow.createDocument(..., { creationMode: "NewPage" })`
  - Khái niệm IDTS: dùng edit flow được Fiori Elements hỗ trợ để mở draft create page.
  - Ảnh hưởng nếu sai: navigation tạo bug có thể fail runtime dù static check pass.
  - Phải kiểm tra cùng: browser smoke create flow với Tester/PM, `app/bug-management-ui/annotations/object-page.cds`, và mandatory-field validation trong `srv/bug-service/bug-write.js`.

### Liên kết với folder khác

- `app/bug-management-ui/webapp/manifest.json` wire module này vào List Report header action.
- `app/bug-management-ui/annotations/capabilities.cds` ẩn nút Create chuẩn để custom action này là entry point hiển thị.
- `srv/service.js` và `srv/bug-service/permissions.js` enforce cùng rule ở phía server.
- `srv/bug-service/bug-write.js` validate nội dung bug thật khi draft được save.
- `db/schema.cds` và `srv/service.cds` định nghĩa/expose entity `Bugs` mà module này tạo qua Fiori draft flow.

### Checklist sửa an toàn

- Không tự parse raw session storage trong file này nếu `LoginController.getUser()` đã cung cấp profile.
- Không dựa vào file này để bảo mật; backend authorization vẫn phải giữ.
- Không gọi private/internal Fiori controls hoặc DOM ID. Dùng context được Fiori Elements hỗ trợ như `editFlow`.
- Nếu create route thay đổi, cập nhật `manifest.json`, file này, và focused IDTS-43 QA script cùng lúc.
- Browser-smoke nút create với ít nhất ba role Developer, Tester, và PM.

### Cap nhat IDTS-43 ve runtime context

Fiori Elements khong goi handler custom action nay giong mot controller thong thuong. Trong browser smoke, `this` cua handler la mot object giong ExtensionAPI: co `editFlow` va `_view`, nhung khong co `getView()`. Vi vay file source khong duoc goi cung `this.getView()` nua. Thay vao do, code gom logic lay model trong `getModelFromActionContext(...)`, sau do van dung `editFlow.createDocument(...)` de mo trang tao draft.

Khi sua file nay, phai chay browser smoke theo role Developer, Tester va PM. Static test co the bat loi logic co ban, nhung khong thay the duoc runtime check vi Fiori quyet dinh context luc button duoc bam tren UI that.

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/actions/BugListActions.js`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/actions/BugListActions.js.md`
- Source layer: `app`
- Last reviewed: 2026-07-01
