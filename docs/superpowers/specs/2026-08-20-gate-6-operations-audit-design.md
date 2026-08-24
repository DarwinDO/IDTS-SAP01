# Gate 6 — Operations and Audit Usability Design

## Goal

Give PM + UserAdmin a safe operational view of invitation delivery, access provisioning, and administration audit without exposing infrastructure configuration, provider payloads, credentials, or raw identities.

## Read models

Create bounded read-only projections/actions for:

### Onboarding delivery

- Request ID.
- Safe masked/authorized recipient display.
- Status.
- Attempt count.
- Next/last attempt time.
- Sent time.
- Safe error code/summary.

Never expose email bodies, provider message IDs, lock tokens, raw recipient data outside the authorized request context, or provider responses.

### Access operations

- Operation type/state.
- Attempt count.
- Created/started/completed time.
- Safe result code/summary.
- Requested-by display.
- Target-user display.
- Whether Retry or Reconcile is currently allowed.

Never expose idempotency keys, lease tokens/hashes, provider correlation hashes, external IDs, or desired provider payloads.

### Audit events

- Action.
- Result.
- From/to state.
- Actor and target display.
- Timestamp.
- Safe details summary.
- Short non-reversible correlation fingerprint generated server-side for support grouping.

Private before/after identity hashes remain excluded.

## System readiness summary

Show only cached/derived operational facts from persisted safe state:

- Email delivery available/unavailable/unknown.
- Provisioning broker recent-success/stale/unknown.
- Last successful reconciliation time.

Freshness uses explicit persisted outcome timestamps rather than managed-row metadata: delivery `sentAt` for success, delivery `lastAttemptAt` for failure, and access-operation `completedAt` for success.

The page does not call private health endpoints, read bindings, or inspect credentials on each load.

## Bounded actions

Reuse existing access-operation Retry/Reconcile actions and their state guards. Add `retryOnboardingDelivery` only for retry-eligible failed delivery rows. Every action uses optimistic version/readback, server authorization, idempotency, fixed retry ceilings, and append-only audit. No UI action accepts endpoint, provider, recipient, token, Role Collection, or arbitrary operation type.

## UI design

Operations contains Delivery and Provisioning subtabs. Audit is a separate tab. Both use server pagination, date/status filters, safe detail dialogs, and explicit empty/loading/error states. Technical codes map to friendly labels while safe codes remain available in details for support.

## Authorization and privacy

- PM + UserAdmin only.
- Exact-one PM business role.
- Backend-filtered fields and rows.
- No unrestricted audit export in MVP.
- No raw exception/log endpoint.
- Search and pagination are bounded to prevent enumeration and oversized responses.

## Verification

- Delivery and operation status/filter/pagination.
- Retry eligibility and retry ceiling.
- Ambiguous outcome exposes Reconcile but not blind Retry.
- Permanent failure exposes neither action.
- Negative role matrix.
- Audit append-only and immutable through service.
- Raw body/token/credential/hash fields absent from EDMX/API snapshots/UI/logs.
- Reload preserves state and filters.
- Provider outage does not break read-only administration pages.

## Rollout

Deploy read-only views first. Enable bounded actions only after source review and controlled failure fixtures. No broker/provider mutation is required to accept the read-only portion. Manual acceptance uses sanitized operation fixtures and does not trigger a real provider failure intentionally.

## Out of scope

No BTP Cockpit clone, log explorer, credential rotation, service restart, CF/HANA management, arbitrary audit export, or raw provider debugging console.
