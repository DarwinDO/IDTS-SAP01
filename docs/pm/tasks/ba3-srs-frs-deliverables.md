# BA-003 - SRS and FRS Deliverables

Last updated: 2026-06-03

## English

### Objective

Create formal Software Requirements Specification and Functional Requirements Specification deliverables for IDTS before Sprint 1 implementation starts.

### Outputs

| Output | Path | Status |
| --- | --- | --- |
| SRS English Markdown | `docs/ba/srs/srs.en.md` | Done |
| SRS Vietnamese Markdown | `docs/ba/srs/srs.vi.md` | Done |
| SRS English DOCX | `docs/ba/srs/srs.en.docx` | Done |
| SRS Vietnamese DOCX | `docs/ba/srs/srs.vi.docx` | Done |
| FRS English Markdown | `docs/ba/frs/frs.en.md` | Done v1.1 |
| FRS Vietnamese Markdown | `docs/ba/frs/frs.vi.md` | Done v1.1 |
| FRS English DOCX | `docs/ba/frs/frs.en.docx` | Done v1.1 |
| FRS Vietnamese DOCX | `docs/ba/frs/frs.vi.docx` | Done v1.1 |

### Decisions Applied

- SRS uses a traditional SRS outline for mentor readability.
- SRS requirement quality, traceability, and verification follow ISO/IEC/IEEE 29148-style discipline instead of relying only on obsolete IEEE 830 framing.
- FRS contains detailed functional workflows, validations, status effects, history/notification effects, acceptance criteria, and traceability back to SRS.
- FRS v1.2 keeps those workflow diagrams and aligns the functional actors to the MVP role baseline: Tester, Developer, and PM.
- Mermaid diagram source is included in Markdown and DOCX as text. If mentor requires visual diagrams in DOCX, render the diagrams as images in a later formatting pass.

### Verification

| Check | Result |
| --- | --- |
| DOCX generation | Passed for SRS EN/VI and FRS EN/VI. |
| Word table smoke test | DOCX files contain real Word tables. |
| LibreOffice conversion smoke test | Passed in a temporary folder outside the repo. |
| Mermaid syntax render test | Passed for 16 FRS Mermaid diagrams across English and Vietnamese Markdown files. |

### Remaining Open Issues

| ID | Open issue | Owner |
| --- | --- | --- |
| OI-001 | Confirm PM direct reassignment permission. | Team / Mentor |
| OI-002 | Confirm notification delivery scope for MVP. | Team / Mentor |
| OI-003 | Confirm attachment storage approach. | Team / Mentor |
| OI-004 | Confirm overdue thresholds and workload limits. | Team / PM |
| OI-005 | Confirm whether Mermaid diagrams must be rendered as images in DOCX for submission. | Team / Mentor |

## Vietnamese

### Mục tiêu

Tạo bộ deliverable chính thức gồm Software Requirements Specification và Functional Requirements Specification cho IDTS trước khi bắt đầu Sprint 1 implementation.

### Output

| Output | Đường dẫn | Trạng thái |
| --- | --- | --- |
| SRS Markdown tiếng Anh | `docs/ba/srs/srs.en.md` | Done |
| SRS Markdown tiếng Việt | `docs/ba/srs/srs.vi.md` | Done |
| SRS DOCX tiếng Anh | `docs/ba/srs/srs.en.docx` | Done |
| SRS DOCX tiếng Việt | `docs/ba/srs/srs.vi.docx` | Done |
| FRS Markdown tiếng Anh | `docs/ba/frs/frs.en.md` | Done v1.1 |
| FRS Markdown tiếng Việt | `docs/ba/frs/frs.vi.md` | Done v1.1 |
| FRS DOCX tiếng Anh | `docs/ba/frs/frs.en.docx` | Done v1.1 |
| FRS DOCX tiếng Việt | `docs/ba/frs/frs.vi.docx` | Done v1.1 |

### Quyết định đã áp dụng

- SRS dùng cấu trúc SRS truyền thống để mentor dễ review.
- Chất lượng requirement, traceability và verification của SRS đi theo hướng ISO/IEC/IEEE 29148 thay vì chỉ dựa vào IEEE 830 đã cũ.
- FRS chứa workflow chức năng chi tiết, validation, ảnh hưởng status, ảnh hưởng history/notification, acceptance criteria và traceability về SRS.
- FRS v1.2 giữ các workflow diagrams đó và đồng bộ functional actors theo MVP role baseline: Tester, Developer và PM.
- Mermaid diagram source được đưa vào Markdown và DOCX dưới dạng text. Nếu mentor yêu cầu diagram hiển thị thành hình trong DOCX, cần render diagram thành image ở bước format sau.

### Verification

| Check | Kết quả |
| --- | --- |
| Generate DOCX | Passed cho SRS EN/VI và FRS EN/VI. |
| Smoke test bảng Word | DOCX files có Word tables thật. |
| Smoke test LibreOffice conversion | Passed trong thư mục tạm ngoài repo. |
| Mermaid syntax render test | Passed cho 16 FRS Mermaid diagrams trong hai file Markdown tiếng Anh và tiếng Việt. |

### Open issues còn lại

| ID | Open issue | Owner |
| --- | --- | --- |
| OI-001 | Xác nhận quyền PM direct reassignment. | Team / Mentor |
| OI-002 | Xác nhận notification delivery scope cho MVP. | Team / Mentor |
| OI-003 | Xác nhận attachment storage approach. | Team / Mentor |
| OI-004 | Xác nhận overdue thresholds và workload limits. | Team / PM |
| OI-005 | Xác nhận Mermaid diagrams có cần render thành hình trong DOCX khi nộp hay không. | Team / Mentor |
