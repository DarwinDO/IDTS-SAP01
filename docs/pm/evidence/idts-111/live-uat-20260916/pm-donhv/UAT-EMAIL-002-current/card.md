# UAT-EMAIL-002 — controlled assignment email fault injection

**Result: PASS**

Executor: `NhanT (DonHV support)`
Runtime: Edge Profile 1, PM DonHV, deployed CAP `d472f2c9e20d4b684c9ebe721181b21989562aba`.

The PM assignment workflow returned HTTP 200 exactly once. BUG-0023 produced exactly one assignment History event and one assignment Notification. The same persisted email delivery transitioned from `FAILED`, attempt 1, `EMAIL_UAT_FORCED_FAILURE`, bounded `nextAttemptAt`, to `SENT`, attempt 2, through one existing Job Scheduler one-shot. Unrelated deliveries were unchanged.

Cleanup restored the original title. Final History is 4: baseline 2, assignment +1, cleanup Edit +1. Notifications remain 3: assignment +1; duplicate assignment History/Notification counts are 0. Both UAT fault-injection variables are absent after restage. Fresh `npm run btp:demo:check` reports CAP/AppRouter 1/1, liveness/readiness 200, protected API 401, and `DEMO READY`.

Runtime UI evidence: [final-runtime.png](final-runtime.png), [final-history.png](final-history.png), [final-notifications.png](final-notifications.png).
Supplemental Gmail evidence: [supplemental-gmail-digest-bug0023.png](supplemental-gmail-digest-bug0023.png) and [supplemental-gmail-connected-accounts.png](supplemental-gmail-connected-accounts.png). The digest is a receipt only, not FAILED-to-SENT proof; DB/outbox same-delivery readback is authoritative. No exact assigned-message subject was found in the authorized narrow search.

See [assignment-sent.json](assignment-sent.json), [cleanup-readiness.json](cleanup-readiness.json), and [email002-capture-report.md](<C:/Users/LapHub/.codex/worktrees/idts-127-email002-fault-injection-donhv/.superpowers/email002-capture-report.md>) for sanitized structured evidence and the full handoff report.
