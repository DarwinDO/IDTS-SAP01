# Task 7 report — lifecycle notification coverage

Baseline: `c722c355df5ff786d372002e20ab10864b4780ab`.

## RED

`npm run qa:my-notifications:events` failed first because `emailRequired:false` still created a `PENDING` email delivery instead of `IN_APP_ONLY`.

## GREEN

- Added additive lifecycle event catalog codes and exact lifecycle routing with `STATUS:<historyID>:<recipientID>`.
- `writeHistoryEvent` now returns the real persisted history ID.
- `writeNotificationRecord` persists notification plus inbox entry transactionally, reuses a source key, and creates EMAIL only for prompt policy (`emailRequired:false` is inbox-only); legacy omitted policy preserves its prior email behavior.
- Added source/inbox/outbox SQLite tests for policy, duplicate/repeated and concurrent producers, and rollback; updated inbox/UI localization consumers.

## Verification

- `npm run qa:my-notifications:events` — PASS
- `npm run qa:history-events:programmatic` — PASS (all seven scenarios)
- `npm run qa:email-outbox:programmatic` — PASS
- `npm run qa:email-immediate:programmatic` — PASS
- `node --check srv/bug-service/actions.js`, `history.js`, `srv/email/outbox.js` — PASS

## Scope and concerns

No provider, email, database, user/role, deployment, push, PR, merge, or schema mutation ran. Coordinator-owned `docs/pm/status/donhv.md` and `scripts/qa/test-history-events-programmatic.js` remain unstaged. Immediate kicking remains post-commit through the existing `req.on('succeeded')` path; worker failure leaves the PENDING row for recovery.
