# SAP Learning Notes for IDTS

This file is bilingual. Each concept is explained in English first, then Vietnamese.

File này là song ngữ. Mỗi khái niệm được giải thích bằng tiếng Anh trước, sau đó là tiếng Việt.

## 1. How IDTS Uses SAP Concepts

### English

IDTS is a SAP-style enterprise application for tracking issues and defects. It supports bug reporting, classification, assignment, comments, notifications, history logs, and PM monitoring. It is not a full Jira replacement and it does not fix source code directly.

The current technical direction is:

- SAP CAP Node.js for the backend service and business model.
- OData V4 for exposing backend data to the UI.
- SAP Fiori Elements / SAPUI5 for the frontend.
- SQLite for local development.
- SAP HANA Cloud or PostgreSQL as possible future deployment databases.
- SAP BTP services may be added later for authentication, notification, or workflow, but no endpoint or credential should be hardcoded.

### Tiếng Việt

IDTS là một ứng dụng doanh nghiệp theo phong cách SAP dùng để quản lý issue/defect. Hệ thống hỗ trợ tạo bug report, phân loại, assign developer, comment, notification, history log và PM monitoring. Đây không phải hệ thống thay thế Jira đầy đủ và không phải nơi sửa source code trực tiếp.

Định hướng kỹ thuật hiện tại:

- SAP CAP Node.js cho backend service và business model.
- OData V4 để expose dữ liệu backend cho UI.
- SAP Fiori Elements / SAPUI5 cho frontend.
- SQLite cho local development.
- SAP HANA Cloud hoặc PostgreSQL là lựa chọn database khi deploy sau này.
- SAP BTP services có thể được thêm sau cho authentication, notification hoặc workflow, nhưng không được hardcode endpoint hoặc credential.

## 2. SAP CAP

### English

SAP CAP means SAP Cloud Application Programming Model.

In IDTS, CAP is the backend layer that defines:

- Domain data such as Bugs, Developers, SAP Modules, Application Components, Defect Categories, Comments, History Logs, and Notifications.
- OData services used by the Fiori app.
- Business validation such as status transitions, assignment rules, and required fields.

For a beginner, think of CAP as the place where server-side business rules live.

### Tiếng Việt

SAP CAP là viết tắt của SAP Cloud Application Programming Model.

Trong IDTS, CAP là lớp backend dùng để định nghĩa:

- Dữ liệu nghiệp vụ như Bugs, Developers, SAP Modules, Application Components, Defect Categories, Comments, History Logs và Notifications.
- OData services để Fiori app sử dụng.
- Validation nghiệp vụ như chuyển trạng thái, quy tắc assign và các field bắt buộc.

Với người mới học, có thể hiểu CAP là nơi đặt business rules ở phía server.

## 3. CDS

### English

CDS means Core Data Services.

In this repo:

- `db/schema.cds` defines persistent data structures.
- `srv/service.cds` exposes selected data and actions through the CAP service.
- `app/bug-management-ui/annotations.cds` can define UI annotations for Fiori Elements.

### Tiếng Việt

CDS là viết tắt của Core Data Services.

Trong repo này:

- `db/schema.cds` định nghĩa cấu trúc dữ liệu lưu trữ.
- `srv/service.cds` expose dữ liệu và action thông qua CAP service.
- `app/bug-management-ui/annotations.cds` có thể định nghĩa UI annotations cho Fiori Elements.

## 4. OData V4

### English

OData is the standard protocol used by SAP Fiori apps to communicate with backend services.

In IDTS, the Fiori app reads and writes Bugs through the CAP OData service. The generated Fiori app currently points to:

```text
/odata/v4/bug/
```

For a beginner, think of OData as a standard API format that Fiori understands well.

### Tiếng Việt

OData là protocol chuẩn thường được SAP Fiori app dùng để giao tiếp với backend service.

Trong IDTS, Fiori app đọc và ghi Bugs thông qua CAP OData service. Fiori app hiện tại đang trỏ đến:

```text
/odata/v4/bug/
```

Với người mới học, có thể hiểu OData là một dạng API chuẩn mà Fiori hiểu rất tốt.

## 5. SAP Fiori Elements and SAPUI5

### English

SAP Fiori Elements builds UI screens from OData metadata and annotations. It is suitable for IDTS List Report and Object Page screens.

SAPUI5 is the UI framework behind many SAP web applications. In IDTS, use custom SAPUI5 code only when annotations are not enough, for example custom controller extensions, XML fragments, or formatter logic.

