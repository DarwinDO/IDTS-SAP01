# SAP Defect Tooling Comparison for IDTS

This file is bilingual. English first, then Vietnamese.

File này là song ngữ. Tiếng Anh trước, sau đó là tiếng Việt.

## 1. Scope of This Note

### English

This note compares IDTS with common SAP-side tools or platforms used for defect, incident, case, and test-related issue management. It is meant to guide IDTS MVP scope, not to turn IDTS into a full SAP ALM or ITSM replacement.

Sources reviewed:

- SAP Cloud ALM Defects: https://help.sap.com/docs/cloud-alm/applicationhelp/defects
- SAP Cloud ALM Creating Defects: https://help.sap.com/docs/cloud-alm/applicationhelp/defect-creation
- SAP Cloud ALM Processing Defects: https://help.sap.com/docs/cloud-alm/applicationhelp/processing-defects
- SAP Cloud ALM Tracking Defects: https://help.sap.com/docs/cloud-alm/applicationhelp/tracking-defects
- SAP Cloud ALM Creating Defects from Test Runs: https://help.sap.com/docs/cloud-alm/applicationhelp/creating-defects-from-test-runs
- Focused Build Defects and Defect Corrections: https://help.sap.com/docs/Focused_Build_Focused_Insights/53cb8e90c8504f31bb44d4f0029b4b98/a2c8168c5305485a9cd13f9d7e9faa99.html
- Focused Build My Defects: https://help.sap.com/docs/PRODUCT_ID/53cb8e90c8504f31bb44d4f0029b4b98/57cc59a72da046399d6b8b2e713f1419.html
- SAP for Me support/case entry point: https://help.sap.com/docs/PRODUCT_ID/758e7c8a7c5b4782bb78b17f8c7fbbda/6b951a6010164aa7ac6bc98419a4d148.html

### Tiếng Việt

Ghi chú này so sánh IDTS với một số công cụ/nền tảng phía SAP thường dùng cho defect, incident, support case và issue phát sinh trong kiểm thử. Mục tiêu là định hướng scope MVP của IDTS, không biến IDTS thành SAP ALM hoặc ITSM đầy đủ.

Nguồn đã tham khảo nằm ở phần tiếng Anh phía trên.

## 2. Existing SAP-Side Tools

### English

SAP Cloud ALM is the closest reference for IDTS. Its Defects app supports creating defects independently or from a test run, assigning defects to teams or people, linking test cases, using subtasks, maintaining status/planning data, and tracking defects through Defects, Overview, and Analytics apps.

Focused Build for SAP Solution Manager is a heavier implementation-project tool. It connects test execution, defects, and defect corrections. If a test case fails, testers can report a defect from test execution; the defect can be analyzed and then converted into a defect correction when an implementation change is needed.

SAP Solution Manager ITSM is broader service management. It is suitable for incidents, problems, changes, and operational support, but too large for the current IDTS student-project scope.

SAP for Me is mainly for SAP customer support cases with SAP. It is not an internal team bug tracker for IDTS, but it is useful as a reference for case/support communication.

### Tiếng Việt

SAP Cloud ALM là công cụ tham chiếu gần nhất với IDTS. Defects app của SAP Cloud ALM hỗ trợ tạo defect độc lập hoặc từ test run, assign defect cho team/person, liên kết test case, dùng sub-task, quản lý status/planning data và theo dõi qua Defects, Overview, Analytics.

Focused Build for SAP Solution Manager là công cụ nặng hơn cho implementation project. Nó nối test execution, defect và defect correction. Khi test case fail, tester có thể report defect từ test execution; defect được phân tích rồi có thể tạo defect correction nếu cần thay đổi implementation.

SAP Solution Manager ITSM là service management rộng hơn. Nó phù hợp cho incident, problem, change và vận hành, nhưng quá lớn so với scope đồ án hiện tại của IDTS.

SAP for Me chủ yếu dùng cho customer support case với SAP. Nó không phải internal bug tracker cho IDTS, nhưng có thể tham khảo về cách giao tiếp/support case.

## 3. What IDTS Already Has Correct

### English

IDTS already has a reasonable MVP foundation:

- Clear roles: Reporter/Tester, Developer, PM.
- Create bug, check duplicates, assign developer, pending assignment, developer review.
- Request more information, reject unsuitable assignment, resolve, close, reopen.
- Comments, attachments/evidence, notifications, and history logs.
- PM monitoring for workload, overdue, and status progress.
- SAP-aware classification separated into SAP Module, Application Component, Defect Category, Component Category, and Developer Responsibility.

