# `app/router/resources/logged-out.html` knowledge mirror

## Purpose

AppRouter serves this static page after `/do/logout`. It provides a neutral
boundary between ending the current IDTS application session and explicitly
starting the next SAP BTP login.

## Walkthrough

| Block | Input/trigger | Output/side effect | Failure check |
| --- | --- | --- | --- |
| Document metadata | Browser loads `/logged-out.html`. | Accessible English title and responsive viewport. | Check the page is rendered rather than redirected. |
| Self-contained Fiori-inspired layout | AppRouter serves the public page without the protected UI5 application. | Shows a responsive shell header, centered success card and visible keyboard focus without loading a CDN, font or script. | Keep the CSS and decorative SVG local so logout remains available independently of SAPUI5 and application authentication. |
| Signed-out message | AppRouter has ended the application session. | Uses a positive status icon and tells the user the IDTS session ended successfully. | Do not claim the whole SAP identity-provider session was destroyed. |
| Primary sign-in action | User explicitly chooses to return. | Opens the protected `/login.html` bridge; after XSUAA establishes a session, that page forwards to the Fiori entry. | Keep one emphasized action and let top-level XSUAA navigation complete before `AuthService.me` runs. |

This file deliberately has no JavaScript, password field, token storage or
custom login request.

The visual treatment follows SAP Fiori principles (simple, responsive,
coherent and accessible) but is intentionally application-owned; SAP BTP does
not provide a reusable post-logout page equivalent to its identity-provider
sign-in screen.

## Giải thích tiếng Việt

Đây chỉ là trang tĩnh xác nhận session ứng dụng IDTS đã kết thúc. Nó không tự
đăng nhập, không giữ token và không thu mật khẩu. Khi user bấm link đăng nhập,
trình duyệt đi qua `/login.html` được XSUAA bảo vệ trước, rồi mới quay lại Fiori.
