# IDTS-34 to IDTS-38 - Custom Login and SMTP Email Notification

Last updated: 2026-06-27

## Summary

This work package records the approved direction for the next authentication and email-notification slice.

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

