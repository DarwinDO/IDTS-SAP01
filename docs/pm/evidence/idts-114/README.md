# IDTS-114 — Vercel AI Gateway staged integration evidence

Baseline: `362ace2a39a82d19c4acc723fe96a15bf7373f5e` (`origin/dev` before this branch).

## Local deterministic verification — 2026-07-29

| Check | Result | What it proves |
| --- | --- | --- |
| `npm run qa:idts114:programmatic` | PASS — 15/15 | Vercel endpoint contract, structured JSON request, Ling model ID, explicit no-embedding Ling phase, one retryable Qwen-to-OpenAI fallback, no fallback for 403/quota, embedding fallback, and no key in result. Uses fake fetch only. |
| `npm run qa:idts64:programmatic` | PASS — 34/34 | Existing disabled/mock/OpenAI abstraction behavior remains compatible. |
| `npm run qa:idts65:programmatic` | PASS — 19/19 | AI suggestion audit stays read-safe and sanitized. |
| `npm run qa:idts67:programmatic` | PASS — 29/29 | Classification stays review-only and catalog validated. |
| `npm run qa:idts68:programmatic` | PASS — 33/33 | Handoff summaries remain grounded and safe. |
| `npm run qa:idts69:programmatic` | PASS — 8/8 | Smart Assign explanation remains advisory and does not assign a developer. |
| `npm run qa:idts71:programmatic` | PASS — 31/31 | Prompt/secret safety and no-mutation behavior remain intact. |

## Live state

`npm run qa:idts114:ling-live` was intentionally skipped without `--execute` because this worktree has no private `AI_GATEWAY_API_KEY`. No key was copied into source, evidence, logs, or BTP configuration by this branch. Therefore this is **not yet a Ling live-provider acceptance result**.

## Tooling issue resolved locally

The fresh worktree first had no installed dependencies; then `npm ci --ignore-scripts` left the native SQLite binding unavailable. Running `npm rebuild better-sqlite3` restored the local test harness. This changed only ignored `node_modules`, not source or lockfiles.

## Next gated action

After code review and merge, configure the Vercel key only through the private BTP app environment/binding, enable the Ling phase, and run `npm run qa:idts114:ling-live -- --execute` with a synthetic request. Qwen and OpenAI fallback remain disabled until that result is accepted.
