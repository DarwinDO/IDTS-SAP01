# Knowledge: `srv/user-admin/operations-audit.js`

## N5-Lite Digest diagnostics / Diagnostic Digest N5-Lite

English: `searchAdministrationDeliveries` reuses the existing `NotificationDigestDeliveries` table as a third read-only source. Authorization still runs before every read. Digest rows are normalized page-by-page with one bounded User lookup per page, so masked-recipient search cannot truncate at the 10,000 skip ceiling. Operations receives only masked recipient, status, attempts, timestamps and allowlisted error code/summary; unknown persisted codes become `UNAVAILABLE`. Digest body, subject, provider message ID, lock data and internal recipient ID never leave CAP; `canRetry` is always false. Debug at `searchAdministrationDeliveries`, `searchDigestDeliveries`, then `normalizeAdministrationDeliveries`.

Tiếng Việt: `searchAdministrationDeliveries` reuse bảng `NotificationDigestDeliveries` hiện có làm source read-only thứ ba. Authorization vẫn chạy trước mọi read. Row Digest được normalize theo từng page với một User lookup bounded mỗi page, nên search recipient đã mask không bị cắt ở ceiling skip 10.000. Operations chỉ nhận recipient đã mask, status, attempts, timestamp và error code/summary allowlist; code persist lạ thành `UNAVAILABLE`. Body, subject, provider message ID, lock và recipient ID nội bộ không rời CAP; `canRetry` luôn false. Debug theo thứ tự `searchAdministrationDeliveries` → `searchDigestDeliveries` → `normalizeAdministrationDeliveries`.

## English

This module owns the Gate 6 safe operational read models and one bounded onboarding-delivery retry. It is registered by `srv/user-admin.js` and never exposes the persistence entities directly.

### Runtime flow

1. `searchOnboardingDeliveries`, `searchAccessOperations`, `searchAccessAuditEvents`, and `readAdministrationReadiness` authorize with the existing active PM + UserAdmin guard.
2. Each query selects explicit persistence columns, orders by `createdAt desc, ID desc`, and clamps paging to default 25 / maximum 100.
3. Delivery recipients are masked; actor/target names are safe display strings; error/result/detail text is replaced by allowlisted summaries. Delivery retry eligibility is enriched with one bounded bulk parent-request read per page, never an N+1 lookup.
4. Audit correlation IDs are hashed server-side and truncated to 12 lowercase hexadecimal characters. Identity before/after hashes, provider hashes, leases, locks, idempotency keys, and raw errors never enter the DTOs.
5. Readiness uses explicit persisted outcome timestamps within the fixed seven-day freshness window: delivery `sentAt` for success, delivery `lastAttemptAt` for failure, and access-operation `completedAt` for success. Recent `SENT` is `AVAILABLE`; otherwise recent `FAILED` is `UNAVAILABLE`; recent `PENDING`, other states, or no conclusive state is `UNKNOWN`. It does not depend on managed `modifiedAt`, and it does not read environment bindings, credentials, health endpoints, or provider state.

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
5. Readiness dùng timestamp outcome explicit đã persist trong cửa sổ freshness cố định bảy ngày: delivery `sentAt` cho success, delivery `lastAttemptAt` cho failure, và access-operation `completedAt` cho success. `SENT` gần đây là `AVAILABLE`; nếu không có thì `FAILED` gần đây là `UNAVAILABLE`; PENDING/state khác/không kết luận là `UNKNOWN`. Logic không phụ thuộc managed `modifiedAt` và không đọc binding, credential, health endpoint hay provider state.

### Boundary retry delivery

`retryOnboardingDelivery` chỉ nhận UUID và `modifiedAt` expected. Row phải là `FAILED`, có transient delivery code trong allowlist, parent request còn `INVITED` và chưa hết hạn, chưa vượt attempt ceiling cố định và không bị lock active. Một UPDATE optimistic chỉ reset field schedule/error/lock cho retry. Recipient, template, provider history và attempt count giữ nguyên. Cùng transaction ghi một audit `RETRY_ONBOARDING_DELIVERY`, sau đó đăng ký `scheduleImmediateEmailOutbox(req)` hiện có sau phần database; action request không gọi provider.

Visibility access operation suy ra `canRetry` và `canReconcile` từ cùng guard state/result của action hiện có. Outcome ambiguous chỉ hiện reconcile; permanent failure không hiện action nào.

### Sửa an toàn

Do not add a new external client, endpoint, log viewer, schema index, or raw persistence projection here. Any new safe field must be added to the CDS DTO, this mapper, the forbidden-field tests, and the matching UI/knowledge mirror together.

## Gate 6.5 unified delivery operations / Operations delivery hợp nhất Gate 6.5

### English

The module now normalizes invitation and access-change stores into `AdministrationDeliverySummary`. Authorization runs before all reads/writes. A single-type search uses server order/page directly; `ALL` reads at most `skip + top` rows from each store, stable-sorts `createdAt desc, ID desc`, then slices. `skip` is capped at 10,000 and `top` at 100. Readiness reads the newest 25 rows from each delivery store and keeps the seven-day persisted-outcome precedence: recent `SENT`, otherwise recent `FAILED`, otherwise `UNKNOWN`.

Access retry requires exact `FAILED`, transient allowlist, attempt budget, no active/invalid lock, and matching `modifiedAt`. The optimistic update resets only status/schedule/error/lock fields, keeps recipient/message/provider/source-audit snapshots immutable, appends `RETRY_ACCESS_DELIVERY/QUEUED`, and schedules the shared post-commit worker.

