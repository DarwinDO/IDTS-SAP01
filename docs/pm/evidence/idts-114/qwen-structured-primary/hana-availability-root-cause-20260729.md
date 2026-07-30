# IDTS-114 HANA Availability Root-Cause Correction

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

## Root cause

The initial timeout hypothesis was falsified:

- the selectively deployed 10-second boundary still ended in `TimeoutError`;
- a task-local 30-second boundary also ended in `TimeoutError`;
- the existing `hdb` driver then returned sanitized SAP HANA code `1890`;
- SAP's official SQL error catalog identifies `1890` as
  `ERR_URS_INSTANCE_STOPPED`;
- HANA Cloud Central independently showed `idts-113-hana-cloud-poc` as
  `Stopped`.

Therefore the common Smart Assign and email-outbox symptom was caused by a
stopped HANA Free Tier instance, not by the CAP acquisition boundary or an
application query.

## Recovery evidence

- HANA Cloud Central start action moved the instance from `Stopped` through
  `Starting`.
- After the instance became available, a read-only BTP task read one Bug in
  `340 ms`.
- A second read-only task explicitly restored the original
  `acquireTimeoutMillis=1000` value and passed in `262 ms`.
- Both tasks returned only success/elapsed metadata; no Bug data, credential,
  provider payload or private endpoint was logged.
- No data or schema write was performed.

The 10-second configuration and its configuration-only test are removed
because the original one-second boundary was sufficient for both verified
read-only BTP probes after HANA restarted. This does not claim coverage of
every future cold-start condition. The investigation history remains recorded
in Git and this evidence file.

## Acceptance still required

- Selectively deploy `idts-sap01-srv`; do not run the database deployer or
  broad `cds deploy`.
- Confirm service health and absence of new startup errors.
- Run a read-only candidate query after deploying the cleanup.
- Re-run Smart Assign in the BTP UI and confirm primary Qwen `SUCCESS`.
- Confirm no Bug status, assignee, next processor, or lifecycle-history
  mutation from opening/reviewing the explanation.
