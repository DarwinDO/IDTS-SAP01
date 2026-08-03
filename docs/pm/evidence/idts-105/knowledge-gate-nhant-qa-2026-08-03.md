# NhanT QA Ownership Knowledge Gate — 2026-08-03

## English

- Member: NhanT
- Flow: QA authentication, authorization, persistence/reload, and notification outbox verification
- Questions: 3 base, 0 inactive-day, 0 additional-flow
- Score: 3/3 (100%)
- Critical questions: PASS
- Debug exercise: PASS
- Teach-back: PASS
- Result: PASS

Assessment evidence:

1. NhanT traced the QA flow from authentication into the Fiori application, through a protected Bug action, and into Notification Outbox verification.
2. NhanT correctly distinguished expected HTTP 401 for invalid credentials and expected HTTP 403 for an authenticated Tester attempting a PM-only action from unexpected authorization failures on permitted paths.
3. NhanT identified the required side effects and readbacks: Bug status mutation, Notification Outbox row/status, session persistence after reload, and token removal after logout.
4. Controlled debug exercise: NhanT described the prior IDTS-38 browser-harness integration, separated known `Component-preload.js` noise from actionable UI/console failures, retained the narrow noise filter, and reran the seven auth/email scenarios. Matching work-session evidence is recorded in `docs/pm/status/nhant.md` under `IDTS-38 Review Updates`.

No credential, token, password, private endpoint, or personal email is stored in this evidence.

## Vietnamese

- Thành viên: NhanT
- Luồng: QA cho xác thực, phân quyền, persistence/reload và Notification Outbox
- Câu hỏi: 3 câu cơ bản, 0 câu ngày không hoạt động, 0 câu flow bổ sung
- Điểm: 3/3 (100%)
- Câu critical: PASS
- Bài debug: PASS
- Teach-back: PASS
- Kết quả: PASS

Bằng chứng đánh giá:

1. NhanT đã trace luồng QA từ đăng nhập vào ứng dụng Fiori, qua hành động Bug được bảo vệ, đến bước kiểm tra Notification Outbox.
2. NhanT phân biệt đúng HTTP 401 mong đợi khi sai thông tin đăng nhập và HTTP 403 mong đợi khi Tester đã đăng nhập gọi hành động chỉ dành cho PM, so với lỗi phân quyền ngoài dự kiến trên luồng được phép.
3. NhanT xác định đúng side effect và readback cần kiểm tra: thay đổi trạng thái Bug, bản ghi/trạng thái Notification Outbox, session còn hiệu lực sau reload và token bị xoá sau logout.
4. Bài debug có kiểm soát: NhanT mô tả việc tích hợp browser-harness ở IDTS-38, tách noise đã biết của `Component-preload.js` khỏi lỗi UI/console cần xử lý, giữ filter ở phạm vi hẹp và chạy lại bảy scenario auth/email. Bằng chứng phiên làm việc tương ứng nằm trong `docs/pm/status/nhant.md` tại dòng `IDTS-38 Review Updates`.

Evidence này không lưu credential, token, password, endpoint riêng tư hoặc email cá nhân.
