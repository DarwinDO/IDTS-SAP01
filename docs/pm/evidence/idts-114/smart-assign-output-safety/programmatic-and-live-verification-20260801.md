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

## Remaining acceptance

After normal PR merge, selectively deploy only `idts-sap01-srv` at the exact
merge SHA. Open Smart Assign once on the same controlled Bug, verify that the
three validated provider explanations remain AI-generated, and cancel the
dialog. Do not assign a Developer or perform any unrelated workflow mutation.

Tester/Developer role-matrix acceptance remains deferred, so IDTS-114 stays
In Progress even if this focused PM check passes.
