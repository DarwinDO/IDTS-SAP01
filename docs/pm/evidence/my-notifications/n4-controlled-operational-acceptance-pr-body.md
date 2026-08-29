## Summary

Publish the final N4 operational evidence after the additive schema/CAP/UI rollout and no-replay cutoff activation. This documentation-only PR records controlled SAP Job Scheduler/Brevo delivery, exact source-key replay protection, HANA concurrency, the wrong-droplet incident with guarded rollback, successful zero-replay activation, the active hourly schedule and the live scheduler plan limitation. It changes no product source, schema, dependency, lockfile, deployment descriptor or runtime configuration.

## Positive Evidence

- `docs/pm/evidence/my-notifications/n4-controlled-operational-acceptance-20260829.md` records Job Scheduler run `57a2723e-5989-46e0-a9b6-7bcd6fb68232`: HTTP `200`, `sent=1`, `failed=0`, `skipped=0`.
- HANA readback recorded delivery `SENT`, attempt count `1`, a sent timestamp and provider message ID, one unread inbox row and zero remaining pending Bug deliveries.
- Brevo recorded one request and one delivered event for the approved `donhvse` acceptance recipient with the same message ID.
- Final `npm run btp:demo:check` returned `DEMO READY`.
- Cutoff run `a9b908bf-541e-48f3-bfb7-7672ba1178ba` returned HTTP `200`, 11 candidates, zero historical creations and 16 skips; HANA poststate remained zero historical scheduled sources and zero pending/failed deliveries.
- Job `3368450` and hourly schedule `0282b016-79d1-450b-a2df-b302a76f9245` are active.

## Negative Evidence

- The first controlled event attempt used the nonexistent `STATUS_CHANGE` catalog code and failed closed before the transaction.
- Four bounded CAP diagnostics with incorrect model access produced no accepted mutation and are recorded as harness failures rather than product failures.
- The live Job Scheduler `free` plan rejected a five-minute cadence explicitly; no partial five-minute job was created.
- The first activation hit the old assigned droplet and created 24 source/inbox plus six unsent attempt-zero deliveries. Discovery was stopped before worker/provider execution; guarded rollback deleted exactly those rows. No provider email was sent.

## Edge/Boundary Evidence

- Same-key replay before and after delivery retained one Notification, one inbox row, one delivery and provider attempt count `1`.
- Two independent CF tasks using the same concurrency source key returned the same Notification ID and produced no email delivery.
- Guarded cleanup first proved exactly one concurrency source, one inbox row and zero deliveries, then removed only those test rows and read back source count zero.
- Temporary one-time schedules were removed; the approved hourly discovery schedule is active behind private cutoff `2026-08-29T02:43:41.368Z`.
- Codex Security exact-diff scan `26e165a9-e55d-4fbb-82c3-7af0d1f5383a` completed with zero findings. The earlier artifact-writing scan failure is retained only as tooling evidence; TAC was unavailable.

## Roles/Authorization

The controlled recipient was read back as an active internal `TESTER`; the selected Bug existed in `IN_PROGRESS`. The acceptance used a privileged CF task and the existing protected OutboxProcessor Job Scheduler path. No Tester, Developer, PM, User Administration role or identity assignment was changed.

## Persistence/Reload

HANA readback was performed before delivery, after the scheduler run and after exact source replay. It proved `PENDING -> SENT`, attempt count `0 -> 1`, provider metadata persistence, one retained unread inbox entry, and no duplicate source/delivery. The concurrency-only rows were deleted under exact source/recipient/Bug/message/count guards; the provider acceptance record remains retained.

## UI/UX Review

The preceding live rollout evidence already proves the native My Notifications popover, filters, badge and empty state in Edge. This PR changes documentation only and does not change UI assets or runtime behavior.

## Ponytail Simplicity

N/A - documentation-only change. The accepted operational approach reused the existing writer, outbox worker, Job Scheduler job and Brevo integration; no new queue, dependency or custom scheduler was added.

## Ownership Knowledge Gate

Member: DonHV
Date: 2026-08-29
Ownership flow: Bug event -> source-keyed Notification/inbox/outbox -> Job Scheduler recovery action -> shared worker -> Brevo -> HANA delivery readback
Base questions: PASS - distinguished immediate post-commit delivery from hourly recovery and scheduled discovery.
Inactive-day questions: PASS - private cutoff excludes historical cycles and hourly cadence is the explicit free-plan boundary.
Additional-flow questions: PASS - explained replay idempotency, HANA concurrency and guarded cleanup.
Score: 100%
Critical questions: PASS
Debug exercise: PASS
Teach-back: PASS
Evidence: docs/pm/evidence/my-notifications/n4-controlled-operational-acceptance-20260829.md
Result: PASS

## Known Gaps

- The live Job Scheduler `free` plan allows a minimum recurring interval of one hour; five minutes requires a plan upgrade.
- Job `3368450` is active hourly with the verified private no-replay cutoff. Five-minute discovery still requires a standard-plan upgrade.
- N5 Operations diagnostics and 90-day retention remain separate future scope.

## Jira/Evidence Links

- `docs/pm/evidence/my-notifications/n4-controlled-operational-acceptance-20260829.md`
- `docs/pm/evidence/my-notifications/n4-rollout-prerequisite-hold-20260828.md`
- `docs/pm/tasks/wp7-my-notifications-roadmap.md`
- PR #365 contains the merged N4 product source.

## Checklist

- [x] I tested at least one non-happy path.
- [x] I checked role/authorization behavior or explained why it is N/A.
- [x] I checked persistence/reload behavior or explained why it is N/A.
- [x] I checked UI/UX consistency or explained why it is N/A.
- [x] I applied the required Ponytail skill or explained why this is a non-code change.
- [x] I completed the Ownership Knowledge Gate or explained why this PR predates 2026-07-13.
- [x] I recorded actionable defects in Jira or explained why none were found.
