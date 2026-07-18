# IDTS-82 — Code Ownership and Knowledge Gate Governance

## English

### Purpose

Make each member able to explain and debug the code they own instead of only demonstrating a working screen. The governance baseline is effective from 2026-07-13 (Asia/Bangkok).

### Current status

`In Progress`. The first DonHV gate is `PAUSED — material quality defect`, not FAIL. The first material baseline skipped important code blocks and file transitions. Remediation is split into IDTS-87 (backend/data), IDTS-84 (DatDT FE area), IDTS-85 (SangVN Object Page area), then IDTS-86 validates the material before human gates resume.

### Scope

- Maintain file and end-to-end flow ownership in `docs/learning/ownership-map.md`.
- Retrofit beginner-first Vietnamese comments and equivalent bilingual mirrors for the frozen 72 runtime files.
- Require each non-obvious entry point to explain trigger, purpose, input, decision, side effect, next dependency, and breakpoint where relevant.
- Maintain seven step-by-step Debug Labs for auth, lifecycle, assignment/collaboration, dashboard/history, email, AI, and QA evidence.
- Apply the daily Knowledge Gate only after material QA, with 80%, all critical answers, one real debug exercise, and teach-back required for PASS.

### Out of scope

- No runtime behavior, OData contract, schema, Fiori route, or UI behavior change in material bootstrap PRs.
- No fabricated human PASS, debug evidence, or teach-back.
- This does not replace code review, QA Depth Gate, SAP checks, security review, or Jira permissions.

### Dependency order

1. PR #158 / IDTS-87: backend and data material — merged.
2. PR #159 / IDTS-84: DatDT material — merged.
3. PR #160 / IDTS-85: SangVN material — merged.
4. Governance and Debug Lab remediation — in progress.
5. IDTS-86 material QA against real source.
6. Four human Knowledge Gates and teach-backs.
7. Close IDTS-82 only after steps 5–6 PASS.

### Acceptance criteria

- [x] Three 72-file source/mirror batches merged without runtime changes.
- [x] Header-only comments explicitly fail the quality rule.
- [x] Mirrors require real-symbol caller/callee, request flow, side effects, and debugger anchors.
- [x] Seven Debug Labs provide UI action, Network request, breakpoint order, variables, data/external effect, failure exercise, and teach-back.
- [x] DonHV's incomplete gate is recorded as PAUSED, not learner FAIL.
- [ ] IDTS-86 verifies structural coverage and deeply traces at least one owner flow per batch.
- [ ] DonHV, DatDT, SangVN, and NhanT each independently PASS their assigned gate/debug/teach-back.

### Evidence and safety

Keep sanitized evidence under `docs/learning/progress/` or `docs/pm/evidence/`. DonHV manually attaches selected artifacts to Jira. Never store passwords, tokens, private endpoints, API keys, database URLs, or full personal data.

## Vietnamese

### Mục đích

Giúp mỗi thành viên giải thích và debug được code thuộc ownership của mình, thay vì chỉ demo được màn hình đang chạy. Governance baseline áp dụng từ 13/07/2026 theo Asia/Bangkok.

### Trạng thái hiện tại

`In Progress`. Gate đầu tiên của DonHV được ghi `PAUSED — material quality defect`, không phải FAIL. Material ban đầu bỏ qua nhiều khối code và điểm chuyển file quan trọng. Remediation được chia thành IDTS-87 (backend/data), IDTS-84 (khu vực FE DatDT), IDTS-85 (khu vực Object Page SangVN), sau đó IDTS-86 phải kiểm material trước khi đánh giá người học lại.

### Phạm vi

- Duy trì ownership theo file và end-to-end flow trong `docs/learning/ownership-map.md`.
- Retrofit comment tiếng Việt beginner-first và mirror song ngữ đầy đủ tương đương cho inventory 72 runtime file.
- Mỗi entry point không hiển nhiên phải giải thích trigger, mục đích, input, quyết định, side effect, dependency tiếp theo và breakpoint khi phù hợp.
- Duy trì bảy Debug Lab cầm tay chỉ việc cho auth, lifecycle, assignment/collaboration, dashboard/history, email, AI và QA evidence.
- Chỉ áp dụng Knowledge Gate hằng ngày sau material QA; PASS cần 80%, đúng mọi câu critical, một debug exercise thật và teach-back.

### Ngoài phạm vi

- PR bootstrap material không đổi runtime behavior, OData contract, schema, Fiori route hoặc UI behavior.
- Không bịa human PASS, debug evidence hoặc teach-back.
- Cơ chế này không thay code review, QA Depth Gate, SAP check, security review hoặc Jira permission.

### Thứ tự phụ thuộc

1. PR #158 / IDTS-87: material backend và data — đã merge.
2. PR #159 / IDTS-84: material DatDT — đã merge.
3. PR #160 / IDTS-85: material SangVN — đã merge.
4. Sửa governance và Debug Lab — đang thực hiện.
5. IDTS-86 đối chiếu material với source thật.
6. Bốn thành viên tự làm Knowledge Gate và teach-back.
7. Chỉ đóng IDTS-82 sau khi bước 5–6 PASS.

### Acceptance criteria

- [x] Ba batch source/mirror đủ 72 file đã merge và không đổi runtime.
- [x] Rule ghi rõ comment chỉ có ở đầu file thì không đạt.
- [x] Mirror bắt buộc caller/callee theo symbol thật, request flow, side effect và debugger anchor.
- [x] Bảy Debug Lab có thao tác UI, Network request, thứ tự breakpoint, biến cần xem, tác động data/external, failure exercise và teach-back.
- [x] Gate chưa hoàn tất của DonHV được ghi PAUSED, không ghi learner FAIL.
- [ ] IDTS-86 kiểm coverage và trace sâu tối thiểu một flow thật của mỗi owner batch.
- [ ] DonHV, DatDT, SangVN và NhanT tự PASS gate/debug/teach-back được giao.

### Evidence và an toàn

Lưu evidence đã sanitize trong `docs/learning/progress/` hoặc `docs/pm/evidence/`. DonHV tự attach artifact được chọn lên Jira. Không lưu password, token, endpoint private, API key, database URL hoặc dữ liệu cá nhân đầy đủ.
