# Tài liệu Yêu cầu Nghiệp vụ

Dự án: Issue and Defect Tracking System in SAP  
Loại tài liệu: Business Requirements Document (BRD)  
Ngôn ngữ: Tiếng Việt  
Trạng thái: Draft v1.2  
Cập nhật lần cuối: 2026-06-03  
Chuẩn bị cho: SAP490 project delivery và mentor review  
Phong cách tài liệu: SAP490 hybrid, ưu tiên nghiệp vụ và chỉ giữ bối cảnh triển khai SAP ở mức ngắn gọn

## 1. Kiểm soát tài liệu

### 1.1 Lịch sử phiên bản

| Phiên bản | Ngày | Người viết | Người review | Tóm tắt thay đổi | Trạng thái duyệt |
| --- | --- | --- | --- | --- | --- |
| v1.0 | 2026-06-01 | IDTS Project Team | Mentor / Supervisor | Bản BRD đầu tiên dựa trên IDTS business baseline, BA pack, PM pack và SAP490 guidance. | Draft |
| v1.1 | 2026-06-01 | IDTS Project Team | Mentor / Supervisor | Chỉnh thành SAP490 hybrid BRD: giảm chi tiết kỹ thuật, thêm stakeholder needs, KPI, RACI, NFR, glossary, approval và requirement traceability. | Draft |
| v1.2 | 2026-06-03 | IDTS Project Team | Mentor / Supervisor | Cập nhật MVP role baseline thành ba role active: Tester, Developer và PM. Reporter và Admin được hoãn như role tách riêng và không còn là cột RACI active trong MVP. | Draft |

### 1.2 Review và phê duyệt

| Vai trò | Tên | Trách nhiệm | Trạng thái | Ngày |
| --- | --- | --- | --- | --- |
| Prepared by | IDTS Project Team | Chuẩn bị và duy trì BRD | Drafted | 2026-06-01 |
| Reviewed by | Mentor / Supervisor | Review scope nghiệp vụ và mức độ phù hợp SAP490 | Pending | TBD |
| Approved by | Mentor / Supervisor | Phê duyệt BRD baseline cho SRS/FRS | Pending | TBD |
| Project owner | Team / PM | Xác nhận MVP scope và priority triển khai | Pending | TBD |

### 1.3 Mục đích tài liệu

BRD này định nghĩa nhu cầu nghiệp vụ, mục tiêu, stakeholder, phạm vi, yêu cầu nghiệp vụ cấp cao, business rule, rủi ro và tiêu chí thành công cho Issue and Defect Tracking System in SAP (IDTS). Tài liệu dùng để thống nhất giữa nhóm dự án và mentor trước khi đi vào SRS, FRS, technical design và triển khai SAP CAP/Fiori.

Đây là BRD theo hướng SAP490 hybrid. Tài liệu vẫn ưu tiên góc nhìn nghiệp vụ, đồng thời ghi nhận ngắn gọn rằng định hướng triển khai dự kiến là SAP CAP Node.js, OData V4, SAP Fiori Elements/SAPUI5 và SQLite cho local development. Thiết kế kỹ thuật chi tiết sẽ thuộc SRS, FRS, architecture và implementation documents sau này.

## 2. Tóm tắt điều hành

IDTS là hệ thống theo dõi defect tập trung cho môi trường kiểm thử phần mềm SAP. Mục đích nghiệp vụ là giúp nhóm ghi nhận, phân loại, phân công, review, theo dõi, retest, close, audit và monitor các bug/defect phát hiện trong quá trình kiểm thử liên quan SAP.

Vấn đề nghiệp vụ chính là defect có thể bị tạo trùng, assign sai người, bị quên sau khi reject, bị close trước khi xác minh đúng hoặc chỉ được theo dõi thủ công mà không rõ owner. IDTS giải quyết vấn đề này bằng workflow có kiểm soát cho các trách nhiệm Tester, Developer và PM.

