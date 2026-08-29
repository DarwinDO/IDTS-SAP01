# N4 rollout prerequisite inspection — 2026-08-28

## English

### Outcome

N4 source PR #365 is merged. Runtime rollout is **HOLD before package upload**, because the current HANA/runtime lacks N1/N3 prerequisites. The existing runtime is healthy; it is not the N4 runtime. No N4 provider delivery, browser acceptance, schema migration, backfill or cleanup is claimed.

### Frozen state

- Reviewed source head: `6ed1e95235af71d21b8cc7e4f42f269670c6fc07`.
- Merge commit: `f79d4a7b9dbdac496db953be3b6cfce60c913b96`.
- Source base: `90fa1ffddced13c54b2daec852dbaadf90ddf7dc`.
- Deployment worktree: `E:/IDTS-SAP01-worktrees/deploy-n4-f79d4a7`, detached at the merge commit; tracked state clean.
- Existing CAP droplet fingerprint: `e2649a51-499`; unchanged after inspection. Latest CAP package remains dated 2026-08-26.
- Primary checkout remains on its existing `docs/wp7-n2-rollout-evidence-donhv` branch; it was not switched, reset or overwritten.

### Verification and operational actions

- OfficeCLI preflight: `1.0.145`. Markdown uses repo-native editing; OfficeCLI does not edit it.
- `qa:my-notifications:scheduled` (including digest) passed on the merge commit against isolated in-memory databases.
- A fresh direct installed CAP `build --production` exited 0; only the pre-existing attachment vocabulary warning remains. This creates local generated artifacts, not a database deployment.
- CF token expiry was recovered through user-assisted SAP SSO. The temporary clipboard value was cleared after CLI login. An earlier raw browser snapshot did expose the one-time code in tool output before it was consumed; no reusable credential was committed. Future SSO snapshots must exclude code text.
- Exactly one `btp:demo:prepare` started existing CAP/AppRouter apps, requested HANA start and restarted CAP once. Independent `btp:demo:check` then passed: CAP/AppRouter 1/1, health/ready 200, anonymous protected Auth 401, Web 200.
- SSH was disabled and left disabled. Local binding-backed HANA connection failed with `EHDBOPENCONN` before any query. Two bounded read-only CF tasks used the existing runtime network context instead; neither invoked source writers, outbox processors or providers.

### Confirmed missing prerequisites

| Required object | Live result | Meaning |
| --- | --- | --- |
| `IDTS_CAP_USERNOTIFICATIONINBOXENTRIES` | HANA 259 | Required inbox table is unavailable. |
| `IDTS_CAP_NOTIFICATIONDIGESTDELIVERIES` | HANA 259 | Required stored digest table is unavailable. |
| `IDTS_CAP_NOTIFICATIONS.SOURCEKEY` | HANA 260 | Source-key idempotency column is unavailable. |
| `BUGSERVICE_NOTIFICATIONS.SOURCEKEY` | HANA 260 | Expected: `srv/service.cds` deliberately excludes this internal idempotency key from the public projection; no view migration is required or allowed. |
| Current runtime inbox/digest CSN definitions | Both absent | Existing droplet predates the notification persistence model. |

The compiled HANA table artifacts confirm the expected physical names. Existing Notifications and NotificationDeliveries each remain readable at 54 rows; UserAccessNotificationDeliveries remains readable at one row. These aggregate checks do not prove complete data equivalence or every database constraint.

Missing event catalog codes: `RESOLVED`, `RETEST_REQUIRED`, `REOPENED`, `RESUBMITTED`, `REASSIGNED`, `RETEST_OWNER_CHANGED`, `COMMENT_MENTIONED`, `PRIORITY_ESCALATED`, `SEVERITY_ESCALATED`, `PENDING_ASSIGNMENT`, `ASSIGNMENT_REMOVED`, `OWNER_CHANGED`.

