# N3 Notification Event Coverage — Source Evidence

## English

Status: IN PROGRESS. This is not a runtime, delivery, acceptance or release PASS.

- Owner: DonHV; existing Knowledge Gate evidence reuse was explicitly confirmed by the owner. No new assessment or signature is fabricated.
- Branch: `feature/wp7-notifications-event-coverage-donhv`.
- Frozen base: `c722c355df5ff786d372002e20ab10864b4780ab` (merged N2 #362).
- Scope: approved plan Tasks 7–9, lifecycle recipient/channel matrix, selected internal comment mentions, upward priority/severity escalation and final access-audit inbox indexing.
- Stop: one Draft PR after tests/mirrors/independent review; no Ready/merge/deploy/migration/backfill/live email/provider/user/role/data/N4/cleanup.
- Runtime remains separate: rolled-back UI stays in place; no claim that N3 has appeared in the live browser.

### Baseline and tooling

- Locked root and Bug UI dependencies reused through two local junctions. Root lock SHA256 `688A9CDCDB41E32E3C012AF9033EC8BFF079E0DF5FB2B3B29CD074D588F6E455`; Bug UI lock SHA256 `4E6BCF7F8B4EFF912255145AD43C4E25F0F41F56C6C25A25F91C6C9D4E7B0A5C`. No install or upgrade.
- Baseline email outbox, immediate kick, access notifications, inbox service and Bug UI lint/build passed before N3 implementation.
- History fixture initially failed on obsolete display-name actors, then correctly failed on missing linked identity. Commit `731cbb8a` updates only local actors/SQLite identity fixtures; all seven history scenarios passed.
- Comment persistence fixture had the same obsolete actor issue. Commit `cd10f2f6` changes only the seeded email actor; comment create/reconnect persistence PASS. Attachment HTTP upload is not covered by that script.
- `qa:idts116:programmatic` baseline PASS.
- OfficeCLI 1.0.145 preflight PASS; Markdown needs native repository editing.
- CAP/UI5/Fiori MCP callable tools were not found in this session. Use existing local compile/lint/build and official SAP references; do not claim MCP verification.
- UI API preflight: direct versioned UI5 source URLs were rejected by the web tool. Official SAP OpenUI5 source confirms `MultiComboBox` does not support the inherited `loadItems` event; do not rely on it for the mention picker. [SAP source](https://raw.githubusercontent.com/SAP/openui5/master/src/sap.m/src/sap/m/ComboBoxBase.js).

### Implementation and final gate

Task 7 is complete at reviewed source head `c46426b914943d5c3dae56e18e2808171629b143`. It adds stable lifecycle codes and exact recipient/channel policy, source/history-derived idempotency keys, authoritative Bug locking before source-key reuse, inbox-only assignment removal, prompt action-owner handoffs, safe server/UI hydration and localized labels. Real SQLite QA covers persisted owner-only, assignment removal, resubmit and retest-owner routes plus independently started producer transactions. The test records its limitation honestly: SQLite serializes the overlap and cannot emulate a HANA lock wait; the production contract uses portable CAP `forUpdate()` plus the unique source key.

Task 7 review started NO-GO with 4 Important findings. Three fix rounds closed source-key concurrency handling, missed producer routes, the `PENDING_ASSIGNMENT`/removal semantic collision and incomplete/stale mirrors. Final scoped review returned clean, with no remaining Critical/Major/Important finding. Focused event/history/outbox/immediate/UI client-shell/lint/build commands passed as recorded in the untracked task report. Tasks 8–9, integrated matrix, final independent whole-branch review and Draft PR remain pending.

Task 8 is complete at `d6f5f14c618db86cbf975746d29885f222ced946`. The Bug-bound picker returns only safe active identity-ready internal candidates; the client submits selected UUIDs separately and does not interpret typed `@name`. CAP revalidates recipients before INSERT and writes comment, history, `COMMENT_MENTIONED`, inbox and email outbox atomically with `MENTION:<commentID>:<recipientID>`. Runtime QA covers stale Bug-context responses/selection reset; SQLite fault injection proves post-write rollback of all five persistence layers. Initial review found 3 Important and 1 Minor; one fix round closed all Important findings. Deferred Minor: UUID case variants are not normalized before dedupe and must be dispositioned by final whole-branch review. Task 9, integrated matrix, final review and Draft PR remain pending.

Task 9 is complete at `459782b660df938e99da5f3c3913d573166d03e8`. Upward priority/severity changes use stable code ranks; assignee/current owner are deduplicated, and material Critical/Blocker events add only identity-ready PM recipients whose ACTIVE onboarding role matches their internal role. Lower upward changes are inbox-only; material escalation creates prompt email through the existing succeeded-only worker. Simultaneous priority/severity escalation keeps two explicit source events using the approved opaque key `STATUS:<historyID>:<recipientID>:<eventCode>` so the unique source constraint cannot suppress one. Access indexing locks/validates the exact persisted final audit and creates inbox rows only for CHANGE_ROLE/APPLIED and REACTIVATE/APPLIED in the same transaction as the existing delivery; suspend/revoke remain email-only, while invitation/responsibility/queued/noop/failure paths remain unchanged. Initial review found 1 Major and 1 Important; the Major stale-role PM path was fixed and re-reviewed clean, and the source-key format was accepted by the coordinator ruling recorded in the SDD ledger.

Fresh integrated N3 source matrix at `459782b660df938e99da5f3c3913d573166d03e8`: lifecycle/events, seven history scenarios, IDTS-116 runtime mention race, comment persistence, access notifications, immutable identity, immediate/outbox, caller-only inbox service, inbox UI, secret scan, agent rules 8/8 and QA-depth 15/15 all PASS. CAP EDMX and HANA compile exit 0; EDMX retains only the pre-existing attachment `NonUpdateableProperties` vocabulary warning. Bug UI lint/build PASS. `git diff --check` and protected schema/lockfile/deployment guards PASS. A bounded final whole-branch source/security review remains before one Draft PR. Native Codex Security diff-scan skill/tool is unavailable in this session; do not claim that scan.

## Tiếng Việt

Trạng thái: ĐANG LÀM. Không phải PASS runtime, giao email, nghiệm thu hoặc release.

- Owner DonHV đã xác nhận dùng lại Knowledge Gate evidence; không tạo bài đánh giá/chữ ký mới.
- Branch `feature/wp7-notifications-event-coverage-donhv`; base freeze `c722c355df5ff786d372002e20ab10864b4780ab` (N2 #362 đã merge).
- Phạm vi Tasks 7–9: ma trận người nhận/kênh lifecycle, mention chọn user nội bộ, escalation tăng priority/severity và inbox index từ access audit cuối.
- Dừng ở một Draft PR sau test/mirror/review; không Ready/merge/deploy/migration/backfill/email thật/provider/user/role/data/N4/cleanup.
- UI live vẫn ở bản rollback, chưa có claim N3 đã hiện trên browser thật.

### Baseline và tooling

- Tái sử dụng dependency đúng lock qua hai junction root/Bug UI với SHA256 nêu trên; không install/upgrade.
- Baseline outbox/immediate/access notification/inbox service và Bug UI lint/build PASS trước implementation.
- History fixture cũ fail vì display-name actor, rồi guard đúng chặn identity chưa liên kết. Commit `731cbb8a` chỉ sửa actor/fixture SQLite; cả bảy scenario PASS.
- Comment persistence gặp cùng lỗi actor. Commit `cd10f2f6` chỉ dùng email seed đúng; tạo comment và reconnect persistence PASS. Script này không kiểm HTTP upload attachment.
- Baseline `qa:idts116:programmatic` PASS. OfficeCLI 1.0.145 PASS; Markdown chỉnh native.
- Session không có CAP/UI5/Fiori MCP callable; dùng compile/lint/build local và nguồn SAP chính thức, không ghi MCP PASS.
- Web tool từ chối URL source UI5 có version. Source SAP OpenUI5 chính thức xác nhận không dùng event `loadItems` kế thừa cho `MultiComboBox`; picker mention phải dùng lifecycle được hỗ trợ.

### Implementation và gate cuối

Task 7 đã hoàn tất tại source head đã review `c46426b914943d5c3dae56e18e2808171629b143`. Phần này thêm mã lifecycle ổn định, đúng người nhận/kênh, source key từ history, lock Bug trước dedupe, removal chỉ inbox, handoff owner gửi prompt, hydrate/nhãn dịch an toàn. QA SQLite thật kiểm owner-only, bỏ assignee, resubmit, đổi retest owner và hai producer khởi động độc lập. Giới hạn được ghi rõ: SQLite serialize overlap nên không mô phỏng chờ lock HANA; contract production dùng CAP `forUpdate()` portable cùng unique source key.

Review Task 7 ban đầu NO-GO với 4 Important. Ba vòng fix đã đóng concurrency source key, route producer thiếu, trùng nghĩa `PENDING_ASSIGNMENT`/removal và mirror thiếu/cũ. Re-review cuối sạch, không còn Critical/Major/Important. Các lệnh event/history/outbox/immediate/UI client-shell/lint/build tập trung PASS trong report local không track. Tasks 8–9, matrix tích hợp, review toàn branch cuối và Draft PR còn chờ.

Task 8 hoàn tất tại `d6f5f14c618db86cbf975746d29885f222ced946`. Picker bound theo Bug chỉ trả candidate nội bộ active và identity-ready dạng an toàn; UI gửi UUID được chọn riêng, không suy diễn từ chữ `@name`. CAP kiểm lại recipient trước INSERT và ghi comment, history, `COMMENT_MENTIONED`, inbox, email outbox trong cùng transaction với key `MENTION:<commentID>:<recipientID>`. QA runtime kiểm response context cũ/reset selection; fault injection SQLite chứng minh rollback sau khi đã ghi đủ năm lớp dữ liệu. Review đầu có 3 Important và 1 Minor; một vòng fix đóng hết Important. Minor còn defer: UUID hoa/thường chưa normalize trước dedupe, final review toàn branch phải quyết định. Task 9, matrix tích hợp, review cuối và Draft PR còn chờ.

Task 9 hoàn tất tại `459782b660df938e99da5f3c3913d573166d03e8`. Escalation tăng mức dùng rank code ổn định; dedupe assignee/current owner và chỉ thêm PM identity-ready có role onboarding ACTIVE khớp role nội bộ cho Critical/Blocker. Mức tăng thấp chỉ inbox; mức material gửi prompt qua worker succeeded-only hiện có. Khi priority/severity cùng tăng, giữ hai event riêng bằng key opaque `STATUS:<historyID>:<recipientID>:<eventCode>` đã được coordinator ruling để unique source không làm mất một event. Access index lock/kiểm audit final persist và chỉ thêm inbox cho CHANGE_ROLE/APPLIED, REACTIVATE/APPLIED trong cùng transaction với delivery; suspend/revoke chỉ email, invitation/responsibility/queued/noop/failure không đổi. Review đầu có 1 Major, 1 Important; đã fix đường PM role cũ và re-review sạch, source-key được ruling chấp nhận trong ledger.

Full matrix source N3 mới tại SHA trên: lifecycle/events, bảy scenario history, runtime mention race IDTS-116, comment persistence, access notification, immutable identity, immediate/outbox, caller-only inbox, inbox UI, secret scan, agent rules 8/8, QA-depth 15/15 đều PASS. CAP EDMX/HANA exit 0; chỉ còn warning attachment `NonUpdateableProperties` có sẵn. Bug UI lint/build PASS. `git diff --check` và guard schema/lockfile/deployment PASS. Còn final review source/security toàn branch có giới hạn trước một Draft PR. Skill/tool Codex Security diff-scan không có trong session nên không ghi scan PASS.
