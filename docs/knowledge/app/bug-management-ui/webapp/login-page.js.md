# Knowledge: `app/bug-management-ui/webapp/login-page.js`

> **Ownership / debug anchor:** DatDT owns the visible login flow (backup: DonHV). Verify a safe login response, sessionStorage keys, then redirect; never inspect or log the password.
> **Ownership / điểm debug:** DatDT sở hữu login flow hiển thị (backup: DonHV). Verify response login an toàn, các sessionStorage key rồi redirect; không inspect hoặc log password.

## English

### What this file is for

`login-page.js` builds and controls the standalone IDTS sign-in screen. It uses SAPUI5 controls to render the login page, calls `POST /odata/v4/auth/login`, stores only the safe session result in `sessionStorage`, and redirects the browser to `index.html`.

This file is the main implementation point for `IDTS-52`: the login page should look and behave closer to SAP Fiori while still using the project’s custom CAP authentication.

### Beginner explanation

Think of this file as a small UI5 app that exists only for login. It does not load the main Fiori Elements component and it does not create the BugService model. Its only job is to let the user enter credentials, get a bearer token from CAP, and then hand the browser to the protected app.

The login screen now uses SAPUI5 controls instead of raw HTML form fields:

- `sap.m.Input` for email and password.
- `sap.m.Button` for the primary Sign In action.
- `sap.m.MessageStrip` for safe login errors.
- `sap.m.Panel`, `sap.m.VBox`, and `sap.m.HBox` for responsive layout.
- `sap.m.Avatar`, `sap.m.Title`, and `sap.m.Text` for simple SAP-style identity and sign-in wording.

This matters because SAPUI5 controls automatically follow the active SAP theme and behave more consistently with the Fiori app than plain HTML inputs.

The login page intentionally avoids developer-facing or environment-facing copy such as “custom CAP authentication”, “no SAP BTP/XSUAA”, or “QA workspace”. Those details are useful for the team but not useful to an end user who only needs to sign in.

### Flow in IDTS

1. `login.html` loads SAPUI5 and then `login-page.js`.
2. If `idts_auth_token` already exists in `sessionStorage`, the script redirects straight to `index.html`.
3. Otherwise, the script creates the login page using UI5 controls and places it in `#loginContent`.
4. When the user presses Sign In, the script validates that both email and password are present.
5. The script calls `POST /odata/v4/auth/login` with `{ email, password }`.
6. If the backend returns success, the script stores:
   - `idts_auth_token`
   - `idts_auth_user`
   - `idts_auth_expires`
7. The browser navigates to `index.html`, where `auth-guard.js` injects the token into protected OData calls.
8. If login fails, the script shows a safe message using `MessageStrip`. It does not show raw SQL, stack traces, hostnames, or private details.

### Important source anchors

| Location | IDTS concept | Impact if broken | Must check together |
| --- | --- | --- | --- |
| `AUTH_LOGIN = "/odata/v4/auth/login"` | CAP auth endpoint | Users cannot authenticate if the endpoint no longer matches `AuthService`. | `srv/auth.cds`, `srv/auth.js` |
| `sap.ui.require([...])` | UI5 control dependencies | The login screen can become blank if a required control library is missing. | `login.html` `data-sap-ui-libs`, UI5 linter |
| `new MessageStrip({ type: MessageType.Error })` | Safe user-facing error | Login errors may become unclear or unsafe if replaced with raw backend text. | `srv/auth.js` IDTS-39 error sanitization |
| `JSON.stringify({ email: email, password: password })` | Login request payload | Backend credential verification fails if the payload shape changes. | IDTS-34/IDTS-39 auth tests |
| `sessionStorage.setItem(TOKEN_KEY, result.token)` | Browser session creation | The app cannot call protected OData after login if the token is missing. | `auth-guard.js`, `srv/auth/custom-auth.js` |
| `sessionStorage.setItem(USER_KEY, JSON.stringify(result.user))` | Signed-in profile state | The profile popover cannot show name/email/role if the safe user profile is missing. | `auth-guard.js` IDTS-53 profile shell |
| `goToApp()` | Login-to-app handoff | Successful login may loop back to login or land on the wrong page. | `index.html`, `auth-guard.js` |

