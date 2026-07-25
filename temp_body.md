### Summary
Cập nhật nhánh hiện tại bằng cách đồng bộ từ `dev`. Viết lại kịch bản QA `scripts/qa/test-idts38-auth-email-playwright.js` để tích hợp `browser-harness.js`. Đã chuyển sang sử dụng biến môi trường `QA_PASSWORD` thay vì hardcode thông tin nhạy cảm. Kịch bản đã được mở rộng để bao phủ toàn bộ 7 trường hợp kiểm thử (Negative, Positive, Edge/Role-based, Persistence, và theo dõi Outbox chi tiết) thay vì chỉ 4 Happy Paths ban đầu.

### Positive Evidence
- Đăng nhập thành công với tài khoản Tester (NhanT) và chuyển hướng vào Fiori App bình thường.
- Thực hiện hành động `RejectBug` thành công dưới vai trò PM (DonHV) và kích hoạt tạo một bản ghi Notification Outbox.

### Negative Evidence
- Đăng nhập sai mật khẩu trả về HTTP 401 và UI hiển thị thanh báo lỗi (`.error-bar`) đúng như thiết kế, chặn đứng truy cập.

### Edge/Boundary Evidence
- Notification Delivery Outbox hiển thị status là `SKIPPED` một cách an toàn do cấu hình SMTP bị tắt (tại môi trường QA này), ứng dụng không bị crash và luồng công việc (Bug status update) không bị rollback.

### Roles/Authorization
- Tester thực thi hành động yêu cầu quyền cấp cao (AssignBug) nhận HTTP 403 (Forbidden) từ backend CAP, đảm bảo Backend Auth Middleware hoạt động chính xác cho các protected routes.
- Chức năng Logout huỷ Token và tự động chuyển hướng người dùng trở về màn hình đăng nhập (chặn truy cập Fiori Object Page).

### Persistence/Reload
- Khi Reload trình duyệt, token vẫn duy trì (`sessionStorage`) và user không bị buộc phải đăng nhập lại, vẫn tiếp tục ở phiên đăng nhập hiện tại.

### UI/UX Review
- Tất cả màn hình làm việc (Fiori List Report, Object Page, Screen báo lỗi) đã pass kiểm định từ `browser-harness` (không tồn tại `sapMMessageBox` hoặc Lỗi Console đột ngột). Lỗi `Component-preload.js` từ SDK UI5 đã được filter noise an toàn.

### Known Gaps
- Bằng chứng gửi Email tới hộp thư thật (Real-provider SMTP proof) vẫn cần thực hiện riêng tư do không lưu log nhạy cảm vào repo. Quá trình test này chủ yếu verify logic Outbox.

### Jira/Evidence Links
- Jira: [IDTS-38](https://dutassociation.atlassian.net/browse/IDTS-38)
- Evidence Screenshot: (đã sinh tại thư mục ignored `uat-evidence`)


[IDTS-38]: https://dutassociation.atlassian.net/browse/IDTS-38?atlOrigin=eyJpIjoiNWRkNTljNzYxNjVmNDY3MDlhMDU5Y2ZhYzA5YTRkZjUiLCJwIjoiZ2l0aHViLWNvbS1KU1cifQ