# UA Track A2 Provider Recovery Broker Artifact

Date: 2026-08-19

## Exact source and artifact

- Source commit: `e2fe21693c398c46e4a62dc1bd5542b59010827b`.
- Artifact: `mta_archives/idts-user-access-broker-track-a2-e2fe216.zip` (ignored generated output, not committed).
- SHA-256: `3161D8F9CCE1BA9847C899A353A1C08F38E782700E874C140712E1FF2F358CC0`.
- Size: `15,507` bytes.
- Payload: exactly 13 regular broker files, source-export parity mismatch count `0`, no `node_modules`, unsafe path or unexpected file.
- Node engine: exact `22.x`; lock contains zero non-root packages.
- Isolated `npm ci --omit=dev --ignore-scripts`: PASS.
- `npm audit --omit=dev`: zero vulnerabilities.
- Credential/private-key/bearer/email/live-CF-domain scan: zero hits.

## Live read-only baseline

- Main runtime: `DEMO READY`; CAP/AppRouter `1/1`, health/readiness `200`, anonymous protected API `401`, Web `200`.
- Broker: `STARTED`, one process/one desired instance, zero routes.
- Broker bindings: exactly `idts-user-access-broker-api-access` and `idts-user-access-broker-auth`.
- Current droplet fingerprint: `176c63dc7816`.

## Rollout correction

The historical broker MTA descriptor intentionally sets `IDTS_ACCESS_BROKER_ENABLED=false`. Redeploying it could disable the currently enabled broker or disturb its private CAP URL. The safe Track A rollout therefore uses the checksum-reviewed source ZIP through Cloud Foundry V3 package/stage/set-droplet against the existing exact broker app. This preserves current env, routes and bindings. Rollback resets the exact previous droplet after ownership/readback checks; it does not redeploy the historical disabled descriptor.

No platform mutation was performed while building or reviewing this artifact.

## Track A3 deployment

- Exact package upload count: `1`.
- Exact stage attempt count: `1`.
- Exact set-droplet count: `1`.
- Exact broker restart count: `1`.
- Rollback count: `0`.
- Previous droplet fingerprint: `176c63dc7816`.
- Current droplet fingerprint: `bef1e1e442f0`.
- Post-state: broker `STARTED` and `1/1`, zero routes, exactly two bindings, latest sanitized poll `IDLE`.
- Main state: CAP bindings `7`, AppRouter bindings `3`; `npm run btp:demo:check` returned `DEMO READY`.
- No broker env, route, binding, XSUAA, HANA, user or Role Collection mutation occurred in the code rollout.
- Next checkpoint: DonHV must press Reconcile exactly once on the controlled TESTER row. No automated/direct PATCH is permitted.

## Controlled retry result

- DonHV pressed Retry exactly once from `RETRYABLE_FAILURE`.
- Broker result: `BLOCKED_MANUAL_REVIEW`; subsequent polls returned `IDLE`.
- Persisted safe summary: provider rejected the access change (`PROVIDER_DENIED`, HTTP 401/403 class).
- BTP readback: zero Role Collections; `IDTS_TESTER=false`; no conflicting IDTS role.
- Credential metadata: read-write (`read-only=false`), full-access client class, client-credentials token, all seven OpenAPI scopes including `xs_user.write` and `xs_authorization.write`.
- Token, target user and `IDTS_TESTER` group all belong to the same zone. API user readback reports active and verified. API base URL is root and is not altered by the client's relative path construction.
- Conclusion: OAuth/token/zone/identity/group/read-contract hypotheses are closed. SAP rejected the membership PATCH at the resource-authorization/policy layer. No further PATCH is permitted without a new architecture/credential decision or SAP-supported explanation.

## Provider-denial diagnostic source gate

- The broker now distinguishes an HTTP `401` as `PROVIDER_AUTHENTICATION_FAILED` and an HTTP `403` as `PROVIDER_FORBIDDEN`.
- For HTTP `403`, the client reads only the schema-defined `scope` field and recognizes it only when it exactly matches one of the seven reviewed SAP API scopes. That case becomes `PROVIDER_SCOPE_MISSING`; arbitrary scope text and every other provider-body field are discarded.
- All three results are non-retryable. No token refresh, provider PATCH, credential rotation, deployment or BTP mutation is part of this source gate.
- TDD evidence: the new runtime assertion failed against the old combined `PROVIDER_DENIED` mapping, passed after the bounded change, failed again when that mapping was temporarily restored, and passed again after the fix was restored.

## Provider-denial diagnostic broker rollout

