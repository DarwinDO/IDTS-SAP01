# IDTS SRS Guidelines Aligned with ISO/IEC/IEEE 29148

## English

Use this reference before creating or reviewing IDTS SRS deliverables. It adapts ISO/IEC/IEEE 29148-style requirements engineering principles to the IDTS SAP490 hybrid project context. It does not copy the standard text and does not replace the official standard.

Official references:

- ISO/IEC/IEEE 29148:2018, Systems and software engineering, life cycle processes, requirements engineering: https://www.iso.org/standard/72089.html
- IEEE/ISO/IEC 29148-2018: https://standards.ieee.org/ieee/29148/6937/
- IEEE 830-1998 status page, superseded by ISO/IEC/IEEE 29148:2011: https://standards.ieee.org/ieee/830/1222/

### Position for IDTS

For IDTS, write the SRS as a software requirements document that is readable like a traditional SRS but governed by modern requirements quality rules:

- Use a clear SRS structure for mentor review.
- Use ISO/IEC/IEEE 29148-style requirement quality, traceability, and verification discipline.
- Keep SAP490 hybrid context visible.
- Keep BRD business-first and FRS function-detail-first; SRS sits between them.

Do not write "SRS follows IEEE 830" as the main standard. Prefer:

> This SRS uses a traditional SRS outline for readability and aligns requirement quality, traceability, and verification with ISO/IEC/IEEE 29148 and the SAP490 hybrid delivery context.

### SRS vs BRD vs FRS

| Document | Purpose in IDTS | What to Include | What to Avoid |
| --- | --- | --- | --- |
| BRD | Business need and scope | Business objectives, stakeholders, scope, high-level requirements, risks, KPIs | Detailed CAP handlers, OData actions, Fiori annotations |
| SRS | Software-level requirements | Software capabilities, interfaces, data expectations, role/security requirements, NFRs, traceability, verification method | Pixel-level UI, full process scripts, implementation code |
| FRS | Detailed functional behavior | Step-by-step flows, field behavior, validations, status action rules, UI behavior, acceptance criteria | Business case narrative already covered by BRD |

### IDTS SRS Structure

Use this structure unless the school template requires a different order:

1. Document control
2. Purpose, scope, and audience
3. References and source documents
4. Product context and SAP490 hybrid positioning
5. User classes and role responsibilities
6. Assumptions, constraints, and dependencies
7. Requirement classification and ID conventions
8. Functional software requirements by capability
9. Data requirements
10. External interface and UI interface requirements
11. Non-functional requirements
12. Security, authorization, audit, and notification requirements
13. Traceability matrix
14. Verification approach
15. Open issues and decisions
16. Glossary

### Requirement Quality Rules

Every SRS requirement should be:

- Necessary: needed for the approved IDTS scope.
- Clear: one reasonable interpretation.
- Atomic: one requirement per statement.
- Verifiable: has a practical verification method.
- Traceable: links back to BRD/source and forward to FRS/test.
- Feasible: suitable for CAP/Fiori MVP implementation.
- Consistent: does not conflict with status lifecycle, roles, or business rules.
- Bounded: does not expand IDTS into Jira, SAP Cloud ALM, CI/CD, code review, or source-code management.

### Requirement Record Template

Use a table like this for SRS requirement sections:

| Field | Meaning |
| --- | --- |
| ID | Stable identifier, for example `SRS-FR-ASSIGN-001`. |
| Source | BRD requirement, business rule, mentor decision, diagram, or project context. |
| Type | Functional, data, interface, security, audit, notification, reporting, or NFR. |
| Requirement Statement | One clear "shall" statement. |
| Priority | Must, Should, Could, Won't for MVP. |
| Owner | Business owner or role responsible for confirming the requirement. |
| Verification Method | Inspection, demonstration, test, or analysis. |
| Trace To | Related FRS item, test case, CAP/Fiori artifact, or open TBD. |
| Status | Draft, reviewed, approved, deferred, or rejected. |

### Requirement Statement Pattern

Use "shall" for mandatory requirements:

```text
IDTS shall [perform capability] for [actor/object] when [condition] so that [observable outcome or rule] can be verified.
```

Examples:

| ID | Requirement Statement | Source | Verification |
| --- | --- | --- | --- |
| `SRS-FR-ASSIGN-001` | IDTS shall filter Developer candidates by selected Component Category and optional SAP Module when a bug is assigned. | `BRD-BR-004`, `BR-RULE-005` | Demonstration and test |
| `SRS-FR-STATUS-001` | IDTS shall require a rejection reason and nextProcessor before a bug can enter Rejected status. | `BRD-BR-008`, `DEC-008` | Test |
| `SRS-DATA-BUG-001` | IDTS shall store the selected Application Component and Defect Category for every bug record. | `BRD-BR-003` | Inspection and test |
| `SRS-NFR-AUD-001` | IDTS shall record actor, timestamp, action, and reason where applicable for important lifecycle changes. | `BRD-BR-011` | Inspection and test |

### ID Prefixes for IDTS

Use these prefixes for consistency:

