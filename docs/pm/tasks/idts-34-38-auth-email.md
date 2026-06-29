# IDTS-34 to IDTS-38 - Custom Login and SMTP Email Notification

Last updated: 2026-06-29

## Summary

This work package records the approved direction for the next authentication and email-notification slice.

Current work order:

1. Finish PM/Jira sync first so the team starts from a clean task state.
2. Implement `IDTS-34` before FE login work because the FE needs a stable backend auth contract.
3. Implement `IDTS-36` after the auth foundation, using Nodemailer plus SMTP/outbox tracking.
4. Hand the stable contracts to DatDT (`IDTS-35`), SangVN (`IDTS-37`), and NhanT (`IDTS-38`).

Decisions:

- IDTS will not depend on SAP BTP/XSUAA for the near-term login path.
- Login will be custom email/password login in CAP Node.js.
- CDS will define the data/service contract; JavaScript will handle password verification, token/session creation, and request-user mapping.
- SMTP will be the real email delivery mechanism.
- SMTP must be implemented through delivery/outbox tracking so email failures do not roll back bug workflow actions.
- Email scope is all in-app notifications unless disabled by private configuration.

Vietnamese:

- IDTS sẽ không phụ thuộc SAP BTP/XSUAA cho hướng login trước mắt.
- Login dùng email/password custom trong CAP Node.js.
- CDS định nghĩa model/service contract; JavaScript xử lý verify password, tạo token/session, và map request user.
- Email dùng SMTP thật.
- SMTP phải đi qua delivery/outbox tracking để lỗi gửi email không làm rollback workflow bug.
- Email áp dụng cho toàn bộ in-app notification, trừ khi bị tắt bằng private config.

## Jira Task Split

| Jira | Owner | Focus | Dependency |
| --- | --- | --- | --- |
| IDTS-34 | DonHV | Backend custom login/auth foundation | Blocks IDTS-35, IDTS-38 |
| IDTS-35 | DatDT | Login UI and authenticated app session | Blocked by IDTS-34 |
| IDTS-36 | DonHV | SMTP email delivery with outbox tracking | Blocks IDTS-37, IDTS-38 |
| IDTS-37 | SangVN | Notification UI/readability verification | Blocked by IDTS-36 |
| IDTS-38 | NhanT | Auth/email regression QA | Blocked by IDTS-34 and IDTS-36 |

## Implementation Boundaries

- Do not commit passwords, SMTP credentials, auth secrets, access tokens, private endpoints, or real private recipient data.
- Do not add SAP BTP/XSUAA as a required dependency for this slice.
- Do not keep CAP mock auth as the final login behavior for this slice.
- Do not send SMTP inline in a way that can break assignment/status/comment workflow if email fails.
- Keep `Users` as the internal business profile/role source.
- Keep role behavior aligned with the current MVP roles: Tester, Developer, and PM.

Vietnamese:

- Không commit password, SMTP credential, auth secret, access token, private endpoint, hoặc dữ liệu người nhận thật.
- Không biến SAP BTP/XSUAA thành dependency bắt buộc của slice này.
- Không xem CAP mock auth là login thật cuối cùng cho slice này.
- Không gửi SMTP trực tiếp theo cách lỗi email có thể làm hỏng assignment/status/comment workflow.
- Giữ `Users` là nguồn profile/role nghiệp vụ nội bộ.
- Giữ role theo MVP hiện tại: Tester, Developer, PM.

## Acceptance at Work-Package Level

- Backend custom login supports active-user success, wrong-password failure, inactive-user denial, and request-user mapping.
- FE supports browser login, authenticated OData usage, and logout.
- SMTP email delivery records are tracked as pending/sent/failed/skipped.
- SMTP failure does not roll back bug workflow.
- QA verifies PM, Developer, and Tester personas.
- Touched `app/`, `srv/`, or `db/` files have matching `docs/knowledge/` mirror updates.
- PM status files record discovered bugs/errors immediately with classification.

## IDTS-34 Backend Contract Implemented

Date: 2026-06-29
Owner: DonHV

Implemented backend foundation:

