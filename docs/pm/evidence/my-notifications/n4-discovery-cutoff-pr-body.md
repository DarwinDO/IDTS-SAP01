## Summary

Add an activation cutoff to the protected N4 scheduled-discovery action so enabling Job Scheduler does not replay older Pending Assignment, SLA or Overdue cycles. Production uses private `IDTS_NOTIFICATION_DISCOVERY_FROM` as the authoritative baseline; technical request data cannot override it. No schema, dependency, lockfile, Bug data, recipient policy, immediate email or digest behavior changes.

## Positive Evidence

Focused real-CAP SQLite scheduled discovery/digest suites pass. Cycles anchored exactly at and after the cutoff use the existing source-keyed transactional writer. Existing no-cutoff behavior and immediate email regressions pass.

Live controlled run `a9b908bf-541e-48f3-bfb7-7672ba1178ba` returned HTTP `200`, 11 candidates, zero created historical events and 16 cutoff skips. Final BTP readiness is `DEMO READY`; Codex Security exact-diff scan `26e165a9-e55d-4fbb-82c3-7af0d1f5383a` completed with zero findings.

## Negative Evidence

Pre-cutoff Pending/SLA/Overdue fixtures create no source, inbox or email row. Blank and malformed cutoff values return `INVALID_DISCOVERY_CUTOFF`. A stale request value cannot override private server configuration.

The first live attempt executed the old assigned droplet and created 24 source/inbox plus six unsent attempt-zero deliveries. Discovery was stopped before the outbox worker/provider; guarded rollback removed exactly those rows and proved zero remaining run sources. The corrected droplet run created zero historical rows.

## Edge/Boundary Evidence

Coverage includes before/equal/after Pending Assignment anchors, a matching due-date HistoryLog Overdue cycle, legacy immutable creation fallback, omitted cutoff compatibility, repeated source-key behavior, bounded paging, stale state and recipient races.

## Roles/Authorization

`processNotificationSchedules` remains protected by `OutboxProcessor`. No end-user role receives a new action. The production cutoff comes from private server configuration, not caller-controlled filter/recipient input.

## Persistence/Reload

The change adds no persistence. Existing `Notifications.sourceKey`, inbox and delivery uniqueness remain authoritative. HANA readback proved zero new historical source/delivery rows after corrected activation and zero pending/failed deliveries.

## UI/UX Review

N/A - backend scheduler remediation; no UI asset, copy, route or interaction changes.

## Ponytail Simplicity

Used Ponytail full: one action parameter, one private server setting and two anchor comparisons. Deliberately added no baseline table, migration, queue, dependency or source-key format.

## Ownership Knowledge Gate

Member: DonHV
Date: 2026-08-29
Ownership flow: protected scheduler action -> immutable Pending/due-date anchor -> cutoff -> source-keyed notification writer -> outbox worker
Base questions: PASS
Inactive-day questions: PASS
Additional-flow questions: PASS
Score: 100%
Critical questions: PASS
Debug exercise: PASS
Teach-back: PASS
Evidence: docs/pm/evidence/my-notifications/n4-discovery-cutoff-source-20260829.md
Result: PASS

## Known Gaps

The live Job Scheduler free plan supports a minimum one-hour cadence. Job `3368450` and its hourly schedule are active with the private no-replay cutoff. Five minutes requires a standard-plan upgrade; immediate prompt email remains independent of this recovery/discovery cadence. PR remains Draft; no Ready/merge is claimed.

## Jira/Evidence Links

- `docs/pm/evidence/my-notifications/n4-discovery-cutoff-source-20260829.md`
- Draft evidence PR #366
- N4 source PR #365

## Checklist

- [x] I tested at least one non-happy path.
- [x] I checked role/authorization behavior or explained why it is N/A.
- [x] I checked persistence/reload behavior or explained why it is N/A.
- [x] I checked UI/UX consistency or explained why it is N/A.
- [x] I applied the required Ponytail skill or explained why this is a non-code change.
- [x] I completed the Ownership Knowledge Gate or explained why this PR predates 2026-07-13.
- [x] I recorded actionable defects in Jira or explained why none were found.
