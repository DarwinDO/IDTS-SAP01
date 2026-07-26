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

- 2026-07-26: SangVN passed the IDTS-85 Assignment/Comments/Attachments gate 4/4 (100%), with critical authorization/data-integrity, controlled debug, and teach-back all PASS after mentored equivalent retests. Evidence: `docs/pm/evidence/idts-85/knowledge-gate-sangvn-2026-07-26.md`; PR #186.

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

- 26/07/2026: SangVN pass gate IDTS-85 Assignment/Comments/Attachments 4/4 (100%); critical authorization/data-integrity, controlled debug và teach-back đều PASS sau mentored equivalent retest. Evidence: `docs/pm/evidence/idts-85/knowledge-gate-sangvn-2026-07-26.md`; PR #186.
