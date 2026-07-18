# Knowledge: `srv/auth/passwords.js`

## Beginner-first execution map (2026-07-18)

### English

`auth.js` and password setup tooling call this cryptographic helper. `normalizePassword` validates type/length before expensive bcrypt work. `hashPassword` returns a bcrypt hash for storage; `verifyPassword` returns only true/false. `createSessionToken` produces the raw unpredictable token returned once to the browser, while `hashToken` produces the SHA-256 lookup value stored in AuthSessions. `addMinutes` calculates expiry without mutating the input date. A safe debugger observes lengths/booleans and timestamps, never the actual password or token. Changing hash/token format requires a migration/compatibility plan for existing users/sessions.

### Vietnamese

`auth.js` và công cụ set password gọi helper mật mã này. `normalizePassword` kiểm kiểu/độ dài trước khi chạy bcrypt tốn tài nguyên. `hashPassword` trả bcrypt hash để lưu; `verifyPassword` chỉ trả true/false. `createSessionToken` sinh raw token khó đoán được trả một lần cho browser, còn `hashToken` tạo giá trị SHA-256 lưu trong AuthSessions để lookup. `addMinutes` tính expiry mà không sửa Date input. Khi debug an toàn chỉ xem độ dài/boolean/timestamp, không xem password hay token thật. Đổi format hash/token cần kế hoạch tương thích/migrate user và session cũ.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: DatDT. Flow: password/session cryptography. Inspect inputs only in a local controlled debug session. This module must return derived hashes and verification results, never expose raw credentials to logs, API responses, or evidence.

### Vietnamese

Primary owner: DonHV. Backup: DatDT. Flow: password/session cryptography. Chỉ quan sát input trong local debug có kiểm soát. Module này chỉ trả derived hash và kết quả verify, không được đưa credential thô vào log, API response hay evidence.

## English

### What this file is for

This file contains low-level password and token utilities for IDTS custom authentication.

### Beginner explanation

The backend must never store real passwords. Instead, it stores a slow hash created with Node.js `crypto.scrypt`. For sessions, it also avoids storing the raw bearer token; it stores only a SHA-256 hash of that token.

### IDTS flow

1. Dev/admin sets a local password through a private environment-based script.
2. `hashPassword` creates a salted scrypt hash.
3. `verifyPassword` checks login attempts safely.
4. `createSessionToken` creates a random bearer token.
5. `hashToken` stores/looks up the token through a hash.

### Important source anchors

- **Location**: `hashPassword(password)`
  **IDTS concept**: Password-at-rest protection.
  **Impact if broken**: Passwords may be weakly stored or login may stop working.
  **Must check together**: `srv/auth.js`, `scripts/dev/set-local-user-password.js`.

- **Location**: `hashToken(token)`
  **IDTS concept**: Bearer token storage safety.
  **Impact if broken**: Raw tokens might be stored, or valid tokens might not map to sessions.
  **Must check together**: `srv/auth/custom-auth.js`, `db/schema.cds` `AuthSessions`.

### Cross-folder impact

- Used by `srv/auth.js` for login/session creation.
- Used by `srv/auth/custom-auth.js` for token lookup.
- Used by `scripts/qa/test-auth-foundation-programmatic.js` and `scripts/dev/set-local-user-password.js`.

### Safe editing checklist

- Do not replace scrypt with a plain hash for passwords.
- Do not remove timing-safe comparison.
- Do not print passwords, hashes, or tokens.
- Keep output format backward-compatible unless a migration is planned.

## Vietnamese

### File nay dung de lam gi

File nay chua cac utility muc thap cho password va token cua custom authentication trong IDTS.

### Giai thich cho nguoi moi

Backend khong duoc luu password that. Thay vao do, no luu slow hash tao bang Node.js `crypto.scrypt`. Voi session, backend cung khong luu raw bearer token; no chi luu SHA-256 hash cua token.

### Flow IDTS

1. Dev/admin set password local bang script doc bien moi truong private.
2. `hashPassword` tao salted scrypt hash.
3. `verifyPassword` check login attempt an toan.
4. `createSessionToken` tao bearer token ngau nhien.
5. `hashToken` luu/lookup token thong qua hash.

### Anchor quan trong

- **Vi tri**: `hashPassword(password)`
  **Khai niem IDTS**: Bao ve password khi luu trong DB.
  **Anh huong neu sai**: Password co the bi luu yeu, hoac login ngung hoat dong.
  **Phai kiem tra cung**: `srv/auth.js`, `scripts/dev/set-local-user-password.js`.

- **Vi tri**: `hashToken(token)`
  **Khai niem IDTS**: Luu bearer token an toan.
  **Anh huong neu sai**: Raw token co the bi luu, hoac token hop le khong map duoc session.
  **Phai kiem tra cung**: `srv/auth/custom-auth.js`, `db/schema.cds` `AuthSessions`.

### Lien ket voi file khac

- `srv/auth.js` dung khi tao login/session.
- `srv/auth/custom-auth.js` dung khi lookup token.
- `scripts/qa/test-auth-foundation-programmatic.js` va `scripts/dev/set-local-user-password.js` dung de verify/setup.

### Checklist sua an toan

- Khong thay scrypt bang hash thuong cho password.
- Khong bo timing-safe comparison.
- Khong print password, hash hoac token.
- Giu format output backward-compatible tru khi co migration plan.

## Metadata

- Source file: `srv/auth/passwords.js`
- Knowledge mirror: `docs/knowledge/srv/auth/passwords.js.md`
- Last reviewed: 2026-06-29