The project should prefer annotation-driven Fiori Elements first because it is closer to SAP standards and easier to maintain.

### Tiếng Việt

SAP Fiori Elements tạo UI dựa trên OData metadata và annotations. Nó phù hợp cho các màn hình List Report và Object Page của IDTS.

SAPUI5 là UI framework phía sau nhiều ứng dụng web SAP. Trong IDTS, chỉ nên dùng custom SAPUI5 code khi annotations không đủ, ví dụ controller extension, XML fragment hoặc formatter.

Dự án nên ưu tiên Fiori Elements dựa trên annotation trước vì gần với chuẩn SAP hơn và dễ maintain hơn.

## 6. Correct Classification Model for SAP-Related Defects

### English

As a BA decision, do not put standard SAP modules and IDTS feature modules into the same field if that field is called `SAP Module`.

Why:

- `SAP Module` has a specific SAP meaning: FI, MM, SD, CO, PP, HCM, and similar functional areas.
- `IDTS Bug Report`, `IDTS Assignment`, and `Dashboard` are not SAP modules. They are application components or feature areas.

Recommended classification fields:

| Field | Meaning | Examples |
| --- | --- | --- |
| `SAPModule` | Optional SAP business/functional context | FI, MM, SD, CO, PP, HCM |
| `ApplicationComponent` | Concrete application component or feature where the defect appears | IDTS Bug Report, IDTS Assignment, IDTS Notification, Dashboard, Custom Fiori App |
| `DefectCategory` | Type or technical layer of the defect | Fiori/UI5, SAP CAP Backend, Database, Workflow, Integration, Authorization, Performance |

For pure IDTS defects, `SAPModule` can be empty or "Not Applicable".

For SAP process defects, `SAPModule` should identify the SAP functional area, while `ApplicationComponent` should still identify the concrete component, app, screen, or process area where the bug appears.

### Tiếng Việt

Theo góc nhìn BA, không nên để SAP module chuẩn và module/chức năng của IDTS vào chung một field nếu field đó được gọi là `SAP Module`.

Lý do:

- `SAP Module` có ý nghĩa SAP khá cụ thể: FI, MM, SD, CO, PP, HCM và các functional area tương tự.
- `IDTS Bug Report`, `IDTS Assignment`, `Dashboard` không phải SAP module. Chúng là application component hoặc feature area của hệ thống.

Các field phân loại nên dùng:

| Field | Ý nghĩa | Ví dụ |
| --- | --- | --- |
| `SAPModule` | Ngữ cảnh nghiệp vụ/chức năng SAP, có thể không bắt buộc | FI, MM, SD, CO, PP, HCM |
| `ApplicationComponent` | Component/chức năng cụ thể nơi bug xuất hiện | IDTS Bug Report, IDTS Assignment, IDTS Notification, Dashboard, Custom Fiori App |
| `DefectCategory` | Loại lỗi hoặc lớp kỹ thuật của defect | Fiori/UI5, SAP CAP Backend, Database, Workflow, Integration, Authorization, Performance |

Với bug thuần IDTS, `SAPModule` có thể để trống hoặc là "Not Applicable".

Với bug thuộc quy trình SAP, `SAPModule` nên cho biết functional area của SAP, còn `ApplicationComponent` vẫn nên cho biết component, app, màn hình hoặc process area cụ thể nơi bug xuất hiện.

## 7. Component Category and Developer Responsibility

### English

The system should separate valid classification combinations from developer responsibility.

| Object | Business question it answers |
| --- | --- |
| `SAPModule` | Which SAP functional area is involved, if any? |
| `ApplicationComponent` | Where does the bug appear? |
| `SAPModuleComponent` | Is this Application Component relevant for this SAP Module? |
| `DefectCategory` | What type or technical layer is the bug about? |
| `ComponentCategory` | Is this Defect Category valid for this Application Component? |
| `DeveloperProfile` | Who can receive bug assignments? |
| `DeveloperResponsibility` | Which Developer can handle this Component Category, optionally for a specific SAP Module? |

Example classification:

| SAPModule | ApplicationComponent | DefectCategory |
| --- | --- | --- |
| Not Applicable | IDTS Bug Report | Fiori/UI5 |
| Not Applicable | IDTS Bug Report | SAP CAP Backend |
| FI | Custom FI Fiori App | Authorization |
| MM | Procurement Workflow | Workflow |

Example responsibility:

| Developer | SAPModule scope | ApplicationComponent | DefectCategory |
| --- | --- | --- | --- |
| Dev A | Not Applicable | IDTS Bug Report | Fiori/UI5 |
| Dev B | Not Applicable | IDTS Bug Report | SAP CAP Backend |
| Dev C | FI | Custom FI Fiori App | Authorization |

Implementation rule:

- `SAPModuleComponent` is the bridge between `SAPModule` and `ApplicationComponent` when the UI needs to filter components by selected SAP module.
- `ComponentCategory` is the bridge between `ApplicationComponent` and `DefectCategory`.
- `DeveloperResponsibility` should reference `ComponentCategory`.
- `DeveloperResponsibility.sapModuleID` is optional. If filled, the developer responsibility applies only to that SAP Module. If empty, it applies regardless of SAP Module.

Relationship between `SAPModule` and `ComponentCategory`:

- They do not need a direct master-data relationship by default.
- `SAPModule` is business context.
- `ComponentCategory` is application/technical classification.
- `SAPModule` can relate to `ApplicationComponent` through `SAPModuleComponent` for Fiori value-help filtering.
- `SAPModule` does not need to relate directly to `DefectCategory`, because defect categories such as Fiori/UI5, Backend, Database, and Authorization are reusable technical classifications.
- They meet on a `Bug`: the bug may have both a selected SAP Module and a selected Component Category.
- They also meet on `DeveloperResponsibility`: a developer can be responsible for a Component Category generally, or only for that Component Category inside a specific SAP Module.

Only add a direct bridge such as `SAPModuleComponentCategory` if the business later requires strict validation that some component/category pairs are valid only for specific SAP modules.

### Tiếng Việt

Hệ thống nên tách phần "cặp phân loại hợp lệ" và phần "trách nhiệm của Developer".

| Object | Câu hỏi nghiệp vụ |
| --- | --- |
| `SAPModule` | Có liên quan đến functional area SAP nào không? |
| `ApplicationComponent` | Bug xuất hiện ở component/chức năng nào? |
| `SAPModuleComponent` | Application Component này có liên quan đến SAP Module này không? |
| `DefectCategory` | Bug thuộc loại/lớp kỹ thuật nào? |
| `ComponentCategory` | Defect Category này có hợp lệ với Application Component này không? |
| `DeveloperProfile` | Ai là người có thể nhận bug? |
| `DeveloperResponsibility` | Developer nào xử lý được Component Category này, có thể giới hạn theo SAP Module cụ thể? |

Ví dụ phân loại:

| SAPModule | ApplicationComponent | DefectCategory |
| --- | --- | --- |
| Not Applicable | IDTS Bug Report | Fiori/UI5 |
| Not Applicable | IDTS Bug Report | SAP CAP Backend |
| FI | Custom FI Fiori App | Authorization |
| MM | Procurement Workflow | Workflow |

Ví dụ trách nhiệm:

| Developer | Phạm vi SAPModule | ApplicationComponent | DefectCategory |
| --- | --- | --- | --- |
| Dev A | Not Applicable | IDTS Bug Report | Fiori/UI5 |
| Dev B | Not Applicable | IDTS Bug Report | SAP CAP Backend |
| Dev C | FI | Custom FI Fiori App | Authorization |

Rule triển khai:

- `SAPModuleComponent` là bảng nối giữa `SAPModule` và `ApplicationComponent` khi UI cần lọc component theo SAP module đã chọn.
- `ComponentCategory` là bảng nối giữa `ApplicationComponent` và `DefectCategory`.
- `DeveloperResponsibility` nên reference đến `ComponentCategory`.
- `DeveloperResponsibility.sapModuleID` là optional. Nếu có giá trị, trách nhiệm của Developer chỉ áp dụng cho SAP Module đó. Nếu trống, trách nhiệm áp dụng không phụ thuộc SAP Module.

Quan hệ giữa `SAPModule` và `ComponentCategory`:

- Mặc định không cần quan hệ master-data trực tiếp.
- `SAPModule` là ngữ cảnh nghiệp vụ.
- `ComponentCategory` là phân loại application/kỹ thuật.
- `SAPModule` có thể liên hệ với `ApplicationComponent` thông qua `SAPModuleComponent` để Fiori lọc value help.
- `SAPModule` không cần liên hệ trực tiếp với `DefectCategory`, vì các defect category như Fiori/UI5, Backend, Database và Authorization là phân loại kỹ thuật có thể dùng lại ở nhiều nơi.
- Chúng gặp nhau trên `Bug`: bug có thể vừa có SAP Module được chọn, vừa có Component Category được chọn.
- Chúng cũng gặp nhau trên `DeveloperResponsibility`: Developer có thể phụ trách một Component Category nói chung, hoặc chỉ phụ trách Component Category đó trong một SAP Module cụ thể.

