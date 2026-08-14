# IDTS-82 — Code Ownership and Knowledge Gate Governance

## English

### Purpose

Make each team member able to explain and debug the code they own, rather than only demonstrate a working screen. This governance baseline becomes effective on 2026-07-13 (Asia/Bangkok).

### Scope

- Maintain file and end-to-end flow ownership in `docs/learning/ownership-map.md`.
- Apply the daily Ownership Knowledge Gate before nontrivial work, and add two questions when a later task enters a new flow.
- Require an 80% score, all critical answers, one debugger exercise, and teach-back before PR merge or Jira Done.
- Provide beginner-first Debug Labs and learning progress records.
- Retrofit Vietnamese explanatory comments across the defined 72 runtime source files and update their bilingual knowledge mirrors through IDTS-83 to IDTS-85.

### Out of scope

This does not replace code review, QA Depth Gate, CAP/Fiori checks, or Jira permissions. It does not publish credentials or teach members to copy a canned answer.

### Acceptance criteria

- [ ] The effective date, ownership map, question rule, PASS/FAIL consequence, and source-comment rule are in AGENTS and its matching detailed rule.
- [ ] The PR template and local `qa-depth-gate` validator reject missing/failed knowledge-gate evidence.
- [ ] Debug Labs cover auth, lifecycle, assignment/collaboration, dashboard/history, email, AI, and QA evidence.
- [ ] Each member has a personal learning page and an initially empty progress register with zero historical debt.
- [ ] IDTS-83 to IDTS-86 retain their real owners and linked dependency order.

### Evidence

Store sanitized notes in `docs/learning/progress/` or `docs/pm/evidence/`; a Jira Done comment must state `Ownership Knowledge Gate: PASS` and link the PR/evidence. Never store password, token, private endpoint, API key, or full personal data.

## Vietnamese

### Mục đích

Giúp từng thành viên giải thích và debug được phần code mình sở hữu, thay vì chỉ demo màn hình chạy. Baseline này có hiệu lực từ 13/07/2026 theo Asia/Bangkok.

### Phạm vi

- Duy trì ownership theo file và end-to-end flow trong `docs/learning/ownership-map.md`.
- Áp dụng Ownership Knowledge Gate hằng ngày trước task không tầm thường; nếu cùng ngày chạm flow mới thì hỏi thêm hai câu.
- Bắt buộc đạt 80%, đúng toàn bộ câu critical, làm một debugger exercise và teach-back trước merge PR/Jira Done.
- Có Debug Lab kiểu người mới học và progress record cá nhân.
- Retrofit comment giải thích tiếng Việt cho 72 runtime source file đã xác định và cập nhật knowledge mirror song ngữ qua IDTS-83 đến IDTS-85.

### Ngoài phạm vi

Không thay code review, QA Depth Gate, CAP/Fiori check hoặc Jira permission. Không công khai credential và không dạy member học thuộc câu trả lời có sẵn.

### Acceptance criteria

- [ ] Effective date, ownership map, question rule, PASS/FAIL consequence và source-comment rule có trong AGENTS cùng detailed rule.
- [ ] PR template và local `qa-depth-gate` validator chặn thiếu/fail knowledge-gate evidence.
- [ ] Debug Lab bao phủ auth, lifecycle, assignment/collaboration, dashboard/history, email, AI và QA evidence.
- [ ] Mỗi member có learning page và progress register ban đầu không có historical debt.
- [ ] IDTS-83 đến IDTS-86 giữ đúng owner và dependency order.

### Evidence

Lưu ghi chú đã sanitize ở `docs/learning/progress/` hoặc `docs/pm/evidence/`; comment Jira Done phải ghi `Ownership Knowledge Gate: PASS` và dẫn PR/evidence. Không lưu password, token, endpoint private, API key hoặc dữ liệu cá nhân đầy đủ.

## 2026-08-12 DonHV email-flow gate

DonHV completed the seven-question Notification and email outbox gate with 7/7 (100%). All security/data-integrity critical answers, the controlled `ESOCKET` debug exercise, and the final end-to-end teach-back passed. The deterministic gate date is 2026-08-12; the interactive session finished on 2026-08-13 Asia/Bangkok. Sanitized evidence: `docs/pm/evidence/idts-82/knowledge-gate-donhv-email-2026-08-12.md`. This records no runtime, deployment, Jira, PR, credential, or external-system mutation.

Vietnamese: DonHV đã hoàn thành gate 7 câu cho flow Notification và email outbox với kết quả 7/7 (100%). Toàn bộ câu critical về security/data integrity, bài debug `ESOCKET` có kiểm soát và teach-back end-to-end cuối đều PASS. Ngày gate xác định bởi selector là 2026-08-12; phiên tương tác hoàn tất ngày 2026-08-13 Asia/Bangkok. Evidence đã sanitize nằm tại `docs/pm/evidence/idts-82/knowledge-gate-donhv-email-2026-08-12.md`. Không có runtime, deploy, Jira, PR, credential hoặc mutation hệ thống ngoài.
