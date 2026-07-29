# Classification Apply — PM acceptance

| Field | Value |
| --- | --- |
| Role | PM |
| Bug | `BUG-0019` |
| Baseline | `ae209c8f82227e4dedca09247db96c0b47097d92` |
| Environment | SAP BTP Cloud Foundry through AppRouter/XSUAA |
| Result | PASS with provider fallback limitation |

## Expected

1. Apply is disabled before the suggestion is accepted.
2. Accept persists the review decision.
3. Apply requires an explicit confirmation.
4. Only classification fields may change.
5. Status, assignee and next processor must remain unchanged.
6. Reload must preserve the applied values.

## Actual

- Apply was disabled before review and enabled only after `ACCEPTED`.
- The confirmation dialog was shown and the CAP action completed.
- After reload, `BUG-0019` remained `PENDING_ASSIGNMENT`, had no assignee and retained Project Manager as current action owner.
- Classification values persisted.
- The generated suggestion used the safe fallback. Sanitized HANA audit records the structured Qwen attempt as `AI_PROVIDER_ERROR`; this is not primary-provider PASS.

## Selected evidence

- `pm-accepted-apply-enabled.png`: accepted review with Apply available.
- `pm-bug-0019-accepted-applied.png`: action completed and replay controls locked.
- `pm-bug-0019-reload-no-workflow-mutation.png`: persisted state after reload.

No raw network authorization header, cookie or provider payload is included.
