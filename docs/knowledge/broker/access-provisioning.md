# Knowledge: IDTS user access broker source candidate

The user access broker is a separate trust boundary from the CAP business runtime. CAP owns approval, optimistic versioning, fail-closed local suspension, the durable operation journal, and safe audit events. The broker alone may later receive a least-privilege SAP Authorization and Trust Management API credential. It accepts no client-selected subaccount, identity provider, endpoint, or Role Collection name.

The fixed mapping is PM to `IDTS_PM`, TESTER to `IDTS_TESTER`, DEVELOPER to `IDTS_DEVELOPER`, plus `IDTS_USER_ADMIN` only for selected PM access. Processing is read-before-write, bounded write, then read-after-write. Timeout or ambiguous provider outcomes are reconciled before retry; raw provider errors are never returned or logged.

The source candidate now also contains a separate no-route broker process, broker-only service-binding loader, bounded OAuth client, fixed CAP claim/completion client, authenticated SAP API transport, and dedicated-XSUAA MTA contract. The technical `ProvisioningBroker` scope is not a human role template. It is grantable only to the exact broker XSUAA application; CAP still validates that scope in native XSUAA runtime.

The live credential is not copied into source. A later gate must create one broker-only user-provided service with the normalized fields `apiUrl`, `tokenUrl`, `clientId`, and `clientSecret`, then bind it only to the broker. The CAP service, AppRouter, UI, database, scheduler, and external-service bindings never receive that service.

The runtime remains disabled by default. The reviewed official `Authorization` OpenAPI has 34 operations for applications, scopes, roles, role templates, Role Collections, and identity-provider attribute mappings, but no operation that assigns a Role Collection to a shadow user. The separate reviewed User Management (SCIM) OpenAPI provides the exact shadow-user and group-membership operations. The broker therefore uses only `GET /Users/{Id}`, bounded pagination over `GET /Groups`, and `PATCH /Groups/{Id}` with the documented `USER` member `create`/`delete` operation. It does not create/delete a shadow user or Role Collection.

Identity has two deliberately separate identifiers. `payload.user_uuid` is the Global User ID used in the IDTS immutable authority hash. SAP documents that the XSUAA `userId` can differ from `user_uuid`; the SCIM API targets its own user `id`. The onboarding verification therefore also captures the already-validated XSUAA `payload.user_id` as `identityPlatformUserId`. The broker requires exact SCIM ID, `sap.default` origin, and active-state readback before any membership patch. Email is only invitation/display data and is never the SCIM mutation authority.

This remains a source boundary, not live provisioning evidence. A later credential/read-only reconciliation gate must prove the current landscape returns the expected SCIM record before the disabled adapter can be enabled.

`mta.user-access-broker-source-only.yaml` is intentionally a one-module, no-route, zero-resource packaging descriptor with `IDTS_ACCESS_BROKER_ENABLED=false`. It proves that broker source can be packaged independently; it is explicitly not deployment-authorized and cannot provision without separately reviewed bindings and a verified mutation contract.
