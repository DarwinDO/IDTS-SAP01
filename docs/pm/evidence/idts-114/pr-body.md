## Summary

Implements IDTS-114: a minimal Vercel AI Gateway adapter behind the existing safe AI provider abstraction. The default remains disabled/mock. The staged configuration supports Ling for cost-controlled proving, then Qwen primary with at most one OpenAI fallback. No key, endpoint override, raw provider payload, automatic Bug mutation, or schema change is included.

## Positive Evidence

- `npm run qa:idts114:programmatic` — PASS 15/15: structured Gateway contract, Ling model identifier, Qwen fallback, embedding fallback, and safe result shape.
- Existing AI safety/regression suites PASS: IDTS-64 34/34, IDTS-65 19/19, IDTS-67 29/29, IDTS-68 33/33, IDTS-69 8/8, IDTS-71 31/31, IDTS-97 42/42.
- CAP compile (`cds compile srv --to edmx -s all`) and UI5 application build PASS.

## Negative Evidence

- Missing Gateway key returns `AI_CONFIGURATION_INCOMPLETE` without a network request.
- Gateway HTTP 403 does not attempt fallback and returns only a sanitized provider failure.
- Budget/quota HTTP 429 does not attempt fallback, preventing accidental secondary spend.

## Edge/Boundary Evidence

- A retryable Qwen 5xx causes exactly one configured OpenAI chat fallback; malformed responses and retryable embedding failure follow the same bounded policy.
- Ling can explicitly disable embeddings so Similar Bugs retains its existing deterministic lexical fallback.
- `safeModelId()` accepts only safe `provider/model` IDs and rejects URLs/path traversal.

## Roles/Authorization

No role, OData action, authorization rule, or UI visibility rule changes. Existing AI actions remain authenticated, advisory, and human-reviewed; IDTS-67/69/71 regression proves classification and Smart Assign do not mutate the Bug workflow automatically.

## Persistence/Reload

No database schema or persistence contract changes. Existing `AiSuggestions` audit metadata already persists provider/model/status/latency; IDTS-65 and IDTS-97 regression passed. Live provider acceptance is intentionally separate and pending private BTP configuration.

## UI/UX Review

No UI artifact changes. The existing Fiori review panels and their safe state/message behavior remain covered by IDTS-70/71 regression; no provider diagnostics are added to UI copy.

## Ponytail Simplicity

Used native Node `fetch` and `AbortController`; no Vercel SDK, AI SDK, background queue, migration, or second abstraction was added. One adapter reuses the existing provider envelope, sanitizer, audit, and metric path.

## Known Gaps

- Ling plain-chat connectivity passed through the Gateway, but Ling JSON-Schema structured output returned HTTP 400; Qwen is therefore the structured primary model.
- Authenticated browser smoke of Similar Bugs, Classification Suggestion, Handoff Summary and Smart Assign Explanation remains open, including review persistence and no workflow/assignment mutation.
- Controlled fallback evidence proves routing after a synthetic retryable failure; it does not claim a naturally occurring Qwen outage.

## Ownership Knowledge Gate

Member: DonHV
Date: 2026-07-23
Ownership flow: Backend AI provider integration and safe operational boundary
Base questions: 3
Inactive-day questions: 0
Additional-flow questions: 2
Score: 90%
Critical questions: PASS
Debug exercise: PASS
Teach-back: PASS
Evidence: docs/learning/progress/donhv.md and docs/pm/evidence/idts-90/knowledge-gate-donhv-2026-07-23.md
Result: PASS

## Jira/Evidence Links

- Jira: https://dutassociation.atlassian.net/browse/IDTS-114
- Repository evidence: `docs/pm/evidence/idts-114/README.md`
- Live BTP evidence: `docs/pm/evidence/idts-114/btp-live-provider-verification-20260729.md`
- Knowledge mirrors: `docs/knowledge/srv/ai/config.js.md`, `docs/knowledge/srv/ai/provider.js.md`, `docs/knowledge/srv/ai/vercel-gateway-provider.js.md`, and `docs/knowledge/srv/ai/metrics.js.md`.
