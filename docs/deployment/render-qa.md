# IDTS Render Shared QA Deployment

Last updated: 2026-07-01

## Purpose

This document explains how to deploy IDTS to Render as a shared QA environment for the team.

Use this environment for shared testing of:

- custom login;
- protected OData calls;
- PostgreSQL persistence;
- Brevo SMTP email notification/outbox behavior;
- AWS S3 attachment upload and download.

This is a QA/demo environment, not the final enterprise production deployment.

Vietnamese:

Tài liệu này hướng dẫn deploy IDTS lên Render để team có một môi trường QA dùng chung.

Môi trường này dùng để test chung:

- login custom;
- OData có bảo vệ bằng token;
- dữ liệu lưu trên PostgreSQL cloud;
- email notification/outbox qua Brevo SMTP;
- upload/download attachment qua AWS S3.

Đây là môi trường QA/demo, chưa phải production enterprise cuối cùng.

## What Render will run

Render runs one Node.js web service from this repository:

- Blueprint file: `render.yaml`
- Runtime: Node.js
- Start command: `npm start`
- CAP profile: `integration`
- Database: Render PostgreSQL, injected into CAP through field credentials such as `cds_requires_db_credentials_host`, `cds_requires_db_credentials_user`, `cds_requires_db_credentials_password`, `cds_requires_db_credentials_database`, and `cds_requires_db_credentials_port`
- Attachment binary storage: AWS S3, injected through `cds_requires_objectStore_credentials_*`
- Email provider: Brevo SMTP, injected through `cds_idts_email_*`

Vietnamese:

Render sẽ chạy một web service Node.js từ repo này:

- File Blueprint: `render.yaml`
- Runtime: Node.js
- Lệnh start: `npm start`
- Profile CAP: `integration`
- Database: Render PostgreSQL, inject vào CAP bằng các field credential như `cds_requires_db_credentials_host`, `cds_requires_db_credentials_user`, `cds_requires_db_credentials_password`, `cds_requires_db_credentials_database`, và `cds_requires_db_credentials_port`
- Nội dung file attachment: AWS S3, inject bằng `cds_requires_objectStore_credentials_*`
- Gửi email: Brevo SMTP, inject bằng `cds_idts_email_*`

## Why the env names look unusual

CAP reads nested configuration from environment variables by using underscore paths.

Example:

```text
cds_requires_db_credentials_host
```

means:

```json
{
  "cds": {
    "requires": {
      "db": {
        "credentials": {
            "host": "..."
        }
      }
    }
  }
}
```

That is why the Blueprint uses `cds_requires_*` and `cds_idts_*` variables instead of putting credentials into source files.

Current Render QA note: the working PostgreSQL configuration uses field credentials instead of a single `credentials.url` value. In this project version, `@cap-js/postgres` connects correctly with:

```text
cds_requires_db_credentials_host
cds_requires_db_credentials_port
cds_requires_db_credentials_user
cds_requires_db_credentials_password
cds_requires_db_credentials_database
cds_requires_db_credentials_ssl=false
```

Vietnamese:

Ghi chú hiện tại cho Render QA: cấu hình PostgreSQL đang chạy ổn bằng các field credential riêng, không dùng một biến `credentials.url` duy nhất. Với version hiện tại của project, `@cap-js/postgres` kết nối đúng bằng:

```text
cds_requires_db_credentials_host
cds_requires_db_credentials_port
cds_requires_db_credentials_user
cds_requires_db_credentials_password
cds_requires_db_credentials_database
cds_requires_db_credentials_ssl=false
```

Vietnamese:

CAP đọc config lồng nhau từ biến môi trường bằng cách dùng tên biến có dấu gạch dưới.

Ví dụ:

```text
cds_requires_db_credentials_host
```

có nghĩa là:

```json
{
  "cds": {
    "requires": {
      "db": {
        "credentials": {
            "host": "..."
        }
      }
    }
  }
}
```

Vì vậy Blueprint dùng các biến `cds_requires_*` và `cds_idts_*` thay vì lưu credential vào source code.