- **Location**: `srv/user-admin/operations-audit.js:107-202` — `searchAdministrationDeliveries`.
  **IDTS concept**: one bounded PM + UserAdmin view over separate invitation/access delivery histories.
  **Impact if broken**: paging can skip/duplicate rows, unmasked persistence can leak, or a deep query can overfetch.
  **Must check together**: `srv/user-admin.cds:125-140,216-223`, UI loader/filter, and 300-row mixed pagination tests.
- **Location**: `srv/user-admin/operations-audit.js:274-290` — readiness over both stores.
  **IDTS concept**: recent persisted delivery outcomes determine operational availability.
  **Impact if broken**: Operations can claim email available from stale, queued, or incomplete evidence.
  **Must check together**: invitation/access timestamp fields and seven-day boundary tests.
- **Location**: `srv/user-admin/operations-audit.js:417-504` — `retryUserAccessDelivery`.
  **IDTS concept**: optimistic, capped recovery without changing the completed access audit or payload snapshot.
  **Impact if broken**: stale clicks, active workers, permanent failures, or over-budget rows can resend.
  **Must check together**: `srv/user-admin/access-delivery.js:110-176`, `srv/email/worker.js`, and retry/lock tests.
- **Location**: `srv/user-admin/operations-audit.js:590-666` — safe DTO mapping, retry capability, page/type guards.
  **IDTS concept**: server-authoritative masking and fail-closed delivery type selection.
  **Impact if broken**: UI may infer retry from unsafe fields or route unknown types to invitation retry.
  **Must check together**: `Main.controller.js:1266-1297,1570-1593` and forbidden-field tests.

### Tiếng Việt

Module giờ normalize store invitation và access-change thành `AdministrationDeliverySummary`. Authorization chạy trước mọi read/write. Search một type dùng order/page server trực tiếp; `ALL` đọc tối đa `skip + top` row từ mỗi store, stable-sort `createdAt desc, ID desc`, rồi slice. `skip` cap 10.000 và `top` cap 100. Readiness đọc 25 row mới nhất của mỗi delivery store và giữ precedence outcome đã persist trong bảy ngày: `SENT` gần đây, nếu không thì `FAILED` gần đây, còn lại `UNKNOWN`.

Retry access yêu cầu đúng `FAILED`, lỗi transient allowlist, còn attempt budget, không có lock active/invalid và `modifiedAt` khớp. UPDATE optimistic chỉ reset status/schedule/error/lock, giữ nguyên recipient/message/provider/source-audit snapshot, append `RETRY_ACCESS_DELIVERY/QUEUED` và schedule worker chung sau commit.

- **Vị trí**: `srv/user-admin/operations-audit.js:107-202` — `searchAdministrationDeliveries`.
  **Khái niệm IDTS**: một view có giới hạn cho PM + UserAdmin trên hai lịch sử delivery invitation/access riêng.
  **Ảnh hưởng nếu sai**: paging có thể bỏ/trùng row, persistence chưa mask có thể lộ hoặc deep query overfetch.
  **Phải kiểm tra cùng**: `srv/user-admin.cds:125-140,216-223`, loader/filter UI và test pagination hỗn hợp 300 row.
- **Vị trí**: `srv/user-admin/operations-audit.js:274-290` — readiness trên hai store.
  **Khái niệm IDTS**: outcome delivery gần đây đã persist quyết định availability vận hành.
  **Ảnh hưởng nếu sai**: Operations có thể báo email available từ evidence stale, queued hoặc chưa hoàn tất.
  **Phải kiểm tra cùng**: field timestamp invitation/access và test boundary bảy ngày.
- **Vị trí**: `srv/user-admin/operations-audit.js:417-504` — `retryUserAccessDelivery`.
  **Khái niệm IDTS**: recovery optimistic có ceiling mà không đổi completion audit hoặc payload snapshot.
  **Ảnh hưởng nếu sai**: click stale, worker active, lỗi permanent hoặc row vượt budget có thể gửi lại.
  **Phải kiểm tra cùng**: `srv/user-admin/access-delivery.js:110-176`, `srv/email/worker.js` và test retry/lock.
- **Vị trí**: `srv/user-admin/operations-audit.js:590-666` — mapping DTO an toàn, khả năng retry, guard page/type.
  **Khái niệm IDTS**: masking do server quyết định và chọn delivery type fail-closed.
  **Ảnh hưởng nếu sai**: UI có thể suy luận retry từ field không an toàn hoặc route type lạ sang retry invitation.
  **Phải kiểm tra cùng**: `Main.controller.js:1266-1297,1570-1593` và forbidden-field test.

### Safe editing / Sửa an toàn

Keep both domain tables private, authorize first, and preserve the allowlist, stable ordering, bounds, optimistic retry, and seven-day semantics together. Never expose body, raw email, audit IDs, provider data, lock tokens, or raw errors.

Giữ cả hai bảng domain private, authorize trước và giữ đồng thời allowlist, order ổn định, boundary, retry optimistic và semantics bảy ngày. Không expose body, raw email, audit ID, provider data, lock token hoặc raw error.

Không thêm external client, endpoint, log viewer, schema index hoặc raw persistence projection mới vào module này. Mọi safe field mới phải được thêm đồng thời vào CDS DTO, mapper, forbidden-field test và UI/knowledge mirror tương ứng.
