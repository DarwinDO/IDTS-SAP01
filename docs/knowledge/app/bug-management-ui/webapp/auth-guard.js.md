# Knowledge: `app/bug-management-ui/webapp/auth-guard.js`

## English

### What this file is for

`auth-guard.js` protects the Fiori app entry page before UI5 starts. It redirects users without an IDTS bearer token to `login.html`, injects the bearer token into OData V4 requests, and exposes safe session helpers used by the signed-in profile shell for `IDTS-53`.

This file is loaded by `index.html` before the SAPUI5 bootstrap. That load order is intentional: Fiori Elements requests `$metadata` very early, so the Authorization header must already be ready before the main app starts.

### Beginner explanation

After login, the browser has a token in `sessionStorage`. The backend expects every protected OData call to include that token as:

`Authorization: Bearer <token>`

Fiori Elements creates OData requests internally. Instead of changing every generated screen, `auth-guard.js` installs a small XMLHttpRequest interceptor before UI5 starts. Any request to `/odata/v4/` gets the token automatically.

For the Sprint 4 UX improvement, this file deliberately does not render UI5 controls directly. It runs before UI5, so it only exposes `window.idtsCurrentUser()` and `window.idtsLogout()`. The actual profile button is rendered later by `ext/login/ProfileShell.js` after the UI5 component has started.

### Flow in IDTS

1. `index.html` loads `auth-guard.js` before `sap-ui-core.js`.
2. The script checks `idts_auth_token` in `sessionStorage`.
3. If the token is missing, it redirects to `login.html`.
4. If the token exists, it patches `XMLHttpRequest.open/send`.
5. OData V4 requests receive the bearer token header.
6. The script exposes `window.idtsCurrentUser()` for safe public user lookup.
7. The script exposes `window.idtsLogout()` for Sign Out.
8. Later, `Component.js` starts `ProfileShell.js`, which uses these helpers to render the profile/sign-out UI.

### Important source anchors

| Location | IDTS concept | Impact if broken | Must check together |
| --- | --- | --- | --- |
| `sessionStorage.getItem(TOKEN_KEY)` | Browser session token | Users may be allowed in without a token or redirected incorrectly. | `login-page.js`, `srv/auth.js` |
| `window.location.replace(base + "/login.html")` | Unauthenticated redirect | Users without a session may see a blank app or unauthorized OData errors. | `login.html`, `index.html` |
| `XMLHttpRequest.prototype.send` patch | Authenticated OData | First metadata/read requests can fail with 401/403 after login. | `srv/auth/custom-auth.js`, `srv/service.cds` |
| `window.idtsLogout` | Logout behavior | Token may remain in the browser tab or backend session may not be revoked. | `srv/auth.js`, `LoginController.js` |
| `window.idtsCurrentUser` | Safe signed-in profile helper | Profile shell cannot show name/email/role if the helper breaks. | `ProfileShell.js`, `login-page.js`, `srv/auth.js publicUser()` |

### Cross-folder impact

- `srv/auth/custom-auth.js` validates the bearer token injected by this file.
- `srv/auth.cds` and `srv/auth.js` expose and implement `logout`, which `window.idtsLogout()` calls.
- `srv/service.cds` protects `BugService`, so generated Fiori OData requests depend on this auth header.
- `db/schema.cds` stores `AuthSessions`, which the backend checks and revokes.
- `app/bug-management-ui/webapp/login-page.js` writes the token and public user profile that this file reads.
- `app/bug-management-ui/webapp/ext/login/ProfileShell.js` consumes `window.idtsCurrentUser()` and `window.idtsLogout()` to render the signed-in profile UI after UI5 is available.

### Safe editing checklist

- Keep this file loaded before the UI5 bootstrap in `index.html`.
- Never log or display bearer tokens.
- Do not add UI5 rendering directly back into this file; it runs before UI5 bootstrap.
- If the OData route changes, verify the first `$metadata` request is authenticated.
- If the public user object changes, update `login-page.js`, this helper, and `ProfileShell.js`.
- Browser-smoke login, profile menu, sign out, refresh after logout, and protected OData.

## Vietnamese

### File này dùng để làm gì

`auth-guard.js` bảo vệ trang vào của Fiori app trước khi UI5 khởi động. Nó redirect user chưa có IDTS bearer token sang `login.html`, tự gắn bearer token vào request OData V4, và expose các session helper an toàn cho profile shell của `IDTS-53`.