- Source commit: `0781f3db536faa6c36941ed961c6c7131b28ea78`.
- Broker-only ZIP: `mta_archives/idts-user-access-broker-provider-diagnostics-0781f3d.zip`.
- Exact ZIP SHA-256: `B21AFF2816E37BBA1FDA48C38C3970494B7DBDEA177F58B01C84DAB363CA9215`; size `16,090` bytes.
- Payload: exactly 13 regular broker files, normalized Git-blob mismatch `0`, Node engine `22.x`, no dependencies, `npm ci --omit=dev --ignore-scripts` PASS and production audit `0` vulnerabilities.
- ZIP reproducibility limitation: `git archive HEAD:broker` archives a tree object and embeds run-time ZIP timestamps, so a second archive had different container bytes. The first exact hash above is the sole rollout authority; file-list and normalized Git-blob parity are the source-content proof.
- Initial readiness was blocked only by sleeping HANA (`/ready` HTTP `503`). The approved recovery workflow issued one supported HANA start request and one main-CAP restart after readiness; independent `npm run btp:demo:check` returned `DEMO READY`. No DB/HDI deploy, schema, seed or business-data mutation ran.
- Pre-state broker droplet fingerprint: `bef1e1e442f0`. Post-state fingerprint: `aecc592fcbd8`.
- Mutations: create package `1`, stage package `1`, set droplet `1`, broker restart `1`; rollback `0`.
- The first deployment wrapper stopped before `set-droplet`: it read build ownership from the absent `relationships.package` field while this CF V3 build exposes the package at top-level `package.guid`, and the build was initially still `STAGING`. Readback proved exactly one owned build later reached `STAGED`; no second package or stage was run. The corrective continuation used that same build for the single set/restart.
- Final topology: broker `STARTED 1/1`, routes `0`, bindings exactly `idts-user-access-broker-api-access` and `idts-user-access-broker-auth`; main CAP/AppRouter binding counts remain `7/3`; final demo check is `DEMO READY`.
- Controlled provider attempt count after this rollout: `0`. Windows Computer Use stopped because it could not determine the selected browser URL with enough confidence; no cookie, JWT or alternate direct CAP mutation was used. DonHV must open the existing User Administration tab and press the latest controlled TESTER row's Reconcile/Retry action exactly once before the result can be classified.

## Legacy diagnostic retry source gate

- Browser evidence showed Reconcile for the legacy `PROVIDER_DENIED` row, but CAP rejected the action before queue because reconciliation is correctly restricted to `AMBIGUOUS_PROVIDER_OUTCOME`. Reload did not change the durable state; provider attempt count remained zero.
- TDD fix: `retryAccessOperation` accepts its normal `RETRYABLE_FAILURE` boundary plus exactly one compatibility tuple where both operation and request are `BLOCKED_MANUAL_REVIEW` and both safe-code fields equal `PROVIDER_DENIED`.
- After the compatibility requeue, the old safe fields are cleared and the optimistic version advances. New diagnostic results `PROVIDER_AUTHENTICATION_FAILED`, `PROVIDER_SCOPE_MISSING` and `PROVIDER_FORBIDDEN` remain non-retryable and cannot use the legacy path.
- UI Retry mirrors the normal-or-legacy boundary; UI Reconcile now requires `AMBIGUOUS_PROVIDER_OUTCOME`. CAP repeats the checks for direct requests.
- Source verification: onboarding, User Administration UI and provisioning suites PASS; CAP EDMX compile PASS with only the unchanged attachment vocabulary warning; UI test/lint/build PASS at version `1.0.4`; manifest validation and focused UI5 MCP lint PASS; secret, agent-rule, QA-depth and diff checks PASS.

## Legacy diagnostic action rollout and runtime result

