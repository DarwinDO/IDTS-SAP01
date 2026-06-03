# BA-004 - MVP Role Baseline Alignment

Status: Done  
Owner workstream: BA/PM  
Last updated: 2026-06-03

## English

### Purpose

Align project documentation to the approved MVP role baseline: Tester, Developer, and PM.

### Decision Summary

The MVP uses three active application roles:

- Tester: detects and reports bugs, checks duplicates, classifies bugs, assigns/reassigns Developers, provides requested information, retests, closes, reopens, comments, and tracks status.
- Developer: reviews assigned bugs, requests more information, rejects unsuitable assignment/classification with reason, updates technical handling status, adds notes, and resolves bugs.
- PM: monitors all bugs, workload, overdue items, rejected follow-up, queues, nextProcessor, and escalation risks.

Reporter and Admin are not separate MVP roles. Tester performs internal reporting responsibilities. Lightweight administrative responsibilities are handled by Tester or PM where authorized.

### Updated Outputs

- Canonical business documents: `IDTS-SUMMARY.md`, `IDTS-Business-Rule.md`, `IDTS-PROJECT-SCOPE-SAP01.md`, `docs/project-context.md`.
- Formal BA deliverables: BRD v1.2, SRS v1.1, FRS v1.2.
- BA support documents: MVP scope, glossary, status matrix, requirement backlog, data dictionary, authorization matrix, Fiori UX requirements, implementation gap analysis.
- Diagrams: system context, use cases, business process flows, status lifecycle, conceptual data model, notification/audit/monitoring.
- PM handover: current status, BA/PM status, task board, risk/decision log.

### Completion Criteria

- Active role references use Tester, Developer, and PM.
- Reporter and Admin appear only as deferred/non-separate role notes or out-of-scope context.
- Rejected follow-up owner is Tester or PM.
- Need More Information nextProcessor is Tester.
- Retest/close owner is Tester or PM.

## Vietnamese

### Mục đích

Đồng bộ tài liệu dự án theo MVP role baseline đã chốt: Tester, Developer và PM.

### Tóm tắt quyết định

MVP dùng ba role active trong ứng dụng:

- Tester: phát hiện và báo cáo bug, kiểm tra duplicate, phân loại bug, assign/reassign Developer, bổ sung thông tin khi Developer yêu cầu, retest, close, reopen, comment và theo dõi status.
- Developer: review bug được assign, request more information, reject assignment/classification không phù hợp kèm lý do, cập nhật status xử lý kỹ thuật, thêm note và resolve bug.
- PM: monitor toàn bộ bug, workload, overdue, rejected follow-up, queue, nextProcessor và escalation risk.

Reporter và Admin không phải role tách riêng trong MVP. Tester đảm nhiệm trách nhiệm reporting nội bộ. Các trách nhiệm quản trị nhẹ do Tester hoặc PM xử lý theo quyền được cấp.

### Output đã cập nhật

- Tài liệu nghiệp vụ canonical: `IDTS-SUMMARY.md`, `IDTS-Business-Rule.md`, `IDTS-PROJECT-SCOPE-SAP01.md`, `docs/project-context.md`.
- BA deliverable chính thức: BRD v1.2, SRS v1.1, FRS v1.2.
- BA support documents: MVP scope, glossary, status matrix, requirement backlog, data dictionary, authorization matrix, Fiori UX requirements, implementation gap analysis.
- Diagrams: system context, use cases, business process flows, status lifecycle, conceptual data model, notification/audit/monitoring.
- PM handover: current status, BA/PM status, task board, risk/decision log.

### Tiêu chí hoàn tất

- Các role active dùng Tester, Developer và PM.
- Reporter và Admin chỉ xuất hiện như ghi chú role deferred/non-separate hoặc out-of-scope context.
- Owner follow-up của Rejected là Tester hoặc PM.
- nextProcessor của Need More Information là Tester.
- Owner của retest/close là Tester hoặc PM.
