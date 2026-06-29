# Knowledge: `srv/auth/passwords.js`

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