IDTS được giới hạn phạm vi rõ ràng. Hệ thống không phải Jira đầy đủ, không phải SAP Cloud ALM, không phải SAP Solution Manager, không phải ServiceNow, không phải công cụ quản lý source code và không phải workflow CI/CD hoặc code review. Developer dùng IDTS để review bug được assign, request thêm thông tin, reject assignment hoặc classification không phù hợp kèm lý do, thêm note và cập nhật trạng thái xử lý. Developer không sửa source code trực tiếp bên trong IDTS.

## 3. Bối cảnh và động lực nghiệp vụ

Trong các dự án phần mềm SAP, defect có thể xuất hiện ở hành vi của SAP business module, custom Fiori application, CAP backend service, authorization, database behavior, integration, reporting hoặc notification. Nếu các defect này được theo dõi bằng ghi chú rời rạc, tin nhắn thủ công hoặc spreadsheet không chính thức, nhóm dễ mất traceability và PM khó theo dõi rủi ro.

Dự án cần một workflow defect có cấu trúc, đủ nhỏ để phù hợp SAP490 nhưng đủ rõ để thể hiện business analysis, thiết kế ứng dụng theo hướng SAP, xử lý theo role, auditability và trải nghiệm người dùng sẵn sàng cho Fiori.

| Business Driver | Mô tả | Ảnh hưởng nếu không xử lý |
| --- | --- | --- |
| Giảm bug report trùng | Tester nên kiểm tra bug hiện có trước khi tạo bug mới. | Tốn effort trùng lặp và ownership không rõ. |
| Cải thiện chất lượng assignment | Developer nên được chọn theo responsibility, không chỉ dựa vào đoán thủ công. | Assign sai người, chậm xử lý, lặp reject. |
| Duy trì traceability | Action quan trọng phải nhìn lại được qua history log. | Mentor/team không chứng minh được ai đã làm gì, khi nào và vì sao. |
| Làm rõ người cần xử lý tiếp | Mỗi bug đang active nên thể hiện ai cần hành động tiếp theo. | Bug có thể bị kẹt sau reject, request information hoặc pending assignment. |
| Cải thiện PM monitoring | PM cần thấy workload, overdue bug và bottleneck. | Rủi ro dự án bị phát hiện muộn. |
| Phù hợp SAP490 delivery | Deliverable phải thể hiện scope theo hướng SAP và khả năng triển khai. | Báo cáo cuối kỳ có thể không khớp kỳ vọng của mentor/trường. |

## 4. Phát biểu vấn đề nghiệp vụ

Baseline hiện tại xác định các vấn đề nghiệp vụ chính:

- Bug report cần có cấu trúc nhất quán trước khi nhóm có thể xử lý.
- Bug report có thể bị tạo trùng khi không kiểm tra bug hiện có.
- Một field mơ hồ như "module/category" không đủ rõ cho phân loại defect trong bối cảnh SAP.
- SAP Module, Application Component và Defect Category có thể bị hiểu sai nếu không tách riêng.
- Developer có thể nhận bug ngoài phạm vi trách nhiệm.
- Bug hợp lệ chưa có Developer phù hợp cần trạng thái Pending Assignment rõ ràng.
- Developer cần cách có kiểm soát để request thêm thông tin hoặc reject assignment không phù hợp.
- Bug bị Rejected không được trở thành điểm dừng; nó cần lý do, owner follow-up và action tiếp theo.
- PM cần thấy workload, overdue bugs, pending assignment, rejected follow-up và current action ownership.
- Các hành động nghiệp vụ quan trọng cần audit/history log và notification record.

## 5. Mục tiêu nghiệp vụ và cách đo lường

