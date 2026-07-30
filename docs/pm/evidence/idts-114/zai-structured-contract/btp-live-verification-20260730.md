# IDTS-114 Z.AI structured contract BTP verification — 2026-07-30

## Baseline and rollout

- PR: `#237`
- Merge SHA: `4dada2eb198d139bdab5e50b0102b540102406c3`
- Runtime: `idts-sap01-srv`
- Deployment scope: CAP service application only
- Database deployer / broad `cds deploy`: not run
- Health: HTTP 200
- Protected OData without authentication: HTTP 401

The first focused `cf push --no-route` removed the existing direct application
route from the app. The same previous hostname was immediately mapped back and
health/authentication checks passed. No HANA schema or business data changed.

## PM browser verification

The connected authenticated browser reloaded `BUG-0011` after deployment and
created fresh suggestions. Existing stored suggestions were not treated as
evidence for the new contract.

| Capability | Actual result |
| --- | --- |
| Classification | PASS. All five rows were returned as AI suggestions. Suggested values included Financial Accounting, IDTS Fiori UI and Integration with feature-specific reasons and confidence values from 80% to 95%. The rows no longer displayed `Rules-based baseline`. |
| Smart Assign | PASS for eligible candidates. CAP Developer 01 and SangVN received candidate-specific AI explanations grounded in availability, criticality, open workload and overdue workload. The UI displayed `AI-generated explanation` with confidence. The unavailable backup candidate remained rules-based because no accepted AI explanation was returned for that candidate. |
| No mutation | PASS. Smart Assign was opened only for review. No candidate was assigned. The temporary edit draft was discarded and the active Bug was not saved or changed. |

## Interpretation

The earlier screenshots showed stored suggestions generated before PR #237.
Deploying a new backend does not rewrite historical suggestion records. A fresh
feature action is required to observe the feature-specific structured contract.

IDTS-114 remains In Progress because the deferred Tester/Developer role matrix
is still outstanding.

## Security

This record contains no key, password, token, cookie, database URL, private
binding credential, raw prompt or raw provider response.
