# Knowledge: `srv/user-admin.cds`

## 2026-09-03 public profile contract / Contract hồ sơ public 2026-09-03

`requestOnboarding` accepts a bounded display name, and `updateActiveUserDisplayName` accepts only user ID, display name, reason, and optimistic timestamp. `ActiveUserDetails.profileModifiedAt` is the safe version token. No email-write or raw identity/provider field is exposed. Check `db/schema.cds`, `srv/user-admin.js`, `srv/user-admin/active-users.js`, and the UI controller together.

`requestOnboarding` nhận display name có giới hạn; `updateActiveUserDisplayName` chỉ nhận user ID, display name, reason và timestamp optimistic. `ActiveUserDetails.profileModifiedAt` là version token an toàn. Contract không expose email-write hoặc identity/provider field thô. Phải kiểm tra cùng schema, hai handler và UI controller.

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

The four catalog projections are the public OData V4 shapes for the Business Catalogs tab. Their keys are immutable and server-computed. They intentionally expose classification fields, active state, managed timestamps, and one virtual writable `administrationReason` input used only by the handler for bounded deactivation audit. `CatalogComponentCategories` exposes the writable `component` and `defectCategory` associations required by UI5; OData also emits their foreign-key properties, but the service does not expose unrestricted Bug/User navigation.

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

Bốn projection catalog là shape OData V4 public cho tab Business Catalogs. Key là immutable và do server tạo. Projection expose field phân loại, active, managed timestamp và input virtual writable `administrationReason` chỉ để handler ghi audit deactivate có giới hạn. `CatalogComponentCategories` expose association writable `component` và `defectCategory` mà UI5 cần; OData cũng sinh foreign-key property tương ứng, nhưng service không mở navigation tự do tới Bug/User.

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

## Gate 6 Operations and Audit contract / Contract Operations và Audit Gate 6

### English

Gate 6 adds five action-only safe DTO contracts at `srv/user-admin.cds:109-224`: onboarding delivery summaries, access-operation summaries, administration audit summaries, persisted-state readiness, and the bounded `retryOnboardingDelivery` action. The service deliberately does not expose `UserOnboardingDeliveries`, `UserAccessOperations`, or `UserIdentityAuditEvents` as public entities.

- **IDTS concept**: PM + UserAdmin can inspect delivery, provisioning, and append-only administration history without receiving recipient email, provider IDs, lock/lease material, idempotency keys, identity hashes, or raw provider data.
- **Impact if broken**: A new field can turn a support screen into a credential/provider/debug viewer or allow a caller to enumerate private identity data.
- **Must check together**: `srv/user-admin/operations-audit.js`, `scripts/qa/test-user-admin-operations-audit.js`, CAP EDMX, and `Main.view.xml` operations/audit tabs.

Each action accepts bounded filters and `skip`/`top`; the server default is 25 and the maximum is 100. `modifiedAt` is present only as the optimistic token needed by the delivery retry action. Correlations are represented only by a server-generated 12-character SHA-256 fingerprint in audit summaries.

### Tiếng Việt

Gate 6 thêm năm contract DTO an toàn chỉ qua action tại `srv/user-admin.cds:109-224`: summary delivery onboarding, summary access operation, summary audit administration, readiness suy ra từ persisted state và action `retryOnboardingDelivery` có giới hạn. Service cố ý không expose `UserOnboardingDeliveries`, `UserAccessOperations` hoặc `UserIdentityAuditEvents` thành public entity.

- **Khái niệm IDTS**: PM + UserAdmin có thể xem delivery, provisioning và lịch sử administration append-only mà không nhận email người nhận, provider ID, lock/lease, idempotency key, identity hash hoặc raw provider data.
- **Ảnh hưởng nếu sai**: Thêm field không an toàn có thể biến màn hình support thành log/credential/provider viewer hoặc cho phép dò identity private.
- **Phải kiểm tra cùng**: `srv/user-admin/operations-audit.js`, `scripts/qa/test-user-admin-operations-audit.js`, CAP EDMX và tab operations/audit trong `Main.view.xml`.

Mỗi action nhận filter có giới hạn cùng `skip`/`top`; mặc định server là 25 và tối đa 100. `modifiedAt` chỉ xuất hiện như optimistic token cần cho retry delivery. Correlation chỉ hiển thị dưới dạng fingerprint SHA-256 12 ký tự do server tạo.

### Safe editing / Sửa an toàn

Keep the DTO allow-list explicit. If persistence adds a column, do not add it to the action result by copying the entity; decide whether it is a safe business display field, add a red/green forbidden-field test, and update the bilingual UI mirror. Do not add schema indexes or public entity projections without measured evidence and a separate decision.

Giữ allow-list DTO rõ ràng. Nếu persistence thêm column, không copy nguyên entity vào action result; phải quyết định đó có phải field business an toàn không, thêm test forbidden-field red/green và cập nhật mirror UI song ngữ. Không thêm index schema hoặc public entity projection khi chưa có evidence đo lường và decision riêng.

## Gate 6.2 details-only lifecycle token / Optimistic token lifecycle chỉ ở details Gate 6.2

### English

`ActiveUserDetails.accessRequestVersion` is a details-only safe optimistic token. The server selects the authoritative current request while building the Active User read model, then maps only its integer `provisioningVersion` into this field. `ActiveUserSummary` does not expose the token, and the details result does not expose the selected request row, invitation payload, provider identifiers, identity claims, hashes, leases, or raw provider data.

