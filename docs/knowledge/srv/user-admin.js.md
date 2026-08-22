# Knowledge: `srv/user-admin.js`

## Gate 2 Active Users registration / Đăng ký Active Users Gate 2

`UserAdministrationService.init` registers the focused `active-users.js` module with the existing `requireActiveUserAdministrator` guard. The guard is reused rather than duplicated, and each Active Users action authorizes with its request transaction before reading persisted entities.

`UserAdministrationService.init` đăng ký module focused `active-users.js` với guard `requireActiveUserAdministrator` hiện có. Guard được dùng lại thay vì duplicate, và mỗi Active Users action authorize bằng request transaction trước khi đọc entity persisted.

The service adds no write handler for Gate 2. `searchActiveUsers` and `readActiveUserDetails` are read-only actions; their UI counterpart can never grant access by hiding or showing a tab. The existing invitation, approval, role-change, revoke, retry, reconcile, and Developer profile mutation handlers remain separate and unchanged in responsibility.

Service không thêm write handler cho Gate 2. `searchActiveUsers` và `readActiveUserDetails` là action chỉ đọc; UI không thể cấp quyền bằng việc ẩn/hiện tab. Các handler mutation invitation, approval, đổi role, revoke, retry, reconcile và Developer profile hiện có vẫn tách biệt và giữ nguyên trách nhiệm.

The shared guard continues to require exactly one PM business role, `UserAdmin`, and a matching active internal PM. A PM without `UserAdmin`, a Tester with `UserAdmin`, a mixed-role principal, or an inactive internal PM is denied. This matrix is exercised by the focused in-memory test and direct service action calls.

Guard dùng chung tiếp tục yêu cầu đúng một business role PM, `UserAdmin` và internal PM tương ứng đang active. PM thiếu `UserAdmin`, Tester có `UserAdmin`, principal nhiều role hoặc internal PM inactive đều bị deny. Ma trận này được test bằng fixture in-memory và gọi trực tiếp service action.

## Developer profile validation / Validation profile Developer

Developer access requires a positive workload limit and at least one unique active catalog responsibility. The handler persists the invitation snapshot in one request-owned `UserOnboardingDeveloperProfiles` header plus its responsibility rows, validates active catalogs, and uses the one-to-one `DeveloperProfileAdministrationStates.administrationVersion` plus a locked active-profile read to reject stale PM updates. Missing state on a legacy profile safely means version zero; the first successful update creates the state row. Responsibility removal on an active Developer sets `active=false`; it never deletes the durable row or reassigns Bugs.

Quyền Developer bắt buộc workload dương và ít nhất một responsibility catalog active, không trùng scope. Handler lưu snapshot invitation trong một header request-owned `UserOnboardingDeveloperProfiles` cùng các responsibility rows, validate catalog active và dùng `DeveloperProfileAdministrationStates.administrationVersion` one-to-one cùng row lock trên active profile để chặn cập nhật cũ. Profile legacy chưa có state được hiểu an toàn là version 0; lần update thành công đầu tiên sẽ tạo state row. Bỏ responsibility của Developer active chỉ đặt `active=false`, không xóa durable row và không tự reassign Bug.

Every administration read and request action uses one shared guard: the JWT must contain exactly one PM business role plus `UserAdmin`, and it must still resolve to an active internal PM. The request action also validates the role allowlist, PM-only UserAdmin requests, duplicate open invitations, and private signing configuration. It persists the request and delivery atomically, then registers the shared post-commit email kick. A unique hash of the normalized target email closes the concurrent check-then-insert race; a constraint conflict becomes the safe `ONBOARDING_ALREADY_OPEN` response. Before that check, an expired `INVITED` request for the target is retained as `FAILED` with a safe expiry reason and releases its open-request key, allowing a clean re-invitation without deleting audit data.

In production, the signing key and onboarding base URL come only from the exact `idts-user-admin-invitation-config` user-provided service binding. The binding must occur exactly once and contain exactly `invitationSigningKey` and `invitationBaseUrl`; missing, duplicate, malformed, or broader credentials fail closed. Development and tests retain the existing `cds.env.idts.userAdmin` configuration path. The signing key is never stored in source, HANA, responses, logs, evidence, command arguments, or the browser.

The one-time `bootstrapCurrentIdentityLink` compatibility action linked the approved legacy PM and was then removed from the runtime contract. The durable runtime exposes no bootstrap target or identity-write endpoint; it only consumes the completed immutable link through the shared resolver. The append-only `BOOTSTRAP_LINK` audit remains the source of truth for that controlled migration.

Administration requester resolution now uses the shared immutable mapper. A matching external-identity hash wins even after email rename. If complete identity claims are present but the hash differs or is absent from all rows, authorization fails closed; email cannot bootstrap or cross into any account.

`searchOnboarding` uses the same active PM + UserAdmin guard, normalizes its bounded query, and performs a parameterized `contains` search. It returns only the UI summary allowlist and caps results at 200. Using an action keeps a searched email out of the OData request URL.

