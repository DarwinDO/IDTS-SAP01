# IDTS-114 — Handoff Summary BTP browser case

- Case: Handoff Summary generation and review persistence
- Role: PM / DonHV
- Bug: `BUG-0018`
- Baseline SHA: `016a6067de1c3c7725b6f74f23b90ef6b8b5f7fa`
- Expected: summary is grounded in Bug/comment/history context; missing data is disclosed; review is advisory and does not mutate workflow.
- Actual: dialog showed summary, status, current action owner, missing comments, important events and next expected action. Safe fallback copy disclosed low confidence/missing context. Review state persisted after reload; Bug fields and notification/history counts did not change.
- Result: `PASS for PM review/no-mutation; provider-live structured success not claimed`
- Limitation: sanitized gateway logs recorded structured provider rate limiting; no raw provider diagnostic was shown in UI. Tester/Developer role evidence remains pending.
- Evidence:
  - `pm-bug-0018-pending.png`
  - `pm-bug-0018-accepted.png`

