# IDTS-114 — Smart Assign Explanation BTP browser case

- Case: Smart Assign explanation review without automatic assignment
- Role: PM / DonHV
- Bug: `BUG-0018`
- Baseline SHA: `016a6067de1c3c7725b6f74f23b90ef6b8b5f7fa`
- Expected: value help opens a review-only explanation; candidate selection remains explicit; no assignment occurs until the user presses Assign.
- Actual: dialog displayed candidate capability/module, availability and workload warning. Assign remained disabled until a candidate would be selected. Explanation review was accepted; dialog was cancelled; assignee, status, next processor, history and notifications remained unchanged.
- Result: `PASS for review/no-mutation; provider-live structured success not claimed`
- Limitation: negative invalid-assignee and non-PM role cases require approved Tester/Developer identities. Captured evidence is cropped/sanitized to remove candidate email addresses.
- Evidence:
  - `pm-bug-0018-candidates-sanitized.png`
  - `pm-bug-0018-accepted-header.png`

