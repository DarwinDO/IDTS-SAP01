# Manifest bàn giao SAP490 Review của SU26SAP01 / GSU26SAP01

> **Lưu ý IDTS-104 (2026-07-26):** Đây là snapshot lịch sử ngày 2026-07-11. Danh sách artifact generated hiện hành và cách truy xuất version cũ nằm tại `docs/sap490/generated-archive-manifest-20260726.md`. Không dùng filename/version trong snapshot này để chọn file mentor hiện hành.

Ngày snapshot: 2026-07-11
Owner: DonHV / GSU26SAP01

## Mục đích

Manifest này liên kết deliverable review với source canonical trong repository mà không lưu Drive ID, credential hay local sync configuration. Đây là bản ghi traceability, không phải tuyên bố final submission.

## Bằng chứng về tên và quyền truy cập

- Thư mục review Google Drive và artifact review dùng `SU26SAP01_GSU26SAP01_<deliverable>_<language>_<version>_<YYYYMMDD>`.
- Metadata Drive đọc lại ngày 2026-07-10 xác nhận thư mục review chia sẻ `Anyone with the link: Reader`.
- Đọc lại folder xác nhận artifact review EN/VI và Team Contribution Matrix native trong thư mục contributions riêng.
- Drive ID và URL được giữ ngoài tài liệu track Git. Dùng kênh handover vận hành được duyệt khi reviewer cần link trực tiếp.

## Bản đồ source canonical

| Nhóm deliverable | Source canonical trong repository | Quy tắc artifact review |
| --- | --- | --- |
| BRD, SRS, FRS (EN/VI) | Markdown trong `docs/ba/brd/`, `docs/ba/srs/`, `docs/ba/frs/` | Regenerate DOCX editable từ Markdown đã duyệt; dùng bản review Drive mới có timestamp. |
| Blueprint, functional/technical specification | `docs/project-context.md`, BA canonical, `docs/sap490/review-readiness.*.md` | Copy template của trường trước khi fill; giữ cover, history, sheet và layout. |
| Test Scenario, Unit Test, Functional Test, Test Report, UAT | `docs/pm/evidence/`, `docs/pm/status/`, QA script, generator workbook test | Giữ structure/formula workbook. UAT chỉ là prepared cho đến khi có thực thi/sign-off thật. |
| Test and Fix Bug | Product defect đã xác nhận và evidence tương ứng | Chỉ đưa product defect. Tooling, environment, data và test-harness issue ở member status trừ khi phải escalation. |
| Team Contribution Matrix | `scripts/sap490/build-team-contribution-matrix.mjs`, Git/Jira/task/status evidence | Giữ công việc thành viên, Jira/PR reference và evidence link có thể audit trong thư mục Drive contributions riêng. |
| Diagram Pack | `docs/diagrams/*.md`, `docs/diagrams/rendered/manifest.json`, SVG render và source fragment | Giữ 21 sơ đồ canonical, source có thể chỉnh sửa, SVG review asset và native Google Slides review deck trong thư mục Diagram Pack có timestamp. |

## Quy trình cập nhật và review

1. Duyệt và commit thay đổi Markdown/source canonical.
2. Regenerate Office artifact bị ảnh hưởng từ template đã copy; không sửa trực tiếp template của trường.
3. Verify trang document, layout/formula spreadsheet hoặc render slide tùy artifact.
4. Upload bản review mới có timestamp với tên bắt đầu bằng `SU26SAP01_GSU26SAP01`.
5. Đọc lại Drive folder và cập nhật PM handover ngoài Git với các link trực tiếp nếu có.

## Giới hạn hiện tại

Source update này sửa traceability và quy tắc naming. Workshop deck được xác định ngoài phạm vi work item và giữ nguyên. Chỉ tạo Review Readiness DOCX/Drive version mới sau khi source branch được duyệt release; branch này không overwrite mentor-review file hiện có.
