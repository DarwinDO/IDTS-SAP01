# Yêu cầu mentor review cho Technical Specification, Unit Test và UAT

## 1. Mục đích và phạm vi áp dụng

Đây là tài liệu bắt buộc phải đọc trước mọi task SAP490 mới của IDTS. Tài liệu ghi lại
đầy đủ phản hồi mentor, quyết định của team và cách thực hiện đã thống nhất sau buổi
review.

Áp dụng cho:

- Technical Specification chính thức.
- Unit Test workbook.
- UAT workbook.
- Evidence được nhúng hoặc hyperlink từ các workbook trên.
- Generator, validator, Drive synchronization và approval workflow liên quan.

Không áp dụng chính sách English-only cho tài liệu học tập nội bộ, knowledge mirror,
debug lab hoặc briefing tiếng Việt.

## 2. Những vấn đề mentor đã chỉ ra

1. Team phải hiểu từng tab dùng để trình bày điều gì, không chỉ điền cho đủ ô.
2. Nội dung phải nằm đúng tab. Ví dụ Functional Requirements mô tả yêu cầu nghiệp vụ,
   không phải nơi đổ source path hoặc đoạn code.
3. Dự án dùng CAP/Fiori nhưng naming và cách trình bày vẫn phải theo tinh thần SAP.
   Không được bỏ qua mục SAP/ABAP cổ điển; phải ghi CAP/Fiori equivalent và giải thích.
4. Unit Test và UAT phải tách chi tiết đến từng success/failure condition nhỏ.
5. Mỗi test được tuyên bố thực thi phải có actual result và hình ảnh riêng.
6. Screen Layout phải bao phủ toàn bộ màn hình của ứng dụng và màn hình tích hợp cần
   thiết; Screen Definition phải bao phủ field/action thật trên từng màn hình.
7. Message Definition phải kiểm kê đầy đủ message từ source, không chỉ chọn vài message
   đại diện.
8. Technical Implementation phải trace thật từ UI đến frontend, HTTP/OData, CAP,
   database/provider và kết quả; từng bước có bằng chứng.
9. Technical Design phải có diagram theo chức năng, giải thích cạnh hình, và data
   dictionary đến column/datatype/key/null/default/association.
10. Development Standards phải nêu rõ chuẩn SAP nào được áp dụng và CAP/Fiori
    equivalent nào thay cho ABAP/RAP/T-code/Transport.
11. Functional Specification không còn nằm trong remediation hiện tại.
12. Official template phải được tôn trọng tuyệt đối; không tự thiết kế lại workbook.
13. Tiêu đề nhìn thấy bởi mentor dùng số tự nhiên `1`, `2`, `3` và cấp con
    `1.1`, `1.2`; không dùng `FN-*`, `FLOW-*`, `SCR-*` làm tiêu đề chính.

## 3. Chính sách artifact

- Submission SAP490 từ thời điểm này chỉ có tiếng Anh.
- Không tạo, regenerate, update hoặc upload artifact VI mới.
- Artifact VI trong `00_MENTOR_REVIEW_CURRENT` được backup, lập manifest và đưa vào
  Google Drive Trash; không empty Trash.
- Archive, official template, reference, previous version, POC và workshop không nằm
  trong phạm vi xóa.
- Repo current tree chỉ giữ artifact submission EN hiện hành. Bản VI cũ được bảo toàn
  bằng Git tag/history và archive manifest; không rewrite Git history.
- Target:
  - Technical Specification EN `v0.8`.
  - Unit Test EN `v0.5`.
  - UAT EN `v0.3`.

## 4. Quy tắc official template

Mỗi workbook phải bắt đầu từ fresh copy của official template. Bắt buộc giữ:

- Đủ tab, đúng tên, đúng thứ tự và visibility.
- Title block, core table, merged header, font, border, fill và alignment.
- Print orientation, margin, print area, repeating header và page setup.
- Approval/reviewer field ở trạng thái Pending khi chưa có người thật ký.

Chỉ được:

- Điền nội dung vào vùng template.
- Clone row/block mẫu gần nhất để thêm record.
- Tăng row height và wrap text.
- Điều chỉnh column width trong printable width khi thực sự cần.

Cấm:

- Tự tạo design system, màu, font, border hoặc sheet mới.
- Xóa section vì CAP không có khái niệm ABAP tương ứng.
- Giảm font để ép nội dung.
- Merge data rows.
- Nhét nhiều function hoặc trace dài vào một cell.
- Ghi `N/A` mà không có lý do và CAP/Fiori equivalent.
- Đánh dấu Approved, UAT PASS hoặc provider-live PASS khi chưa có bằng chứng thật.

