# NhanT QA Ownership Knowledge Gate — 2026-08-04

## English

- Member: NhanT
- Flow: QA and release evidence
- Questions: 3 base, 0 inactive-day, 0 additional-flow
- Score: 3/3 (100%)
- Critical questions: PASS
- Debug exercise: PASS
- Teach-back: PASS
- Result: PASS

Assessment evidence:

1. NhanT described a safe negative authorization case: an unauthorized actor is denied with a sanitized error, database state remains unchanged, and no backend stack or internal structure is exposed.
2. NhanT correctly distinguished HTTP 401 for missing/invalid authentication from HTTP 403 for an authenticated actor lacking the required role, and identified an unexpected denial on an authorized path as a defect candidate.
3. NhanT required response/message evidence, no corrupt or orphan persistence, and reload readback before accepting a candidate PASS.
4. Controlled debug exercise: for a failed attachment upload, NhanT traced Browser Network first, then CAP logs/handlers, attachment metadata, and binary storage. The assessment clarified that SAP BTP uses HANA rather than assuming SQLite and that the current attachment binary boundary may be S3 rather than local disk. Read-only metadata and storage evidence must both show no orphan.
5. Teach-back: NhanT explained that the scenario defines the bounded claim, browser/API execution produces the observable result, evidence preserves the response and side effects, and Jira/PR provides reviewer traceability. DonHV remains the human reviewer who converts candidate evidence into an accepted final result.

No credential, token, password, private endpoint, personal email, stack trace, or storage secret is stored in this evidence.

## Vietnamese

- Thành viên: NhanT
- Luồng: QA và release evidence
- Câu hỏi: 3 câu cơ bản, 0 câu ngày không hoạt động, 0 câu flow bổ sung
- Điểm: 3/3 (100%)
- Câu critical: PASS
- Bài debug: PASS
- Teach-back: PASS
- Kết quả: PASS

Bằng chứng đánh giá:

1. NhanT mô tả đúng negative authorization case an toàn: actor không đủ quyền bị từ chối bằng lỗi đã sanitize, dữ liệu database không đổi và response không lộ stack hay cấu trúc backend nội bộ.
2. NhanT phân biệt đúng HTTP 401 khi thiếu/sai xác thực với HTTP 403 khi đã xác thực nhưng thiếu role, đồng thời nhận diện việc chặn sai một luồng được phép là defect candidate.
3. NhanT yêu cầu kiểm tra response/message, không có dữ liệu hỏng hoặc orphan, và reload readback trước khi chấp nhận candidate PASS.
4. Bài debug có kiểm soát: với upload attachment thất bại, NhanT kiểm tra Browser Network trước, sau đó CAP log/handler, metadata attachment và binary storage. Phần đánh giá làm rõ SAP BTP dùng HANA thay vì mặc định SQLite và binary hiện có thể đi qua S3 thay vì local disk. Evidence read-only ở cả metadata và storage phải chứng minh không có orphan.
5. Teach-back: NhanT giải thích scenario định nghĩa claim có giới hạn, browser/API tạo kết quả quan sát được, evidence lưu response và side effect, còn Jira/PR cung cấp traceability cho reviewer. DonHV là người review để chuyển candidate evidence thành kết quả cuối được chấp nhận.

Evidence này không lưu credential, token, password, endpoint riêng, email cá nhân, stack trace hoặc storage secret.