File này được `index.html` load trước SAPUI5 bootstrap. Thứ tự này là cố ý: Fiori Elements gọi `$metadata` rất sớm, nên Authorization header phải sẵn sàng trước khi app chính bắt đầu.

### Giải thích cho người mới

Sau khi login, browser có token trong `sessionStorage`. Backend yêu cầu mọi protected OData call phải có header:

`Authorization: Bearer <token>`

Fiori Elements tự tạo OData request bên trong framework. Thay vì sửa từng màn hình generated, `auth-guard.js` gắn một interceptor nhỏ vào XMLHttpRequest trước khi UI5 khởi động. Request nào đi tới `/odata/v4/` thì tự có token.

Với cải thiện UX Sprint 4, file này cố ý không render UI5 controls trực tiếp. Nó chạy trước UI5, nên nó chỉ expose `window.idtsCurrentUser()` và `window.idtsLogout()`. Profile button thật được `ext/login/ProfileShell.js` render sau khi UI5 component đã start.

### Flow hoạt động trong IDTS

1. `index.html` load `auth-guard.js` trước `sap-ui-core.js`.
2. Script kiểm tra `idts_auth_token` trong `sessionStorage`.
3. Nếu thiếu token, nó redirect sang `login.html`.
4. Nếu có token, nó patch `XMLHttpRequest.open/send`.
5. Request OData V4 được gắn bearer token header.
6. Script expose `window.idtsCurrentUser()` để đọc public user an toàn.
7. Script expose `window.idtsLogout()` cho action Sign Out.
8. Sau đó, `Component.js` start `ProfileShell.js`; module này dùng các helper trên để render profile/sign-out UI.

### Các điểm source quan trọng

| Vị trí | Khái niệm IDTS | Ảnh hưởng nếu sai | Phải kiểm tra cùng |
| --- | --- | --- | --- |
| `sessionStorage.getItem(TOKEN_KEY)` | Token session trên browser | User có thể vào app khi chưa có token hoặc bị redirect sai. | `login-page.js`, `srv/auth.js` |
| `window.location.replace(base + "/login.html")` | Redirect khi chưa đăng nhập | User chưa có session có thể thấy app trắng hoặc lỗi OData unauthorized. | `login.html`, `index.html` |
| Patch `XMLHttpRequest.prototype.send` | OData đã xác thực | Request `$metadata`/read đầu tiên có thể lỗi 401/403 sau login. | `srv/auth/custom-auth.js`, `srv/service.cds` |
| `window.idtsLogout` | Hành vi logout | Token có thể còn trong browser tab hoặc backend session không bị revoke. | `srv/auth.js`, `LoginController.js` |
| `window.idtsCurrentUser` | Helper signed-in profile an toàn | Profile shell không hiện name/email/role nếu helper hỏng. | `ProfileShell.js`, `login-page.js`, `srv/auth.js publicUser()` |

### Liên kết với folder khác

- `srv/auth/custom-auth.js` validate bearer token mà file này gắn vào request.
- `srv/auth.cds` và `srv/auth.js` expose/implement `logout`, được `window.idtsLogout()` gọi.
- `srv/service.cds` bảo vệ `BugService`, nên các OData request generated bởi Fiori phụ thuộc vào auth header này.
- `db/schema.cds` lưu `AuthSessions`, được backend kiểm tra và revoke.
- `app/bug-management-ui/webapp/login-page.js` ghi token và public user profile mà file này đọc.
- `app/bug-management-ui/webapp/ext/login/ProfileShell.js` dùng `window.idtsCurrentUser()` và `window.idtsLogout()` để render signed-in profile UI sau khi UI5 sẵn sàng.

### Checklist sửa file an toàn

- Giữ file này được load trước UI5 bootstrap trong `index.html`.
- Không bao giờ log hoặc hiển thị bearer token.
- Không thêm UI5 rendering trực tiếp trở lại file này; nó chạy trước UI5 bootstrap.
- Nếu route OData thay đổi, verify request `$metadata` đầu tiên đã authenticated.
- Nếu public user object thay đổi, cập nhật `login-page.js`, helper ở file này, và `ProfileShell.js`.
- Browser smoke login, profile menu, sign out, refresh sau logout, và protected OData.
