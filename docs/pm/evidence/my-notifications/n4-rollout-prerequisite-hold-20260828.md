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
| `BUGSERVICE_NOTIFICATIONS.SOURCEKEY` | HANA 260 | Corresponding service-view column is unavailable. |
| Current runtime inbox/digest CSN definitions | Both absent | Existing droplet predates the notification persistence model. |

The compiled HANA table artifacts confirm the expected physical names. Existing Notifications and NotificationDeliveries each remain readable at 54 rows; UserAccessNotificationDeliveries remains readable at one row. These aggregate checks do not prove complete data equivalence or every database constraint.

Missing event catalog codes: `RESOLVED`, `RETEST_REQUIRED`, `REOPENED`, `RESUBMITTED`, `REASSIGNED`, `RETEST_OWNER_CHANGED`, `COMMENT_MENTIONED`, `PRIORITY_ESCALATED`, `SEVERITY_ESCALATED`, `PENDING_ASSIGNMENT`, `ASSIGNMENT_REMOVED`, `OWNER_CHANGED`.

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

## Tiếng Việt

### Kết quả và trạng thái chính xác

PR source N4 #365 đã merge tại `f79d4a7b9dbdac496db953be3b6cfce60c913b96`; head source đã review là `6ed1e95235af71d21b8cc7e4f42f269670c6fc07`. Rollout **HOLD trước upload package** vì HANA/runtime hiện tại thiếu prerequisite N1/N3. Bản đang chạy khỏe nhưng chưa phải N4. Không claim live inbox/digest/email acceptance.

Worktree deploy tách biệt tại đúng merge commit, tracked state sạch. Primary checkout giữ nguyên nhánh evidence N2, không switch/reset/overwrite. Droplet CAP hiện tại vẫn có fingerprint `e2649a51-499`, package mới nhất vẫn từ 2026-08-26.

### Bằng chứng và phạm vi đã làm

- Test scheduled/digest trên merge commit PASS với DB in-memory riêng. Build CAP mới exit 0, chỉ còn warning attachment cũ; build local không phải deploy DB.
- SSO khôi phục token CF; clipboard đã xóa sau login. Snapshot browser trước đó vô tình hiện mã dùng một lần trong tool output trước khi mã được tiêu thụ; không commit credential tái sử dụng. Các lần sau phải loại mã khỏi snapshot.
- Một lần prepare start CAP/AppRouter, yêu cầu start HANA và restart CAP một lần. Check độc lập đạt CAP/AppRouter 1/1, health/ready 200, Auth anonymous 401, Web 200.
- SSH tắt và vẫn giữ tắt. Kết nối HANA từ local lỗi `EHDBOPENCONN` trước query. Hai CF task chỉ-đọc trong network của app xác nhận thiếu schema; không gọi writer/outbox/provider.
- HANA trả 259 với `UserNotificationInboxEntries` và `NotificationDigestDeliveries`; trả 260 với `Notifications.sourceKey` và cột tương ứng trong service view. Model runtime cũng chưa có inbox/digest. Tên vật lý đã đối chiếu artifact HANA build.
- Notifications và NotificationDeliveries đều đọc được 54 dòng, UserAccessNotificationDeliveries đọc được một dòng. Đây là aggregate inspection, chưa chứng minh toàn bộ dữ liệu/constraint tương đương.
- Thiếu 12 event code đã liệt kê ở phần English. Index uniqueness và full migration delta vẫn phải kiểm tra, không kết luận chỉ cần tạo hai bảng là đủ.

ZIP CAP đã chuẩn bị có SHA-256 `56DAA3DDC63BA712B5225A2470830222F20D69DE5DF66833443C7580C5CD287A`, 372,391 byte/108 entry, không chứa DB/HDI, dependency tree hoặc private config. Các file JS chính khớp source. Chưa upload/stage/set-droplet/deploy UI hay restart N4.

### Bước cần duyệt

Phải mở riêng prerequisite migration additive tối thiểu theo boundary N6: inventory bảng/cột/view/index và catalog code thiếu, giữ before-state có thể phục hồi, rehearsal/review delta rồi mới migrate/readback. Không broad DB deploy, reload seed CSV, reset/xóa dữ liệu hoặc gửi lại email cũ. Chưa thực hiện N5; giữ worktree/junction phục vụ rollout/rollback. OfficeCLI 1.0.145 chỉ preflight, Markdown dùng công cụ repo-native.
