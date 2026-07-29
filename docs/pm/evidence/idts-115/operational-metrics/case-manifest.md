# AI Activity — PM acceptance

| Field | Value |
| --- | --- |
| Role | PM |
| Window | 30 days |
| Baseline | `ae209c8f82227e4dedca09247db96c0b47097d92` |
| Result | PASS for PM read-only UI |

## Expected

- The entry point is in the existing PM Dashboard header.
- The dialog shows business-facing capability totals only.
- It must not expose prompts, responses, raw errors, endpoints, secrets or provider configuration.
- Reading metrics must not mutate any Bug or suggestion.

## Actual

The dialog displayed:

| Capability | Requests | Successful | Unavailable/Failed | Average latency |
| --- | ---: | ---: | ---: | ---: |
| Smart Assign | 24 | 0 | 24 | 555 ms |
| Handoff Summary | 24 | 0 | 24 | 322 ms |
| Classification | 22 | 0 | 22 | 840 ms |
| Similar Bugs | 21 | 2 | 19 | 1448 ms |

Review-decision totals were also displayed. No raw diagnostic or secret appeared.

## Selected evidence

- `pm-ai-activity-30-days.png`

Tester and Developer 403 behavior remains pending interactive member-owned sessions; backend programmatic authorization tests already pass but are reported separately.
