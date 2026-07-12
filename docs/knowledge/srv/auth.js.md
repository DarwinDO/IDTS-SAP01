# Knowledge: `srv/auth.js`

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
7. `logout` revokes the session by setting `revokedAt`.
8. `me` returns safe current-user profile data.

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
7. `logout` revoke session bang cach set `revokedAt`.
8. `me` tra safe current-user profile data.

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
- Last reviewed: 2026-07-03
