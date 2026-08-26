# Knowledge: `srv/auth.cds`

## Beginner-first contract map (2026-07-18)

### English

`login.html/LoginController.js` calls the three operations declared here; CAP routes them to the same-named handlers in `srv/auth.js`. `AuthUser` is the safe profile returned to the browser. `LoginResult.token` is the one-time raw bearer token; neither password hash nor database token hash is part of this CDS contract. `login` is public by necessity, while `logout` and `me` carry `@requires: 'authenticated-user'`, so the custom middleware must resolve a valid session first. Break first at the Network request, then at `login`, `logout`, or `me` in `srv/auth.js`. Changing a name/type here requires changing the UI caller and JavaScript handler together.

### Vietnamese

`login.html/LoginController.js` gọi ba operation được khai báo tại đây; CAP chuyển chúng tới handler cùng tên trong `srv/auth.js`. `AuthUser` là profile an toàn trả cho browser. `LoginResult.token` là raw bearer token chỉ trả một lần; password hash và token hash trong database không thuộc contract CDS này. `login` bắt buộc phải public, còn `logout` và `me` có `@requires: 'authenticated-user'`, nên middleware custom phải resolve session hợp lệ trước. Break đầu tiên tại Network request, sau đó tại `login`, `logout` hoặc `me` trong `srv/auth.js`. Đổi tên/type ở đây phải đổi đồng thời UI caller và JavaScript handler.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: DatDT. Flow: sign in, sign out, current user. Check this action contract before changing login UI calls. Its implementation is `srv/auth.js`; the UI caller is under `app/bug-management-ui/webapp/ext/login/`.

### Vietnamese

Primary owner: DonHV. Backup: DatDT. Flow: sign in, sign out, current user. Kiểm tra action contract này trước khi đổi login UI call. Implementation nằm ở `srv/auth.js`; UI caller nằm trong `app/bug-management-ui/webapp/ext/login/`.

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

## Gate 6.4 safe navigation capability / Capability điều hướng an toàn Gate 6.4

**English.** `AuthUser.canAdministerUsers` is a Boolean UX hint consumed by Bug Management. It does not grant access: AppRouter and CAP still enforce User Administration authorization. Custom authentication returns `false`; only an XSUAA request resolved to an active internal PM with aligned platform role and `UserAdmin` may receive `true`. Check `srv/auth.js`, the Bug Management session model, and `scripts/qa/test-auth-foundation-programmatic.js` together.

**Tiếng Việt.** `AuthUser.canAdministerUsers` là Boolean gợi ý UX cho Bug Management. Field này không cấp quyền: AppRouter và CAP vẫn kiểm soát User Administration. Custom auth luôn trả `false`; chỉ request XSUAA map đúng PM nội bộ đang active, platform role khớp và có `UserAdmin` mới nhận `true`. Khi sửa phải kiểm tra cùng `srv/auth.js`, session model của Bug Management và `scripts/qa/test-auth-foundation-programmatic.js`.