The approved inventory is therefore limited to seven deploy artifacts: the nullable internal `Notifications.sourceKey` table change and unique index, two new persistence tables and their four unique indexes. Generated `.hdiconfig`/`.hdinamespace` are configuration inputs only. The public BugService view, grants, CSV/tabledata, undeploy and broad generated-DB deployment are excluded.

Before any HDI make, task 35 completed a live logical backup/rehearsal: 54 existing Notifications plus six existing event types were copied through session-local restore tables, canonical hashes matched, and the resulting 60-row document was encrypted outside Git. A separate DPAPI-backed verifier confirmed the encrypted envelope and counts without printing row data. This is recoverable data custody; it does not imply that HANA DDL rollback is transactional.

Evidence markers: `N4_PREREQUISITE` from CF task 22, `n4-readonly-prereq-f79d4a7`; `N4_SCHEMA_DELTA` from task 23, `n4-readonly-schema-delta-f79d4a7`. Task 22 intentionally returned failure on missing tables; task 23 completed its diagnostic inspection. Only aggregate state, known catalog codes and source hashes were logged.

### Prepared CAP artifact — not deployed

- ZIP: `idts-n4-cap-f79d4a7.zip` in a local temporary rollout directory.
- SHA-256: `56DAA3DDC63BA712B5225A2470830222F20D69DE5DF66833443C7580C5CD287A`.
- 372,391 bytes; 108 entries.
- No DB/HDI artifacts, `node_modules`, `.env`, default-env or private CDS configuration in the ZIP.
- Checked scheduled/digest/worker/server JavaScript matches the exact source. Generated package retains Node `>=20 <23`.
- Packaging checks are not full artifact/release acceptance. No package upload, stage, set-droplet, N4 app restart or UI deployment occurred.

### Next decision and safety boundary

The approved rollout explicitly excluded schema changes. Proceed only after DonHV authorizes a narrowly scoped additive migration prerequisite (the N6-style migration boundary): inventory the exact missing tables/column/view/unique indexes and allowlisted catalog entries, preserve a recoverable before-state, rehearse and review the exact delta, then migrate and read back. Do not broadly deploy the generated DB directory, reload CSV seed data, reset/delete existing rows, or replay historical email.

Unique-index presence and full migration/rollback compatibility still need inspection; this record does not claim that creating only two tables is sufficient. N5 is not silently implemented or accepted by this rollout. Preserve the source/deployment/evidence worktrees and dependency junctions until rollout/rollback needs are resolved.

### Additive migration and rollout closure

- Native HDI simulation task 12 scheduled exactly seven deploy files, zero undeploy and zero warnings. It selected fast additive migration for `IDTS_CAP_NOTIFICATIONS`; the existing dependent BugService view was automatically simulated for redeploy without changing its source definition. A read-only task immediately afterward proved the physical schema was still unchanged.
- Native HDI make task 13 then reused the exact nine-file hash manifest and changed only `simulate_make` to false. Result: seven effective deploys, zero undeploy, zero warnings and one dependent view redeploy. Readback proved 54 legacy Notifications preserved with nullable source keys, inbox/digest tables present and empty. Encrypted before/after backups both had 60 rows and canonical digest prefix `51fc8083e0ca`.
- One transaction inserted exactly the 12 missing event codes after exact-conflict validation. Readback returned 18 exact allowlisted rows and digest prefix `3375b2e5954c`; the second execution returned `NOOP` with zero inserts.
- The first CAP package failed staging before droplet creation because Node buildpack 1.9.3 rejected generated engine `>=20 <23`. A corrected package used `22.x`. Its staged audit then exposed `fast-xml-parser` 5.9.3 High; the droplet was not assigned. One targeted lock-only update within existing ranges selected 5.11.1; the final production lock audit returned zero High/Critical and six known Moderate attachment-chain findings.
- Final CAP ZIP SHA-256: `4D3E32EBAB5BDBE777B3B3009CD7BF5DB9C47DC47A5336249EF47A710239A482`, 371,935 bytes/108 entries, Node `22.x`, `fast-xml-parser` 5.11.1. Final recovery droplet is `d6a4a5df-55a4-4bf3-bcb6-27e27ab22d66`.
- UI content-only MTAR attempt used the existing MTA ID and the deploy service interpreted omitted CAP/AppRouter modules as removals. It deleted both apps/routes while preserving services/data. Recovery immediately deployed an exact MTAR containing only CAP, AppRouter and the two UI archives, still excluding the DB deployer. Final topology: CAP/AppRouter STARTED 1/1, one route each, CAP seven bindings, AppRouter three bindings; `btp:demo:check` returned `DEMO READY`.
- Edge acceptance on a fresh release URL displayed `Open My Notifications (0 unread)`. Opening the popover showed the title, read/category filters, disabled mark-all action and empty-state message. No mark-read, scheduler discovery, historical replay, provider send, user/role or Bug mutation was performed.

