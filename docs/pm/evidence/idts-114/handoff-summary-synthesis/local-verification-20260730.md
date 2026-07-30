# IDTS-114 Handoff Summary synthesis — local verification

- Baseline: `origin/dev` at `4dada2eb198d139bdab5e50b0102b540102406c3`
- Branch: `fix/idts-114-handoff-summary-synthesis-donhv`
- Scope: transient handoff response, AI prompt/schema, dialog ordering, i18n, tests and knowledge mirrors.
- Database migration: none.
- Workflow mutation: none.

## Expected result

The dialog must show a concise synthesis and actionable handoff before the verified raw comment/history evidence. AI comment insights must remain grounded in stored comments. Current state, source comments, source history and next workflow action must remain backend-controlled.

## Verification

- `npm run qa:idts68:programmatic`: PASS, 47/47.
- `npm run qa:idts76:programmatic`: PASS, 132/132.
- `npm run qa:idts114:programmatic`: PASS, 59/59.
- `npx cds compile srv/service.cds --to json`: PASS.
- `npm run build --prefix app/bug-management-ui`: PASS.
- `npm run qa:secret-scan`: PASS.
- `npm run qa:agent-rules`: PASS.
- `git diff --check`: PASS with existing LF/CRLF warnings only.

## Safety checks

- `nextExpectedAction` is still derived from stored status/ownership.
- `latestImportantEvents` is still derived from stored history.
- `verifiedComments` is derived from stored comments.
- AI `commentSummary` is accepted only when it shares meaningful terms with stored comments; otherwise a deterministic insight is returned.
- No token, API key, credential, private endpoint, raw provider response or attachment binary is stored in this evidence.