| Mục tiêu | Kết quả nghiệp vụ | Measurement / KPI | MVP target |
| --- | --- | --- | --- |
| Số hóa defect reporting | Bug report được tạo theo cấu trúc thống nhất. | % bug submitted có đủ thông tin bắt buộc. | 100% bug tạo mới pass required-field validation. |
| Giảm defect trùng | Tester search existing bugs trước khi tạo. | Flow tạo bug có bước duplicate search. | Creation flow có search/filter support. |
| Cải thiện chất lượng phân loại | Bug dùng các chiều phân loại rõ ràng. | % bug có Application Component và Defect Category. | 100% với các field phân loại bắt buộc. |
| Tăng độ chính xác assignment | Developer list dựa trên responsibility mapping. | Candidate assignee được lọc theo Component Category và SAP Module nếu có. | Có filtered developer selection. |
| Tránh bug hợp lệ không có owner | Bug chưa có Developer phù hợp vẫn được theo dõi. | Bug có thể vào Pending Assignment queue. | Có Pending Assignment queue. |
| Tránh dead end sau reject | Bug rejected có reason, nextProcessor và next action. | % rejected bugs có đầy đủ follow-up data. | 100%. |
| Cải thiện PM visibility | PM thấy workload, overdue, status và queue. | Có PM monitoring views/filters. | MVP monitoring views được định nghĩa và triển khai. |
| Duy trì auditability | Thay đổi quan trọng được ghi nhận. | History log có actor, timestamp, action và reason khi cần. | Có history log cho key actions. |

## 6. Stakeholders và nhu cầu

| Stakeholder | Pain Point | Nhu cầu nghiệp vụ | Kỳ vọng thành công |
| --- | --- | --- | --- |
| Tester | Bug report có thể thiếu thông tin, bị trùng, khó theo dõi hoặc bị close trước khi verify. | Cần cách tạo, theo dõi, retest, close và reopen bug report có cấu trúc. | Bug có đủ thông tin để review và assign, đồng thời Tester có thể verify trước khi close. |
| Developer | Bug có thể bị assign sai người hoặc sai area. | Cần bug detail rõ, classification đúng và có cách request information hoặc reject unsuitable assignment. | Developer có thể nhận việc, request information, reject có lý do, xử lý và resolve. |
| PM | Workload, overdue bugs, rejected bugs và bottleneck có thể không rõ. | Cần monitoring views cho ownership, queues, workload và risk. | PM nhanh chóng nhận diện unassigned, overdue, rejected và blocked items. |

Reporter và Admin không phải stakeholder tách riêng trong MVP. Tester đảm nhiệm trách nhiệm reporting nội bộ, còn trách nhiệm quản trị nhẹ do Tester hoặc PM xử lý theo quyền được cấp. Role Reporter và Admin chuyên biệt có thể xem xét lại sau MVP nếu dự án mở rộng sang báo cáo từ bên ngoài hoặc quản trị master data chính thức.
| Mentor / Supervisor | Scope và deliverable phải rõ và liên quan SAP. | Cần business documents, diagrams, implementation artifacts và test evidence phù hợp SAP490. | BRD/SRS/FRS và implementation outputs nhất quán và review được. |

## 7. Roles và RACI

| Hoạt động | Tester | Developer | PM | Mentor / Supervisor |
| --- | --- | --- | --- | --- |
| Create bug report | R | I | I | I |
| Check duplicate bug | R | I | I | I |
| Maintain classification master data | R | C | A | I |
| Classify bug | R | C | C | I |
| Assign or reassign Developer | R | C | A | I |
| Review assigned bug | I | R | I | I |
| Request more information | I | R | C | I |
| Respond to information request | R | I | I | I |
| Reject unsuitable assignment/classification | I | R | C | I |
| Handle rejected follow-up | R | C | A | I |
| Resolve bug | I | R | I | I |
| Retest resolved bug | R | C | C | I |
| Close or reopen bug | R | I | C | I |
| Monitor workload and overdue bugs | I | I | R | I |
| Approve project deliverables | I | I | C | A |

Chú thích: R = Responsible, A = Accountable, C = Consulted, I = Informed.

Trong MVP, một người dùng thực tế có thể đảm nhận nhiều trách nhiệm, nhưng chỉ Tester, Developer và PM là role active của ứng dụng.

## 8. Hiện trạng

Repository hiện tại có scaffold SAP CAP/Fiori tối thiểu. Implementation hiện có nhỏ hơn business baseline đã thống nhất. Các business markdown files, BA documents, PM documents, diagrams và SAP490 guidance đã mô tả scope defect tracking mục tiêu, nhưng BRD chính thức đang được tinh chỉnh để trở thành nguồn đầu vào cho SRS và FRS.