### Cross-folder impact

- `srv/auth.cds` defines the `login` action this file calls.
- `srv/auth.js` verifies credentials, sanitizes unexpected login failures, and returns the public user profile.
- `srv/auth/custom-auth.js` later validates the bearer token that this file stores.
- `db/schema.cds` contains `Users.passwordHash` and `AuthSessions`, which are read/written during the login request.
- `app/bug-management-ui/webapp/auth-guard.js` consumes the stored token and user profile after redirect.

### Safe editing checklist

- Never store the password anywhere after the request is sent.
- Never print passwords, tokens, raw backend errors, private endpoints, or real QA user data.
- Keep backend error display generic unless the backend explicitly returns a safe client message.
- If changing storage keys, update `auth-guard.js` and `LoginController.js` helpers together.
- If changing the UI5 controls, update `login.html` library bootstrap if needed and rerun UI5 checks.
- Browser-smoke at least these paths: empty submit, wrong password, correct login, protected OData after redirect.

## Vietnamese

### File này dùng để làm gì

`login-page.js` dựng và điều khiển màn hình đăng nhập standalone của IDTS. File này dùng SAPUI5 controls để render giao diện login, gọi `POST /odata/v4/auth/login`, chỉ lưu kết quả session an toàn vào `sessionStorage`, rồi redirect browser sang `index.html`.

Đây là điểm implement chính của `IDTS-52`: màn hình login phải nhìn và hoạt động gần chuẩn SAP Fiori hơn, nhưng vẫn dùng custom CAP authentication hiện tại của dự án.

### Giải thích cho người mới

Hãy hiểu file này như một app UI5 rất nhỏ chỉ phục vụ việc đăng nhập. Nó không load Fiori Elements component chính và không tạo model `BugService`. Nhiệm vụ duy nhất của nó là cho user nhập credential, lấy bearer token từ CAP, rồi đưa browser vào app đã được bảo vệ.

Màn hình login hiện dùng SAPUI5 controls thay cho form HTML thuần:

- `sap.m.Input` cho email và password.
- `sap.m.Button` cho nút chính Sign In.
- `sap.m.MessageStrip` để hiển thị lỗi login an toàn.
- `sap.m.Panel`, `sap.m.VBox`, và `sap.m.HBox` cho layout responsive.
- `sap.m.Avatar`, `sap.m.Title`, và `sap.m.Text` cho phần nhận diện và chữ hướng dẫn đăng nhập đơn giản theo phong cách SAP.

Điểm quan trọng là SAPUI5 controls tự đi theo SAP theme đang dùng, nên nhìn và hành xử đồng nhất hơn với Fiori app so với input HTML tự viết.

Màn hình login cố ý không hiển thị các câu chữ mang tính nội bộ/dev-facing như “custom CAP authentication”, “no SAP BTP/XSUAA”, hoặc “QA workspace”. Các thông tin đó hữu ích cho team kỹ thuật, nhưng không hữu ích với người dùng cuối vì họ chỉ cần biết cách đăng nhập.

### Flow hoạt động trong IDTS

1. `login.html` load SAPUI5 rồi load `login-page.js`.
2. Nếu `sessionStorage` đã có `idts_auth_token`, script redirect thẳng sang `index.html`.
3. Nếu chưa có token, script tạo màn hình login bằng UI5 controls và đặt vào `#loginContent`.
4. Khi user bấm Sign In, script kiểm tra email và password đã được nhập chưa.
5. Script gọi `POST /odata/v4/auth/login` với `{ email, password }`.
6. Nếu backend trả thành công, script lưu:
   - `idts_auth_token`
   - `idts_auth_user`
   - `idts_auth_expires`
7. Browser chuyển sang `index.html`, nơi `auth-guard.js` tự gắn token vào request OData được bảo vệ.
8. Nếu login thất bại, script hiển thị message an toàn bằng `MessageStrip`. Nó không hiển thị raw SQL, stack trace, hostname, hoặc thông tin private.

