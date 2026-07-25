# IDTS-97 Privacy-safe AI Operational Metrics Evidence

Date: 2026-07-24

Owner: SangVN

Branch: `feature/idts-97-ai-operational-metrics-sangvn`

Dependency baseline: IDTS-91/93 PR #167 head `aa62114`

## Implemented scope

- Provider operations emit allowlisted feature/operation/provider/model/status/outcome/latency logs.
- Metrics-sink failure is ignored and does not change the AI result or Bug workflow.
- Existing `AiSuggestions` audit rows persist normalized `operationStatus` and `latencyMs`.
- Duplicate detection, classification, handoff summary, and assignment explanation all persist feature-level evidence.
- PM-only `readAiOperationalMetrics(windowDays)` aggregates reliability and Accept/Reject/Ignore/Pending counts for a default 30-day, maximum 90-day window.
- No prompt, response, raw error, email, attachment content, endpoint, token, key, or credential is included in the new log or aggregate API.

## Safe aggregate sample

```json
{
  "featureTypeCode": "BUG_SUMMARY",
  "providerAlias": "mock",
  "modelAlias": "idts-97-model",
  "requestCount": 4,
  "successCount": 1,
  "failureCount": 3,
  "timeoutCount": 1,
  "unavailableCount": 1,
  "acceptedCount": 1,
  "rejectedCount": 1,
  "ignoredCount": 1,
  "pendingCount": 1,
  "latencySampleCount": 3,
  "averageLatencyMs": 15,
  "maxLatencyMs": 30
}
```

## Verification

| Command | Result |
| --- | --- |
| `npm run qa:idts97:programmatic` | 35 PASS / 0 FAIL |
| `npm run qa:idts64:programmatic` | 34 PASS / 0 FAIL |
| `npm run qa:idts65:programmatic` | 19 PASS / 0 FAIL |
| `npm run qa:idts66:programmatic` | 36 PASS / 0 FAIL |
| `npm run qa:idts67:programmatic` | 29 PASS / 0 FAIL |
| `npm run qa:idts68:programmatic` | 30 PASS / 0 FAIL |
| `npm run qa:idts69:programmatic` | 6 PASS / 0 FAIL |
| `npm run qa:idts71:programmatic` | 31 PASS / 0 FAIL |
| `npm run qa:idts91:programmatic` | 19 PASS / 0 FAIL |
| `npm run qa:idts93:programmatic` | 35 PASS / 0 FAIL |
| `npx cds compile srv --to edmx -s all` | PASS |
| `npm run qa:secret-scan` | PASS |
| `node --check` on changed runtime/test JavaScript | PASS |
| `git diff --check` | PASS |

Focused and regression total: **274 PASS / 0 FAIL**.

## Failure simulation

- A synthetic logger throws during metric emission.
- The provider still returns `SUCCESS` with normal response data.
- The aggregate excludes missing latency instead of coercing it to zero.
- A Tester identity receives HTTP 403 for the PM-only aggregate.

## Known limitations

- Operational rows follow existing `AiSuggestions` retention; IDTS-97 does not add a purge job.
- The API reporting window is capped at 90 days.
- Local Node `v24.13.0` is outside the repository engine range `>=20 <23`; all listed checks still passed.
- `npm ci` reported 21 existing transitive audit findings. No force upgrade was attempted in this task.
- OfficeCLI is unavailable, so Markdown evidence and mirrors were verified with repository diff/check commands only.
- CAP MCP post-change `search_model` returned a stale baseline for this worktree; generated metadata, in-memory deployment, and runtime tests are the authoritative verification.
- Knowledge Gate is explicitly deferred by SangVN; no merge or Jira Done transition is allowed until that policy evidence is completed.
