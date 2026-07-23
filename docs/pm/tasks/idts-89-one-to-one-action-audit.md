# IDTS-89 — One-to-One Workflow Action Audit

## Status

Runtime deployed; authenticated exact-action Shared QA smoke pending

## Owner and support

- Owner: DonHV
- Support: NhanT
- Due date: 2026-07-25
- Jira: `IDTS-89`
- Merged PR: `https://github.com/DarwinDO/IDTS-SAP01/pull/163`
- Branch: `refactor/idts-89-one-to-one-action-audit-donhv`
- Knowledge Gate: `90% — PASS`

## Goal

Make each public Bug workflow OData action that changes workflow state or writes a `HistoryEvent` persist a dedicated `HistoryEvents.actionType_code`, so the initiating command is identifiable without inferring it from status or raw `HistoryLogs`.

## Scope

- Inventory service actions and runtime handlers.
- Add exact ActionType constants and code-list rows.
- Map every in-scope workflow handler one-to-one.
- Update history summaries, actor resolution, authorization sets, and compatibility behavior.
- Keep legacy ActionTypes and legacy history readable.
- Provide an idempotent, non-destructive PostgreSQL-compatible code-list upsert path.
- Add contract, integration, authorization, rollback, persistence, and compatibility tests.
- Update matching bilingual knowledge mirrors and affected canonical/data documentation.

## Out of scope

- Public OData action names or signatures.
- Status lifecycle and role-model changes.
- Fiori button behavior.
- AI read-only actions and the separate AI audit model.
- Legacy history rewriting.
- Destructive Shared QA deployment or database reset.
- New framework or dependency.

## Acceptance criteria

- [x] Each in-scope workflow action has a unique exact ActionType.
- [x] Generic `STATUS_CHANGE` and `REASSIGN` are retained only for legacy compatibility or genuinely generic non-command history.
- [x] Exact summaries, actor, HistoryLogs, status, assignee, and next processor are verified.
- [x] Direct OData authorization and rollback are verified.
- [x] New code-list rows work on SQLite and through a PostgreSQL-compatible idempotent upsert.
- [x] Legacy history remains readable and the UI timeline resolves labels.
- [x] CAP compile and focused/regression/security/quality gates pass.
- [x] Sanitized evidence is stored under `docs/pm/evidence/idts-89/`.
- [x] Draft PR is created and remains unmerged until review and Knowledge Gate requirements are satisfied.
- [x] Run and read back the 11-row UPSERT on Shared QA through authenticated Render CLI `psql`; business/history/user row counts and all 11 legacy ActionTypes remain unchanged.
- [x] Prepare a runtime-only release proposal that records the current pre-deploy command, leaves broad `cds-deploy` disabled after release, and separates future schema/code-list/runtime operations. No release configuration was changed.
- [x] DonHV approved the runtime-only release plan in principle; execution remains blocked because PR #163 still records Knowledge Gate `IN PROGRESS` and the required `qa-depth-gate` is failing.
- [x] After Knowledge Gate 90% PASS and normal gate PASS, disable Shared QA auto-deploy and replace broad pre-deploy with `true`; readback confirms branch/build/start/health are unchanged and no deploy was triggered.
- [x] Merge reviewed runtime code through normal branch protection without admin bypass and deploy the exact merge SHA through the runtime-only path.
- [x] Verify live deploy status, health, protected-route authorization, no new error logs, database row preservation, 11/11 exact ActionTypes, and 11/11 legacy ActionTypes.
- [ ] Run authenticated exact-action Shared QA smoke and read back the resulting HistoryEvent, summary, actor, HistoryLogs, status, assignee, and next processor. This remains blocked until an approved QA login/session is available; do not create an auth bypass or mutate cloud users.
