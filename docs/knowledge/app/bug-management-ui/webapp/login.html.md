# Knowledge: app/bug-management-ui/webapp/login.html (IDTS-35)

Last updated: 2026-06-30
Related task: IDTS-35 (Login UI and authenticated app session)
Member: DatDT

## Purpose

`login.html` is a standalone, non-UI5 login page served from the same webapp
directory as `index.html`. It exists outside the Fiori Elements component
lifecycle so authentication completes before any OData model is created.

## Flow

```
User navigates (or is redirected from auth-guard.js)
        ↓
login.html loads with login-page.js
        ↓
User enters email + password → form submit
        ↓
login-page.js: fetch POST /odata/v4/auth/login
        ↓
On success: token stored in sessionStorage → redirect to index.html
On failure: error message shown in #errorBar div
```

## Files

| File | Role |
| --- | --- |
| `login.html` | HTML structure and CSS styles for the login card |
| `login-page.js` | All login logic (CSP-safe external script, no inline JS) |

## sessionStorage keys written

| Key | Value |
| --- | --- |
| `idts_auth_token` | Bearer token returned by the server |
| `idts_auth_user` | JSON-serialised user profile |
| `idts_auth_expires` | ISO expiry timestamp |

## Design decisions

- No UI5 bootstrap in `login.html` — keeps the page lightweight and avoids any
  dependency on the OData model or component lifecycle.
- CSS uses SAP Horizon color tokens (`#0a6ed1`, `#074491`) for visual consistency
  without requiring the UI5 theme loader.
- Inline `<script>` removed (DonHV review fix) and replaced with
  `<script src="login-page.js">` to satisfy CSP requirements.

## Vietnamese

`login.html` là trang đăng nhập standalone, không dùng UI5. Mục đích là hoàn thành
xác thực trước khi khởi tạo OData model. Sau khi login thành công, token được lưu
vào `sessionStorage` rồi trang redirect về `index.html`. Logic JS nằm trong
`login-page.js` (tách riêng để tuân thủ CSP).
