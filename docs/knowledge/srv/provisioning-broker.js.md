# Knowledge: `srv/provisioning-broker.js`

## 2026-09-03 provisioned display name / Tên provision 2026-09-03

Successful `PROVISION` now uses `UserOnboardingRequests.requestedDisplayName` for a new `Users.displayName`. The email fallback exists only for legacy requests created before the additive field. Existing-user linking still preserves the selected row's current display name. This broker still changes Role Collection membership only; it does not administer an SAP account login email.

`PROVISION` thành công hiện dùng `requestedDisplayName` làm `Users.displayName`. Fallback email chỉ dành cho request legacy có trước field additive. Link existing user vẫn giữ tên hiện tại của row đã chọn. Broker vẫn chỉ đổi Role Collection, không quản trị email đăng nhập tài khoản SAP.

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

## Gate 3B reconciliation hardening / Củng cố reconcile Gate 3B

Before `LINK_EXISTING` completion, the request and operation must carry the same non-empty correlation ID. The verification path persists the generated operation correlation on the existing-link request, while ordinary provisioning keeps its existing correlation behavior. Completion reads and pessimistically locks the explicit Users collision set in one CAP transaction before checking the normalized email and identity hash, so concurrent links for different targets have one winner and a blocked loser without a partial target update. The focused fixtures cover correlation mismatch, cross-target same-email competition, and preserved user/profile/assignment/comment/history/notification state; post-update fault injection remains runtime test debt because the locked fixture has no supported failure hook.

Trước khi hoàn tất `LINK_EXISTING`, request và operation phải có cùng correlation ID khác rỗng. Nhánh verify ghi correlation của operation lên request link hiện hữu, còn provisioning thường giữ behavior correlation cũ. Completion đọc và pessimistic-lock tập Users cần kiểm tra collision trong cùng transaction CAP trước khi check email normalized và identity hash, để cạnh tranh giữa hai target có đúng một winner và một loser bị block mà không update target dở dang. Fixture tập trung bao phủ mismatch correlation, cạnh tranh cùng email giữa hai target và preservation user/profile/assignment/comment/history/notification; fault injection sau user update vẫn là test debt runtime vì fixture locked không có hook lỗi được hỗ trợ.

Expired-lease reconciliation also rotates the correlation for `LINK_EXISTING`; before the transaction updates the request state to `BLOCKED_MANUAL_REVIEW`, it writes that same reconciliation correlation to the request. The next UserAdmin reconcile/retry requeue performs the same conditional binding before the broker can claim and complete the link. Non-link operation types do not receive this request-correlation patch.

Reconcile lease hết hạn cũng rotate correlation của `LINK_EXISTING`; trước khi transaction đổi request sang `BLOCKED_MANUAL_REVIEW`, nó ghi cùng reconciliation correlation vào request. Lần requeue reconcile/retry kế tiếp của UserAdmin cũng bind có điều kiện trước khi broker claim và complete link. Operation type không phải link không nhận patch correlation request này.

## Gate 6.5 final completion hook / Hook completion cuối Gate 6.5

### English

Provider-backed completion now receives the request context, persists a timestamped final audit, and calls `writeUserAccessDelivery` only when the broker result is exactly `APPLIED` and the operation action maps to `CHANGE_ROLE`, `REACTIVATE`, or `REVOKE`. `NOOP_ALREADY_DESIRED`, failures, ambiguous results, and Developer-profile audit actions produce no access delivery. A pending row registers the existing post-commit email kick; the broker transaction never calls the provider email transport.

- **Location**: `srv/provisioning-broker.js:149-252` — `completeSuccess` final audit and delivery creation.
  **IDTS concept**: notify only after provider proof and local state application commit together.
  **Impact if broken**: users may be told access changed while it is queued/failed, or completion can roll back because email transport failed.
  **Must check together**: `srv/user-admin/access-delivery.js:63-107`, `srv/user-admin.js:935-969`, and provisioning/access notification tests.
- **Location**: `srv/provisioning-broker.js:479-507` — `appendAudit(..., completedAt)`.
  **IDTS concept**: the delivery snapshot uses the same deterministic completion timestamp as its source audit.
  **Impact if broken**: audit chronology and user-facing completion time diverge.
  **Must check together**: `srv/user-admin/access-lifecycle.js:19-80` and timestamp assertions.

### Tiếng Việt

Completion có provider giờ nhận request context, persist audit cuối có timestamp và chỉ gọi `writeUserAccessDelivery` khi kết quả broker đúng `APPLIED` và action map tới `CHANGE_ROLE`, `REACTIVATE` hoặc `REVOKE`. `NOOP_ALREADY_DESIRED`, failure, kết quả ambiguous và audit Developer profile không tạo access delivery. Row `PENDING` chỉ đăng ký immediate email kick hiện có sau commit; transaction broker không gọi email transport.

- **Vị trí**: `srv/provisioning-broker.js:149-252` — audit cuối và tạo delivery trong `completeSuccess`.
  **Khái niệm IDTS**: chỉ thông báo sau khi provider proof và local state được apply cùng transaction.
  **Ảnh hưởng nếu sai**: user có thể nhận thông báo khi access mới queued/failed, hoặc completion bị rollback vì email transport lỗi.
  **Phải kiểm tra cùng**: `srv/user-admin/access-delivery.js:63-107`, `srv/user-admin.js:935-969` và test provisioning/access notification.
- **Vị trí**: `srv/provisioning-broker.js:479-507` — `appendAudit(..., completedAt)`.
  **Khái niệm IDTS**: snapshot delivery dùng cùng completion timestamp xác định với source audit.
  **Ảnh hưởng nếu sai**: thứ tự audit và thời điểm completion hiển thị cho user bị lệch.
  **Phải kiểm tra cùng**: `srv/user-admin/access-lifecycle.js:19-80` và assertion timestamp.

**Safe editing / Sửa an toàn:** Keep the APPLIED/action allowlist and post-commit boundary together. Never broaden this hook to queued, no-op, failure, or responsibility-only audits. / Giữ allowlist APPLIED/action và boundary sau commit cùng nhau. Không mở rộng hook sang audit queued, no-op, failure hoặc chỉ đổi responsibility.
