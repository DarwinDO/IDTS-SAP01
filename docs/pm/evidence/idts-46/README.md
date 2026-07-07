# IDTS-46 Evidence Index

This folder stores sanitized, repository-safe evidence for the npm dependency vulnerability review.

Vietnamese: Folder này lưu evidence đã làm sạch và có thể commit cho việc review npm dependency vulnerability.

## Evidence summary

- Worktree: `E:\IDTS-SAP01-worktrees\idts-46-npm-security`
- Branch: `chore/idts-46-npm-vulnerability-review-donhv`
- Remediation type: compatible lockfile update only.
- Runtime audit after remediation: 6 moderate, 0 high, 0 critical.
- Full audit after remediation: 9 moderate, 5 high, 0 critical.
- No secret, private endpoint, Render env, Brevo key, AWS key, DB URL, bearer token, or private email is stored here.

Vietnamese:

- Worktree: `E:\IDTS-SAP01-worktrees\idts-46-npm-security`
- Branch: `chore/idts-46-npm-vulnerability-review-donhv`
- Kiểu xử lý: chỉ update lockfile trong range tương thích.
- Runtime audit sau remediation: 6 moderate, 0 high, 0 critical.
- Full audit sau remediation: 9 moderate, 5 high, 0 critical.
- Không lưu secret, private endpoint, Render env, Brevo key, AWS key, DB URL, bearer token hoặc email private trong folder này.

## Commands to keep with PR evidence

```powershell
npm audit --omit=dev --json
npm audit --json
npm explain @ui5/project pacote sigstore @cap-js/attachments @google-cloud/storage uuid --depth=8
npx cds compile srv --to edmx -s all
npm run qa:auth:programmatic
npm run qa:email-outbox:programmatic
npm run qa:comments-attachments:programmatic
npm run qa:secret-scan
npm run qa:depth:self-test
npx ai-devkit@latest lint --json
git diff --check
```

## Verification result - 2026-07-07

| Command | Result |
| --- | --- |
| `npm audit --omit=dev --json` | Expected nonzero audit exit because 6 moderate runtime findings remain documented; 0 high, 0 critical. |
| `npm audit --json` | Expected nonzero audit exit because 14 full-tree findings remain documented; 9 moderate, 5 high, 0 critical. |
| `npm explain @ui5/project pacote sigstore @cap-js/attachments @google-cloud/storage uuid --depth=8` | PASS for dependency-path evidence collection. |
| `npx cds compile srv --to edmx -s all` | PASS exit 0; emitted existing annotation warning for `NonUpdateableProperties` on attachments. |
| `npm run qa:auth:programmatic` | PASS, 28 checks, 0 failures. |
| `npm run qa:email-outbox:programmatic` | PASS. |
| `npm run qa:comments-attachments:programmatic` | PASS. |
| `npx ui5 build --config ui5.yaml --dest ..\..\.tmp\ui5-build-idts46` from `app/bug-management-ui` | PASS, build succeeded in 8.08 s. |
| `npm run qa:secret-scan` | PASS, no credential-like key patterns found. |
| `npm run qa:depth:self-test` | PASS, 6 checks, 0 failures. |
| `npx ai-devkit@latest lint --json` | PASS, 5 OK, 0 warnings, 0 required failures. |
| `git diff --check` | PASS. |

Vietnamese: Verification ngày 2026-07-07 đã pass CAP compile, auth QA, email outbox, comments/attachments, UI5 build từ đúng thư mục app, secret scan, QA depth self-test, AI DevKit lint và `git diff --check`. Hai lệnh `npm audit` vẫn exit nonzero vì còn finding đã được ghi residual risk; không xem đây là verification fail cho task này vì mục tiêu là remediation an toàn và documented disposition, không force-fix breaking change.

## Manual Jira attachment handoff

DonHV does not need to upload this folder automatically through Codex. After merge, upload the PR link and this evidence index or copied summary to Jira IDTS-46 manually if Jira evidence is required.

Vietnamese: DonHV không cần Codex tự upload folder này lên Jira. Sau khi merge, nếu Jira cần evidence, DonHV tự upload link PR và evidence index hoặc phần summary đã copy vào Jira IDTS-46.
