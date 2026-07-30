# IDTS-114 Smart Assign response-budget verification

Date: 2026-07-30
Owner: DonHV
Baseline: `0b6e5f611613ab3c84e6af457ad2f1aad51a749b`
Branch: `fix/idts-114-smart-assign-timeout-donhv`

## Observed failure

The SAP BTP PM browser run returned HTTP 504 at approximately 30 seconds while HANA later recorded a successful Qwen `ASSIGNMENT_EXPLANATION` result with latency `30,495 ms`. The Bug status, assignee, next processor, history and duplicate links did not change.

## Minimal correction

- Smart Assign now supplies a 24-second internal structured-provider deadline.
- The deadline is shared by Qwen compatibility work and the one allowed OpenAI fallback; retries do not receive a new timeout window.
- A deadline abort is not fallback-eligible and immediately returns the existing deterministic candidate explanation.
- Fast HTTP 5xx may still use one fallback while deadline time remains.
- Smart Assign sends at most ten candidates and a compact workload allowlist.
- No OData contract, CDS entity, HANA schema, provider model, key, role or workflow behavior changed.

## Red/green evidence

Before the fix, the new provider checks failed because the 10 ms feature deadline was ignored: Qwen and OpenAI were both attempted and the operation took about 92 ms. The Smart Assign suite also failed because the expected 24-second feature budget did not exist.

After the fix:

| Verification | Result |
| --- | --- |
| `npm run qa:idts114:programmatic` | PASS — 58/58 |
| `npm run qa:idts69:programmatic` | PASS — 9/9 |
| Feature-deadline synthetic check | PASS — primary only, `AI_TIMEOUT`, about 21 ms |
| Fast HTTP 5xx bounded fallback | PASS — one OpenAI fallback inside remaining deadline |
| IDTS-64/66/67/68/71/74/75/76/115 regressions | PASS |
| Secret scan, agent rules, QA-depth self-test | PASS |
| CAP compile for AuthService and BugService | PASS; known attachment vocabulary warning only |
| AI DevKit | PASS — 5/5 |
| `git diff --check` | PASS; line-ending notices only |
| Ponytail simplicity review | `Lean already. Ship.` — no new dependency, queue, schema or retry framework |

## Remaining acceptance

The code still requires a selective SAP BTP service deployment and one PM Smart Assign browser retry. Acceptance requires no HTTP 504, a safe Qwen or deterministic response before the AppRouter boundary, and unchanged Bug workflow state. Tester/Developer role evidence remains deferred, so IDTS-114 and IDTS-115 stay In Progress.
