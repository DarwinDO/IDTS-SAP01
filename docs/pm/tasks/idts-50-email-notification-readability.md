# IDTS-50 - Email notification readability and deep-link polish

## Summary

IDTS-50 fixes the first real-user feedback from shared QA email delivery:

- the email body looked too raw in Gmail;
- the `Open this bug in IDTS` link produced an invalid `index.html/` server path;
- the link did not use the draft-enabled Fiori Object Page key shape.

Owner: DonHV.

Jira: [IDTS-50](https://dutassociation.atlassian.net/browse/IDTS-50)

## Scope

- Redesign `srv/email/template.js` email HTML as a readable notification card.
- Keep the plain-text fallback.
- Generate Fiori deep links as `index.html#/Bugs(ID=<uuid>,IsActiveEntity=true)`.
- Support three private `baseUrl` styles:
  - deployment root;
  - Fiori app folder;
  - exact `index.html` URL.
- Keep email summary-only and free of sensitive details.
- Add focused regression checks in `scripts/qa/test-email-outbox-programmatic.js`.
- Update the knowledge mirror for `srv/email/template.js`.

## Out of scope

- No change to Brevo API/SMTP transport.
- No change to the outbox retry model.
- No Fiori Object Page redesign.
- No login UI redesign. SAP/Fiori visual refresh for login can be a separate UI task later.
- No canonical business-rule change.

## Implementation notes

- `buildBugLink(...)` now normalizes the configured `baseUrl` before appending the Fiori hash route.
- The active bug key includes `IsActiveEntity=true`, which is required for draft-enabled CAP/Fiori entities.
- HTML uses inline styles because many email clients strip external CSS.
- Email wording separates:
  - notification type;
  - current status;
  - current action owner.

## Verification plan

- `npm run qa:email-outbox:programmatic`
- `npx cds compile srv app/bug-management-ui --to edmx -s all`
- `npm run qa:secret-scan`
- `git diff --check`
- `npx ai-devkit@latest lint --json`

## Current evidence

- 2026-07-02: Focused email outbox regression passed after worktree dependency bootstrap:
  `npm run qa:email-outbox:programmatic` -> `IDTS-36 email outbox programmatic checks: PASS`.
- 2026-07-02: `npx cds compile srv app/bug-management-ui --to edmx -s all` passed with the known pre-existing attachment metadata warning.
- 2026-07-02: `npm run qa:secret-scan` passed: no credential-like key patterns found.
- 2026-07-02: `git diff --check` passed.
- 2026-07-02: `npx ai-devkit@latest lint --json` passed with 5 ok, 0 warnings, 0 misses.

## Risks / notes

- A new real email must be generated after deployment to visually confirm the Gmail rendering.
- Existing historical `NotificationDeliveries` keep their old stored HTML snapshot and will not be rewritten.
- `npm ci` still reports known dependency vulnerabilities already tracked separately under IDTS-46; IDTS-50 does not change dependency versions.

## Vietnamese

## Tóm tắt

IDTS-50 xử lý feedback đầu tiên từ email thật trên shared QA:

- nội dung email nhìn quá thô trong Gmail;
- link `Open this bug in IDTS` sinh ra path server sai `index.html/`;
- link chưa dùng đúng key shape của Fiori Object Page cho entity có draft.

Owner: DonHV.

Jira: [IDTS-50](https://dutassociation.atlassian.net/browse/IDTS-50)

## Phạm vi

- Thiết kế lại HTML email trong `srv/email/template.js` thành notification card dễ đọc.
- Giữ bản plain-text fallback.
- Sinh Fiori deep link theo dạng `index.html#/Bugs(ID=<uuid>,IsActiveEntity=true)`.
- Hỗ trợ ba kiểu `baseUrl` private:
  - deployment root;
  - folder Fiori app;
  - URL chính xác tới `index.html`.
- Email chỉ chứa summary, không chứa dữ liệu nhạy cảm.
- Thêm regression check trong `scripts/qa/test-email-outbox-programmatic.js`.
- Cập nhật knowledge mirror cho `srv/email/template.js`.

## Ngoài phạm vi

- Không đổi Brevo API/SMTP transport.
- Không đổi cơ chế retry của outbox.
- Không redesign Fiori Object Page.
- Không redesign login UI. Việc refresh login theo SAP/Fiori style có thể tách thành task UI riêng sau.
- Không thay đổi business rule canonical.

## Ghi chú implementation

- `buildBugLink(...)` normalize `baseUrl` trước khi append Fiori hash route.
- Active bug key có `IsActiveEntity=true`, phù hợp CAP/Fiori draft-enabled entity.
- HTML dùng inline style vì nhiều email client chặn external CSS.
- Wording email tách rõ:
  - loại notification;
  - trạng thái hiện tại;
  - người/queue cần xử lý tiếp.

## Kế hoạch verify

- `npm run qa:email-outbox:programmatic`
- `npx cds compile srv app/bug-management-ui --to edmx -s all`
- `npm run qa:secret-scan`
- `git diff --check`
- `npx ai-devkit@latest lint --json`

## Evidence hiện tại

- 2026-07-02: Focused email outbox regression pass sau khi bootstrap dependency cho worktree:
  `npm run qa:email-outbox:programmatic` -> `IDTS-36 email outbox programmatic checks: PASS`.
- 2026-07-02: `npx cds compile srv app/bug-management-ui --to edmx -s all` pass với warning attachment metadata cũ đã biết.
- 2026-07-02: `npm run qa:secret-scan` pass: không phát hiện pattern giống credential.
- 2026-07-02: `git diff --check` pass.
- 2026-07-02: `npx ai-devkit@latest lint --json` pass với 5 ok, 0 warning, 0 missing.

## Rủi ro / ghi chú

- Sau deploy cần tạo email mới để nhìn trực tiếp rendering trong Gmail.
- Các `NotificationDeliveries` lịch sử vẫn giữ HTML snapshot cũ và sẽ không được rewrite.
- `npm ci` vẫn báo dependency vulnerabilities đã biết và đã được track riêng ở IDTS-46; IDTS-50 không đổi dependency version.
