# Knowledge: `app/user-administration-ui/webapp/model/formatter.js`

## English / Tiếng Việt

Gate 6 keeps UI labels derived from safe server codes but renders friendly localized copy for operation types, audit actions, results, delivery status, and readiness state. The formatter is presentation-only: authorization, retry eligibility, masking, correlation fingerprinting, and safe summaries remain server responsibilities.

Gate 6 giữ code an toàn từ server nhưng render copy thân thiện theo locale cho operation type, audit action, result, delivery status và readiness state. Formatter chỉ làm presentation; authorization, retry eligibility, masking, correlation fingerprint và safe summary vẫn thuộc backend.

### Safe source anchors / Anchor source an toàn

- `operationTypeText` maps provisioning operation codes to locale labels and leaves unknown codes visible as bounded safe codes.
- `auditActionText` and `resultText` provide friendly table labels while detail dialogs may retain safe allowlisted codes for support precision.
- `readinessText`, `readinessState`, `statusText`, and `statusState` keep loading/readiness/error signals readable without interpolating raw backend errors.

Do not put provider responses, raw errors, credentials, identity hashes, tokens, or authorization decisions in a formatter. If a new code is exposed, add the matching English/Vietnamese i18n key, UI contract assertion, and safe backend mapping first.

`operationTypeText` map code operation cấp quyền sang label theo locale và giữ unknown code ở dạng safe bounded code. `auditActionText` và `resultText` tạo label thân thiện trong table; detail có thể giữ code allowlist an toàn để support chính xác hơn. Không đưa provider response, raw error, credential, identity hash, token hoặc quyết định authorization vào formatter.

## Gate 6.3 workload presentation / Presentation workload Gate 6.3

### English

The formatter remains presentation-only for the workload view. `availabilityState` maps the server criticality to SAP semantic states; `workloadOpenLimit` renders `open / limit` and uses an em dash when no limit exists; `workloadReadinessText` and `workloadReadinessState` show a profile readiness hint without authorizing access; `workloadCountState` marks only positive overdue counts; and `workloadStateText`/`workloadState` distinguish overloaded, overdue, within-limit, and inactive states. `workloadDetailsTitle` labels the selected Developer detail dialog. None of these functions calculates workload or exposes an internal ID.

- **IDTS concept**: Semantic color and localized labels help a PM scan current capacity without replacing CAP authorization or BugService aggregation.
- **Impact if broken**: A missing limit could appear as zero, an overdue count could be shown as healthy, or a color could be mistaken for permission.
- **Must check together**: `Main.controller.js` normalization, all three workload locale bundles, `Main.view.xml`, `DeveloperWorkloadDetails.fragment.xml`, and the workload contract test.

### Tiếng Việt

Formatter vẫn chỉ làm presentation cho view workload. `availabilityState` map criticality từ server sang semantic state của SAP; `workloadOpenLimit` render `open / limit` và dùng dấu gạch ngang dài khi không có limit; `workloadReadinessText` và `workloadReadinessState` hiển thị hint readiness profile nhưng không authorize access; `workloadCountState` chỉ đánh dấu khi overdue count lớn hơn 0; `workloadStateText`/`workloadState` phân biệt overloaded, overdue, within-limit và inactive. `workloadDetailsTitle` tạo title cho dialog Developer được chọn. Không function nào tự tính workload hoặc expose internal ID.

- **Khái niệm IDTS**: Semantic color và label localize giúp PM quét capacity hiện tại mà không thay thế authorization CAP hoặc aggregation của BugService.
- **Ảnh hưởng nếu sai**: Limit thiếu có thể bị hiện như zero, overdue count có thể bị hiện như healthy hoặc màu bị hiểu nhầm là permission.
- **Phải kiểm tra cùng**: phần normalize trong `Main.controller.js`, cả ba locale bundle workload, `Main.view.xml`, `DeveloperWorkloadDetails.fragment.xml` và workload contract test.

### Safe editing / Sửa an toàn

Keep formatters free of authorization, data access, workload aggregation, provider details, and raw errors. Add a localized key and a focused assertion when a new business state is displayed.

Giữ formatter không chứa authorization, data access, workload aggregation, provider detail hoặc raw error. Khi hiển thị business state mới, thêm localized key và assertion tập trung tương ứng.
