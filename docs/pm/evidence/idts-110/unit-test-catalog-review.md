# IDTS-110 Unit Test catalog review

## Verdict

`DRAFT FOR DONHV CONTENT APPROVAL — NOT EXECUTED`

This candidate is a planning catalog, not a test report. All 188 cases start as `NOT_RUN`. The five historical Unit Test rows in `docs/qa/test-catalog.json` were used only as coverage input; their prior PASS state was not copied.

## Baseline and ownership

| Item | Value |
| --- | --- |
| Frozen Git baseline | `bc0c47e522ae208384d4b23dda21535dcc683683` |
| Language | English only |
| Catalog owner and approver | DonHV |
| Workbook generator/integrator | DonHV |
| Test executor/evidence owner | NhanT |
| Knowledge Gate | `PASS — DonHV; do not reopen` |
| Workbook/Drive state | Unchanged in this phase |

## Coverage summary

| Domain | Cases |
| --- | ---: |
| AI | 30 |
| Assignment | 11 |
| Attachments | 12 |
| Authentication | 15 |
| Bug write | 11 |
| Classification | 5 |
| Comments | 8 |
| History | 7 |
| Lifecycle | 45 |
| Monitoring | 7 |
| Notifications and email | 13 |
| Security | 8 |
| Validation | 16 |
| **Total** | **188** |

| Test level | Cases | Meaning |
| --- | ---: | --- |
| `PURE_UNIT` | 10 | Isolated deterministic helper/module behavior. |
| `UI_COMPONENT` | 2 | Client-side SAPUI5 behavior; no equivalent backend rule is claimed. |
| `CAP_COMPONENT` | 146 | CAP handler/helper behavior with controlled persistence. |
| `ODATA_CONTRACT` | 13 | HTTP/OData status, payload, authorization and side effects. |
| `BTP_INTEGRATION` | 17 | Requires deployed BTP or a live external service. |

## Review corrections made

- Split every lifecycle action into a positive transition, unauthorized actor, illegal source status, and separate mandatory-input branches where applicable.
- Kept the 11 exact lifecycle ActionTypes independently traceable.
- Split repeated AI review into separate `ACCEPTED`, `REJECTED`, and `IGNORED` terminal-state cases.
- Split existing forward and reverse duplicate-link boundaries.
- Corrected source symbols to `enforcePlatformRoleAlignment` and `flushPendingCreateAttachments` after the red source-trace validator rejected inferred names.
- Classified MIME allowlist and 10 MB checks as `UI_COMPONENT`; `prepareAttachmentWrite()` currently enforces role and records content length but does not implement those two UI limits as backend rules.
- Reframed the history action matrix as a contract consistency check; individual action behavior remains in the lifecycle cases.

## Evidence contract

Every executed case must have its own sanitized evidence record with:

- Case ID and requirement/function.
- Baseline SHA and BTP deploy SHA when applicable.
- Preconditions, exact input, expected result and actual result.
- Executor and timestamp.
- Before/after or reload state when persistence applies.
- Role/authorization evidence when applicable.
- At least one case-specific image.

Commands, script names, local paths, or one shared screenshot are not sufficient proof. Evidence must not contain passwords, API keys, bearer tokens, cookies, database URLs, private endpoints, raw provider payloads, or full private email addresses.

## Independent review

A GPT-5.6 Terra subagent with high reasoning independently reviewed source coverage and overlap. The parent review accepted the source inventory and atomicity findings only after checking the current files. The attachment finding above was independently confirmed against `srv/bug-service/content.js` and `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js`.

No test was executed, no PASS was created, and no Jira, workbook, or Drive artifact was changed during catalog preparation.
