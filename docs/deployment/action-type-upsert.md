# Workflow ActionType code-list rollout

Use this procedure only after the IDTS-89 application code has been reviewed.

## Safety contract

- The script performs `UPSERT` for 11 exact workflow ActionTypes.
- It does not delete or rewrite legacy `ActionTypes`, `HistoryEvents`, `HistoryLogs`, Bugs, Users, or other business data.
- It does not run `cds deploy`.
- It reads the database binding from the normal private CAP environment; no credential belongs in the command, repository, Jira, or evidence.
- The default command is a dry run and does not connect to or change a database.

## Commands

Dry run:

```powershell
npm run db:action-types:upsert
```

Expected result:

```text
DRY RUN: 11 workflow ActionTypes are ready for idempotent UPSERT.
No database was changed.
```

Approved execution in the intended environment:

```powershell
npm run db:action-types:upsert -- --execute
```

Run the command only after confirming the active CAP database binding points to the intended environment. Running it again is safe: each row is keyed by `code` and is updated or inserted without creating duplicates.

## Post-run checks

1. Read `ActionTypes` and confirm all 11 new codes exist with user-facing names.
2. Read at least one legacy HistoryEvent and confirm its old ActionType label still resolves.
3. Execute one new workflow action and confirm both `HistoryEvents.actionType_code` and child `HistoryLogs.actionType_code` contain the exact command code.
4. Confirm no Bug, HistoryEvent, HistoryLog, or User row count decreased.

Do not run the `--execute` form against Shared QA from an unreviewed branch.
