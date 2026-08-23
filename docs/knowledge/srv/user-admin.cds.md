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

## Gate 5 contract anchors / Anchor contract Gate 5

### English

The four catalog projections are the public OData V4 shapes for the Business Catalogs tab. They intentionally expose IDs, classification fields, active state, managed timestamps, and one virtual `administrationReason` input used by the handler for bounded deactivation audit. `CatalogComponentCategories` exposes only `component_ID` and `defectCategory_ID`, not unrestricted Bug/User navigation.

- **Location**: `srv/user-admin.cds:109-115`, `CatalogImpactResult`.
  **IDTS concept**: Deactivation preview is count-only: Bug references, active DeveloperResponsibilities, and active child catalog references.
  **Impact if broken**: The UI could promise safe deactivation without showing the dependency boundary or could expose raw business records.
  **Must check together**: `srv/user-admin/catalogs.js:291-342`, `CatalogImpact.fragment.xml`, and `scripts/qa/test-user-admin-catalogs.js:133-150`.

- **Location**: `srv/user-admin.cds:193-196`, `readCatalogImpact`.
  **IDTS concept**: The only custom catalog action accepts an allowlisted catalog type and UUID; it is still behind the service authorization boundary.
  **Impact if broken**: A caller could probe arbitrary entities or bypass PM/UserAdmin authorization through an unbounded impact endpoint.
  **Must check together**: `srv/user-admin.js:87-89`, `srv/user-admin/catalogs.js:291-309`, and the role-negative tests.

- **Location**: `srv/user-admin.cds:236-293`, four `Catalog*` projections.
  **IDTS concept**: Each projection has a maximum query limit of 100, `modifiedAt @odata.etag`, explicit insert/update capability, explicit `DeleteRestrictions.Deletable: false`, and an immutable UUID key. The read cap protects each request; UI5 uses `requestContexts(0, Infinity)` to follow pages for complete local filtering.
  **Impact if broken**: Metadata could advertise unsafe DELETE, lose optimistic concurrency, let clients treat IDs as mutable, or make the UI silently search only the first page.
  **Must check together**: `Main.controller.js:870-900`, `srv/user-admin/catalogs.js:111-187`, CAP EDMX output, and `scripts/qa/test-user-admin-catalogs.js:61-67`.

### Tiếng Việt

Bốn projection catalog là shape OData V4 public cho tab Business Catalogs. Projection chỉ expose ID, field phân loại, active, managed timestamp và một input virtual `administrationReason` để handler ghi audit deactivate có giới hạn. `CatalogComponentCategories` chỉ expose `component_ID` và `defectCategory_ID`, không mở navigation tự do tới Bug/User.

- **Vị trí**: `srv/user-admin.cds:109-115`, `CatalogImpactResult`.
  **Khái niệm IDTS**: Deactivation preview chỉ trả count: Bug reference, `DeveloperResponsibilities` active và child catalog active.
  **Ảnh hưởng nếu sai**: UI có thể hứa deactivate an toàn mà không cho thấy boundary dependency hoặc làm lộ raw business record.
  **Phải kiểm tra cùng**: `srv/user-admin/catalogs.js:291-342`, `CatalogImpact.fragment.xml` và `scripts/qa/test-user-admin-catalogs.js:133-150`.

- **Vị trí**: `srv/user-admin.cds:193-196`, `readCatalogImpact`.
  **Khái niệm IDTS**: Custom action duy nhất của catalog chỉ nhận catalog type allowlist và UUID, đồng thời vẫn nằm trong boundary authorization của service.
  **Ảnh hưởng nếu sai**: Caller có thể probe entity tùy ý hoặc bypass authorization PM/UserAdmin qua endpoint impact không giới hạn.
  **Phải kiểm tra cùng**: `srv/user-admin.js:87-89`, `srv/user-admin/catalogs.js:291-309` và negative role tests.

- **Vị trí**: `srv/user-admin.cds:236-293`, bốn projection `Catalog*`.
  **Khái niệm IDTS**: Mỗi projection có query limit tối đa 100, `modifiedAt @odata.etag`, capability insert/update rõ ràng, `DeleteRestrictions.Deletable: false` rõ ràng và UUID key immutable. Read cap bảo vệ từng request; UI5 dùng `requestContexts(0, Infinity)` để đi qua các page và filter local đầy đủ.
  **Ảnh hưởng nếu sai**: Metadata có thể quảng bá DELETE không an toàn, mất optimistic concurrency, cho client coi ID là mutable hoặc làm UI chỉ search âm thầm page đầu.
  **Phải kiểm tra cùng**: `Main.controller.js:870-900`, `srv/user-admin/catalogs.js:111-187`, output CAP EDMX và `scripts/qa/test-user-admin-catalogs.js:61-67`.

### Safe editing / Sửa an toàn

Do not expose `CatalogAdministrationAuditEvents` as a writable public entity. When adding a catalog field, update the CDS projection, handler allowlist, UI payload/display, both locale files, knowledge mirrors, CAP/UI contracts, and the exact OData metadata test. Re-run `npx cds compile srv -s all --to edmx`; this is source verification only, not HDI migration.

Không expose `CatalogAdministrationAuditEvents` thành entity public writable. Khi thêm field catalog, phải cập nhật CDS projection, handler allowlist, UI payload/display, hai locale, knowledge mirror, CAP/UI contract và test metadata OData. Chạy lại `npx cds compile srv -s all --to edmx`; đây chỉ là source verification, không phải HDI migration.