## 5. Mục đích chính xác của 12 tab Technical Specification

| STT | Tab | Tab dùng để trình bày | Phải có | Không được có |
| ---: | --- | --- | --- | --- |
| 1 | `Cover` | Danh tính tài liệu và trạng thái kiểm soát | Tên, project, version, date, author, reviewer/approver Pending | Secret, private endpoint, chữ ký giả |
| 2 | `Histories` | Lịch sử thay đổi tài liệu | Version, date, changed section, reason, author/reviewer | Lịch sử runtime Bug hoặc changelog Git thô |
| 3 | `Introduction` | Mục tiêu và cách đọc Technical Specification | CAP Node.js, OData V4, Fiori Elements/UI5, phạm vi tài liệu | Dump source code hoặc danh sách file dài |
| 4 | `Scope` | Ranh giới kỹ thuật in-scope/out-of-scope | Scope item, lý do, limitation, môi trường | Yêu cầu nghiệp vụ chi tiết hoặc claim production |
| 5 | `Assumptions` | Giả định kỹ thuật cần kiểm chứng | SQLite local, PostgreSQL QA, S3, Brevo, OpenAI disabled, cách verify | Credential hoặc giả định không có owner |
| 6 | `Functional Requirements` | Hệ thống phải làm gì ở mức nghiệp vụ | Number, business requirement, actor, precondition, outcome, related feature | Source path, code snippet, SQL, raw handler trace trong mô tả nghiệp vụ |
| 7 | `Technical Design` | Cấu trúc giải pháp và quan hệ thành phần | Diagram theo function, component map, entity/association, draft/active, transaction, integration, table dictionary | Paragraph raw thay diagram/bảng; ABAP section bị bỏ trống |
| 8 | `Development Standards` | Quy tắc xây dựng và kiểm soát chất lượng | SAP naming, CAP/Fiori equivalents, auth, validation, errors, comments, tests, evidence, secrets | Generic slogan không có verification |
| 9 | `Screen Layout` | Danh mục màn hình và bố cục/điều hướng | Screen number/name, route, page type, role, areas, navigation, screenshot | Trace code dài; field-by-field definition |
| 10 | `Screen Definition` | Định nghĩa field/action cụ thể | Screen, label, binding, type, I/O, required/read-only, value help, role, validation, handler | Chỉ lặp tên màn hình hoặc bỏ action nhỏ |
| 11 | `Message Definition` | Catalog message đầy đủ | Message number/text, trigger, source, HTTP status, target, role, rollback/log/frontend behavior, evidence | Chọn vài message đại diện hoặc message không tồn tại |
| 12 | `Technical Implementation` | Trace từng chức năng end-to-end | Numbered implementation, FE, HTTP/OData, service contract, handler/helper, validation, transaction, DB/provider, response, failure, test/evidence | Gộp nhiều action vào một row hoặc chỉ ghi tên file/command |

## 6. CAP/Fiori equivalent cho mục SAP/ABAP cổ điển

Không xóa mục cổ điển. Điền nội dung tương đương:

| Khái niệm template cổ điển | Equivalent IDTS CAP/Fiori | Cách ghi |
| --- | --- | --- |
| ABAP package | npm/CAP project modules và namespace `idts.cap` | Ghi module/folder/source-of-truth, không bịa package SAP |
| T-code / customizing | CAP profile, private environment variables, seed/code list và service configuration | Ghi rõ không có T-code và nêu cơ chế thay thế |
| Transport Request | Git branch, PR review, protected `dev`, Render deploy | Ghi `N/A` cho SAP TR và mô tả control thay thế |
| ABAP class/interface | CAP service class, handler module, helper module | Dùng exact file/symbol trong cột kỹ thuật |
| DDIC table | CDS entity và physical PostgreSQL table | Có logical/physical mapping và full column dictionary |
| SAP authorization object | Custom role/session mapping và CAP authorization checks | Ghi role, handler/guard và HTTP denial |
| Smart Form | Fiori Elements/Object Page/notification-email template nếu phù hợp | Ghi N/A có lý do khi không dùng Smart Form |
| Background job | Email outbox worker polling/retry/locking | Ghi worker lifecycle, lock, retry và failure isolation |

## 7. Naming convention

