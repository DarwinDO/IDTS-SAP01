# IDTS SAP BTP XSUAA and AppRouter deployment

## Runtime map

`Browser → standalone AppRouter → HTML5 Application Repository` serves the
Fiori application. Requests under `/odata` go from AppRouter to the CAP
`srv-api` destination with the XSUAA token forwarded. CAP maps the JWT identity
to `idts.cap.Users` and checks that the platform role matches the business
role.

## Configuration files

| File | Responsibility |
| --- | --- |
| `mta.yaml` | CAP, HDI deployer, AppRouter, HTML5 content and managed-service bindings |
| `xs-security.json` | XSUAA scopes and role templates |
| `app/router/xs-app.json` | Browser entry, logout and protected OData forwarding |
| `app/bug-management-ui/xs-app.json` | HTML5 app routes for UI5 resources and CAP OData |
| `package.json` | XSUAA production profile and custom-auth integration profile |

## Environment separation

- SAP BTP production: HANA + XSUAA.
- Render rollback environment: PostgreSQL + custom bearer auth through the `integration` profile.
- Local development: SQLite + custom bearer auth.

S3 and Brevo are intentionally retained as private external integrations. AI
remains disabled/mock. SAP Job Scheduling Service invokes the protected outbox
operation; the BTP profile does not also start the process-local outbox timer.

## Deployed BTP resources

| Resource | Purpose |
| --- | --- |
| `idts-sap01-srv` | CAP service runtime |
| `idts-sap01-approuter` | Browser entry, XSUAA login/logout and token forwarding |
| `idts-sap01-db` | HANA HDI container |
| `idts-sap01-auth` | XSUAA application service |
| `idts-sap01-destination` | AppRouter/CAP destination binding |
| `idts-sap01-html5-repo-host` | Deployed Fiori content |
| `idts-sap01-html5-repo-runtime` | Runtime access to Fiori content |
| `idts-sap01-jobscheduler` | Hourly email-outbox invocation |
| `idts-sap01-external-services` | Private retained S3/Brevo configuration |

The Job Scheduling dashboard shows one job,
`IDTSEmailOutboxHourly`, with one active hourly schedule. Authentication is
XSUAA. A successful execution changes a new delivery from `PENDING` to `SENT`
without running a second BTP worker timer.

## Role mapping

1. Assign one and only one IDTS role collection to the BTP identity:
   `IDTS_PM`, `IDTS_TESTER` or `IDTS_DEVELOPER`.
2. Keep the matching active row in `idts.cap.Users`.
3. Map the XSUAA identity to that row without storing a BTP password.
4. Reject missing, multiple or mismatched business roles.

The current browser evidence proves the PM path. SangVN and DatDT are
provisioned with `IDTS_DEVELOPER`; NhanT is provisioned with `IDTS_TESTER`.
Each member must still authenticate once with their own SAP identity before the
live role matrix can be signed off. Do not impersonate members or share
passwords.

## Data and integration boundaries

- PostgreSQL source data was migrated to HANA with stable IDs and relationship
  checks.
- `AuthSessions` was not migrated and `Users.passwordHash` was cleared because
  BTP authentication is owned by XSUAA.
- Historical retryable email deliveries were made non-retryable before import.
- Attachment metadata is stored in HANA; attachment bytes remain in AWS S3.
- Brevo remains the transactional email provider.
- AI stays disabled/mock and cannot change assignment, classification or
  lifecycle without an authorized human action.

## Verification order

1. Read effective BTP and Render profiles with `cds env`.
2. Run `qa:idts113:btp-auth`.
3. Compile CAP and build UI5.
4. Build the MTAR.
5. After deployment, assign exactly one IDTS role collection per user.
6. Smoke AppRouter login, `AuthService.me`, protected OData, logout and role mismatch.
7. Confirm the Job Scheduler job has exactly one active schedule.
8. Verify S3 bytes and HANA metadata across an application restart.
9. Verify one fresh Brevo delivery reaches `SENT`.
10. Verify AI disabled/fallback paths do not mutate the Bug.

## Security notes

Do not commit service keys, JWTs, destination credentials or external-provider secrets. A successful AppRouter login is not sufficient: the IDTS user row must be active and its `role_code` must match the XSUAA role.

## Rollback boundary

Render/PostgreSQL remains a temporary previous baseline through at least
2026-08-04. It is not a synchronized HANA replica. Follow
`docs/deployment/idts-113-btp-cutover-rollback.md`; freeze writes and reconcile
HANA deltas before a lossless return to Render.

## Giải thích tiếng Việt

- AppRouter là cửa vào trình duyệt và chuyển JWT của XSUAA tới CAP.
- CAP vẫn đối chiếu user BTP với `Users` và role nghiệp vụ của IDTS.
- HANA lưu dữ liệu nghiệp vụ và metadata attachment; file nhị phân vẫn ở S3.
- Job Scheduler gọi worker email theo lịch; Brevo vẫn là nhà cung cấp gửi mail.
- Render chỉ là phương án quay lại tạm thời, không tự đồng bộ dữ liệu từ HANA.
