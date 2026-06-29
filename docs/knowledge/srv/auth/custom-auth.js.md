# Knowledge: `srv/auth/custom-auth.js`

## English

### What this file is for

This file is the CAP custom authentication middleware. It reads a bearer token from the HTTP request, validates it against `AuthSessions`, and sets `cds.context.user`.

### Beginner explanation

CAP authorization checks use `req.user` / `cds.context.user`. Before this file, local development used CAP mock users. With IDTS-34, an HTTP request becomes authenticated only when it sends a valid bearer token created by `AuthService.login`.

### IDTS flow

1. Browser sends `Authorization: Bearer <token>`.
2. Middleware hashes the token and looks up `AuthSessions.tokenHash`.
3. It rejects revoked or expired sessions.
4. It reads the active `Users` row.
5. It creates `cds.User` with `authenticated-user` and the business role (`PM`, `DEVELOPER`, `TESTER`).
6. `BugService @(requires: 'authenticated-user')` can then accept the request.

### Important source anchors

- **Location**: `bearerTokenFrom(req)`
  **IDTS concept**: Token extraction.
  **Impact if broken**: Authenticated FE requests cannot be recognized.
  **Must check together**: FE `Authorization` header handling in `IDTS-35`.

- **Location**: `cds.context.user = new cds.User(...)`
  **IDTS concept**: Request-user mapping.
  **Impact if broken**: Permission checks, history actor, comments, and role-based actions use the wrong user.
  **Must check together**: `srv/bug-service/helpers.js`, `srv/bug-service/permissions.js`, auth QA script.

### Cross-folder impact

- Uses `AuthSessions` and `Users` from `db/schema.cds`.
- Receives tokens created by `srv/auth.js`.
- Enables `BugService` authorization in `srv/service.cds`.

### Safe editing checklist

- Do not accept expired or revoked sessions.
- Do not log tokens.
- Keep role names exactly aligned with existing backend checks.
- Invalid tokens should receive 401 with a safe message.

## Vietnamese

### File nay dung de lam gi

File nay la custom authentication middleware cua CAP. No doc bearer token tu HTTP request, validate voi `AuthSessions`, roi set `cds.context.user`.

### Giai thich cho nguoi moi

CAP authorization dung `req.user` / `cds.context.user`. Truoc file nay, local development dung CAP mock users. Voi IDTS-34, mot HTTP request chi duoc xem la authenticated khi gui bearer token hop le duoc tao boi `AuthService.login`.

### Flow IDTS

1. Browser gui `Authorization: Bearer <token>`.
2. Middleware hash token va lookup `AuthSessions.tokenHash`.
3. Reject session da revoke hoac het han.
4. Doc row `Users` active.
5. Tao `cds.User` voi `authenticated-user` va business role (`PM`, `DEVELOPER`, `TESTER`).
6. `BugService @(requires: 'authenticated-user')` co the accept request.

### Anchor quan trong

- **Vi tri**: `bearerTokenFrom(req)`
  **Khai niem IDTS**: Lay token tu request.
  **Anh huong neu sai**: FE request da login khong duoc nhan dien.
  **Phai kiem tra cung**: FE `Authorization` header handling trong `IDTS-35`.

- **Vi tri**: `cds.context.user = new cds.User(...)`
  **Khai niem IDTS**: Map request thanh user.
  **Anh huong neu sai**: Permission checks, history actor, comments va role-based actions se dung sai user.
  **Phai kiem tra cung**: `srv/bug-service/helpers.js`, `srv/bug-service/permissions.js`, auth QA script.

### Lien ket voi file khac

- Dung `AuthSessions` va `Users` tu `db/schema.cds`.
- Nhan token duoc tao boi `srv/auth.js`.
- Bat authentication cho `BugService` trong `srv/service.cds`.

### Checklist sua an toan

- Khong accept session het han hoac da revoke.
- Khong log token.
- Giu role names khop voi backend checks hien co.
- Token sai tra 401 voi message an toan.

## Metadata

- Source file: `srv/auth/custom-auth.js`
- Knowledge mirror: `docs/knowledge/srv/auth/custom-auth.js.md`
- Last reviewed: 2026-06-29