Nguồn tham khảo là `docs/sap490/templates/Deliverable_template/Naming Convention.pdf`.
Áp dụng tinh thần SAP: tên tiếng Anh có nghĩa, dùng glossary/domain term, không viết tắt
mơ hồ, tên action/method là verb phrase và field phản ánh đúng semantics.

CAP/Fiori convention của IDTS:

- Namespace: `idts.cap`.
- Entity: PascalCase, thường ở dạng plural theo model hiện hành.
- Field/action/function: lowerCamelCase.
- Service: `<Domain>Service`.
- Constant/code: UPPER_SNAKE_CASE.
- Boolean: ưu tiên `is*`, `has*`, `can*`.
- UI business label tách khỏi technical action.
- Physical PostgreSQL persistence phân biệt:
  - business tables `idts_cap_*`;
  - CAP draft/service tables;
  - framework/outbox tables.

Visible numbering của workbook:

```text
1. User authentication
1.1 Enter credentials
1.2 Submit authentication request
1.3 Create user session
```

Không dùng `FN-ATT-01`, `FLOW-*`, `SCR-*` làm heading chính. Technical action, entity,
message/test ID vẫn được giữ trong cột riêng để trace.

## 8. Technical Design bắt buộc

Mỗi chức năng hoặc nhóm chức năng liên kết chặt phải có:

1. Tên chức năng theo business language.
2. Diagram đặt bên trái.
3. Giải thích đặt bên phải.
4. Caption `Figure 1.1`, `Figure 1.2`...
5. Actor, precondition, main path và failure path.
6. Thành phần frontend, service, handler, transaction và external boundary.
7. Data entities/tables bị đọc/ghi.
8. Evidence hoặc nguồn để reviewer mở đối chiếu.

Database dictionary phải có:

- Logical entity.
- Physical table.
- Column.
- Data type.
- PK/FK.
- Nullable/default.
- Association/composition.
- Business purpose.
- Owner/retention.
- Database evidence.

## 9. Screen Layout và Screen Definition

Screen Layout phải bao phủ:

- Sign-in.
- Profile/signed-in shell/sign-out.
- Role dashboard.
- Bug List Report.
- Create Bug.
- Bug Object Page.
- Classification and planning.
- Assignment/Smart Assign dialog.
- Lifecycle action dialogs.
- Comments.
- Attachment picker/upload/download/delete.
- History timeline.
- Notifications.
- AI Similar Bugs, Classification, Handoff Summary và Smart Assign explanation review.
- Operational third-party screens chỉ khi cần chứng minh integration: Render, S3,
  Brevo/email inbox và PostgreSQL viewer; phải ghi đây là operational evidence, không
  phải màn hình IDTS runtime.

Screen Definition phải tách từng field/action. Không được dùng một dòng đại diện cho cả
section. Mỗi row phải có binding, data type, required/read-only, role visibility,
validation, handler/OData operation và failure behavior.

## 10. Message Definition exhaustive

Message scan phải kiểm:

- `req.reject`.
- `throw` và error mapping.
- Validation và authorization.
- `MessageBox`, `MessageToast`, `MessageStrip`.
- i18n text.
- Attachment/S3 errors.
- Notification/email/outbox errors.
- AI disabled/fallback/provider/review/apply errors.

Mỗi message phải có user-facing text, exact trigger/source, HTTP status nếu có, target,
role/context, rollback behavior, sanitized logging, frontend handling và evidence.
Không được tạo catalog từ trí nhớ; source scan là baseline, human review xác nhận ý
nghĩa.

## 11. Technical Implementation bắt buộc

Mỗi function/action được trình bày riêng theo cấu trúc:

1. Function name.
2. Purpose.
3. Actor/precondition.
4. UI trigger.
5. Frontend source.
6. HTTP/OData request.
7. `service.cds` contract.
8. CAP handler/helper.
9. Validation/authorization.
10. Transaction.
11. Database/provider side effect.
12. Response/UI refresh.
13. Failure/rollback.
14. Test/evidence.

Evidence hình ảnh tương ứng:

- UI trước/sau action.
- Browser Network request/response.
- Frontend code.
- CAP service/handler code.
- Database/provider state.
- Result, history hoặc notification.

Nếu agent không tự lấy được hình thật, phải ghi:

`MISSING EVIDENCE — owner action required`

Không dùng tên script, command hoặc local path đơn lẻ làm bằng chứng.

## 12. Unit Test EN v0.5

NhanT phải lập catalog trước; DonHV duyệt catalog rồi mới thực thi. Coverage tối thiểu:

