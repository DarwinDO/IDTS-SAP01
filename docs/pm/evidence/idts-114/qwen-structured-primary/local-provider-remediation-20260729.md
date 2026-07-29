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

## SAP BTP follow-up finding

After PR #216 was merged and `idts-sap01-srv` was selectively deployed at
merge SHA `8be1081f83b903e78a8b2e8728aa1a0d927e8103`, the real Classification
feature reached Qwen but both `json_schema` and the legacy JSON compatibility
request returned a classified HTTP 400. The UI used the safe fallback and did
not expose raw provider data.

Controlled same-model diagnostics then established:

| Request mode | Safe result |
| --- | --- |
| `json_object` response format | HTTP 400 — CF task `idts114-qwen-json-object-smoke-20260729-r3` |
| No `response_format`; JSON-only instruction | HTTP 200, parseable JSON — CF task `idts114-qwen-prompt-json-smoke-20260729` |

The follow-up red test reported `23 PASS / 1 FAIL` before the adapter change.
After replacing the legacy-format retry with one prompt-only JSON retry and
adding malformed-output, repeated-failure and fallback-model boundary cases,
the focused suite reported `30 PASS / 0 FAIL`. This remains local adapter
evidence. Classification, Handoff Summary and Smart Assign still require fresh
feature-level BTP `SUCCESS` rows on Qwen before primary acceptance can be
claimed.

The fresh post-review regression matrix is `165 PASS / 0 FAIL`:
IDTS-64 `34/34`, IDTS-67 `29/29`, IDTS-68 `33/33`, IDTS-69 `8/8`,
IDTS-71 `31/31` and IDTS-114 `30/30`. CAP compile for both services, secret
scan, agent rules, QA Depth self-test, AI DevKit and `git diff --check` also
passed.

## Smart Assign schema-envelope follow-up

The post-cooldown SAP BTP call reached primary Qwen successfully:

| Capability | Safe result | Model | Latency |
| --- | --- | --- | ---: |
| Similar Bugs embedding | `SUCCESS` | `alibaba/qwen3-embedding-0.6b` | 6,982 ms |
| Classification | `SUCCESS` | `alibaba/qwen3.7-flash` | 27,029 ms |
| Handoff Summary | `SUCCESS` | `alibaba/qwen3.7-flash` | 19,932 ms |
| Smart Assign before cooldown | rate limited | `alibaba/qwen3.7-flash` | 3,569 ms |
| Smart Assign after cooldown | `SUCCESS` | `alibaba/qwen3.7-flash` | 32,780 ms |

The Smart Assign UI nevertheless displayed unavailable/fallback wording.
A controlled shape-only call found one exact schema-name envelope:

```text
top-level key: IdtsSmartAssignmentExplanation
nested candidate array: candidates
```

The feature reads root `candidates` or `explanations`; therefore the provider
audit could be `SUCCESS` while feature mapping ignored the nested rows. No raw
prompt, response body, credential, endpoint or personal data was retained.

Red evidence:

```text
30 PASS / 1 FAIL
FAIL exact schema-name wrapper is removed before feature validation
```

Green evidence after the single-layer normalization:

```text
IDTS-114 provider: 36/36 PASS
IDTS-69 Smart Assign: 8/8 PASS
AI regression total: 171/171 PASS
Secret scan: PASS
CAP compile: PASS
```

`mta.yaml` now persists `IDTS_AI_TIMEOUT_MS: 45000` for `idts-sap01-srv`.
This does not add a retry or change any OData/CDS/HANA contract. Browser
acceptance remains pending until the merged service is selectively deployed
and Smart Assign shows the grounded provider explanation after reload without
changing Bug status, assignee, next processor or lifecycle history.
