# Knowledge: `app/bug-management-ui/annotations/labels.cds`

> **Ownership / debug anchor:** DatDT owns UI labels and client guidance (backup: SangVN). A mandatory-looking field here still needs matching CAP validation in `srv/`.
> **Ownership / điểm debug:** DatDT sở hữu nhãn và hướng dẫn phía UI (backup: SangVN). Trường nhìn như bắt buộc ở đây vẫn phải có validation tương ứng trong `srv/`.

## English

### What this file is for

This CAP annotation file centralizes user-facing labels and field-control hints for `BugService.Bugs`. It tells Fiori how to label fields, which fields are mandatory, which fields are read-only, and which long text fields should render as multi-line inputs.

### Beginner explanation

Fiori Elements reads CDS annotations to decide how a generated screen should look. In this file, we are not changing database data or backend workflow logic. We are describing how bug fields should appear to users.

For example, `description`, `stepsToReproduce`, `actualResult`, and `expectedResult` are important for a usable bug report, so they are marked mandatory. Long text fields are marked with `@UI.MultiLineText` so users get text areas instead of cramped single-line inputs.

### Flow in IDTS

1. Tester opens create/edit bug UI.
2. Fiori reads labels and field controls from this file.
3. Important bug-report fields appear as required or multi-line fields.
4. PM monitoring fields such as `isRejectedFollowUp` get readable labels in filters and quick tabs.

### Important source anchors

- Location: `@Common.FieldControl : #Mandatory` on key bug-report fields.
  - IDTS concept: A bug must contain enough reproduction information to be useful.
  - Impact if broken: Tester can submit vague bugs without reproduction steps, actual result, or expected result.
  - Must check together: backend validation in `srv/bug-service/bug-write.js` and create/Object Page annotations.

- Location: `@UI.MultiLineText` on description, steps, results, and rejection reason.
  - IDTS concept: These are narrative fields, not short codes.
  - Impact if broken: Users get cramped one-line inputs for long explanations.
  - Must check together: Object Page layout in `app/bug-management-ui/annotations/object-page.cds`.

- Location: `isRejectedFollowUp @Common.Label : 'Rejected - Needs Follow-up'`.
  - IDTS concept: PM needs a readable monitoring filter for rejected bugs that still require action.
  - Impact if broken: The monitoring tab/filter label can show technical or escaped text such as `\u2014`.
  - Must check together: PM monitoring tabs in `app/bug-management-ui/annotations/pm-monitoring.cds` and browser UAT evidence.

### Cross-folder impact

- `app/bug-management-ui/annotations/object-page.cds` consumes these labels and field controls on the Object Page.
- `app/bug-management-ui/annotations/list-report.cds` exposes monitoring fields that rely on readable labels.
- `srv/bug-service/bug-write.js` must still enforce backend validation; UI labels are not security or data-integrity rules.
- `scripts/qa/test-idts24-uat-playwright.js` can catch label/runtime issues through browser evidence.

### Safe editing checklist

- Do not rely on UI mandatory markers alone; backend validation must still protect required business data.
- Use plain display text for labels. Avoid escaped Unicode in labels if the runtime may show the escape literally.
- If a label appears in List Report tabs or filters, verify it in a real browser screenshot.
- If you add new user-facing text outside CDS labels, update the i18n files instead of hardcoding text.

## Vietnamese

### File này dùng để làm gì

File annotation CAP này tập trung các label và field-control hint cho `BugService.Bugs`. Nó nói cho Fiori biết field nên hiển thị tên gì, field nào bắt buộc, field nào chỉ đọc, và field text dài nào nên render dạng nhiều dòng.

### Giải thích cho người mới

Fiori Elements đọc CDS annotations để quyết định màn hình generated nên hiển thị như thế nào. Trong file này, ta không đổi dữ liệu database và cũng không đổi workflow backend. Ta chỉ mô tả cách các field của bug nên xuất hiện với người dùng.

Ví dụ, `description`, `stepsToReproduce`, `actualResult`, và `expectedResult` rất quan trọng để bug report đủ thông tin, nên được đánh dấu mandatory. Các field text dài được đánh dấu `@UI.MultiLineText` để user nhập bằng ô nhiều dòng thay vì input một dòng chật hẹp.

### Flow trong IDTS

1. Tester mở màn hình tạo/sửa bug.
2. Fiori đọc label và field control từ file này.
3. Các field quan trọng của bug report hiện dạng required hoặc multi-line.
4. Các field monitoring cho PM như `isRejectedFollowUp` có label dễ đọc trong filter và quick tab.