- Added `AuthService` with `login`, `logout`, and `me`.
- Added `Users.passwordHash` and `Users.passwordChangedAt`.
- Added `AuthSessions` for server-side bearer-token sessions.
- Added custom CAP auth middleware at `srv/auth/custom-auth.js`.
- Switched CAP auth config to the custom middleware for development, integration, and production profiles.
- Added local setup utility `npm run dev:auth:set-password`; it reads `IDTS_AUTH_EMAIL` and `IDTS_AUTH_PASSWORD` from private environment variables and writes only a password hash.
- Added `npm run qa:auth:programmatic` to verify active login, wrong password denial, inactive user denial, token hashing, request-user mapping, and logout revocation.

FE contract for `IDTS-35`:

- Login endpoint: `POST /odata/v4/auth/login`
- Request body: `{ "email": "...", "password": "..." }`
- Success response includes: `token`, `tokenType: "Bearer"`, `expiresAt`, and safe `user` profile.
- Authenticated OData calls should send: `Authorization: Bearer <token>`.
- Logout endpoint: `POST /odata/v4/auth/logout`.
- Current-user endpoint: `GET /odata/v4/auth/me()`.
- `AuthService.login` is intentionally public; protected business data remains guarded by `BugService @(requires: 'authenticated-user')`, while `logout` and `me()` use action/function-level `@requires`.

Vietnamese:

- Backend da co `AuthService` gom `login`, `logout`, va `me`.
- `Users` co them `passwordHash` va `passwordChangedAt`; `AuthSessions` luu session bearer-token phia server.
- Middleware custom CAP auth map bearer token thanh `cds.User`.
- FE `IDTS-35` dung `POST /odata/v4/auth/login`, sau do gui `Authorization: Bearer <token>` khi goi OData can login.
- `AuthService.login` duoc de public co chu dich; du lieu nghiep vu van duoc bao ve bang `BugService @(requires: 'authenticated-user')`, con `logout` va `me()` co `@requires` rieng tren action/function.
- Local password khong commit vao source; dung `npm run dev:auth:set-password` voi bien moi truong private.

## IDTS-36 Tooling and SDK Research

Date: 2026-06-29
Owner: DonHV
Purpose: record the recommended tool choices before implementing SMTP notification delivery.

### Recommended default for implementation

- Use `nodemailer` as the Node.js SMTP client for IDTS-36.
- Keep SMTP provider details behind private config, not source code.
- Keep `Notifications` as the in-app source event record.
- Add a separate delivery/outbox entity linked to `Notifications`.
- Use delivery statuses: `PENDING`, `SENT`, `FAILED`, `SKIPPED`.
- Send failures must be captured on the delivery record and must not roll back bug workflow actions.

Vietnamese:

- Dùng `nodemailer` làm SMTP client chính cho IDTS-36.
- Thông tin SMTP provider phải nằm trong private config, không nằm trong source code.
- Giữ `Notifications` là event record nội bộ của app.
- Thêm entity delivery/outbox riêng, liên kết về `Notifications`.
- Dùng các trạng thái delivery: `PENDING`, `SENT`, `FAILED`, `SKIPPED`.
- Lỗi gửi email phải được ghi vào delivery record và không được rollback workflow xử lý bug.

### Tools / SDKs / apps to support implementation

| Tool | Type | Recommended use in IDTS | Notes |
| --- | --- | --- | --- |
| Nodemailer | Node.js SDK | Main SMTP sender library | Best fit for IDTS because the project needs SMTP and provider portability. |
| Mailpit | Local app / Docker-capable SMTP test server | Local developer email capture and UI review | Good for local testing without sending real emails; also has an API for automated checks. |
| Ethereal Email | Hosted fake SMTP service | Quick no-install SMTP preview during development | Useful when Docker/local tool setup is inconvenient; not a real delivery proof. |
| `smtp-server` from Nodemailer | Node.js test utility / repo | Optional automated SMTP failure simulation | Use only if tests need controlled SMTP errors that Mailpit/Ethereal cannot provide. |
| Brevo SMTP | Real SMTP provider | Candidate shared project SMTP provider | Useful if the team wants a real provider with a free quota; still needs account setup and private credentials. |
| Gmail SMTP app password | Real SMTP provider option | Personal/demo-only fallback | Requires Google 2-Step Verification and an app password; not ideal for shared team ownership. |
| Mailtrap | SaaS app / SDK / SMTP | Sandbox/staging email testing | Good testing platform; use SMTP mode if keeping IDTS provider-portable. |
| SendGrid SMTP Relay | Real SMTP provider | Production-like SMTP option | Good provider candidate, but account/domain setup may be heavier than needed for this course project. |

