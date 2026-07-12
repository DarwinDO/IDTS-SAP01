# Knowledge: `srv/bug-service/drafts.js`

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: SangVN. Flow: draft NEW/PATCH/SAVE. Compare draft data and active data at `handleDraftSave` when a user sees correct fields before Save but wrong persisted data afterwards.

### Vietnamese

Primary owner: DonHV. Backup: SangVN. Flow: draft NEW/PATCH/SAVE. So sánh draft data và active data tại `handleDraftSave` khi user thấy field đúng trước Save nhưng persist sai sau đó.

## English

### What this file is for

Handles draft-specific preparation and the SAVE event for Bug drafts.

### IDTS flow

Before PATCH on Bugs.drafts, `prepareDraftPatch` runs. On SAVE of the draft, `handleDraftSave` performs final preparation (similar to prepareBugWrite) and lets the draft activation proceed.

This is how the "create with attachments + assignee in one go" flow works cleanly.

### Important source anchors

- `prepareDraftPatch`, `handleDraftSave`.
  **IDTS concept**: Ensures draft editing also goes through the same business rules (componentCategory derivation, initial status decision when assignee is chosen) before the draft is activated into a real Bug.
  **Impact if broken**: Drafts can activate with bad data (missing componentCategory, wrong initial status).
  **Must check together**: `bug-write.js`, `srv/service.js` (before PATCH on drafts + on SAVE), `db/schema.cds`, Fiori create flow.

### Cross-folder dependency map

Called from `srv/service.js`. Shares logic with the non-draft write path.

### Safe editing checklist

Keep the draft and active write paths in sync. Test the full create + draft + activate path (including attachments) in the browser.

## Vietnamese

### File này dùng để làm gì

Xử lý chuẩn bị draft và sự kiện SAVE cho Bug draft.

### Flow hoạt động trong IDTS

Trước PATCH draft và khi SAVE draft, đảm bảo áp dụng cùng quy tắc nghiệp vụ trước khi activate thành Bug thật.

### Các điểm neo quan trọng

prepareDraftPatch, handleDraftSave.

### Liên kết

Gọi từ service.js. Chia sẻ logic với bug-write.

### Checklist

Giữ draft path và active path đồng bộ. Test create + draft + activate + attachment trên browser.

## Metadata

- Source file: `srv/bug-service/drafts.js`
- Knowledge mirror: `docs/knowledge/srv/bug-service/drafts.js.md`
- Source layer: `srv`
- Last reviewed: 2026-06-22

## 2026-07-01 update: validate while editing and before activation

### English

A Fiori draft is a temporary database copy while the user edits a form. `prepareDraftPatch()` now checks catalog values after combining the saved draft with the latest partial PATCH. Before `SAVE`, `validateDraftForSave()` reads the complete draft, checks required fields, and checks active catalog rows before activation.

- **Location**: `prepareDraftPatch()` and `validateDraftForSave()`
  **IDTS concept**: Validate once during editing for early feedback and again before a temporary draft becomes the official Bug.
  **Impact if broken**: Partial or interrupted draft flows can carry invalid classification data into activation.
  **Must check together**: `bug-write.js`, `service.js` PATCH/SAVE registration, `db/schema.cds`, and Object Page draft tests.

The two checks are deliberate: PATCH usually contains only one changed field, while SAVE is the final integrity gate over the complete draft.

## 2026-07-02 update: IDTS-49 draft reporter initialization

### English

IDTS uses Fiori draft mode for creating a Bug. A draft is a temporary Bug record that exists before the user presses Create/Save. Before IDTS-49, the normal active `CREATE` path could derive `reporter_ID`, but draft activation validated the draft first. That meant a PM-created draft could fail with `Reporter is required` before the active create handler had a chance to set the reporter.

This file now handles that earlier draft step:

- `prepareDraftNew(req, actor)` runs when CAP starts a new root draft. It sets `reporter_ID` from the already-authenticated IDTS actor.
- `ensureDraftReporterForSave(req, entities, draft, actor)` runs before draft activation validation. If an old or incomplete draft has no reporter, it fills the reporter from the authenticated actor before required-field validation.
- Client-supplied `reporter_ID` is not trusted for a new draft. The backend overwrites it with the authenticated user.

