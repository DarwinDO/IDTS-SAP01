# Knowledge: `srv/user-admin.cds`

`UserAdministrationService` is a separate authenticated CAP boundary for controlled onboarding and access administration. It exposes invitation/verification/search plus `approveProvisioning`, `requestRoleChange`, `requestRevoke`, `retryAccessOperation`, and `reconcileAccessOperation`. Retry accepts only `RETRYABLE_FAILURE`; reconciliation accepts only `BLOCKED_MANUAL_REVIEW` with the exact safe result code `AMBIGUOUS_PROVIDER_OUTCOME`, then queues the broker's read-before-write convergence path. Deterministic conflicts and permanent failures cannot be requeued through this action. Every mutating administration action is PM+UserAdmin protected, version checked, and returns only a sanitized request summary. The service intentionally omits token hash, nonce, issuer, subject, leases and provider internals.

Authorization is completed in `srv/user-admin.js`: administration requires both PM and `UserAdmin` plus a matching active internal PM. The verification action accepts a bounded invitation token and requires an authenticated SAP identity, but never asks IDTS to collect an SAP password, OTP, passkey, or recovery code.

Each bounded Retry or Reconcile creates a fresh operation-attempt correlation ID while retaining the same versioned operation journal row. Expired-lease recovery also rotates that attempt correlation before recording `AMBIGUOUS_PROVIDER_OUTCOME`. This preserves every earlier audit event and keeps the unique `(correlationId, action)` audit key valid across multiple attempts; it does not delete history or create a second access operation.

Vietnamese: Service nay tach user administration khoi BugService. API quan tri bat buoc PM + UserAdmin; callback chi nhan SAP identity da duoc AppRouter/XSUAA xac thuc. Contract public khong expose token hash, nonce, signing key hoac lock cua worker.

Moi lan Retry/Reconcile va moi expired-lease recovery dung correlation ID moi cho attempt moi, nhung van giu cung operation journal da version. Audit attempt cu duoc giu nguyen; khong xoa history va khong tao operation thu hai.
