# IDTS-114 proactive per-model request budget — local verification

## Baseline

- Branch: `fix/idts-114-zai-rate-limit-control-donhv`
- Frozen source baseline: `a77b3796acb8494b4c4a58060613b0f20eaf7639`
- Structured model: `zai/glm-4.7-flash`
- Embedding model: `alibaba/qwen3-embedding-0.6b`
- No credential, prompt, provider response body, or private endpoint was captured.

## Root cause

The existing protection was reactive. Requests were unrestricted until the
Gateway returned the first HTTP 429. The application then respected
`Retry-After`, but it could not prevent the first user-visible rate-limit
response.

## Minimal correction

- Reserve a request slot before each provider call.
- Keep a sliding request window per model alias in process memory.
- Configure SAP BTP for at most four requests per model in sixty seconds.
- Return the existing safe `AI_RATE_LIMITED` result when the local budget is
  exhausted.
- Do not call OpenAI after a local or upstream HTTP 429.
- Keep Z.AI structured generation and Qwen embeddings in separate windows.
- Reset the window on process restart; no queue, scheduler, database table,
  dependency, or public contract was added.

This limit is a stability guard, not additional provider capacity. A request
outside the local budget receives deterministic safe output until a slot
becomes available.

## Red/green evidence

| Verification | Before | After |
|---|---:|---:|
| Focused provider suite | 60 PASS / 3 FAIL | 63 PASS / 0 FAIL |
| Calls reaching provider with test limit 2 | 3 | 2 |
| Third result | Provider request continued | Safe `AI_RATE_LIMITED` |
| Separate Qwen embedding model | Not proved | PASS |
| Recovery after 60-second window | FAIL | PASS |

## Regression results

| Verification | Result |
|---|---:|
| IDTS-64 provider/security | PASS — 38/38 |
| IDTS-66 Similar Bugs | PASS — 45/45 |
| IDTS-67 Classification | PASS — 36/36 |
| IDTS-68 Handoff Summary | PASS — 47/47 |
| IDTS-69 Smart Assign | PASS — 13/13 |
| IDTS-71 AI security review | PASS — 31/31 |
| IDTS-114 Gateway provider | PASS — 63/63 |
| CAP compile for all services | PASS |
| MTA YAML parse and declared values | PASS — `4` / `60` |
| Secret scan | PASS |
| Agent rules | PASS — 8/8 |
| QA Depth self-test | PASS — 15/15 |
| AI DevKit lint | PASS — 5/5 |
| `git diff --check` | PASS; line-ending notices only |

The first multi-suite attempt failed because the isolated worktree did not have
its own `node_modules`, and CDS package resolution does not use `NODE_PATH` for
`@cap-js/attachments`. This was classified as a tooling issue. A temporary
local junction to the already installed dependency tree was used for
verification and is not part of the Git change.

## Simplicity review

Ponytail review: `Lean already. Ship.`

The implementation uses two small process-local maps and the existing provider
error path. It deliberately does not add a queue, retry loop, scheduler,
distributed lock, cache service, or database state.

## Pending live verification

- Merge the normal PR after fresh QA Depth Gate passes.
- Selectively deploy `idts-sap01-srv`; do not select the HDI deployer.
- Verify health and protected OData behavior.
- Run Classification, Handoff Summary, Smart Assign, then Similar Bugs
  sequentially.
- Confirm no more than four structured Z.AI calls per rolling minute reach the
  Gateway and that the next attempt shows safe local guidance instead of an
  upstream 429.
