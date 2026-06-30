# Knowledge: app/bug-management-ui/webapp/Component.js (IDTS-35)

Last updated: 2026-06-30
Related task: IDTS-35 (Login UI and authenticated app session)
Member: DatDT

## Purpose

`Component.js` is the SAPUI5 application entry point. As of IDTS-35 it extends
`sap/fe/core/AppComponent` and adds a custom auth gate on top.

## Auth Gate Behaviour (IDTS-35)

On `init()`:

1. Calls `LoginController.isAuthenticated()` to check whether a valid (non-expired)
   Bearer token exists in `sessionStorage`.
2. **Authenticated path**: attaches the XHR interceptor, then calls `super.init()`.
3. **Unauthenticated path**: opens the Login dialog (SAPUI5 `sap.m.Dialog`), waits for
   the user to log in successfully, then attaches the interceptor and calls `super.init()`.

## OData Auth Interceptor

Patches `XMLHttpRequest.prototype.open/send` once (guarded by `window.__idtsAuthInterceptorInstalled`).
On every XHR send, if the URL contains `/odata/v4/bug`, `/odata/v4/auth/logout`, or
`/odata/v4/auth/me`, the `Authorization: Bearer <token>` header is injected.

This means ALL OData V4 requests to BugService carry the session token without any
per-request setup in Fiori Elements controllers.

## Logout

No Fiori Launchpad shell is available in local dev, so `Component.js` exposes
`window.idtsLogout()` at runtime. Calling it invokes `LoginController.logout()` and
reloads the page.

## Files created/modified by IDTS-35

| File | Change |
| --- | --- |
| `webapp/Component.js` | Overridden to add auth gate and XHR interceptor |
| `webapp/ext/login/LoginDialog.fragment.xml` | New login dialog XML fragment |
| `webapp/ext/login/LoginController.js` | New login controller + static helpers |
| `webapp/ext/login/login.css` | Minimal dialog CSS |
| `webapp/manifest.json` | Added CSS reference for `ext/login/login.css` |
| `webapp/i18n/i18n.properties` | Added login-related i18n keys |

## Token Storage

`sessionStorage` only. Keys:
- `idts_auth_token` – Bearer token string
- `idts_auth_user` – JSON-serialised user profile `{ ID, displayName, email, role_code, roleName }`
- `idts_auth_expires` – ISO timestamp of token expiry

Tokens are **not** stored in `localStorage` (would survive browser restart) or cookies.
No password is ever stored.

## Backend Contract (from IDTS-34)

```
POST /odata/v4/auth/login
  Body:    { "email": "...", "password": "..." }
  Success: { "token": "...", "tokenType": "Bearer", "expiresAt": "...", "user": {...} }
  Failure: { "error": { "message": "..." } }

POST /odata/v4/auth/logout   (requires Authorization: Bearer <token>)
GET  /odata/v4/auth/me()     (requires Authorization: Bearer <token>)
```

## Cross-folder Links

- Backend contract: `srv/auth.cds`, `srv/auth.js`, `srv/auth/custom-auth.js`
- Knowledge: `docs/knowledge/srv/auth.cds.md`, `docs/knowledge/srv/auth.js.md`
- Task plan: `docs/pm/tasks/idts-34-38-auth-email.md`
- Jira: IDTS-35

Vietnamese:

`Component.js` là entry point của SAPUI5 app. Từ IDTS-35, nó thêm auth gate:

- Nếu có token hợp lệ trong `sessionStorage` → load app bình thường.
- Nếu không có token → mở Login dialog, đợi đăng nhập thành công rồi mới load app.
- Mọi XHR gọi `/odata/v4/bug` đều tự động được gắn header `Authorization: Bearer <token>`.
- Token lưu trong `sessionStorage`, không dùng `localStorage` hay cookie.
- Không lưu password ở bất kỳ đâu.