N4 rollout is therefore live and healthy for the bounded empty-inbox/read-only acceptance. The content deployment incident and recovery remain part of the permanent evidence. Job Scheduler service binding is restored, but this acceptance does not claim a controlled weekday 08:00 provider delivery or HANA concurrency stress test; those are separate operational acceptance concerns, not reasons to hide the completed schema/CAP/UI rollout.

## Tiếng Việt

### Kết quả và trạng thái chính xác

PR source N4 #365 đã merge tại `f79d4a7b9dbdac496db953be3b6cfce60c913b96`; head source đã review là `6ed1e95235af71d21b8cc7e4f42f269670c6fc07`. Rollout **HOLD trước upload package** vì HANA/runtime hiện tại thiếu prerequisite N1/N3. Bản đang chạy khỏe nhưng chưa phải N4. Không claim live inbox/digest/email acceptance.

Worktree deploy tách biệt tại đúng merge commit, tracked state sạch. Primary checkout giữ nguyên nhánh evidence N2, không switch/reset/overwrite. Droplet CAP hiện tại vẫn có fingerprint `e2649a51-499`, package mới nhất vẫn từ 2026-08-26.

### Bằng chứng và phạm vi đã làm

- Test scheduled/digest trên merge commit PASS với DB in-memory riêng. Build CAP mới exit 0, chỉ còn warning attachment cũ; build local không phải deploy DB.
- SSO khôi phục token CF; clipboard đã xóa sau login. Snapshot browser trước đó vô tình hiện mã dùng một lần trong tool output trước khi mã được tiêu thụ; không commit credential tái sử dụng. Các lần sau phải loại mã khỏi snapshot.
- Một lần prepare start CAP/AppRouter, yêu cầu start HANA và restart CAP một lần. Check độc lập đạt CAP/AppRouter 1/1, health/ready 200, Auth anonymous 401, Web 200.
- SSH tắt và vẫn giữ tắt. Kết nối HANA từ local lỗi `EHDBOPENCONN` trước query. Hai CF task chỉ-đọc trong network của app xác nhận thiếu schema; không gọi writer/outbox/provider.
- HANA trả 259 với `UserNotificationInboxEntries` và `NotificationDigestDeliveries`; trả 260 với `Notifications.sourceKey`. Việc `BUGSERVICE_NOTIFICATIONS.SOURCEKEY` không tồn tại là đúng thiết kế vì `srv/service.cds` cố ý exclude khóa idempotency nội bộ khỏi projection công khai; không migrate view này. Model runtime cũng chưa có inbox/digest. Tên vật lý đã đối chiếu artifact HANA build.
- Notifications và NotificationDeliveries đều đọc được 54 dòng, UserAccessNotificationDeliveries đọc được một dòng. Đây là aggregate inspection, chưa chứng minh toàn bộ dữ liệu/constraint tương đương.
- Thiếu 12 event code đã liệt kê ở phần English. Index uniqueness và full migration delta vẫn phải kiểm tra, không kết luận chỉ cần tạo hai bảng là đủ.
- Inventory được duyệt chỉ có bảy artifact deploy: thêm cột nullable nội bộ `Notifications.sourceKey` và unique index, hai bảng mới cùng bốn unique index. `.hdiconfig`/`.hdinamespace` chỉ là cấu hình. Không deploy view BugService, grants, CSV/tabledata, undeploy hay toàn bộ thư mục DB sinh ra.
- Trước HDI make, task 35 đã backup/rehearsal live: 54 Notifications và sáu event type cũ đi qua bảng restore tạm theo session, hash canonical khớp; envelope 60 dòng được mã hóa ngoài Git và verifier DPAPI độc lập xác nhận mà không in dữ liệu dòng. Đây là custody phục hồi dữ liệu, không phải cam kết DDL HANA rollback theo transaction.