Vietnamese:

| Tool | Loại | Cách dùng khuyến nghị trong IDTS | Ghi chú |
| --- | --- | --- | --- |
| Nodemailer | Node.js SDK | Thư viện gửi SMTP chính | Phù hợp nhất vì IDTS cần SMTP và muốn đổi provider bằng config. |
| Mailpit | App local / SMTP test server chạy được bằng Docker | Bắt email local và review UI email | Tốt cho local test vì không gửi email thật; có API để automation check. |
| Ethereal Email | Fake SMTP hosted | Xem preview email nhanh khi dev | Tiện khi không muốn cài Docker/local tool; không dùng làm bằng chứng gửi email thật. |
| `smtp-server` của Nodemailer | Test utility / repo Node.js | Optional để giả lập lỗi SMTP có kiểm soát | Chỉ dùng nếu cần test lỗi SMTP mà Mailpit/Ethereal không đáp ứng. |
| Brevo SMTP | Real SMTP provider | Ứng viên SMTP chung cho project | Có thể dùng nếu team muốn provider thật có free quota; vẫn cần account và credentials private. |
| Gmail SMTP app password | Real SMTP provider option | Fallback cho demo cá nhân | Cần bật 2-Step Verification và tạo app password; không lý tưởng cho ownership chung của team. |
| Mailtrap | SaaS app / SDK / SMTP | Test email sandbox/staging | Tốt cho testing; nếu muốn giữ provider-portable thì dùng SMTP mode. |
| SendGrid SMTP Relay | Real SMTP provider | Option SMTP gần production | Mạnh nhưng setup account/domain có thể nặng hơn nhu cầu project. |

### Default choice for IDTS-36 v1

Use this stack unless a later decision changes it:

1. `nodemailer` for SMTP sending.
2. `Mailpit` or `Ethereal` for local/non-delivery testing.
3. One real SMTP provider through private config for final proof.
4. A simple CAP outbox table instead of Redis/RabbitMQ/BullMQ.

Do not use provider SDKs as the core implementation in v1. Provider SDKs such as SendGrid SDK or Mailtrap SDK can work, but they lock the code to one vendor. IDTS-36 should stay SMTP-based so the provider can be changed by config.

Vietnamese:

Mặc định cho IDTS-36 v1:

1. Dùng `nodemailer` để gửi SMTP.
2. Dùng `Mailpit` hoặc `Ethereal` để test local/không gửi thật.
3. Dùng một SMTP provider thật qua private config để làm bằng chứng cuối.
4. Dùng outbox table đơn giản trong CAP, chưa cần Redis/RabbitMQ/BullMQ.

Không dùng provider SDK làm lõi implementation ở v1. SDK của SendGrid hoặc Mailtrap vẫn có thể chạy, nhưng sẽ khóa code vào một vendor. IDTS-36 nên giữ hướng SMTP-based để đổi provider bằng config.

### Implementation notes to carry into IDTS-36

- Required private config fields: `enabled`, `host`, `port`, `secure`, `username`, `password`, `fromAddress`, `fromName`.
- Optional private config fields: `replyTo`, `maxRetryCount`, `testMode`, `defaultTestRecipient`.
- Primary recipient source: `Notifications.recipient -> Users.email`.
- If recipient user has no email or is inactive, create a `SKIPPED` delivery record with a clear reason.
- Minimum email content: bug number/title, event type, status/current action owner when available, and a short link or placeholder.
- Secret scan is mandatory before commit.

Vietnamese:

- Private config bắt buộc: `enabled`, `host`, `port`, `secure`, `username`, `password`, `fromAddress`, `fromName`.
- Private config tùy chọn: `replyTo`, `maxRetryCount`, `testMode`, `defaultTestRecipient`.
- Nguồn người nhận chính: `Notifications.recipient -> Users.email`.
- Nếu recipient không có email hoặc inactive, tạo delivery record trạng thái `SKIPPED` với lý do rõ.
- Nội dung email tối thiểu: bug number/title, event type, status/current action owner nếu có, và link hoặc placeholder ngắn.
- Bắt buộc chạy secret scan trước commit.

