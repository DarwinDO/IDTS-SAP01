## Summary

Add N5-Lite read-only Digest delivery diagnostics to the existing User Administration Operations delivery table. Exact PM + UserAdmin can filter safe Digest status, attempts, timestamps and sanitized errors. No retry action, retention job, schema, dependency, worker, scheduler, provider or new screen is added.

## Positive Evidence

Focused real-CAP SQLite Operations QA proves Digest-only and mixed three-source reads, page-complete masked-recipient search beyond the former 10,100-row cap, allowlisted error codes, stable safe DTO mapping and `canRetry=false`. UI QA proves one unified table, localized Digest filter/type/event and hidden retry. Digest regression, CAP compile and User Administration lint/build pass.

## Negative Evidence

Non-UserAdmin PM is rejected before any table read. Digest body, subject, provider ID, internal recipient ID, lock fields, persisted provider summary and non-allowlisted provider error codes are absent from the service and UI rows. Unsupported delivery types still fail closed. No manual retry or delete action exists.

## Edge/Boundary Evidence

Returned pages stay bounded by the existing 25 default/100 maximum and 10,000 skip ceiling. Digest masked-recipient search scans fixed 100-row pages and performs one bounded User lookup per page until enough ordered matches exist. A request inspects at most 20,000 candidate rows; if that budget cannot satisfy the page, CAP returns `DIGEST_SEARCH_TOO_BROAD` instead of silently truncating or scanning the entire table. Existing invitation/access sorting, filtering and retry paths remain covered. UI cache identity advances consistently to `1.0.18` without dependency changes.

## Roles/Authorization

The existing server authorization helper requires an active internal PM plus the separate UserAdmin capability before every delivery read. UI visibility is not treated as authorization. No role, identity or user record is changed.

## Persistence/Reload

N/A — N5-Lite is read-only and reuses existing `NotificationDigestDeliveries`. No table, column, migration, write, retry reset or retention delete is introduced. Reload rereads current persisted delivery state through the same safe action.

## UI/UX Review

Uses one native option in the existing Delivery type `Select` and the existing responsive Operations table/details flow. No custom CSS, new tab, duplicate table or new action. English and Vietnamese labels are aligned.

## Ponytail Simplicity

Ponytail full and Ponytail Review applied. Reused the existing table, DTO, search action, normalizer, table and retry visibility. Deliberately skipped manual Digest retry and automated 90-day deletion until measured need. No further runtime lines were identified for removal.

## Ownership Knowledge Gate

Member: DonHV
Date: 2026-08-29
Ownership flow: existing Notification/email and User Administration Operations flows; no new ownership flow
Base questions: PASS — reuse the same-day verified notification gate recorded in merged PR #367
Inactive-day questions: N/A — zero inactive days
Additional-flow questions: N/A — User Administration composite flow already passed
Score: 100%
Critical questions: PASS
Debug exercise: PASS
Teach-back: PASS
Evidence: docs/pm/evidence/my-notifications/n4-discovery-cutoff-source-20260829.md; docs/pm/evidence/my-notifications/n5-lite-digest-diagnostics-source.md
Result: PASS

## Known Gaps

Manual Digest retry and automated inbox cleanup are deferred until measured operational need. No deployment or live-browser/HANA acceptance is claimed by this source gate. TAC advisory was unavailable because the connector was not connected. After the missing plugin was restored, exact-head Codex Security scan `d6540079-0847-4d38-a3a4-63d0e187bdbc` sealed complete seven-file coverage at `1c00ded4` with zero reportable findings. The earlier interrupted scan remains preserved as tooling evidence only.

## Jira/Evidence Links

- `docs/pm/evidence/my-notifications/n5-lite-digest-diagnostics-source.md`
- `docs/pm/tasks/wp7-my-notifications-roadmap.md`
- `docs/pm/risk-decision-log.md` DEC-069

## Checklist

- [x] I tested at least one non-happy path.
- [x] I checked role/authorization behavior or explained why it is N/A.
- [x] I checked persistence/reload behavior or explained why it is N/A.
- [x] I checked UI/UX consistency or explained why it is N/A.
- [x] I applied the required Ponytail skill or explained why this is a non-code change.
- [x] I completed the Ownership Knowledge Gate or explained why this PR predates 2026-07-13.
- [x] I recorded actionable defects in Jira or explained why none were found.
