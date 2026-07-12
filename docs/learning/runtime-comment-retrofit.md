# Runtime Comment Retrofit Inventory

## English

This inventory freezes the scope at 72 non-generated runtime files. Each primary owner must add concise Vietnamese explanations only where a beginner would otherwise miss the purpose, trigger, side effect, rule, dependency, or debugger anchor. Do not add line-by-line narration. For every changed file, update its matching bilingual knowledge mirror with owner, backup, flow, breakpoint, linked files, and safe-edit impact.

### IDTS-83 — DonHV

- `db/schema.cds`
- every `srv/**/*.js`, `srv/service.cds`, and `srv/auth.cds`

### IDTS-84 — DatDT

- `app/services.cds`, `app/bug-management-ui/annotations.cds`
- `annotations/labels.cds`, `list-report.cds`, `pm-monitoring.cds`
- shell/login/dashboard files, both CSS files, `ext/ai/AiReviewUi.js`, `ext/login/*`
- `ClassificationReview.js`, `DuplicateReview.js`, `HandoffSummaryReview.js`
- `ClassificationReviewField.fragment.xml`, `SimilarBugReviewField.fragment.xml`

### IDTS-85 — SangVN

- remaining six annotation files: `actions.cds`, `capabilities.cds`, `history-notifications.cds`, `object-page.cds`, `ownership-assignment.cds`, `value-helps.cds`
- collaboration, controls, assignment/list actions, and four Object Page fragments listed in `ownership-map.md`

### QA verification

NhanT uses IDTS-86 to sample each owner area, follow the declared breakpoint, run a focused test, and require a teach-back. A comment that only repeats the syntax does not pass.

## Vietnamese

Inventory này chốt phạm vi 72 runtime file không generated. Primary owner phải thêm giải thích tiếng Việt ngắn gọn chỉ tại chỗ người mới dễ không hiểu mục đích, trigger, side effect, rule, dependency hoặc debugger anchor. Không kể lại từng dòng code. Mỗi file sửa phải cập nhật knowledge mirror song ngữ tương ứng với owner, backup, flow, breakpoint, linked file và ảnh hưởng khi sửa.

### IDTS-83 — DonHV

- `db/schema.cds`
- mọi `srv/**/*.js`, `srv/service.cds` và `srv/auth.cds`

### IDTS-84 — DatDT

- `app/services.cds`, `app/bug-management-ui/annotations.cds`
- `annotations/labels.cds`, `list-report.cds`, `pm-monitoring.cds`
- shell/login/dashboard, hai file CSS, `ext/ai/AiReviewUi.js`, `ext/login/*`
- `ClassificationReview.js`, `DuplicateReview.js`, `HandoffSummaryReview.js`
- `ClassificationReviewField.fragment.xml`, `SimilarBugReviewField.fragment.xml`

### IDTS-85 — SangVN

- sáu annotation còn lại: `actions.cds`, `capabilities.cds`, `history-notifications.cds`, `object-page.cds`, `ownership-assignment.cds`, `value-helps.cds`
- collaboration, controls, assignment/list actions và bốn Object Page fragment được liệt kê tại `ownership-map.md`

### QA verification

NhanT dùng IDTS-86 để lấy mẫu khu vực của từng owner, đi theo breakpoint đã nêu, chạy focused test và yêu cầu teach-back. Comment chỉ lặp lại cú pháp thì không PASS.
