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
