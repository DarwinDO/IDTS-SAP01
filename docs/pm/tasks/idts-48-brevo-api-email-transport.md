# IDTS-48 - Brevo API Email Transport for Shared QA

## Summary

IDTS-48 replaces the shared-QA email provider path from Brevo SMTP to Brevo Transactional Email HTTP API while keeping the existing CAP database outbox.

The reason is practical: Render shared QA can create `NotificationDeliveries` rows and the worker retry logic works, but outbound SMTP to Brevo timed out from Render on ports 587 and 2525. Local Brevo SMTP verification from DonHV's machine passed, so this is treated as a deployment/network-provider reachability issue, not a broken IDTS outbox model.

Vietnamese: IDTS-48 doi duong gui email tren shared QA tu Brevo SMTP sang Brevo Transactional Email HTTP API, nhung van giu CAP database outbox hien co. Ly do la Render tao duoc `NotificationDeliveries` va worker retry chay dung, nhung ket noi SMTP toi Brevo tu Render bi timeout tren port 587 va 2525. Local Brevo SMTP tu may DonHV pass, nen day la van de reachability moi truong/provider, khong phai loi model outbox cua IDTS.

## Jira

- Jira: [IDTS-48](https://dutassociation.atlassian.net/browse/IDTS-48)
- Owner: DonHV
- Status: Done
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
| PR #58 hardening merge and Render deploy | PASS - merged to `dev` at `bcf43b2`; deploy `dep-d931rb6rnols73851g1g` reached `live` |
| Final shared-QA Brevo API acceptance | PASS - authenticated smoke passed; new assignment notification for `BUG-0001` produced a `SENT` delivery with `attemptCount = 1`, `sentAt`, and provider message id |
| Render error/log scan after PR #58 deploy | PASS - no error logs after deploy; email log reported `brevo-api: sent=1, failed=0` |

Vietnamese:

| Kiem tra | Ket qua |
| --- | --- |
| `npm run qa:email-brevo-api:integration` | PASS |
| `npm run qa:email-outbox:programmatic` | PASS |
| `npm run qa:email-smtp:integration` | PASS |
| Smoke Brevo API tren shared QA sau khi fix env `replyTo` | PASS - delivery `SENT`, `attemptCount = 1` |
| Merge PR #58 va deploy Render | PASS - merge vao `dev` tai `bcf43b2`; deploy `dep-d931rb6rnols73851g1g` da `live` |
| Acceptance Brevo API cuoi tren shared QA | PASS - authenticated smoke pass; notification assign moi cho `BUG-0001` tao delivery `SENT` voi `attemptCount = 1`, co `sentAt` va provider message id |
| Scan log/error Render sau deploy PR #58 | PASS - khong co error log sau deploy; log email ghi `brevo-api: sent=1, failed=0` |

## Hardening follow-up

Shared QA found that Brevo rejects `replyTo.email` when the value uses placeholder/display syntax such as `<optional-reply-to@example.com>`. IDTS now validates optional `replyTo` as a plain safe email address before treating email config as ready. This prevents new deliveries from becoming `PENDING` with a provider-rejected payload.

Vietnamese: Shared QA phat hien Brevo reject `replyTo.email` khi gia tri dung placeholder/display syntax nhu `<optional-reply-to@example.com>`. IDTS hien validate optional `replyTo` nhu email thuan an toan truoc khi xem email config la ready. Cach nay ngan delivery moi bi tao thanh `PENDING` voi payload chac chan bi provider reject.

## Closure note

IDTS-48 is complete. Shared QA now sends through Brevo Transactional API instead of relying on Render outbound SMTP. The original SMTP timeout is no longer blocking IDTS-44 email acceptance, and the provider-specific API key, recipient address, bearer token, database URL, and provider message id remain out of repo/Jira evidence.

Vietnamese:

IDTS-48 da hoan tat. Shared QA hien gui email qua Brevo Transactional API thay vi phu thuoc outbound SMTP cua Render. Loi timeout SMTP ban dau khong con block email acceptance cua IDTS-44, va API key, dia chi recipient, bearer token, database URL, provider message id that khong duoc dua vao repo/Jira evidence.
