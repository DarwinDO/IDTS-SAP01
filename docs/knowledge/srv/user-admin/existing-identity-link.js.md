# Knowledge: `srv/user-admin/existing-identity-link.js`

## English

This module owns the PM + UserAdmin request boundary for linking one selected active legacy TESTER/DEVELOPER. It normalizes the new email, re-reads the exact target, rejects inactive/PM/already-linked/partial/non-legacy targets, checks duplicate email, expires stale invitations, and uses the unique target lock `LINK_EXISTING + target ID` for concurrency. It persists only a signed invitation/delivery and queues no provider operation until the invited identity completes verification.

The returned onboarding result and audit summary are safe. Target identity fields, source snapshot, token material, provider details, and raw email content do not appear in public output or safe summaries.

## Tiếng Việt

Module này sở hữu boundary PM + UserAdmin để link một legacy TESTER/DEVELOPER active được chọn. Module normalize email mới, đọc lại đúng target, reject target inactive/PM/đã link/partial/non-legacy, kiểm tra duplicate email, đóng invitation stale và dùng lock `LINK_EXISTING + target ID` để chống cạnh tranh. Module chỉ lưu invitation/delivery đã ký và chưa gọi provider operation cho đến khi identity được verify.

Onboarding result và audit summary trả về đều an toàn. Identity field của target, source snapshot, token material, chi tiết provider và raw email không xuất hiện trong public output hoặc safe summary.

The request boundary remains only a target-level concurrency guard; final normalized-email ownership is enforced again during broker completion under the locked Users read. This closes the cross-target race without adding a reservation column or provider write.

Boundary request van chi la guard concurrency theo target; ownership email normalized cuoi cung duoc enforce lai o broker completion voi Users read bi lock. Cach nay dong race cross-target ma khong them reservation column hoac provider write.

The existing public action name is retained for compatibility with the deployed UI, but its cancellation transaction now accepts every unconsumed `INVITED` request. It uses the same optimistic version guard, clears `openRequestKey`, marks pending/failed delivery as `SKIPPED`, preserves all request/delivery history, and appends either `CANCEL_LINK_INVITATION` for a targeted legacy link or `CANCEL_INVITATION` for standard onboarding. Verified, provisioning, active, failed, expired, and already-cancelled requests remain non-cancellable.

Ten public action hien huu duoc giu de tuong thich voi UI da deploy, nhung transaction Cancel nay gio chap nhan moi request `INVITED` chua consumed. Handler dung cung optimistic version guard, clear `openRequestKey`, dat delivery PENDING/FAILED thanh `SKIPPED`, giu toan bo lich su request/delivery, va ghi `CANCEL_LINK_INVITATION` cho link legacy co target hoac `CANCEL_INVITATION` cho onboarding thuong. Request da verify, dang provisioning, active, failed, expired hoac da Cancel van khong the Cancel lai.

### Important source anchors

- **Location**: `srv/user-admin/existing-identity-link.js:15` `requestExistingUserIdentityLink(...)`
  **IDTS concept**: Server-owned authorization and target snapshot before the one-time identity invitation.
  **Impact if broken**: A PM could link the wrong row, create concurrent invitations, or expose a path to PM/UserAdmin identity takeover.
  **Must check together**: `srv/user-admin.js`, `db/schema.cds`, invitation templates, and the Gate 3B request/verification contract.
- **Location**: `srv/user-admin/existing-identity-link.js` `cancelExistingUserIdentityLink(...)`
  **IDTS concept**: One fail-closed cancellation transaction shared by standard and existing-link invitations.
  **Impact if broken**: A stale email link could remain usable, a concurrent PM action could overwrite newer state, or delivery history could be lost.
  **Must check together**: `srv/user-admin.js` summary eligibility, `UserOnboardingDeliveries`, UI i18n copy, and both onboarding cancellation fixtures.
