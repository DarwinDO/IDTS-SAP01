# IDTS-45 - Render PostgreSQL Backup and Continuity Decision

Last updated: 2026-07-07

## Summary

`IDTS-45` protects the shared QA environment from the Render PostgreSQL Free
database expiry risk.

The current shared QA environment is accepted on Render, but the database is a
Free Render PostgreSQL instance. Render's current documentation says Free
PostgreSQL databases expire after 30 days, have a 14-day grace period to
upgrade, and do not support managed backups. Therefore IDTS cannot treat this
database as durable without a manual backup and an upgrade or migration
decision.

## Jira

- Jira: [IDTS-45](https://dutassociation.atlassian.net/browse/IDTS-45)
- Owner: DonHV
- Status: In Progress
- Due date: 2026-07-24
- Related task: [IDTS-44](https://dutassociation.atlassian.net/browse/IDTS-44)

## Decision

Use a two-step continuity plan:

1. Take a private logical backup from the existing Render QA PostgreSQL database.
2. Keep Render as the default short-term QA platform by upgrading the database
   before expiry if the team still needs the shared QA environment.

Migration to another PostgreSQL provider remains an alternative, but it should
not be the default Sprint 4 action because it adds cutover and credential risk
while Render QA is already working for login, OData, Brevo API delivery, and
AWS S3 attachments.

## Why this is the smallest safe option

- The application is already deployed and accepted on Render.
- The risky part is the Free database lifecycle, not the CAP app runtime.
- Upgrading keeps the same service wiring and reduces Sprint 4 disruption.
- A logical dump gives the team a recoverable artifact before any upgrade or
  migration attempt.
- The actual dump is private data and must stay outside Git/Jira public text.

## External references checked

- Render Free plan docs: <https://render.com/docs/free>. Free Render
  PostgreSQL databases expire after 30 days, have a 14-day upgrade grace period
  after expiry, and Free databases do not support backups.
- Render PostgreSQL backup docs: <https://render.com/docs/postgresql-backups>.
  Render does not create logical backups for Free PostgreSQL databases; Free
  instances should be backed up with `pg_dump` or upgraded before triggering
  Render-managed backups.

## Backup procedure

The repository includes a helper:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/render/backup-render-postgres.ps1
```

Shortcut:

```powershell
npm run render:db:backup
```

Preflight check:

```powershell
npm run render:db:backup:check
```

Before running it, DonHV must set the database URL privately:

```powershell
$env:RENDER_QA_DATABASE_URL = "<paste Render external database URL privately>"
```

The script:

- reads the URL from a private environment variable;
- parses it into PostgreSQL client environment variables;
- runs `pg_dump` without putting the password in the command line;
- uses local PostgreSQL client tools when available, or Docker image
  `postgres:15` as a fallback when Docker Desktop is running;
- writes the dump outside the repository by default;
- writes a SHA-256 checksum;
- removes PostgreSQL connection environment variables before exit;
- never prints the URL, username, password, host, or query string.

Default backup output:

```text
$HOME\IDTS-private-backups\idts-45
```

## Restore proof

Restore proof must use a temporary PostgreSQL target. Do not restore over the
live shared-QA database.

Recommended proof:

1. Create a temporary local PostgreSQL database or a short-lived cloud
   PostgreSQL database.
2. Restore the `.pgdump` with `pg_restore`.
3. Check that core CAP tables exist.
4. Check that representative rows exist for users, bugs, notifications, and
   attachment metadata.
5. Record only safe evidence: timestamp, backup size, checksum, restore target
   type, and pass/fail summary.

After the private backup and restore proof, generate a sanitized Markdown
summary for manual Jira upload:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/render/write-backup-evidence-summary.ps1 `
  -BackupPath "<path-to-private-pgdump>" `
  -RestoreTargetType "Local Docker PostgreSQL target" `
  -RestoreStatus "PASS" `
  -VerificationNotes "Core CAP tables and representative rows were checked."
```

The default output goes to `docs/pm/evidence/idts-45/private`, which is
gitignored. Review the generated file before uploading it manually to Jira.

The repository can create a disposable local PostgreSQL target through Docker:

```powershell
npm run render:db:restore-target:start
```

This prints a local-only `IDTS_RESTORE_DATABASE_URL` command. Copy it only into
your private shell. Do not paste that URL into Git, Jira, screenshots, or shared
evidence.

After restore proof, remove the disposable target:

```powershell
npm run render:db:restore-target:stop
```

The repository includes a restore helper:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/render/restore-render-postgres.ps1 `
  -BackupPath "<path-to-private-pgdump>" `
  -InspectOnly
```

Actual restore requires a temporary database URL and an explicit safety flag:

```powershell
$env:IDTS_RESTORE_DATABASE_URL = "<temporary PostgreSQL target URL>"
powershell -ExecutionPolicy Bypass -File scripts/render/restore-render-postgres.ps1 `
  -BackupPath "<path-to-private-pgdump>" `
  -IUnderstandTargetWillBeOverwritten
```

Do not use the live Render QA database URL as `IDTS_RESTORE_DATABASE_URL`.

Like the backup helper, restore uses local `pg_restore` when available and falls
back to Docker image `postgres:15` when Docker Desktop is running. This avoids
installing the full PostgreSQL server on Windows just to run backup/restore
client commands.

## Current Render read-only state

Checked on 2026-07-07 through Render CLI in workspace `IDTS_GSUSAP01`:

| Resource | Value |
| --- | --- |
| Web service | `idts-sap01-qa` |
| Service status | `not_suspended` |
| Service branch | `dev` |
| Public URL | `https://idts-sap01-qa.onrender.com` |
| PostgreSQL instance | `idts-sap01-qa-db` |
| PostgreSQL status | `available` |
| PostgreSQL plan | `free` |
| PostgreSQL region | `singapore` |
| PostgreSQL expires at | `2026-07-31T15:26:56.160995Z` |
| PostgreSQL IP allowlist | empty |

This evidence intentionally excludes database connection strings, passwords,
environment variables, private credentials, and real recipient lists.

## Options considered

| Option | Pros | Cons | Decision |
| --- | --- | --- | --- |
| Upgrade Render PostgreSQL | Lowest cutover risk; keeps existing Render service, env wiring, and internal network path. Paid Render DB gets managed recovery features. | Requires paid plan and billing decision. | Preferred short-term option if shared QA is still needed after expiry. |
| Migrate to another PostgreSQL provider | Can choose Supabase, AWS RDS, Neon, or other provider based on cost and long-term direction. | Requires new connection wiring, new security review, restore validation, and possible network/SSL issues. | Alternative if Render upgrade is not approved. |
| Recreate Free Render PostgreSQL | No immediate cost. | Data is temporary again; no managed backups; repeats the same risk. | Not recommended except for disposable demos. |
| Move back to local-only SQLite | No cloud DB cost. | Breaks shared QA value; team loses a common login/OData/email/S3 environment. | Rejected for Sprint 4 shared QA. |

## Acceptance checklist

- [x] Jira `IDTS-45` exists, has due date 2026-07-24, and relates to `IDTS-44`.
- [x] Repo has a secret-safe backup helper.
- [x] Repo has a guarded restore/inspect helper.
- [x] Backup and restore helpers support Docker fallback for PostgreSQL client tools.
- [x] Repo can start and stop a disposable local PostgreSQL restore target through Docker.
- [x] Repo can generate a sanitized evidence summary for manual Jira upload.
- [x] Repo has safe evidence instructions.
- [x] Risk and decision logs are updated.
- [x] Render CLI read-only state confirms the database is Free, available, and expires on 2026-07-31.
- [ ] DonHV runs private backup with the real Render database URL.
- [ ] Backup artifact is stored in approved private storage.
- [ ] Restore proof succeeds on a temporary PostgreSQL target.
- [ ] Upgrade or migration decision is executed before 2026-07-24.

## Vietnamese

`IDTS-45` dùng để bảo vệ môi trường QA dùng chung khỏi rủi ro Render
PostgreSQL Free hết hạn.

Hiện shared QA đã chạy ổn trên Render, nhưng database đang là Render
PostgreSQL Free. Theo tài liệu Render hiện tại, database Free hết hạn sau 30
ngày, có 14 ngày grace period để nâng cấp, và không có managed backup. Vì vậy
IDTS không được xem database này là nơi lưu dữ liệu bền vững nếu chưa có backup
riêng và quyết định nâng cấp hoặc migration.

Quyết định hiện tại:

1. Tạo logical backup private từ Render QA PostgreSQL hiện tại.
2. Nếu team vẫn cần shared QA sau ngày hết hạn, ưu tiên nâng cấp Render
   PostgreSQL trước khi hết hạn.

Migration sang provider khác vẫn là phương án dự phòng, nhưng không nên là mặc
định trong Sprint 4 vì Render QA hiện đã chạy được login, OData, Brevo API và
AWS S3 attachment. Đổi provider lúc này làm tăng rủi ro cutover, credential,
SSL/network và kiểm thử lại.

Backup thật không được commit vào Git và không paste lên Jira. Chỉ upload
evidence an toàn như thời điểm backup, dung lượng file, checksum SHA-256, loại
môi trường restore tạm, và kết quả restore.