## Email SDK Spike - `@opencoredev/email-sdk`

Date: 2026-06-29
Owner: DonHV
Scope: short technical spike only. The dependency was installed in a temporary folder outside this repo. It was not added to IDTS `package.json` or runtime source.

### Result

The SDK works for the basic capabilities IDTS would need:

- `memoryProvider` can capture an email in tests.
- SMTP adapter can send to a local SMTP server.
- Failure path throws `EmailProviderError`, which is usable for marking an outbox delivery as `FAILED`.

Verification evidence:

- Temporary install: `@opencoredev/email-sdk@0.6.5` and `smtp-server@3.15.0`.
- Node runtime: `v22.20.0`, satisfying the package requirement of Node `>=20`.
- Memory send result: provider `memory`, one captured message, capture events `beforeSend` and `afterSend`.
- SMTP send result: provider `smtp`, one local message accepted, recipient `developer@example.test`, subject/header present.
- Failure result: simulated provider failure produced `EmailProviderError`.

Important limitation:

- The package license is `AGPL-3.0-only`. Do not adopt it as an IDTS runtime dependency unless the team explicitly accepts this license risk.
- The repo/package is still new compared with Nodemailer. Treat it as a candidate or reference, not the default implementation choice.

Decision after spike:

- Keep `nodemailer` as the default IDTS-36 implementation recommendation.
- Keep `@opencoredev/email-sdk` as an optional future candidate if IDTS later needs multi-provider adapters, typed provider validation, or built-in fallback routing.
- Do not commit this SDK into the project for IDTS-36 v1.

Vietnamese:

Spike kỹ thuật ngắn với `@opencoredev/email-sdk` đã chạy được ở mức cơ bản:

- `memoryProvider` bắt được email trong test.
- SMTP adapter gửi được vào SMTP server local.
- Khi provider fail, SDK throw `EmailProviderError`, có thể dùng để đánh dấu delivery/outbox là `FAILED`.

Bằng chứng verify:

- Cài tạm ngoài repo: `@opencoredev/email-sdk@0.6.5` và `smtp-server@3.15.0`.
- Runtime Node: `v22.20.0`, đáp ứng yêu cầu Node `>=20`.
- Memory send: provider `memory`, bắt được 1 message, capture events gồm `beforeSend` và `afterSend`.
- SMTP send: provider `smtp`, SMTP server local nhận 1 message, recipient `developer@example.test`, subject/header đúng.
- Failure test: provider fail giả lập tạo lỗi `EmailProviderError`.

Giới hạn quan trọng:

- Package dùng license `AGPL-3.0-only`. Không đưa vào runtime dependency của IDTS nếu team chưa duyệt rõ rủi ro license.
- Repo/package còn mới so với Nodemailer. Nên xem là candidate hoặc nguồn tham khảo, không phải lựa chọn mặc định.

Quyết định sau spike:

- Vẫn giữ `nodemailer` là recommendation mặc định cho IDTS-36.
- Giữ `@opencoredev/email-sdk` là option tương lai nếu IDTS cần multi-provider adapter, typed provider validation hoặc fallback routing có sẵn.
- Không commit SDK này vào project cho IDTS-36 v1.

## Nodemailer Spike and Comparison with Email SDK

Date: 2026-06-29
Owner: DonHV
Scope: short technical spike in a temporary folder outside this repo. No package was added to IDTS `package.json`.

### Packages tested

- `nodemailer@9.0.1`
- `@opencoredev/email-sdk@0.6.5`
- `smtp-server@3.15.0` for local SMTP capture
- Node runtime: `v22.20.0`

Nodemailer package metadata:

- License: `MIT-0`
- Node engine: `>=6.0.0`

Email SDK package metadata from the previous spike:

- License: `AGPL-3.0-only`
- Node engine: `>=20.0.0`

### Functional result

Nodemailer passed the IDTS-relevant basics:

- Test/capture mode works through `jsonTransport`.
- Local SMTP send works against a test SMTP server.
- SMTP failure is catchable as a normal JavaScript error with code such as `ESOCKET`.
- Custom headers are preserved, but Nodemailer normalizes header casing, for example `X-IDTS-Notification-ID` becomes `X-Idts-Notification-ID`.

Email SDK also passed the same basic SMTP send/failure tests, but it has a stronger typed abstraction and a dedicated `EmailProviderError`.

