# SAP490 Template Inventory and Usage Guide

Last updated: 2026-06-03

This file explains every template currently stored under `docs/sap490/templates/`. The templates are school-provided or mentor-facing artifacts. Treat the original files as read-only source templates.

Vietnamese: File này giải thích toàn bộ template hiện có trong `docs/sap490/templates/`. Đây là các artifact từ nhà trường hoặc dùng để làm việc với mentor. Luôn xem file gốc là template chỉ đọc.

## Safe Usage Rule

- Do not edit files directly under `docs/sap490/templates/`.
- Copy a template into a generated/output folder before filling it.
- Preserve page setup, styles, formulas, merged cells, headers, footers, and worksheet structure unless DonHV explicitly approves a template revision.
- Keep Markdown and repo docs as the source of truth. DOCX/XLSX/PPTX files are submission or review artifacts.
- DonHV consolidates weekly/team-session updates into shared SAP490 documents, Google Sheets, and Excel files after reading member status files.

Vietnamese:

- Không chỉnh trực tiếp file trong `docs/sap490/templates/`.
- Luôn copy template sang folder output/generated trước khi điền nội dung.
- Giữ nguyên page setup, style, formula, merged cell, header, footer và cấu trúc worksheet trừ khi DonHV duyệt rõ việc sửa template.
- Markdown và tài liệu trong repo là source of truth. DOCX/XLSX/PPTX là artifact để nộp hoặc review.
- DonHV tổng hợp cập nhật hằng tuần/theo phiên làm việc nhóm vào tài liệu SAP490, Google Sheets và Excel sau khi đọc status của từng thành viên.

## Top-Level SAP490 Files

| File | Type | Purpose | When to use/fill | Information to fill or extract |
| --- | --- | --- | --- | --- |
| `docs/sap490/templates/1_SAP490_Tai lieu huong dan (1).docx` | DOCX guide | SAP490 instruction document from school. | Read before preparing deliverables, final report, and testing evidence. Usually not filled directly. | Extract school requirements, required sections, naming rules, submission expectations, and mentor/supervisor constraints. |
| `docs/sap490/templates/2_SAP490_Test Report Template (1).xlsx` | XLSX test report | Official test report workbook for recording test execution and statistics. Sheets: `Cover`, `Test Cases`, `Test Statistics`, `Feature 1`, `Feature 2`. | Fill after test planning starts and update after each test cycle or mentor-required test report. | Project/tester info, test case IDs, features, expected result, actual result, pass/fail status, defect references, statistics, and evidence notes. |

Vietnamese:

| File | Loại | Mục đích | Khi nào dùng/điền | Thông tin cần điền hoặc trích xuất |
| --- | --- | --- | --- | --- |
| `docs/sap490/templates/1_SAP490_Tai lieu huong dan (1).docx` | DOCX hướng dẫn | Tài liệu hướng dẫn SAP490 từ nhà trường. | Đọc trước khi chuẩn bị deliverable, final report và evidence testing. Thường không điền trực tiếp. | Trích yêu cầu của trường, section bắt buộc, quy tắc đặt tên, yêu cầu nộp bài và ràng buộc từ mentor/supervisor. |
| `docs/sap490/templates/2_SAP490_Test Report Template (1).xlsx` | XLSX test report | Workbook test report chính thức để ghi test execution và thống kê. Sheet: `Cover`, `Test Cases`, `Test Statistics`, `Feature 1`, `Feature 2`. | Điền sau khi bắt đầu test planning và cập nhật sau mỗi test cycle hoặc khi mentor yêu cầu test report. | Thông tin project/tester, test case ID, feature, expected result, actual result, pass/fail, defect reference, thống kê và ghi chú evidence. |

## Deliverable Templates

