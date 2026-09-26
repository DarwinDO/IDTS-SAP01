# Knowledge: `srv/user-admin/delivery.js`

The onboarding delivery worker claims one durable delivery row, reloads its invitation, regenerates the signed link from persisted nonce plus the private signing key, and sends it through the existing provider adapter. The raw invitation token and message body are not persisted.

Provider failures use the shared sanitized error mapping and retry schedule. Delivery state records only `FAILED`, retry time, safe code/summary, and cleared locks. The same safe code/summary is mirrored to the parent request so the administration screen can show a useful failure state; a later successful send clears those request fields. Provider secrets, raw errors, response bodies, endpoints, tokens, and message bodies are excluded. Expired or missing invitations become `SKIPPED`.

## Invitation guidance and application link / Hướng dẫn invitation và link ứng dụng

### English

`buildInvitationMessage` now gives the recipient an ordered path for both cases: an existing SAP Universal ID or no SAP Universal ID yet. It requires the same email address that received the invitation, keeps the signed verification token only in the URL fragment, tells the recipient to wait for `ACTIVE`, and links to the IDTS application. After activation, the recipient must sign out and sign in again so XSUAA can issue a new session containing the assigned Role Collection.

- **Location**: `buildInvitationMessage` — plain-text and HTML invitation bodies.
  **IDTS concept**: invitation verification links an immutable SAP identity, while application entry also requires a fresh platform-role claim.
  **Impact if broken**: recipients may verify successfully but keep a pre-provisioning JWT and receive a safe HTTP 403 from IDTS.
  **Must check together**: `app/router/resources/onboarding/onboarding-page.mjs`, `app/bug-management-ui/webapp/auth-guard.js`, `srv/auth/platform-role.js`, and onboarding security tests.

### Tiếng Việt

`buildInvitationMessage` nay hướng dẫn theo thứ tự cho cả hai trường hợp: đã có SAP Universal ID hoặc chưa có SAP Universal ID. Email yêu cầu dùng đúng địa chỉ đã nhận invitation, tiếp tục giữ token xác minh chỉ trong URL fragment, yêu cầu chờ trạng thái `ACTIVE`, và cung cấp link vào IDTS. Sau khi active, người nhận cần đăng xuất rồi đăng nhập lại để XSUAA cấp session mới có Role Collection vừa được gán.

- **Vị trí**: `buildInvitationMessage` — nội dung invitation dạng text và HTML.
  **Khái niệm IDTS**: xác minh invitation liên kết SAP identity bất biến, còn mở ứng dụng cần platform-role claim mới.
  **Ảnh hưởng nếu sai**: người nhận có thể xác minh thành công nhưng vẫn giữ JWT trước provisioning và nhận HTTP 403 an toàn từ IDTS.
  **Phải kiểm tra cùng**: `app/router/resources/onboarding/onboarding-page.mjs`, `app/bug-management-ui/webapp/auth-guard.js`, `srv/auth/platform-role.js` và các test bảo mật onboarding.

## Gate 6 retry relationship / Quan hệ retry Gate 6

### English

The worker remains the only email sender. Gate 6 does not add a new delivery worker or provider call: `retryOnboardingDelivery` resets one exact retry-eligible row and registers the existing post-commit `scheduleImmediateEmailOutbox` kick. The hourly/polling worker then claims the `PENDING` row through the same lock and sanitized-error path described above.

- **Location**: `srv/user-admin/delivery.js:14-127` — persisted delivery claim/send/failure flow.
  **IDTS concept**: worker recovery is durable and provider failures stay outside the business transaction.
  **Impact if broken**: a delivery retry could bypass the worker lock, send raw invitation data, or create duplicate provider paths.
  **Must check together**: `srv/user-admin/operations-audit.js:188-286`, `srv/email/worker.js:48-82`, and `scripts/qa/test-email-immediate-kick.js`.

## Gate 6.5 shared `formatFrom` reuse / Tái sử dụng `formatFrom` Gate 6.5

### English

The invitation processor no longer owns a duplicate `formatFrom` implementation. It imports the existing sanitized helper from `srv/email/outbox.js`, matching the new access processor while preserving every invitation token, SAP-account link, claim, retry, and failure rule.

- **Location**: `srv/user-admin/delivery.js:6,150` — shared import and sender call.
  **IDTS concept**: invitation and access email use one provider-neutral sender header policy.
  **Impact if broken**: one domain can format an unsafe/different sender or a refactor can silently change invitation behavior.
  **Must check together**: `srv/email/outbox.js:228-234`, `srv/user-admin/access-delivery.js:143-151`, and invitation/outbox regressions.

### Tiếng Việt

Processor invitation không còn giữ implementation `formatFrom` trùng. Nó import helper sanitize hiện có từ `srv/email/outbox.js`, đồng bộ với processor access mới nhưng giữ nguyên mọi rule token invitation, SAP-account link, claim, retry và failure.

- **Vị trí**: `srv/user-admin/delivery.js:6,150` — import chung và sender call.
  **Khái niệm IDTS**: email invitation và access dùng một policy header sender không phụ thuộc provider.
  **Ảnh hưởng nếu sai**: một domain có thể format sender không an toàn/khác nhau hoặc refactor làm đổi âm thầm behavior invitation.
  **Phải kiểm tra cùng**: `srv/email/outbox.js:228-234`, `srv/user-admin/access-delivery.js:143-151` và regression invitation/outbox.

**Safe editing / Sửa an toàn:** This change is reuse only; do not merge invitation and access storage or token semantics. / Đây chỉ là tái sử dụng; không gộp storage invitation/access hoặc semantics token.

## Gate 6 retry relationship — Tiếng Việt

Worker vẫn là sender email duy nhất. Gate 6 không thêm worker hoặc provider call mới: `retryOnboardingDelivery` reset đúng một row đủ điều kiện và đăng ký kick `scheduleImmediateEmailOutbox` hiện có sau commit. Worker polling/hourly tiếp tục claim row `PENDING` qua cùng lock và sanitized-error path.

- **Vị trí**: `srv/user-admin/delivery.js:14-127` — flow claim/send/failure trên delivery đã persist.
  **Khái niệm IDTS**: recovery worker bền vững và provider failure không nằm trong business transaction.
  **Ảnh hưởng nếu sai**: retry delivery có thể bỏ qua lock worker, gửi raw invitation data hoặc tạo provider path duplicate.
  **Phải kiểm tra cùng**: `srv/user-admin/operations-audit.js:188-286`, `srv/email/worker.js:48-82` và `scripts/qa/test-email-immediate-kick.js`.
