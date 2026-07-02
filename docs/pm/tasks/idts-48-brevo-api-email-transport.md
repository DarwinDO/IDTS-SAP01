# IDTS-48 - Brevo API Email Transport for Shared QA

## Summary

IDTS-48 replaces the shared-QA email provider path from Brevo SMTP to Brevo Transactional Email HTTP API while keeping the existing CAP database outbox.

The reason is practical: Render shared QA can create `NotificationDeliveries` rows and the worker retry logic works, but outbound SMTP to Brevo timed out from Render on ports 587 and 2525. Local Brevo SMTP verification from DonHV's machine passed, so this is treated as a deployment/network-provider reachability issue, not a broken IDTS outbox model.

Vietnamese: IDTS-48 doi duong gui email tren shared QA tu Brevo SMTP sang Brevo Transactional Email HTTP API, nhung van giu CAP database outbox hien co. Ly do la Render tao duoc `NotificationDeliveries` va worker retry chay dung, nhung ket noi SMTP toi Brevo tu Render bi timeout tren port 587 va 2525. Local Brevo SMTP tu may DonHV pass, nen day la van de reachability moi truong/provider, khong phai loi model outbox cua IDTS.

## Jira

- Jira: [IDTS-48](https://dutassociation.atlassian.net/browse/IDTS-48)
- Owner: DonHV
- Related: IDTS-44, IDTS-38

## Scope

- Add `provider` email config with safe default `smtp`.
- Add `brevo-api` provider path using private Brevo API key from environment.
- Keep `Notifications` and `NotificationDeliveries` unchanged.
- Keep email failure isolated from bug workflow transactions.
- Keep SMTP path available as local/fallback transport.
- Add fake HTTP integration test for Brevo API success/failure.
- Update Render/private config examples without storing real API keys.

Vietnamese:

- Them config email `provider`, mac dinh an toan la `smtp`.
- Them duong provider `brevo-api`, dung Brevo API key private tu environment.
- Giu nguyen `Notifications` va `NotificationDeliveries`.
- Giu rule loi email khong rollback workflow bug.
- Giu SMTP nhu transport local/fallback.
- Them integration test fake HTTP cho Brevo API success/failure.
- Cap nhat Render/private config example ma khong luu API key that.

## Verification so far

| Check | Result |
| --- | --- |
| `npm run qa:email-brevo-api:integration` | PASS |
| `npm run qa:email-outbox:programmatic` | PASS |
| `npm run qa:email-smtp:integration` | PASS |
| Shared-QA Brevo API smoke after fixing `replyTo` env | PASS - delivery `SENT`, `attemptCount = 1` |

Vietnamese:

| Kiem tra | Ket qua |
| --- | --- |
| `npm run qa:email-brevo-api:integration` | PASS |
| `npm run qa:email-outbox:programmatic` | PASS |
| `npm run qa:email-smtp:integration` | PASS |
| Smoke Brevo API tren shared QA sau khi fix env `replyTo` | PASS - delivery `SENT`, `attemptCount = 1` |

## Hardening follow-up

Shared QA found that Brevo rejects `replyTo.email` when the value uses placeholder/display syntax such as `<optional-reply-to@example.com>`. IDTS now validates optional `replyTo` as a plain safe email address before treating email config as ready. This prevents new deliveries from becoming `PENDING` with a provider-rejected payload.

Vietnamese: Shared QA phat hien Brevo reject `replyTo.email` khi gia tri dung placeholder/display syntax nhu `<optional-reply-to@example.com>`. IDTS hien validate optional `replyTo` nhu email thuan an toan truoc khi xem email config la ready. Cach nay ngan delivery moi bi tao thanh `PENDING` voi payload chac chan bi provider reject.

## Remaining work

- Run full compile/auth/secret/lint gates before PR.
- Push PR into `dev`.
- Configure Render private env:
  - `cds_idts_email_enabled=true`
  - `cds_idts_email_provider=brevo-api`
  - `cds_idts_email_brevoApiKey=<private Brevo API key>`
  - `cds_idts_email_brevoApiEndpoint=https://api.brevo.com/v3/smtp/email`
  - `cds_idts_email_fromAddress=<verified sender>`
- Deploy and verify one real shared-QA delivery reaches `SENT`.
- Keep full recipient/API key/provider message-id out of Jira and repo evidence.

Vietnamese:

- Chay full compile/auth/secret/lint gate truoc PR.
- Push PR vao `dev`.
- Cau hinh private env tren Render:
  - `cds_idts_email_enabled=true`
  - `cds_idts_email_provider=brevo-api`
  - `cds_idts_email_brevoApiKey=<private Brevo API key>`
  - `cds_idts_email_brevoApiEndpoint=https://api.brevo.com/v3/smtp/email`
  - `cds_idts_email_fromAddress=<verified sender>`
- Deploy va verify mot delivery shared-QA that chuyen sang `SENT`.
- Khong dua recipient day du, API key, provider message-id that vao Jira hoac repo evidence.
