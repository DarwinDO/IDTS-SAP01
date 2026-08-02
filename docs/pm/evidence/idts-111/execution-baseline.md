# IDTS-111 SAP BTP UAT execution baseline — 2026-08-02

## Approval and catalog

- DonHV approved the 90-case English-only catalog for human execution.
- Catalog: `docs/qa/idts-111-uat-catalog.json`.
- Catalog source baseline: `447da1dab80418847d806040e6b2060b0916cb63`.
- Catalog merge commit on `origin/dev`: `6f01affc2c2945e51d18199137c8a89a20c77600`.
- Pull request: <https://github.com/DarwinDO/IDTS-SAP01/pull/261>.
- Execution truth at publication: 90 `PREPARED`, 0 executed, 0 passed, 0 failed, 0 blocked.

Catalog approval authorizes assigned members to execute cases. It does not approve any result, workbook, mentor sign-off, or Drive synchronization.

## Deployed runtime

- SAP BTP runtime source SHA: `67b1bf86169e9696c9365ef4846b99ffae30d4e2`.
- Selective MTA operation: `2a6a26e0-8e7a-11f1-830b-eeee0a9aaf82`.
- Deployed modules: CAP service, application content, and AppRouter.
- Excluded: HDI deployer, migration runner, schema deployment, seed load, and database reset.

A scoped Git comparison found no change in `app/`, `srv/`, `db/`, `mta.yaml`, `xs-security.json`, `package.json`, or `package-lock.json` between the deployed runtime SHA and the catalog source baseline. The later catalog merge is documentation/QA-only. Therefore a runtime redeployment is not required before UAT execution.

## Fresh readiness result

`npm run btp:demo:check` completed at `2026-08-02T23:06:59+07:00` with exit code `0`.

| Check | Result |
| --- | --- |
| CAP application | PASS — started 1/1 |
| AppRouter | PASS — started 1/1 |
| Liveness | HTTP 200 |
| Database readiness | HTTP 200 |
| Protected API without session | HTTP 401, expected |
| AppRouter web entry | HTTP 200 |
| Overall | `DEMO READY` |

SAP BTP Trial and HANA Cloud Free Tier may auto-stop. Each execution session must run `npm run btp:demo:check` first. If it is not ready, DonHV runs the bounded `npm run btp:demo:prepare` recovery before any case continues.

## Execution rules

1. Execute only cases assigned in `execution-assignment.md` with the member's own SAP identity.
2. Record actual result, timestamp, role, catalog merge SHA, runtime SHA, and PASS/FAIL/BLOCKED truth.
3. Capture at least one case-specific image. Multi-step, persistence, authorization, or error cases require the before/after, reload, Network, or safe-error evidence stated by the catalog.
4. Store selected sanitized evidence under `docs/pm/evidence/idts-111/uat/<case-id>/`.
5. Never store passwords, tokens, cookies, API keys, database URLs, private endpoints, full private email addresses, or raw AI payloads.
6. A case remains `PREPARED` until DonHV reviews its actual result and evidence. Agents cannot approve or execute on behalf of a member.
7. Do not generate UAT EN v0.3 or update Google Drive until reviewed execution is complete.

## Known limitation

The readiness result is a point-in-time platform check, not an always-on SLA. A later platform auto-stop is an environment blocker and must not be reported as a product-test failure without diagnosis.