| File | Type | Purpose | When to use/fill | Information to fill |
| --- | --- | --- | --- | --- |
| `docs/sap490/templates/Deliverable_template/Blueprint_Template.docx` | DOCX | Business blueprint / project blueprint. | Fill after scope, business flows, roles, and high-level solution are agreed, before or at the start of implementation. | Project overview, scope, actors, business process, as-is/to-be flow, assumptions, constraints, risks, and high-level SAP CAP/Fiori solution mapping. |
| `docs/sap490/templates/Deliverable_template/Configuration_Note.xlsx` | XLSX | Configuration/customizing note. Sheets: `Cover`, `Record of change`, `Checklist`, `4`, `5`. | Fill during implementation when configuration or setup decisions are made. For IDTS, adapt ABAP/customizing language to CAP/Fiori setup when approved by mentor. | Environment/config note, CAP service setup, database/runtime configuration, Fiori app configuration, checklist status, change history, and reviewer notes. |
| `docs/sap490/templates/Deliverable_template/Final Project Report_FHU.docx` | DOCX | Final project report template. | Fill near final submission after implementation, testing, and demo evidence are ready. | Abstract, introduction, scope, requirements summary, design, implementation summary, testing results, screenshots, limitations, conclusion, references, and appendices. |
| `docs/sap490/templates/Deliverable_template/Functional_Specification.xlsx` | XLSX | Functional specification template. Sheets: `Cover`, `Histories`, `Function Overview`, `Process Flow`, `Screen Layout`, `Screen Definition`, `Smart Form Structure`, `Message Definition`, `Processing Description`. | Fill after BRD/SRS/FRS baseline is stable and before or during feature implementation. | Function overview, actor flow, Fiori screen layout, fields, validations, messages, business rules, processing logic, and traceability to IDTS requirements. |
| `docs/sap490/templates/Deliverable_template/Functional_Test.xlsx` | XLSX | Functional test specification and result workbook. Sheets: `Cover`, `Histories`, `Test Cases`, `Test Result`, `Test Data Description`. | Fill during test design and update after functional testing. | Functional test cases, preconditions, input data, expected result, actual result, pass/fail, defect references, and test data explanation. |
| `docs/sap490/templates/Deliverable_template/Naming Convention.pdf` | PDF reference | Naming convention reference. | Read before naming SAP artifacts, CAP entities/services, Fiori artifacts, files, or deliverables. Not filled directly. | Extract naming rules and adapt them consistently for IDTS CAP/Fiori artifacts. |
| `docs/sap490/templates/Deliverable_template/Technical_Specification.xlsx` | XLSX | Technical specification template. Sheets: `Cover`, `Histories`, `Introduction`, `Scope`, `Assumptions`, `Functional Requirements`, `Technical Design`, `Development Standards`, `Screen Layout`, `Screen Definition`, `Message Definition`, `Technical Implementation`. | Fill after functional scope is stable and while implementing CAP/Fiori features. | CAP CDS model, service projections, handlers, OData actions/functions, validation rules, Fiori annotations, UI behavior, messages, security assumptions, and implementation notes. |
| `docs/sap490/templates/Deliverable_template/Test_And_Fix_Bug.xlsx` | XLSX | Bug fixing and defect tracking workbook. Sheets: `Fix and bugs`, `Issue 2`, `Issue 4`. | Fill during QA and defect fixing cycles. | Bug ID, title, affected feature, severity/priority, reproduction steps, assigned owner, fix note, retest result, status, and evidence link. |
| `docs/sap490/templates/Deliverable_template/Test_Scenario.xlsx` | XLSX | Test scenario design workbook. Sheets: `Cover`, `Histories`, `Test Scenario`, `Test Cases`. | Fill before detailed functional/unit/UAT testing starts. | Scenario IDs, business flow, actor, precondition, test case mapping, expected outcome, and traceability to requirements. |
| `docs/sap490/templates/Deliverable_template/TR_Management.xlsx` | XLSX | Transport/request or change management tracker. Sheet: `Sheet1`. | Use only if mentor requires transport/change tracking. For CAP/Fiori, adapt it to deployment/change request tracking rather than classic SAP transport when approved. | Change ID, artifact name, owner, environment, change purpose, date, status, reviewer, and deployment/release note. |
| `docs/sap490/templates/Deliverable_template/UAT.xlsx` | XLSX | User Acceptance Test workbook. Sheets: `Cover`, `Histories`, `Test Scenario`, `Test Cases`, `Test Result`. | Fill when MVP is ready for mentor/user acceptance review. | UAT scenario, business actor, test steps, expected result, actual result, pass/fail, acceptance decision, open issues, and sign-off notes. |
| `docs/sap490/templates/Deliverable_template/Unit_Test.xlsx` | XLSX | Unit test workbook. Sheets: `Cover`, `Histories`, `UT`, `Evidence`. | Fill during or after implementation of each technical unit/work package. | Unit ID, object/component, test steps, input data, expected result, actual result, pass/fail, evidence screenshots/logs, and developer/QA notes. |
| `docs/sap490/templates/Deliverable_template/Workshop Template.pptx` | PPTX | Workshop, review, or demo presentation deck. | Fill before mentor/team workshops, project review meetings, or demo sessions. | Agenda, project context, scope, workflow diagrams, screenshots, progress, decisions, risks, questions, and next actions. |

