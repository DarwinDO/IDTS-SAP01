# IDTS-113 — Isolated SAP BTP Cloud Foundry POC

- Owner: DonHV
- Status: In Progress — deployed and smoke-tested; PR/review pending
- Due date: 2026-07-29
- Jira: https://dutassociation.atlassian.net/browse/IDTS-113

## Scope

Deploy an isolated copy of IDTS to the SAP BTP Trial Cloud Foundry `dev`
space. The POC uses SAP HANA Cloud and a dedicated HDI container. It does not
migrate Render PostgreSQL data, copy Render/Brevo/AWS/OpenAI credentials, or
change the Render Shared QA deployment.

## Implementation

- Production CAP profile uses `@cap-js/hana`.
- Integration profile continues to use PostgreSQL for Render.
- BTP attachment storage uses the isolated database-backed provider; the
  Render integration profile keeps its existing object-store configuration.
- The MTA contains one CAP service module, one HDI deployer, and one
  `hdi-shared` resource.
- The existing custom authentication implementation is retained for the POC.
  XSUAA/AppRouter migration remains a separate architectural decision.
- The current Fiori webapp is packaged under the path already served by the
  project `server.js`.

## Verification

- HANA Cloud `hana-free`: create succeeded.
- HDI `hdi-shared`: create succeeded and bound to the CAP app/deployer.
- MTA deployment: succeeded.
- CAP app: started, 1/1 instance.
- Health, login page, and AuthService metadata: HTTP 200.
- Anonymous BugService metadata: HTTP 401.
- Temporary-seed authenticated smoke:
  login 200, protected OData read 200, logout 200, revoked token 401.
- Temporary password environment variables were removed after the smoke.
- Local regression: auth 28/28, code-list/authorization 18/18, comments
  persistence PASS, CAP compile PASS, UI5 build PASS, secret scan PASS,
  agent-rule check PASS, QA Depth self-test 15/15, AI DevKit 5/5.
- Profile check: production=`hana`, integration=`postgres`, and the
  Render-effective `production+integration` environment remains `postgres`.

## Known limitations

- The POC uses custom auth and does not yet integrate XSUAA/AppRouter.
- No reusable POC user password is published or committed.
- Email and live OpenAI remain disabled; no external provider secrets were
  copied.
- Attachments remain isolated in HANA for this POC; AWS S3 is not copied.
- Baseline dependency audit remains open under IDTS-46.
- CAP build still reports the existing attachment
  `NonUpdateableProperties` annotation warning.

## Rollback

Undeploy the MTA, delete its HDI service if requested, then delete the isolated
HANA Cloud instance. Render Shared QA requires no rollback because it was not
modified.
