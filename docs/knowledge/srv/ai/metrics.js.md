# `srv/ai/metrics.js`

## Purpose

This module is the privacy boundary for IDTS AI operational metrics. It creates allowlisted log records, normalizes status/latency, aggregates persisted `AiSuggestions` metadata, and serves the PM-only reporting handler.

## Runtime flow

1. `safeOperationalMetric()` copies only feature, operation, safe provider/model aliases, status, outcome, and latency.
2. `emitAiOperationalMetric()` writes that object through the CAP logger and ignores telemetry-sink failures.
3. `readAiOperationalMetrics()` applies a default 30-day, maximum 90-day window and reads only safe audit columns.
4. `aggregateAiOperationalMetrics()` groups rows by feature/provider/model and counts reliability plus human review outcomes.

## Security and interpretation

- Never add prompts, responses, error messages, correlation payloads, user emails, attachment content, endpoints, tokens, or credentials.
- `UNAVAILABLE` means disabled, incomplete configuration, or unsupported provider. Timeout and generic provider failure stay separate.
- Missing latency is excluded from averages.
- Metrics are operational evidence, not permission for autonomous Bug changes and not a model-quality score.

## Dependencies and checks

- Imports `@sap/cds` and `srv/ai/safety.js`.
- Called by `srv/ai/provider.js` and `srv/service.js`.
- Reads `idts.cap.AiSuggestions`.
- Verify with `npm run qa:idts97:programmatic`, AI regressions, CAP compile, and secret scan.

## IDTS-114 model-ID preservation (2026-07-29)

`safeModelAlias()` now preserves a validated `provider/model` identifier in operational metrics. This matters because `alibaba/qwen3.7-flash` and `openai/gpt-5.4-nano` must remain distinguishable during staged rollout. It still redacts unsafe text and rejects path traversal, URLs, tokens, prompts, and arbitrary diagnostic strings. The metric remains allowlisted metadata only; it cannot reveal a gateway key or a provider response.
