# Knowledge: `srv/provisioning-broker.js`

## English

After the external provider confirms the exact DEVELOPER Role Collection, CAP materializes the desired Developer Profile and responsibilities in the same transaction that activates the User and onboarding request. Missing desired data aborts local completion, so `ACTIVE` cannot be written with an incomplete Developer. Role change or revoke away from DEVELOPER deactivates the profile and responsibilities without changing existing Bug assignees.

## Tiếng Việt

Sau khi external provider xác nhận đúng Role Collection DEVELOPER, CAP materialize Developer Profile và responsibilities mong muốn trong cùng transaction kích hoạt User và onboarding request. Thiếu desired data sẽ chặn local completion, nên không thể ghi `ACTIVE` cho Developer chưa đủ profile. Đổi role hoặc revoke khỏi DEVELOPER sẽ deactivate profile và responsibilities nhưng không đổi assignee của Bug hiện có.

## Gate 3 reactivation / Reactivate access Gate 3

`REACTIVATE` is a readback-only broker operation. It lists the target user's Role Collections once, compares the exact IDTS collection set against the fixed desired role/capability snapshot, and permits unrelated non-IDTS collections. It performs no assign or unassign call. CAP activates the existing local user only after a successful provider completion/readback and matching local role; the request remains `SUSPENDED` while queued or processing. Any mismatch, timeout, identity error, or failed readback stays denied and leaves the user inactive. Revoked sessions are not restored.

Vietnamese: `REACTIVATE` la operation broker chi readback. Broker list Role Collections mot lan, so sanh exact tap IDTS voi snapshot role/capability co dinh va cho phep collection ngoai IDTS. Broker khong assign/unassign. CAP chi activate user local sau khi provider completion/readback thanh cong va role local khop; request van `SUSPENDED` khi queued/processing. Mismatch, timeout, identity error hoac readback fail deu giu access bi tu choi va user inactive. Session da revoke khong khoi phuc.