- Source commit: `f273c57255af96d07c8c362e4532300feb4e1c34`.
- Selective CAP ZIP: `mta_archives/idts-ua-legacy-diagnostic-cap-f273c57.zip`, SHA-256 `16120471E6D019391310854C8298D1CCF10D0B728FDA14932667144F3B218567`, size `316,935` bytes. It preserves all 93 other files from the accepted R9c payload and changes only `srv/user-admin.js`; Node is `22.x`, HDI artifact count is zero, and production audit High/Critical is zero.
- CAP mutations: create package `1`, stage `1`, set droplet `1`, restart `1`, rollback `0`. CAP remained `1/1` with seven bindings and one route; droplet fingerprint changed from `40a14158660f` to `34c35f88896c`.
- The first orchestration wrapper used PowerShell's reserved automatic `$args` variable as a function parameter. It therefore invoked bare `cf`, printed help and exited zero; package readback proved no package was created. The corrected wrapper renamed the parameter to `CommandArgs`, re-froze package state and performed the sole real package upload. This was a tooling issue, not a Cloud Foundry mutation ambiguity.
- UI content-only MTAR: `mta_archives/idts-user-admin-ui-legacy-diagnostic-f273c57.mtar`, SHA-256 `79D930D4F1444513DFD2683B778E909C36A96A6D282CF18AFA19D2CF09A341E0`. Its static payload version is `1.0.4`; it contains the exact `PROVIDER_DENIED` Retry and `AMBIGUOUS_PROVIDER_OUTCOME` Reconcile guards, no CAP/DB/AppRouter artifact, and no unsafe archive path.
- Exact UI rollback MTAR was rebuilt from parent commit `5a3073f2f10eaec9ea002f2dcbe2acd033b6860d`: SHA-256 `E53E179650D14000B2A10B21E4074C374A8745F466745A5E11D4EA1E703AA950`, version `1.0.3`. The historical `0.1.0` MTAR was not accepted as rollback authority.
- UI deployment: one exact content-only `cf deploy`, exit zero, active MTA operations zero. Final `npm run btp:demo:check` returned `DEMO READY`.
- Browser runtime readback proved version `1.0.4`. The current TESTER row is now `BLOCKED_MANUAL_REVIEW + PROVIDER_REQUEST_INVALID`; Retry and Reconcile are both hidden. This is the expected fail-closed behavior. No provider PATCH was triggered during this CAP/UI rollout or browser readback.
- The SAP Platform OpenAPI still documents `PATCH /Groups/{Id}` with a `ScimGroupPatch.members[]` entry containing `origin`, `type=USER`, `value`, and `operation=create|delete`, which matches the broker payload shape. HTTP 400 therefore remains an unresolved provider-contract/tenant-behavior blocker. Do not retry, change the role manually, or guess another payload without a separately reviewed diagnostic.

## HTTP 400 request-contract remediation source gate

- The same OpenAPI describes HTTP 400 as a malformed body or bad `If-Match` and exposes `ScimGroup.meta.version` as an integer. The earlier broker sent no `If-Match` and only the `members` fragment.
- The bounded candidate now reads the exact group resource after exact-name list resolution, verifies exact ID/display name and non-negative integer version, then PATCHes `{ id, displayName, members }` with that version in `If-Match`.
- The API client accepts no general header map: only an exact integer `If-Match` on PATCH is allowed. Invalid/extra headers fail before token acquisition and network access.
- Contract identifier advances from `SAP_USER_MANAGEMENT_OPENAPI_69DC872E_V1` to `..._V2`; the underlying reviewed OpenAPI hash remains unchanged.
- This section records source-only remediation. It does not authorize broker deployment, operation requeue or a new provider PATCH.

## Versioned-patch broker rollout and one-shot retry preparation

- Broker source commit: `4b86ea3efcac25c54c47f4d977ffbb00c9fd44c9`.
- Broker ZIP: `mta_archives/idts-user-access-broker-ifmatch-4b86ea3.zip`, SHA-256 `66B7A379543393BF3CF0EB161696D4CBBB846980361D69F3E8E09840E86C4EEC`, size `16,385` bytes. It contains 13 tracked regular files plus the ZIP directory entry, source mismatch zero, Node `22.x`, unsafe-path zero and production audit zero.
- Broker rollout: package `1`, stage `1`, set droplet `1`, restart `1`, rollback `0`. Broker remains `1/1`, zero routes and two bindings; droplet fingerprint changed from `aecc592fcbd8` to `9c7c22baf4c4`. Main binding counts remained `7/3` and demo readiness was `DEMO READY` before rollout.
- One read-only main-CAP task queried only matching operation count and `attemptCount`; it performed zero provider calls and encoded the sanitized result in its exit status. Readback proved exactly one matching row at attempt `4`.
- The first task-result wrapper used JavaScript-style `String(...)` in PowerShell and then assumed the words `exit status`; both readback parsers failed after the single task had already completed. The task was not rerun. Sanitized numeric readback isolated the task-name date from the final exit code and established attempt `4`.
- Source candidate exposes only `latestOperationAttemptCount` in the PM summary and allows the compatibility Retry only for exact attempt `4`. It does not change the HANA schema. If the next broker claim returns another HTTP 400, attempt `5` cannot be retried through this path.
