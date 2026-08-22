# Knowledge: `srv/user-admin/existing-identity-link.js`

## English

This module owns the PM + UserAdmin request boundary for linking one selected active legacy TESTER/DEVELOPER. It normalizes the new email, re-reads the exact target, rejects inactive/PM/already-linked/partial/non-legacy targets, checks duplicate email, expires stale invitations, and uses the unique target lock `LINK_EXISTING + target ID` for concurrency. It persists only a signed invitation/delivery and queues no provider operation until the invited identity completes verification.

The returned onboarding result and audit summary are safe. Target identity fields, source snapshot, token material, provider details, and raw email content do not appear in public output or safe summaries.

## Tiếng Việt

Module này sở hữu boundary PM + UserAdmin để link một legacy TESTER/DEVELOPER active được chọn. Module normalize email mới, đọc lại đúng target, reject target inactive/PM/đã link/partial/non-legacy, kiểm tra duplicate email, đóng invitation stale và dùng lock `LINK_EXISTING + target ID` để chống cạnh tranh. Module chỉ lưu invitation/delivery đã ký và chưa gọi provider operation cho đến khi identity được verify.

Onboarding result và audit summary trả về đều an toàn. Identity field của target, source snapshot, token material, chi tiết provider và raw email không xuất hiện trong public output hoặc safe summary.

### Important source anchors

- **Location**: `srv/user-admin/existing-identity-link.js:15` `requestExistingUserIdentityLink(...)`
  **IDTS concept**: Server-owned authorization and target snapshot before the one-time identity invitation.
  **Impact if broken**: A PM could link the wrong row, create concurrent invitations, or expose a path to PM/UserAdmin identity takeover.
  **Must check together**: `srv/user-admin.js`, `db/schema.cds`, invitation templates, and the Gate 3B request/verification contract.
