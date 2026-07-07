# IDTS-63 Evidence Index

This folder contains sanitized, repository-safe evidence for the AI guardrail discovery task.

## Evidence

- Guardrail document: `docs/ba/discovery/idts-63-ai-assistance-guardrails.md`
- Canonical scope alignment: `IDTS-SUMMARY.md`, `IDTS-Business-Rule.md`, `IDTS-PROJECT-SCOPE-SAP01.md`, and `docs/project-context.md`
- Decision and risk alignment: `docs/pm/risk-decision-log.md`
- Jira tracking: IDTS-63 is in Sprint 4 and In Progress.

## Safety

No provider key, token, private endpoint, private email, database URL, AWS credential, SMTP credential, prompt containing secrets, or raw provider response belongs in this folder or in the Jira attachment.

Vietnamese: Folder này chỉ lưu evidence đã làm sạch và có thể commit. Không được đưa provider key, token, private endpoint, email private, database URL, AWS/SMTP credential, prompt chứa secret hoặc raw provider response vào đây hay attachment Jira.

## Verification result - 2026-07-07

- `git diff --check`: PASS after removing one trailing-space finding.
- `node scripts/qa/secret-scan.js`: PASS.
- `npx ai-devkit@latest lint --json`: PASS, 5 checks OK, 0 warnings, 0 required failures.
- Jira live verification: IDTS-63 is in `IDTS Sprint 4` and status `In Progress`.

Vietnamese: Kiểm tra ngày 2026-07-07 đã pass `git diff --check`, secret scan và AI DevKit lint. Jira live xác nhận IDTS-63 nằm trong `IDTS Sprint 4` và đang `In Progress`.

## Manual Jira upload handoff

DonHV will manually attach `docs/ba/discovery/idts-63-ai-assistance-guardrails.md` to Jira IDTS-63 after the repository work is merged. The repository copy is the source of truth; the Jira attachment is review evidence only.

Vietnamese: DonHV sẽ tự attach file `docs/ba/discovery/idts-63-ai-assistance-guardrails.md` vào Jira IDTS-63 sau khi phần repo được merge. Bản trong repo là source of truth; attachment Jira chỉ là evidence review.
