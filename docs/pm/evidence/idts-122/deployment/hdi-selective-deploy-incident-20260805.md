# IDTS-122 selective HDI deployment incident — 2026-08-05

## Scope and frozen baseline

- Exact merged source SHA: `6b812f711e947a68b475d052b53c436efc94fd2b`.
- Temporary deployer: `idts-sap01-idts122-deployer` (stopped, no route).
- Intended deploy set:
  - `src/gen/idts.cap.Bugs.hdbtable`
  - `src/gen/BugService.Bugs_drafts.hdbtable`
- No broad `cds deploy`, database seed command, IDTS-122 backfill/DML, CAP service deployment, or UI deployment followed the incident.

## Verified before/after state

| Check | Before | After |
| --- | ---: | ---: |
| Active Bugs | 26 | 4 |
| Draft Bugs | 6 | 6 |
| Active `RETESTOWNER_ID` column | Missing | Present, nullable |
| Draft `RETESTOWNER_ID` column | Missing | Present, nullable |

The pre-deploy read-only count was produced by Cloud Foundry task `idts122-precount-184343`. The post-deploy read-only schema/count result was produced by task `idts122-postschema-184923`.

## Incident evidence

Selective HDI task `idts122-hdi-two-table-184832` exited successfully and reported two explicitly scheduled deploy files and zero explicitly scheduled undeploy files. During dependency processing, HDI also redeployed the existing dependent artifact:

```text
src/gen/data/idts.cap-Bugs.hdbtabledata$0.expand
```

That artifact imported the four repository seed Bug rows into the active Bugs table. The verified active-row count therefore changed from 26 to 4. The draft row count remained 6.

## Immediate containment

- Stopped the rollout after the first post-deploy readback.
- Did not run another HDI task.
- Did not run the IDTS-122 backfill or lifecycle action-list DML.
- Did not deploy the CAP service or AppRouter/UI for IDTS-122.
- Kept the temporary deployer stopped so its task logs remain inspectable while evidence is being preserved.

## Recovery constraints

- The SAP HANA Cloud instance uses the free-tier/trial license. SAP documents that backup and recovery are not available for free-tier instances.
- A whole-instance restore must not be attempted without explicit DonHV approval and, on this license, is not expected to be available.
- Any cross-database recovery must first prove an authoritative source, record identity, child-record consistency, and a deterministic transactional import plan.
- No recovery mutation is authorized by this evidence record.

## Current recovery investigation

1. Inspect the former PostgreSQL source in a read-only transaction and compare active Bug identities/counts.
2. Verify related comments, attachments, history, duplicate links, notifications, AI suggestions, and ownership references for the missing Bugs.
3. Build a missing-record manifest and collision report; do not overwrite the four current HANA rows.
4. Obtain DonHV approval for the exact recovery set and rollback strategy before any write.

## Security

This record intentionally omits credentials, private endpoints, service-binding values, HDI schema identifiers, user emails, provider payloads, and business-row contents.
