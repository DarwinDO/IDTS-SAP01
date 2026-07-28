# IDTS-113 — BTP XSUAA/AppRouter local verification

## Scope

- Baseline: `a42cb618bf940072c0819fb77621fea0dbfd53c8`
- Branch: `feature/idts-113-btp-xsuaa-approuter-donhv`
- Environment changed: local worktree only
- Render Shared QA changed: no
- SAP BTP deployed by this increment: no

This evidence covers the local implementation and packageability of XSUAA,
standalone AppRouter and HTML5 Application Repository support. It does not
claim authenticated BTP browser acceptance; that is verified after the HANA
migration/integration package is deployed.

## Runtime contract

| Environment | Database | Authentication |
| --- | --- | --- |
| Local development | SQLite | Existing custom bearer authentication |
| Render rollback/integration | PostgreSQL | Existing custom bearer authentication |
| SAP BTP production | HANA/HDI | AppRouter + XSUAA |

AWS S3 and Brevo remain external providers. AI remains disabled/mock. No
provider credential, JWT, password, database URL or private endpoint is stored
in this evidence.

## Verification results

| Verification | Result |
| --- | --- |
| `npm run qa:idts113:btp-auth` | PASS, 11/11 |
| Effective profile readback | BTP production: XSUAA/HANA; integration and combined Render profile: custom implementation/PostgreSQL |
| `npm run qa:auth:programmatic` | PASS, 28/28 |
| `npm run qa:comments-attachments:programmatic` | PASS for comment/local persistence; HTTP/S3 acceptance deferred |
| `npm run qa:history-events:programmatic` | PASS, 16/16 |
| `npx cds compile srv --to json` | PASS |
| UI5 production build | PASS |
| MBT 1.2.47 Cloud Foundry package build | PASS |
| MTAR output | `idts-113-xsuaa-approuter-final.mtar`, 33,957,153 bytes |
| `npm run qa:secret-scan` | PASS |
| `npm run qa:agent-rules` | PASS |
| `npm run qa:depth:self-test` | PASS, 15/15 |
| `npm run qa:ownership-gate` | PASS, 5/5 |
| `npx ai-devkit@latest lint --json` | PASS, 5/5 |
| `git diff --check` | PASS; Windows line-ending warnings only |

## Security and behavior assertions

- The browser does not receive or persist an XSUAA JWT.
- AppRouter owns BTP login/logout and forwards the authenticated token to CAP.
- `AuthService.me` maps the platform identity to an active IDTS user.
- Exactly one XSUAA business role must match `Users.role_code`.
- A missing, multiple or mismatched role is rejected with HTTP 403.
- Custom login is retained for local/Render and rejected on BTP.
- The Render-effective `production+integration` profile remains custom auth
  and PostgreSQL; production BTP resolves XSUAA and HANA.

## Findings and limitations

- A timed-out MBT command left a local process tree holding `node_modules`.
  The subsequent `EPERM` was a tooling/process-lock issue. Exact
  worktree-owned processes were stopped, dependencies were restored, and the
  full MTAR build then passed.
- The build reports existing npm dependency advisories. No force upgrade was
  applied; dependency remediation remains separate from this migration.
- CAP continues to report the existing attachment
  `NonUpdateableProperties` annotation warning.
- Local browser smoke was blocked by conflicting local CDS runtime copies.
  No product PASS is claimed from that attempt. AppRouter/XSUAA browser,
  role-collection and logout evidence remains required after deployment.
- Live S3, Brevo and HANA migration acceptance are outside this increment.

## Ponytail review

The diff uses SAP-supported XSUAA/AppRouter/HTML5 repository components and
does not add a custom authentication framework. One repeated-database-query
path in `AuthService.me` was simplified to one Users query followed by
in-memory identity matching.

Result: `Lean already. Ship.`
