# Knowledge: IDTS user access broker source candidate

## Provider failure classification

The broker preserves only safe semantic provider codes. HTTP 400, authorization denial, missing resources, conflicts, and invalid responses require correction or reconciliation and are not retryable. HTTP 429, provider 5xx, timeout, and network failure are retryable only through the CAP operation journal. The HTTP client never retries a PATCH by itself and never exposes a raw provider response.

Vietnamese: Broker chỉ giữ safe code có ý nghĩa nghiệp vụ. HTTP 400, bị từ chối quyền, thiếu resource, conflict và response sai cần sửa hoặc reconcile và không được retry. HTTP 429, provider 5xx, timeout và network failure chỉ được retry thông qua operation journal của CAP. HTTP client không tự retry PATCH và không expose raw provider response.

The user access broker is a separate trust boundary from the CAP business runtime. CAP owns approval, optimistic versioning, fail-closed local suspension, the durable operation journal, and safe audit events. The broker alone may later receive a least-privilege SAP Authorization and Trust Management API credential. It accepts no client-selected subaccount, identity provider, endpoint, or Role Collection name.

The fixed mapping is PM to `IDTS_PM`, TESTER to `IDTS_TESTER`, DEVELOPER to `IDTS_DEVELOPER`, plus `IDTS_USER_ADMIN` only for selected PM access. Processing is read-before-write, bounded write, then read-after-write. Timeout or ambiguous provider outcomes are reconciled before retry; raw provider errors are never returned or logged.

The source candidate now also contains a separate no-route broker process, broker-only service-binding loader, bounded OAuth client, fixed CAP claim/completion client, authenticated SAP API transport, and dedicated-XSUAA MTA contract. The technical `ProvisioningBroker` scope is not a human role template. It is grantable only to the exact broker XSUAA application; CAP still validates that scope in native XSUAA runtime.

The live credential is not copied into source. A later gate must create one broker-only user-provided service with the normalized fields `apiUrl`, `tokenUrl`, `clientId`, and `clientSecret`, then bind it only to the broker. The CAP service, AppRouter, UI, database, scheduler, and external-service bindings never receive that service.

The runtime remains disabled by default. The reviewed official `Authorization` OpenAPI has 34 operations for applications, scopes, roles, role templates, Role Collections, and identity-provider attribute mappings, but no operation that assigns a Role Collection to a shadow user. The separate reviewed User Management (SCIM) OpenAPI provides the exact shadow-user and group-membership operations. The broker therefore uses only `GET /Users/{Id}`, bounded pagination over `GET /Groups`, and `PATCH /Groups/{Id}` with the documented `USER` member `create`/`delete` operation. It does not create/delete a shadow user or Role Collection.

Identity has two deliberately separate identifiers. `payload.user_uuid` is the Global User ID used in the IDTS immutable authority hash. SAP documents that the XSUAA `userId` can differ from `user_uuid`; the SCIM API targets its own user `id`. The onboarding verification therefore also captures the already-validated XSUAA `payload.user_id` as `identityPlatformUserId`. The broker requires exact SCIM ID, `sap.default` origin, and active-state readback before any membership patch. Email is only invitation/display data and is never the SCIM mutation authority.

This remains a source boundary, not live provisioning evidence. A later credential/read-only reconciliation gate must prove the current landscape returns the expected SCIM record before the disabled adapter can be enabled.

`mta.user-access-broker-source-only.yaml` is intentionally a one-module, no-route, zero-resource packaging descriptor with `IDTS_ACCESS_BROKER_ENABLED=false`. It proves that broker source can be packaged independently; it is explicitly not deployment-authorized and cannot provision without separately reviewed bindings and a verified mutation contract.

The ordinary `mta.yaml` deliberately excludes the privileged broker and both broker-only service dependencies. `mta.user-access-broker-candidate.yaml` is the separate pre-mutation topology candidate; it stays disabled and is not deployment-authorized. This separation prevents an ordinary IDTS release from requiring or receiving the BTP administration credential.

