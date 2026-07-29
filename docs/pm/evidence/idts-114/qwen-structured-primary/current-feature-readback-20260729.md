# IDTS-114 current Qwen feature audit readback

## Result

`PASS — primary Qwen technical acceptance; runtime stability still monitored`

A read-only SAP BTP task queried only safe audit fields from HANA:

- `featureType_code`
- `operationStatus`
- `modelAlias`
- `latencyMs`
- `createdAt`

No prompt, provider response, raw error, Bug content, user identity, secret or
private endpoint was read or stored.

## Latest safe audit summary

| Capability | Primary model | At least one feature-level SUCCESS | Latest observed condition |
| --- | --- | --- | --- |
| Similar Bugs | `alibaba/qwen3-embedding-0.6b` | PASS | Latest selected row: `SUCCESS`, 7,876 ms |
| Classification | `alibaba/qwen3.7-flash` | PASS | Latest selected row: `SUCCESS`, 33,140 ms |
| Handoff Summary | `alibaba/qwen3.7-flash` | PASS | Earlier `SUCCESS`, 19,932 ms; latest selected row is a safe provider error |
| Smart Assign Explanation | `alibaba/qwen3.7-flash` | PASS | Latest selected row: `SUCCESS`, 28,131 ms |

This satisfies the approved technical criterion that every capability produces
at least one real primary-model `SUCCESS` without fallback. It does not prove
that every future provider request will succeed. Handoff Summary still shows
intermittent provider availability, and the existing safe fallback remains
necessary.

## Closure boundary

IDTS-114 and IDTS-115 remain `In Progress` because the deferred
Tester/Developer member-owned browser role matrix is incomplete. This
readback must not be used to claim full multi-role acceptance.
