# IDTS-89 verification record

Date: 2026-07-23

Environment: fresh worktree from `origin/dev` commit `7cb2d54`, in-memory SQLite for direct CAP tests, and Render PostgreSQL 15 for the approved code-list rollout

Shared QA mutation: one idempotent 11-row ActionTypes UPSERT through authenticated Render CLI `psql`; no schema deploy, reset, delete, or workflow data mutation

| Verification | Result |
| --- | --- |
| OfficeCLI preflight: `officecli --version` | PASS — `1.0.140`; used as the mandatory documentation preflight. Markdown/code artifacts were edited with repository tools because OfficeCLI does not validate CAP JavaScript or Markdown semantics. |
| Focused IDTS-89 direct-action suite | PASS — 11/11 exact mappings plus event/log code, actor, summary, state, next processor, authorization, rollback, timeline label, and idempotent UPSERT. |
| Existing HistoryEvents scenarios | PASS — assign 3/3, resubmit 2/2, reject 3/3, pending 1/1, close 2/2, generic edit 2/2, legacy label normalization 3/3. |
| IDTS-6 lifecycle regression | PASS — 30/30 after correcting the stale test-only `alice` create identity to seeded Tester `NhanT`; product auth was not relaxed. |
| IDTS-23 ownership/history/monitoring regression | PASS — 46/46. |
| Auth regression | PASS — 28/28. |
| Email outbox regression | PASS — local provider disabled, delivery rows intentionally `SKIPPED`. |
| PM monitoring regression | PASS — 20/20. |
| CAP compile | PASS — known unrelated `NonUpdateableProperties` attachment vocabulary warning remains. |
| UI5 build | PASS — no `app/`, annotation, action metadata, or Fiori button file changed. |
| JavaScript syntax checks | PASS for all changed runtime, migration, and QA JavaScript files. |
| Secret scan | PASS. |
| AI DevKit lint | PASS — 5 OK, 0 missing, 0 warning. |
| QA Depth Gate self-test | PASS — 15/15. |
| Actual PR-body QA Depth Gate | BLOCKED AS DESIGNED — rejects the In Progress Knowledge Gate because score, critical answers, debug exercise, teach-back, evidence, and Result are not yet genuine PASS. |
| Agent rules check | PASS — 8 required rules. |
| `git diff --check` | PASS; Windows LF→CRLF checkout warnings are non-blocking and no bulk line-ending rewrite was performed. |
| Runtime scope check | `app/`, `db/schema.cds`, and `srv/service.cds` unchanged. |
| Render CLI authentication | PASS - `render v2.21.0`, authenticated to workspace `IDTS_GSUSAP01`. |
| Shared QA baseline | PASS - 0/11 exact ActionTypes before UPSERT; Bugs 12, HistoryEvents 62, HistoryLogs 122, Users 4, legacy ActionTypes 11. |
| Shared QA PostgreSQL UPSERT | PASS - one transaction completed with `BEGIN`, `INSERT 0 11`, `COMMIT`. |
| Shared QA readback and preservation | PASS - 11/11 exact rows match code/name/description/order/active/criticality; Bugs 12, HistoryEvents 62, HistoryLogs 122, Users 4, and legacy ActionTypes 11 remain unchanged. |
| Shared QA HTTP boundary smoke | PASS - auth metadata `200`; unauthenticated Bug metadata and ActionTypes return expected `401`. |
| Shared QA exact workflow smoke | PENDING - live service commit `07be39e` predates both `origin/dev` `7cb2d54` and the IDTS-89 branch, so it cannot persist the new exact action codes yet. |

## CAP MCP guidance applied

CAP MCP was queried before implementation. It confirmed that CAP request processing supplies the transaction boundary and that CAP `UPSERT` has portable insert-or-update semantics suitable for an idempotent code-list update. The model search did not enumerate bound actions reliably, so `srv/service.cds` plus handler registrations were used as the authoritative local inventory.

## Known gaps and release hold

- The approved PostgreSQL ActionTypes UPSERT and readback are complete; no Bugs, HistoryEvents, HistoryLogs, Users, or legacy ActionTypes were lost.
- Exact workflow smoke remains pending until reviewed IDTS-89 runtime code is deployed through the protected branch process. The current live service is stale at `07be39e`.
- The known attachment vocabulary warning is unchanged.
- Dependency installation reported pre-existing lockfile findings; this task added no dependency and did not run `npm audit fix`.
- Knowledge Gate remains `IN PROGRESS — handled in dedicated learning thread`. Do not merge or transition Jira Done until the dedicated learning task records a genuine PASS and review confirms the mapping.
