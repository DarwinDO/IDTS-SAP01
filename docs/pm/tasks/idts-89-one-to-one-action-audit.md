# IDTS-89 — One-to-One Workflow Action Audit

## Status

In Progress

## Owner and support

- Owner: DonHV
- Support: NhanT
- Due date: 2026-07-25
- Jira: `IDTS-89`
- Branch: `refactor/idts-89-one-to-one-action-audit-donhv`
- Knowledge Gate: `IN PROGRESS — handled in dedicated learning thread`

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
- [ ] PR is created but not merged until review and Knowledge Gate requirements are satisfied.
