# Knowledge: `app/bug-management-ui/annotations/labels.cds`

## English

### What this file is for

Central place for labels and field control annotations on the Bugs entity (required fields, read-only fields, multi-line text, etc.).

### IDTS flow

Defines which fields are mandatory when creating a bug (title, description, stepsToReproduce, actualResult, expectedResult) and which are read-only in certain contexts (rejectionReason after reject).

Also marks long text fields for proper UI rendering.

### Important source anchors

- `@Common.FieldControl : #Mandatory` on key fields.
  **IDTS concept**: Enforces minimum information needed for a usable bug report (reproduction steps and expected vs actual are critical).

- `@UI.MultiLineText` on description, steps, results, rejectionReason.
  **IDTS concept**: Ensures these important long-text fields render as text areas instead of single-line inputs.

### Cross-folder

Works with Object Page and create form annotations. Backend validations in bug-write.js also protect some of these rules.

## Vietnamese

### File này dùng để làm gì

Nơi tập trung annotation nhãn và field control cho Bugs (trường bắt buộc, chỉ đọc, text nhiều dòng...).

### Flow IDTS

Xác định trường nào bắt buộc khi tạo bug và trường nào chỉ đọc ở một số ngữ cảnh. Đánh dấu trường text dài để render đúng.

### Các điểm neo quan trọng

- FieldControl #Mandatory trên các trường quan trọng.
- @UI.MultiLineText trên description, steps, results, rejectionReason.

### Liên kết

Phối hợp với Object Page và form create. Backend cũng bảo vệ một số rule.

## Metadata

- Source file: `app/bug-management-ui/annotations/labels.cds`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/annotations/labels.cds.md`
- Source layer: `app`
- Last reviewed: 2026-06-22