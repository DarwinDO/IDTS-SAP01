# IDTS-127 Comment UI Boundary Rollout — 2026-09-12

## Finding

Live PM acceptance showed that pasting 1,001 characters into the comment `TextArea` did not reach the CAP boundary unchanged. SAPUI5 applied `maxLength="1000"`, silently shortened the text to 1,000 characters, and the resulting valid 1,000-character comment was stored. This did not satisfy `UAT-COM-003`, whose required behavior is rejection without partial or truncated persistence.

The controlled 1,000-character comment created while reproducing the defect remains in the live test Bug. It is not deleted by this source change because deletion is a separate data mutation requiring explicit approval.

## Minimal correction

- Remove only the client-side `maxLength="1000"` attribute.
- Keep CAP as the authoritative 1,000-character trust boundary.
- Add a regression assertion that forbids reintroducing silent client truncation.
- Advance the Bug Management UI cache identity from `0.0.15` to `0.0.16`.
- Do not change CAP, database/schema, roles, notification behavior, provider configuration, workbook, or live business data.

## Verification before rollout

| Check | Result |
|---|---|
| `node scripts/qa/test-idts116-standard-collaboration-ui.js` | PASS |
| `node scripts/qa/test-idts43-fiori-ux.js` | 18 PASS / 0 FAIL |
| `node scripts/qa/test-my-notifications-ui.js` | PASS after cache-version contract update |
| `npm run qa:comments-attachments:programmatic` | PASS, including 1,000 accepted and 1,001 rejected by CAP |
| `npx ui5 build --clean-dest` from `app/bug-management-ui` | PASS |
| `git diff --check` | PASS |

The broad app-local ESLint command is not a usable delta gate in this Windows checkout because thousands of pre-existing CRLF `linebreak-style` findings occur in untouched files. No mass line-ending rewrite is included in this focused fix.

## Required live acceptance after UI-only rollout

1. Open a controlled active Bug as an authorized user.
2. Enter exactly 1,000 characters and confirm the comment can be posted and survives reload.
3. Enter 1,001 characters and confirm CAP rejects the request with a safe message.
4. Reload and confirm no truncated or partial comment was added by step 3.
5. Confirm Comments, History, Notifications, and Attachments still render.
6. Confirm `npm run btp:demo:check` returns `DEMO READY`.

## Tiếng Việt

Lỗi live là UI5 tự cắt comment 1.001 ký tự thành 1.000 ký tự trước khi gửi, nên backend nhận dữ liệu hợp lệ và đã lưu comment bị cắt. Bản sửa tối thiểu bỏ giới hạn cắt ngầm ở UI, gửi nguyên nội dung tới CAP và để CAP từ chối 1.001 ký tự mà không lưu một phần. Sau rollout UI-only phải kiểm tra lại cả mốc 1.000 và 1.001 ký tự trên live.