## First-time Render setup

1. Merge the Render deployment PR into `dev`.
2. Open Render Dashboard.
3. Create a new Blueprint from the GitHub repository.
4. Select the `dev` branch.
5. Let Render read `render.yaml`.
6. Fill every `sync: false` secret in the Dashboard.
7. Create the Blueprint resources.

Vietnamese:

1. Merge PR deploy Render vào `dev`.
2. Mở Render Dashboard.
3. Tạo Blueprint mới từ GitHub repo.
4. Chọn branch `dev`.
5. Để Render đọc file `render.yaml`.
6. Nhập các secret có `sync: false` trong Dashboard.
7. Tạo các resource từ Blueprint.

## Required secrets

Do not paste these values into GitHub, Jira, screenshots, docs, or terminal output that will be shared.

| Render env var | Meaning | Example shape |
| --- | --- | --- |
| `cds_requires_objectStore_credentials_bucket` | Private AWS S3 bucket name | `idts-...` |
| `cds_requires_objectStore_credentials_region` | AWS region of the bucket | `ap-southeast-2` |
| `cds_requires_objectStore_credentials_access_key_id` | IAM access key allowed to use that bucket | `AKIA...` |
| `cds_requires_objectStore_credentials_secret_access_key` | IAM secret access key | private |
| `cds_idts_email_host` | Brevo SMTP host | `smtp-relay.brevo.com` |
| `cds_idts_email_username` | Brevo SMTP login | private |
| `cds_idts_email_password` | Brevo SMTP key/password | private |
| `cds_idts_email_fromAddress` | Verified Brevo sender email | verified sender |
| `cds_idts_email_replyTo` | Optional reply-to address | optional |
| `cds_idts_email_baseUrl` | Public Render app URL | `https://...onrender.com/bug-management-ui/webapp/index.html` |
| `cds_idts_email_defaultTestRecipient` | Optional test recipient when test mode is enabled | optional |

Vietnamese:

Không dán các giá trị này vào GitHub, Jira, ảnh chụp màn hình, tài liệu, hoặc terminal output được chia sẻ.

| Biến môi trường Render | Ý nghĩa | Dạng ví dụ |
| --- | --- | --- |
| `cds_requires_objectStore_credentials_bucket` | Tên private AWS S3 bucket | `idts-...` |
| `cds_requires_objectStore_credentials_region` | Region của bucket | `ap-southeast-2` |
| `cds_requires_objectStore_credentials_access_key_id` | IAM access key được phép dùng bucket | `AKIA...` |
| `cds_requires_objectStore_credentials_secret_access_key` | IAM secret access key | private |
| `cds_idts_email_host` | Host SMTP của Brevo | `smtp-relay.brevo.com` |
| `cds_idts_email_username` | SMTP login của Brevo | private |
| `cds_idts_email_password` | SMTP key/password của Brevo | private |
| `cds_idts_email_fromAddress` | Sender email đã verify trên Brevo | verified sender |
| `cds_idts_email_replyTo` | Reply-to tùy chọn | optional |
| `cds_idts_email_baseUrl` | Public URL của app trên Render | `https://...onrender.com/bug-management-ui/webapp/index.html` |
| `cds_idts_email_defaultTestRecipient` | Người nhận test nếu bật test mode | optional |

## Safe defaults

The Blueprint keeps email disabled by default:

```text
cds_idts_email_enabled=false
```

This lets the team verify login, OData, database, and attachments first. After those pass, turn email on by changing:

```text
cds_idts_email_enabled=true
```

Vietnamese:

Blueprint mặc định tắt email:

```text
cds_idts_email_enabled=false
```

Cách này giúp team test login, OData, database, và attachment trước. Sau khi các phần đó ổn, bật email bằng cách đổi:

```text
cds_idts_email_enabled=true
```

## First database deployment

The first service deploy only starts the app. PostgreSQL still needs CAP tables and seed data.

After the Render service is created, open the Render Shell for the web service and run:

```bash
npm run render:db:deploy
```

This runs `cds-deploy` using the `integration` profile and the PostgreSQL credentials injected by Render.

Vietnamese:

Lần deploy service đầu tiên chỉ khởi động app. PostgreSQL vẫn cần được tạo bảng và seed data.

Sau khi Render service được tạo, mở Render Shell của web service và chạy:

```bash
npm run render:db:deploy
```

Lệnh này chạy `cds-deploy` bằng profile `integration` và PostgreSQL credentials do Render inject.

## First password setup

Seed data creates user profiles, but it does not store real passwords. Set passwords from the Render Shell with private environment variables.

Example for one user:

```bash
export IDTS_AUTH_EMAIL="donhv@example.local"
export IDTS_AUTH_PASSWORD="<private-password>"
npm run render:auth:set-password
unset IDTS_AUTH_EMAIL
unset IDTS_AUTH_PASSWORD
```

Repeat this for each QA account that needs login access.

Important: the command writes only a password hash to the database. It must not print or store the plaintext password in source control.

Vietnamese:

Seed data chỉ tạo user/profile, không lưu password thật. Thiết lập password trong Render Shell bằng biến môi trường private.

Ví dụ cho một user:

```bash
export IDTS_AUTH_EMAIL="donhv@example.local"
export IDTS_AUTH_PASSWORD="<private-password>"
npm run render:auth:set-password
unset IDTS_AUTH_EMAIL
unset IDTS_AUTH_PASSWORD
```

Lặp lại cho từng account QA cần đăng nhập.

Lưu ý: command chỉ ghi password hash vào database. Không được in hoặc lưu plaintext password vào source control.

## Current password setup path with Render CLI

Render free-plan one-off jobs and pre-deploy commands may be unavailable. If Render Shell is not available, DonHV can set QA password hashes from the local machine with the Render CLI and the repository helper script.

This path still keeps secrets out of source control:

- Render CLI reads the private PostgreSQL connection string.
- The password is read only from a local environment variable.
- The helper writes only password hashes to PostgreSQL.
- The temporary PostgreSQL IP allowlist entry must be removed after the command.

PowerShell example for setting the same temporary QA password for all four seed users:

```powershell
$render = Join-Path $env:USERPROFILE '.local\bin\render.exe'
$dbId = 'dpg-d92j3g4vikkc738fu670-a'
$yourIp = '<your-current-public-ip>'

& $render postgres update $dbId --ip-allow-list "cidr=$yourIp/32,description=temporary-password-setup" --confirm -o json | Out-Null
try {
  $db = (& $render postgres get $dbId --include-sensitive-connection-info -o json | ConvertFrom-Json).data
  $env:IDTS_RENDER_DATABASE_URL = $db.connectionInfo.externalConnectionString
  $env:IDTS_QA_SHARED_PASSWORD = '<private-temporary-password>'
  npm run render:auth:set-qa-passwords
} finally {
  Remove-Item Env:\IDTS_RENDER_DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:\IDTS_QA_SHARED_PASSWORD -ErrorAction SilentlyContinue
  & $render postgres update $dbId --clear-ip-allow-list --confirm -o json | Out-Null
}
```

PowerShell example for setting one user only:

```powershell
$env:IDTS_AUTH_EMAIL = 'donhv@example.local'
$env:IDTS_AUTH_PASSWORD = '<private-password>'
npm run render:auth:set-qa-passwords
Remove-Item Env:\IDTS_AUTH_EMAIL -ErrorAction SilentlyContinue
Remove-Item Env:\IDTS_AUTH_PASSWORD -ErrorAction SilentlyContinue
```

Vietnamese:

Render free plan có thể không cho chạy one-off job hoặc pre-deploy command. Nếu Render Shell không dùng được, DonHV có thể set password hash cho QA từ máy local bằng Render CLI và helper script trong repo.

Cách này vẫn giữ secret an toàn:

