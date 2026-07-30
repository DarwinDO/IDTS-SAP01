# IDTS-114/115 SAP BTP runtime rollout — 2026-07-30

## Baseline

- `origin/dev` merge commit: `5476479312986412739fbff3cfa6da29acc7905d`.
- Runtime: `idts-sap01-srv`.
- AppRouter: `idts-sap01-approuter`.
- Scope: deploy the already-merged Qwen request-bounding, Smart Assign deadline and AI-review UI fixes. No business test data, HANA schema or provider configuration was changed.

## Build and rollout evidence

| Item | Result |
| --- | --- |
| MTAR | `idts-sap01_1.0.0.mtar` |
| MTAR SHA-256 | `566E55E10601C5C0C541850E5E9D23DF911FD42E2AEB44A823202ED1A73375D4` |
| Application-content MTA operation | `f2a0ba6d-8be4-11f1-82db-eeee0a91e4f4` — PASS |
| Runtime MTA operation | `43705495-8be6-11f1-bda2-eeee0a8ff2ce` — PASS |
| Database deployer / HDI deployment | Not selected; not run |
| Broad `cds deploy` | Not run |

## Deployment boundary

The runtime operation targeted `idts-sap01-srv`. The MTA deployment controller also processed the declared authentication, destination and job-scheduler resources and refreshed their service bindings to the runtime. It did **not** select the database deployer, delete an application, run `cds deploy`, or perform a schema/data migration. This is recorded so the rollout is not overstated as a service-only action.

## Post-rollout checks

| Check | Result |
| --- | --- |
| Service instance | Started, 1/1 |
| AppRouter instance | Started, 1/1 |
| Service health | HTTP 200 |
| Recent runtime log scan for unhandled/fatal errors | No matching entry |
| Browser shell | PM-authenticated List Report loaded in the connected Chrome session |

## Acceptance status

- This proves that the merged runtime is available on SAP BTP.
- It does **not** prove browser-level Qwen primary success, visual acceptance, review persistence or the Tester/Developer role matrix.
- No AI action was invoked during this rollout record. The user-owned New Bug draft was not changed.
- Direct read-only OData navigation through the connected-Chrome control surface was blocked by the browser client (`ERR_BLOCKED_BY_CLIENT`); that is a tooling limitation, not a product result.

## Security

This record intentionally excludes passwords, tokens, cookies, API keys, binding credentials, database URLs, private endpoints, raw prompts, raw model responses and full private email addresses.
