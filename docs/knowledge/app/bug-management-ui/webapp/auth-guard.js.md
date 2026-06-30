# Knowledge: `app/bug-management-ui/webapp/auth-guard.js`

## English

### What this file is for

`auth-guard.js` protects the Fiori app entry page before UI5 starts. It checks
whether the current browser tab has an IDTS bearer token in `sessionStorage`.
If there is no token, it redirects the user to `login.html`. If a token exists,
it installs an XMLHttpRequest interceptor so OData V4 requests carry
`Authorization: Bearer <token>`.

### Beginner explanation

Fiori Elements loads OData metadata very early. If the app waits until
`Component.js` to add the auth header, the first `$metadata` request can already
be sent without a token and the app may become blank after login. This file is
loaded by `index.html` before the UI5 bootstrap, so the auth check and OData
header injection happen early enough.

### Flow in IDTS

1. `index.html` loads `auth-guard.js` before loading `sap-ui-core.js`.
2. `auth-guard.js` reads `idts_auth_token` from `sessionStorage`.
3. If the token is missing, it redirects to `login.html`.
4. If the token exists, it patches `XMLHttpRequest.open/send`.
5. Any request whose URL contains `/odata/v4/` receives the bearer token header.
6. It exposes `window.idtsLogout()` for local/dev logout until a shell menu or
   toolbar logout action is added.

### Important source anchors

| Location | IDTS concept | Impact if broken | Must check together |
| --- | --- | --- | --- |
| `sessionStorage.getItem(TOKEN_KEY)` | Browser session token | User may enter without a token or be redirected incorrectly. | `login-page.js`, `srv/auth.js` |
| `window.location.replace(base + "/login.html")` | Unauthenticated redirect | Users without a session may see a blank or unauthorized app. | `login.html`, `index.html` |
| `XMLHttpRequest.prototype.send` patch | Authenticated OData calls | BugService requests can fail with 401/403 after login. | `srv/auth/custom-auth.js`, `srv/service.cds` |
| `window.idtsLogout` | Local logout path | Token may remain in the browser tab after logout. | `login-page.js`, `AuthService.logout` |

### Cross-folder impact

- `srv/auth/custom-auth.js` validates the bearer token added by this file.
- `srv/auth.cds` defines `logout`, which `window.idtsLogout()` calls.
- `srv/service.cds` protects `BugService`, so OData requests need the header this
  file injects.
- `db/schema.cds` stores `AuthSessions`, which are looked up by backend auth.

### Safe editing checklist

- Keep this file loaded before the UI5 bootstrap in `index.html`.
- Do not write token values to console logs or documentation.
- If the OData URL pattern changes, rerun browser smoke and verify the first
  `$metadata` request is authenticated.
- Avoid adding unrelated UI behavior here; this file is only the pre-bootstrap
  auth guard.

## Vietnamese

### File này dùng để làm gì

`auth-guard.js` bảo vệ trang vào của Fiori app trước khi UI5 khởi động. Nó kiểm
tra browser tab hiện tại có IDTS bearer token trong `sessionStorage` hay không.
Nếu không có token, nó redirect user sang `login.html`. Nếu có token, nó gắn
interceptor vào XMLHttpRequest để request OData V4 tự có header
`Authorization: Bearer <token>`.

### Giải thích cho người mới

Fiori Elements load metadata OData rất sớm. Nếu đợi tới `Component.js` mới thêm
auth header, request `$metadata` đầu tiên có thể đã bị gửi đi mà chưa có token,
dẫn tới app trắng sau login. File này được `index.html` load trước UI5 bootstrap,
nên việc kiểm tra đăng nhập và gắn header OData diễn ra đủ sớm.

### Flow hoạt động trong IDTS

1. `index.html` load `auth-guard.js` trước khi load `sap-ui-core.js`.
2. `auth-guard.js` đọc `idts_auth_token` từ `sessionStorage`.
3. Nếu thiếu token, nó redirect sang `login.html`.
4. Nếu có token, nó patch `XMLHttpRequest.open/send`.
5. Mọi request có URL chứa `/odata/v4/` sẽ được thêm bearer token header.
6. Nó expose `window.idtsLogout()` cho logout local/dev cho tới khi có shell menu
   hoặc toolbar logout action chính thức.

### Các điểm source quan trọng

| Vị trí | Khái niệm IDTS | Ảnh hưởng nếu sai | Phải kiểm tra cùng |
| --- | --- | --- | --- |
| `sessionStorage.getItem(TOKEN_KEY)` | Token session trên browser | User có thể vào app khi chưa có token hoặc bị redirect sai. | `login-page.js`, `srv/auth.js` |
| `window.location.replace(base + "/login.html")` | Redirect khi chưa đăng nhập | User chưa có session có thể thấy app trắng hoặc lỗi unauthorized. | `login.html`, `index.html` |
| Patch `XMLHttpRequest.prototype.send` | OData call đã đăng nhập | Request BugService có thể lỗi 401/403 sau login. | `srv/auth/custom-auth.js`, `srv/service.cds` |
| `window.idtsLogout` | Luồng logout local | Token có thể còn trong browser tab sau logout. | `login-page.js`, `AuthService.logout` |

### Liên kết với folder khác

- `srv/auth/custom-auth.js` validate bearer token mà file này gắn vào request.
- `srv/auth.cds` định nghĩa `logout`, được gọi bởi `window.idtsLogout()`.
- `srv/service.cds` bảo vệ `BugService`, nên OData request cần header do file này
  thêm vào.
- `db/schema.cds` lưu `AuthSessions`, là dữ liệu backend auth dùng để kiểm tra
  session.

### Checklist sửa file an toàn

- Giữ file này được load trước UI5 bootstrap trong `index.html`.
- Không log token ra console hoặc đưa token vào tài liệu.
- Nếu pattern URL OData thay đổi, phải rerun browser smoke và kiểm tra request
  `$metadata` đầu tiên đã authenticated.
- Không thêm UI behavior không liên quan vào đây; file này chỉ là auth guard
  trước bootstrap.