Important source anchors:

- **Location**: `prepareDraftNew(req, actor)`
  **IDTS concept**: Reporter is system-managed. The person logged in as Tester or PM becomes the Bug reporter automatically.
  **Impact if broken**: Fiori can create a draft that later fails activation with `Reporter is required`, blocking shared-QA email routing to the reporter.
  **Must check together**: `srv/service.js` `before('NEW', Bugs.drafts, ...)`, `permissions.js` create permission, login user mapping, and draft-create regression tests.

- **Location**: `ensureDraftReporterForSave(req, entities, draft, actor)`
  **IDTS concept**: Draft activation is the last backend gate before a temporary draft becomes a real Bug.
  **Impact if broken**: Older incomplete drafts or direct OData draft flows can still fail activation even though the user is authenticated.
  **Must check together**: `validateDraftForSave()`, `bug-write.js` required fields, CAP draft `SAVE`, and shared Render smoke for PM-created bugs.

### Vietnamese

IDTS dung che do Fiori draft khi tao Bug. Draft la ban ghi Bug tam thoi ton tai truoc khi user bam Create/Save. Truoc IDTS-49, duong active `CREATE` co the tu suy ra `reporter_ID`, nhung draft activation lai validate draft truoc. Vi vay draft do PM tao co the fail `Reporter is required` truoc khi active create handler kip set reporter.

File nay hien xu ly som o buoc draft:

- `prepareDraftNew(req, actor)` chay khi CAP bat dau mot root draft moi. Ham nay set `reporter_ID` tu IDTS actor da authenticated.
- `ensureDraftReporterForSave(req, entities, draft, actor)` chay truoc validation khi activate draft. Neu draft cu hoac draft thieu reporter, ham nay dien reporter tu authenticated actor truoc khi kiem tra required field.
- `reporter_ID` do client gui len khong duoc tin cho draft moi. Backend se ghi de bang user dang dang nhap.

Important source anchors:

- **Vi tri**: `prepareDraftNew(req, actor)`
  **Khai niem IDTS**: Reporter la field do he thong quan ly. Nguoi dang nhap voi vai tro Tester hoac PM tu dong tro thanh reporter cua Bug.
  **Anh huong neu sai**: Fiori co the tao draft nhung khi activate se fail `Reporter is required`, lam chan luong shared-QA email routing ve reporter.
  **Phai kiem tra cung**: `before('NEW', Bugs.drafts, ...)` trong `srv/service.js`, create permission trong `permissions.js`, mapping login user, va regression test draft-create.

- **Vi tri**: `ensureDraftReporterForSave(req, entities, draft, actor)`
  **Khai niem IDTS**: Draft activation la cong backend cuoi truoc khi ban tam tro thanh Bug that.
  **Anh huong neu sai**: Draft cu bi thieu reporter hoac direct OData draft flow van co the fail activation du user da authenticated.
  **Phai kiem tra cung**: `validateDraftForSave()`, required fields trong `bug-write.js`, CAP draft `SAVE`, va shared Render smoke cho Bug do PM tao.

### Vietnamese

Fiori draft là bản dữ liệu tạm trong database khi user đang sửa form. `prepareDraftPatch()` hiện kiểm tra catalog sau khi ghép draft đang lưu với phần PATCH mới nhất. Trước `SAVE`, `validateDraftForSave()` đọc lại toàn bộ draft, kiểm tra required fields và các dòng catalog active rồi mới cho activate.

- **Vị trí**: `prepareDraftPatch()` và `validateDraftForSave()`
  **Khái niệm IDTS**: Kiểm tra lúc edit để báo sớm và kiểm tra lần cuối trước khi bản tạm trở thành Bug chính thức.
  **Ảnh hưởng nếu sai**: Luồng draft gửi từng phần hoặc bị gián đoạn có thể mang dữ liệu phân loại sai vào activation.
  **Phải kiểm tra cùng**: `bug-write.js`, đăng ký PATCH/SAVE trong `service.js`, `db/schema.cds` và draft test trên Object Page.

Hai lần kiểm tra là có chủ ý: PATCH thường chỉ chứa một field vừa đổi, còn SAVE là cổng toàn vẹn cuối trên toàn bộ draft.
