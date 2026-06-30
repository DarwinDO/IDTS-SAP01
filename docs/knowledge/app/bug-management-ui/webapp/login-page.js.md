# Knowledge: `app/bug-management-ui/webapp/login-page.js`

## English

### What this file is for

`login-page.js` contains the browser logic for the standalone IDTS login page.
It reads the email and password fields from `login.html`, calls
`POST /odata/v4/auth/login`, stores the safe login result in `sessionStorage`,
and redirects the user back to `index.html`.

### Beginner explanation

The login page is not a Fiori Elements page. It is a small standalone HTML page
shown before the Fiori app starts. This script is the bridge between that page
and the CAP backend auth service. The password is sent only in the login request;
after login, the browser stores the returned token and safe user profile, not the
password.

### Flow in IDTS

1. Browser opens `login.html`.
2. `login.html` loads `login-page.js`.
3. If a token already exists in `sessionStorage`, the script redirects to
   `index.html`.
4. On form submit, it validates that email and password are present.
5. It calls `POST /odata/v4/auth/login`.
6. On success, it stores `idts_auth_token`, `idts_auth_user`, and
   `idts_auth_expires` in `sessionStorage`.
7. It redirects to `index.html`, where `auth-guard.js` injects the token into
   OData requests.
8. On failure, it shows a safe error message in the login page error bar.

### Important source anchors

| Location | IDTS concept | Impact if broken | Must check together |
| --- | --- | --- | --- |
| `AUTH_LOGIN = "/odata/v4/auth/login"` | Backend login endpoint | Users cannot authenticate. | `srv/auth.cds`, `srv/auth.js` |
| `JSON.stringify({ email, password })` | Login request payload | Backend cannot verify credentials if shape changes. | IDTS-34 auth contract |
| `sessionStorage.setItem(TOKEN_KEY, result.token)` | Browser session creation | App may redirect back to login or call OData without auth. | `auth-guard.js` |
| `showError(...)` | Safe invalid-login message | Users may see unclear or unsafe errors. | `AuthService.login` error response |

### Cross-folder impact

- `srv/auth.cds` defines the `login` action this script calls.
- `srv/auth.js` verifies credentials and returns the bearer token.
- `srv/auth/passwords.js` handles password hashing on the backend; this script
  must never hash or store passwords itself.
- `db/schema.cds` contains `Users.passwordHash` and `AuthSessions`, which are
  updated/read by the backend login flow.

### Safe editing checklist

- Never store the password in `sessionStorage`, `localStorage`, cookies, docs, or
  logs.
- Keep invalid-login errors generic.
- Keep the redirect target aligned with `auth-guard.js`.
- If the backend login contract changes, update this file and rerun
  `npm run qa:auth:programmatic` plus browser smoke.

## Vietnamese

### File này dùng để làm gì

`login-page.js` chứa logic browser cho trang đăng nhập standalone của IDTS. Nó đọc
field email/password từ `login.html`, gọi `POST /odata/v4/auth/login`, lưu kết
quả đăng nhập an toàn vào `sessionStorage`, rồi redirect user về `index.html`.

### Giải thích cho người mới

Trang login không phải là một trang Fiori Elements. Nó là một trang HTML nhỏ,
hiển thị trước khi Fiori app khởi động. Script này là cầu nối giữa trang đó và
CAP backend auth service. Password chỉ được gửi trong request login; sau khi
login xong, browser chỉ lưu token và profile user an toàn, không lưu password.

### Flow hoạt động trong IDTS

1. Browser mở `login.html`.
2. `login.html` load `login-page.js`.
3. Nếu trong `sessionStorage` đã có token, script redirect sang `index.html`.
4. Khi submit form, script kiểm tra email và password có được nhập chưa.
5. Nó gọi `POST /odata/v4/auth/login`.
6. Nếu thành công, nó lưu `idts_auth_token`, `idts_auth_user`, và
   `idts_auth_expires` vào `sessionStorage`.
7. Nó redirect sang `index.html`, nơi `auth-guard.js` sẽ thêm token vào các
   request OData.
8. Nếu thất bại, nó hiện thông báo lỗi an toàn trong error bar của trang login.

### Các điểm source quan trọng

| Vị trí | Khái niệm IDTS | Ảnh hưởng nếu sai | Phải kiểm tra cùng |
| --- | --- | --- | --- |
| `AUTH_LOGIN = "/odata/v4/auth/login"` | Endpoint login backend | User không đăng nhập được. | `srv/auth.cds`, `srv/auth.js` |
| `JSON.stringify({ email, password })` | Payload request login | Backend không verify được credential nếu shape đổi sai. | Contract auth IDTS-34 |
| `sessionStorage.setItem(TOKEN_KEY, result.token)` | Tạo session trên browser | App có thể bị redirect lại login hoặc gọi OData thiếu auth. | `auth-guard.js` |
| `showError(...)` | Thông báo login sai an toàn | User có thể thấy lỗi khó hiểu hoặc quá lộ chi tiết. | Error response của `AuthService.login` |

### Liên kết với folder khác

- `srv/auth.cds` định nghĩa action `login` mà script này gọi.
- `srv/auth.js` verify credential và trả bearer token.
- `srv/auth/passwords.js` xử lý password hashing ở backend; script này không được
  tự hash hoặc lưu password.
- `db/schema.cds` chứa `Users.passwordHash` và `AuthSessions`, được backend login
  flow cập nhật/đọc.

### Checklist sửa file an toàn

- Không bao giờ lưu password vào `sessionStorage`, `localStorage`, cookie, docs,
  hoặc log.
- Giữ thông báo login sai ở mức generic.
- Giữ redirect target khớp với `auth-guard.js`.
- Nếu backend login contract thay đổi, phải cập nhật file này và chạy lại
  `npm run qa:auth:programmatic` cùng browser smoke.
