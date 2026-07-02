# IDTS-44 - Render Shared QA Deployment

Last updated: 2026-07-02

## Summary

IDTS-44 prepares a shared Render QA environment so the team can test the integrated app without depending on one developer's local machine.

Target scope:

- CAP Node.js backend and Fiori app served from one Render web service.
- PostgreSQL cloud database through the CAP `integration` profile.
- AWS S3 private object storage for attachments.
- Brevo Transactional API for shared-QA email notification delivery; SMTP remains available for local verification or fallback use.
- Custom login remains the active authentication path.

Vietnamese:

IDTS-44 chuẩn bị môi trường QA dùng chung trên Render để team test app tích hợp mà không phụ thuộc vào máy local của một developer.

Phạm vi mục tiêu:

- Backend CAP Node.js và Fiori app chạy trong một Render web service.
- PostgreSQL cloud thông qua CAP profile `integration`.
- AWS S3 private object storage cho attachment.
- Brevo Transactional API cho email notification tren shared QA; SMTP van duoc giu de verify local hoac lam fallback.
- Custom login vẫn là hướng authentication hiện tại.

## Jira

- Jira: [IDTS-44](https://dutassociation.atlassian.net/browse/IDTS-44)
- Owner: DonHV
- Status: In Progress - blocked by [IDTS-49](https://dutassociation.atlassian.net/browse/IDTS-49)

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
| `render blueprints validate` before repo fix | FAIL - Render CLI requires `services[0].repo` for git-backed services. |
| `render.yaml` repo follow-up | PASS - added `repo: https://github.com/DarwinDO/IDTS-SAP01`. |
| `render blueprints validate` after repo fix | PASS - valid plan with service `idts-sap01-qa` and database `idts-sap01-qa-db`. |
| First Render service creation | SECURITY ISSUE - CAP startup log printed the PostgreSQL URL; the temporary service and DB were deleted immediately before schema/data setup. |
| Replacement Render service creation | IN PROGRESS - recreated Postgres and web service with `cds_log_levels={"cds.serve":"warn"}` to suppress CAP connection credential logging. |
| Replacement log verification | FAIL - Render still logged the PostgreSQL URL; move mitigation from Render env-only to CAP config `cds.log.levels["cds.serve"]="warn"` in `package.json`, then rotate DB/service again. |
| Second replacement log verification | FAIL - even after package-level `cds.serve=warn`, Render still logged the PostgreSQL URL through logger `cds`; add `cds=warn` plus `CDS_LOG_LEVEL=warn`, then rotate DB/service again. |
| Final-rotation log verification after PR #44 | FAIL - final service still logged the PostgreSQL URL because `cds_log_levels` env overrode package config as a string; remove that env var and rely on package-level `cds`/`cds.serve` plus `CDS_LOG_LEVEL=warn`. |
| Local DB deploy through external Render PostgreSQL | FAIL - local machine reached the PostgreSQL profile but timed out connecting to Render external DB; also confirmed `@cap-js/postgres` expects field credentials, not only `credentials.url`. |
| Render DB env mapping follow-up | IN PROGRESS - change Blueprint/service env from connection string to `cds_requires_db_credentials_host/user/password/database/port/ssl`, then run schema deploy through Render pre-deploy in the internal network. |
| Render free-plan schema bootstrap | IN PROGRESS - one-off jobs and pre-deploy commands are blocked on the free plan, so a temporary bootstrap start script is needed to deploy the DB inside Render while redacting failure logs. |
| Render bootstrap timeout follow-up | IN PROGRESS - first bootstrap script run failed with `ResourceRequest timed out`; add Render DB pool acquire timeout env and rerun. |
| Render bootstrap with field DB env and `ssl=false` | PASS - service `srv-d92jk67aqgkc739h6ah0` became live from commit `e4b2d2f`; public AuthService metadata returned 200, login page returned 200, protected BugService anonymous metadata returned 401. |
| Render DB URL log scan after successful bootstrap | PASS - redacted log scan from deploy start found no raw `postgresql://` match. |
| Render PostgreSQL schema/data inspection | PASS - temporary IP allowlist plus Node `pg` confirmed CAP tables exist and `idts_cap_users` has 4 users; allowlist was cleared after inspection. |
| Render QA user password state inspection | PASS - PostgreSQL has 4 active seed users, but all currently have no `passwordhash`; login verification is pending until DonHV supplies private password env vars. |
| Render QA password helper | PASS - added and verified `npm run render:auth:set-qa-passwords`; syntax/help checks pass, missing DB URL fails safely without writing data, secret scan passes, and docs explain temporary allowlist cleanup. |
| Render runtime command cleanup | PARTIAL - service config was updated from bootstrap command to `npm start`, but the follow-up manual deploy stayed in `build_in_progress` after `npm ci`; it was canceled to keep the already-live bootstrap deploy stable. |
| First public login page smoke | FAIL - service returned HTTP 404 for `/bug-management-ui/webapp/login.html`; likely build omitted devDependency `cds-plugin-ui5` because `NODE_ENV=production` was present during `npm ci`. |
| Render build command follow-up | IN PROGRESS - change QA build command to `npm ci --include=dev` so `cds-plugin-ui5` is available for the shared QA preview service. |
| Render health check follow-up | IN PROGRESS - change health check from `/` to `/odata/v4/auth/$metadata` because CAP does not serve a root route for this app. |
| `npx cds compile srv app/bug-management-ui --to edmx -s all` | PASS - exit 0; known attachment annotation warning remains non-blocking. |
| `npm run qa:auth:programmatic` | PASS - 23 PASS / 0 FAIL. |
| `npm run qa:email-outbox:programmatic` | PASS. |
| `npm run qa:depth:self-test` | PASS - 6 PASS / 0 FAIL after adding UTF-8 BOM coverage for PR bodies created from PowerShell files. |
| `npm run qa:secret-scan` | PASS - no credential-like key patterns found. |
| `npx ai-devkit@latest lint --json` | PASS - 5 ok / 0 miss / 0 warn. |
| `git diff --check` | PASS - exit 0; Windows line-ending warnings only. |
| `npm start` local smoke on port 4166 | PASS - login page reachable. |
| Render QA password hash setup | PASS - hashes were written for all 4 active seed users through private process environment values; no plaintext password, hash, or database URL was printed. Temporary PostgreSQL IP allowlisting was cleared. |
| Render public authentication smoke | PASS - DonHV, SangVN, DatDT, and NhanT all logged in; wrong password returned HTTP 401; authenticated BugService OData returned HTTP 200. |
| Shared-QA identity helper | PASS locally - helper targets stable seed UUIDs, validates all four private emails transactionally, preserves password hashes, revokes old sessions, and keeps personal addresses out of repository evidence. Programmatic success/rollback checks pass. |
| Bearer attachment harness | PASS locally - existing HTTP attachment script accepts a process-only Bearer token while preserving local Basic Auth fallback; PowerShell parse and attachment regression pass. |
| Clean Render deploy | PASS - commits `cec3958` and `23ee70f` reached `live` with `npm ci --include=dev` and `npm start`; the latter is the current clean baseline. |
| Cloud identity update | PASS - four stable users were updated through private env values, five old sessions were revoked, 4/4 new logins returned 200, old alias returned 401, and no address was added to repo evidence. |
| PostgreSQL restart persistence | PASS - the same Bearer session returned authenticated OData 200 before and after a clean Render redeploy. |
| Render object-store env mapping | PASS - S3 credentials with underscore field names must be supplied as one JSON env object through `cds_requires_objectStore_credentials`; plain underscore env keys were parsed into nested CAP config paths. |
| AWS S3 attachment acceptance | PASS - after the JSON object-store env fix, the shared-QA Bearer smoke passed comment, draft edit, attachment metadata, S3 stream upload HTTP 204, draft activation, active download content match, and attachment history. |
| Brevo SMTP config presence | PASS - Render service has the required SMTP env keys and starts without the earlier `missing fields: host, username, password, fromAddress` warning. |
| Brevo local SMTP verification | PASS - Nodemailer `verify()` against Brevo SMTP from DonHV local private config succeeded without printing credentials. |
| Brevo recipient-real acceptance | BLOCKED - Render creates an EMAIL delivery row and the worker retries it, but Brevo SMTP delivery fails with sanitized `ETIMEDOUT` on ports 587 and 2525. The bug workflow still commits, so email failure isolation is accepted but real provider delivery is not. |
| Brevo Transactional API acceptance after IDTS-48 | PASS - PR #57 and PR #58 are merged; exact commit `bcf43b2` reached `live` on Render. An authenticated assignment created one new delivery that reached `SENT` on the first attempt with `sentAt` and a provider message id. Post-deploy logs report `brevo-api: sent=1, failed=0` and no new provider error. |
| Render log/metrics review | PARTIAL PASS - no `postgresql://` or AWS access-key pattern found; CPU/memory metrics are available. Operational error logs contain no bearer token value. |
| Follow-up tracking | PASS - Jira IDTS-45 tracks DB expiry/backup and IDTS-46 tracks dependency security findings. |

Vietnamese:

| Kiem tra | Ket qua |
| --- | --- |
| `npm run render:env:db` khi chua inject URL | PASS - CAP nhan profile PostgreSQL voi `credentials.url = null`, san sang nhan env inject. |
| `npm run render:env:db` voi fake `cds_requires_db_credentials_url` tam thoi | PASS - CAP doc URL inject dung vao `requires.db.credentials.url`. |
| Static check `render.yaml` | PASS - co service, database, `fromDatabase`, `sync: false`, va `npm start`. |
| `render blueprints validate` truoc fix repo | FAIL - Render CLI yeu cau `services[0].repo` cho Git-backed service. |
| Follow-up repo trong `render.yaml` | PASS - da them `repo: https://github.com/DarwinDO/IDTS-SAP01`. |
| `render blueprints validate` sau fix repo | PASS - plan hop le voi service `idts-sap01-qa` va database `idts-sap01-qa-db`. |
| Tao Render service lan dau | SECURITY ISSUE - log startup cua CAP da in PostgreSQL URL; temporary service va DB da bi xoa ngay truoc khi setup schema/data. |
| Tao lai Render service | IN PROGRESS - da tao lai Postgres va web service voi `cds_log_levels={"cds.serve":"warn"}` de chan CAP log connection credential. |
| Verify log replacement | FAIL - Render van log PostgreSQL URL; chuyen mitigation tu Render env-only sang CAP config `cds.log.levels["cds.serve"]="warn"` trong `package.json`, sau do rotate DB/service lan nua. |
| Verify log replacement lan 2 | FAIL - sau khi them package-level `cds.serve=warn`, Render van log PostgreSQL URL qua logger `cds`; can them `cds=warn` va `CDS_LOG_LEVEL=warn`, roi rotate DB/service lan nua. |
| Verify log final rotation sau PR #44 | FAIL - service final van log PostgreSQL URL vi env `cds_log_levels` override package config thanh string; can bo env nay va chi dua vao package-level `cds`/`cds.serve` cung `CDS_LOG_LEVEL=warn`. |
| Local DB deploy qua external Render PostgreSQL | FAIL - may local vao dung PostgreSQL profile nhung timeout khi ket noi toi Render external DB; dong thoi xac nhan `@cap-js/postgres` can credential field rieng, khong chi `credentials.url`. |
| Follow-up mapping env DB Render | IN PROGRESS - doi Blueprint/service env tu connection string sang `cds_requires_db_credentials_host/user/password/database/port/ssl`, roi chay schema deploy bang Render pre-deploy trong internal network. |
| Bootstrap schema tren Render free plan | IN PROGRESS - one-off job va pre-deploy command bi chan tren free plan, nen can script bootstrap tam thoi de deploy DB trong Render va redact log fail. |
| Follow-up timeout bootstrap Render | IN PROGRESS - lan chay bootstrap script dau fail voi `ResourceRequest timed out`; them env tang DB pool acquire timeout va chay lai. |
| Render bootstrap with field DB env and `ssl=false` | PASS - service `srv-d92jk67aqgkc739h6ah0` became live from commit `e4b2d2f`; public AuthService metadata returned 200, login page returned 200, protected BugService anonymous metadata returned 401. |
| Render DB URL log scan after successful bootstrap | PASS - redacted log scan from deploy start found no raw `postgresql://` match. |
| Kiem tra schema/data PostgreSQL tren Render | PASS - dung temporary IP allowlist va Node `pg` de xac nhan CAP tables ton tai, `idts_cap_users` co 4 users; allowlist da duoc clear sau khi inspect. |
| Kiem tra password state user QA tren Render | PASS - PostgreSQL co 4 active seed users, nhung tat ca chua co `passwordhash`; verify login dang cho DonHV nhap password private qua env. |
| Helper set password QA tren Render | PASS - da them va verify `npm run render:auth:set-qa-passwords`; syntax/help pass, thieu DB URL thi fail an toan khong ghi data, secret scan pass, docs giai thich cach clear temporary allowlist. |
| Render runtime command cleanup | PARTIAL - service config was updated from bootstrap command to `npm start`, but the follow-up manual deploy stayed in `build_in_progress` after `npm ci`; it was canceled to keep the already-live bootstrap deploy stable. |
| Smoke public login page lan dau | FAIL - service tra HTTP 404 cho `/bug-management-ui/webapp/login.html`; kha nang cao build bo qua devDependency `cds-plugin-ui5` vi `NODE_ENV=production` co trong luc chay `npm ci`. |
| Follow-up build command Render | IN PROGRESS - doi QA build command thanh `npm ci --include=dev` de `cds-plugin-ui5` co mat cho shared QA preview service. |
| Follow-up health check Render | IN PROGRESS - doi health check tu `/` sang `/odata/v4/auth/$metadata` vi CAP khong serve root route cho app nay. |
| `npx cds compile srv app/bug-management-ui --to edmx -s all` | PASS - exit 0; warning attachment annotation da biet van non-blocking. |
| `npm run qa:auth:programmatic` | PASS - 23 PASS / 0 FAIL. |
| `npm run qa:email-outbox:programmatic` | PASS. |
| `npm run qa:depth:self-test` | PASS - 6 PASS / 0 FAIL sau khi them coverage UTF-8 BOM cho PR body tao tu file PowerShell. |
| `npm run qa:secret-scan` | PASS - khong phat hien pattern credential. |
| `npx ai-devkit@latest lint --json` | PASS - 5 ok / 0 miss / 0 warn. |
| `git diff --check` | PASS - exit 0; chi co warning line-ending tren Windows. |
| `npm start` smoke local tren port 4166 | PASS - login page reachable. |
| Setup password hash QA tren Render | PASS - da ghi hash cho ca 4 seed user active bang private process environment; khong in plaintext password, hash hoac database URL. Allowlist IP PostgreSQL tam thoi da duoc clear. |
| Smoke authentication public tren Render | PASS - DonHV, SangVN, DatDT va NhanT deu login duoc; password sai tra HTTP 401; BugService OData co auth tra HTTP 200. |
| Helper identity shared QA | PASS local - helper tim user bang UUID seed, validate bon email private trong transaction, giu password hash, revoke session cu va khong dua email that vao evidence repo. Test success/rollback da pass. |
| Bearer attachment harness | PASS local - script HTTP attachment nhan Bearer token process-only va van giu Basic Auth fallback cho local; PowerShell parse va attachment regression pass. |
| Clean deploy Render | PASS - commit `cec3958` va `23ee70f` dat `live` voi `npm ci --include=dev` va `npm start`; commit sau la baseline sach hien tai. |
| Cap nhat identity cloud | PASS - bon stable user duoc update bang private env, nam session cu bi revoke, 4/4 login moi tra 200, alias cu tra 401 va khong co dia chi that trong evidence repo. |
| PostgreSQL persistence qua restart | PASS - cung Bearer session van goi OData 200 truoc va sau clean redeploy. |
| Mapping env object-store Render | PASS - credential S3 co field ten underscore phai dua vao mot JSON env object `cds_requires_objectStore_credentials`; env key underscore rieng le bi CAP parse thanh nested config path. |
| AWS S3 attachment | PASS - sau khi fix env object-store JSON, smoke shared-QA bang Bearer token pass comment, draft edit, metadata attachment, upload stream S3 HTTP 204, activate draft, download active dung content, va history attachment. |
| Cau hinh Brevo SMTP | PASS - service Render co du key SMTP bat buoc va startup khong con warning `missing fields: host, username, password, fromAddress`. |
| Verify SMTP Brevo tu local | PASS - Nodemailer `verify()` toi Brevo SMTP bang private config cua DonHV thanh cong va khong in credential. |
| Brevo gui dung recipient | BLOCKED - Render tao duoc EMAIL delivery row va worker retry, nhung delivery qua Brevo SMTP fail voi `ETIMEDOUT` da sanitize tren port 587 va 2525. Workflow bug van commit, nen co the accept failure isolation nhung chua accept real provider delivery. |
| Acceptance Brevo Transactional API sau IDTS-48 | PASS - PR #57 va PR #58 da merge; commit chinh xac `bcf43b2` da `live` tren Render. Mot thao tac assign co auth tao delivery moi va delivery `SENT` ngay lan dau, co `sentAt` va provider message id. Log sau deploy ghi `brevo-api: sent=1, failed=0` va khong co provider error moi. |
| Review log/metrics Render | PASS mot phan - khong co match `postgresql://` hoac pattern AWS access key; co CPU/memory metrics. Log error khong lo gia tri bearer token. |
| Follow-up Jira | PASS - IDTS-45 track DB het han/backup va IDTS-46 track dependency security. |

## Final evidence review - 2026-07-02

English:

| Area | Result | Evidence / remaining work |
| --- | --- | --- |
| Render runtime | PASS | Current `dev` commit `97dfb3f` redeployed as `dep-d932p167r5hc73a2a1n0` and reached `live`; service is not suspended and PostgreSQL reports `available`. |
| Auth and protected OData | PASS | Auth metadata and login page returned 200; wrong login and anonymous protected OData returned 401; authenticated protected OData returned 200. |
| Brevo Transactional API | PASS | Render logs show `brevo-api: sent=1, failed=0` with no new provider error. Existing `SENT` evidence covered two recipients; the final review added a new `SENT` delivery for NhanT and restored BUG-0001 to `ASSIGNED`. |
| PostgreSQL and AWS S3 persistence | PASS | A fresh QA attachment passed upload/activate/download. After redeploy, the same file downloaded with a matching SHA-256; delete returned 204 and post-delete download returned 404. |
| Secret/log safety | PASS | Evidence contains no credential, bearer token, private recipient address, database URL, AWS key, or provider message id. Render error-log query returned no new error logs after the accepted Brevo deploy. |
| Final reporter-routing scenario | BLOCKED | A PM-authenticated Bug draft cannot activate without a client-provided `reporter_ID`; activation returns HTTP 400 `Reporter is required`. Root cause is tracked by IDTS-49. Controlled failed drafts were deleted. |

IDTS-44 must remain In Progress until IDTS-49 is fixed, merged, deployed, and the missing DonHV reporter notification reaches `SENT`.

Vietnamese:

| Khu vuc | Ket qua | Evidence / viec con lai |
| --- | --- | --- |
| Render runtime | PASS | Commit `dev` hien tai `97dfb3f` da redeploy thanh `dep-d932p167r5hc73a2a1n0` va dat `live`; service khong suspended, PostgreSQL bao `available`. |
| Auth va protected OData | PASS | Auth metadata va login page tra 200; login sai va protected OData anonymous tra 401; protected OData co auth tra 200. |
| Brevo Transactional API | PASS | Log Render ghi `brevo-api: sent=1, failed=0` va khong co provider error moi. Evidence `SENT` cu bao phu hai recipient; final review them delivery `SENT` cho NhanT va restore BUG-0001 ve `ASSIGNED`. |
| PostgreSQL va AWS S3 persistence | PASS | Attachment QA moi pass upload/activate/download. Sau redeploy, cung file download voi SHA-256 khop; delete tra 204 va download sau delete tra 404. |
| An toan secret/log | PASS | Evidence khong chua credential, bearer token, private recipient address, database URL, AWS key hay provider message id. Query error log Render khong co error moi sau Brevo deploy da accept. |
| Scenario routing reporter cuoi | BLOCKED | Bug draft co PM auth khong activate duoc neu client khong gui `reporter_ID`; activation tra HTTP 400 `Reporter is required`. Root cause duoc track boi IDTS-49. Controlled failed drafts da xoa. |

IDTS-44 phai giu In Progress den khi IDTS-49 duoc fix, merge, deploy va notification reporter DonHV con thieu dat `SENT`.
