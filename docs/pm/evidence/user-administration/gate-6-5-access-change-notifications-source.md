# WP8 Gate 6.5 — Access-Change Notification Source Evidence

## English

### Exact scope and source state

- Owner: DonHV. Branch: `feature/wp8-user-access-notification-delivery-donhv`.
- Frozen planning snapshot: `5a12a7d3b1b32a4def1514daa809352bd22c1013`; exact implementation base/merge-base: `e355f95d7d0eb61e2bd675a35709270454e62276`; documented source head: `128f5ba0cbf9edfec6c7c1368d04316cf72f6efe`.
- Scope: one private access-change delivery outbox, final-audit completion wiring, reuse of the existing sender/worker/retry path, safe unified Operations DTO/actions, one User Administration Delivery table/filter/details flow, version `1.0.17`, focused tests, and bilingual mirrors.
- Out of scope: HDI/HANA migration or simulation, deployment, real email/provider send, user/role/data mutation, historical backfill, push, PR, Ready, merge, and cleanup.

### Source contract

- `UserAccessNotificationDeliveries` is the only new persistence entity. Its unique `sourceAuditEvent` association makes a final access audit the durable one-delivery idempotency key; invitation and Bug delivery storage remain separate.
- Only final `APPLIED` audits for role change, suspend, reactivate, and revoke are eligible. `QUEUED`, failure, conflict, `NOOP_ALREADY_DESIRED`, provisioning/linking, and Developer profile/responsibility audits create no access delivery.
- Completion writes the delivery in the same transaction, but sending remains in the shared post-commit worker. The access processor reuses sender formatting, transport sanitization, retry delay, attempt ceiling, and locking; no second worker, scheduler, provider SDK, or public raw-persistence projection exists.
- Operations authorizes before access, normalizes invitation/access rows into the allowlisted `AdministrationDeliverySummary`, masks recipients, bounds mixed paging, and keeps exact-type retry server-authoritative. The UI has one table/dialog, a native type filter, localized event labels, and no body/provider/audit/lock fields.

### Mirror coverage and documentation gate

Every changed tracked `app/`, `srv/`, and `db/` source in `origin/dev...128f5ba0cbf9edfec6c7c1368d04316cf72f6efe` has its exact convention mirror under `docs/knowledge/` (19 paths). The new `srv/user-admin/access-delivery.js` mirror documents the allowlist, source-audit lock/unique idempotency, shared worker, safe URL/time validation, business impact, and must-check-together contracts. The remaining mirrors cover the schema, completion hooks, outbox export, worker, Operations contract/mapping, UI/controller/view/details/i18n, and version metadata. English and Vietnamese Gate 6.5 sections carry equivalent meaning, concrete locations, IDTS impact, linked contracts, and safe-editing boundaries.

`officecli --version` returned `1.0.144`. OfficeCLI has no native Markdown-edit operation, so it was used as the required preflight only; repository Markdown was edited with normal repository patching.

### Additive HANA compiler comparison — no HDI execution

| Item | Result |
| --- | --- |
| Baseline source | Exact implementation base/merge-base `e355f95d7d0eb61e2bd675a35709270454e62276` (`origin/dev` at implementation start). The earlier `5a12...` commit is the planning snapshot only; the intervening merge changes documentation, not `db/`. |
| Candidate source | `128f5ba0cbf9edfec6c7c1368d04316cf72f6efe` |
| Compile method | `cds compile db/schema.cds --to hana --dest` to a unique temporary directory for both sources; the archived baseline used a read-only junction to the candidate's already locked dependency tree so CAP attachments resolve. |
| Baseline / candidate artifacts | `60` / `62` |
| Removed / changed existing artifacts | `0` / `0` by normalized relative path plus SHA-256 |
| Table data, CSV, procedures, unrelated new tables/views | `0`, `0`, `0`, `0` |

Exact compiler additions:

| Artifact | SHA-256 |
| --- | --- |
| `idts.cap.UserAccessNotificationDeliveries.hdbtable` | `0A4D1DB155FC8B88C010599BFA7A74CA4B9477A557723B36AFA5C314EFB65FB3` |
| `idts.cap.UserAccessNotificationDeliveries.accessAuditDelivery.hdbindex` | `2E90ED61A394260002841526D4F9035A4E498F11316BBC8CD4A959518368E370` |

The first two baseline attempts failed before comparison because the archived Git tree contains no dependencies and could not resolve `@cap-js/attachments`; no repository file changed. The final isolated run added the read-only scratch junction and completed successfully. This is a tooling-harness correction, not a HANA/HDI action. No deployer, HDI make, migration, seed, or data operation was run.

### Verification provenance and remaining boundary

Tasks 1–6 record their exact-head RED/GREEN and independent task-review results in the ignored Gate 6.5 SDD ledger. At source head `128f5ba0...`, Task 6 re-review records `0 Critical / 0 Major / 0 Important / 0 Minor`; focused User Administration UI, Operations, access-notification, lint/build, semantic version parity, secret scan, agent rules, QA-depth, CAP compilation, and diff checks are recorded there. This Task 7 documentation closure freshly ran the OfficeCLI preflight, mirror/equivalence and placeholder scans, the isolated HANA comparison above, and final documentation/diff checks. It does not claim runtime or release acceptance.

The next approval boundary is one bounded independent review of the complete exact source-plus-evidence head. A Critical, Major, or Important finding blocks push and the single Draft PR. Even a clean source review does not authorize the rollout steps in the separate plan.

## Tiếng Việt

### Phạm vi và trạng thái source chính xác

