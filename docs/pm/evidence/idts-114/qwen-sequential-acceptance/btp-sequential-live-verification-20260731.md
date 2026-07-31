# IDTS-114 SAP BTP Sequential AI Verification — 2026-07-31

## Baseline

- Git merge SHA: `f000ce170abf716ca18d7586f5e2ce0e5c1f8487`
- Pull request: `#244`
- SAP BTP service: `idts-sap01-srv`
- SAP BTP AppRouter: `idts-sap01-approuter`
- Selective deploy operation: `c11b7bdb-8c97-11f1-a4de-eeee0a9f8bc6`
- Structured model: `zai/glm-4.7-flash`
- Embedding model: `alibaba/qwen3-embedding-0.6b`
- Test role: PM / DonHV
- Controlled record: `BUG-0012`

No API key, token, cookie, prompt, raw provider response, private binding credential, or database URL is recorded here.

## Deployment verification

| Check | Result |
| --- | --- |
| `idts-sap01-srv` | `started`, `1/1` |
| `idts-sap01-approuter` | `started`, `1/1` |
| `/health` | HTTP `200` |
| Protected BugService metadata without token | HTTP `401` |
| AppRouter anonymous entry | HTTP `302` |
| HDI/database deploy | Not run |
| HANA schema/data change | None |

## Sequential browser verification

The flows were invoked one at a time after the service restart. Review-only dialogs were closed without Accept, Apply, Confirm Duplicate, or Assign.

| Order | Capability | Safe runtime result | Model | HTTP/result | Evidence |
| ---: | --- | --- | --- | --- | --- |
| 1 | Classification Suggestions | Real structured suggestions for five classification fields | `zai/glm-4.7-flash` | Provider metric `SUCCESS` | `classification-zai-success.png` |
| 2 | Handoff Summary | Dialog completed and audit persisted after the 500-character fix | `zai/glm-4.7-flash` | OData HTTP `200`; provider metric `SUCCESS` | `handoff-summary-after-storage-fix.png` |
| 3 | Smart Assign Explanation | AI-generated explanation returned for each Developer candidate | `zai/glm-4.7-flash` | Provider metric `SUCCESS`; sanitized runtime readback recorded in this report | Screenshot omitted because the dialog contains member email addresses |
| 4 | Similar Bugs | Candidate matching completed with one embedding batch | `alibaba/qwen3-embedding-0.6b` | Provider metric `SUCCESS` | `similar-bugs-qwen-success.png` |

## Rate-limit result

- The three structured ZAI calls completed sequentially within the configured local budget of four calls per model alias per rolling 60 seconds.
- Similar Bugs used a separate Qwen embedding-model budget.
- No exact HTTP `429` route response appeared in the recent Cloud Foundry logs for this verification sequence.
- The focused provider regression already proves that a fifth call within the configured window returns safe local `AI_RATE_LIMITED` before network I/O and does not immediately invoke OpenAI fallback.
- This control prevents a predictable burst from reaching the provider; it does not increase the upstream ZAI quota.

## Handoff persistence defect verification

The earlier live attempt had this sequence:

1. ZAI returned `BUG_SUMMARY` with provider status `SUCCESS`.
2. Sanitization truncated to 500 characters and then appended a marker, producing 512 characters.
3. HANA rejected `AiSuggestions.summary` with a 500-character maximum, and OData returned HTTP `500`.

After PR `#244`:

- Sanitized text, including `...[truncated]`, never exceeds the requested limit.
- The same Handoff action returned HTTP `200`.
- No new maximum-length error was present.

## No-mutation boundary

This verification did not perform Accept, Apply Classification, Confirm Duplicate, or Assign. It did not intentionally change:

- Bug status.
- Assignee.
- Next processor.
- Lifecycle history.
- Duplicate links.

## Remaining acceptance gap

IDTS-114 remains `In Progress` because the interactive Tester/Developer role matrix is still deferred. This evidence completes the DonHV PM/provider and rate-limit portion only.
