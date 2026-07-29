# IDTS-115 SAP BTP acceptance evidence

Date: 2026-07-29  
Owner: DonHV  
Runtime merge SHA: `ae209c8f82227e4dedca09247db96c0b47097d92`  
Verdict: `PARTIAL PASS — PM positive flows passed; role matrix and provider-primary acceptance remain incomplete`

## Result summary

| Capability | PM browser result | Persistence / no-mutation | Provider result |
| --- | --- | --- | --- |
| Apply Classification | PASS on `BUG-0019` | PASS after reload; status, assignee and next processor were not changed | Safe fallback; latest audit is `AI_PROVIDER_ERROR` for Qwen structured |
| Confirm Duplicate | PASS for `BUG-0019` → `BUG-0020` | PASS; HANA readback confirms one `DUPLICATE` link | Qwen embedding produced `SUCCESS` for candidate generation |
| AI Activity | PASS on PM Dashboard | Read-only | Metrics accurately expose provider success/failure totals without raw diagnostics |
| Handoff review | PASS on `BUG-0018` | PASS; review persisted without workflow mutation | Safe fallback; latest audit is `AI_PROVIDER_ERROR` for Qwen structured |
| Smart Assign review | PASS on `BUG-0018` | PASS; no assignment occurred without explicit candidate selection | Safe fallback; latest audit is `AI_PROVIDER_ERROR` for Qwen structured |

## Acceptance gaps

- Tester and Developer interactive SAP-identity sessions were not available to the agent. Their browser role cases remain pending; programmatic authorization tests do not replace member-owned interactive evidence.
- Qwen structured calls for Classification, Handoff Summary and Smart Assign did not produce `SUCCESS` in this run. The UI handled the provider failures safely, but IDTS-114 primary-provider acceptance remains open.
- The create flow emitted client errors when off-screen fields were changed before their OData bindings had been read, and emitted an invalid `componentCategory_ID` drill-down error. Both controlled QA bugs were eventually created after the fields were loaded and refilled. This is a product UX/binding finding requiring follow-up.

## Evidence index

- `classification-apply/`: PM review, apply and reload evidence.
- `duplicate-confirmation/`: PM candidate review and confirmation evidence.
- `operational-metrics/`: PM-only 30-day metrics dialog.
- `provider-readback/`: sanitized HANA audit and provider status.
- `role-matrix/`: tested and pending role cases.
- `deployment/`: MTAR and SAP BTP deployment verification.

No password, API key, bearer token, cookie, database URL, full private email or raw provider payload is stored in this evidence pack.