- Render CLI đọc private PostgreSQL connection string.
- Password chỉ được đọc từ biến môi trường local.
- Helper chỉ ghi password hash vào PostgreSQL.
- Temporary PostgreSQL IP allowlist phải được gỡ sau khi chạy xong.

Ví dụ PowerShell để set cùng một temporary QA password cho bốn user seed:

```powershell
$render = Join-Path $env:USERPROFILE '.local\bin\render.exe'
$dbId = 'dpg-d92j3g4vikkc738fu670-a'
$yourIp = '<public-ip-hien-tai-cua-ban>'

& $render postgres update $dbId --ip-allow-list "cidr=$yourIp/32,description=temporary-password-setup" --confirm -o json | Out-Null
try {
  $db = (& $render postgres get $dbId --include-sensitive-connection-info -o json | ConvertFrom-Json).data
  $env:IDTS_RENDER_DATABASE_URL = $db.connectionInfo.externalConnectionString
  $env:IDTS_QA_SHARED_PASSWORD = '<private-temporary-password>'
  npm run render:auth:set-qa-passwords
} finally {
  Remove-Item Env:\IDTS_RENDER_DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:\IDTS_QA_SHARED_PASSWORD -ErrorAction SilentlyContinue
  & $render postgres update $dbId --clear-ip-allow-list --confirm -o json | Out-Null
}
```

## Verification after deploy

Use the public Render URL.

Minimum checks:

1. Open `/bug-management-ui/webapp/login.html`.
2. Wrong password is rejected with a safe message.
3. Correct password logs in and opens the app.
4. Anonymous protected OData request is rejected.
5. Authenticated OData request can read bugs/master data.
6. Create or update a bug, then redeploy/restart the service and confirm data persists.
7. With email disabled, workflow still works and deliveries are `SKIPPED`.
8. With email enabled, a workflow notification creates a delivery and the outbox moves it to `SENT` or safe `FAILED`.
9. Upload and download an attachment if AWS S3 env vars are configured.
10. Review logs and confirm no password, bearer token, SMTP password, AWS secret, or private recipient data is printed.

Vietnamese:

Dùng public URL của Render.

Các kiểm tra tối thiểu:

1. Mở `/bug-management-ui/webapp/login.html`.
2. Login sai password bị từ chối bằng message an toàn.
3. Login đúng mở được app.
4. Gọi OData protected khi anonymous bị chặn.
5. Gọi OData có token đọc được bugs/master data.
6. Tạo hoặc cập nhật bug, sau đó redeploy/restart service và xác nhận data vẫn còn.
7. Khi email tắt, workflow vẫn chạy và delivery là `SKIPPED`.
8. Khi email bật, workflow notification tạo delivery và outbox chuyển sang `SENT` hoặc `FAILED` an toàn.
9. Upload/download attachment nếu AWS S3 env đã cấu hình.
10. Kiểm tra log để chắc chắn không in password, bearer token, SMTP password, AWS secret, hoặc dữ liệu người nhận private.

## Change QA login emails without committing personal data

The shared QA environment may use real team email addresses as login names and
notification recipients. Keep those addresses in process environment variables;
do not add them to the seed CSV, repository docs, Jira, or public evidence.

Use `npm run render:auth:update-qa-emails` with these private variables:

```text
IDTS_QA_DONHV_EMAIL
IDTS_QA_SANGVN_EMAIL
IDTS_QA_DATDT_EMAIL
IDTS_QA_NHANT_EMAIL
```

The helper locates users by stable seed UUID, lowercases the addresses, preserves
password hashes and roles, rejects missing/invalid/duplicate values in one
transaction, and revokes old sessions. After a future `cds deploy` reloads seed
data, rerun this helper before shared QA login or email testing.

Vietnamese:

Moi truong QA dung chung co the dung email that cua team lam ten dang nhap va dia
chi nhan notification. Chi truyen cac dia chi nay qua process environment; khong
them vao CSV seed, tai lieu repo, Jira hoac evidence public.