ZIP CAP đã chuẩn bị có SHA-256 `56DAA3DDC63BA712B5225A2470830222F20D69DE5DF66833443C7580C5CD287A`, 372,391 byte/108 entry, không chứa DB/HDI, dependency tree hoặc private config. Các file JS chính khớp source. Chưa upload/stage/set-droplet/deploy UI hay restart N4.

### Bước cần duyệt

Phải mở riêng prerequisite migration additive tối thiểu theo boundary N6: inventory bảng/cột/view/index và catalog code thiếu, giữ before-state có thể phục hồi, rehearsal/review delta rồi mới migrate/readback. Không broad DB deploy, reload seed CSV, reset/xóa dữ liệu hoặc gửi lại email cũ. Chưa thực hiện N5; giữ worktree/junction phục vụ rollout/rollback. OfficeCLI 1.0.145 chỉ preflight, Markdown dùng công cụ repo-native.

### Đóng migration additive và rollout

- HDI simulation task 12 và make task 13 đều dùng đúng bảy artifact deploy, không undeploy, không warning. Make thêm cột nullable/index, hai bảng mới/bốn index; dependent BugService view được HDI tự redeploy từ definition cũ, không thêm sourceKey công khai.
- 54 Notifications cũ giữ nguyên; hai bảng mới rỗng. Backup mã hóa trước/sau đều 60 dòng và cùng digest `51fc8083e0ca`. Đã insert đúng 12 code thiếu trong một transaction; lần chạy thứ hai `NOOP`, catalog đủ 18 dòng với digest `3375b2e5954c`.
- Package đầu fail trước droplet vì engine range không được buildpack chấp nhận. Package Node 22 tiếp theo chưa gắn vào app vì audit phát hiện High ở `fast-xml-parser` 5.9.3. Artifact cuối dùng lock-only 5.11.1 trong range hiện hữu, audit production 0 High/Critical; ZIP cuối SHA-256 `4D3E32EBAB5BDBE777B3B3009CD7BF5DB9C47DC47A5336249EF47A710239A482`.
- Deploy UI tối giản cùng MTA ID gây sự cố: deploy service xóa CAP/AppRouter bị omit. Services/HANA/data không mất. Recovery ngay bằng MTAR gồm CAP + AppRouter + hai UI, vẫn không có DB deployer. Cuối cùng CAP/AppRouter 1/1, mỗi app một route, bindings 7/3 và `DEMO READY`.
- Edge live đã hiện nút `Open My Notifications (0 unread)`; popover có filter trạng thái đọc/phân loại và empty state đúng. Không gọi scheduler discovery, replay lịch sử, gửi provider, mark-read, đổi user/role hay Bug.

N4 rollout hiện live/healthy trong boundary acceptance read-only/empty inbox. Incident và recovery được giữ nguyên trong evidence. Binding Job Scheduler đã phục hồi; email digest 08:00 có kiểm soát và concurrency HANA live là concern acceptance vận hành riêng, không được claim trong lần này.
