# IDTS-122 Priority 2B deployment and acceptance — 2026-08-06

## Baseline

- Runtime validation PR: `#298`.
- Runtime validation merge SHA: `40a5b00314caf0f2ee71ee2d18541c4227e523ea`.
- Classification catalog PR: `#299`.
- Catalog/deploy SHA: `050ffeed07f9a901dcdee6da96db3dc9b37871fa`.
- Accepted MTAR SHA-256: `7DB911D119D89ED7643C40DD2E3D301B8F3697D3BDA9086F48DB3AF7155B51CE`.
- Cloud Foundry operation: `247a06ef-913f-11f1-9066-eeee0a8e28f9`.
- Selected deployment module: `idts-sap01-srv` only.

## Database safety and readback

The catalog transaction was additive and completed before this deployment:

| Object | Before | After |
| --- | ---: | ---: |
| Application Components | 7 | 8 |
| Defect Categories | 8 | 8 |
| Component / category pairs | 13 | 31 |
| Developer Responsibilities | 30 | 38 |
| Bugs | 6 | 6 |
| Users | 14 | 14 |
| Developer Profiles | 12 | 12 |

The approved business-data diff was exactly `1 / 18 / 8`: one AI Application Component, eighteen component/category pairs and eight Developer Responsibility rows. The transaction performed no update or delete. No seed, HDI deployer, broad `cds deploy`, table-data import or schema migration was used.

After the service rollout, read-only Cloud Foundry task `idts122-postdeploy-readonly-1785983850` emitted `IDTS122_POSTDEPLOY_READ_ONLY` with the exact `8/8/31/38/6/14/12` counts and `mutation:false`.

The first readback task, task `79`, failed in the shell before opening a HANA query because the inline command contained unescaped parentheses. It made no database connection or mutation. Task `80` is the accepted post-deployment readback.

## Deployment readiness

Fresh `npm run btp:demo:check` after deployment reported:

| Check | Result |
| --- | --- |
| HANA / HDI readiness | HTTP 200 through `/ready` |
| CAP | `1/1`, requested state started |
| AppRouter | `1/1`, requested state started |
| `/health` | HTTP 200 |
| `/ready` | HTTP 200 |
| Protected API without session | HTTP 401, expected |
| Web entry | HTTP 200 |

The rollout did not select `idts-sap01-db-deployer`, AppRouter, seed data or schema migration.

## Exact-SHA verification

The following suites passed from the detached exact-SHA worktree:

- `qa:idts122:classification-catalog`: approved 8/8/31 matrix, deterministic IDs, 8 AI responsibility rows, exact `1/18/8` additive plan, rehearsal rollback, idempotence and identity preservation.
- `qa:idts122:programmatic`: 53/53.
- `qa:idts122:closed`: PASS.
- `qa:idts122:dashboard`: 10/10 combined static/runtime checks.
- `qa:idts41:programmatic`: 26/26, including inactive Application Component and Defect Category rejection without persistence.
- `qa:draft-reporter:programmatic`: 10/10.
- Secret scan: PASS.
- Agent rules: PASS.
- QA Depth self-test: 15/15.
- `git diff --check`: PASS.

## Acceptance disposition

| Requirement | Disposition | Evidence |
| --- | --- | --- |
| Eight Application Components | PASS | Exact source validation and HANA readback |
| Eight Defect Categories | PASS | Exact source validation and HANA readback |
| Thirty-one unique active pairs | PASS | Matrix validator, rollout rehearsal and HANA readback |
| AI component has CAP Backend, Integration, Performance and Data Quality | PASS | Source fingerprint validator and responsibility catalog test |
| Eight AI responsibility rows | PASS | Catalog test and HANA readback total 38 |
| Inactive parent master data rejected safely | PASS | IDTS-41 26/26 |
| Existing Bugs/Users/Profiles preserved | PASS | Pre/post counts, ID fingerprints and post-deploy readback |
| Signed-in value-help and Smart Assign visual acceptance | BLOCKED — browser-control tooling | Connected Edge timed out while the automation layer attempted to claim/list the already signed-in tab. No UI action was repeated blindly and no application mutation was made. |
| Canonical six-Bug repo fixture synchronized from approved recovery package | BLOCKED — provenance unavailable | HANA contains the approved six-Bug runtime baseline, but the private approved package hash/source needed to replace the four legacy repo seed rows is not available in the current worktree. No fixture was fabricated. |

Priority 2B is therefore **runtime and database accepted, with browser visual evidence and canonical fixture provenance still partial**. These two limitations must not be represented as full browser or seed synchronization PASS.

## Tooling and security notes

- The exact-SHA MTA build reported the existing dependency-audit baseline (26 root findings, 7 production-service findings, 9 UI findings and 5 AppRouter findings). No dependency or lockfile mutation was made in this workstream.
- CAP compile continued to warn about the existing attachment `NonUpdateableProperties` annotation. Attachment authorization is outside this workstream.
- A read-only script-discovery command initially used an invalid regular expression. It was replaced with `Select-String`; no source or runtime state changed.
- Two independent final reviewers from the previous bounded review window did not return a usable report and were closed. Their unfinished conclusions are not counted as approval.

