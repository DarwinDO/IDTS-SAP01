# Knowledge: `srv/auth/custom-auth.js`

## Beginner-first execution map (2026-07-18)

### English

Every protected HTTP request enters exported `idtsCustomAuth` before CAP authorization. `bearerTokenFrom` reads only the Authorization header, the middleware hashes that raw token, queries an unrevoked/unexpired AuthSession with active User, updates last-use information, and attaches trusted identity for CAP before `next()`. Missing/invalid/expired tokens return generic 401. Database/runtime failures return an availability error and are logged only after sanitization. Breakpoints: middleware entry → extracted token presence (not value) → session query result → `isExpired` → immediately before `next()`. If `next()` is not reached, `srv/service.js` cannot receive the request.

### Vietnamese

Mọi HTTP request protected đi vào hàm export `idtsCustomAuth` trước authorization của CAP. `bearerTokenFrom` chỉ đọc Authorization header; middleware hash raw token đó, query AuthSession chưa revoke/chưa hết hạn cùng User active, cập nhật lần dùng và gắn identity đáng tin cho CAP trước khi gọi `next()`. Token thiếu/sai/hết hạn trả 401 chung. Lỗi database/runtime trả lỗi availability và chỉ log sau khi sanitize. Thứ tự breakpoint: đầu middleware → có/không có token (không xem giá trị) → kết quả query session → `isExpired` → ngay trước `next()`. Nếu không tới `next()`, `srv/service.js` chưa thể nhận request.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: DatDT. Flow: bearer token -> CAP request user. Break where `AuthSessions` is read when a protected endpoint unexpectedly returns 401/403. Check `auth.js` session creation and client auth-guard together; never paste a bearer token into a note.

### Vietnamese

Primary owner: DonHV. Backup: DatDT. Flow: bearer token -> CAP request user. Đặt breakpoint tại chỗ đọc `AuthSessions` khi endpoint protected trả 401/403 bất ngờ. Kiểm tra cùng `auth.js` session creation và client auth-guard; không paste bearer token vào note.

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
7. If the middleware itself hits an unexpected database/runtime error, it returns a generic `AUTHENTICATION_UNAVAILABLE` response instead of forwarding raw SQL or stack traces to the client.

### Important source anchors

- **Location**: `bearerTokenFrom(req)`
  **IDTS concept**: Token extraction.
  **Impact if broken**: Authenticated FE requests cannot be recognized.
  **Must check together**: FE `Authorization` header handling in `IDTS-35`.

- **Location**: `cds.context.user = new cds.User(...)`
  **IDTS concept**: Request-user mapping.
  **Impact if broken**: Permission checks, history actor, comments, and role-based actions use the wrong user.
  **Must check together**: `srv/bug-service/helpers.js`, `srv/bug-service/permissions.js`, auth QA script.

- **Location**: `catch (error)` inside `idtsCustomAuth`
  **IDTS concept**: Safe protected-request auth failure.
  **Impact if broken**: Internal database errors during token validation may leak to API clients or UI error dialogs.
  **Must check together**: `srv/auth.js`, `scripts/qa/test-auth-foundation-programmatic.js`, protected OData browser smoke.

### Cross-folder impact

- Uses `AuthSessions` and `Users` from `db/schema.cds`.
- Receives tokens created by `srv/auth.js`.
- Enables `BugService` authorization in `srv/service.cds`.
- Protects any authenticated OData/Fiori call from raw auth middleware errors.

### Safe editing checklist

- Do not accept expired or revoked sessions.
- Do not log tokens.
- Keep role names exactly aligned with existing backend checks.
- Invalid tokens should receive 401 with a safe message.
- Unexpected middleware errors should receive a generic 500 response and only sanitized diagnostic fields should be logged.

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
7. Neu middleware gap loi database/runtime bat ngo, no tra response generic `AUTHENTICATION_UNAVAILABLE` thay vi day raw SQL hoac stack trace ra client.

### Anchor quan trong

- **Vi tri**: `bearerTokenFrom(req)`
  **Khai niem IDTS**: Lay token tu request.
  **Anh huong neu sai**: FE request da login khong duoc nhan dien.
  **Phai kiem tra cung**: FE `Authorization` header handling trong `IDTS-35`.

- **Vi tri**: `cds.context.user = new cds.User(...)`
  **Khai niem IDTS**: Map request thanh user.
  **Anh huong neu sai**: Permission checks, history actor, comments va role-based actions se dung sai user.
  **Phai kiem tra cung**: `srv/bug-service/helpers.js`, `srv/bug-service/permissions.js`, auth QA script.

- **Vi tri**: `catch (error)` trong `idtsCustomAuth`
  **Khai niem IDTS**: Xu ly loi auth an toan cho request protected.
  **Anh huong neu sai**: Loi database noi bo khi validate token co the bi leak ra API client hoac UI error dialog.
  **Phai kiem tra cung**: `srv/auth.js`, `scripts/qa/test-auth-foundation-programmatic.js`, protected OData browser smoke.

### Lien ket voi file khac

- Dung `AuthSessions` va `Users` tu `db/schema.cds`.
- Nhan token duoc tao boi `srv/auth.js`.
- Bat authentication cho `BugService` trong `srv/service.cds`.
- Bao ve moi request OData/Fiori da login khoi raw error phat sinh trong auth middleware.

### Checklist sua an toan

- Khong accept session het han hoac da revoke.
- Khong log token.
- Giu role names khop voi backend checks hien co.
- Token sai tra 401 voi message an toan.
- Loi middleware bat ngo nen tra generic 500 va chi log diagnostic da sanitize.

## Metadata

- Source file: `srv/auth/custom-auth.js`
- Knowledge mirror: `docs/knowledge/srv/auth/custom-auth.js.md`
- Last reviewed: 2026-07-03