Nếu chưa có hệ thống mục tiêu, nhóm sẽ dựa vào phối hợp thủ công, comment, ghi chú không chính thức hoặc file ngoài. Điều này tạo rủi ro bug bị trùng, assign sai, ownership không rõ, dùng status không nhất quán, rejected bug không có follow-up và thiếu audit trail.

## 9. Trạng thái tương lai

Business process mục tiêu cần hỗ trợ flow đầu-cuối sau:

1. Tester phát hiện defect.
2. Tester search existing bugs để giảm duplicate.
3. Tester tạo hoặc cập nhật bug report có cấu trúc.
4. Tester chọn SAP Module khi liên quan, Application Component và Defect Category.
5. Hệ thống hỗ trợ lọc Developer candidate bằng Developer Responsibility.
6. Tester submit bug dưới dạng Assigned hoặc Pending Assignment.
7. Developer review bug được assign và bắt đầu xử lý.
8. Developer có thể request more information, reject kèm reason, progress bug hoặc mark Resolved.
9. Tester hoặc PM xử lý rejected follow-up bằng cách sửa dữ liệu, bổ sung thông tin, reassign hoặc chuyển Pending Assignment.
10. Tester hoặc PM verify resolved bugs qua Retest Required khi cần.
11. Bug được chấp nhận sẽ Closed; vấn đề chưa xử lý xong có thể Reopened.
12. PM monitor workload, overdue items, queues, rejected follow-up, nextProcessor và status progress.
13. Hệ thống ghi thay đổi quan trọng vào history logs và tạo notification records cho key events.

## 10. Phạm vi

### 10.1 Trong phạm vi

- Tạo bug/defect report có cấu trúc.
- Search existing bug trước khi tạo bug mới.
- Thông tin defect như title, description, priority, severity, environment, reproduction steps, actual result, expected result, optional evidence và optional test references.
- Phân loại theo SAP Module optional, Application Component required và Defect Category required.
- Component Category là cặp hợp lệ giữa Application Component và Defect Category.
- Developer assignment dựa trên Developer Responsibility.
- Pending Assignment khi chưa có Developer phù hợp.
- Developer review, request more information, reject có reason, update status, note và resolution.
- Rejected follow-up do Tester hoặc PM xử lý.
- Retest trước closure khi cần verification.
- Comment gắn với bug.
- Notification records cho important events.
- History/audit logs cho important changes.
- PM monitoring cho workload, overdue bugs, pending assignment, rejected follow-up, status progress và nextProcessor.

### 10.2 Ngoài phạm vi

- Sửa code trực tiếp bên trong IDTS.
- Quản lý source code.
- CI/CD và quản lý deployment pipeline.
- Code review workflow.
- Sprint planning và full project management.
- Thay thế Jira đầy đủ.
- Thay thế SAP Cloud ALM hoặc SAP Solution Manager đầy đủ.
- Enterprise incident management kiểu ServiceNow.
- Full test management module.
- SAP transport/release management.
- Approval workflow nhiều cấp phức tạp.
- AI root cause analysis bắt buộc.
- Hardcode SAP BTP, HANA Cloud, PostgreSQL, email, webhook hoặc private endpoint configuration.

### 10.3 Dependencies

| Dependency | Lý do |
| --- | --- |
| Xác nhận kỳ vọng SAP490 artifact với mentor | SAP490 template có thể thiên về ABAP trong khi dự án dùng SAP CAP/Fiori. |
| Data model ổn định trước khi xây Fiori | Fiori List Report/Object Page phụ thuộc entity, association, action và annotation ổn định. |
| Status transition rules rõ ràng | Backend validation và UI action phụ thuộc lifecycle đã thống nhất. |
| Developer responsibility master data | Assignment filtering phụ thuộc responsibility mapping đáng tin cậy. |
| Quyết định notification channel | MVP có thể bắt đầu bằng notification records; kênh gửi thực tế có thể để sau. |

## 11. Business capabilities