- Authentication/session.
- Draft create/patch/save và active create/update.
- Required fields, whitespace, format, active/inactive code lists.
- Classification and component-category consistency.
- Assignment, pending assignment và invalid assignee.
- Từng action trong 11 lifecycle actions.
- Comments.
- Attachments: select-before-save, upload, metadata, S3, download/hash, reload, delete,
  invalid type/size và provider failure.
- History and transaction rollback.
- In-app notifications.
- Outbox/email retry/lock/status.
- Dashboard/monitoring.
- AI suggestion/review/apply/confirm/metrics, disabled provider và no-mutation.
- Authorization và error sanitization.

Mỗi condition branch là một test case riêng. Mỗi row có:

- Test Case ID.
- Requirement/function.
- Preconditions.
- Input.
- Steps.
- Expected result.
- Actual result.
- Baseline SHA.
- Executor/timestamp.
- Result.
- Evidence ID.
- Case-specific image.

## 13. UAT EN v0.3

UAT phải tách chi tiết:

- Login/logout/session expiry.
- Create success/failure.
- Validation/boundary.
- Classification.
- Có assignee/không assignee.
- Smart Assign.
- Từng lifecycle action.
- Comments.
- Attachment success/failure/reload/delete.
- History/show-more.
- Notification/email.
- Dashboard/monitoring.
- AI review/fallback/no-mutation.
- Refresh, repeated action, browser back/forward, console/network error.
- Desktop/tablet/keyboard/focus.

Mỗi case có ít nhất một ảnh riêng. Case nhiều bước phải có before/after/reload hoặc
network/error evidence. OpenAI live ghi:

`BLOCKED / NOT ACCEPTED — provider disabled`

Không được đổi fallback/mock PASS thành provider-live PASS.

## 14. Evidence policy

Raw evidence tiếp tục nằm ở ignored workspace. Selected evidence phải:

- Được sanitize.
- Được Git track.
- Không chứa token, password, API key, DB URL, private endpoint hoặc full email.
- Có manifest: baseline SHA, actor, timestamp, expected, actual và result.
- Được nhúng/hyperlink từ đúng test row.

Đường dẫn:

```text
docs/pm/evidence/<jira-key>/unit/<case-id>/
docs/pm/evidence/<jira-key>/uat/<case-id>/
docs/pm/evidence/<jira-key>/technical-spec/
```

## 15. Ba gate bắt buộc

### Gate 1 — Agent candidate package

Agent tạo field/row content, source trace, diagram/evidence hiện có, missing-evidence
list, preview workbook/PDF, finding và limitation.

### Gate 2 — Human member approval

Owner kiểm accuracy, tab purpose, completeness, official template, formal English và
evidence. Approval bắt buộc có Jira comment thật và repo checklist. Agent không được
ký thay.

### Gate 3 — DonHV integration và Drive

DonHV chỉ hợp nhất package đã duyệt, regenerate từ structured source, merge PR bình
thường vào `dev`, rồi update same-ID Drive artifact. Không duplicate; phải readback
hash/metadata và preview.

## 16. Claims bị cấm

- UAT PASS khi chưa có người thực thi và actual result.
- Mentor/user sign-off do agent tự điền.
- OpenAI live accepted khi provider đang disabled.
- Evidence chỉ là command, script name hoặc local path.
- “Đủ message/screen/table” khi chưa có inventory/validator.
- “Đúng template” chỉ vì OfficeCLI schema PASS.
- “Hoàn tất” khi còn `MISSING EVIDENCE`, approval Pending hoặc Drive chưa readback.

## 17. Ownership

| Member | Ownership |
| --- | --- |
| DonHV | Database/persistence, architecture assumptions, data dictionary, transaction/rollback, PostgreSQL, S3, AuthSessions, history, outbox/email và final integration |
| SangVN | Screen Layout/Definition, classification, assignment/Smart Assign, lifecycle UI, comments, attachments UI, history UI và Object Page evidence |
| DatDT | Business-level requirements, Development Standards, naming matrix, exhaustive messages, login/profile, dashboard/monitoring, notification UI và AI traces |
| NhanT | Unit Test EN catalog/execution/evidence và UAT EN catalog/execution/evidence |

## 18. Acknowledgment

Trước task SAP490 mới, member đọc file này tại đúng commit và tự điền
`docs/pm/evidence/idts-105/member-read-acknowledgements.md`, đồng thời comment Jira.
Agent không được tự xác nhận thay.
