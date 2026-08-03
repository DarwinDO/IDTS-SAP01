# IDTS-107 — Technical Specification database and persistence package

- Owner: DonHV
- Due: 2026-07-30
- Status: Gate 1 remediation in progress; IDTS-105 DonHV acknowledgment resolved; Gate 2 owner approval pending
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
  `a24f00db67340746fd6b96276f4c5a10f36190b0` without changing the official
  workbook, Drive, runtime source, database, or seed data.
- Candidate text and source trace:
  `docs/pm/evidence/idts-107/technical-spec/database-persistence-candidate.en.md`.
  Fresh `cds build --production` output confirms the complete 48-table/578-column
  `database-dictionary.en.csv` exactly: 578 matched rows, zero missing and zero
  extra. The earlier `cds compile db --to hana` result covered only 35 direct
  model tables/326 columns and was rejected as incomplete production evidence.
- The current workbook has two `#REF!` named-range defects and 23 overflow
  warnings outside the candidate cells. IDTS-112 must repair or formally
  disposition them before final template acceptance.
- CAP compilation now passes with `npx cds compile srv --to edmx -s all`; the
  earlier dependency blocker is resolved without source or lockfile changes.
- DonHV's personal IDTS-105 acknowledgment is resolved at SHA
  `3e78b495cb8feb56188cc446b827d47e040e1b98` with Jira comment `10866`.
- Sanitized live HANA readback is complete: read-only CF task 23 matched the
  production build at 48 tables/578 columns without DB deploy, seed or migration.
  Gate 2 now requires DonHV owner review and approval before IDTS-112 integration.
  The calculated-helper persistence finding is isolated in
  [IDTS-118](https://dutassociation.atlassian.net/browse/IDTS-118); this
  documentation PR records current truth and does not modify runtime CDS.

### Vietnamese

- Đã refresh candidate EN Gate 1 theo `origin/dev`
  `a24f00db67340746fd6b96276f4c5a10f36190b0`; không thay workbook chính thức,
  Drive, runtime source, database hoặc seed data.
- `cds build --production` xác nhận đầy đủ 48 bảng/578 cột trong
  `database-dictionary.en.csv`. Kết quả 35/326 trước đây chỉ là model database
  hẹp và không đủ để đại diện production build.
- DonHV đã tự xác nhận đọc IDTS-105 tại SHA
  `3e78b495cb8feb56188cc446b827d47e040e1b98`; Jira comment `10866` khớp với
  acknowledgment trong repo.
- Workbook hiện tại có hai lỗi named range `#REF!` và 23 cảnh báo overflow ở
  ngoài các cell candidate. IDTS-112 phải sửa hoặc ghi nhận chính thức trước
  khi chấp nhận template cuối cùng.
- Gate 2 vẫn cần readback HANA đã sanitize, Database Explorer evidence và DonHV
  duyệt package. Hai helper entity đang sinh bảng vật lý là runtime finding riêng,
  không được sửa CDS trong PR tài liệu này.
