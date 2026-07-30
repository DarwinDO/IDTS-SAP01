# IDTS-114 — BTP role matrix case

- Case: PM shell and role-matrix handoff
- Baseline SHA: `016a6067de1c3c7725b6f74f23b90ef6b8b5f7fa`
- PM / DonHV: authenticated AppRouter shell, profile/role context and PM review flows exercised.
- Tester: `BLOCKED — approved interactive Tester SAP identity was not available in this session.`
- Developer: `BLOCKED — approved interactive Developer SAP identity was not available in this session.`
- Expected: permissions are verified from Network/backend responses, not inferred from UI visibility.
- Actual: no impersonation or credential inspection was performed. Apply Classification, Confirm Duplicate and Operational Metrics could not be role-tested because their deployed UI entry points are absent.
- Result: `BLOCKED — partial PM evidence only`
- Evidence:
  - `pm-bug-0018-baseline.png`