Chay `npm run render:auth:update-qa-emails` voi bon bien private o tren. Helper
tim user bang UUID seed on dinh, chuyen email ve chu thuong, giu nguyen password
hash va role, rollback neu thieu/sai/trung email, va revoke session cu. Sau lan
`cds deploy` co nap lai seed data, phai chay lai helper truoc khi test login/email.

For the attachment HTTP harness, pass a custom-auth bearer token through the
process-only variable `IDTS_QA_BEARER_TOKEN`. The script keeps Basic Auth only as
a local-development fallback and does not print the token.

Vietnamese: Voi attachment HTTP harness tren shared QA, truyen bearer token qua
bien process-only `IDTS_QA_BEARER_TOKEN`. Script chi giu Basic Auth lam fallback
cho local development va khong in token.

## Rollback and emergency switches

If the app cannot start:

- check Render logs first;
- confirm `CDS_ENV=integration`;
- confirm the Render database field credentials exist, especially `cds_requires_db_credentials_host`, `cds_requires_db_credentials_user`, `cds_requires_db_credentials_password`, `cds_requires_db_credentials_database`, and `cds_requires_db_credentials_port`;
- run `npm run render:env:db` in the Render Shell to inspect DB config shape without printing unrelated secrets.

If SMTP causes noise:

- set `cds_idts_email_enabled=false`;
- redeploy or restart the service;
- keep bug workflow available while email is investigated.

If attachment upload fails:

- confirm the S3 bucket, region, access key, and secret access key;
- confirm the IAM policy allows `GetObject`, `PutObject`, `DeleteObject`, and multipart/list operations for the configured bucket;
- do not make the bucket public.

Vietnamese:

Nếu app không start:

- kiểm tra Render logs trước;
- xác nhận `CDS_ENV=integration`;
- xác nhận có các field credential của Render database, đặc biệt là `cds_requires_db_credentials_host`, `cds_requires_db_credentials_user`, `cds_requires_db_credentials_password`, `cds_requires_db_credentials_database`, và `cds_requires_db_credentials_port`;
- chạy `npm run render:env:db` trong Render Shell để xem shape config DB, không in các secret không liên quan.

Nếu SMTP gây lỗi hoặc spam:

- set `cds_idts_email_enabled=false`;
- redeploy hoặc restart service;
- giữ workflow bug chạy bình thường trong khi điều tra email.

Nếu upload attachment lỗi:

- kiểm tra S3 bucket, region, access key, và secret access key;
- kiểm tra IAM policy có quyền `GetObject`, `PutObject`, `DeleteObject`, và multipart/list cho bucket đã cấu hình;
- không chuyển bucket sang public.

## Current operational limitation

Render MCP and CLI are now available for service, deploy, and log inspection.
Private secret values remain DonHV-controlled and must not be copied into chat,
Jira, source files, or evidence. The free PostgreSQL instance expires on
2026-07-31, so IDTS must back up and choose upgrade or migration by 2026-07-24.

Vietnamese:

Render MCP va CLI hien da dung duoc de xem service, deploy va log. Gia tri secret
private van do DonHV kiem soat va khong duoc dua vao chat, Jira, source hoac
evidence. PostgreSQL free het han ngay 31/07/2026, nen IDTS phai backup va chot
nang cap hoac migrate truoc ngay 24/07/2026.

## Current limitation (historical)

This repository now has Render Blueprint support, but this Codex session does not currently expose callable Render service tools such as create service, list deploys, or read logs. DonHV still needs to create the Blueprint and enter secrets in the Render Dashboard.

If Render MCP/API tools are configured later, the agent can help inspect deploy status and logs directly without asking DonHV to copy screenshots.

Vietnamese:

Repo hiện đã có Render Blueprint support, nhưng session Codex hiện tại chưa expose tool Render để tạo service, xem deploy, hoặc đọc logs trực tiếp. DonHV vẫn cần tạo Blueprint và nhập secret trong Render Dashboard.

Nếu sau này cấu hình thêm Render MCP/API tools, agent có thể hỗ trợ kiểm tra deploy status và logs trực tiếp mà không cần DonHV gửi screenshot.
