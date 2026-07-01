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
- Database: Render PostgreSQL, injected into CAP through `cds_requires_db_credentials_url`
- Attachment binary storage: AWS S3, injected through `cds_requires_objectStore_credentials_*`
- Email provider: Brevo SMTP, injected through `cds_idts_email_*`

Vietnamese:

Render sẽ chạy một web service Node.js từ repo này:

- File Blueprint: `render.yaml`
- Runtime: Node.js
- Lệnh start: `npm start`
- Profile CAP: `integration`
- Database: Render PostgreSQL, inject vào CAP bằng `cds_requires_db_credentials_url`
- Nội dung file attachment: AWS S3, inject bằng `cds_requires_objectStore_credentials_*`
- Gửi email: Brevo SMTP, inject bằng `cds_idts_email_*`

## Why the env names look unusual

CAP reads nested configuration from environment variables by using underscore paths.

Example:

```text
cds_requires_db_credentials_url
```

means:

```json
{
  "cds": {
    "requires": {
      "db": {
        "credentials": {
          "url": "..."
        }
      }
    }
  }
}
```

That is why the Blueprint uses `cds_requires_*` and `cds_idts_*` variables instead of putting credentials into source files.

Vietnamese:

CAP đọc config lồng nhau từ biến môi trường bằng cách dùng tên biến có dấu gạch dưới.

Ví dụ:

```text
cds_requires_db_credentials_url
```

có nghĩa là:

```json
{
  "cds": {
    "requires": {
      "db": {
        "credentials": {
          "url": "..."
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

This runs `cds-deploy` using the `integration` profile and the PostgreSQL URL injected by Render.

Vietnamese:

Lần deploy service đầu tiên chỉ khởi động app. PostgreSQL vẫn cần được tạo bảng và seed data.

Sau khi Render service được tạo, mở Render Shell của web service và chạy:

```bash
npm run render:db:deploy
```

Lệnh này chạy `cds-deploy` bằng profile `integration` và PostgreSQL URL do Render inject.

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

## Rollback and emergency switches

If the app cannot start:

- check Render logs first;
- confirm `CDS_ENV=integration`;
- confirm `cds_requires_db_credentials_url` exists;
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
- xác nhận có `cds_requires_db_credentials_url`;
- chạy `npm run render:env:db` trong Render Shell để xem shape config DB, không in các secret không liên quan.

Nếu SMTP gây lỗi hoặc spam:

- set `cds_idts_email_enabled=false`;
- redeploy hoặc restart service;
- giữ workflow bug chạy bình thường trong khi điều tra email.

Nếu upload attachment lỗi:

- kiểm tra S3 bucket, region, access key, và secret access key;
- kiểm tra IAM policy có quyền `GetObject`, `PutObject`, `DeleteObject`, và multipart/list cho bucket đã cấu hình;
- không chuyển bucket sang public.

## Current limitation

This repository now has Render Blueprint support, but this Codex session does not currently expose callable Render service tools such as create service, list deploys, or read logs. DonHV still needs to create the Blueprint and enter secrets in the Render Dashboard.

If Render MCP/API tools are configured later, the agent can help inspect deploy status and logs directly without asking DonHV to copy screenshots.

Vietnamese:

Repo hiện đã có Render Blueprint support, nhưng session Codex hiện tại chưa expose tool Render để tạo service, xem deploy, hoặc đọc logs trực tiếp. DonHV vẫn cần tạo Blueprint và nhập secret trong Render Dashboard.

Nếu sau này cấu hình thêm Render MCP/API tools, agent có thể hỗ trợ kiểm tra deploy status và logs trực tiếp mà không cần DonHV gửi screenshot.