Vietnamese:

| File | Loại | Mục đích | Khi nào dùng/điền | Thông tin cần điền |
| --- | --- | --- | --- | --- |
| `docs/sap490/templates/Deliverable_template/Blueprint_Template.docx` | DOCX | Business blueprint / project blueprint. | Điền sau khi đã chốt scope, flow nghiệp vụ, role và solution tổng quan, trước hoặc lúc bắt đầu implementation. | Tổng quan project, scope, actor, business process, as-is/to-be flow, assumption, constraint, risk và mapping solution SAP CAP/Fiori ở mức cao. |
| `docs/sap490/templates/Deliverable_template/Configuration_Note.xlsx` | XLSX | Ghi chú configuration/customizing. Sheet: `Cover`, `Record of change`, `Checklist`, `4`, `5`. | Điền trong quá trình implementation khi có quyết định cấu hình/setup. Với IDTS, cần adapt ngôn ngữ ABAP/customizing sang setup CAP/Fiori nếu mentor đồng ý. | Ghi chú environment/config, CAP service setup, database/runtime configuration, Fiori app configuration, checklist status, lịch sử thay đổi và reviewer note. |
| `docs/sap490/templates/Deliverable_template/Final Project Report_FHU.docx` | DOCX | Template báo cáo cuối kỳ. | Điền gần lúc nộp cuối cùng sau khi implementation, testing và demo evidence đã sẵn sàng. | Abstract, introduction, scope, tóm tắt requirement, design, implementation summary, testing result, screenshot, limitation, conclusion, reference và appendix. |
| `docs/sap490/templates/Deliverable_template/Functional_Specification.xlsx` | XLSX | Template functional specification. Sheet: `Cover`, `Histories`, `Function Overview`, `Process Flow`, `Screen Layout`, `Screen Definition`, `Smart Form Structure`, `Message Definition`, `Processing Description`. | Điền sau khi BRD/SRS/FRS baseline ổn định và trước hoặc trong quá trình implement feature. | Function overview, actor flow, layout màn hình Fiori, field, validation, message, business rule, processing logic và traceability tới requirement IDTS. |
| `docs/sap490/templates/Deliverable_template/Functional_Test.xlsx` | XLSX | Workbook đặc tả và kết quả functional test. Sheet: `Cover`, `Histories`, `Test Cases`, `Test Result`, `Test Data Description`. | Điền khi thiết kế test và cập nhật sau functional testing. | Functional test case, precondition, input data, expected result, actual result, pass/fail, defect reference và mô tả test data. |
| `docs/sap490/templates/Deliverable_template/Naming Convention.pdf` | PDF tham khảo | Tài liệu tham khảo quy tắc đặt tên. | Đọc trước khi đặt tên SAP artifact, CAP entity/service, Fiori artifact, file hoặc deliverable. Không điền trực tiếp. | Trích rule naming và adapt nhất quán cho artifact CAP/Fiori của IDTS. |
| `docs/sap490/templates/Deliverable_template/Technical_Specification.xlsx` | XLSX | Template technical specification. Sheet: `Cover`, `Histories`, `Introduction`, `Scope`, `Assumptions`, `Functional Requirements`, `Technical Design`, `Development Standards`, `Screen Layout`, `Screen Definition`, `Message Definition`, `Technical Implementation`. | Điền sau khi functional scope ổn định và trong khi implement CAP/Fiori. | CAP CDS model, service projection, handler, OData action/function, validation rule, Fiori annotation, UI behavior, message, security assumption và implementation note. |
| `docs/sap490/templates/Deliverable_template/Test_And_Fix_Bug.xlsx` | XLSX | Workbook ghi bug và fix defect. Sheet: `Fix and bugs`, `Issue 2`, `Issue 4`. | Điền trong các vòng QA và fix bug. | Bug ID, title, affected feature, severity/priority, reproduce steps, owner, fix note, retest result, status và evidence link. |
| `docs/sap490/templates/Deliverable_template/Test_Scenario.xlsx` | XLSX | Workbook thiết kế test scenario. Sheet: `Cover`, `Histories`, `Test Scenario`, `Test Cases`. | Điền trước khi bắt đầu functional/unit/UAT testing chi tiết. | Scenario ID, business flow, actor, precondition, mapping test case, expected outcome và traceability tới requirement. |
| `docs/sap490/templates/Deliverable_template/TR_Management.xlsx` | XLSX | Tracker transport/request hoặc change management. Sheet: `Sheet1`. | Chỉ dùng nếu mentor yêu cầu tracking transport/change. Với CAP/Fiori, adapt thành deployment/change request tracking thay vì SAP transport cổ điển nếu được duyệt. | Change ID, artifact name, owner, environment, mục đích thay đổi, ngày, status, reviewer và deployment/release note. |
| `docs/sap490/templates/Deliverable_template/UAT.xlsx` | XLSX | Workbook User Acceptance Test. Sheet: `Cover`, `Histories`, `Test Scenario`, `Test Cases`, `Test Result`. | Điền khi MVP sẵn sàng cho mentor/user acceptance review. | UAT scenario, business actor, test step, expected result, actual result, pass/fail, acceptance decision, open issue và sign-off note. |
| `docs/sap490/templates/Deliverable_template/Unit_Test.xlsx` | XLSX | Workbook unit test. Sheet: `Cover`, `Histories`, `UT`, `Evidence`. | Điền trong hoặc sau khi implement từng technical unit/work package. | Unit ID, object/component, test step, input data, expected result, actual result, pass/fail, evidence screenshot/log và developer/QA note. |
| `docs/sap490/templates/Deliverable_template/Workshop Template.pptx` | PPTX | Slide deck cho workshop, review hoặc demo. | Điền trước buổi workshop với mentor/team, project review hoặc demo. | Agenda, project context, scope, workflow diagram, screenshot, progress, decision, risk, question và next action. |

## Recommended Fill Sequence for IDTS

1. Read the SAP490 guide and naming convention before formalizing deliverables.
2. Maintain BRD/SRS/FRS Markdown and DOCX in `docs/ba/` as the source requirement set.
3. Fill Blueprint and Functional Specification when the mentor asks for school-format SAP490 deliverables.
4. Fill Technical Specification as CAP/Fiori implementation work becomes concrete.
5. Fill Test Scenario, Unit Test, Functional Test, Test Report, Bug Fix, and UAT templates as implementation and QA progress.
6. Use Final Project Report and Workshop Template near final presentation/submission.

Vietnamese:

1. Đọc SAP490 guide và Naming Convention trước khi formalize deliverable.
2. Duy trì BRD/SRS/FRS Markdown và DOCX trong `docs/ba/` làm nguồn requirement chính.
3. Điền Blueprint và Functional Specification khi mentor yêu cầu deliverable theo format SAP490 của trường.
4. Điền Technical Specification khi implementation CAP/Fiori đã cụ thể.
5. Điền Test Scenario, Unit Test, Functional Test, Test Report, Bug Fix và UAT khi implementation và QA tiến triển.
6. Dùng Final Project Report và Workshop Template gần giai đoạn presentation/submission cuối.