| Capability | Mô tả nghiệp vụ | MVP Priority |
| --- | --- | --- |
| Bug Reporting | Ghi nhận thông tin defect có cấu trúc tại một nơi. | P0 |
| Duplicate Support | Giúp Tester tìm bug hiện có trước khi tạo record khác. | P0 |
| Classification | Tách SAP Module, Application Component và Defect Category. | P0 |
| Developer Matching | Xác định Developer phù hợp qua responsibility mapping. | P0 |
| Assignment | Assign Developer hoặc giữ bug ở Pending Assignment. | P0 |
| Developer Review | Hỗ trợ review, request information, rejection, progress và resolution. | P0 |
| Rejected Follow-up | Đảm bảo bug rejected tiếp tục có owner và next action. | P0 |
| Retest and Closure | Verify bug resolved trước final closure khi cần. | P0 |
| Comments | Giữ trao đổi gắn với bug record. | P0 |
| History Log | Bảo toàn traceability cho important actions. | P0 |
| Notification Records | Ghi nhận notification events và intended recipients. | P0 trigger model, P1 full delivery |
| PM Monitoring | Monitor workload, overdue bugs, queues và nextProcessor ownership. | P0 |
| Attachments | Lưu evidence metadata hoặc references. | P1 |

## 12. Yêu cầu nghiệp vụ cấp cao

| ID | Business Requirement |
| --- | --- |
| BRD-BR-001 | Nghiệp vụ cần bug reporting có cấu trúc để defect có đủ thông tin cho review, assignment và verification sau này. |
| BRD-BR-002 | Nghiệp vụ cần hỗ trợ duplicate checking trước khi tạo bug để giảm report trùng và effort lặp lại. |
| BRD-BR-003 | Nghiệp vụ cần phân loại theo SAP Module optional, Application Component required và Defect Category required để tránh dùng module/category mơ hồ. |
| BRD-BR-004 | Nghiệp vụ cần Developer assignment dựa trên Developer Responsibility để bug được chuyển tới người phù hợp. |
| BRD-BR-005 | Nghiệp vụ cần bug hợp lệ chưa có Developer phù hợp vẫn được theo dõi ở Pending Assignment. |
| BRD-BR-006 | Nghiệp vụ cần Developer review bug được assign và request thêm thông tin khi report chưa đủ. |
| BRD-BR-007 | Nghiệp vụ cần quy trình rejection có kiểm soát khi assignment hoặc classification không phù hợp. |
| BRD-BR-008 | Nghiệp vụ cần bug rejected có reason, follow-up owner, nextProcessor và next action. |
| BRD-BR-009 | Nghiệp vụ cần status lifecycle có kiểm soát từ New tới Closed, bao gồm Retest Required và Reopened. |
| BRD-BR-010 | Nghiệp vụ cần comment để hỗ trợ collaboration nhưng không âm thầm thay đổi bug status. |
| BRD-BR-011 | Nghiệp vụ cần log các important actions để audit và handover. |
| BRD-BR-012 | Nghiệp vụ cần notification records cho các event quan trọng về ownership và lifecycle. |
| BRD-BR-013 | Nghiệp vụ cần PM monitoring cho workload, overdue bugs, pending assignment, rejected follow-up và nextProcessor queues. |

## 13. Tóm tắt business rules

| Rule ID | Rule |
| --- | --- |
| BR-RULE-001 | Tester chịu trách nhiệm tạo bug và chất lượng nội dung ban đầu. |
| BR-RULE-002 | Duplicate checking nên diễn ra trước khi tạo bug mới. |
| BR-RULE-003 | SAP Module là business context optional; Application Component và Defect Category là hai chiều phân loại bắt buộc. |
| BR-RULE-004 | Component Category đại diện cho cặp Application Component và Defect Category hợp lệ. |
| BR-RULE-005 | Developer Responsibility map Developer với Component Category hợp lệ và SAP Module scope nếu có. |
| BR-RULE-006 | Một bug nên có một Developer assignee chính tại một thời điểm. |
| BR-RULE-007 | nextProcessor xác định current action owner hoặc queue và không thay thế assignee. |
| BR-RULE-008 | Rejected là follow-up status hợp lệ, không phải final state. |
| BR-RULE-009 | Bug bị rejected phải có reason, history log, nextProcessor và next action. |
| BR-RULE-010 | Reassign là action/history event, không phải primary status. |
| BR-RULE-011 | Closed bug không nên được sửa tự do; reopen nên được dùng khi issue vẫn còn. |
| BR-RULE-012 | Comment không trực tiếp thay đổi status. |
| BR-RULE-013 | Thay đổi quan trọng phải được ghi vào history log. |
| BR-RULE-014 | PM monitor progress và risk nhưng không thay thế technical responsibility của Developer hoặc content responsibility của Tester. |

