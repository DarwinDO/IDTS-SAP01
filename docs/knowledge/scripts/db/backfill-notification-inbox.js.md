# Knowledge: `scripts/db/backfill-notification-inbox.js`

## English

This controlled helper indexes eligible Bug notifications from at most the previous 30 days. It excludes notifications that already have an email delivery and sources already indexed, creates no access entry, email delivery or domain event, and prints counts rather than recipient data. Running without arguments is dry-run only and ends with `No database was changed`. The `--execute` path exists for a later separately approved migration gate and inserts the missing rows in one transaction.

### Important source anchors

- **Location**: `buildBugInboxBackfillPlan`. **Concept**: bounded, idempotent Bug-only candidate plan. **Impact if broken**: old or emailed events can be reintroduced or duplicate inbox rows created. **Check together**: schema unique constraints and backfill QA.
- **Location**: `runBackfill`. **Concept**: dry-run is the default and logs safe aggregate counts only. **Impact if broken**: a review command could mutate data or reveal recipients. **Check together**: CLI argument guard and controlled rollout plan N6.
- **Location**: `assertExactlyOneSource`. **Concept**: portable XOR guard. **Impact if broken**: one inbox row can have no authority or two conflicting authorities. **Check together**: `UserNotificationInboxEntries` and service hydration.

## Tiếng Việt

Helper có kiểm soát này index Bug notification đủ điều kiện trong tối đa 30 ngày gần nhất. Nó loại notification đã có email delivery và source đã index, không tạo access entry, email delivery hoặc domain event, đồng thời chỉ in count chứ không in dữ liệu người nhận. Chạy không có argument chỉ dry-run và kết thúc bằng `No database was changed`. Nhánh `--execute` dành cho migration gate sau được duyệt riêng và insert row thiếu trong một transaction.

### Các điểm neo quan trọng

- **Vị trí**: `buildBugInboxBackfillPlan`. **Khái niệm**: plan candidate Bug-only bounded và idempotent. **Ảnh hưởng nếu sai**: event cũ/đã email có thể bị đưa lại hoặc inbox row bị trùng. **Kiểm tra cùng**: unique constraint schema và QA backfill.
- **Vị trí**: `runBackfill`. **Khái niệm**: dry-run là mặc định và chỉ log aggregate count an toàn. **Ảnh hưởng nếu sai**: command review có thể mutate dữ liệu hoặc lộ người nhận. **Kiểm tra cùng**: guard argument CLI và rollout plan N6.
- **Vị trí**: `assertExactlyOneSource`. **Khái niệm**: guard XOR portable. **Ảnh hưởng nếu sai**: inbox row có thể không có authority hoặc có hai authority xung đột. **Kiểm tra cùng**: `UserNotificationInboxEntries` và hydration service.

## Safe editing / Sửa an toàn

Never broaden the 30-day maximum, backfill access history, insert deliveries, or print recipient/source content. Do not run `--execute` outside the separately approved migration gate. / Không mở rộng quá 30 ngày, backfill lịch sử access, insert delivery hoặc in nội dung recipient/source. Không chạy `--execute` ngoài migration gate được duyệt riêng.
