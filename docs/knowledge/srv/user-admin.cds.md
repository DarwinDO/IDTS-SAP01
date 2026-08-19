# Knowledge: `srv/user-admin.cds`

## Developer catalog navigation / Navigation catalog Developer

`ComponentCategories` exposes its `component` and `defectCategory` associations for the PM invitation form. The service must also expose read-only `ApplicationComponents` and `DefectCategories` projections; otherwise CAP cannot redirect those associations into OData navigation properties and UI5 `$expand` requests fail with HTTP 400 before the dialog opens.

`ComponentCategories` expose association `component` và `defectCategory` cho form invite của PM. Service cũng phải expose projection read-only `ApplicationComponents` và `DefectCategories`; nếu thiếu, CAP không redirect được association thành OData navigation property và request `$expand` của UI5 sẽ lỗi HTTP 400 trước khi dialog mở.

## Developer administration source candidate / Candidate quản trị Developer

The service accepts a structured `DeveloperProfileInput` only for DEVELOPER onboarding or role change. It exposes PM+UserAdmin actions to read and update an active Developer profile, plus read-only catalogs for availability, responsibility level, SAP Module, and Component Category.

Service chỉ nhận `DeveloperProfileInput` cho onboarding hoặc đổi role sang DEVELOPER. PM+UserAdmin có action đọc/cập nhật profile Developer active; các catalog availability, responsibility level, SAP Module và Component Category chỉ đọc.

`UserAdministrationService` is a separate authenticated CAP boundary for controlled onboarding and access administration. It exposes invitation/verification/search plus `approveProvisioning`, `requestRoleChange`, `requestRevoke`, `retryAccessOperation`, and `reconcileAccessOperation`. Retry accepts only `RETRYABLE_FAILURE`; reconciliation accepts only `BLOCKED_MANUAL_REVIEW` with the exact safe result code `AMBIGUOUS_PROVIDER_OUTCOME`, then queues the broker's read-before-write convergence path. Deterministic conflicts and permanent failures cannot be requeued through this action. Every mutating administration action is PM+UserAdmin protected, version checked, and returns only a sanitized request summary. The service intentionally omits token hash, nonce, issuer, subject, leases and provider internals.

Authorization is completed in `srv/user-admin.js`: administration requires both PM and `UserAdmin` plus a matching active internal PM. The verification action accepts a bounded invitation token and requires an authenticated SAP identity, but never asks IDTS to collect an SAP password, OTP, passkey, or recovery code.

Each bounded Retry or Reconcile creates a fresh operation-attempt correlation ID while retaining the same versioned operation journal row. Expired-lease recovery also rotates that attempt correlation before recording `AMBIGUOUS_PROVIDER_OUTCOME`. This preserves every earlier audit event and keeps the unique `(correlationId, action)` audit key valid across multiple attempts; it does not delete history or create a second access operation.

Vietnamese: Service nay tach user administration khoi BugService. API quan tri bat buoc PM + UserAdmin; callback chi nhan SAP identity da duoc AppRouter/XSUAA xac thuc. Contract public khong expose token hash, nonce, signing key hoac lock cua worker.

Moi lan Retry/Reconcile va moi expired-lease recovery dung correlation ID moi cho attempt moi, nhung van giu cung operation journal da version. Audit attempt cu duoc giu nguyen; khong xoa history va khong tao operation thu hai.
