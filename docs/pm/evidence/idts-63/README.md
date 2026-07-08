# IDTS-63 Evidence Index

This folder contains sanitized, repository-safe evidence for the AI guardrail discovery task.

## Evidence

- Guardrail document: `docs/ba/discovery/idts-63-ai-assistance-guardrails.md`
- Canonical scope alignment: `IDTS-SUMMARY.md`, `IDTS-Business-Rule.md`, `IDTS-PROJECT-SCOPE-SAP01.md`, and `docs/project-context.md`
- Decision and risk alignment: `docs/pm/risk-decision-log.md`
- GitHub delivery: PR #93, `Docs: Define IDTS-63 AI assistance guardrails`, was merged into `dev`.
- Jira tracking: IDTS-63 is ready for Done/closure after PR #93 and PM evidence sync.

## Safety

No provider key, token, private endpoint, private email, database URL, AWS credential, SMTP credential, prompt containing secrets, or raw provider response belongs in this folder or in the Jira attachment.

Vietnamese: Folder này chỉ lưu evidence đã làm sạch và có thể commit. Không được đưa provider key, token, private endpoint, email private, database URL, AWS/SMTP credential, prompt chứa secret hoặc raw provider response vào đây hay attachment Jira.

## Verification result - 2026-07-07

- `git diff --check`: PASS after removing one trailing-space finding.
- `node scripts/qa/secret-scan.js`: PASS.
- `npx ai-devkit@latest lint --json`: PASS, 5 checks OK, 0 warnings, 0 required failures.
- Jira live verification at that time: IDTS-63 was in `IDTS Sprint 4` and still awaiting closure.

Vietnamese: Kiểm tra ngày 2026-07-07 đã pass `git diff --check`, secret scan và AI DevKit lint. Tại thời điểm đó Jira live xác nhận IDTS-63 nằm trong `IDTS Sprint 4` và vẫn đang chờ closure.

## Closure sync - 2026-07-08

- PR #93 is merged into `dev`: https://github.com/DarwinDO/IDTS-SAP01/pull/93
- GitHub `qa-depth-gate` for PR #93 completed successfully.
- This follow-up sync updates PM/evidence state only; it does not add runtime AI code, provider credentials, API changes, CDS entities, or UI changes.
- Fresh closure verification: `git diff --check`, stale-status `rg`, `node scripts/qa/secret-scan.js`, and `npx ai-devkit@latest lint --json` passed.

Vietnamese: PR #93 đã merge vào `dev` và `qa-depth-gate` đã pass. Lượt sync này chỉ cập nhật trạng thái PM/evidence; không thêm runtime AI, provider credential, API, CDS entity hoặc UI mới. Verification mới đã pass `git diff --check`, scan stale-status bằng `rg`, secret scan và AI DevKit lint.

## Manual Jira upload handoff

DonHV will manually attach `docs/ba/discovery/idts-63-ai-assistance-guardrails.md` to Jira IDTS-63 after the repository work is merged. The repository copy is the source of truth; the Jira attachment is review evidence only.

Vietnamese: DonHV sẽ tự attach file `docs/ba/discovery/idts-63-ai-assistance-guardrails.md` vào Jira IDTS-63 sau khi phần repo được merge. Bản trong repo là source of truth; attachment Jira chỉ là evidence review.
