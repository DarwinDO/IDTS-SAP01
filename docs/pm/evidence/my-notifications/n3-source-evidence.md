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

Task 7 is running; Tasks 8–9, integrated matrix, independent review and Draft PR are pending. Detailed task reports are temporary coordination artifacts; verified results will be copied here before final handoff.

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

Task 7 đang làm; Tasks 8–9, matrix tích hợp, review và Draft PR còn chờ. Kết quả đã verify sẽ được ghi vào evidence này trước handoff cuối.