| Prefix | Area |
| --- | --- |
| `SRS-FR-BUG` | Bug creation and duplicate support |
| `SRS-FR-CLASS` | SAP Module, Application Component, Defect Category, Component Category |
| `SRS-FR-ASSIGN` | Developer Responsibility, assignment, reassignment, Pending Assignment |
| `SRS-FR-STATUS` | Status lifecycle, Rejected follow-up, Retest Required, Closed/Reopened |
| `SRS-FR-COMMENT` | Comments and collaboration |
| `SRS-FR-AUDIT` | History log and audit trail |
| `SRS-FR-NOTIF` | Notification records and event triggers |
| `SRS-FR-PM` | PM monitoring, workload, overdue, queues |
| `SRS-DATA` | Data requirements and entity expectations |
| `SRS-IF` | UI/API/interface expectations |
| `SRS-NFR` | Non-functional requirements |

### Traceability Rules

Traceability should flow like this:

```text
BRD business requirement
  -> SRS software requirement
  -> FRS functional detail
  -> test case / verification evidence
  -> implementation artifact when available
```

For IDTS, always trace these critical topics:

- Duplicate checking support.
- SAP Module vs Application Component vs Defect Category.
- Component Category.
- Developer Responsibility.
- Pending Assignment.
- Rejected follow-up with reason and nextProcessor.
- Retest Required before closure.
- Comment, notification, and history log behavior.
- PM workload and overdue monitoring.

### Verification Methods

Use one or more:

| Method | Use When |
| --- | --- |
| Inspection | Review document, data, annotation, generated page, or stored record. |
| Demonstration | Show a Fiori flow or CAP service behavior manually. |
| Test | Run automated or manual test cases with expected results. |
| Analysis | Evaluate derived output, workload calculation, overdue logic, or traceability coverage. |

### What Not to Put in SRS

Do not put these in SRS unless the school template explicitly requires it:

- Source code.
- Full CAP handler implementation.
- Full CDS field-by-field design when it belongs in technical design.
- Pixel-perfect Fiori screen layout.
- Full UI5 controller logic.
- CI/CD, source control, code review, or release pipeline details.
- Mandatory AI root cause analysis.

## Vietnamese

Dùng reference này trước khi tạo hoặc review deliverable SRS của IDTS. Nội dung này điều chỉnh các nguyên tắc requirements engineering theo hướng ISO/IEC/IEEE 29148 cho bối cảnh IDTS SAP490 hybrid. Reference này không copy nội dung chuẩn và không thay thế chuẩn chính thức.

Nguồn chính thức:

- ISO/IEC/IEEE 29148:2018, Systems and software engineering, life cycle processes, requirements engineering: https://www.iso.org/standard/72089.html
- IEEE/ISO/IEC 29148-2018: https://standards.ieee.org/ieee/29148/6937/
- Trang trạng thái IEEE 830-1998, đã được thay thế bởi ISO/IEC/IEEE 29148:2011: https://standards.ieee.org/ieee/830/1222/

### Vị Trí Của SRS Trong IDTS

Với IDTS, viết SRS như tài liệu software requirements có cấu trúc dễ đọc kiểu SRS truyền thống, nhưng chất lượng requirement phải theo hướng hiện đại:

- Dùng cấu trúc SRS rõ ràng để mentor dễ review.
- Dùng tư duy ISO/IEC/IEEE 29148 về quality, traceability, và verification của requirement.
- Giữ bối cảnh SAP490 hybrid.
- BRD ưu tiên nghiệp vụ, FRS ưu tiên functional detail; SRS nằm giữa hai tài liệu này.

Không nên ghi "SRS follows IEEE 830" như chuẩn chính. Nên dùng:

> This SRS uses a traditional SRS outline for readability and aligns requirement quality, traceability, and verification with ISO/IEC/IEEE 29148 and the SAP490 hybrid delivery context.

### SRS Khác BRD Và FRS Như Thế Nào

| Tài liệu | Mục đích trong IDTS | Nên có | Không nên có |
| --- | --- | --- | --- |
| BRD | Nhu cầu nghiệp vụ và scope | Business objectives, stakeholders, scope, high-level requirements, risks, KPIs | CAP handler chi tiết, OData action chi tiết, Fiori annotation |
| SRS | Software-level requirements | Software capabilities, interfaces, data expectations, role/security requirements, NFRs, traceability, verification method | UI pixel-level, process script quá chi tiết, code implementation |
| FRS | Functional behavior chi tiết | Step-by-step flows, field behavior, validations, status action rules, UI behavior, acceptance criteria | Business case narrative đã có trong BRD |

### Cấu Trúc SRS Cho IDTS

Dùng cấu trúc này trừ khi template nhà trường bắt buộc thứ tự khác:

1. Document control
2. Purpose, scope, and audience
3. References and source documents
4. Product context and SAP490 hybrid positioning
5. User classes and role responsibilities
6. Assumptions, constraints, and dependencies
7. Requirement classification and ID conventions
8. Functional software requirements by capability
9. Data requirements
10. External interface and UI interface requirements
11. Non-functional requirements
12. Security, authorization, audit, and notification requirements
13. Traceability matrix
14. Verification approach
15. Open issues and decisions
16. Glossary

