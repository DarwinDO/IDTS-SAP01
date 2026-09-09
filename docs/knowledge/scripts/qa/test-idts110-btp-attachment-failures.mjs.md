# IDTS-110 BTP attachment failure test

## English

This script executes three controlled attachment-storage failure cases against an isolated SAP BTP shadow CAP application. It creates or reuses a Bug draft, triggers upload, download, and delete behavior through the real OData draft endpoints, and verifies that Bug status, history, and notifications do not change.

The script requires `IDTS110_SHADOW_BASE`. It must never point to the production application. The upload and download cases require a storage error and then read the draft and active attachment metadata again. The delete case follows the transactional-outbox contract: HTTP 204 means metadata deletion was accepted, while failed object cleanup must be verified separately in the outbox readback.

Safe editing notes: keep the fixed shadow Bug IDs isolated, retain the workflow-state comparisons, never print credentials, and do not reinterpret an acknowledged transactional-outbox delete as a synchronous provider success.

## Tiếng Việt

Script này chạy ba case lỗi attachment storage có kiểm soát trên một ứng dụng CAP shadow tách biệt ở SAP BTP. Nó tạo hoặc dùng lại Bug draft, kích hoạt luồng upload, download và delete qua đúng OData draft endpoint, rồi xác minh Bug status, history và notifications không thay đổi.

Script yêu cầu biến `IDTS110_SHADOW_BASE`. Biến này tuyệt đối không được trỏ tới ứng dụng production. Hai case upload và download phải nhận lỗi storage rồi đọc lại attachment metadata ở draft và active. Case delete tuân theo contract transactional outbox: HTTP 204 nghĩa là việc xóa metadata đã được chấp nhận, còn object cleanup bị lỗi phải được kiểm tra riêng bằng outbox readback.

Lưu ý khi sửa an toàn: giữ các Bug ID cố định trong shadow fixture, không bỏ so sánh workflow state, không in credential và không hiểu nhầm một delete đã được transactional outbox chấp nhận thành provider thành công đồng bộ.
