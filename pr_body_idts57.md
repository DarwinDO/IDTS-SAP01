## Summary

Tiến hành kiểm thử giao diện (UI/UX) và luồng nghiệp vụ trên trình duyệt sau khi giao diện Login, Dashboard, Profile Shell và Fiori Object Page (Collaboration Section) được thiết kế lại trong Sprint 4 (Task IDTS-57). Sử dụng Playwright để tự động hóa kịch bản kiểm thử.

## Positive Evidence

- Đăng nhập thành công với PM Role (`donhv@example.local`).
- Profile Shell hiển thị tên người dùng chính xác.
- Fiori Object Page render được `BugCollaborationSection` (phần thêm Comments & Attachments).
- Có thể thao tác Workflow Assign Developer.

## Negative Evidence

- Negative Login: Khi nhập sai email hoặc password, hệ thống hiển thị chính xác `MessageStrip` "Invalid email or password" thay vì crash.

## Edge/Boundary Evidence

- Thử reload trình duyệt giữa chừng, session vẫn được duy trì (Persistence).
- Verify việc Timeout khi mạng chậm hoặc DOM elements chưa kịp xuất hiện (đã tăng timeout và verify qua Local execution).

## Roles/Authorization

- Đã test sử dụng role PM (`donhv@example.local`). Các tính năng như Assign Developer hiển thị đúng logic cho PM.

## Persistence/Reload

- Session persistence đã được xác minh qua các lần reloads (`page.reload()`), đảm bảo Auth token/cookie được lưu đúng.
- Chức năng Logout đưa người dùng quay lại đúng màn hình Login.

## UI/UX Review

- CSS Layout của Fiori Element V4 mdc Table, Profile Shell mới, và Login custom form đã được chụp ảnh màn hình lưu tại `scripts/qa/uat-evidence/idts-57/`.
- Không phát hiện UI Error Dialogs nào block tiến trình. Mọi thay đổi tuân thủ SAP Fiori Design Guidelines.

## Known Gaps

- Chưa test chi tiết toàn bộ các action khác trên Object Page (ví dụ: Resolve, Retest) trên giao diện mới mà mới chỉ test Assign. Sẽ được cover trong các task sau.

## Jira/Evidence Links

- Task: [IDTS-57]
- Ảnh evidence đã được commit vào thư mục ignored `scripts/qa/uat-evidence/idts-57/`.
