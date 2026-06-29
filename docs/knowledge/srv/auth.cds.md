# Knowledge: `srv/auth.cds`

## English

### What this file is for

This file defines the public CAP OData contract for authentication. It creates a separate `AuthService` so login/logout APIs do not get mixed into the defect workflow service.

### Beginner explanation

`BugService` is for bugs. `AuthService` is for identity. Fiori will later call `AuthService.login` with email/password, receive a bearer token, and then send that token when calling `BugService`.

The file only declares the API shape. The password check and token creation happen in `srv/auth.js`.

### IDTS flow

1. FE calls `POST /odata/v4/auth/login`.
2. `srv/auth.js` verifies the password hash from `Users`.
3. Backend creates an `AuthSessions` row and returns a bearer token.
4. FE uses that bearer token for authenticated OData requests.
5. `srv/auth/custom-auth.js` maps the token back into `cds.User`.

### Important source anchors

- **Location**: `service AuthService`
  **IDTS concept**: Separate auth boundary.
  **Impact if broken**: Login APIs can disappear or become mixed with bug workflow APIs.
  **Must check together**: `srv/auth.js`, `package.json`, FE login task `IDTS-35`.

- **Location**: `action login(email, password) returns LoginResult`
  **IDTS concept**: Backend login contract for FE.
  **Impact if broken**: DatDT cannot implement login UI against a stable API.
  **Must check together**: `srv/auth.js`, `scripts/qa/test-auth-foundation-programmatic.js`.

### Cross-folder impact

- Depends on `db/schema.cds` `Users` and `AuthSessions`.
- Runtime behavior is implemented by `srv/auth.js`.
- Bearer token verification is implemented by `srv/auth/custom-auth.js`.
- FE will consume this in `IDTS-35`.

### Safe editing checklist

- Do not return `passwordHash`.
- Keep error behavior safe; login failure must not reveal whether email or password was wrong.
- If action names change, update FE task notes and auth tests.

## Vietnamese

### File nay dung de lam gi

File nay dinh nghia contract OData cong khai cho authentication. No tao `AuthService` rieng de API login/logout khong bi tron vao service workflow bug.

### Giai thich cho nguoi moi

`BugService` dung cho bug. `AuthService` dung cho danh tinh dang nhap. Sau nay Fiori se goi `AuthService.login` bang email/password, nhan bearer token, roi gui token do khi goi `BugService`.

File nay chi khai bao hinh dang API. Viec check password va tao token nam trong `srv/auth.js`.

### Flow IDTS

1. FE goi `POST /odata/v4/auth/login`.
2. `srv/auth.js` verify password hash tu `Users`.
3. Backend tao row `AuthSessions` va tra bearer token.
4. FE dung bearer token cho cac request OData can login.
5. `srv/auth/custom-auth.js` map token tro lai thanh `cds.User`.

### Anchor quan trong

- **Vi tri**: `service AuthService`
  **Khai niem IDTS**: Boundary auth rieng.
  **Anh huong neu sai**: API login co the bien mat hoac bi tron voi workflow bug.
  **Phai kiem tra cung**: `srv/auth.js`, `package.json`, FE login task `IDTS-35`.

- **Vi tri**: `action login(email, password) returns LoginResult`
  **Khai niem IDTS**: Contract login backend cho FE.
  **Anh huong neu sai**: DatDT khong co API on dinh de implement login UI.
  **Phai kiem tra cung**: `srv/auth.js`, `scripts/qa/test-auth-foundation-programmatic.js`.

### Lien ket voi file khac

- Phu thuoc `db/schema.cds` `Users` va `AuthSessions`.
- Runtime behavior nam trong `srv/auth.js`.
- Verify bearer token nam trong `srv/auth/custom-auth.js`.
- FE se dung service nay trong `IDTS-35`.

### Checklist sua an toan

- Khong return `passwordHash`.
- Login fail phai an toan; khong tiet lo email hay password sai rieng le.
- Neu doi ten action, cap nhat FE task notes va auth tests.

## Metadata

- Source file: `srv/auth.cds`
- Knowledge mirror: `docs/knowledge/srv/auth.cds.md`
- Last reviewed: 2026-06-29
