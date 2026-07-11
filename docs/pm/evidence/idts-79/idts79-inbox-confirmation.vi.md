# IDTS-79 — Xác nhận Inbox Shared QA (đã redacted)

**Thời điểm:** 11/07/2026

**Phương pháp:** Gmail connector chỉ đọc, tìm theo marker của controlled UAT record.
**An toàn dữ liệu:** Không lưu recipient, message ID, URL redirect, token, credential hoặc nội dung email thô.

## Kết quả

- Có nhiều notification mới của controlled UAT record trong nhãn **Inbox**; không chỉ tồn tại ở outbox database.
- Có các trạng thái workflow tương ứng, gồm `Need More Information`, `Updated`, và `Closed`.
- Transport/outbox API cùng thời điểm xác nhận delivery `SENT` và có provider message ID.

## Finding bắt buộc follow-up

Mail mới vẫn có fallback deep-link dùng route Fiori cũ. Vì vậy việc nhận mail là **PASS**, nhưng email UX/deep-link acceptance là **FAIL** cho đến khi [IDTS-81](https://dutassociation.atlassian.net/browse/IDTS-81) được fix và một mail mới được click kiểm tra lại.
