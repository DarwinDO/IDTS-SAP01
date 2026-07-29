# IDTS-114 — Vercel AI Gateway staged integration evidence

Implementation baseline: `d9a1df1b157f3c50c75b6861259cfb284455c147`
(PR #209 merged into `origin/dev`).

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

## SAP BTP live provider verification — 2026-07-29

| BTP task | Result | Safe observation |
| --- | --- | --- |
| `idts114-ling-chat-20260729` | PASS | Ling returned the requested synthetic plain-text response. No business data was used. |
| `idts114-ling-structured-20260729` | EXPECTED FINDING | Ling returned HTTP 400 for the Gateway JSON-Schema structured request, so it was not selected as the application's primary structured model. |
| `idts114-qwen-structured-20260729` (task 26) | PASS | Qwen returned contract-valid structured JSON; `fallbackUsed=false`. |
| `idts114-qwen-embedding-20260729` (task 27) | PASS | Qwen returned a valid 1024-dimension embedding; `fallbackUsed=false`. |
| `idts114-openai-fallback-20260729` (task 28) | PASS | A controlled synthetic primary HTTP 503 caused exactly one real Gateway call to `openai/gpt-5.4-nano`; output contract remained valid. |
| `idts114-openai-embedding-fallback-20260729` (task 29) | PASS | A controlled synthetic primary HTTP 503 caused exactly one real Gateway call to `openai/text-embedding-3-small`; the returned 1536-dimension vector was valid. |
| `idts114-ai-final-config-20260729-r5` (task 31) | PASS | Safe presence-only readback: provider ready, key present, Qwen primary aliases and both OpenAI fallback aliases enabled; no secret value printed. |

The CAP service and AppRouter were both running after configuration. `/health`
returned HTTP 200 and the unauthenticated AppRouter entry returned HTTP 302 to
XSUAA. These provider-level tasks did not call Bug actions and did not mutate a
Bug, assignment, workflow, HANA row, S3 object, notification, or email.

## Final local regression

After `npm rebuild better-sqlite3` restored the fresh worktree's native SQLite
binding, the following suites passed: IDTS-114 15/15, IDTS-64 34/34,
IDTS-65 19/19, IDTS-67 29/29, IDTS-68 33/33, IDTS-69 8/8 and
IDTS-71 31/31. Total: 169 checks, 0 failures.

## Tooling issue resolved locally

The fresh worktree first had no installed dependencies; then `npm ci --ignore-scripts` left the native SQLite binding unavailable. Running `npm rebuild better-sqlite3` restored the local test harness. This changed only ignored `node_modules`, not source or lockfiles.

## Remaining acceptance boundary

Provider integration and fallback are live on SAP BTP. Full feature acceptance
still requires an authenticated browser smoke of Similar Bugs, Classification
Suggestion, Handoff Summary and Smart Assign Explanation, including review
state persistence and no unintended workflow mutation. The controlled fallback
tests prove routing behavior; they do not claim that a naturally occurring
Qwen outage happened.

## Security note

An earlier local environment-inspection command displayed bound-service values
in the terminal. No value was copied to Git or Jira. DonHV replaced the AI key
before these final live tests. Evidence stores only model aliases, task names,
status, dimensions and latency-class results, never credentials.