### Các điểm neo quan trọng

- Vị trí: `@Common.FieldControl : #Mandatory` trên các field bug-report chính.
  - Khái niệm IDTS: Một bug phải có đủ thông tin tái hiện để Developer xử lý được.
  - Ảnh hưởng nếu sai: Tester có thể submit bug quá mơ hồ, thiếu steps, actual result hoặc expected result.
  - Phải kiểm tra cùng: validation backend trong `srv/bug-service/bug-write.js` và annotation create/Object Page.

- Vị trí: `@UI.MultiLineText` trên description, steps, results, và rejection reason.
  - Khái niệm IDTS: Đây là các field mô tả dài, không phải mã ngắn.
  - Ảnh hưởng nếu sai: User sẽ phải nhập giải thích dài trong input một dòng khó dùng.
  - Phải kiểm tra cùng: layout Object Page trong `app/bug-management-ui/annotations/object-page.cds`.

- Vị trí: `isRejectedFollowUp @Common.Label : 'Rejected - Needs Follow-up'`.
  - Khái niệm IDTS: PM cần filter/tab dễ đọc cho các bug bị reject nhưng vẫn cần xử lý tiếp.
  - Ảnh hưởng nếu sai: Label trong monitoring tab/filter có thể hiện text kỹ thuật hoặc escape như `\u2014`.
  - Phải kiểm tra cùng: PM monitoring tabs trong `app/bug-management-ui/annotations/pm-monitoring.cds` và browser UAT evidence.

### Liên kết với file khác

- `app/bug-management-ui/annotations/object-page.cds` dùng các label và field control này trên Object Page.
- `app/bug-management-ui/annotations/list-report.cds` expose các monitoring field cần label dễ đọc.
- `srv/bug-service/bug-write.js` vẫn phải enforce backend validation; label UI không phải rule bảo mật hoặc toàn vẹn dữ liệu.
- `scripts/qa/test-idts24-uat-playwright.js` có thể phát hiện lỗi label/runtime qua browser evidence.

### Checklist sửa an toàn

- Không chỉ dựa vào dấu mandatory ở UI; backend validation vẫn phải bảo vệ dữ liệu nghiệp vụ bắt buộc.
- Dùng text hiển thị trực tiếp cho label. Tránh escaped Unicode trong label nếu runtime có thể hiển thị nguyên chuỗi escape.
- Nếu label xuất hiện trong List Report tab hoặc filter, verify bằng screenshot browser thật.
- Nếu thêm text user-facing ngoài CDS label, cập nhật i18n thay vì hardcode.

## Metadata

- Source file: `app/bug-management-ui/annotations/labels.cds`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/annotations/labels.cds.md`
- Source layer: `app`
- Last reviewed: 2026-06-28

## Beginner-first execution map / Sơ đồ thực thi cho người mới (2026-07-18)

**English.** Caller: `annotations.cds` during CAP compilation. Each `annotate BugService.<Entity> with { ... }` attaches human-readable labels to the existing OData fields; it does not create fields. Callee: Fiori Elements reads those labels from `$metadata` when rendering forms, tables, and value helps. Input is the service entity/property name; output is display metadata; database data is unchanged. When a label is wrong, verify the target symbol exists in `srv/service.cds` before changing UI code.

**Tiếng Việt.** Caller là `annotations.cds` lúc CAP compile. Mỗi `annotate BugService.<Entity> with { ... }` gắn label dễ đọc vào field OData đã tồn tại; nó không tạo field mới. Callee là Fiori Elements, framework đọc label từ `$metadata` để dựng form, table và value help. Input là tên entity/property; output là display metadata; dữ liệu database không đổi. Khi label sai hoặc không hiện, kiểm target thật trong `srv/service.cds` trước khi sửa JavaScript UI.
## IDTS-125 dynamic Bug fields (2026-08-05)

**English.** Editable Bug properties now reference required or optional dynamic field control. Tester/PM see mandatory/optional inputs; Developers see those same Bug fields as read-only even when the assigned Developer opens edit mode for attachments.

**Tiếng Việt.** Property Bug có thể edit giờ tham chiếu dynamic field control bắt buộc hoặc tùy chọn. Tester/PM thấy input mandatory/optional; Developer thấy chính các field Bug đó read-only dù assignee mở edit mode để thêm attachment.
