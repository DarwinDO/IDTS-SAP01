# IDTS-114 HANA Pool Acquisition Timeout Remediation

## Baseline

- Runtime baseline: `112a7356c1828736051002275c6c5ca604e498fa`
- Scope: SAP BTP CAP service only
- Data/schema migration: none
- Provider/model/key change: none

## Observed symptom

After an application rollout and idle period, the Smart Assign candidate read
failed before `explainSmartAssignment` could run. The scheduled email-outbox
operation independently showed the same CAP error:

```text
TimeoutError: ResourceRequest timed out
```

An isolated read-only CF task reached the first HANA read and failed with the
same timeout. The effective production CAP profile used a 1000 ms database
connection-acquisition boundary.

## Root cause and supported setting

CAP MCP documentation confirms that
`cds.requires.db.pool.acquireTimeoutMillis` controls how long the runtime waits
to fetch or establish a database connection. A one-second boundary is too
short for a cold HANA connection after an idle period.

The remediation sets only the production acquisition boundary to 10000 ms.
It does not change:

- pool minimum or maximum;
- CDS entities or HANA schema;
- SQL/CQN queries;
- transaction behavior;
- business validation;
- S3, Brevo, Qwen, OpenAI, or secrets.

## Red/green evidence

- Before remediation: the focused check failed because the production profile
  had no explicit safe acquisition timeout.
- After remediation: `IDTS-114 HANA pool checks: 4/4 PASS`.
- The focused check validates both the raw production declaration and the
  effective CAP production environment.
- Effective configuration readback:
  - database kind: `hana`;
  - acquisition timeout: `10000`;
  - committed credentials: absent.

## Acceptance still required

- Selectively deploy `idts-sap01-srv`; do not run the database deployer or
  broad `cds deploy`.
- Confirm service health and absence of new startup errors.
- Run a read-only candidate query after cooldown.
- Re-run Smart Assign in the BTP UI and confirm primary Qwen `SUCCESS`.
- Confirm no Bug status, assignee, next processor, or lifecycle-history
  mutation from opening/reviewing the explanation.
