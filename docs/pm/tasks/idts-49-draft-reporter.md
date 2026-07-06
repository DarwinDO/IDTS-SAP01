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
- Status: Done
- Branch: `fix/idts-49-draft-reporter-donhv`
- GitHub PR: #61
- Merge commit: `6b0fd4fe98742b942e8d250cabc3bb2dc02b99b4`
- Render deploy: `dep-d93420m7r5hc73a45dvg`
- Unblocked: [IDTS-44](https://dutassociation.atlassian.net/browse/IDTS-44)

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

## Final shared-QA evidence

| Check | Result |
| --- | --- |
| PR #61 merged into `dev` | PASS |
| Render deploy `dep-d93420m7r5hc73a45dvg` | PASS - `live` |
| Health/auth metadata | PASS - 200 |
| Wrong login | PASS - 401 |
| Anonymous protected OData | PASS - 401 |
| Authenticated protected OData | PASS - 200 |
| PM draft without client `reporter_ID` | PASS - backend derived reporter before activation |
| Draft activation | PASS - active Bug became `ASSIGNED` |
| Developer request-more-information | PASS - action committed |
| Reporter email delivery | PASS - `SENT`, attempt 1 |
| Render log review | PASS - no new `Reporter is required`; Brevo API worker logged `sent=2, failed=0` in the smoke window |

## Remaining work

None for IDTS-49. Jira IDTS-49 is Done. Follow-up infrastructure and dependency tasks remain tracked separately by IDTS-45 and IDTS-46.

Vietnamese:

Khong con viec mo cho IDTS-49. Jira IDTS-49 da Done. Follow-up ve infrastructure va dependency duoc track rieng bang IDTS-45 va IDTS-46.