## 14. Tóm tắt status lifecycle

Các status chính:

- New
- Pending Assignment
- Assigned
- In Review
- Need More Information
- In Progress
- Resolved
- Retest Required
- Rejected
- Reopened
- Closed

Rejected phải có rejection reason, history log, nextProcessor và follow-up action. Follow-up owner thường là Tester hoặc PM. Follow-up action phải sửa classification, bổ sung thông tin thiếu, reassign cho Developer khác hoặc chuyển bug sang Pending Assignment khi chưa có Developer phù hợp.

Retest Required nằm giữa Resolved và Closed khi cần verification. Điều này giúp nhóm không close bug trước khi Tester/PM chấp nhận.

## 15. Yêu cầu dữ liệu cấp cao

| Data Area | Ý nghĩa nghiệp vụ | Ghi chú |
| --- | --- | --- |
| Bug | Record chính đại diện cho defect được report. | Bao gồm classification, priority, severity, ownership, status và test context. |
| Developer | Người có thể xử lý technical review và status update. | Có thể được biểu diễn qua user/developer master data. |
| SAP Module | Business context optional như FI, MM, SD hoặc HR. | Không phải bug IDTS nào cũng thuộc SAP functional module. |
| Application Component | Nơi issue xuất hiện trong solution liên quan IDTS/SAP. | Required cho classification và assignment filtering. |
| Defect Category | Loại hoặc technical layer của defect, như Fiori, CAP backend, database, authorization, integration, notification hoặc reporting. | Required cho classification và assignment filtering. |
| Component Category | Cặp hợp lệ giữa Application Component và Defect Category. | Dùng để tránh combination không hợp lệ. |
| Developer Responsibility | Mapping giữa Developer và Component Category, optional scoped by SAP Module. | Dẫn hướng assignment candidate filtering. |
| Comment | Trao đổi gắn với bug. | Không trực tiếp đổi status. |
| Attachment | Evidence metadata hoặc file reference. | Full file storage có thể deferred. |
| History Log | Audit trail cho important actions. | Lưu actor, timestamp, action, old value, new value và reason khi cần. |
| Notification | Record của important event và recipient. | External delivery có thể deferred. |

## 16. Yêu cầu reporting và monitoring

PM monitoring tối thiểu cần hỗ trợ:

- Bug list theo status, priority, severity, SAP Module, Application Component, Defect Category, assignee, nextProcessor, created date, updated date và overdue state.
- Workload theo Developer.
- Pending Assignment queue.
- Need More Information queue.
- Retest Required queue.
- Rejected follow-up queue.
- Overdue hoặc stale bugs.
- Tần suất reassign hoặc reject khi có dữ liệu.

## 17. Non-Functional và Quality Requirements

| Category | High-Level Requirement |
| --- | --- |
| Security and authorization | User chỉ nên thực hiện action được phép theo role. |
| Auditability | Thay đổi quan trọng phải được log với actor, timestamp, action và reason khi áp dụng. |
| Usability | Bug creation, classification, assignment, status update và monitoring cần dễ hiểu cho non-expert users. |
| Data integrity | Required classification, ownership và status rules cần được enforce nhất quán. |
| Maintainability | Classification và Developer Responsibility nên là configurable master data, không hardcode logic. |
| Localization readiness | Deliverable tiếng Anh và tiếng Việt là bắt buộc; UI text có thể cần i18n khi implementation. |
| Performance baseline | MVP filtering và list views cần dùng được với dữ liệu demo/educational-scale. |
| Extensibility control | Enhancement tương lai không được biến IDTS thành Jira, SAP Cloud ALM, ServiceNow, CI/CD hoặc source-code management. |

