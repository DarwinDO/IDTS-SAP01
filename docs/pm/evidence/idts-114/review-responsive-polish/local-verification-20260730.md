# IDTS-114/115 responsive AI review — local verification

Date: 2026-07-30
Executor: DonHV
Baseline: `d70431bdbaa0113f4f6006570c8a92797ec8fd38`
Environment: fresh isolated Git worktree

## Scope

- Similar Bugs vertical candidate layout, safe in-dialog Retry and stale-state reset.
- Classification responsive table auto-pop-in and safe `AI_RATE_LIMITED` status.
- Handoff Summary actor/action/local-time timeline presentation.
- Whole custom-field visibility for Similar Bugs and Classification on root New Bug drafts.
- Knowledge mirrors and focused static QA.

No OData contract, CDS entity, HANA schema, provider/model, role rule or workflow mutation was changed.

## Red/positive evidence

| Gate | Result |
| --- | --- |
| Initial IDTS-74 responsive assertion | Failed before implementation as expected |
| Initial IDTS-75 responsive/manifest assertions | Failed before implementation as expected |
| Initial IDTS-76 timeline assertions | Failed before implementation as expected |
| Initial IDTS-115 whole-field visibility assertions | Failed before implementation as expected |
| Similar Bugs stale-retry-state assertion | Failed before reset fix as expected |
| Similar Bugs non-retryable error assertions | Failed before error classification as expected |
| Classification stale-retry and auto-pop-in assertions | Failed before correction as expected |
| IDTS-74 final | PASS — 205 checks |
| IDTS-75 final | PASS — 113 checks |
| IDTS-76 final | PASS — 114 checks |
| IDTS-115 final before final aggregate rerun | PASS — 191 checks |

## Integrated regression

The following commands completed with exit code `0`:

- `npm run qa:idts64:programmatic`
- `npm run qa:idts66:programmatic`
- `npm run qa:idts67:programmatic`
- `npm run qa:idts68:programmatic`
- `npm run qa:idts69:programmatic`
- `npm run qa:idts71:programmatic`
- `npm run qa:idts74:programmatic`
- `npm run qa:idts75:programmatic`
- `npm run qa:idts76:programmatic`
- `npm run qa:idts114:programmatic`
- `npm run qa:idts115:programmatic`
- `npm run qa:secret-scan`
- `npm run qa:agent-rules`
- `npm run qa:depth:self-test`

## Build and static gates

| Gate | Result |
| --- | --- |
| CAP compile for AuthService and BugService | PASS; known attachment vocabulary warning only |
| UI5 production build | PASS |
| UI5 manifest validation | PASS; zero validation errors |
| UI5 MCP targeted JavaScript lint | PASS; zero findings |
| Targeted ESLint | PASS; zero errors and four existing structural warnings |
| AI DevKit | PASS — 5/5 |
| `git diff --check` | PASS; line-ending notices only |
| Secret scan | PASS |
| Agent rules | PASS |
| Ownership gate runner | PASS — 5/5 |
| QA Depth self-test | PASS — 15/15 |

The UI5 linter separately reports that the application still uses a pre-V2 manifest version. This is application-wide technical debt and is not caused by the visibility expression; the manifest remains valid and the production build passes. No broad manifest migration is included in this focused fix.

## Security and behavior boundaries

- Retry clears candidate, selection, suggestion, review and confirmation state before loading.
- No AI dialog writes Bug status, assignee or next processor.
- Confirm Duplicate and Apply Classification authorization/contracts are unchanged.
- Root New Bug hides the complete custom field, including the Fiori-generated label.
- No raw provider response, secret, token, cookie, private endpoint or database URL is present in this evidence.

## Independent review

Terra High found three pre-merge issues: Classification stale Apply state, conflicting manual/automatic pop-in configuration, and Similar Bugs Retry on non-retryable errors. All three were corrected and covered by red assertions. The reviewer found no authorization/no-mutation regression and no unnecessary dependency, framework or abstraction.

Ponytail result after correction: `Lean already. Ship.`

## Pending

- Pull request and fresh GitHub QA Depth Gate.
- Selective SAP BTP UI/AppRouter rollout.
- PM browser visual, reload and no-mutation evidence.
- Tester/Developer role evidence remains intentionally deferred.

IDTS-114 and IDTS-115 remain `In Progress`.
