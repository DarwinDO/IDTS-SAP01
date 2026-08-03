# IDTS-107 — Technical Specification database and persistence package

- Owner: DonHV
- Due: 2026-07-30
- Status: Gate 1 candidate verified; blocked by IDTS-105 human acknowledgment and Gate 2 owner approval
- Jira: https://dutassociation.atlassian.net/browse/IDTS-107

## Gate sequence

1. Agent prepares candidate rows, diagrams, source traces and evidence-gap register.
2. DonHV reviews accuracy/template/evidence and records Jira + repo approval.
3. Approved package is handed to IDTS-112 integration.

## Scope

Architecture/data design, full entity/physical-table/column dictionary, draft/active,
transactions, PostgreSQL, S3, AuthSessions, history, notification deliveries/outbox,
email and related Technical Implementation.

## 2026-08-03 candidate refresh

### English

- Refreshed the Gate 1 EN candidate against `origin/dev`
  `32111c0c7689f8040fce49205445432cc7d1892e` without changing the official
  workbook, Drive, runtime source, database, or seed data.
- Candidate text and source trace:
  `docs/pm/evidence/idts-107/technical-spec/database-persistence-candidate.en.md`.
  Fresh `cds compile db --to hana` output confirms the 35-table/326-column
  `database-dictionary.en.csv` exactly: 326 matched rows, zero missing and zero
  extra. This is generated-model verification, not a live HDI deployment claim.
- The current workbook has two `#REF!` named-range defects and 23 overflow
  warnings outside the candidate cells. IDTS-112 must repair or formally
  disposition them before final template acceptance.
- CAP compilation now passes with `npx cds compile srv --to edmx -s all`; the
  earlier dependency blocker is resolved without source or lockfile changes.
- Remaining blockers: DonHV's personal IDTS-105 acknowledgment/Jira comment
  and owner approval before IDTS-112 integration. A sanitized live HANA readback
  may support final acceptance but is not required to validate the logical
  dictionary generated from the current CDS model.

### Vietnamese

- Đã refresh candidate EN Gate 1 theo `origin/dev`
  `32111c0c7689f8040fce49205445432cc7d1892e`; không thay workbook chính thức,
  Drive, runtime source, database hoặc seed data.
- Text candidate và source trace ở
  `docs/pm/evidence/idts-107/technical-spec/database-persistence-candidate.en.md`.
  Kết quả mới từ `cds compile db --to hana` xác nhận chính xác 35 bảng/326 cột
  trong `database-dictionary.en.csv`: khớp 326 dòng, thiếu 0 và dư 0. Đây là
  bằng chứng generate từ model, không phải tuyên bố đã deploy HDI live.
- Workbook hiện tại có hai lỗi named range `#REF!` và 23 cảnh báo overflow ở
  ngoài các cell candidate. IDTS-112 phải sửa hoặc ghi nhận chính thức trước
  khi chấp nhận template cuối cùng.
- CAP compile đã PASS với `npx cds compile srv --to edmx -s all`; blocker
  dependency trước đó đã được xử lý mà không đổi source hoặc lockfile.
- Blocker còn lại: DonHV phải tự xác nhận IDTS-105/comment Jira và duyệt Gate 2
  trước khi tích hợp IDTS-112. Readback HANA đã sanitize là evidence hỗ trợ cho
  acceptance cuối, không phải điều kiện để xác nhận dictionary logic.
