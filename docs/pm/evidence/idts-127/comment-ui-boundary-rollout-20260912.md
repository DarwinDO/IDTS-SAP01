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

## Final rollout, topology recovery, and live acceptance — 2026-09-12

The source merge under acceptance is `54ad1b824d74f57e5d1a6e9dbd6208cd80768d8b`. The deployed Bug Management UI is version `0.0.16`, artifact SHA-256 `F7949863FAD1677878B5E649155586FA8526683DCEDD7720213E0CC88FBB7AF4`.

The first narrow content-descriptor rollout temporarily detached MTA metadata from the deployed topology. This was an operational metadata effect only: the existing services and data remained present. Selective CAP/AppRouter restages recovered the application topology; no `db-deployer` restage, schema deployment, migration, seed/import, or business-data mutation was performed. The four recorded deployment operations all finished:

| Operation | Status |
|---|---|
| `3db5afe5-ae5b-11f1-8aff-eeee0a831123` | `FINISHED` |
| `aa3e6a3e-ae5b-11f1-8aff-eeee0a831123` | `FINISHED` |
| `619fd74d-ae5e-11f1-8b4e-eeee0a85d7b9` | `FINISHED` |
| `e0d69079-ae5f-11f1-8b4e-eeee0a85d7b9` | `FINISHED` |

Final topology readback retained CAP droplet `aa1a95d2-9efa-41cf-906b-2bd8430cf67f` and AppRouter droplet `fbece83e-e3b2-46f8-b031-5a4fa12ee04a`; the MTA lists both apps and six services. `npm run btp:demo:check` is `DEMO READY`.

UAT-COM-003 is IDTS-111 display number `42` on controlled `BUG-0021` (Bug ID `029435e3-abb7-4079-826a-394709f9eb50`) in the DonHV PM session. The exact 1,000-character marker `UAT-COM-003-1000|` posted once and remained visible after reload. The one authorized 1,001-character attempt retained the full TextArea input, showed the safe generic Error dialog, reached CAP as HTTP `400` with `Comment cannot exceed 1000 characters`, and left the comment list unchanged at two entries; after reload the 1001 marker count was zero. Comments, History, Notifications, and Attachments remained rendered. Runtime screenshots are `03-live-1000-pass.png` (SHA-256 `55012D3F13E6114F277B0F4F209CA0F9C77E50FAC01892B843489F4980529609`) and `04-live-1001-rejected.png` (SHA-256 `F35D860BD007EDCD53915C77A7F4AF5BD1C51B2B53FE70079503C54B1C8AE06F`).

This records the final PASS under the parent-authorized user decision. No Jira approval or Jira mutation is claimed; workbook, IDTS-110 cards, Drive, and live data outside the single authorized rejection attempt remain unchanged.

### Kết quả rollout và kiểm tra live

Lần rollout content descriptor hẹp đầu tiên chỉ làm tách metadata MTA tạm thời; services và dữ liệu hiện hữu vẫn còn. Đã khôi phục topology bằng restage có chọn lọc cho CAP/AppRouter, không restage `db-deployer`, không deploy schema/migration/seed/import và không mutation business data. Bốn operation ở trên đều `FINISHED`; droplet cuối là CAP `aa1a95d2-9efa-41cf-906b-2bd8430cf67f`, AppRouter `fbece83e-e3b2-46f8-b031-5a4fa12ee04a`, readiness `DEMO READY`.

UAT-COM-003 là IDTS-111 display `42`, không phải card IDTS-110. Trong session PM DonHV, marker 1.000 ký tự lưu và hiển thị lại sau reload; lần thử 1.001 ký tự được phép duy nhất bị CAP trả HTTP `400`, hiện Error an toàn, không lưu marker 1.001 hay nội dung bị cắt. Đây là final PASS theo quyết định được ủy quyền; không mutation Jira.
