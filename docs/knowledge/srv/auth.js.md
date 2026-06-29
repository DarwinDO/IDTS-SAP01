# Knowledge: `srv/auth.js`

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
5. `logout` revokes the session by setting `revokedAt`.
6. `me` returns safe current-user profile data.

### Important source anchors

- **Location**: `login(req)`
  **IDTS concept**: Custom email/password login.
  **Impact if broken**: Active users cannot get a token, or wrong/inactive users may be accepted.
  **Must check together**: `db/schema.cds` `Users`, `srv/auth/passwords.js`, auth QA script.

- **Location**: `INSERT.into('idts.cap.AuthSessions')`
  **IDTS concept**: Server-side session storage.
  **Impact if broken**: Bearer token cannot be validated later; logout cannot revoke the session.
  **Must check together**: `srv/auth/custom-auth.js`, `db/schema.cds` `AuthSessions`.

### Cross-folder impact

- Reads `Users` and writes `AuthSessions` from `db/schema.cds`.
- Implements actions declared in `srv/auth.cds`.
- Produces tokens consumed by `srv/auth/custom-auth.js`.
- Gives FE `IDTS-35` a stable response shape.

### Safe editing checklist

- Never return `passwordHash`.
- Never store the raw bearer token in DB.
- Keep failure message safe: `Invalid email or password.`
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
5. `logout` revoke session bang cach set `revokedAt`.
6. `me` tra safe current-user profile data.

### Anchor quan trong

- **Vi tri**: `login(req)`
  **Khai niem IDTS**: Custom login bang email/password.
  **Anh huong neu sai**: User active khong lay duoc token, hoac user sai/inactive co the bi accept.
  **Phai kiem tra cung**: `db/schema.cds` `Users`, `srv/auth/passwords.js`, auth QA script.

- **Vi tri**: `INSERT.into('idts.cap.AuthSessions')`
  **Khai niem IDTS**: Luu session phia server.
  **Anh huong neu sai**: Bearer token khong validate duoc ve sau; logout khong revoke duoc session.
  **Phai kiem tra cung**: `srv/auth/custom-auth.js`, `db/schema.cds` `AuthSessions`.

### Lien ket voi file khac

- Doc `Users` va ghi `AuthSessions` tu `db/schema.cds`.
- Implement actions khai bao trong `srv/auth.cds`.
- Tao token cho `srv/auth/custom-auth.js` verify.
- Tao response shape on dinh cho FE `IDTS-35`.

### Checklist sua an toan

- Khong bao gio return `passwordHash`.
- Khong bao gio luu raw bearer token trong DB.
- Giu message fail an toan: `Invalid email or password.`
- Giu role mapping khop MVP roles: Tester, Developer, PM.

## Metadata

- Source file: `srv/auth.js`
- Knowledge mirror: `docs/knowledge/srv/auth.js.md`
- Last reviewed: 2026-06-29
