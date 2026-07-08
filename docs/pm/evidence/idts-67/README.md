# IDTS-67 Evidence - AI Classification Suggestion

Date: 2026-07-08
Branch: `feature/idts-67-ai-classification-suggestion-donhv`
Pull request: https://github.com/DarwinDO/IDTS-SAP01/pull/113
Jira: IDTS-67 comment `10428`, status moved to In Progress
Owner tracking: DatDT
Implemented by: DonHV

## Scope verified

- Added `BugService.suggestClassification`.
- Validates AI provider output against active IDTS catalogs.
- Rejects unknown or inactive provider values as `INVALID_PROVIDER_VALUE`.
- Marks low-confidence values as `LOW_CONFIDENCE`.
- Keeps suggestions human-review-only; the action does not mutate `Bugs`.
- Writes sanitized `AiSuggestions` audit rows only when a persisted source bug is used.
- Keeps pre-create suggestions audit-free because there is no persisted bug link yet.

## Verification summary

| Check | Result |
| --- | --- |
| `npm run qa:idts64:programmatic` | `26 PASS / 0 FAIL` |
| `npm run qa:idts65:programmatic` | `19 PASS / 0 FAIL` |
| `npm run qa:idts66:programmatic` | `30 PASS / 0 FAIL` |
| `npm run qa:idts67:programmatic` | `22 PASS / 0 FAIL` |
| `npx cds compile srv --to edmx -s all` | exit `0`; metadata contains `suggestClassification`; existing attachment warning remains |
| `npm run qa:secret-scan` | PASS |
| `git diff --check` | PASS; line-ending warnings only |
| `npx ai-devkit@latest lint --json` | PASS: `5 ok / 0 warn / 0 miss` |

## Expected negative-test logs

Some QA runs intentionally trigger mock AI provider failures and timeouts. Those logs are expected negative evidence, not product failures. The important verification point is that the returned API payload stays generic and sanitized.

Observed safe statuses include:

- `AI_DISABLED`
- `AI_PROVIDER_ERROR`
- `LOW_CONFIDENCE`
- `INVALID_PROVIDER_VALUE`

## Known non-blocking warning

CAP compile still reports the pre-existing attachment annotation warning:

```text
NonUpdateableProperties is not a known property for @Capabilities.UpdateRestrictions on BugService.Bugs_attachments.
```

This warning existed before IDTS-67 and is unrelated to the AI classification action.

## Jira upload note

This folder is ready for manual Jira attachment/upload by DonHV. It contains no credential, token, private URL, full private recipient list, SMTP secret, AWS key, or database password.
