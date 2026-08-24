# Knowledge: `DeliveryDetails.fragment.xml`

## English / Tiếng Việt

The Gate 6 delivery dialog is a safe read-only detail surface. It shows only the masked recipient, bounded delivery status, attempt count, next-attempt time, and allowlisted error summary. It has no raw email body, provider identifier, lock/lease value, idempotency key, credential, or raw error binding.

Dialog delivery Gate 6 là surface detail read-only an toàn. Dialog chỉ hiện recipient đã mask, delivery status bounded, số lần thử, thời điểm thử tiếp theo và error summary allowlist. Không có binding email body raw, provider identifier, lock/lease, idempotency key, credential hoặc raw error.

**Source anchor:** `DeliveryDetails.fragment.xml:1-21`; controller source is `Main.controller.js:onOpenDeliveryDetails`, while CAP owns retry eligibility and optimistic checks.

**Safe editing:** Keep this fragment read-only and preserve the close-only dialog boundary. Any new field must be an explicit safe DTO field with a forbidden-field assertion and both locale labels.

**Sửa an toàn:** Giữ fragment read-only và boundary dialog chỉ close. Field mới phải là safe DTO explicit, có forbidden-field assertion và label ở cả hai locale.