`mta.user-access-broker-r3b.yaml` is the controlled deployment descriptor for the separately approved broker gate. It keeps the same one-module, no-route, disabled-runtime boundary while binding only the dedicated broker XSUAA and the exact existing broker UPS. Deploying this descriptor proves isolated staging, binding, startup, health and rollback; it does not activate polling, call CAP or SAP APIs, or prove live user provisioning.

The cross-application client-credentials authority must reference the live granting XSUAA service, not reconstruct its `xsappname` from Cloud Foundry org/space labels. The broker descriptors therefore request exactly `$XSSERVICENAME(idts-sap01-auth).ProvisioningBroker`, while the main descriptor keeps `grant-as-authority-to-apps` restricted to `$XSAPPNAME(application,idts-user-access-broker)`. After changing an authority, update the requesting XSUAA instance and rebind its consuming app so the binding OAuth client receives the new scope. Runtime evidence must verify scope/audience as Booleans only; never log a JWT or claim value.

As of the controlled M3D gate, the isolated no-route broker is enabled and its empty-queue poll returns `IDLE`. This proves broker-to-CAP technical authorization only. It does not prove a SAP user/Role Collection write: no real provider operation may be claimed until one approved non-member test identity completes assign/readback/revoke and cleanup.

## Gate 3 reactivation contract / Contract reactivate Gate 3

For `REACTIVATE`, the adapter performs exactly one `listRoleCollections` read. It compares the fixed desired IDTS set (`IDTS_TESTER`, `IDTS_DEVELOPER`, or PM plus the explicit `IDTS_USER_ADMIN` overlay) and allows unrelated non-IDTS collections to remain. A matching read returns `changed: []`; the adapter never calls `assignRoleCollection` or `unassignRoleCollection`. Missing, extra, or wrong IDTS collections, provider timeout, identity mismatch, and malformed readback fail closed without exposing raw provider data.

Vietnamese: Với `REACTIVATE`, adapter chi goi `listRoleCollections` mot lan. Adapter so sanh exact tap IDTS mong muon (`IDTS_TESTER`, `IDTS_DEVELOPER`, hoac PM kem overlay `IDTS_USER_ADMIN`) va cho phep collection ngoai IDTS ton tai. Readback khop tra `changed: []`; adapter khong goi `assignRoleCollection` hay `unassignRoleCollection`. Thieu, thua hoac sai IDTS collection, timeout, identity mismatch va readback sai deu fail closed, khong expose raw provider data.
## Gate 3B `LINK_EXISTING` readback / Readback `LINK_EXISTING` Gate 3B

`executeAccessChange` accepts `LINK_EXISTING` and reuses the exact desired IDTS Role Collection predicate used by `REACTIVATE`. It permits only `provider.listRoleCollections`; the result is `{ action: 'LINK_EXISTING', changed: [], finalRoleCollections: [...] }`. Missing, extra, conflicting business, invalid UserAdmin overlay, or duplicate collection entries fail closed with a safe mismatch code. No assign, unassign, PATCH, compensation, provider body, endpoint, or identity detail is emitted.

`executeAccessChange` nhan `LINK_EXISTING` va dung lai predicate Role Collection exact cua `REACTIVATE`. Action chi duoc phep goi `provider.listRoleCollections`; ket qua la `{ action: 'LINK_EXISTING', changed: [], finalRoleCollections: [...] }`. Collection thieu, thua, business conflict, UserAdmin overlay sai hoac collection trung lap deu fail closed voi safe mismatch code. Khong co assign, unassign, PATCH, compensation, provider body, endpoint hoac chi tiet identity nao duoc phat ra.

**Important source anchor**: `broker/lib/access-provisioning.js:24` `executeAccessChange(...)` controls the provider zero-write boundary. Check it with `broker/worker.js`, `srv/provisioning-broker.js`, and the provider call-count fixture.
