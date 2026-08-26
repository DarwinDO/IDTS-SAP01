# My Notifications and Prompt Email Delivery — Discovery Finding

## English

### Intent and root cause

- Intent: feature request and operational pain.
- Symptom: a Bug status email can appear to wait until the next hourly Job Scheduler run.
- Root cause: scheduled recovery was being treated as the normal latency path, although the source already has a one-shot post-commit immediate outbox kick.
- Business goal: give each active user one personal inbox and deliver action-required Bug/access emails promptly without weakening durable retry or creating another email system.

### Confirmed requirements

- `My Notifications` combines Bug and material User Access events while preserving domain-specific sources and delivery tables.
- Important Bug status/ownership events and `@mention` use in-app plus prompt email.
- Immediate post-commit processing is primary; Job Scheduler is recovery plus SLA/overdue/digest/retention scheduling.
- Pending Assignment SLA is four hours for Critical/Blocker and 24 hours otherwise.
- Daily digest runs at 08:00 weekdays in `Asia/Bangkok` and does not replace prompt status email.
- Personal inbox authorization is always caller-only, including PM/UserAdmin.
- Bug history/source notifications remain durable; inbox index retention is 90 days and Bug backfill is limited to 30 days.

### Risks and constraints

- Immediate and scheduled workers can overlap; existing locks/status must prevent concurrent ownership.
- Provider delivery remains at-least-once; a timeout after provider acceptance can still duplicate an email.
- User-visible inbox must not expose raw provider/audit/identity data.
- UI hiding never replaces CAP authorization.
- No new broker, worker, provider, scheduler service, WebSocket, Work Zone integration, or preferences subsystem is justified for the first release.

### Requirement layers

| Layer | Status | Evidence |
| --- | --- | --- |
| Business | Clear | Reduce actionable notification latency and provide one personal work inbox. |
| Stakeholder | Clear | Tester, Developer, PM; UserAdmin keeps Operations diagnostics rather than other users' inbox access. |
| Functional | Clear | Federated inbox, read state, event matrix, immediate kick, SLA/digest, deep links. |
| Non-functional | Clear | Auth isolation, idempotency, bounded reads, accessibility, retry, retention, no secrets. |
| Transition | Clear | Six isolated N-gates; 30-day Bug backfill; additive migration and rollout remain separately approved. |

### Authoritative handoff

The complete approved design is `docs/superpowers/specs/2026-08-26-my-notifications-and-delivery-design.md`.

## Tiếng Việt

### Intent và nguyên nhân gốc

- Intent: yêu cầu feature và operational pain.
- Triệu chứng: email status Bug có thể bị hiểu là phải chờ lần Job Scheduler một giờ tiếp theo.
- Nguyên nhân gốc: scheduled recovery bị xem như đường latency bình thường dù source đã có immediate outbox kick một lần sau commit.
- Mục tiêu nghiệp vụ: cho mỗi active user một inbox cá nhân và gửi nhanh email Bug/access cần hành động mà không làm yếu retry bền vững hoặc tạo thêm hệ thống email.

### Requirement đã xác nhận

- `My Notifications` kết hợp event Bug và User Access quan trọng nhưng giữ source/delivery table theo domain.
- Event status/ownership Bug quan trọng và `@mention` dùng in-app cộng email nhanh.
- Immediate processing sau commit là đường chính; Job Scheduler chỉ recovery và chạy SLA/overdue/digest/retention.
- SLA Pending Assignment là bốn giờ cho Critical/Blocker và 24 giờ cho mức khác.
- Daily digest chạy 08:00 các ngày trong tuần theo `Asia/Bangkok` và không thay email status nhanh.
- Authorization inbox cá nhân luôn chỉ cho caller, kể cả PM/UserAdmin.
- Bug history/source notification vẫn bền vững; retention inbox index 90 ngày và backfill Bug tối đa 30 ngày.

### Rủi ro và constraint

- Immediate và scheduled worker có thể chạy trùng; lock/status hiện có phải ngăn ownership đồng thời.
- Provider delivery vẫn at-least-once; timeout sau khi provider nhận có thể gây email trùng.
- Inbox người dùng không được lộ raw provider/audit/identity data.
- Ẩn UI không thay CAP authorization.
- Release đầu không cần broker, worker, provider, scheduler service, WebSocket, Work Zone integration hoặc preference subsystem mới.

### Các lớp requirement

| Layer | Trạng thái | Bằng chứng |
| --- | --- | --- |
| Business | Rõ | Giảm latency notification cần hành động và có một inbox công việc cá nhân. |
| Stakeholder | Rõ | Tester, Developer, PM; UserAdmin xem Operations diagnostic thay vì inbox user khác. |
| Functional | Rõ | Inbox liên nguồn, read state, event matrix, immediate kick, SLA/digest, deep link. |
| Non-functional | Rõ | Auth isolation, idempotency, read có giới hạn, accessibility, retry, retention, không secret. |
| Transition | Rõ | Sáu N-gate cô lập; backfill Bug 30 ngày; additive migration và rollout duyệt riêng. |

### Handoff authority

Thiết kế đầy đủ đã duyệt nằm tại `docs/superpowers/specs/2026-08-26-my-notifications-and-delivery-design.md`.
