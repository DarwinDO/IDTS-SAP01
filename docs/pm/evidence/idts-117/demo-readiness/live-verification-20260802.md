# IDTS-117 SAP BTP demo-readiness live verification — 2026-08-02

## Baseline

- Source merge SHA: `67b1bf86169e9696c9365ef4846b99ffae30d4e2`.
- Selective MTA operation: `2a6a26e0-8e7a-11f1-830b-eeee0a9aaf82`.
- Selected modules: `idts-sap01-srv`, `idts-sap01-app-content`, and
  `idts-sap01-approuter`.
- Excluded: HDI deployer, migration runner, schema deployment, seed load, and
  database reset.

## Live result

`npm run btp:demo:check` completed with exit code `0`:

| Check | Result |
| --- | --- |
| CAP application | PASS — started `1/1` |
| AppRouter | PASS — started `1/1` |
| Liveness | HTTP `200` |
| Database readiness | HTTP `200` |
| Protected API without session | HTTP `401` |
| AppRouter web entry | HTTP `200` |
| Overall | `DEMO READY` |

The HANA start request used a temporary, non-secret UTF-8 JSON file without a
BOM. Cloud Foundry accepted the request; the file was removed immediately. No
credential, token, service key, private endpoint, or database content is stored
in this evidence.

## Remaining platform limitation

SAP BTP Trial and HANA Cloud Free Tier can auto-stop and do not provide an
always-on SLA. Run `npm run btp:demo:check` before work or review; run
`npm run btp:demo:prepare` only when the check reports that the demo is not
ready.