### Rule Chất Lượng Requirement

Mỗi SRS requirement nên:

- Necessary: cần thiết cho scope IDTS đã duyệt.
- Clear: chỉ có một cách hiểu hợp lý.
- Atomic: một statement chỉ chứa một requirement.
- Verifiable: có cách verify thực tế.
- Traceable: trace được về BRD/source và đi tiếp sang FRS/test.
- Feasible: phù hợp triển khai CAP/Fiori MVP.
- Consistent: không mâu thuẫn với status lifecycle, role, hoặc business rule.
- Bounded: không mở rộng IDTS thành Jira, SAP Cloud ALM, CI/CD, code review, hoặc source-code management.

### Template Cho Mỗi Requirement

Dùng bảng như sau trong các section SRS:

| Field | Ý nghĩa |
| --- | --- |
| ID | Mã ổn định, ví dụ `SRS-FR-ASSIGN-001`. |
| Source | BRD requirement, business rule, mentor decision, diagram, hoặc project context. |
| Type | Functional, data, interface, security, audit, notification, reporting, hoặc NFR. |
| Requirement Statement | Một câu "shall" rõ ràng. |
| Priority | Must, Should, Could, Won't for MVP. |
| Owner | Business owner hoặc role xác nhận requirement. |
| Verification Method | Inspection, demonstration, test, hoặc analysis. |
| Trace To | FRS item, test case, CAP/Fiori artifact liên quan, hoặc open TBD. |
| Status | Draft, reviewed, approved, deferred, hoặc rejected. |

### Pattern Viết Requirement

Dùng "shall" cho requirement bắt buộc:

```text
IDTS shall [perform capability] for [actor/object] when [condition] so that [observable outcome or rule] can be verified.
```

Ví dụ:

| ID | Requirement Statement | Source | Verification |
| --- | --- | --- | --- |
| `SRS-FR-ASSIGN-001` | IDTS shall filter Developer candidates by selected Component Category and optional SAP Module when a bug is assigned. | `BRD-BR-004`, `BR-RULE-005` | Demonstration and test |
| `SRS-FR-STATUS-001` | IDTS shall require a rejection reason and nextProcessor before a bug can enter Rejected status. | `BRD-BR-008`, `DEC-008` | Test |
| `SRS-DATA-BUG-001` | IDTS shall store the selected Application Component and Defect Category for every bug record. | `BRD-BR-003` | Inspection and test |
| `SRS-NFR-AUD-001` | IDTS shall record actor, timestamp, action, and reason where applicable for important lifecycle changes. | `BRD-BR-011` | Inspection and test |

### ID Prefix Cho IDTS

Dùng các prefix này cho nhất quán:

| Prefix | Khu vực |
| --- | --- |
| `SRS-FR-BUG` | Bug creation và duplicate support |
| `SRS-FR-CLASS` | SAP Module, Application Component, Defect Category, Component Category |
| `SRS-FR-ASSIGN` | Developer Responsibility, assignment, reassignment, Pending Assignment |
| `SRS-FR-STATUS` | Status lifecycle, Rejected follow-up, Retest Required, Closed/Reopened |
| `SRS-FR-COMMENT` | Comments và collaboration |
| `SRS-FR-AUDIT` | History log và audit trail |
| `SRS-FR-NOTIF` | Notification records và event triggers |
| `SRS-FR-PM` | PM monitoring, workload, overdue, queues |
| `SRS-DATA` | Data requirements và entity expectations |
| `SRS-IF` | UI/API/interface expectations |
| `SRS-NFR` | Non-functional requirements |

### Rule Traceability

Traceability nên đi theo chuỗi:

```text
BRD business requirement
  -> SRS software requirement
  -> FRS functional detail
  -> test case / verification evidence
  -> implementation artifact when available
```

Với IDTS, luôn trace các chủ đề quan trọng này:

- Duplicate checking support.
- SAP Module vs Application Component vs Defect Category.
- Component Category.
- Developer Responsibility.
- Pending Assignment.
- Rejected follow-up với reason và nextProcessor.
- Retest Required trước khi closure.
- Comment, notification, và history log behavior.
- PM workload và overdue monitoring.

### Verification Methods

Dùng một hoặc nhiều phương pháp:

| Method | Khi nào dùng |
| --- | --- |
| Inspection | Review document, data, annotation, generated page, hoặc stored record. |
| Demonstration | Demo một flow Fiori hoặc hành vi CAP service thủ công. |
| Test | Chạy automated hoặc manual test case với expected result. |
| Analysis | Đánh giá derived output, workload calculation, overdue logic, hoặc traceability coverage. |

### Không Nên Đưa Gì Vào SRS

Không đưa các phần sau vào SRS, trừ khi template nhà trường yêu cầu rõ:

- Source code.
- Full CAP handler implementation.
- Full CDS field-by-field design khi phần đó thuộc technical design.
- Pixel-perfect Fiori screen layout.
- Full UI5 controller logic.
- CI/CD, source control, code review, hoặc release pipeline detail.
- Mandatory AI root cause analysis.
