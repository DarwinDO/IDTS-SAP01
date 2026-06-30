# Knowledge: app/bug-management-ui/webapp/ext/login/LoginController.js (IDTS-35)

Last updated: 2026-06-30
Related task: IDTS-35 (Login UI and authenticated app session)
Member: DatDT

## Purpose

`LoginController.js` is a session utility module for the IDTS FE login feature.
After the architecture was finalised (IDTS-35 DonHV review), its role is:

- **Session helpers** exposed as static methods on the constructor so any module
  can call them without instantiating a controller.
- NOT used to render a login dialog anymore (dialog approach was superseded by
  the standalone `login.html` page).

## Static helpers

| Method | Signature | Description |
| --- | --- | --- |
| `isAuthenticated()` | `() → Boolean` | Checks `sessionStorage` for a non-expired token |
| `getToken()` | `() → String\|null` | Returns the raw Bearer token string |
| `getUser()` | `() → Object\|null` | Returns the parsed user profile (`{ ID, displayName, email, role_code, roleName }`) |
| `logout()` | `() → void` | Calls `/odata/v4/auth/logout` then clears session |
| `clearSession()` | `() → void` | Removes all three sessionStorage keys without calling the server |

## sessionStorage keys

| Key | Value |
| --- | --- |
| `idts_auth_token` | Bearer token string |
| `idts_auth_user` | JSON-serialised user profile |
| `idts_auth_expires` | ISO timestamp string of token expiry |

## Who uses this module

- `auth-guard.js` — reads `idts_auth_token` directly (same keys, no import needed
  because auth-guard.js runs before UI5 AMD is available)
- Any future UI5 controller that needs the current user profile or token

## Files NOT used by the standalone login.html flow

The following files were created during an earlier implementation pass but are
**not part of the active flow**. They were removed in the DonHV review fix commit:

- `LoginDialog.fragment.xml` — removed
- `login.css` — removed

The active authentication flow is:
```
login.html / login-page.js  ──POST /odata/v4/auth/login──▶  sessionStorage
auth-guard.js (pre-bootstrap in index.html)  ──reads token──▶  XHR interceptor
LoginController.js  ──static helpers──▶  any module that needs user info
```

## Backend contract reference

```
POST /odata/v4/auth/login
  Body:    { "email": "...", "password": "..." }
  Success: { "token": "...", "tokenType": "Bearer", "expiresAt": "...", "user": {...} }

POST /odata/v4/auth/logout   (Authorization: Bearer <token>)
GET  /odata/v4/auth/me()     (Authorization: Bearer <token>)
```

## Vietnamese

`LoginController.js` là module tiện ích quản lý session. Sau khi kiến trúc được xác nhận
(DonHV review), vai trò của nó là cung cấp các static helper (`isAuthenticated`, `getToken`,
`getUser`, `logout`, `clearSession`) cho các module khác sử dụng. Không còn dùng để render
login dialog nữa — flow đăng nhập hiện dùng `login.html` standalone.
