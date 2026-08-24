# Knowledge: `srv/user-admin/operations-audit.js`

## English

This module owns the Gate 6 safe operational read models and one bounded onboarding-delivery retry. It is registered by `srv/user-admin.js` and never exposes the persistence entities directly.

### Runtime flow

1. `searchOnboardingDeliveries`, `searchAccessOperations`, `searchAccessAuditEvents`, and `readAdministrationReadiness` authorize with the existing active PM + UserAdmin guard.
2. Each query selects explicit persistence columns, orders by `createdAt desc, ID desc`, and clamps paging to default 25 / maximum 100.
3. Delivery recipients are masked; actor/target names are safe display strings; error/result/detail text is replaced by allowlisted summaries. Delivery retry eligibility is enriched with one bounded bulk parent-request read per page, never an N+1 lookup.
4. Audit correlation IDs are hashed server-side and truncated to 12 lowercase hexadecimal characters. Identity before/after hashes, provider hashes, leases, locks, idempotency keys, and raw errors never enter the DTOs.
5. Readiness uses only persisted delivery/operation outcomes modified within the fixed seven-day freshness window. Recent `SENT` is `AVAILABLE`; otherwise recent `FAILED` is `UNAVAILABLE`; recent `PENDING`, other states, or no conclusive state is `UNKNOWN`. It does not read environment bindings, credentials, health endpoints, or provider state.

### Delivery retry boundary

`retryOnboardingDelivery` accepts only a UUID and the expected `modifiedAt`. The row must be `FAILED`, have one of the allowlisted transient delivery codes, belong to an unexpired `INVITED` parent request, remain below the configured fixed attempt ceiling, and not be actively locked. One optimistic UPDATE resets only the retry scheduling/error/lock fields. The recipient, template, provider history, and attempt count remain unchanged. The same transaction writes one `RETRY_ONBOARDING_DELIVERY` audit event, then calls the existing `scheduleImmediateEmailOutbox(req)` registration after the database work; the provider is not called by the request action.

Access operation visibility derives `canRetry` and `canReconcile` from the same state/result guards as the existing actions. Ambiguous outcomes expose reconciliation only; permanent failures expose neither action.

### Important source anchors

- **Location**: `srv/user-admin/operations-audit.js:65-186` — explicit-column read actions and readiness.
  **IDTS concept**: bounded safe read models for delivery, provisioning, audit, and persisted-state readiness.
  **Impact if broken**: the UI may enumerate raw identity/provider data or request oversized pages.
  **Must check together**: `srv/user-admin.cds:109-224`, CAP EDMX, and `scripts/qa/test-user-admin-operations-audit.js`.

- **Location**: `srv/user-admin/operations-audit.js:188-286` — optimistic onboarding-delivery retry.
  **IDTS concept**: one retry-eligible failed delivery is reset atomically with append-only audit and existing post-commit outbox kick.
  **Impact if broken**: blind retries could duplicate provider sends, clear the wrong row, or lose the audit boundary.
  **Must check together**: `srv/user-admin/delivery.js`, `srv/email/worker.js`, and the immediate-kick regression.

## Tiếng Việt

Module này sở hữu read model vận hành an toàn Gate 6 và một retry onboarding-delivery có giới hạn. Module được đăng ký bởi `srv/user-admin.js` và không expose trực tiếp các persistence entity.

### Luồng runtime

1. Bốn action search/read authorize bằng guard PM active + UserAdmin hiện có.
2. Mỗi query chỉ chọn column explicit, order ổn định `createdAt desc, ID desc`, và clamp page mặc định 25 / tối đa 100.
3. Recipient được mask; actor/target là display string an toàn; error/result/detail dùng summary allowlist. Eligibility retry delivery được enrich bằng một bulk read parent request bounded cho mỗi page, không có N+1 lookup.
4. Correlation ID được hash ở server và rút còn 12 ký tự hex lowercase. Identity hash before/after, provider hash, lease, lock, idempotency key và raw error không đi vào DTO.
5. Readiness chỉ dùng outcome delivery/operation đã persist và `modifiedAt` nằm trong cửa sổ freshness cố định bảy ngày. `SENT` gần đây là `AVAILABLE`; nếu không có thì `FAILED` gần đây là `UNAVAILABLE`; PENDING/state khác/không kết luận là `UNKNOWN`. Không đọc binding, credential, health endpoint hay provider state.

### Boundary retry delivery

`retryOnboardingDelivery` chỉ nhận UUID và `modifiedAt` expected. Row phải là `FAILED`, có transient delivery code trong allowlist, parent request còn `INVITED` và chưa hết hạn, chưa vượt attempt ceiling cố định và không bị lock active. Một UPDATE optimistic chỉ reset field schedule/error/lock cho retry. Recipient, template, provider history và attempt count giữ nguyên. Cùng transaction ghi một audit `RETRY_ONBOARDING_DELIVERY`, sau đó đăng ký `scheduleImmediateEmailOutbox(req)` hiện có sau phần database; action request không gọi provider.

Visibility access operation suy ra `canRetry` và `canReconcile` từ cùng guard state/result của action hiện có. Outcome ambiguous chỉ hiện reconcile; permanent failure không hiện action nào.

### Sửa an toàn

Do not add a new external client, endpoint, log viewer, schema index, or raw persistence projection here. Any new safe field must be added to the CDS DTO, this mapper, the forbidden-field tests, and the matching UI/knowledge mirror together.

Không thêm external client, endpoint, log viewer, schema index hoặc raw persistence projection mới vào module này. Mọi safe field mới phải được thêm đồng thời vào CDS DTO, mapper, forbidden-field test và UI/knowledge mirror tương ứng.
