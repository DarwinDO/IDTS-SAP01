# IDTS-115 role matrix

Baseline: `ae209c8f82227e4dedca09247db96c0b47097d92`

| Action | PM browser | Tester browser | Developer browser | Backend regression |
| --- | --- | --- | --- | --- |
| Review AI suggestion | PASS | Pending member sign-in | Pending member sign-in | PASS |
| Apply Classification | PASS | Pending member sign-in | Pending 403 evidence | PASS |
| Confirm Duplicate | PASS | Pending member sign-in | Pending 403 evidence | PASS |
| Read AI Activity metrics | PASS | Pending 403 evidence | Pending 403 evidence | PASS |
| Review-only no mutation | PASS | Pending member sign-in | Pending member sign-in | PASS |

## Limitation

Tester and Developer SAP identities are owned by the corresponding members. The agent did not read passwords, impersonate users or reuse tokens. Therefore this matrix is intentionally incomplete and IDTS-115 remains In Progress.
