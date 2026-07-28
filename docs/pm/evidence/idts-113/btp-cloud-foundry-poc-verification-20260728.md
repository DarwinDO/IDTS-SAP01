# IDTS-113 SAP BTP Cloud Foundry POC verification

## Baseline and isolation

- Source baseline: `4b4c93c1d8b45024677653e1f890d52e742b2aaf`.
- Dedicated branch/worktree used; root local `dev` was not modified.
- Target: SAP BTP Trial Cloud Foundry, region `ap21`, space `dev`.
- Render Shared QA was not redeployed or reconfigured.
- No Render PostgreSQL data or private provider credentials were copied.

## Cloud result

| Check | Result |
| --- | --- |
| SAP HANA Cloud free instance | PASS — create succeeded; all pods running |
| Dedicated HDI container | PASS — create succeeded |
| HDI deployment | PASS |
| CAP application | PASS — started, 1/1 instance |
| `GET /health` | PASS — HTTP 200 |
| Login page | PASS — HTTP 200 |
| AuthService metadata | PASS — HTTP 200 |
| Anonymous BugService metadata | PASS — HTTP 401 |
| Isolated seed login | PASS — HTTP 200 |
| Authenticated BugService read | PASS — HTTP 200 |
| Logout | PASS — HTTP 200 |
| Reuse of revoked token | PASS — HTTP 401 |
| Temporary password/email env | PASS — absent after smoke |

The reusable application URL and all platform/account identifiers are omitted
from this repository evidence. They remain discoverable by authorized space
developers through `cf app`.

## Packaging and profile result

| Check | Result |
| --- | --- |
| CAP production DB | `hana` |
| CAP integration DB | `postgres` |
| Render-effective DB (`production+integration`) | `postgres` |
| BTP attachment provider | isolated database-backed storage |
| Render attachment provider | unchanged integration object-store profile |
| MTA modules | CAP service + HDI deployer |
| MTA managed resource | one `hdi-shared` container |
| BTP Node line | Node 22, matching the current regional buildpack |

## Local verification

| Verification | Result |
| --- | --- |
| `npm run qa:auth:programmatic` | 28 PASS / 0 FAIL |
| `npm run qa:idts41:programmatic` | 18 PASS / 0 FAIL |
| `npm run qa:comments-attachments:programmatic` | PASS |
| `npx cds compile srv --to csn` | PASS |
| `npx ui5 build --config ui5.yaml` | PASS |
| `npm run qa:secret-scan` | PASS |
| `npm run qa:agent-rules` | PASS |
| `npm run qa:depth:self-test` | 15 PASS / 0 FAIL |
| `npx ai-devkit@latest lint --json` | 5 OK / 0 warning / 0 failure |
| `git diff --check` | PASS |

Raw auth output is intentionally not committed because the existing suite
prints a short-lived token. Only the sanitized counts above are retained.

## Issues observed and resolved

1. HANA creation without JSON failed before provisioning. Resolved by using
   broker-required JSON parameters.
2. The first 32 GB request exceeded the current trial quota. Resolved with the
   broker-supported 16 GB size.
3. BTP staging rejected the repository engine expression `>=20 <23`.
   Packaging now pins only the generated CF package.
4. Node 20 was unavailable in the regional buildpack. The generated package
   now selects Node 22, which is already allowed by the repository contract.
5. Direct local HDI access timed out at the HANA network boundary. Password
   initialization and authenticated smoke were moved to a one-off CF task;
   no database whitelist was opened.

## Limitations and follow-up

- This is an isolated technical POC, not the production migration target.
- XSUAA/AppRouter, external provider integration, real-data migration, and
  production operational hardening are not accepted by this evidence.
- Dependency audit findings and the existing CAP annotation warning remain
  separate follow-ups.
