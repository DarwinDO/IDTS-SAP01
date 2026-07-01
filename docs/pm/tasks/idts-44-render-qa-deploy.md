# IDTS-44 - Render Shared QA Deployment

Last updated: 2026-07-01

## Summary

IDTS-44 prepares a shared Render QA environment so the team can test the integrated app without depending on one developer's local machine.

Target scope:

- CAP Node.js backend and Fiori app served from one Render web service.
- PostgreSQL cloud database through the CAP `integration` profile.
- AWS S3 private object storage for attachments.
- Brevo SMTP for email notification delivery.
- Custom login remains the active authentication path.

Vietnamese:

IDTS-44 chuẩn bị môi trường QA dùng chung trên Render để team test app tích hợp mà không phụ thuộc vào máy local của một developer.

Phạm vi mục tiêu:

- Backend CAP Node.js và Fiori app chạy trong một Render web service.
- PostgreSQL cloud thông qua CAP profile `integration`.
- AWS S3 private object storage cho attachment.
- Brevo SMTP cho email notification.
- Custom login vẫn là hướng authentication hiện tại.

## Jira

- Jira: [IDTS-44](https://dutassociation.atlassian.net/browse/IDTS-44)
- Owner: DonHV
- Status: In Progress

## Implementation notes

- Branch: `chore/idts-44-render-qa-deploy-donhv`
- Render config: `render.yaml`
- Deployment guide: `docs/deployment/render-qa.md`
- Runtime start script: `npm start`
- First DB deploy script: `npm run render:db:deploy`
- First password setup script: `npm run render:auth:set-password`

No real Render, Brevo, AWS, PostgreSQL, auth, or user password secrets are stored in the repository.

Vietnamese:

- Branch: `chore/idts-44-render-qa-deploy-donhv`
- Config Render: `render.yaml`
- Hướng dẫn deploy: `docs/deployment/render-qa.md`
- Script start runtime: `npm start`
- Script deploy DB lần đầu: `npm run render:db:deploy`
- Script set password lần đầu: `npm run render:auth:set-password`

Không lưu secret thật của Render, Brevo, AWS, PostgreSQL, auth, hoặc password user trong repository.

## Acceptance criteria

- Render Blueprint exists and can create the web service plus PostgreSQL resource.
- CAP cloud profile uses PostgreSQL through environment variables, not `db.sqlite`.
- Email and S3 configuration are private Render environment variables.
- Team has documented first-time steps for schema deploy, password setup, endpoint verification, and rollback.
- Local verification passes before PR merge.
- Jira and PM status record the deployment preparation and any tooling/environment issues discovered.

Vietnamese:

- Có Render Blueprint để tạo web service và PostgreSQL resource.
- CAP cloud profile dùng PostgreSQL qua environment variables, không dùng `db.sqlite`.
- Config email và S3 nằm trong private env vars của Render.
- Team có hướng dẫn rõ cho deploy schema lần đầu, set password, verify endpoint, và rollback.
- Verification local pass trước khi merge PR.
- Jira và PM status ghi nhận phần chuẩn bị deploy và các lỗi tooling/environment phát hiện được.

## Manual handoff after merge

DonHV should:

1. Open Render Dashboard.
2. Create Blueprint from GitHub branch `dev`.
3. Fill `sync: false` secrets.
4. Deploy service.
5. Run `npm run render:db:deploy` in Render Shell.
6. Run `npm run render:auth:set-password` for each QA user.
7. Verify login, OData, PostgreSQL persistence, email disabled mode, optional email enabled mode, and attachment flow.

Vietnamese:

DonHV cần:

1. Mở Render Dashboard.
2. Tạo Blueprint từ GitHub branch `dev`.
3. Nhập các secret có `sync: false`.
4. Deploy service.
5. Chạy `npm run render:db:deploy` trong Render Shell.
6. Chạy `npm run render:auth:set-password` cho từng QA user.
7. Verify login, OData, PostgreSQL persistence, email disabled mode, optional email enabled mode, và attachment flow.

## Verification log

Local verification before PR:

| Check | Result |
| --- | --- |
| `npm run render:env:db` without injected URL | PASS - CAP resolves PostgreSQL profile with `credentials.url = null`, ready for injected env. |
| `npm run render:env:db` with temporary fake `cds_requires_db_credentials_url` | PASS - CAP reads the injected URL under `requires.db.credentials.url`. |
| `render.yaml` static check | PASS - service, database, `fromDatabase`, `sync: false`, and `npm start` are present. |
| `npx cds compile srv app/bug-management-ui --to edmx -s all` | PASS - exit 0; known attachment annotation warning remains non-blocking. |
| `npm run qa:auth:programmatic` | PASS - 23 PASS / 0 FAIL. |
| `npm run qa:email-outbox:programmatic` | PASS. |
| `npm run qa:depth:self-test` | PASS - 5 PASS / 0 FAIL. |
| `npm run qa:secret-scan` | PASS - no credential-like key patterns found. |
| `npx ai-devkit@latest lint --json` | PASS - 5 ok / 0 miss / 0 warn. |
| `git diff --check` | PASS - exit 0; Windows line-ending warnings only. |
| `npm start` local smoke on port 4166 | PASS - login page reachable. |

Vietnamese:

| Kiem tra | Ket qua |
| --- | --- |
| `npm run render:env:db` khi chua inject URL | PASS - CAP nhan profile PostgreSQL voi `credentials.url = null`, san sang nhan env inject. |
| `npm run render:env:db` voi fake `cds_requires_db_credentials_url` tam thoi | PASS - CAP doc URL inject dung vao `requires.db.credentials.url`. |
| Static check `render.yaml` | PASS - co service, database, `fromDatabase`, `sync: false`, va `npm start`. |
| `npx cds compile srv app/bug-management-ui --to edmx -s all` | PASS - exit 0; warning attachment annotation da biet van non-blocking. |
| `npm run qa:auth:programmatic` | PASS - 23 PASS / 0 FAIL. |
| `npm run qa:email-outbox:programmatic` | PASS. |
| `npm run qa:depth:self-test` | PASS - 5 PASS / 0 FAIL. |
| `npm run qa:secret-scan` | PASS - khong phat hien pattern credential. |
| `npx ai-devkit@latest lint --json` | PASS - 5 ok / 0 miss / 0 warn. |
| `git diff --check` | PASS - exit 0; chi co warning line-ending tren Windows. |
| `npm start` smoke local tren port 4166 | PASS - login page reachable. |
