# IDTS-114 SAP BTP browser live acceptance — 2026-07-31

## Baseline

- Runtime merge SHA: `5807313f232db91acc55c1f6aca6378891044b1`
- Application: SAP BTP AppRouter and `idts-sap01-srv`
- Test Bug: `BUG-0011`
- Role: DonHV / PM
- Browser: authenticated Edge session controlled through the Chrome integration
- Database: SAP HANA Cloud, restored from stopped state before this run

No review decision, classification apply, duplicate confirmation, assignment,
draft save, or lifecycle action was executed during this acceptance run.

## Sequential result

| Order | Capability | UI result | Safe HANA audit result | Verdict |
| ---: | --- | --- | --- | --- |
| 1 | Classification Suggestions | Five fields received field-specific values, reasons, and confidence values from 45% to 70%. No safety fallback was shown. | `CLASSIFICATION`, `SUCCESS`, `openai/gpt-5.4-nano`, 3101 ms, `PENDING` | PASS |
| 2 | Handoff Summary | Grounded advisory summary, risks/missing information, comment insights, verified source comments/history, and next expected action were displayed. | `BUG_SUMMARY`, `SUCCESS`, `minimax/minimax-m2.5`, 10300 ms, `PENDING` | PASS |
| 3 | Smart Assign Explanation | Candidate loading succeeded. One candidate received an AI-generated explanation with 90% confidence; two candidates retained rules-based guidance. | `ASSIGNMENT_EXPLANATION`, `SUCCESS`, `zai/glm-4.7-flash`, 4328 ms, `PENDING` | PARTIAL — provider call passed, candidate coverage needs improvement |
| 4 | Similar Bugs | Five candidates were returned. `BUG-0012` matched at 100% as a likely duplicate; the other candidates had lower related scores. | `DUPLICATE_DETECTION`, `SUCCESS`, `alibaba/qwen3-embedding-0.6b`, 1746 ms, `PENDING` | PASS |

## Rate-limit and safety observations

- No HTTP 429 occurred in the four sequential calls.
- No fallback model was used in this run.
- No HTTP 5xx, raw provider error, SQL text, token, credential, or private
  endpoint was shown in the UI.
- Every suggestion remained in `PENDING`; no review or business mutation was
  performed.
- The Smart Assign finding is a quality/coverage issue, not a transport or
  authorization failure: the HANA audit records `SUCCESS`, but only one of
  three candidates received model-generated prose.

## Database availability incident

Before the acceptance run, `/odata/v4/auth/me()` timed out because the SAP HANA
Cloud database service was stopped. A direct `hdb` probe returned HANA error
code `1890`. The database was started through the SAP-supported service update
and a read-only Cloud Foundry task subsequently returned `DB_PROBE_OK` for
`SELECT 1 FROM DUMMY`. No HDI deployment, schema change, seed load, or data
reset was performed.

## Evidence limitations and remaining work

- This run covers the PM browser role only.
- Tester and Developer role evidence remains deferred.
- Smart Assign should be improved so every eligible candidate is mapped to an
  explicit AI explanation or an explicit per-candidate model omission reason.
- IDTS-114 remains `In Progress`; this evidence does not claim full role-matrix
  acceptance.
