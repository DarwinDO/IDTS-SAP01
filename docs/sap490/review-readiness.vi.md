# Sổ đăng ký mức sẵn sàng SAP490 Review của SU26SAP01 / GSU26SAP01

Ngày snapshot: 2026-07-10
Owner: DonHV / IDTS SAP01 Team
Trạng thái review: bản nháp có bằng chứng, không phải tuyên bố final submission

## 0. Quy ước tên và thẩm quyền source

Markdown trong repository vẫn là source canonical. Thư mục review Google Drive và các bản review dùng quy ước `SU26SAP01_GSU26SAP01_<deliverable>_<language>_<version>_<YYYYMMDD>`. Tên Office local có thể giữ tên phục vụ generator; chúng không phải là thẩm quyền đặt tên trên Drive.

Lần đọc lại Drive hiện tại đã xác nhận thư mục project/group, artifact review EN/VI và Team Contribution Matrix. Thư mục gốc đang chia sẻ `Anyone with the link: Reader`. Repository không lưu Drive ID, credential hay local sync configuration.

## 1. Baseline cho buổi review

Sổ này là bản handoff cho buổi SAP490 review tiếp theo. Nội dung được tổng hợp từ source CAP/Fiori hiện tại, tài liệu BA canonical, QA scripts và toàn bộ status của thành viên trong `docs/pm/status/`.

Baseline đã triển khai gồm tạo bug có cấu trúc, classification, assignment theo responsibility, lifecycle validation, comment, draft attachment, history/audit, notification record, PM monitoring và AI hỗ trợ tùy chọn. AI chỉ là advisory, cần human review. Real provider tùy chọn vẫn tắt cho đến khi có private configuration được duyệt và bằng chứng live-provider.

## 2. Bằng chứng đã đọc

| Nhóm bằng chứng | Source canonical / kết quả mới | Ý nghĩa khi review |
| --- | --- | --- |
| Nghiệp vụ và requirements | BRD v1.3, SRS v1.2, FRS v1.3 (EN/VI); project scope, business rules, diagrams, BA discovery. | Scope, role, human authority và AI guardrail đã được đồng bộ. |
| Source và security | CAP compile pass; secret scan pass cho phạm vi tracked source. `.cdsrc-private.json` local bị ignore và không upload. | Không có credential trong review pack. Việc rotate credential local vẫn là external owner action. |
| Functional/AI regression | Các suite programmatic auth, validation, attachment, AI provider, AI safety và AI UI đã pass trước secret-scan gate. | Bằng chứng hỗ trợ các flow đã triển khai, nhưng không thay thế UAT sign-off. |
| Tổng hợp defect | Đã đọc tất cả member status. | Test & Fix Bug chỉ chứa product defect đã xác nhận; tooling, environment, data và test-harness vẫn ở member status nếu không nghiêm trọng. |

## 3. Ma trận deliverable

Cột cuối chỉ áp dụng sau khi có thay đổi source đã được duyệt. Cột này không có nghĩa artifact review tương ứng đang thiếu trên Drive.

| Artifact SAP490 | Trạng thái cho review | Quy tắc source/template | Bước tiếp theo bắt buộc |
| --- | --- | --- | --- |
| BRD (EN/VI DOCX) | Sẵn sàng upload review | `docs/ba/brd/*.md` đã regenerate thành `*.docx`. | Upload raw DOCX có timestamp. |
| SRS (EN/VI DOCX) | Sẵn sàng upload review | `docs/ba/srs/*.md` đã regenerate thành `*.docx`. | Upload raw DOCX có timestamp. |
| FRS (EN/VI DOCX) | Sẵn sàng upload review | `docs/ba/frs/*.md` đã regenerate thành `*.docx`. | Upload raw DOCX có timestamp. |
| Test and Fix Bug (EN/VI XLSX) | Sẵn sàng upload review | Copy từ `Test_And_Fix_Bug.xlsx`; v0.4 chỉ có 12 product defect đã xác nhận. | Upload raw XLSX; member status vẫn là full issue log. |
| Blueprint (EN/VI DOCX) | Sẵn sàng upload review | v0.2 copy layout v0.1/template và update cover/history/current baseline, không dựng lại tài liệu. | Upload raw DOCX. |
| Functional Specification (EN/VI XLSX) | Sẵn sàng upload review | v0.3 giữ toàn bộ sheet workbook gốc và map workflow, attachment, PM, AI advisory hiện tại. | Upload raw XLSX. |
| Technical Specification (EN/VI XLSX) | Sẵn sàng upload review | v0.1 copy từ template map CAP/Fiori component, standard, screen behavior, AI boundary an toàn và message. | Upload raw XLSX; Markdown/source local vẫn là canonical. |
| Test Scenario, Unit Test, Functional Test, Test Report | Sẵn sàng upload review | Artifact mới v0.3/v0.2 giữ structure workbook và cover sáu suite programmatic mới. | Upload raw XLSX. UAT vẫn tách riêng. |
| UAT | Chỉ chuẩn bị, không tuyên bố completed evidence | v0.1 copy từ template có sáu mentor/user case và ghi rõ chưa thực thi. | Chỉ upload như prepared plan; chỉ ghi result/sign-off thật sau UAT. |
| Configuration Note | Sẵn sàng dưới dạng secret-free review draft | v0.1 copy từ template ghi quyết định CAP/Fiori config không có credential. | Upload raw XLSX; chỉ update khi có config change được duyệt. |
| TR Management | Sẵn sàng dưới dạng CAP/Fiori change tracker | v0.1 copy từ template điều chỉnh classic transport tracker mà không tuyên bố SAP transport đã chạy. | Upload raw XLSX; chỉ thay planned date/status bằng release evidence thật. |
| Workshop deck | Ngoài phạm vi review pack hiện tại | Giữ nguyên template của trường và mọi bản Drive đang có, không chỉnh sửa. | Không cần action. Không regenerate, upload, đổi tên hay xóa trong work item này. |
| Final Project Report | Chưa sẵn sàng để final submission | Giữ `Final Project Report_FHU.docx`. | Không gắn final cho đến khi có UAT, mentor feedback, screenshot cuối và conclusion. |
| SAP490 guide / naming convention | Chỉ tham khảo | Source do trường cung cấp, read-only. | Không chỉnh sửa hoặc upload như deliverable do team viết. |

## 4. Quy tắc product defect

`Test_And_Fix_Bug_IDTS_SAP01_*_v0.4.xlsx` chỉ có các product defect đã xác nhận: `IDTS-13`, `IDTS-19`, `IDTS-32`, `IDTS-35`, `IDTS-41`, `IDTS-49`, `IDTS-52`, `IDTS-53`, `IDTS-55`, `IDTS-56`, `IDTS-58`, `IDTS-78`.

Environment, tooling, test-harness, process và data issue không nghiêm trọng không được copy vào workbook này. Chúng vẫn nằm trong member status tương ứng, trừ khi có rủi ro nghiêm trọng cần escalation.

## 5. Quy tắc phân phối Drive

Drive chỉ là bản review/distribution, không phải source of truth. Chỉ upload raw Office file mới có timestamp vào thư mục review `SU26SAP01_GSU26SAP01` sau khi source/artifact được duyệt thay đổi; không overwrite hoặc delete file mentor-review cũ. Sau mỗi lần upload phải đọc lại folder. Chỉ ghi URL/ID trả về trong kênh handover vận hành được duyệt, không ghi vào source có track Git.
