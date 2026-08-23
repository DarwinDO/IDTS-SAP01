# Knowledge: `srv/user-admin.cds`

## Gate 2 Active Users contract / Contract Active Users Gate 2

Gate 2 adds the read-only `ActiveUserSummary` and `ActiveUserDetails` structured types plus `searchActiveUsers(query, includeNonActive, skip, top)` and `readActiveUserDetails(userID)` actions. The summary is one row per persisted IDTS user, not one row per invitation. Default search excludes only derived `REVOKED` rows; `SUSPENDED` and `INCOMPLETE` rows remain visible for admin attention, while `includeNonActive=true` adds revoked rows. `skip`/`top` provide explicit stable paging; `top` is bounded to 100.

Gate 2 thêm structured type `ActiveUserSummary`, `ActiveUserDetails` chỉ đọc cùng hai action `searchActiveUsers(query, includeNonActive, skip, top)` và `readActiveUserDetails(userID)`. Summary có một row cho mỗi user IDTS đã lưu, không phải một row cho mỗi invitation. Search mặc định chỉ loại row `REVOKED`; row `SUSPENDED` và `INCOMPLETE` vẫn hiển thị để admin xử lý, còn `includeNonActive=true` thêm row revoked. `skip`/`top` tạo paging explicit ổn định; `top` bị giới hạn 100.

The public contract contains display/contact fields, business role, the PM/UserAdmin capability boolean, derived access state, immutable-link completeness boolean, Developer readiness/responsibility count, pending operation type/state, safe result code, reconciliation timestamp, and details-only counts/profile summary. It does not expose provider identifiers, identity claims or immutable-link values, credentials, invitation payloads, operation leases, or raw audit/provider data.

Contract public chứa field display/contact, business role, boolean capability PM/UserAdmin, access state suy ra, boolean đầy đủ immutable-link, readiness/count responsibility Developer, type/state operation pending, safe result code, timestamp reconciliation và count/profile summary chỉ có ở details. Contract không expose provider identifier, identity claim hoặc giá trị immutable-link, credential, payload invitation, operation lease hay raw audit/provider data.

The service remains under the existing authenticated `UserAdministrationService` boundary. Handler authorization is still exact PM + `UserAdmin` plus an active internal PM; UI visibility is not an authorization mechanism. No entity, aspect, column, CSV, or database artifact changes for Gate 2.

Service vẫn nằm dưới boundary authenticated `UserAdministrationService` hiện có. Authorization handler vẫn là đúng PM + `UserAdmin` và internal PM active; UI visibility không phải cơ chế phân quyền. Gate 2 không đổi entity, aspect, column, CSV hoặc database artifact.

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

## Gate 3 access lifecycle / Vòng đời access Gate 3

The additive service contract exposes `requestSuspend(userID, reason, expectedVersion)` and `requestReactivate(userID, reason, expectedVersion)`, both returning the existing sanitized `OnboardingResult` shape. Gate 3 adds the `SUSPENDED` onboarding status without removing or renaming existing statuses. The client sends only the bounded reason and optimistic version; provider identifiers, credentials, leases, and raw provider data remain outside the public contract.

Vietnamese: Contract additive them `requestSuspend(userID, reason, expectedVersion)` va `requestReactivate(userID, reason, expectedVersion)`, cung tra ve shape `OnboardingResult` da sanitize. Gate 3 them status onboarding `SUSPENDED` ma khong xoa hoac doi ten status cu. Client chi gui reason co gioi han va version optimistic; provider identifier, credential, lease va raw provider data khong nam trong public contract.
## Gate 3B public contract boundary / Ranh gioi public contract Gate 3B

`requestExistingUserIdentityLink(userID: UUID, email: String(255))` is the only new public action input. `linkTargetUser` and `linkSourceEmailNormalized` are private persistence fields on the onboarding request; the Active Users summary/details add only the safe Boolean `linkEligible`. Provider identifiers and immutable identity internals remain absent from public projections.

`requestExistingUserIdentityLink(userID: UUID, email: String(255))` la input duy nhat cua action public moi. `linkTargetUser` va `linkSourceEmailNormalized` la field persistence private cua onboarding request; Active Users summary/details chi them Boolean an toan `linkEligible`. Provider identifier va immutable identity noi bo van khong co trong public projection.

## Gate 5 Business Catalog public contract / Contract Business Catalog Gate 5

`UserAdministrationService` exposes four bounded catalog projections with a 100-row query cap, `modifiedAt` ETag, and one virtual administration reason accepted only for mutation handling. `readCatalogImpact` returns only counts for referenced Bugs, active Developer responsibilities, and active child catalogs. The service does not expose the audit table, raw SQL, provider data, or hard delete.

`UserAdministrationService` expose bon projection catalog gioi han 100 row, dung `modifiedAt` lam ETag va mot virtual administration reason chi cho mutation handler. `readCatalogImpact` chi tra count Bug tham chieu, Developer responsibility active va child catalog active. Service khong expose audit table, raw SQL, provider data hay hard delete.