The UI may use the token as `expectedVersion` for `requestRoleChange`, `requestSuspend`, `requestReactivate`, or `requestRevoke`, but CAP remains authoritative for user ownership, state, authorization and conflict checks. If no selected request has a safe integer version, the details field is null and the UI must not invent a request token. This contract is additive and does not create a public request entity or a schema column.

**Source anchors**: `srv/user-admin.cds:53-72` (`ActiveUserDetails`), `srv/user-admin.cds:223-257` (read/details and lifecycle actions), and `srv/user-admin/active-users.js:104-126,191-243,313-325` (allow-listed selection and details mapping).

### Tiếng Việt

`ActiveUserDetails.accessRequestVersion` là optimistic token an toàn chỉ có ở details. Server chọn request hiện tại có authority khi dựng read model Active User, rồi chỉ map `provisioningVersion` integer của request đó vào field này. `ActiveUserSummary` không expose token; response details cũng không expose nguyên request row, invitation payload, provider identifier, identity claim, hash, lease hoặc raw provider data.

UI có thể dùng token làm `expectedVersion` cho `requestRoleChange`, `requestSuspend`, `requestReactivate` hoặc `requestRevoke`, nhưng CAP vẫn là authority cho user ownership, state, authorization và conflict check. Nếu không có request được chọn với version integer an toàn, field details là null và UI không được tự tạo request token. Contract này là additive, không tạo public request entity hay schema column.

**Anchor nguồn**: `srv/user-admin.cds:53-72` (`ActiveUserDetails`), `srv/user-admin.cds:223-257` (action read/details và lifecycle) và `srv/user-admin/active-users.js:104-126,191-243,313-325` (selection allow-list và mapping details).

## Gate 6.5 unified delivery contract / Contract delivery hợp nhất Gate 6.5

### English

`AdministrationDeliverySummary` is the only public DTO used to combine invitation, access-change, and read-only Digest deliveries in Operations. Its thirteen fields are allowlisted: type/event, masked recipient, safe outcome/retry timestamps, allowlisted error code/summary, retry capability, and optimistic `modifiedAt`. `searchAdministrationDeliveries` accepts only `ALL`, `INVITATION`, `ACCESS_CHANGE`, or `DIGEST`; `retryUserAccessDelivery` retains the existing UUID plus expected-timestamp optimistic contract, while Digest never exposes retry.

- **Location**: `srv/user-admin.cds:125-140` — `AdministrationDeliverySummary`.
  **IDTS concept**: one privacy-safe operational shape over three domain-owned delivery stores.
  **Impact if broken**: UI can expose recipient/body/provider/lock/audit internals or lose the type needed for fail-closed retry dispatch.
  **Must check together**: `srv/user-admin/operations-audit.js:107-202,590-613` and `Main.controller.js:_normalizeDeliveryRow`.
- **Location**: `srv/user-admin.cds:216-223,245-248` — unified search and access retry actions.
  **IDTS concept**: bounded PM + UserAdmin diagnosis and state-valid retry.
  **Impact if broken**: unauthorized or stale retries can bypass CAP, or the UI may invoke the invitation action for an access row.
  **Must check together**: `srv/user-admin.js`, `operations-audit.js:417-504`, and authorization tests.

### Tiếng Việt

`AdministrationDeliverySummary` là DTO public duy nhất để hợp nhất delivery invitation, access-change và Digest read-only trong Operations. Mười ba field được allowlist: type/event, recipient đã che, outcome/timestamp retry an toàn, error code/summary allowlist, khả năng retry và `modifiedAt` optimistic. `searchAdministrationDeliveries` chỉ nhận `ALL`, `INVITATION`, `ACCESS_CHANGE`, `DIGEST`; `retryUserAccessDelivery` giữ contract UUID cùng expected timestamp hiện có, còn Digest không expose retry.

- **Vị trí**: `srv/user-admin.cds:125-140` — `AdministrationDeliverySummary`.
  **Khái niệm IDTS**: một shape vận hành bảo vệ privacy trên ba delivery store theo domain.
  **Ảnh hưởng nếu sai**: UI có thể lộ recipient/body/provider/lock/audit nội bộ hoặc mất type cần cho retry fail-closed.
  **Phải kiểm tra cùng**: `srv/user-admin/operations-audit.js:107-202,590-613` và `Main.controller.js:_normalizeDeliveryRow`.
- **Vị trí**: `srv/user-admin.cds:216-223,245-248` — action search hợp nhất và retry access.
  **Khái niệm IDTS**: chẩn đoán có giới hạn cho PM + UserAdmin và retry đúng state.
  **Ảnh hưởng nếu sai**: retry unauthorized hoặc stale có thể bypass CAP, hoặc UI gọi nhầm action invitation cho row access.
  **Phải kiểm tra cùng**: `srv/user-admin.js`, `operations-audit.js:417-504` và test authorization.

**Safe editing / Sửa an toàn:** Keep the DTO narrower than persistence and update CDS, mapper, forbidden-field tests, UI normalization, and mirrors together. / Giữ DTO hẹp hơn persistence và cập nhật đồng thời CDS, mapper, forbidden-field test, normalize UI và mirror.
