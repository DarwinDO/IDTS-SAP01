# IDTS-114 Handoff audit storage-bound evidence — 2026-07-31

## Baseline

- Runtime merge SHA: `809f963376467c7542665991b54de3bd0daea955`
- SAP BTP service: `idts-sap01-srv`
- Structured model: `zai/glm-4.7-flash`
- Browser role: PM (DonHV)
- Test Bug: `BUG-0012`

## Observed result

1. Classification completed with real AI suggestions.
2. Handoff Summary invoked `summarizeBugHandoff`.
3. Safe runtime metrics recorded `BUG_SUMMARY`, model
   `zai/glm-4.7-flash`, status `SUCCESS`.
4. The OData action then returned HTTP 500 while inserting the audit record.
5. HANA reported that `AiSuggestions.summary : String(500)` received a value
   longer than 500 characters.

No prompt, provider response body, credential, cookie, private endpoint or
database connection value is included in this evidence.

## Root cause

`redactSensitiveText(text, 500)` sliced the source text to 500 characters and
then appended the truncation marker. The result was 512 characters, so the
sanitization helper did not honor the storage limit its caller requested.

## Red/green verification

- Before correction: IDTS-64 `38 PASS / 2 FAIL`; observed length `512`,
  expected `500`.
- After correction: IDTS-64 `40 PASS / 0 FAIL`; returned length is exactly
  `500` and retains `...[truncated]`.

## Acceptance still required

- Run IDTS-68 and IDTS-71 regressions.
- CAP compile and repository gates.
- Normal PR merge without bypass.
- Selective service deploy; no HDI deployer or broad `cds deploy`.
- Repeat Handoff Summary on SAP BTP and confirm HTTP 200 plus persisted audit.
