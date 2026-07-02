# IDTS-49 - Draft Reporter Initialization

Last updated: 2026-07-02

## Summary

IDTS-49 fixes the shared-QA blocker found during final IDTS-44 closure: a PM-authenticated Fiori/OData draft could fail activation with `Reporter is required` when the client did not send the system-managed `reporter_ID`.

Root cause: the active `CREATE` path derived the reporter, but draft `SAVE` validation ran before active `CREATE`. Reporter initialization was therefore too late for draft activation.

Vietnamese:

IDTS-49 sua blocker shared-QA phat hien khi review dong IDTS-44: draft do PM authenticated tao co the fail activation voi `Reporter is required` khi client khong gui field he thong `reporter_ID`.

Nguyen nhan: active `CREATE` co derive reporter, nhung validation cua draft `SAVE` chay truoc active `CREATE`. Vi vay reporter duoc khoi tao qua tre so voi draft activation.

## Status

- Jira: [IDTS-49](https://dutassociation.atlassian.net/browse/IDTS-49)
- Owner: DonHV
- Status: In Progress
- Branch: `fix/idts-49-draft-reporter-donhv`
- Blocks: [IDTS-44](https://dutassociation.atlassian.net/browse/IDTS-44)

## Implementation notes

- `srv/service.js` now resolves create permission on draft `NEW` and passes the returned actor into draft initialization.
- `srv/bug-service/permissions.js` now rejects unmapped identities with `403` instead of allowing a later unclear required-field failure.
- `srv/bug-service/drafts.js` now sets `reporter_ID` during draft `NEW` and fills it before draft `SAVE` validation for older incomplete drafts.
- `scripts/qa/test-idts49-draft-reporter.js` protects the regression with deterministic helper-level checks and an assertion-count guard.

Vietnamese:

- `srv/service.js` resolve create permission tren draft `NEW` va truyen actor tra ve vao draft initialization.
- `srv/bug-service/permissions.js` reject identity khong map duoc bang `403` thay vi de fail muon bang required-field error kho hieu.
- `srv/bug-service/drafts.js` set `reporter_ID` khi draft `NEW` va dien reporter truoc validation cua draft `SAVE` cho draft cu bi thieu.
- `scripts/qa/test-idts49-draft-reporter.js` bao ve regression bang deterministic helper-level checks va assertion-count guard.

## Verification

| Check | Result |
| --- | --- |
| `node --check srv/bug-service/drafts.js srv/bug-service/permissions.js srv/service.js scripts/qa/test-idts49-draft-reporter.js` | PASS |
| `npm run qa:draft-reporter:programmatic` | PASS - 10 checks / 0 fail |
| `npx cds compile srv --to edmx -s all` | PASS - exit 0; known attachment annotation warning remains non-blocking |
| `npm run qa:auth:programmatic` | PASS - 23 checks / 0 fail |
| `npm run qa:email-outbox:programmatic` | PASS |
| `npm run qa:depth:self-test` | PASS - 6 checks / 0 fail |
| `node scripts/qa/test-idts41-code-list-validation.js` | PASS - 18 checks / 0 fail |
| `npm run qa:secret-scan` | PASS |
| `npx ai-devkit@latest lint --json` | PASS - 5 ok / 0 required failures |
| `git diff --check` | PASS - exit 0; Windows line-ending warnings only |

## Remaining work

1. Open and merge PR into `dev`.
2. Deploy latest `dev` to Render.
3. Rerun the missing IDTS-44 DonHV reporter-routing scenario.
4. If delivery reaches `SENT`, update Jira IDTS-49 to Done and close IDTS-44.

Vietnamese:

1. Tao va merge PR vao `dev`.
2. Deploy `dev` moi nhat len Render.
3. Chay lai scenario IDTS-44 con thieu: routing email ve reporter DonHV.
4. Neu delivery dat `SENT`, chuyen Jira IDTS-49 sang Done va dong IDTS-44.
