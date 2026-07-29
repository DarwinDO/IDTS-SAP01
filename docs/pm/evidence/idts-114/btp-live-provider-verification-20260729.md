# IDTS-114 — SAP BTP live AI provider verification

Date: 2026-07-29
Owner: DonHV
Implementation SHA: `d9a1df1b157f3c50c75b6861259cfb284455c147`

## Result

Provider-level rollout is verified on SAP BTP:

- Primary structured model: `alibaba/qwen3.7-flash`.
- Primary embedding model: `alibaba/qwen3-embedding-0.6b`.
- Structured fallback: `openai/gpt-5.4-nano`.
- Embedding fallback: `openai/text-embedding-3-small`.
- Runtime config readback: ready, no missing field, key presence true.
- CAP service health: HTTP 200.
- AppRouter unauthenticated entry: HTTP 302 to XSUAA.

No credential value, prompt body, provider response body, user email, Bug
content or private binding was captured in this evidence.

## Live task matrix

| Task | Model/path | Result | Contract evidence |
| --- | --- | --- | --- |
| Task 26 | Qwen structured | PASS | Valid structured response; no fallback. |
| Task 27 | Qwen embedding | PASS | Valid vector with 1024 dimensions; no fallback. |
| Task 28 | Controlled Qwen 503 → GPT fallback | PASS | Exactly two provider attempts; valid structured response; fallback recorded. |
| Task 29 | Controlled Qwen embedding 503 → OpenAI embedding fallback | PASS | Exactly two provider attempts; valid vector with 1536 dimensions; fallback recorded. |
| Task 31 | Presence-only configuration readback | PASS | Ready, no missing config, primary and fallback aliases match the approved plan. |

Ling also passed a synthetic plain-chat connectivity check. Its JSON-Schema
structured request returned HTTP 400, so Ling is not used as the application's
structured primary model.

## No-mutation boundary

The live provider tasks used synthetic inputs and did not call the IDTS bound
actions. They did not modify Bug status, assignee, next processor, HANA rows,
S3 objects, notifications or email deliveries. Existing no-mutation behavior
was revalidated by the local IDTS-67, IDTS-68, IDTS-69 and IDTS-71 suites.

## Local regression

| Suite | Result |
| --- | ---: |
| IDTS-114 provider | 15/15 PASS |
| IDTS-64 provider abstraction | 34/34 PASS |
| IDTS-65 audit persistence/sanitization | 19/19 PASS |
| IDTS-67 classification | 29/29 PASS |
| IDTS-68 handoff summary | 33/33 PASS |
| IDTS-69 smart-assignment explanation | 8/8 PASS |
| IDTS-71 AI security/no-mutation | 31/31 PASS |
| **Total** | **169 PASS / 0 FAIL** |

## Remaining check

Authenticated browser smoke is still required for all four user-facing AI
actions and review persistence. Controlled fallback proves routing under a
synthetic retryable failure; it does not claim a naturally occurring Qwen
outage.
