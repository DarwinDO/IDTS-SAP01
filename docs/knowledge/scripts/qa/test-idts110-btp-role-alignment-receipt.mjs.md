# IDTS-110 BTP role-alignment receipt validator

## English

This small validator checks the sanitized runtime receipt for Cases 14 and 15. Both cases must return HTTP 403, expose only the approved safe message, issue no business mutation, and prove that temporary BTP role collections were rolled back to exactly `IDTS_TESTER`.

It reads one JSON path passed on the command line and performs assertions only. It does not sign in, change a role, call SAP BTP, or modify project data. The receipt remains ignored local execution input; the committed case manifests and cards contain the selected safe evidence.

Safe editing notes: keep exact safe-message assertions because they protect against identity-detail leakage, and keep the rollback assertion strict so an additional temporary role cannot be silently retained.

## Tiếng Việt

Validator nhỏ này kiểm tra runtime receipt đã sanitized cho Case 14 và 15. Cả hai case phải trả HTTP 403, chỉ lộ message an toàn đã duyệt, không phát sinh business mutation và chứng minh role collection BTP tạm đã rollback về đúng `IDTS_TESTER`.

Script chỉ đọc một đường dẫn JSON truyền qua command line và chạy assertion. Nó không đăng nhập, không đổi role, không gọi SAP BTP và không sửa dữ liệu dự án. Receipt vẫn là input chạy local trong vùng ignored; case manifest và card được commit chỉ chứa evidence an toàn đã chọn.

Lưu ý khi sửa an toàn: giữ assertion chính xác cho safe message để ngăn lộ chi tiết identity, đồng thời giữ rollback assertion nghiêm ngặt để không thể âm thầm sót lại role tạm bổ sung.
