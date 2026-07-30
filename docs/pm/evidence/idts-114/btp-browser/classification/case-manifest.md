# IDTS-114 — Classification Suggestion BTP browser case

- Case: Classification suggestions and Accept/Reject/Ignore review state
- Role: PM / DonHV
- Bug: `BUG-0018`
- Baseline SHA: `016a6067de1c3c7725b6f74f23b90ef6b8b5f7fa`
- Expected: catalog-safe suggestions are reviewable; Accept, Reject and Ignore persist; Apply is a separate authorized action.
- Actual: five suggestion rows were displayed. Accept, Reject and Ignore were each exercised and persisted as audit states. No Bug status, assignee, next processor or history mutation was observed.
- Result: `PARTIAL — review-state/no-mutation PASS; Apply Classification UI FAIL`
- Limitation: `ClassificationReview.js` exposes no Apply Classification entry point, so PM/Tester Apply and Developer HTTP 403 cannot be tested through the deployed UI. Structured provider calls also showed safe fallback after sanitized gateway rate-limit evidence.
- Evidence:
  - `pm-bug-0018-pending.png`
  - `pm-bug-0018-accepted.png`
  - `pm-bug-0018-rejected.png`
  - `pm-bug-0018-ignored.png`

