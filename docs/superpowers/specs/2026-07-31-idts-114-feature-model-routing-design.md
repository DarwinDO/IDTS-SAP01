# IDTS-114 Feature-Specific AI Model Routing

## Decision

SAP BTP keeps one Vercel AI Gateway integration but selects a bounded model per
capability:

| Capability | Primary | Backup |
| --- | --- | --- |
| Similar Bugs embeddings | `alibaba/qwen3-embedding-0.6b` | Existing embedding fallback policy |
| Classification | `openai/gpt-5.6-luna` | Existing eligible structured fallback policy |
| Handoff Summary | `deepseek/deepseek-v4-flash` | `xai/grok-4.1-fast-non-reasoning` once |
| Smart Assign Explanation | `zai/glm-4.7-flash` | Existing eligible structured fallback policy |

## Safety boundary

- HTTP 429 never calls another model; the existing cooldown and deterministic
  feature fallback remain authoritative.
- Generic HTTP 403 never calls another model because it may indicate account,
  key, or team access failure.
- Handoff can use Grok only for timeout, network failure, HTTP 5xx, or an
  explicit allowlisted model-route denial code.
- No queue, scheduler, SDK, database table, CDS contract, or OData action is
  added.
- AI output remains advisory and must pass the existing catalog/candidate
  grounding and human-review flow.

## Verification

Focused provider tests must prove the exact model sequence, one-attempt bound,
actual model audit metadata, 429 no-fallback behavior, and sanitized generic
403 behavior. Existing AI feature regressions, CAP compilation, secret scan,
agent rules, and QA depth gates must remain green before deployment.
