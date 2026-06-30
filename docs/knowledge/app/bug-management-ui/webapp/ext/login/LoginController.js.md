# Knowledge: `app/bug-management-ui/webapp/ext/login/LoginController.js`

## English

### What this file is for

`LoginController.js` is now a small UI5 session-helper module. It does not render
the login form and does not load a dialog. The active login page is
`login.html`, and the active login form logic is `login-page.js`.

This file exists so future UI5/Fiori extension code can import one place to read
the current user, check whether the browser tab has a valid session, clear the
session, or call logout.

### Beginner explanation

At first, IDTS-35 tried a UI5 dialog-based login. That approach was removed
because the app needs the bearer token before Fiori Elements sends its first
OData `$metadata` request. The final design uses:

- `login.html` + `login-page.js` for the visible login form.
- `auth-guard.js` for the pre-bootstrap redirect and OData auth header.
- `LoginController.js` only as a reusable UI5 helper module.

### Flow in IDTS

1. `login-page.js` creates browser session data after successful login.
2. `auth-guard.js` reads the same session data before Fiori Elements starts.
3. If future UI5 code needs user/session data, it can import this helper module.
4. `logout()` calls `AuthService.logout` and clears browser session data.

### Important source anchors

| Location | IDTS concept | Impact if broken | Must check together |
| --- | --- | --- | --- |
| `SESSION_KEY_TOKEN` / `SESSION_KEY_USER` / `SESSION_KEY_EXPIRES` | Shared browser session keys | Login page, auth guard, and UI5 helpers may read different session data. | `login-page.js`, `auth-guard.js` |
| `isAuthenticated()` | Local session validity check | UI5 extension code may treat an expired or missing session as valid. | Backend session TTL in `srv/auth.js` |
| `logout()` | Logout helper | Browser token may remain or backend session may not be revoked. | `AuthService.logout`, `auth-guard.js` |
| `clearSession()` | Browser tab cleanup | User may stay logged in locally after logout. | Browser smoke logout path |

### Cross-folder impact

- `srv/auth.cds` defines `logout`, which this helper can call.
- `srv/auth.js` revokes the backend session when logout succeeds.
- `srv/auth/custom-auth.js` validates tokens on protected OData calls.
- `db/schema.cds` contains `AuthSessions`, which backend auth uses to validate
  and revoke sessions.

### Safe editing checklist

- Do not reintroduce `LoginDialog.fragment.xml` dependencies unless the login
  architecture is intentionally changed again.
- Keep session key names aligned with `login-page.js` and `auth-guard.js`.
- Never store or log passwords.
- After changing logout/session helper behavior, run auth QA and browser smoke.

## Vietnamese

### File này dùng để làm gì

`LoginController.js` hiện là module helper session nhỏ cho UI5. Nó không render
form login và không load dialog. Trang login đang hoạt động là `login.html`, còn
logic form login nằm trong `login-page.js`.

File này tồn tại để sau này UI5/Fiori extension code có một nơi chung để import
khi cần đọc current user, kiểm tra browser tab có session hợp lệ hay không, clear
session, hoặc gọi logout.

### Giải thích cho người mới

Ban đầu IDTS-35 thử hướng login bằng UI5 dialog. Hướng đó đã bị bỏ vì app cần có
bearer token trước khi Fiori Elements gửi request OData `$metadata` đầu tiên.
Thiết kế cuối cùng dùng:

- `login.html` + `login-page.js` cho form login nhìn thấy trên màn hình.
- `auth-guard.js` cho redirect trước bootstrap và gắn auth header cho OData.
- `LoginController.js` chỉ là helper module dùng lại trong UI5.

### Flow hoạt động trong IDTS

1. `login-page.js` tạo browser session data sau khi login thành công.
2. `auth-guard.js` đọc cùng session data đó trước khi Fiori Elements start.
3. Nếu sau này UI5 code cần user/session data, nó có thể import helper module này.
4. `logout()` gọi `AuthService.logout` và xóa browser session data.

### Các điểm source quan trọng

| Vị trí | Khái niệm IDTS | Ảnh hưởng nếu sai | Phải kiểm tra cùng |
| --- | --- | --- | --- |
| `SESSION_KEY_TOKEN` / `SESSION_KEY_USER` / `SESSION_KEY_EXPIRES` | Key session dùng chung trên browser | Login page, auth guard, và UI5 helper có thể đọc lệch dữ liệu session. | `login-page.js`, `auth-guard.js` |
| `isAuthenticated()` | Kiểm tra session local còn hợp lệ | UI5 extension code có thể xem session hết hạn hoặc thiếu token là hợp lệ. | Session TTL backend trong `srv/auth.js` |
| `logout()` | Helper logout | Token browser có thể còn lại hoặc backend session không bị revoke. | `AuthService.logout`, `auth-guard.js` |
| `clearSession()` | Dọn session trong browser tab | User có thể vẫn còn login local sau logout. | Browser smoke logout path |

### Liên kết với folder khác

- `srv/auth.cds` định nghĩa `logout`, là action helper này có thể gọi.
- `srv/auth.js` revoke backend session khi logout thành công.
- `srv/auth/custom-auth.js` validate token trên các OData call được bảo vệ.
- `db/schema.cds` chứa `AuthSessions`, được backend auth dùng để validate và
  revoke session.

### Checklist sửa file an toàn

- Không đưa dependency `LoginDialog.fragment.xml` quay lại trừ khi team chủ động
  đổi lại kiến trúc login.
- Giữ tên session key khớp với `login-page.js` và `auth-guard.js`.
- Không bao giờ lưu hoặc log password.
- Sau khi đổi behavior logout/session helper, chạy auth QA và browser smoke.
