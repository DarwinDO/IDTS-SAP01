# Knowledge: `srv/auth.js`

## Beginner-first execution map (2026-07-18)

### English

`AuthService.init()` wires CDS operations to `login/logout/me`. For login, execution is: normalize email → query active User → `verifyPassword` → create raw session token → hash token → INSERT AuthSessions → `publicUser` → return token/profile. Wrong email and wrong password both reach `rejectInvalidCredentials`, preventing account enumeration. Logout hashes the presented bearer token and sets `revokedAt`; `me` returns only the already-authenticated profile. Internal failures pass through `safeAuthErrorDiagnostic` before server logging and return a generic response. Debug with `req.data`, queried `user`, boolean password result, session expiry, and the returned public object; never inspect/copy the plain password/token into evidence.

### Vietnamese

`AuthService.init()` nối operation CDS với `login/logout/me`. Khi login, thứ tự là: chuẩn hóa email → query User active → `verifyPassword` → sinh raw session token → hash token → INSERT AuthSessions → `publicUser` → trả token/profile. Email sai và password sai đều tới `rejectInvalidCredentials`, tránh lộ account nào tồn tại. Logout hash bearer token đang gửi và set `revokedAt`; `me` chỉ trả profile đã được xác thực. Lỗi nội bộ đi qua `safeAuthErrorDiagnostic` trước khi log server và response chỉ dùng message chung. Khi debug, xem `req.data`, `user` query được, kết quả boolean password, session expiry và public object trả về; không copy password/token thô vào evidence.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: DatDT. Flow: login -> Users/AuthSessions -> bearer token. Break at `login`, password verification, and session INSERT. Never record the password or returned token; verify that only a token hash persists. Check `custom-auth.js` for later protected requests.

### Vietnamese

Primary owner: DonHV. Backup: DatDT. Flow: login -> Users/AuthSessions -> bearer token. Đặt breakpoint tại `login`, password verification và session INSERT. Không ghi password hoặc token trả về; xác nhận chỉ token hash được persist. Với request protected sau đó, kiểm tra `custom-auth.js`.

## English

### What this file is for

This file implements `AuthService`. It turns the CDS contract in `srv/auth.cds` into working login, logout, and current-user behavior.

### Beginner explanation

CAP service files declare "what APIs exist"; JavaScript service files implement "what happens when the API is called." Here, login checks the user email and password hash, creates a session row, and returns a bearer token to the frontend.

### IDTS flow

1. `login` normalizes the email.
2. It reads the active `Users` row and its `passwordHash`.
3. It verifies the password using `srv/auth/passwords.js`.
4. It creates an `AuthSessions` row with a hash of the token, not the raw token.
5. If login fails because the email/password is wrong or the user is inactive, the service returns the same safe 401 message.
6. If login fails because the database/runtime has an unexpected error, the service logs only sanitized diagnostic fields and returns a generic 500 message. This prevents raw SQL, table names, column names, tokens, passwords, or hostnames from appearing in the login UI.
7. CAP validates malformed `login` parameters before dispatching `AuthService.login`. A post-adapter middleware registered in `server.js` therefore rewrites only `ASSERT_DATA_TYPE` failures for `email` or `password` on `POST /odata/v4/auth/login` to the stable HTTP 400 `INVALID_LOGIN_REQUEST` response. Other routes and errors pass through unchanged.
8. `logout` revokes the session by setting `revokedAt`.
9. `me` returns safe current-user profile data.

### Important source anchors

- **Location**: `login(req)`
  **IDTS concept**: Custom email/password login.
  **Impact if broken**: Active users cannot get a token, or wrong/inactive users may be accepted.
  **Must check together**: `db/schema.cds` `Users`, `srv/auth/passwords.js`, auth QA script.

- **Location**: `INSERT.into('idts.cap.AuthSessions')`
  **IDTS concept**: Server-side session storage.
  **Impact if broken**: Bearer token cannot be validated later; logout cannot revoke the session.
  **Must check together**: `srv/auth/custom-auth.js`, `db/schema.cds` `AuthSessions`.

- **Location**: `catch (error)` inside `login(req)`
  **IDTS concept**: Safe login error handling.
  **Impact if broken**: Raw database errors such as missing columns or SQL text may appear on the login page.
  **Must check together**: `scripts/qa/test-auth-foundation-programmatic.js`, `app/bug-management-ui/webapp/login-page.js`, `srv/auth/custom-auth.js`.

### Cross-folder impact

- Reads `Users` and writes `AuthSessions` from `db/schema.cds`.
- Implements actions declared in `srv/auth.cds`.
- Produces tokens consumed by `srv/auth/custom-auth.js`.
- Gives FE `IDTS-35` a stable response shape.
- Protects the login UI from displaying backend internals when local SQLite or cloud PostgreSQL schema is stale.

### Safe editing checklist

- Never return `passwordHash`.
- Never store the raw bearer token in DB.
- Keep failure message safe: `Invalid email or password.`
- Keep unexpected login errors generic for the client: do not expose SQL, table names, column names, stack traces, tokens, passwords, or hostnames.
- If more diagnostic detail is needed, add sanitized server-side fields only and extend the auth QA script.
- Keep role mapping compatible with current MVP roles: Tester, Developer, PM.

## Vietnamese

### File nay dung de lam gi

File nay implement `AuthService`. No bien contract CDS trong `srv/auth.cds` thanh login, logout va current-user behavior that.