Chỉ nên thêm bảng nối trực tiếp như `SAPModuleComponentCategory` nếu sau này business yêu cầu validate chặt rằng một số cặp component/category chỉ hợp lệ cho một số SAP module cụ thể.

## 8. Fiori UI Pattern for Classification and Assignment

### English

Recommended Fiori create/edit form flow:

1. Choose `SAP Module` only if the defect belongs to a SAP functional area. For pure IDTS defects, use empty or "Not Applicable".
2. Choose `Application Component`; the value help is filtered by selected SAP Module through `SAPModuleComponent`. For "Not Applicable", show general/IDTS components.
3. Choose `Defect Category`; the value help is filtered by the selected Application Component through `ComponentCategory`.
4. Choose `Assignee`; the value help is filtered by `DeveloperResponsibility` using the selected Component Category and optional SAP Module.

Backend CAP validation must still enforce the rule, even if the UI filters values.

### Tiếng Việt

Luồng create/edit form Fiori nên là:

1. Chọn `SAP Module` chỉ khi defect thuộc functional area của SAP. Với bug thuần IDTS, để trống hoặc chọn "Not Applicable".
2. Chọn `Application Component`; value help được lọc theo SAP Module đã chọn thông qua `SAPModuleComponent`. Với "Not Applicable", hiển thị các component chung/IDTS.
3. Chọn `Defect Category`; value help được lọc theo Application Component thông qua `ComponentCategory`.
4. Chọn `Assignee`; value help được lọc bằng `DeveloperResponsibility` dựa trên Component Category đã chọn và SAP Module nếu có.

Backend CAP vẫn phải validate rule này, kể cả khi UI đã lọc sẵn.

## 9. SAP BTP, HANA Cloud, PostgreSQL, and XSUAA

### English

SAP BTP is a possible deployment platform. It can provide services such as XSUAA for authentication, HANA Cloud for database, alert/notification services, and SAP Build Process Automation.

The repo currently uses SQLite for local development. The CAP model should avoid database-specific shortcuts so the project can move to HANA Cloud or PostgreSQL later.

XSUAA is optional for the current phase. If added later, it should help control what each role can do:

- Tester/Admin/Reporter creates and updates bug reports.
- Developer reviews assigned bugs and updates status.
- PM monitors all bugs, workload, overdue cases, and escalation.

### Tiếng Việt

SAP BTP là nền tảng có thể dùng khi deploy. Nó có thể cung cấp các service như XSUAA cho authentication, HANA Cloud cho database, alert/notification services và SAP Build Process Automation.

Repo hiện đang dùng SQLite cho local development. CAP model nên tránh các shortcut phụ thuộc database để sau này có thể chuyển sang HANA Cloud hoặc PostgreSQL dễ hơn.

XSUAA hiện là optional. Nếu thêm sau này, nó nên hỗ trợ kiểm soát quyền theo role:

- Tester/Admin/Reporter tạo và cập nhật bug report.
- Developer review bug được assign và cập nhật status.
- PM theo dõi toàn bộ bug, workload, overdue và escalation.

## 10. Fiori Status Semantics

### English

SAP Fiori uses semantic colors to make status easier to scan.

For IDTS:

- Positive: Resolved, Closed.
- Critical: Pending Assignment, Need More Information, Overdue.
- Negative: Rejected and blocking errors.
- Neutral or informational: New, Assigned, In Review, In Progress.

These colors should guide UI annotations and status indicators, but backend validation still belongs in CAP.

### Tiếng Việt

SAP Fiori dùng semantic colors để người dùng đọc trạng thái nhanh hơn.

Với IDTS:

- Positive: Resolved, Closed.
- Critical: Pending Assignment, Need More Information, Overdue.
- Negative: Rejected và các lỗi blocking.
- Neutral hoặc informational: New, Assigned, In Review, In Progress.

Các màu này nên được dùng cho UI annotations và status indicators, nhưng validation backend vẫn phải nằm trong CAP.

## 11. Skill and MCP Usage Note

### English

For the update that corrected SAP Module versus IDTS Application Component modeling, no skill, MCP server, or MCP tool was used. The work was a BA/domain modeling correction and documentation update.

