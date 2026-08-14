# IDTS User Access Provisioning Broker

This source-only module is the separate trust boundary for SAP BTP Role Collection changes. The CAP business runtime records approved, versioned operations and exposes an internal XSUAA-protected lease/completion contract. The broker reads one operation, applies only the allowlisted IDTS Role Collections, verifies provider state, and returns a sanitized semantic result.

The broker must be deployed as a separate application. Only that application may receive a least-privilege SAP Authorization and Trust Management API credential. Never bind or copy that credential to the CAP service, AppRouter, UI, HANA, Job Scheduler, source repository, logs, test fixtures, Jira, or evidence.

## Source-only runtime candidate

The broker runtime is now packaged as its own no-route Cloud Foundry module. It uses two bindings that are not available to CAP, AppRouter, UI, HANA, Job Scheduler, or other product modules:

- `idts-user-access-broker-auth`: dedicated XSUAA client for the single technical `ProvisioningBroker` authority;
- `idts-user-access-broker-api-access`: future existing user-provided service with exactly `apiUrl`, `tokenUrl`, `clientId`, and `clientSecret` credentials.

`IDTS_ACCESS_BROKER_ENABLED` defaults to `false`. Disabled mode does not parse bindings, obtain OAuth tokens, poll CAP, or call SAP. Token and HTTP clients use bounded timeouts, fixed paths/allowlists at their caller boundary, in-memory token caching, and sanitized errors.

The official SAP Business Accelerator Hub `Authorization` OpenAPI 1.0.0 was reviewed with SHA-256 `051ef4260e84364a1489b4b788e38c81eea0095e97cbdf62bd8534b546603c0c`. Its 34 operations manage XSUAA applications, scopes, roles, role templates, role collections, and identity-provider attribute mappings; it does **not** assign Role Collections to shadow users.

The separate official `User Management (SCIM)` OpenAPI 1.0.0 was reviewed with SHA-256 `69dc872e32ce2c4bcec77466c736f81e0a99961b333eea9f10aa23b9705c2cc8`. The source candidate implements only its fixed `GET /Users/{Id}`, paginated `GET /Groups`, and `PATCH /Groups/{Id}` membership shapes. It never creates/deletes users or Role Collections. `payload.user_uuid` remains the immutable IDTS authority, while the separately validated XSUAA `payload.user_id` selects the exact SCIM shadow user; email is never used as the mutation key. Missing/mismatched user ID, origin, active state, group, or readback fails closed.

The adapter is still disabled by default and has not been called against live SAP BTP. A later gate must review and create the broker-only API credential, prove the live `payload.user_id` to SCIM `/Users/{Id}` readback, deploy the additive HANA fields, and run positive/negative reconciliation. No source-only test proves live BTP assignment.

Official references:

- [Accessing Administration Using APIs](https://help.sap.com/docs/btp/sap-business-technology-platform/accessing-administration-using-apis-of-sap-authorization-and-trust-management-service)
- [User Management (SCIM) API](https://api.sap.com/api/PlatformAPI/overview)
- [Authorization API](https://api.sap.com/api/AuthorizationAPI/overview)
- [Rate Limiting](https://help.sap.com/docs/authorization-and-trust-management-service/authorization-and-trust-management/rate-limiting)
- [Call an API](https://help.sap.com/docs/btp/sap-business-technology-platform/call-api)
- [Application Security Descriptor Configuration Syntax](https://help.sap.com/docs/btp/sap-business-technology-platform/application-security-descriptor-configuration-syntax)
