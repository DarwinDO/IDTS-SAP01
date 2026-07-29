# IDTS-114 — Qwen structured primary local remediation

Date: 2026-07-29

Owner: DonHV

Branch: `fix/idts-114-qwen-structured-primary-donhv`

Baseline: `6aeb13878084be8698af6efc133238078a6d0026`

## Finding

The Vercel adapter treated every HTTP 400 as a generic non-retryable failure.
Feature-level Qwen structured calls therefore had no bounded compatibility path
when a provider/model rejected the preferred `json_schema` response format.
Recent SAP BTP audit rows recorded safe `AI_PROVIDER_ERROR` outcomes for
Classification, Handoff Summary and Smart Assign.

## Minimal remediation

- Keep `alibaba/qwen3.7-flash` as the primary structured model.
- Send Vercel's recommended `json_schema` format first.
- Retry exactly once on the same Qwen model with Vercel's documented legacy
  JSON structured format only when the HTTP 400 is classified as a
  response-format incompatibility.
- Do not retry generic HTTP 400.
- Distinguish temporary 429 rate limiting from spend quota/budget exhaustion.
- Preserve only allowlisted provider code, bounded `Retry-After`, safe reason,
  model alias and latency in backend diagnostics.
- Keep the existing bounded OpenAI fallback policy.

No OData contract, CDS model, HANA schema, Bug workflow, S3, Brevo, AI model or
private runtime configuration was changed.

## Red/green evidence

Before the adapter change, the focused suite reported:

```text
19 PASS / 3 FAIL
```

The three failing assertions proved that response-format HTTP 400 did not
retry on the same Qwen model and did not use the compatibility format.

After the minimal change:

```text
IDTS-114 provider: 24 PASS / 0 FAIL
```

## Regression matrix

| Suite | Result |
| --- | ---: |
| IDTS-64 provider abstraction | 34/34 PASS |
| IDTS-67 Classification | 29/29 PASS |
| IDTS-68 Handoff Summary | 33/33 PASS |
| IDTS-69 Smart Assign Explanation | 8/8 PASS |
| IDTS-71 AI security/no-mutation | 31/31 PASS |
| IDTS-114 Vercel Gateway | 24/24 PASS |
| **Total** | **159 PASS / 0 FAIL** |

Additional gates:

- CAP compile: PASS.
- Agent rules: 8/8 PASS.
- QA Depth self-test: 15/15 PASS.
- AI DevKit: 5/5 PASS.
- Secret scan: PASS.
- `git diff --check`: PASS; line-ending warnings only.
- Ponytail review: `Lean already. Ship.`

## Pending acceptance

This file proves local adapter behavior only. Primary Qwen acceptance remains
pending until the changed service is merged, selectively deployed to SAP BTP,
and each real feature produces at least one sanitized audit row with:

- `operationStatus = SUCCESS`
- `modelAlias = alibaba/qwen3.7-flash`
- no fallback

Tester/Developer role-matrix evidence remains deferred by the approved plan.
