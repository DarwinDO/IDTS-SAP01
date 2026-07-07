# IDTS-45 Evidence - Render PostgreSQL Continuity

This folder stores evidence that is safe to commit for `IDTS-45`.

Do not commit actual PostgreSQL dump files, checksum files that reveal private
artifact names, database URLs, Render screenshots with private hostnames,
personal email lists, bearer tokens, AWS keys, Brevo keys, or password values.

The actual database backup must be stored in approved private storage outside
the repository. DonHV will upload or attach evidence manually when needed.

## Current evidence index

| Evidence | Status | Notes |
| --- | --- | --- |
| Render official policy check | Done | Free Render PostgreSQL expires after 30 days, has a 14-day upgrade grace period, and Free PostgreSQL has no managed backup support. |
| Render CLI read-only state | Done | Workspace `IDTS_GSUSAP01`; service `idts-sap01-qa` not suspended; database `idts-sap01-qa-db` available, Free plan, Singapore, expires 2026-07-31, empty IP allowlist. |
| Backup helper | Prepared | `scripts/render/backup-render-postgres.ps1` creates a local private logical dump when DonHV provides `RENDER_QA_DATABASE_URL` privately. |
| Restore helper | Prepared | `scripts/render/restore-render-postgres.ps1` can inspect a dump and restore only with an explicit overwrite flag against a temporary target. |
| PostgreSQL client fallback | Done | Host `pg_dump`/`pg_restore` are not installed, but Docker Desktop can run `postgres:15` clients for backup and restore helpers. |
| Restore proof | Pending private run | Must be executed against a temporary PostgreSQL target, not the live shared-QA database. |
| Decision | Prepared | Recommendation is recorded in `docs/pm/tasks/idts-45-render-postgres-continuity.md` and `docs/pm/risk-decision-log.md`. |

## Source references checked

- Render Free plan documentation for Free PostgreSQL expiry and backup limits:
  <https://render.com/docs/free>.
- Render PostgreSQL backup documentation for `pg_dump` fallback and paid-plan
  logical backup behavior: <https://render.com/docs/postgresql-backups>.

## Manual evidence DonHV should upload later

After running the backup privately, upload only safe evidence to Jira:

- backup timestamp;
- backup file size;
- SHA-256 checksum value;
- restore target type, for example local temporary PostgreSQL or new Render paid DB;
- restore result summary;
- confirmation that no DB URL, password, token, AWS key, Brevo key, or full real recipient list is shown.

Do not upload the database dump itself unless the storage location is explicitly
approved for private project data.

## Vietnamese

Folder này chỉ lưu evidence an toàn để commit cho `IDTS-45`.

Không commit file dump PostgreSQL thật, file checksum làm lộ tên artifact riêng
tư, database URL, screenshot Render có hostname private, danh sách email thật,
bearer token, AWS key, Brevo key, hoặc password.

Backup thật phải được lưu ở nơi private đã được duyệt, nằm ngoài repository.
DonHV sẽ tự upload hoặc attach evidence bằng tay khi cần.

Evidence nên upload sau khi chạy backup:

- thời điểm backup;
- dung lượng file backup;
- SHA-256 checksum;
- loại môi trường restore tạm;
- kết quả restore;
- xác nhận evidence không lộ DB URL, password, token, AWS key, Brevo key hoặc danh sách email thật.
