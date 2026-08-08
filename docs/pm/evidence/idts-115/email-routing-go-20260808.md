# IDTS-115 Shared QA email-routing GO — 2026-08-08

## Approval and boundary

DonHV supplied the exact approval phrase `GO EMAIL ROUTING` after the read-only
recipient and routing audit. This operation changes only the existing private
SAP BTP user-provided service configuration. It does not change source code,
the CDS model, HANA schema or business data.

No credential, full recipient address, provider message ID, private endpoint or
authenticated Cloud Foundry account identifier is stored in this evidence.

## Sanitized change

```diff
- email.testMode: true
+ email.testMode: false
```

The existing SMTP/Brevo provider fields and `defaultTestRecipient` were
preserved. The default test recipient remains available only as rollback
configuration and is no longer selected for newly created delivery snapshots
while test mode is false.

## Execution result

| Check | Result |
| --- | --- |
| Precondition | PASS — email enabled, previous `testMode=true`, default test recipient configured |
| UPS update/readback | PASS — `email.testMode=false` |
| Credential shape | PASS — preserved |
| Default test recipient | PASS — preserved without printing the value |
| CAP restart | PASS — restarted only `idts-sap01-srv`; no restage or artifact deployment |
| CAP instances | PASS — `1/1` running |
| `/health` | HTTP 200 |
| `/ready` | HTTP 200; read-only HANA readiness probe |
| Effective app environment | PASS — binding present, email enabled, SMTP default, required provider fields configured, `testMode=false` |
| Secret handling | PASS — no secret value printed or committed |

No send-smoke, historical delivery replay, bulk email, SQL, seed, schema
migration, `cds deploy`, HDI deployer or database mutation command was run.
Existing delivery rows were not rewritten. Routing for a new notification still
follows the mappings audited in `srv/bug-service/history.js`; statuses without
a producer remain unchanged.

## Tooling observations

The first update command was rejected locally before execution because it
combined the operation with recursive temporary-directory cleanup. The retry
used one uniquely named temporary file and exact-file cleanup; Cloud Foundry
then accepted the update.

The first one-off runtime config task failed with a JavaScript `SyntaxError`
caused by Cloud Foundry command transport before the config module ran. It did
not connect to the database or call the provider. No further task retry was
made. Effective `VCAP_SERVICES` was verified read-only through the Cloud Foundry
v3 app-environment endpoint instead.

## Rollback

If DonHV requests rollback, change only:

```diff
- email.testMode: false
+ email.testMode: true
```

Then restart only `idts-sap01-srv` and repeat the same sanitized binding,
instance, `/health` and `/ready` checks. Do not replay delivery rows.
