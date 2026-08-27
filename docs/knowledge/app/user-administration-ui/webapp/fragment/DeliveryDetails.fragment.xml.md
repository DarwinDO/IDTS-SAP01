# Knowledge: `DeliveryDetails.fragment.xml`

## English / Tiếng Việt

The Gate 6 delivery dialog is a safe read-only detail surface. Its content `VBox` uses native `sapUiSmallMargin` for a visible inset, and labels after the first field reuse the native `sapUiSmallMarginTop` spacing pattern from `ActiveUserDetails`. It shows only the masked recipient, bounded delivery status, attempt count, outcome timestamps, next-attempt time, and allowlisted error summary. No custom CSS is introduced, and there is no raw email body, provider identifier, lock/lease value, idempotency key, credential, or raw error binding.

Dialog delivery Gate 6 là surface detail read-only an toàn. `VBox` content dùng `sapUiSmallMargin` native để tạo inset nhìn thấy, còn các label sau field đầu dùng spacing native `sapUiSmallMarginTop` theo pattern `ActiveUserDetails`. Dialog chỉ hiện recipient đã mask, delivery status bounded, số lần thử, timestamp outcome, thời điểm thử tiếp theo và error summary allowlist. Không thêm CSS custom và không có binding email body raw, provider identifier, lock/lease, idempotency key, credential hoặc raw error.

**Source anchor:** `DeliveryDetails.fragment.xml:1-21`; controller source is `Main.controller.js:onOpenDeliveryDetails`, while CAP owns retry eligibility and optimistic checks.

**Safe editing:** Keep this fragment read-only and preserve the close-only dialog boundary. Any new field must be an explicit safe DTO field with a forbidden-field assertion and both locale labels.

**Sửa an toàn:** Giữ fragment read-only và boundary dialog chỉ close. Field mới phải là safe DTO explicit, có forbidden-field assertion và label ở cả hai locale.

## Gate 6.5 timestamp clarity / Làm rõ timestamp Gate 6.5

### English

The existing details dialog still contains only the approved status, attempts, timestamps, and sanitized error summary. Each optional timestamp uses the existing `formatter.dateTime` when populated and a normalized localized em dash display field when absent. No raw body, recipient email, provider response, audit ID, or lock value is added.

- **Location**: `DeliveryDetails.fragment.xml:11-19` — populated/fallback pairs for `sentAt`, `lastAttemptAt`, and `nextAttemptAt`.
  **IDTS concept**: PM can distinguish “no timestamp” from a rendering failure without exposing persistence internals.
  **Impact if broken**: empty rows look defective, or a fallback can replace valid date formatting.
  **Must check together**: `Main.controller.js:_normalizeDeliveryRow`, `i18n>emptyDetail`, and UI detail regressions.

### Tiếng Việt

Dialog details hiện có vẫn chỉ chứa status, attempts, timestamp và error summary đã sanitize được duyệt. Mỗi timestamp optional dùng `formatter.dateTime` hiện có khi có giá trị và field hiển thị em dash localized đã normalize khi thiếu. Không thêm raw body, recipient email, provider response, audit ID hoặc lock value.

- **Vị trí**: `DeliveryDetails.fragment.xml:11-19` — cặp populated/fallback cho `sentAt`, `lastAttemptAt`, `nextAttemptAt`.
  **Khái niệm IDTS**: PM phân biệt “chưa có timestamp” với lỗi render mà không expose persistence nội bộ.
  **Ảnh hưởng nếu sai**: row rỗng trông như defect hoặc fallback thay thế date formatting hợp lệ.
  **Phải kiểm tra cùng**: `Main.controller.js:_normalizeDeliveryRow`, `i18n>emptyDetail` và regression details UI.

**Safe editing / Sửa an toàn:** Preserve one read-only dialog and mutually exclusive populated/fallback visibility. / Giữ một dialog read-only và visibility populated/fallback loại trừ nhau.
