# User Administration M3A Exact-Diff Design

## Outcome

M3A turns the existing source candidate into a checksum-reviewable deployment package without changing SAP BTP, HANA, XSUAA, users, roles, or broker runtime configuration. It proves what a later M3B mutation would change and stops before that mutation.

## Baseline

- Feature branch: `feature/wp7-user-onboarding-donhv`.
- Approved M3A starting HEAD: `ba34f12d4dcef29e0de891096c8984e0b3eac620`.
- `origin/dev` and merge base: `0b694c4284e6a6b838ba3a2511d755bd01265a73`.
- M2 broker artifact: `44a3d3ce6e94ccc77072287cc1b12ea0604735c8dedd019e28d730ff67f6b668`.
- Broker live boundary: started, no route, `IDTS_ACCESS_BROKER_ENABLED=false` in the checksum-reviewed artifact.

## Architecture Boundary

M3A reviews four independently reversible units:

1. **Additive persistence**: nullable external identity columns on legacy `Users`, onboarding/delivery/operation/audit entities, and uniqueness constraints. No seed, backfill, delete, or data rewrite is allowed.
2. **CAP authority and orchestration**: `UserAdministrationService` requires an authenticated user and every administration operation additionally enforces exactly one PM platform role, `UserAdmin`, and an active matching internal PM. CAP owns state, versioning, audit, session suspension, retry and reconciliation; it does not hold the SAP Authorization API credential.
3. **XSUAA capability overlay**: `UserAdmin` is a scope/template and `IDTS_USER_ADMIN` Role Collection. It is not a fourth business role. `ProvisioningBroker` is a technical scope granted only to the dedicated broker application.
4. **SAPUI5 administration surface**: one responsive, role-specific UI calling CAP only. It shows queued/provisioning/retry/manual-review/revoked states and never exposes raw identity/provider/credential details.

## State and Security Contract

- Business role allowlist is exactly `PM`, `TESTER`, `DEVELOPER`.
- `UserAdmin=true` is valid only with `PM`.
- PM without `UserAdmin`, Tester, Developer, multi-business-role tokens and direct unauthorized OData requests are denied server-side.
- `ACTIVE` is written only after broker read-after-write proves the requested Role Collections.
- Retry is allowed only for `RETRYABLE_FAILURE`.
- Reconciliation is allowed only for `BLOCKED_MANUAL_REVIEW` with `safeResultCode=AMBIGUOUS_PROVIDER_OUTCOME`.
- Role change and revoke disable local access and revoke sessions before external reconciliation.
- Provider errors store only safe code, safe summary and correlation hash. Tokens, credentials, raw provider bodies and raw immutable identifiers are forbidden from logs and public responses.

## Exact M3A Work

M3A may:

- fix local validation defects found by approved CAP/UI5 tooling;
- run CAP compile and focused programmatic tests;
- build the User Administration UI locally;
- generate clean baseline/candidate CAP builds and compare generated HANA artifacts offline;
- produce checksummed candidate descriptors, source manifests, verification evidence and rollback design;
- commit and push source/evidence to the feature branch.

M3A must not:

- run HDI simulate/make or any DB deployer;
- update XSUAA, Role Collections, role assignments, trust, IAS or IPS;
- deploy/restart/restage CAP, AppRouter, UI or broker;
- set broker environment variables or execute a provider operation;
- create/invite/modify/revoke a real user;
- mutate Jira or Drive.

## Validation and Stop Conditions

Required local evidence:

- CAP EDMX and HANA compile pass.
- Focused onboarding, immutable identity, access contract, broker and UI tests pass.
- UI5 manifest validation passes; UI5 linter has zero errors.
- Generated HANA delta contains only approved additive artifacts. Any drop, delete, truncate, table-data seed, unrelated entity, destructive conversion or full feature-unrelated artifact is a hard stop.
- XSUAA semantic diff contains only the reviewed `UserAdmin`, `ProvisioningBroker` and `IDTS_USER_ADMIN` additions.
- Secret scan, agent rules, QA-depth self-test and `git diff --check` pass.
- Every candidate artifact has SHA-256 evidence and is labeled `LOCAL CANDIDATE / NOT DEPLOYMENT AUTHORIZED`.

## Later Gates

- **M3B**: separate exact approval for HDI simulation/migration and full XSUAA descriptor update/rollback.
- **M3C**: separate exact approval for selective CAP/UI deployment and authorization matrix.
- **M3D**: separate exact approval to configure/enable the broker and run one controlled non-member identity.
