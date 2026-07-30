# IDTS-114 AI rate-limit and request-bounding — local verification

## Baseline

- Source branch: `fix/idts-114-ai-rate-limit-request-bounding-donhv`
- Frozen source baseline: `78aaab476550900c270a02409a717a6624ce0e03`
- Previous SAP BTP deploy SHA: `d12ceef22ce8cae62987430a08fca4f11a5af088`
- Primary structured model: `alibaba/qwen3.7-flash`
- Primary embedding model: `alibaba/qwen3-embedding-0.6b`
- Secrets and private endpoints: not captured

## Implemented boundary

- The candidate query remains capped at 50 Bugs.
- Deterministic prefilter selects at most 10 candidates before embeddings.
- Embedding input is at most 11 texts and 2,000 characters per text.
- One batch request is preferred; unsupported array input falls back to at most
  11 sequential calls with concurrency 1.
- Malformed batches fall back to deterministic ranking without mixing vectors.
- Transient HTTP 429 starts a shared in-memory cooldown and does not call the
  configured OpenAI fallback.
- Only timeout, network failure, and HTTP 5xx may use one bounded fallback.
- Classification exposes a business-safe `AI_RATE_LIMITED` explanation.

## Focused results

| Verification | Result |
|---|---:|
| `npm run qa:idts114:programmatic` | PASS — 53/53 |
| `npm run qa:idts66:programmatic` | PASS — 45/45 |
| `npm run qa:idts67:programmatic` | PASS — 31/31 |
| `npm run qa:idts64:programmatic` | PASS — 36/36 |
| IDTS-68/69/71 regressions | PASS — 45/45, 8/8, 31/31 |
| IDTS-74/75/76 UI contract regressions | PASS — 177, 112, 110 checks |
| `npm run qa:idts115:programmatic` | PASS — 189 checks |
| JavaScript syntax checks | PASS |
| CAP compile (`-s all`) | PASS; known attachment vocabulary warning only |
| UI5 production build | PASS |
| Secret scan / agent rules / QA-depth self-test | PASS |
| AI DevKit lint | PASS — 5/5 |
| `git diff --check` | PASS with line-ending notices only |

Covered negative and boundary cases include batch count/dimension validation,
explicit batch-contract HTTP 400 compatibility, generic HTTP 400 no-retry,
malformed structured output, transient and budget
HTTP 429, cooldown default/clamp/recovery, no fallback on rate limit, one
fallback on HTTP 5xx, bounded text count/length, stable ranking, and no automatic
`DuplicateLinks` mutation. Embedding inputs are limited to title, description
and classification context; workflow status and collaboration data are excluded.

## Simplicity review

Ponytail review: `Lean already. Ship.` The change reuses native `fetch`,
`AbortController`, the existing safe provider abstraction and one process-local
timestamp. It adds no SDK, queue, scheduler, database table or dependency.

## Limitations and pending acceptance

- This record is local/programmatic evidence, not SAP BTP provider-live proof.
- The synthetic three-text BTP batch probe must pass before business data uses
  the batch contract.
- Sequential browser acceptance and safe HANA audit readback remain pending the
  merged selective service deployment.
- Tester/Developer role evidence remains deferred by the agreed task scope.
