# `app/router/resources/login.html` knowledge mirror

## Purpose

This tiny page is the protected SAP BTP login bridge. AppRouter requires XSUAA
for `/login.html`; therefore a top-level visit starts or restores the SAP login
session before this file is served. Its meta refresh then opens the Fiori app.

## Caller → current file → next dependency

| Caller | Current behavior | Next dependency / side effect |
| --- | --- | --- |
| `logged-out.html` Sign in link | Browser navigates to `/login.html`. | AppRouter applies `authenticationType: xsuaa`. |
| XSUAA callback | AppRouter serves this page only after authentication succeeds. | Meta refresh opens `/idtsbugmanagementui/index.html`. |
| `auth-guard.js` HTML-response recovery | A stale/expired session redirects the whole browser here. | The next `AuthService.me` call receives JSON instead of an XSUAA HTML redirect document. |

The page contains no credential form, token handling, storage access or custom
authentication logic. If re-login loops, inspect the top-level `/login.html`
navigation and XSUAA callback before debugging CAP user mapping.

## Giải thích tiếng Việt

Đây là “cầu đăng nhập” rất nhỏ. Route `/login.html` bắt buộc XSUAA, nên SAP phải
xác thực xong trước khi AppRouter trả file này. Sau đó meta refresh mới chuyển
người dùng vào Fiori app. File không đọc mật khẩu, token, cookie hay storage.

Nếu bị lặp đăng nhập, kiểm tra theo thứ tự: `/login.html` → XSUAA callback →
`/idtsbugmanagementui/index.html` → `AuthService.me`. Không kết luận sai rằng
user chưa được đăng ký chỉ vì `fetch()` nhận một trang HTML đăng nhập.
