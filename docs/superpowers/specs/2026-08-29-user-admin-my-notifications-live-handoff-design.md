# User Administration and My Notifications Live Handoff Design

## English

### Purpose

Create a durable, beginner-friendly entry point for a new IDTS chat session. It must
explain only the User Administration and My Notifications work that is both merged
into `dev` and proven live on SAP BTP. It must help the next session add features,
improve project documentation, and later prepare collaboration copies for the
approved Google Drive folder without treating Drive as the source of truth.

### Scope and classification

The handoff uses four explicit evidence labels:

1. **Merged and live** — included in the product summary.
2. **Merged but not accepted live** — excluded from the claimed product summary and
   listed only as a caution when necessary.
3. **Source-only or planned** — excluded from the product summary.
4. **Deferred by decision** — named as a future boundary, never presented as an
   unfinished defect.

The first delivery is deliberately limited to User Administration and My
Notifications. It does not consolidate unrelated Bug Management, AI, SAP490, or
storage-cleanup history.

### Deliverables

Two tracked Markdown files are the handoff package:

| Artifact | Role |
| --- | --- |
| `docs/pm/handoffs/2026-08-29-user-admin-my-notifications-live.md` | Canonical, detailed, bilingual handoff for people and future agents. |
| `docs/pm/handoffs/2026-08-29-user-admin-my-notifications-live-prompt.md` | Short bilingual prompt that instructs a new chat to read the canonical handoff first. |

The prompt must not duplicate a long history. It carries the task boundary, the
reading order, the current live snapshot, and the stop rules. The detailed handoff
keeps the evidence links and the feature-by-feature explanation.

### Information architecture

The canonical handoff will contain these sections in English followed immediately by
the matching Vietnamese content:

1. purpose, audience, snapshot date, and scope;
2. read-first order for the new session;
3. User Administration capabilities from the original onboarding foundation through
   Gates 2–6.5;
4. My Notifications N1–N5-Lite capabilities;
5. merged/live evidence map and selected PR/merge anchors;
6. deliberate deferrals, known evidence limits, and non-claims;
7. rules for any future feature or documentation work, including a fresh
   `origin/dev` baseline and repository-first Drive workflow;
8. a compact next-session checklist.

### Evidence model

Every feature statement must be traceable to a roadmap and one or more focused
evidence files. The current source anchors are:

- `docs/pm/tasks/wp8-user-administration-roadmap.md` and
  `docs/pm/evidence/user-administration/` for User Administration;
- `docs/pm/tasks/wp7-my-notifications-roadmap.md` and
  `docs/pm/evidence/my-notifications/` for My Notifications;
- `docs/pm/current-status.md`, `docs/pm/task-board.md`, and
  `docs/pm/status/donhv.md` for cross-work-package status;
- the frozen `origin/dev` reference at authoring time for reproducibility.

The handoff will distinguish source verification, merge evidence, BTP rollout,
browser acceptance, and `DEMO READY` rather than collapsing them into one generic
"done" claim.

### Privacy and safety

The documents must not contain credentials, tokens, private endpoints, Drive IDs,
raw recipient identity, provider payloads, or job identifiers. The Drive folder name
may be mentioned as the approved collaboration destination, but repository Markdown
remains canonical. A later Drive write requires a fresh folder readback and an
explicit approval boundary.

### Acceptance criteria

- Both deliverables are bilingual and link to the canonical evidence sources.
- The feature summary contains only merged-and-live claims.
- Deferred N6/manual Digest retry/retention and no-replay behavior are explicit.
- The new session is told to refresh the baseline instead of assuming this document
  remains current forever.
- No source, schema, runtime, BTP, user, role, provider, email, Drive, or data
  mutation is performed by this documentation work.

## Tiếng Việt

### Mục đích

Tạo một điểm vào bền vững, dễ hiểu cho session chat IDTS mới. Tài liệu chỉ giải thích
phần User Administration và My Notifications đã vừa merge vào `dev` vừa có bằng chứng
đang live trên SAP BTP. Nó giúp session kế tiếp thêm tính năng, cải thiện tài liệu dự
án và sau này chuẩn bị bản cộng tác trong thư mục Google Drive đã duyệt, nhưng không
xem Drive là nguồn sự thật.

