# IDTS-68 Evidence - Grounded Bug/Handoff Summary

Date: 2026-07-09

Repository status:

- PR: https://github.com/DarwinDO/IDTS-SAP01/pull/115
- Merge commit: `d5e4297`
- GitHub check: `qa-depth-gate` passed.
- Jira evidence comment: `IDTS-68` comment `10431`.

## Scope

IDTS-68 adds a backend-only AI suggestion action for grounded bug and handoff summaries:

- `POST /odata/v4/bug/summarizeBugHandoff`
- Input: `sourceBugID`
- Output: reviewable `BugHandoffSummaryResult`

The action reads an existing bug, bounded comments, and bounded history. It returns a human-review summary and writes sanitized `AiSuggestions` audit evidence with feature type `BUG_SUMMARY`.

It does not mutate `Bugs`, does not replace History Timeline, does not read attachment binary content, and does not expose a public write API.

## Focused verification

Command:

```powershell
npm run qa:idts68:programmatic
```

Result:

```text
TOTAL: 28 PASS | 0 FAIL | 28 checks
```

Coverage included:

- normal provider success path;
- grounded summary with comments and history;
- `AiSuggestions` audit row creation;
- missing-data / sparse bug case;
- long comment/history case stays concise;
- AI disabled fallback;
- provider error fallback;
- unsafe provider output fallback;
- malformed provider output fallback;
- unknown `sourceBugID` returns 404;
- action does not mutate bug status or `modifiedAt`.

## CAP verification

Command:

```powershell
npx cds compile srv --to edmx -s all
```

Result:

- Exit code: 0.
- Metadata contains `BugService.summarizeBugHandoff`.
- Existing non-blocking attachment warning remains:
  - `NonUpdateableProperties` is not a known property for `@Capabilities.UpdateRestrictions` on `BugService.Bugs_attachments`.

## Notes

- `npm ci --include=dev` was required in the fresh worktree before CAP MCP/model checks could compile.
- `npm ci --include=dev` reported the existing baseline audit findings. This task did not add a new npm dependency.
- Initial IDTS-68 safety check used the generic diagnostic scanner on full business text and falsely flagged normal text containing `from`. The fix narrowed IDTS-68 provider-output leak detection to high-risk tokens such as `select passwordHash`, Brevo/API key markers, bearer token, PostgreSQL URL, and stack trace.
