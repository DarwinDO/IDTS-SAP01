# IDTS-114 — Similar Bugs BTP browser case

- Case: Similar Bugs suggestion and review persistence
- Role: PM / DonHV
- Bug: `BUG-0018`
- Baseline SHA: `016a6067de1c3c7725b6f74f23b90ef6b8b5f7fa`
- Environment: SAP BTP Cloud Foundry AppRouter; Qwen embedding primary with bounded fallback
- Expected: ranked candidates are reviewable; review writes suggestion audit only; Bug workflow remains unchanged.
- Actual: candidates were displayed; one suggestion was accepted; after reload, a new invocation generated a fresh suggestion rather than reopening the prior one. The accepted audit row remained persisted. `DuplicateLinks` stayed unchanged.
- Result: `PARTIAL — review/no-mutation PASS; stable provider success not PASS`
- Limitation: a later provider call returned safe fallback after sanitized gateway rate-limit evidence. There is no explicit duplicate-confirmation UI action in the deployed Similar Bugs panel.
- Evidence:
  - `pm-bug-0018-candidates.png`
  - `pm-bug-0018-accepted.png`

