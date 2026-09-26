# Knowledge: `app/router/resources/onboarding/authenticate.html`

## English

This XSUAA-protected page is the visual shell for invitation verification. It contains the busy state, safe result message, retry button, and `Refresh SAP sign-in` recovery button. The module script controls visibility; the HTML never receives an invitation token, password, OTP, identity hash, provider response, or Role Collection detail.

- **Location**: `#refresh-signin-button` — hidden until identity verification succeeds.
  **IDTS concept**: a newly provisioned account needs a fresh XSUAA session before application authorization can observe the new platform role.
  **Impact if broken**: users may need to discover private browsing manually even though normal logout/re-login is sufficient.
  **Must check together**: `onboarding-page.mjs`, `app/router/xs-app.json`, `logged-out.html`, and `auth-guard.js`.

Safe editing: preserve the restrictive CSP, `no-referrer`, no-store headers, semantic live regions, external scripts, and password-free page.

## Tiếng Việt

Đây là phần giao diện được XSUAA bảo vệ cho bước xác minh invitation. Trang chứa trạng thái đang xử lý, thông báo kết quả an toàn, nút thử lại và nút phục hồi `Refresh SAP sign-in`. Module script điều khiển việc hiển thị; HTML không bao giờ nhận invitation token, password, OTP, identity hash, provider response hoặc chi tiết Role Collection.

- **Vị trí**: `#refresh-signin-button` — ẩn cho tới khi xác minh identity thành công.
  **Khái niệm IDTS**: account vừa được provision cần XSUAA session mới để authorization của ứng dụng nhìn thấy platform role mới.
  **Ảnh hưởng nếu sai**: user có thể phải tự phát hiện cách mở private browser dù logout/login bình thường đã đủ.
  **Phải kiểm tra cùng**: `onboarding-page.mjs`, `app/router/xs-app.json`, `logged-out.html` và `auth-guard.js`.

Sửa an toàn: giữ CSP giới hạn, `no-referrer`, header no-store, live region semantic, script external và không có field password.