The verification action validates the signed one-time token, expiry, replay state, email match, external-identity collision, and legacy normalized-email collision. For TESTER/DEVELOPER it atomically persists the identity, records the inviter as approver, creates the durable provisioning operation/audit, and returns `PROVISION_QUEUED` at version 2. PM or any UserAdmin request remains `PENDING_APPROVAL` at version 1 for a second human confirmation. The Global User ID tuple and separate validated XSUAA `user_id` are never returned publicly. `ACTIVE` still requires broker readback. Retry/reconcile and role-change/revoke retain their fail-closed contracts.

Vietnamese: Moi API quan tri deu kiem tra JWT PM + UserAdmin va user noi bo van active/PM. TESTER/DEVELOPER tu queue sau verify vi PM da confirm luc gui moi; PM/UserAdmin can approve lan hai. `ACTIVE` van chi co sau broker readback. Retry/reconcile va role change/revoke giu nguyen fail-closed contract.

Provider request-contract recovery is deliberately one-shot. `retryAccessOperation` normally accepts only `RETRYABLE_FAILURE`; for the controlled migration it additionally accepts exactly `BLOCKED_MANUAL_REVIEW + PROVIDER_REQUEST_INVALID + attemptCount 4` when operation and request agree. The operation attempt count is exposed only in the PM summary so the UI mirrors this boundary. Requeue clears the old safe result and advances the optimistic version; another provider failure increments the attempt and cannot enter the compatibility path again. Reconcile remains restricted to `AMBIGUOUS_PROVIDER_OUTCOME`.

Vietnamese: Recovery cho request contract chi cho dung mot lan. `retryAccessOperation` binh thuong chi nhan `RETRYABLE_FAILURE`; trong migration co kiem soat no chi nhan them dung tuple `BLOCKED_MANUAL_REVIEW + PROVIDER_REQUEST_INVALID + attemptCount 4` khi operation va request khop nhau. Attempt count chi duoc dua vao summary cua PM de UI bam sat boundary. Neu provider fail them lan nua, attempt tang va khong the quay lai cua compatibility. Reconcile van chi danh cho `AMBIGUOUS_PROVIDER_OUTCOME`.

## Gate 3 access lifecycle / Vòng đời access Gate 3

`requestSuspend` is a local IDTS access action. After the existing PM + `UserAdmin` guard and version check, it locks the target user and rechecks the final-administrator invariant in the same transaction. It sets `Users.active=false`, revokes active `AuthSessions`, changes the request to `SUSPENDED`, increments the request version, and appends `REQUEST_SUSPEND`. It does not create a provider operation or call SAP APIs.

`requestReactivate` accepts only an inactive provisioned user whose request is `SUSPENDED`. It locks and version-checks the request, creates one `REACTIVATE` operation with the current desired fixed role/capability snapshot, increments the request version, and appends `REQUEST_REACTIVATE`. The local user remains inactive until the broker proves the provider readback. Revoked sessions are never restored automatically.

Vietnamese: `requestSuspend` la action khoa access local cua IDTS. Sau guard PM + `UserAdmin` va version check, handler lock user muc tieu va kiem tra lai invariant administrator cuoi cung trong cung transaction. Handler dat `Users.active=false`, revoke `AuthSessions` dang active, doi request thanh `SUSPENDED`, tang version va ghi `REQUEST_SUSPEND`. Action khong tao provider operation va khong goi SAP API.

`requestReactivate` chi nhan user da provisioned, dang inactive va request `SUSPENDED`. Handler lock/version-check request, tao mot operation `REACTIVATE` voi snapshot role/capability hien tai, tang version va ghi `REQUEST_REACTIVATE`. User local van inactive cho den khi broker chung minh readback provider. Session da revoke khong bao gio tu dong khoi phuc.
## Gate 3B existing identity request and verification / Request va verify identity hien huu Gate 3B

`requestExistingUserIdentityLink` is a PM + UserAdmin action for one selected active legacy TESTER/DEVELOPER. The server derives the role, snapshots the normalized legacy email, creates the signed invitation/delivery, and locks the target with `sha256(JSON.stringify(['LINK_EXISTING', targetID]))`. `verifySapIdentity` retains common token and immutable identity checks, re-reads the exact target, excludes only that exact target from duplicate scans, and queues version-2 `LINK_EXISTING` with `desiredUserAdmin=false`. Normal PROVISION continues through its existing branch.

`requestExistingUserIdentityLink` la action PM + UserAdmin cho mot legacy TESTER/DEVELOPER active duoc chon. Server tu suy ra role, snapshot email legacy normalized, tao invitation/delivery da ky va khoa target bang `sha256(JSON.stringify(['LINK_EXISTING', targetID]))`. `verifySapIdentity` giu cac check token va immutable identity chung, doc lai dung target, chi loai target do khoi duplicate scan, va queue version-2 `LINK_EXISTING` voi `desiredUserAdmin=false`. Nhanh PROVISION binh thuong van giu nguyen.

The handler returns the existing safe `OnboardingResult` allowlist. Internal target association, source email snapshot, identity claims, hashes, operation leases, and provider data never enter the public service result or audit summary.

Handler chi tra allowlist `OnboardingResult` an toan hien co. Association target noi bo, snapshot email nguon, identity claims, hash, lease operation va data provider khong bao gio vao public result hoac audit summary.
