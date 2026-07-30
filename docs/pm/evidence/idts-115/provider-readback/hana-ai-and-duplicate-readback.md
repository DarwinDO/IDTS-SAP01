# Sanitized HANA readback

Date: 2026-07-29  
Task: `idts115-readback-r2-20260729`  
CF task ID: `37`  
Task state: `SUCCEEDED`

## Duplicate persistence

HANA returned one relationship from controlled QA Bug `BUG-0019` to `BUG-0020`:

| Relation | Value |
| --- | --- |
| Source Bug ID | `19567605-6e37-4524-9b40-e499fd625de9` |
| Target Bug ID | `330480e8-299e-4540-a71e-ded3840d184c` |
| Type | `DUPLICATE` |
| Created at | `2026-07-29T09:34:14.049Z` |

## Latest provider audit

| Capability | Operation | Model alias | Latency | Review |
| --- | --- | --- | ---: | --- |
| Similar Bugs | `AI_PROVIDER_ERROR` | `alibaba/qwen3-embedding-0.6b` | 1347 ms | ACCEPTED |
| Similar Bugs | `SUCCESS` | `alibaba/qwen3-embedding-0.6b` | 6982 ms | PENDING |
| Classification | `AI_PROVIDER_ERROR` | `alibaba/qwen3.7-flash` | 1659 ms | ACCEPTED |
| Smart Assign | `AI_PROVIDER_ERROR` | `alibaba/qwen3.7-flash` | 1936 ms | ACCEPTED |
| Handoff Summary | `AI_PROVIDER_ERROR` | `alibaba/qwen3.7-flash` | 1107 ms | ACCEPTED |
| Similar Bugs | `SUCCESS` | `alibaba/qwen3-embedding-0.6b` | 6586 ms | PENDING |

Additional recent rows preserve the same pattern: structured Qwen operations are safe fallback/provider-error outcomes, while two embedding operations succeeded.

## Interpretation

- Duplicate persistence: PASS.
- Similar Bugs Qwen embedding primary: PASS observed.
- Qwen structured primary for Classification, Handoff and Smart Assign: NOT PASS in this browser run.
- Safe fallback and review persistence: PASS.

The failed first task `idts115-readback-20260729` was a shell-quoting tooling error. It created no data. The corrected task used the bound application database context and emitted only the fields shown above.
