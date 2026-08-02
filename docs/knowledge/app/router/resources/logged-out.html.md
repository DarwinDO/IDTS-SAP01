# `app/router/resources/logged-out.html` knowledge mirror

## Purpose

AppRouter serves this static page after `/do/logout`. It provides a neutral
boundary between ending the current IDTS application session and explicitly
starting the next SAP BTP login.

## Walkthrough

| Block | Input/trigger | Output/side effect | Failure check |
| --- | --- | --- | --- |
| Document metadata | Browser loads `/logged-out.html`. | Accessible English title and responsive viewport. | Check the page is rendered rather than redirected. |
| Signed-out message | AppRouter has ended the application session. | Tells the user the IDTS session ended. | Do not claim the whole SAP identity-provider session was destroyed. |
| Sign-in link | User explicitly chooses to return. | Opens the protected `/login.html` bridge; after XSUAA establishes a session, that page forwards to the Fiori entry. | Network must complete top-level XSUAA navigation before `AuthService.me` runs. |

This file deliberately has no JavaScript, password field, token storage or
custom login request.

## Giải thích tiếng Việt

Đây chỉ là trang tĩnh xác nhận session ứng dụng IDTS đã kết thúc. Nó không tự
đăng nhập, không giữ token và không thu mật khẩu. Khi user bấm link đăng nhập,
trình duyệt đi qua `/login.html` được XSUAA bảo vệ trước, rồi mới quay lại Fiori.
