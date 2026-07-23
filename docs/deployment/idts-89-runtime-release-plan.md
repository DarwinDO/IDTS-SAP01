# IDTS-89 Runtime-Only Release Plan

Status: approved in principle by DonHV on 2026-07-23; execution remains blocked until the dedicated Knowledge Gate is complete, the PR body contains genuine evidence, and `qa-depth-gate` passes normally.

## Verified current state

- Render workspace: `IDTS_GSUSAP01`.
- Service: `idts-sap01-qa` (`srv-d92jk67aqgkc739h6ah0`), branch `dev`.
- Auto-deploy: enabled on commit.
- Current build command: `npm ci --include=dev`.
- Current pre-deploy command: `npm run render:db:deploy`.
- Repository mapping: `npm run render:db:deploy` invokes `cds-deploy`.
- Current start command: `npm start`.
- Current health check: `/odata/v4/auth/$metadata`.
- No secret or connection string is recorded in this plan.

Read-only PostgreSQL verification on 2026-07-23 returned all 11 active exact ActionTypes:

`ASSIGN_TO_DEVELOPER`, `MOVE_TO_PENDING_ASSIGNMENT`, `MARK_IN_REVIEW`,
`REQUEST_MORE_INFORMATION`, `RESUBMIT_TO_DEVELOPER`, `REJECT_BUG`,
`START_PROGRESS`, `RESOLVE_BUG`, `SEND_TO_RETEST`, `CLOSE_BUG`, and
`REOPEN_BUG`.

The narrow UPSERT is already complete. Bugs, HistoryEvents, HistoryLogs, Users,
and all 11 legacy ActionTypes retained their before/after row counts.

## Why this release can be runtime-only

IDTS-89 changes handlers, constants, tests, documentation, and ActionTypes seed
data. It does not change `db/schema.cds`. The required code-list rows already
exist in Shared QA through the reviewed idempotent UPSERT. Running full
`cds-deploy` or reloading all seed data is therefore unnecessary for this
release and carries avoidable cloud identity/reference-data risk.

## Preconditions

Do not start the release until every item is true:

1. Dedicated DonHV learning task supplies genuine evidence.
2. PR #163 body is updated from that evidence.
3. Required `qa-depth-gate` passes normally.
4. PR #163 is reviewed and merged without admin bypass.
5. Exact merge SHA is recorded.
6. A fresh read-only database snapshot records counts for Bugs, HistoryEvents,
   HistoryLogs, Users, legacy ActionTypes, and exact ActionTypes.

## Proposed controlled release sequence

The commands below are a proposal, not authorization to run them.

1. Disable service auto-deploy before merging so a `dev` update cannot invoke
   the current broad pre-deploy command:

   ```powershell
   render services update srv-d92jk67aqgkc739h6ah0 --auto-deploy=false --confirm
   ```

2. Replace the pre-deploy command with the single-token POSIX no-op `true`.
   This avoids PowerShell/native-CLI quoting ambiguity and performs no database
   or seed operation:

   ```powershell
   render services update srv-d92jk67aqgkc739h6ah0 `
     --pre-deploy-command true `
     --confirm
   ```

3. Read back service configuration and confirm:

   - auto-deploy is disabled;
   - pre-deploy no longer calls `npm run render:db:deploy`;
   - build, start, branch, health check, and environment settings are otherwise
     unchanged.

4. Merge PR #163 normally after required checks pass. Record the resulting
   merge SHA.

5. Deploy exactly that merge SHA and wait for a terminal result:

   ```powershell
   render deploys create srv-d92jk67aqgkc739h6ah0 `
     --commit <approved-merge-sha> `
     --wait `
     --confirm
   ```

6. Verify deployment and persistence:

   - deployed SHA equals the approved merge SHA;
   - auth metadata health check returns `200`;
   - all 11 ActionTypes remain present and active;
   - Bugs, HistoryEvents, HistoryLogs, Users, and legacy ActionTypes retain
     their pre-release counts before functional smoke creates controlled test
     history;
   - direct authenticated smoke covers Assign, Pending Assignment, Mark In
     Review, Start Progress, Resolve, Retest, Close, and negative authorization;
   - each new HistoryEvent stores the exact expected `actionType_code`, readable
     summary, correct actor, and matching HistoryLogs;
   - test fixtures are clearly identified and cleaned up only through an
     approved reversible procedure.

7. Leave auto-deploy disabled and keep the runtime-only no-op pre-deploy
   command after this release. Do not automatically restore full `cds-deploy`.
   A later configuration change requires its own reviewed migration design and
   release approval.

## Rollback

If runtime health or exact-action smoke fails:

1. Stop further workflow smoke.
2. Preserve logs and the failed deploy ID.
3. Redeploy the previously live application commit with the same runtime-only
   no-op pre-deploy command.
4. Do not delete the 11 ActionTypes; they are backward-compatible code-list
   rows and legacy runtime ignores them.
5. Verify health and read-only database counts again.

## Long-term migration separation

Create a separate Jira work item before re-enabling automatic deployment:

1. Runtime deployment builds and starts application code only.
2. Schema migration becomes an explicit, versioned, transaction-controlled job
   with an applied-migration ledger and database lock.
3. Code-list migration becomes a separate idempotent UPSERT job. It must never
   delete unspecified rows or reload all seed files.
4. `cds-deploy` is limited to new/empty or disposable environments unless a
   specific reviewed migration proves it safe for a persistent database.
5. CI classifies changes:
   - `srv/` or `app/` only: runtime deploy;
   - `db/schema.cds`: reviewed schema migration required;
   - `db/data/`: reviewed code-list/data migration required.
6. Release evidence records migration ID, before/after counts, deployed SHA,
   health result, rollback command, and owner approval.

Until that separation exists, Shared QA auto-deploy and broad pre-deploy must
remain disabled.

## Execution checkpoint — 2026-07-23

After Knowledge Gate `90% — PASS` and a normal successful `qa-depth-gate`:

- auto-deploy was changed from `yes/commit` to `no/off`;
- pre-deploy was changed from `npm run render:db:deploy` to `true`;
- build remained `npm ci --include=dev`;
- start remained `npm start`;
- branch remained `dev`;
- health check remained `/odata/v4/auth/$metadata`;
- the live deploy remained `07be39e`; no configuration update triggered a
  deploy.

The PR must pass the required check again after this checkpoint commit before
Ready/merge.
