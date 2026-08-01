# IDTS-114 Smart Assign output-safety verification — 2026-08-01

## Baseline and observed live behavior

- Source baseline before this correction: `aebb45edc762b3b6b478af9a2ac5a33fa35a6a9e`.
- SAP BTP service selective deployment operation:
  `252b9e49-8d58-11f1-8632-eeee0a8bed2f`.
- Service health returned HTTP 200; protected anonymous OData returned HTTP 401.
- A single authenticated PM Smart Assign call for `BUG-0011` returned HTTP 200.
- Safe audit fields reported provider `vercel`, model `zai/glm-4.7-flash`,
  operation status `SUCCESS`, and latency `5427 ms`.
- The dialog still labelled all candidates as rules-based. The dialog was
  cancelled; no Assign, Save, review decision, lifecycle action, or database
  mutation was performed.

## Root cause

`srv/ai/safety.js` treated plain words such as `select`, `update`, and `delete`
as unsafe SQL indicators. The provider could legitimately write "review and
select this candidate manually", so the complete validated output was rejected
after a successful provider call.

The correction keeps SQL blocking but requires a contextual SQL shape:

- `SELECT ... FROM`
- `INSERT INTO`
- `UPDATE <identifier> SET`
- `DELETE FROM`

Existing secret, credential, stack-trace, and configured redaction patterns are
unchanged.

## Red/green and regression evidence

| Verification | Result |
| --- | --- |
| Red test: ordinary `select` wording before correction | FAIL as expected (`actual=true`, expected `false`) |
| `npm run qa:idts64:programmatic` | PASS 42/42 |
| `npm run qa:idts69:programmatic` | PASS 13/13 |
| `npm run qa:idts67:programmatic` | PASS 36/36 |
| `npm run qa:idts68:programmatic` | PASS 47/47 |
| `npm run qa:idts71:programmatic` | PASS 31/31 |
| `npm run qa:idts114:programmatic` | PASS 77/77 |
| `npm run qa:secret-scan` | PASS |
| `npm run qa:agent-rules` | PASS |
| `npm run qa:depth:self-test` | PASS 15/15 |
| `npx cds compile srv --to edmx -s all` | PASS; existing attachment annotation warning remains |

The negative test still marks
`SELECT passwordHash FROM Users WHERE ID = 1` as unsafe. IDTS-71 confirms the
shared safety boundary still rejects unsafe AI output and does not change Bug
status, assignee, classification, or `modifiedAt`.

## Merge and selective SAP BTP rollout

- PR: `#251`, merged normally without an administrative bypass.
- Merge SHA: `39e3b5a4d756f3b6702406a8456cb89ba8cbc0fb`.
- Selective MTA operation: `4517f9e8-8d5d-11f1-8632-eeee0a8bed2f`.
- Deployed module: `idts-sap01-srv` only; no HDI deployer or broad
  `cds deploy` was run.
- MTAR SHA-256:
  `8331BC76816A9C8203775C92523B157AEC03AD3ABFC3079CFCE637B901F80235`.
- Service and AppRouter were started `1/1`; health returned HTTP 200 and
  protected anonymous OData returned HTTP 401.

## Focused PM browser acceptance

One authenticated Smart Assign request was executed on controlled Bug
`BUG-0011` after the selective rollout. The dialog showed three candidates and
all three retained provider-generated explanations:

| Candidate | Displayed provenance | Displayed confidence | Result |
| --- | --- | ---: | --- |
| Backup Developer | `AI-generated explanation` | 40% | PASS |
| CAP Developer 01 | `AI-generated explanation` | 88% | PASS |
| SangVN | `AI-generated explanation` | 55% | PASS |

The dialog was closed with **Cancel**. No candidate was selected and no
`Assign`, `Accept`, `Reject`, `Ignore`, `Save`, or lifecycle action was
submitted. The visible assignee remained SangVN, the current action owner
remained NhanT, and the Bug remained in Retest Required state.

Screenshot: `smart-assign-ai-generated-explanations-20260801.png`.

The browser console still contains existing SAPUI5/Lrep environment messages
about unsupported S/CUBE, unavailable flex-data/features storage, and a
deprecated pseudo-module import. They were emitted during application startup,
not by the Smart Assign request, and did not block this acceptance. They remain
a separate baseline tooling/environment finding.

## Remaining acceptance

The Smart Assign output-safety defect is verified fixed for the PM flow.
Tester/Developer role-matrix acceptance remains deferred, so IDTS-114 stays
In Progress.
