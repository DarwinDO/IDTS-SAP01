# Knowledge: `srv/user-admin/delivery.js`

The onboarding delivery worker claims one durable delivery row, reloads its invitation, regenerates the signed link from persisted nonce plus the private signing key, and sends it through the existing provider adapter. The raw invitation token and message body are not persisted.

Provider failures use the shared sanitized error mapping and retry schedule. Delivery state records only `FAILED`, retry time, safe code/summary, and cleared locks. The same safe code/summary is mirrored to the parent request so the administration screen can show a useful failure state; a later successful send clears those request fields. Provider secrets, raw errors, response bodies, endpoints, tokens, and message bodies are excluded. Expired or missing invitations become `SKIPPED`.

## Gate 6 retry relationship / Quan hệ retry Gate 6

### English

The worker remains the only email sender. Gate 6 does not add a new delivery worker or provider call: `retryOnboardingDelivery` resets one exact retry-eligible row and registers the existing post-commit `scheduleImmediateEmailOutbox` kick. The hourly/polling worker then claims the `PENDING` row through the same lock and sanitized-error path described above.

- **Location**: `srv/user-admin/delivery.js:14-127` — persisted delivery claim/send/failure flow.
  **IDTS concept**: worker recovery is durable and provider failures stay outside the business transaction.
  **Impact if broken**: a delivery retry could bypass the worker lock, send raw invitation data, or create duplicate provider paths.
  **Must check together**: `srv/user-admin/operations-audit.js:188-286`, `srv/email/worker.js:48-82`, and `scripts/qa/test-email-immediate-kick.js`.

### Tiếng Việt

Worker vẫn là sender email duy nhất. Gate 6 không thêm worker hoặc provider call mới: `retryOnboardingDelivery` reset đúng một row đủ điều kiện và đăng ký kick `scheduleImmediateEmailOutbox` hiện có sau commit. Worker polling/hourly tiếp tục claim row `PENDING` qua cùng lock và sanitized-error path.

- **Vị trí**: `srv/user-admin/delivery.js:14-127` — flow claim/send/failure trên delivery đã persist.
  **Khái niệm IDTS**: recovery worker bền vững và provider failure không nằm trong business transaction.
  **Ảnh hưởng nếu sai**: retry delivery có thể bỏ qua lock worker, gửi raw invitation data hoặc tạo provider path duplicate.
  **Phải kiểm tra cùng**: `srv/user-admin/operations-audit.js:188-286`, `srv/email/worker.js:48-82` và `scripts/qa/test-email-immediate-kick.js`.
