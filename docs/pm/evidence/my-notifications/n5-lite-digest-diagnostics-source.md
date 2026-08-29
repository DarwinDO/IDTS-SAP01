# N5-Lite Digest diagnostics — source evidence

## English

N5-Lite deliberately replaces the original full N5 implementation. Exact PM + UserAdmin can inspect Digest delivery status in the existing User Administration Operations table. CAP reuses `NotificationDigestDeliveries` and the exact allowlisted `AdministrationDeliverySummary`; no new entity, table, action, worker, scheduler, provider or screen is introduced.

Security boundary: authorization precedes every read. Recipient email is bulk-resolved only to create the masked display. Subject, text/HTML bodies, provider message ID, internal recipient ID, lock fields and stored provider summary are not returned. Digest rows are read-only and always return `canRetry=false`.

TDD RED proved the existing unified read omitted the Digest table and the UI had no Digest label. Focused GREEN proves three-source mixed reads, Digest-only reads, stable safe DTO output, masking, forbidden-field absence, localized filter/normalization and hidden retry. Manual retry and automated 90-day deletion remain deferred until measured need.

## Tiếng Việt

N5-Lite chủ đích thay thế implementation N5 đầy đủ ban đầu. Đúng PM + UserAdmin có thể xem trạng thái delivery Digest trong bảng Operations User Administration hiện có. CAP reuse `NotificationDigestDeliveries` và đúng DTO allowlist `AdministrationDeliverySummary`; không thêm entity, table, action, worker, scheduler, provider hoặc màn hình.

Boundary security: authorization chạy trước mọi read. Email recipient chỉ được bulk-resolve để tạo display đã mask. Subject, body text/HTML, provider message ID, recipient ID nội bộ, lock và provider summary đã lưu không được trả ra. Row Digest read-only và luôn có `canRetry=false`.

TDD RED chứng minh unified read cũ bỏ sót bảng Digest và UI chưa có label Digest. Focused GREEN chứng minh mixed read ba source, Digest-only read, DTO an toàn ổn định, masking, không có field cấm, filter/normalization localized và retry bị ẩn. Retry thủ công cùng xóa tự động 90 ngày vẫn defer đến khi có nhu cầu đo được.