### Phạm vi và cách phân loại

Handoff dùng bốn nhãn bằng chứng rõ ràng:

1. **Đã merge và live** — được đưa vào tóm tắt sản phẩm.
2. **Đã merge nhưng chưa live acceptance** — không được đưa vào phần claim sản phẩm,
   chỉ nêu như lưu ý khi thật sự cần thiết.
3. **Chỉ có source hoặc mới planned** — không được đưa vào tóm tắt sản phẩm.
4. **Đã defer theo quyết định** — nêu như boundary tương lai, không trình bày như lỗi
   chưa hoàn tất.

Đợt bàn giao đầu tiên được giới hạn có chủ đích ở User Administration và My
Notifications. Nó không tổng hợp lịch sử không liên quan của Bug Management, AI,
SAP490 hoặc cleanup dung lượng.

### Deliverable

Hai file Markdown được Git theo dõi tạo thành gói handoff:

| Artifact | Vai trò |
| --- | --- |
| `docs/pm/handoffs/2026-08-29-user-admin-my-notifications-live.md` | Handoff song ngữ, chi tiết, canonical cho con người và agent ở session sau. |
| `docs/pm/handoffs/2026-08-29-user-admin-my-notifications-live-prompt.md` | Prompt song ngữ ngắn, yêu cầu chat mới đọc canonical handoff trước. |

Prompt không được lặp lại lịch sử dài. Nó chỉ mang boundary công việc, thứ tự đọc,
snapshot live hiện tại và các stop rule. Handoff chi tiết giữ các link evidence và
giải thích theo từng tính năng.

### Kiến trúc thông tin

Handoff canonical sẽ có các phần sau, tiếng Anh trước rồi đến phần tiếng Việt tương
ứng ngay sau đó:

1. mục đích, đối tượng đọc, ngày snapshot và phạm vi;
2. thứ tự bắt buộc phải đọc của session mới;
3. các capability User Administration từ onboarding nền tảng đến Gate 2–6.5;
4. các capability My Notifications N1–N5-Lite;
5. bản đồ evidence merged/live và các PR/merge anchor đã chọn;
6. các phần defer có chủ đích, giới hạn evidence và các nội dung không claim;
7. rule cho feature hoặc tài liệu sau này, gồm baseline `origin/dev` mới và workflow
   repo-first trước khi làm Drive;
8. checklist ngắn cho session kế tiếp.

### Mô hình bằng chứng

Mọi câu khẳng định về tính năng phải truy được đến roadmap và một hoặc nhiều file
evidence có trọng tâm. Nguồn hiện tại là:

- `docs/pm/tasks/wp8-user-administration-roadmap.md` và
  `docs/pm/evidence/user-administration/` cho User Administration;
- `docs/pm/tasks/wp7-my-notifications-roadmap.md` và
  `docs/pm/evidence/my-notifications/` cho My Notifications;
- `docs/pm/current-status.md`, `docs/pm/task-board.md` và
  `docs/pm/status/donhv.md` cho trạng thái xuyên work package;
- tham chiếu `origin/dev` đã freeze tại thời điểm viết để có thể tái lập.

Handoff phải tách rõ verify source, evidence merge, rollout BTP, browser acceptance
và `DEMO READY`, không gộp chúng thành một claim chung là "đã xong".

### Riêng tư và an toàn

Tài liệu không chứa credential, token, endpoint private, Drive ID, identity người
nhận thô, payload provider hoặc job identifier. Có thể nêu tên thư mục Drive như đích
cộng tác đã duyệt, nhưng Markdown trong repo vẫn là canonical. Bất kỳ Drive write nào
sau này đều cần đọc lại folder và một boundary phê duyệt mới.

### Tiêu chí nghiệm thu

- Cả hai deliverable đều song ngữ và link đến nguồn evidence canonical.
- Tóm tắt tính năng chỉ chứa claim đã merge và live.
- N6/retry Digest thủ công/retention đã defer và cơ chế không replay được nói rõ.
- Session mới được yêu cầu refresh baseline, không mặc định tài liệu này mãi luôn mới.
- Công việc tài liệu này không thực hiện mutation source, schema, runtime, BTP, user,
  role, provider, email, Drive hoặc data.