## 18. Assumptions, Constraints và Dependencies

### 18.1 Assumptions

- SAP Module là optional vì không phải bug IDTS nào cũng thuộc SAP functional module.
- Application Component và Defect Category là required cho assignment filtering.
- Developer workload warning có thể bắt đầu ở mức MVP cơ bản.
- External notification delivery có thể deferred; MVP có thể bắt đầu bằng notification records/triggers.
- Attachments có thể bắt đầu bằng metadata và storage references.
- Product Discovery được dùng cho future requirements chưa rõ trước khi update BRD/SRS/FRS hoặc implementation tasks.

### 18.2 Constraints

- Solution phải khả thi trong phạm vi SAP490 project delivery.
- Định hướng implementation dự kiến là SAP CAP Node.js, OData V4, SAP Fiori Elements/SAPUI5 và SQLite cho local development.
- Future deployment có thể dùng SAP HANA Cloud hoặc PostgreSQL, nhưng không hardcode endpoint hoặc credential.
- Thiết kế chi tiết CAP service, Fiori annotations, UI behavior và handler validation thuộc SRS/FRS/technical design, không nằm trong BRD này.
- MVP không được mở rộng thành full ALM, ITSM, project management, source-code management, CI/CD hoặc code review.
- Formal BRD/SRS/FRS deliverables được duy trì bằng file tiếng Anh và tiếng Việt riêng.

## 19. Rủi ro và hướng xử lý

| Risk | Impact | Mitigation |
| --- | --- | --- |
| CAP model hiện tại nhỏ hơn business baseline. | Implementation có thể thiếu entity và field cần thiết. | Bắt đầu Sprint 1 bằng data model foundation. |
| SAP Module có thể bị nhầm với IDTS Application Component. | Assignment và reporting có thể không rõ. | Giữ glossary, UI labels và value helps rõ ràng. |
| nextProcessor có thể bị hiểu nhầm là assignee thứ hai. | Ownership bị mơ hồ. | Giải thích assignee vs nextProcessor trong docs và UI. |
| Rejected bugs có thể bị bỏ lửng không có owner hoặc next action. | Workflow dead end. | Bắt buộc rejection reason, nextProcessor, history, notification và follow-up transition. |
| Fiori work bắt đầu trước khi model/service ổn định. | Rework. | Chặn Fiori implementation cho đến sau data model và service foundation. |
| SAP490 template có thể thiên về ABAP. | Báo cáo bị lệch kỳ vọng. | Map CAP/Fiori artifacts vào required SAP490 sections và xác nhận với supervisor. |
| Scope creep thành Jira hoặc SAP Cloud ALM. | Dự án quá lớn. | Enforce out-of-scope list và Product Discovery intake. |

## 20. Success Criteria

BRD được thỏa mãn khi dự án chứng minh được:

- Tester có thể tạo, phân loại và submit bug.
- Có duplicate checking support trước khi tạo bug.
- Developer list có thể lọc theo responsibility.
- Bug có thể Assigned hoặc giữ ở Pending Assignment.
- Developer có thể review, request information, reject với reason, progress và resolve.
- Bug rejected có follow-up owner và next action.
- Tester/PM có thể verify, close hoặc reopen.
- PM có thể monitor workload, overdue bugs, pending assignment, rejected follow-up và status progress.
- History logs thể hiện important changes.
- Notification records tồn tại cho key events hoặc triggers.
- Implementation nằm trong IDTS scope đã duyệt.

## 21. Open Questions

