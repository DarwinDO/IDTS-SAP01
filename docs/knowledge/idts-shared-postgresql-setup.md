# IDTS Shared PostgreSQL Integration Setup

Last updated: 2026-06-21

## Team Decision

IDTS uses:

- SQLite for normal local development and fast programmatic tests.
- One shared PostgreSQL environment for team integration and PostgreSQL compatibility testing.
- External object storage for attachment bytes in the long-term integration/deployment architecture.

The shared PostgreSQL database is not a replacement for each developer's fast SQLite workflow. Developers use the shared environment when a task needs integration evidence.

## Repository Configuration

The repository declares:

- `@cap-js/postgres` as the CAP PostgreSQL database service.
- `@cap-js/attachments` as the attachment plugin.
- CAP profile `integration` for PostgreSQL plus standard object storage.
- npm commands:

```powershell
npm run integration:db:env
npm run integration:db:deploy
npm run integration:serve
```

No shared hostname, username, password, object-store endpoint, or service key is committed.

## Developer Setup

1. Copy `.cdsrc-private.example.json` to `.cdsrc-private.json`.
2. Replace placeholders with the shared PostgreSQL connection assigned to the developer/team.
3. Keep `.cdsrc-private.json` local. It is ignored by Git.
4. Verify the resolved database configuration:

```powershell
npm run integration:db:env
```

5. Only the environment owner or an explicitly coordinated developer should deploy schema changes:

```powershell
npm run integration:db:deploy
```

6. Other developers normally start the app without deploying:

```powershell
npm run integration:serve
```

## Shared Database Rules

- Use separate PostgreSQL accounts per developer when the provider supports it.
- Do not commit credentials or paste service keys into Jira.
- Coordinate schema deployment because all developers share the same database.
- Back up or recreate the integration database before destructive model migrations.
- Seed data can be reset only with team agreement.
- SQLite remains the default for isolated feature development.

## Attachment Storage Binding

The `integration` profile selects `attachments.kind = standard`. It requires an object-store service binding or equivalent private credentials.

Preferred SAP BTP setup:

```powershell
cf login -a <api> -o <org> -s <space> --sso
cds bind objectStore --to <shared-object-store-service-instance>
```

The generated private binding must remain outside source control. Until the shared object store is available, developers can verify the plugin locally with SQLite/DB fallback, but that does not prove the final external-storage architecture.

## Migration from the Legacy Attachment Tables

The old custom model used:

- `idts.cap.Attachments`
- `BugService.Attachments.drafts`
- `content : LargeBinary`

The plugin model uses the draft-aware `Bugs.attachments` composition and exposes `BugService.Bugs_attachments`.

CAP correctly blocks an automatic deployment that would drop the old attachment tables. For the current integration environment, use a new shared database/schema or perform an explicitly approved backup/export before removing legacy tables. Do not force-drop a database that may contain team evidence.