### Các điểm source quan trọng

| Vị trí | Khái niệm IDTS | Ảnh hưởng nếu sai | Phải kiểm tra cùng |
| --- | --- | --- | --- |
| `AUTH_LOGIN = "/odata/v4/auth/login"` | Endpoint CAP auth | User không đăng nhập được nếu endpoint không còn khớp với `AuthService`. | `srv/auth.cds`, `srv/auth.js` |
| `sap.ui.require([...])` | Dependency UI5 controls | Màn hình login có thể trắng nếu thiếu thư viện control. | `login.html` `data-sap-ui-libs`, UI5 linter |
| `new MessageStrip({ type: MessageType.Error })` | Lỗi hiển thị cho user | Lỗi login có thể khó hiểu hoặc lộ chi tiết nếu thay bằng raw backend text. | `srv/auth.js` phần sanitize lỗi IDTS-39 |
| `JSON.stringify({ email: email, password: password })` | Payload login | Backend không verify credential được nếu đổi shape sai. | Test auth IDTS-34/IDTS-39 |
| `sessionStorage.setItem(TOKEN_KEY, result.token)` | Tạo session browser | App không gọi được protected OData sau login nếu thiếu token. | `auth-guard.js`, `srv/auth/custom-auth.js` |
| `sessionStorage.setItem(USER_KEY, JSON.stringify(result.user))` | Trạng thái profile đã đăng nhập | Profile popover không hiện tên/email/role nếu thiếu safe user profile. | `auth-guard.js` profile shell IDTS-53 |
| `goToApp()` | Bàn giao từ login sang app | Login thành công có thể bị loop hoặc vào sai trang nếu redirect sai. | `index.html`, `auth-guard.js` |

### Liên kết với folder khác

- `srv/auth.cds` định nghĩa action `login` mà file này gọi.
- `srv/auth.js` verify credential, sanitize lỗi login bất thường, và trả public user profile.
- `srv/auth/custom-auth.js` sau đó validate bearer token mà file này lưu.
- `db/schema.cds` chứa `Users.passwordHash` và `AuthSessions`, được đọc/ghi trong request login.
- `app/bug-management-ui/webapp/auth-guard.js` dùng token và user profile đã lưu sau khi redirect.

### Checklist sửa file an toàn

- Không bao giờ lưu password ở bất kỳ đâu sau khi request được gửi.
- Không in password, token, raw backend error, private endpoint, hoặc dữ liệu QA user thật.
- Giữ thông báo lỗi backend ở mức generic trừ khi backend chủ động trả message an toàn cho client.
- Nếu đổi storage keys, phải cập nhật `auth-guard.js` và helper trong `LoginController.js` cùng lúc.
- Nếu đổi UI5 controls, kiểm tra lại bootstrap library trong `login.html` và chạy UI5 checks.
- Browser smoke tối thiểu các đường: submit rỗng, sai password, login đúng, protected OData sau redirect.

## Symbol walkthrough and breakpoint order / Walkthrough theo symbol và thứ tự breakpoint (2026-07-18)

**English.** Button/Enter → `submitLogin()` validates email/password → `fetch('/odata/v4/auth/login')` → `readSafeError()` for expected 400/401 or a generic message for 5xx → success stores token/user/expiry → `goToApp()` opens `index.html` → auth guard injects the token. `setBusy()` prevents duplicate submits; `resetValueStates()` and message helpers only change UI state. Watch trimmed email, HTTP status, safe response shape, and session key presence; never inspect/log the password or full token.

**Tiếng Việt.** Nút/Enter → `submitLogin()` kiểm email/password → `fetch('/odata/v4/auth/login')` → `readSafeError()` dùng message an toàn cho 400/401 hoặc message chung cho 5xx → thành công lưu token/user/expiry → `goToApp()` mở `index.html` → auth guard gắn token. `setBusy()` ngăn submit trùng; các helper reset/message chỉ đổi trạng thái UI. Quan sát email đã trim, HTTP status, shape response an toàn và session key có tồn tại; không xem/log password hoặc toàn bộ token.
