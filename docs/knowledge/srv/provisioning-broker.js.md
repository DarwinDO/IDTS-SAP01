# Knowledge: `srv/provisioning-broker.js`

## English

After the external provider confirms the exact DEVELOPER Role Collection, CAP materializes the desired Developer Profile and responsibilities in the same transaction that activates the User and onboarding request. Missing desired data aborts local completion, so `ACTIVE` cannot be written with an incomplete Developer. Role change or revoke away from DEVELOPER deactivates the profile and responsibilities without changing existing Bug assignees.

## Tiếng Việt

Sau khi external provider xác nhận đúng Role Collection DEVELOPER, CAP materialize Developer Profile và responsibilities mong muốn trong cùng transaction kích hoạt User và onboarding request. Thiếu desired data sẽ chặn local completion, nên không thể ghi `ACTIVE` cho Developer chưa đủ profile. Đổi role hoặc revoke khỏi DEVELOPER sẽ deactivate profile và responsibilities nhưng không đổi assignee của Bug hiện có.

## Gate 3 reactivation / Reactivate access Gate 3

`REACTIVATE` is a readback-only broker operation. It lists the target user's Role Collections once, compares the exact IDTS collection set against the fixed desired role/capability snapshot, and permits unrelated non-IDTS collections. It performs no assign or unassign call. CAP activates the existing local user only after a successful provider completion/readback and matching local role; the request remains `SUSPENDED` while queued or processing. Any mismatch, timeout, identity error, or failed readback stays denied and leaves the user inactive. Revoked sessions are not restored.

Vietnamese: `REACTIVATE` la operation broker chi readback. Broker list Role Collections mot lan, so sanh exact tap IDTS voi snapshot role/capability co dinh va cho phep collection ngoai IDTS. Broker khong assign/unassign. CAP chi activate user local sau khi provider completion/readback thanh cong va role local khop; request van `SUSPENDED` khi queued/processing. Mismatch, timeout, identity error hoac readback fail deu giu access bi tu choi va user inactive. Session da revoke khong khoi phuc.
## Gate 3B existing identity completion / Hoàn tất link identity hiện hữu

`completeSuccess` handles `LINK_EXISTING` through the `PROVISIONING` state. It loads only `request.linkTargetUser_ID`, rejects another `Users` row owning the verified normalized email or identity hash, and accepts only an active legacy row whose role and source-email snapshot still match and whose four identity fields are all null. One conditional update changes only the existing row's email plus the four immutable identity fields; display name, role, active flag, password data, Developer Profile, responsibilities, Bug assignee, comments, notifications, and history are preserved. The same transaction then writes request `ACTIVE`, exact `activeUser_ID`, `provisionedAt`, operation `SUCCEEDED`, and safe `LINK_EXISTING` audit. Partial/different target state is a safe reconciliation conflict.

`completeSuccess` xu ly `LINK_EXISTING` qua state `PROVISIONING`. Handler chi load `request.linkTargetUser_ID`, tu choi user `Users` khac dang so huu email normalized hoac identity hash da verify, va chi chap nhan row legacy active khi role va email snapshot con khop va ca bon identity field van null. Mot conditional update chi doi email cua row hien tai va bon immutable identity field; display name, role, active, password, Developer Profile, responsibility, assignee Bug, comment, notification va history duoc giu nguyen. Cung transaction ghi request `ACTIVE`, `activeUser_ID` exact, `provisionedAt`, operation `SUCCEEDED` va audit an toan `LINK_EXISTING`. State partial/khac bi conflict an toan.

**Important source anchors**

- **Location**: `srv/provisioning-broker.js:152` `completeSuccess(...)` and `:226` `completeExistingLink(...)`
  **IDTS concept**: The CAP commit boundary for same-row legacy identity linking and preservation of existing ownership data.
  **Impact if broken**: A replacement user, wrong target, duplicate identity, or partial local activation could orphan Developer workload/Bug ownership or expose access before reconciliation.
  **Must check together**: `db/schema.cds` onboarding link fields and `Users`, `broker/lib/access-provisioning.js`, `srv/access/identity-readiness.js`, and the focused identity-link fixture.

## Gate 3B state mapping / Mapping state Gate 3B

`processingStateFor('LINK_EXISTING')` is `PROVISIONING` and `queuedStateFor('LINK_EXISTING')` is `PROVISION_QUEUED`; no new code-list row is introduced. The broker completion result is readback-only, and the CAP transaction owns the final local identity materialization.

`processingStateFor('LINK_EXISTING')` la `PROVISIONING`, con `queuedStateFor('LINK_EXISTING')` la `PROVISION_QUEUED`; khong them code-list row moi. Ket qua broker chi la readback, con transaction CAP so huu viec materialize identity local cuoi cung.