### Giai thich cho nguoi moi

File service CDS khai bao "API nao ton tai"; file JavaScript service implement "chuyen gi xay ra khi API duoc goi." O day, login check email va password hash, tao session row, roi tra bearer token cho frontend.

### Flow IDTS

1. `login` normalize email.
2. Doc row `Users` active va `passwordHash`.
3. Verify password bang `srv/auth/passwords.js`.
4. Tao row `AuthSessions` voi hash cua token, khong luu raw token.
5. Neu login fail vi sai email/password hoac user inactive, service tra cung mot message 401 an toan.
6. Neu login fail vi loi database/runtime bat ngo, service chi log cac field diagnostic da sanitize va tra message 500 chung chung. Cach nay ngan raw SQL, ten bang, ten cot, token, password hoac hostname hien ra tren man hinh login.
7. CAP validate tham so `login` sai kieu truoc khi dispatch `AuthService.login`. Vi vay middleware sau OData adapter duoc dang ky trong `server.js` chi rewrite `ASSERT_DATA_TYPE` cua `email` hoac `password` tren `POST /odata/v4/auth/login` thanh response HTTP 400 `INVALID_LOGIN_REQUEST` on dinh. Route va loi khac van duoc chuyen tiep nguyen trang.
8. `logout` revoke session bang cach set `revokedAt`.
9. `me` tra safe current-user profile data.

### Anchor quan trong

- **Vi tri**: `login(req)`
  **Khai niem IDTS**: Custom login bang email/password.
  **Anh huong neu sai**: User active khong lay duoc token, hoac user sai/inactive co the bi accept.
  **Phai kiem tra cung**: `db/schema.cds` `Users`, `srv/auth/passwords.js`, auth QA script.

- **Vi tri**: `INSERT.into('idts.cap.AuthSessions')`
  **Khai niem IDTS**: Luu session phia server.
  **Anh huong neu sai**: Bearer token khong validate duoc ve sau; logout khong revoke duoc session.
  **Phai kiem tra cung**: `srv/auth/custom-auth.js`, `db/schema.cds` `AuthSessions`.

- **Vi tri**: `catch (error)` trong `login(req)`
  **Khai niem IDTS**: Xu ly loi login an toan.
  **Anh huong neu sai**: Loi database tho nhu missing column hoac SQL text co the hien tren trang login.
  **Phai kiem tra cung**: `scripts/qa/test-auth-foundation-programmatic.js`, `app/bug-management-ui/webapp/login-page.js`, `srv/auth/custom-auth.js`.

### Lien ket voi file khac

- Doc `Users` va ghi `AuthSessions` tu `db/schema.cds`.
- Implement actions khai bao trong `srv/auth.cds`.
- Tao token cho `srv/auth/custom-auth.js` verify.
- Tao response shape on dinh cho FE `IDTS-35`.
- Bao ve UI login khong hien chi tiet noi bo backend khi schema SQLite local hoac PostgreSQL cloud bi lech.

### Checklist sua an toan

- Khong bao gio return `passwordHash`.
- Khong bao gio luu raw bearer token trong DB.
- Giu message fail an toan: `Invalid email or password.`
- Giu loi login bat ngo o dang generic cho client: khong lo SQL, ten bang, ten cot, stack trace, token, password hoac hostname.
- Neu can them diagnostic, chi them field da sanitize o server log va mo rong auth QA script.
- Giu role mapping khop MVP roles: Tester, Developer, PM.

## Metadata

- Source file: `srv/auth.js`
- Knowledge mirror: `docs/knowledge/srv/auth.js.md`
- Last reviewed: 2026-08-04

## IDTS-113 update - dual authentication runtime

### English

`AuthService` now has two intentional runtime paths:

- Local development and Render integration keep the existing custom
  email/password login and hashed `AuthSessions`.
- SAP BTP production uses AppRouter/XSUAA. In this mode `login` is rejected
  with HTTP 405, `logout` is handled by AppRouter, and `me` maps the JWT
  identity to an active IDTS `Users` row.

After the database user is found, `me` calls the platform-role validator. The
XSUAA business role must match `Users.role_code`; otherwise the request is
rejected. This prevents a BTP role assignment and the IDTS business role from
silently disagreeing.

Breakpoint order on BTP: `me(req)` -> JWT identity candidates ->
`activeUserFromCandidate()` -> `enforcePlatformRoleAlignment()` ->
`publicUser()`. Observe only the presence of identity claims and the resolved
user ID/role. Never print a JWT, password hash, or full credential.

### Vietnamese

`AuthService` co hai duong chay co chu dich:

- Local va Render integration tiep tuc dung login email/password va
  `AuthSessions` luu token da bam.
- SAP BTP production dung AppRouter/XSUAA. O day `login` tra HTTP 405,
  AppRouter xu ly logout, con `me` anh xa danh tinh JWT vao mot dong `Users`
  dang active.

Sau khi tim duoc user trong database, `me` kiem tra role BTP co trung voi
`Users.role_code` hay khong. Neu khong trung, request bi tu choi de tranh viec
quyen tren BTP va quyen nghiep vu IDTS mau thuan.

Thu tu breakpoint tren BTP: `me(req)` -> cac identity candidate trong JWT ->
`activeUserFromCandidate()` -> `enforcePlatformRoleAlignment()` ->
`publicUser()`. Chi quan sat viec claim co ton tai va user ID/role da resolve;
khong in JWT, password hash hoac credential.