### Tiếng Việt

Với lần cập nhật sửa lại cách model giữa SAP Module và IDTS Application Component, không dùng skill, MCP server hoặc MCP tool. Đây là chỉnh sửa BA/domain modeling và tài liệu.

## 12. Next Processor vs Assignee in IDTS

### English

`nextProcessor` is not a new business role. It is the current person who is expected to take the next action on a bug.

`assignee` means the developer assigned to handle the defect technically. It normally stays the same while the developer is reviewing or resolving the bug.

`nextProcessor` can change as the workflow moves:

- `New`: Reporter/Admin prepares or submits the bug.
- `Pending Assignment`: PM or Reporter/Admin must find a suitable developer.
- `Assigned`, `In Review`, `In Progress`: Developer is expected to review or process the bug.
- `Need More Information`: Reporter/Tester/Admin must provide missing information.
- `Rejected`: Reporter/Admin or PM must correct classification, add information, reassign, or move the bug to Pending Assignment. It is a follow-up status, not a final status.
- `Resolved`: Reporter/Tester/PM must decide whether retest is needed.
- `Retest Required`: Reporter/Tester/PM must verify the resolution.
- `Reopened`: Reporter/Admin or the assigned Developer becomes the next processor depending on whether reclassification/reassignment is needed.
- `Closed`: no next processor is needed.

In the UI, `nextProcessor` should support "My Action Items", notifications, and PM monitoring. It should not replace `assignee`. CAP handlers should update it during status transitions and write the change to history logs.

Recommended automation rule:

- `nextProcessor` should be set automatically by backend CAP handlers when status, assignee, or assignment decision changes.
- Manual override should be limited to PM/Admin use cases, such as escalation or exceptional reassignment.
- If the next owner is a role or queue instead of one exact person, keep `nextProcessor` empty or add a separate future field such as `nextProcessorRole`. For MVP, status-based queues are enough: `Pending Assignment` appears in the PM queue, and `Need More Information` appears in the Reporter/Tester action list.
- Every automatic change should create a history log so users can see why responsibility moved.

### Tiếng Việt

`nextProcessor` không phải là một role nghiệp vụ mới. Nó là người hiện đang được kỳ vọng phải làm hành động tiếp theo trên bug.

`assignee` là developer được assign để xử lý defect về mặt kỹ thuật. Thường thì `assignee` giữ nguyên trong lúc developer review hoặc xử lý bug.

`nextProcessor` có thể thay đổi theo workflow:

- `New`: Reporter/Admin chuẩn bị hoặc submit bug.
- `Pending Assignment`: PM hoặc Reporter/Admin phải tìm developer phù hợp.
- `Assigned`, `In Review`, `In Progress`: Developer cần review hoặc xử lý bug.
- `Need More Information`: Reporter/Tester/Admin phải bổ sung thông tin.
- `Rejected`: Reporter/Admin hoặc PM phải sửa classification, bổ sung thông tin, reassign hoặc chuyển bug về Pending Assignment. Đây là status cần follow-up, không phải final status.
- `Resolved`: Reporter/Tester/PM phải quyết định có cần retest không.
- `Retest Required`: Reporter/Tester/PM phải kiểm tra lại kết quả.
- `Reopened`: Reporter/Admin hoặc Developer đang được assign sẽ là next processor, tùy bug có cần phân loại/assign lại hay không.
- `Closed`: không cần next processor nữa.

Trên UI, `nextProcessor` nên dùng cho "My Action Items", notification, và PM monitoring. Nó không thay thế `assignee`. CAP handler nên cập nhật trường này khi status chuyển đổi và ghi thay đổi vào history log.

Rule tự động được khuyến nghị:

- `nextProcessor` nên được set tự động bởi backend CAP handler khi status, assignee, hoặc quyết định assignment thay đổi.
- Chỉ nên cho PM/Admin override thủ công trong các trường hợp đặc biệt như escalation hoặc reassign ngoại lệ.
- Nếu người xử lý tiếp theo là một role/queue chứ không phải một người cụ thể, có thể để `nextProcessor` trống hoặc sau này thêm field riêng như `nextProcessorRole`. Với MVP, queue suy ra từ status là đủ: `Pending Assignment` nằm trong queue của PM, còn `Need More Information` nằm trong action list của Reporter/Tester.
- Mọi thay đổi tự động nên tạo history log để người dùng thấy vì sao trách nhiệm được chuyển.