### Local benchmark result

Benchmark type: sequential local SMTP sends, 30 messages, no internet/provider latency. This measures local library and connection overhead only. It is not a real-provider performance guarantee.

| Candidate | Mode | Messages | Total time | Average |
| --- | --- | ---: | ---: | ---: |
| Nodemailer | no pool | 30 | 3317 ms | 110.58 ms/email |
| Nodemailer | SMTP pool, max 5 connections | 30 | 151 ms | 5.03 ms/email |
| Email SDK | SMTP adapter | 30 | 3288 ms | 109.62 ms/email |

Interpretation:

- Nodemailer without pooling performs roughly the same as Email SDK SMTP in this local sequential test.
- Nodemailer with SMTP pooling is much faster because it reuses SMTP connections.
- For IDTS outbox delivery, pooling is useful if the app sends multiple queued emails in one worker run.
- In a real SMTP provider scenario, network latency, provider throttling, authentication, and TLS dominate total time, so the local benchmark should only guide library choice, not final production throughput.

### Decision after comparison

Keep Nodemailer as the default for IDTS-36 v1.

Reasons:

- It meets the same basic functional needs as Email SDK for IDTS.
- It has a permissive `MIT-0` license, unlike Email SDK's `AGPL-3.0-only`.
- It supports SMTP pooling, which gives a clear performance path for batch outbox processing.
- It is simpler and more familiar for a CAP Node.js backend.
- It avoids adding a multi-provider abstraction before IDTS actually needs one.

Recommended IDTS-36 implementation detail:

- Use `nodemailer.createTransport(...)`.
- Enable SMTP pooling for the background delivery/outbox worker, for example with a small `maxConnections` value.
- Keep the send wrapper thin: convert `NotificationDelivery` rows into email messages, call `sendMail`, then update delivery status to `SENT` or `FAILED`.
- Keep provider config private and external to source code.

Vietnamese:

Spike Nodemailer đã chạy trong thư mục tạm ngoài repo, không thêm dependency vào `package.json` của IDTS.

Kết quả chức năng:

- Nodemailer có thể test/capture email bằng `jsonTransport`.
- Nodemailer gửi được SMTP vào local SMTP server.
- Khi SMTP lỗi, Nodemailer throw lỗi JavaScript bình thường, ví dụ code `ESOCKET`, đủ để map sang delivery status `FAILED`.
- Custom header vẫn được giữ, nhưng Nodemailer normalize cách viết hoa/thường của header, ví dụ `X-IDTS-Notification-ID` thành `X-Idts-Notification-ID`.

So sánh benchmark local:

| Candidate | Chế độ | Số email | Tổng thời gian | Trung bình |
| --- | --- | ---: | ---: | ---: |
| Nodemailer | không pool | 30 | 3317 ms | 110.58 ms/email |
| Nodemailer | SMTP pool, tối đa 5 connection | 30 | 151 ms | 5.03 ms/email |
| Email SDK | SMTP adapter | 30 | 3288 ms | 109.62 ms/email |

Cách hiểu:

- Nodemailer không bật pool gần như ngang Email SDK SMTP trong test local tuần tự.
- Nodemailer bật SMTP pool nhanh hơn nhiều vì tái sử dụng connection.
- Với outbox worker của IDTS, pooling hữu ích nếu một lần worker cần gửi nhiều email đang pending.
- Benchmark local không đại diện hoàn toàn cho provider thật, vì thực tế còn bị ảnh hưởng bởi network, TLS, auth, rate limit và quota của provider.

Quyết định sau khi so sánh:

- Vẫn chọn Nodemailer làm default cho IDTS-36 v1.
- Lý do: đủ chức năng, license dễ dùng hơn, có SMTP pooling, code đơn giản hơn, và không đưa abstraction multi-provider vào quá sớm.

Gợi ý implementation cho IDTS-36:

- Dùng `nodemailer.createTransport(...)`.
- Bật SMTP pooling cho delivery/outbox worker với `maxConnections` nhỏ.
- Wrapper gửi mail nên mỏng: lấy `NotificationDelivery`, dựng email message, gọi `sendMail`, rồi update status `SENT` hoặc `FAILED`.
- Config SMTP vẫn phải để private, không commit vào source code.

