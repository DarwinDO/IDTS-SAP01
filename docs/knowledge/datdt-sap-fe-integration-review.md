# DatDT Sap_FE Integration Review

## English

### Source

- Repository: `https://github.com/dangthanhdat-hehe/Sap_FE.git`
- Reviewed copy: local temporary clone under `%TEMP%/Sap_FE_datdt`
- Source commit reviewed: `5e51342 feat: first commit defect tracking project`

### What DatDT's repository contains

DatDT's repository contains a generated SAP Fiori Elements List Report/Object Page application named `defectmanager`, plus two static HTML mockup screens.

Useful parts:

- A Fiori Elements app structure with List Report and Object Page routing.
- A local `annotation.xml` that defines header information, selection fields, table columns, object page sections, multi-line text fields, and semantic criticality.
- A static attachment upload fragment concept.
- Static HTML mockups that are useful as visual references for the defect tracking experience.

Parts that were not copied directly:

- The app points to a placeholder service URL: `/here/goes/your/serviceurl/`.
- The entity model is `Defects` from a mock metadata file, not the current CAP `BugService.Bugs` service.
- The annotations are XML annotations for a mock service namespace, while this project uses CAP CDS annotations in `app/bug-management-ui/annotations.cds`.
- The attachment fragment contains hardcoded files and has no real CAP upload/storage contract yet.
- The static HTML screens are useful for UX discussion but should not be imported into the Fiori Elements app.

### What was integrated into IDTS

The useful UI ideas were translated into the current CAP/Fiori app instead of copying the generated app wholesale.

Implemented in `app/bug-management-ui/annotations.cds`:

- Bug header information using `bugNumber` and `title`.
- List report filters for status, priority, severity, SAP module, application component, defect category, assignee, next processor role, and due date.
- List report columns for bug number, title, status, priority, severity, classification, assignee, next processor, due date, and updated time.
- Semantic criticality display for status, priority, severity, and notification delivery status.
- Object page sections for General Information, Classification, Reproduction and Results, Assignment, Rejected Follow-up, Planning, Comments, Attachments, History, and Notifications.
- Multi-line text behavior for long bug fields and comment/reason/message text.

Implemented in `app/bug-management-ui/webapp/manifest.json`:

- Responsive table remains the primary list report table.
- Create mode opens a new object page.
- Multi-selection is enabled for the list report table.
- OData version is aligned to CAP EDMX 4.0.

Implemented in `app/bug-management-ui/webapp/i18n/i18n_en.properties`:

- English fallback resource bundle to avoid UI5 build fallback-locale warnings.

Implemented in `db/data/idts.cap-Bugs.csv`:

- Four small IDTS-aligned demo bug records so the Fiori List Report can render useful rows during local review.
- The demo records use the current IDTS master data instead of copying DatDT's SAP FICO/SD/MM mock records directly.

### Remaining gaps

- Dependent value help is still pending WP2. Example: choosing Application Component and Defect Category should guide the valid Component Category and assignment candidate list.
- CAP handler actions are still pending WP3. Example: assign, reject with follow-up, request more information, resolve, close, reopen, and history/notification side effects.
- Real attachment upload is pending WP7 because the current backend only has attachment metadata, not a complete upload/storage flow.
- Browser-level UI verification should be done after the local CAP server is running with representative seed data.

## Vietnamese

### Nguồn

- Repository: `https://github.com/dangthanhdat-hehe/Sap_FE.git`
- Bản đã review: clone tạm trong `%TEMP%/Sap_FE_datdt`
- Commit đã review: `5e51342 feat: first commit defect tracking project`

### Repo của DatDT đang có gì

Repo của DatDT có một app SAP Fiori Elements List Report/Object Page tên `defectmanager`, kèm hai màn hình HTML mockup tĩnh.

Những phần hữu ích:

- Cấu trúc app Fiori Elements có routing List Report và Object Page.
- File `annotation.xml` local có header information, selection fields, table columns, object page sections, multi-line text fields, và semantic criticality.
- Ý tưởng fragment upload attachment.
- HTML mockup tĩnh có thể dùng làm tham khảo UX cho defect tracking.

Những phần không copy trực tiếp:

- App đang trỏ tới service URL placeholder: `/here/goes/your/serviceurl/`.
- Entity model là `Defects` từ mock metadata, không phải CAP service hiện tại `BugService.Bugs`.
- Annotation đang là XML annotation cho mock namespace, trong khi project này dùng CAP CDS annotation tại `app/bug-management-ui/annotations.cds`.
- Attachment fragment dùng dữ liệu hardcode và chưa có CAP upload/storage contract thật.
- HTML mockup chỉ phù hợp để tham khảo giao diện, không nên import trực tiếp vào Fiori Elements app.

### Đã tích hợp gì vào IDTS

Những ý tưởng UI hữu ích đã được chuyển thành annotation/config cho app CAP/Fiori hiện tại, thay vì copy nguyên app generated.

Đã làm trong `app/bug-management-ui/annotations.cds`:

- Header bug dùng `bugNumber` và `title`.
- Filter List Report cho status, priority, severity, SAP module, application component, defect category, assignee, next processor role, và due date.
- Cột List Report cho bug number, title, status, priority, severity, classification, assignee, next processor, due date, và updated time.
- Semantic criticality cho status, priority, severity, và notification delivery status.
- Section Object Page cho General Information, Classification, Reproduction and Results, Assignment, Rejected Follow-up, Planning, Comments, Attachments, History, và Notifications.
- Multi-line text cho các trường bug dài và comment/reason/message.

Đã làm trong `app/bug-management-ui/webapp/manifest.json`:

- Giữ ResponsiveTable làm table chính của List Report.
- Create mode mở Object Page mới.
- Bật multi-selection cho List Report table.
- Đồng bộ OData version về CAP EDMX 4.0.

Đã làm trong `app/bug-management-ui/webapp/i18n/i18n_en.properties`:

- Thêm English fallback resource bundle để tránh warning fallback-locale khi build UI5.

Đã làm trong `db/data/idts.cap-Bugs.csv`:

- Thêm bốn bug demo nhỏ, khớp với master data hiện tại của IDTS, để Fiori List Report có record khi review local.
- Các record demo dùng master data IDTS hiện tại, không copy trực tiếp dữ liệu mock SAP FICO/SD/MM từ repo DatDT.

### Khoảng trống còn lại

- Dependent value help vẫn chờ WP2. Ví dụ: chọn Application Component và Defect Category thì phải dẫn tới Component Category hợp lệ và danh sách developer phù hợp.
- CAP handler actions vẫn chờ WP3. Ví dụ: assign, reject có follow-up, request more information, resolve, close, reopen, và side effect cho history/notification.
- Upload attachment thật vẫn chờ WP7 vì backend hiện tại mới có metadata attachment, chưa có flow upload/storage hoàn chỉnh.
- Cần verify UI bằng browser sau khi chạy CAP server local với seed data đại diện.
