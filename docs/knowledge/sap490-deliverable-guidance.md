# SAP490 Deliverable Guidance for IDTS

Last updated: 2026-05-28

## English

### Source Documents Reviewed

- `1_SAP490_Tai lieu huong dan (1).docx`
- `2_SAP490_Test Report Template (1).xlsx`
- Google Drive folder `Deliverable_template`, including final report, blueprint, specification, configuration, testing, UAT, defect, transport/request, workshop, and naming convention templates.

### What The SAP490 Guide Requires

SAP490 is a SAP capstone project. The official guide expects a final report of about 100 to 130 pages excluding appendices, with Times New Roman 12, 1.5 line spacing, A4 page setup, and Harvard-style references.

The suggested report structure is:

1. Introduction
2. Product Statements
3. SAP Configurations
4. SAP Coding
5. Implementation and Testing

For IDTS, the important interpretation is that the school template is written for classic SAP projects with SAP configuration and ABAP coding. IDTS is a SAP CAP Node.js and Fiori project, so the team should adapt the wording carefully and confirm with the supervisor that CAP/Fiori implementation can satisfy the SAP Coding section.

### How To Apply This To IDTS

- Use `Final Project Report_FHU.docx` as the main final report structure.
- Use `2_SAP490_Test Report Template (1).xlsx` as the required test case and test report format.
- Use `Functional_Specification.xlsx` to document feature-level business behavior such as create bug, classify bug, assign developer, developer review, request more information, reject/reassign, resolve/retest/close, comments, history, notification, and PM monitoring.
- Use `Technical_Specification.xlsx` to document CAP/Fiori technical design: CDS model, service projections, OData actions, handler rules, Fiori annotations, value helps, roles, messages, and deployment assumptions.
- Use `Test_Scenario.xlsx`, `Unit_Test.xlsx`, `Functional_Test.xlsx`, and `UAT.xlsx` to structure verification evidence.
- Use `Test_And_Fix_Bug.xlsx` as a project QA defect log, not as a replacement for IDTS itself.
- Treat `Naming Convention.pdf` as mostly ABAP/RAP guidance. Reuse only applicable principles: English names, meaningful names, consistent CDS/view naming, value help associations, message handling discipline. Do not force ABAP-only naming rules onto CAP Node.js files.

### Main Risk

The SAP490 materials mention ABAP enhancement and SAP configuration for at least one SAP module. IDTS currently targets SAP CAP Node.js, OData V4, and Fiori Elements/SAPUI5, not ABAP. The team should document this as an approved SAP BTP/CAP implementation approach, or ask the supervisor whether an additional SAP module/configuration chapter is required.

## Vietnamese

### Tài liệu đã đọc

- `1_SAP490_Tai lieu huong dan (1).docx`
- `2_SAP490_Test Report Template (1).xlsx`
- Thư mục Google Drive `Deliverable_template`, gồm các template final report, blueprint, functional/technical specification, configuration, testing, UAT, defect log, transport/request, workshop và naming convention.

### Yêu cầu chính của SAP490

SAP490 là đồ án tốt nghiệp theo hướng dự án SAP. Tài liệu hướng dẫn yêu cầu báo cáo cuối khoảng 100 đến 130 trang, không tính phụ lục; trình bày Times New Roman 12, giãn dòng 1.5, khổ A4 và trích dẫn theo Harvard.

Cấu trúc báo cáo được gợi ý gồm:

1. Introduction
2. Product Statements
3. SAP Configurations
4. SAP Coding
5. Implementation and Testing

Điểm cần lưu ý cho IDTS: template của trường thiên về dự án SAP cổ điển, có SAP configuration và ABAP coding. Dự án IDTS hiện là SAP CAP Node.js + Fiori, nên khi viết báo cáo phải diễn giải lại phần SAP Coding thành SAP CAP/Fiori implementation, và nên xác nhận với giảng viên rằng hướng CAP/Fiori được chấp nhận thay cho ABAP enhancement.

### Cách áp dụng cho IDTS

- Dùng `Final Project Report_FHU.docx` làm khung báo cáo cuối.
- Dùng `2_SAP490_Test Report Template (1).xlsx` làm format chính cho test case và test report.
- Dùng `Functional_Specification.xlsx` để mô tả nghiệp vụ theo từng feature: tạo bug, phân loại bug, assign developer, developer review, request more information, reject/reassign, resolve/retest/close, comment, history, notification và PM monitoring.
- Dùng `Technical_Specification.xlsx` để mô tả thiết kế kỹ thuật CAP/Fiori: CDS model, service projection, OData action, handler rule, Fiori annotation, value help, role, message và giả định deploy.
- Dùng `Test_Scenario.xlsx`, `Unit_Test.xlsx`, `Functional_Test.xlsx`, `UAT.xlsx` để chuẩn hóa bằng chứng kiểm thử.
- Dùng `Test_And_Fix_Bug.xlsx` như defect log của chính dự án trong quá trình làm đồ án, không dùng nó để thay thế hệ thống IDTS.
- `Naming Convention.pdf` chủ yếu dành cho ABAP/RAP. Với IDTS chỉ nên lấy tinh thần: đặt tên tiếng Anh, tên có nghĩa, nhất quán, CDS/view rõ ràng, value help association hợp lý và message handling có kỷ luật. Không ép quy tắc ABAP-only vào CAP Node.js.

### Rủi ro chính

Tài liệu SAP490 có nhắc đến ABAP enhancement và SAP configuration cho ít nhất một SAP module. IDTS hiện đi theo SAP CAP Node.js, OData V4 và Fiori Elements/SAPUI5, không phải ABAP. Nhóm nên ghi rõ đây là hướng triển khai SAP BTP/CAP đã được duyệt, hoặc hỏi giảng viên xem có bắt buộc bổ sung chương SAP module/configuration riêng không.
