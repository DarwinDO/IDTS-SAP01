# `srv/ai/vercel-gateway-provider.js`

## Purpose

This is the thin server-side adapter for Vercel AI Gateway. It is not called by UI code and never decides Bug workflow state. `srv/ai/provider.js` first redacts and bounds the feature input, then calls this adapter with a private runtime key and a safe model ID.

## Execution flow

1. `SafeAiProvider` selects this delegate only for ready `vercel` configuration.
2. `chat()` or `structured()` calls `#chatCompletion()` at the fixed OpenAI-compatible gateway path `/v1/chat/completions`.
3. `embedding()` calls `/v1/embeddings` only if an embedding model is configured.
4. `#request()` creates an `AbortController`, sends a bearer key in-memory, parses the response, and immediately discards the raw response body after extracting the required value.
5. `#withFallback()` attempts the configured primary once. Only a timeout, network failure, retryable 5xx, non-budget 429, or malformed response can cause one fallback attempt. 400/401/403/404 and quota/budget/billing 429 do not fallback.
6. It returns only safe metadata (`providerAlias`, actual `modelAlias`, `fallbackUsed`) plus text/JSON/vector data. The wrapper converts errors to safe public results.

## Debugging safely

Set breakpoints in `#withFallback()` and `#request()`. Inspect `primaryModel`, `fallbackModel`, HTTP status, and `fallbackUsed`. Do not expand `headers.Authorization`, copy the gateway key, or log provider payloads. If a feature changes a Bug after an AI action, debug the feature/action handler separately: this adapter has no database transaction or OData action code.

## Files to inspect together

- `srv/ai/config.js` — private configuration and model allowlist shape.
- `srv/ai/provider.js` — sanitization and stable result envelope.
- `srv/ai/metrics.js` — safe operational metadata.
- `scripts/qa/test-idts114-vercel-gateway-provider.js` — fake-fetch contract and fallback tests.
- `scripts/qa/test-idts114-ling-live.js` — opt-in synthetic live smoke; requires private environment configuration and `--execute`.