This is enough to start coding an MVP, as long as the team accepts that the first implementation is a focused defect tracker, not a complete ALM or ITSM product.

### Tiếng Việt

IDTS hiện đã có nền tảng MVP hợp lý:

- Role rõ: Reporter/Tester, Developer, PM.
- Tạo bug, kiểm tra trùng, assign developer, pending assignment, developer review.
- Request more information, reject assignment không phù hợp, resolve, close, reopen.
- Comment, attachment/evidence, notification và history log.
- PM monitoring cho workload, overdue và tiến độ status.
- Classification phù hợp SAP hơn: SAP Module, Application Component, Defect Category, Component Category, Developer Responsibility.

Như vậy đã đủ để bắt đầu code MVP, miễn là nhóm thống nhất đây là defect tracker tập trung, không phải ALM hoặc ITSM hoàn chỉnh.

## 4. Improvements to Borrow from SAP Cloud ALM / Focused Build

### English

Recommended improvements before or during MVP implementation:

1. Add `Retest Required` status between `Resolved` and `Closed`.
   - SAP Cloud ALM has a clear correction/retest/close loop.
   - IDTS should use: `In Progress -> Resolved -> Retest Required -> Closed` or simplify as `Resolved -> Retest Required -> Closed`.

2. Add optional `TestCase` and `TestRun` links.
   - Do not build a full test management module.
   - Store references so a defect can say where it was found.

3. Add `Responsible` or `Next Processor`.
   - SAP Cloud ALM sends notifications to the person responsible for the next action.
   - IDTS can keep `assignee`, but adding `nextProcessor` or `responsibleUser` makes status ownership clearer.

4. Add planning fields.
   - Planned completion date, effort estimate, and due date make overdue monitoring more objective.

5. Keep sub-tasks out of MVP unless needed.
   - SAP Cloud ALM supports subtasks.
   - IDTS can postpone this to avoid becoming Jira.

6. Improve traceability.
   - Link bug to component/category, test context, attachments, comments, and history.
   - Avoid mandatory source-code/transport/release linkage in MVP.

### Tiếng Việt

Các cải tiến nên mượn từ SAP Cloud ALM / Focused Build trước hoặc trong lúc làm MVP:

1. Thêm status `Retest Required` giữa `Resolved` và `Closed`.
   - SAP Cloud ALM có vòng xử lý rõ: sửa/xử lý xong -> retest -> close.
   - IDTS nên dùng: `In Progress -> Resolved -> Retest Required -> Closed` hoặc đơn giản là `Resolved -> Retest Required -> Closed`.

2. Thêm link optional đến `TestCase` và `TestRun`.
   - Không xây full test management module.
   - Chỉ lưu reference để biết defect được phát hiện ở đâu.

3. Thêm `Responsible` hoặc `Next Processor`.
   - SAP Cloud ALM notification đi theo người đang chịu trách nhiệm bước tiếp theo.
   - IDTS có thể giữ `assignee`, nhưng thêm `nextProcessor` hoặc `responsibleUser` sẽ rõ ownership hơn.

4. Thêm planning fields.
   - Planned completion date, effort estimate, due date giúp PM monitoring overdue khách quan hơn.

5. Chưa nên thêm sub-task vào MVP nếu chưa thật sự cần.
   - SAP Cloud ALM có subtasks.
   - IDTS nên để sau để tránh biến thành Jira.

6. Tăng traceability.
   - Link bug với component/category, test context, attachment, comment và history.
   - Không bắt buộc source-code/transport/release linkage trong MVP.

## 5. Recommended MVP Baseline

### English

Recommended "best version" for the first coding phase:

- Keep the current core scope.
- Add `Retest Required`.
- Add optional `TestCaseRef` and `TestRunRef`.
- Add `Environment`.
- Add `plannedCompletionDate` or `dueDate`.
- Add `responsibleUser` or `nextProcessor`.
- Keep `DeveloperResponsibilities` for assignment filtering.
- Do not add CI/CD, code review, transport management, release management, or full test management.

### Tiếng Việt

Phiên bản tốt nhất cho giai đoạn code đầu tiên:

- Giữ core scope hiện tại.
- Thêm `Retest Required`.
- Thêm optional `TestCaseRef` và `TestRunRef`.
- Thêm `Environment`.
- Thêm `plannedCompletionDate` hoặc `dueDate`.
- Thêm `responsibleUser` hoặc `nextProcessor`.
- Giữ `DeveloperResponsibilities` để filter assignee.
- Không thêm CI/CD, code review, transport management, release management hoặc full test management.