| ID | Câu hỏi | Owner |
| --- | --- | --- |
| OQ-001 | Supervisor có chấp nhận SAP CAP/Fiori artifacts là SAP Coding deliverable trong SAP490 template không? | Team / Mentor |
| OQ-002 | PM có quyền assign/reassign trực tiếp trong MVP hay chỉ request reassignment? | Team / Mentor |
| OQ-003 | Notification channel nào bắt buộc cho MVP: chỉ in-app records, email, SAP BTP service hay third-party channels? | Team / Mentor |
| OQ-004 | Cách lưu attachment nào phù hợp cho giai đoạn dự án hiện tại? | Team / Mentor |
| OQ-005 | SLA hoặc overdue threshold chính xác cho bug High, Medium và Low là gì? | Team / PM |

## 22. Glossary

| Term | Ý nghĩa trong IDTS |
| --- | --- |
| SAP Module | Business context optional như FI, MM, SD hoặc HR. Nó không giống feature/module của ứng dụng IDTS. |
| Application Component | Phần của solution nơi defect xuất hiện, ví dụ bug UI, assignment logic, notification, report hoặc authorization. |
| Defect Category | Loại hoặc technical layer của defect, ví dụ Fiori UI, CAP backend, database, authorization, integration, notification hoặc reporting. |
| Component Category | Cặp hợp lệ giữa Application Component và Defect Category. |
| Developer Responsibility | Mapping cho biết Developer nào có thể xử lý Component Category nào và SAP Module scope nếu có. |
| Assignee | Developer chính chịu trách nhiệm xử lý kỹ thuật của bug. |
| nextProcessor | Người hoặc queue cần thực hiện action tiếp theo. Nó không thay thế assignee. |
| Rejected | Follow-up status dùng khi assignment hoặc classification không phù hợp; phải có reason và next action. |
| Retest Required | Status verification nằm giữa Resolved và Closed khi bug resolved cần acceptance testing. |

## 23. Traceability Matrix

| Business Objective | Capability | Requirement ID | Related Rule | Success Criteria |
| --- | --- | --- | --- | --- |
| Số hóa defect reporting | Bug Reporting | BRD-BR-001 | BR-RULE-001 | Bug có thể tạo với required information. |
| Giảm defect trùng | Duplicate Support | BRD-BR-002 | BR-RULE-002 | Có duplicate search/filter support trước creation. |
| Cải thiện classification quality | Classification | BRD-BR-003 | BR-RULE-003, BR-RULE-004 | Required classification fields được capture. |
| Cải thiện assignment accuracy | Developer Matching | BRD-BR-004 | BR-RULE-005, BR-RULE-006 | Developer candidates được lọc theo responsibility. |
| Tránh bug hợp lệ không có owner | Assignment | BRD-BR-005 | BR-RULE-007 | Có Pending Assignment queue. |
| Kiểm soát developer review | Developer Review | BRD-BR-006, BRD-BR-007 | BR-RULE-008, BR-RULE-009 | Developer có thể request information hoặc reject có reason. |
| Kiểm soát lifecycle | Retest and Closure | BRD-BR-009 | BR-RULE-010, BR-RULE-011 | Bug đi theo allowed lifecycle states. |
| Duy trì collaboration | Comments | BRD-BR-010 | BR-RULE-012 | Comment không âm thầm đổi status. |
| Duy trì auditability | History Log | BRD-BR-011 | BR-RULE-013 | Important actions được ghi vào history. |
| Cải thiện PM visibility | PM Monitoring | BRD-BR-013 | BR-RULE-014 | PM monitor được workload, queues, overdue bugs và follow-up. |

## 24. Source Traceability

- Scope, roles và features: IDTS-SUMMARY.md, IDTS-PROJECT-SCOPE-SAP01.md, docs/project-context.md.
- Business rules: IDTS-Business-Rule.md, docs/ba/03-status-transition-matrix.md, docs/ba/06-authorization-matrix.md.
- MVP requirements: docs/ba/01-mvp-scope.md, docs/ba/04-requirement-backlog.md.
- Classification và data concepts: docs/ba/02-glossary.md, docs/ba/05-data-dictionary.md.
- Fiori business UX expectations: docs/ba/07-fiori-ux-requirements.md.
- Implementation gaps và risks: docs/ba/08-implementation-gap-analysis.md, docs/pm/risk-decision-log.md.
- SAP490 deliverable alignment: docs/knowledge/sap490-deliverable-guidance.md.