- Owner: DonHV. Branch: `feature/wp8-user-access-notification-delivery-donhv`.
- Planning snapshot đã khóa: `5a12a7d3b1b32a4def1514daa809352bd22c1013`; implementation base/merge-base chính xác: `e355f95d7d0eb61e2bd675a35709270454e62276`; source head được ghi nhận: `128f5ba0cbf9edfec6c7c1368d04316cf72f6efe`.
- Phạm vi: đúng một outbox private cho delivery thay đổi access, wiring completion từ audit cuối, tái sử dụng sender/worker/retry hiện có, DTO/action Operations hợp nhất an toàn, một luồng bảng/filter/details Delivery User Administration, version `1.0.17`, test tập trung và mirror song ngữ.
- Ngoài phạm vi: HANA/HDI migration hoặc simulation, deploy, gửi email/provider thật, mutation user/role/data, backfill lịch sử, push, PR, Ready, merge và cleanup.

### Contract source

- `UserAccessNotificationDeliveries` là entity persistence mới duy nhất. Association unique `sourceAuditEvent` biến audit access cuối thành idempotency key bền vững cho đúng một delivery; storage invitation và Bug vẫn tách riêng.
- Chỉ audit cuối `APPLIED` cho đổi role, suspend, reactivate và revoke mới đủ điều kiện. `QUEUED`, failure, conflict, `NOOP_ALREADY_DESIRED`, provisioning/linking và audit Developer profile/responsibility không tạo access delivery.
- Completion ghi delivery trong cùng transaction, nhưng việc gửi vẫn nằm trong worker post-commit dùng chung. Processor access tái dùng format sender, sanitize transport, retry delay, attempt ceiling và lock; không có worker, scheduler, provider SDK thứ hai hay projection public của persistence thô.
- Operations authorize trước khi truy cập, normalize row invitation/access thành `AdministrationDeliverySummary` allowlist, mask recipient, giới hạn paging hỗn hợp và giữ retry theo exact type do server quyết định. UI chỉ có một table/dialog, filter type native, label event đã localize và không có field body/provider/audit/lock.

### Coverage mirror và documentation gate

Mọi source tracked thay đổi dưới `app/`, `srv/`, `db/` trong `origin/dev...128f5ba0cbf9edfec6c7c1368d04316cf72f6efe` đều có mirror đúng quy ước trong `docs/knowledge/` (19 path). Mirror mới `srv/user-admin/access-delivery.js` giải thích allowlist, lock/unique idempotency theo source audit, worker dùng chung, validate URL/time an toàn, tác động nghiệp vụ và contract phải kiểm tra cùng. Các mirror còn lại phủ schema, completion hook, outbox export, worker, contract/mapping Operations, UI/controller/view/details/i18n và metadata version. Phần Gate 6.5 tiếng Anh/Việt có ý nghĩa tương đương, location cụ thể, impact IDTS, contract liên kết và boundary sửa an toàn.

`officecli --version` trả `1.0.144`. OfficeCLI không có thao tác sửa Markdown native nên chỉ được dùng làm preflight bắt buộc; Markdown repository được sửa bằng patch repository thông thường.

### So sánh compiler HANA additive — không chạy HDI

| Hạng mục | Kết quả |
| --- | --- |
| Source baseline | Implementation base/merge-base chính xác `e355f95d7d0eb61e2bd675a35709270454e62276` (`origin/dev` khi bắt đầu implementation). Commit `5a12...` trước đó chỉ là planning snapshot; merge ở giữa chỉ đổi documentation, không đổi `db/`. |
| Source candidate | `128f5ba0cbf9edfec6c7c1368d04316cf72f6efe` |
| Cách compile | `cds compile db/schema.cds --to hana --dest` tới thư mục tạm unique cho cả hai source; baseline Git archive dùng junction read-only tới dependency tree đã khóa của candidate để CAP attachments resolve. |
| Artifact baseline / candidate | `60` / `62` |
| Artifact hiện có bị remove / đổi | `0` / `0` theo relative path chuẩn hóa và SHA-256 |
| Table data, CSV, procedure, table/view mới không liên quan | `0`, `0`, `0`, `0` |

Artifact compiler thêm chính xác:

| Artifact | SHA-256 |
| --- | --- |
| `idts.cap.UserAccessNotificationDeliveries.hdbtable` | `0A4D1DB155FC8B88C010599BFA7A74CA4B9477A557723B36AFA5C314EFB65FB3` |
| `idts.cap.UserAccessNotificationDeliveries.accessAuditDelivery.hdbindex` | `2E90ED61A394260002841526D4F9035A4E498F11316BBC8CD4A959518368E370` |

Hai lần baseline đầu fail trước khi so sánh vì Git archive không có dependency nên không resolve được `@cap-js/attachments`; không file repository nào đổi. Lần chạy isolated cuối thêm scratch junction read-only và hoàn tất thành công. Đây là sửa tooling harness, không phải HANA/HDI action. Không chạy deployer, HDI make, migration, seed hoặc data operation.

### Nguồn verification và boundary còn lại

Tasks 1–6 ghi RED/GREEN exact-head và review độc lập trong SDD ledger Gate 6.5 bị ignore. Tại source head `128f5ba0...`, re-review Task 6 ghi `0 Critical / 0 Major / 0 Important / 0 Minor`; UI User Administration, Operations, access-notification, lint/build, semantic version parity, secret scan, agent rules, QA-depth, compile CAP và diff check tập trung được ghi tại đó. Documentation closure Task 7 này chạy mới OfficeCLI preflight, scan mirror/tương đương song ngữ/placeholder, HANA comparison isolated ở trên và documentation/diff check cuối. Nó không tuyên bố runtime hoặc release acceptance.

Boundary approval tiếp theo là một review độc lập có giới hạn trên exact source-plus-evidence head hoàn chỉnh. Finding Critical, Major hoặc Important chặn push và Draft PR duy nhất. Dù source review sạch cũng không cho phép các bước rollout trong plan riêng.
