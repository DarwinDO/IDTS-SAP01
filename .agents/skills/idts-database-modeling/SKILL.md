---
name: idts-database-modeling
description: Use when brainstorming, reviewing, or designing the IDTS database and SAP CAP CDS model, including entity relationships, normalization, value lists, master data, SQLite/HANA/PostgreSQL portability, Fiori value-help readiness, assignment rules, audit/history, notifications, and schema gaps.
---

# IDTS Database Modeling

## English

Use this skill before changing `db/schema.cds`, `srv/service.cds`, seed data, ERD/DBML artifacts, or database-related BA documentation for IDTS.

This skill coordinates database design for a SAP CAP project. It does not replace CAP MCP, `sap-cap`, the canonical business documents, or `docs/project-context.md`.

## Vietnamese

Dùng skill này trước khi chỉnh `db/schema.cds`, `srv/service.cds`, seed data, artifact ERD/DBML, hoặc tài liệu BA liên quan đến database của IDTS.

Skill này điều phối thiết kế database cho dự án SAP CAP. Nó không thay thế CAP MCP, `sap-cap`, các tài liệu nghiệp vụ canonical, hoặc `docs/project-context.md`.

## Required Context

## English

Read these inputs before making a database recommendation:

- `docs/project-context.md`
- `docs/ba/05-data-dictionary.md`
- `docs/ba/08-implementation-gap-analysis.md`
- `docs/diagrams/05-conceptual-data-model.md`
- `db/schema.cds`
- `srv/service.cds`
- `AGENTS.md` CAP rules and MCP-first routing

## Vietnamese

Đọc các input này trước khi đưa ra khuyến nghị database:

- `docs/project-context.md`
- `docs/ba/05-data-dictionary.md`
- `docs/ba/08-implementation-gap-analysis.md`
- `docs/diagrams/05-conceptual-data-model.md`
- `db/schema.cds`
- `srv/service.cds`
- CAP rules và MCP-first routing trong `AGENTS.md`

## Design Principles

## English

- Keep CAP CDS as the source of truth for the implemented backend model.
- Use DBML, SQL diagrams, or generic schema-design skills only as brainstorming or documentation aids.
- Prefer CAP `cuid` and `managed` aspects for core business entities unless the existing implementation has a clear reason not to.
- Use associations for reusable master data such as SAP Modules, Application Components, Defect Categories, Developers, and value lists.
- Use compositions for bug-owned child data such as Comments, Attachment metadata, History Logs, and Notification records when their lifecycle belongs to one Bug.
- Normalize classification and assignment data. Do not keep important relationships as free-text strings.
- Keep the model portable across SQLite local development and future HANA Cloud or PostgreSQL deployment.
- Do not add Prisma, Supabase, raw SQL migrations, database-specific triggers, or vendor-specific data types unless the project explicitly changes direction.

## Vietnamese

- Giữ CAP CDS là source of truth cho model backend được implement.
- Chỉ dùng DBML, SQL diagram, hoặc generic schema-design skill như công cụ brainstorm hoặc tài liệu hóa.
- Ưu tiên CAP `cuid` và `managed` aspects cho entity nghiệp vụ chính, trừ khi implementation hiện tại có lý do rõ ràng để không dùng.
- Dùng association cho master data tái sử dụng như SAP Module, Application Component, Defect Category, Developer và value list.
- Dùng composition cho dữ liệu con thuộc vòng đời của một Bug như Comments, metadata Attachment, History Logs và Notification records.
- Chuẩn hóa dữ liệu classification và assignment. Không giữ quan hệ quan trọng dưới dạng free-text string.
- Giữ model portable giữa SQLite local và triển khai HANA Cloud hoặc PostgreSQL sau này.
- Không thêm Prisma, Supabase, raw SQL migration, trigger riêng của database, hoặc datatype phụ thuộc vendor nếu project chưa đổi hướng rõ ràng.

## Review Checklist

## English

Check these areas before approving a database model:

- Does the model represent the confirmed IDTS roles: Tester, Developer, and PM?
- Are SAP Module, Application Component, Defect Category, Component Category, and Developer Responsibility separated correctly?
- Can the Bug entity represent creation, duplicate support, assignment, rejection follow-up, request-more-information, retest, resolution, close, reopen, and PM monitoring?
- Are status, priority, severity, environment, notification status, and action types controlled by value lists or stable codes?
- Can Fiori value helps filter Application Component, Defect Category, Component Category, and assignee choices?
- Are audit/history requirements represented as append-only records?
- Are important validations enforceable in CAP handlers, not only in Fiori UI?
- Are indexes, uniqueness rules, active flags, and delete behavior clear enough for future implementation?

## Vietnamese

Kiểm tra các điểm này trước khi duyệt database model:

- Model có thể hiện đúng ba role đã chốt của IDTS: Tester, Developer và PM không?
- SAP Module, Application Component, Defect Category, Component Category và Developer Responsibility đã được tách đúng chưa?
- Entity Bug có đủ để biểu diễn create, hỗ trợ duplicate, assignment, rejected follow-up, request-more-information, retest, resolve, close, reopen và PM monitoring không?
- Status, priority, severity, environment, notification status và action type có được kiểm soát bằng value list hoặc stable code không?
- Fiori value help có thể filter Application Component, Defect Category, Component Category và assignee không?
- Yêu cầu audit/history có được biểu diễn bằng record append-only không?
- Các validation quan trọng có thể enforce ở CAP handler, không chỉ ở Fiori UI, không?
- Index, uniqueness rule, active flag và delete behavior đã đủ rõ cho implementation sau này chưa?

## Output Format

## English

For a database review, write:

1. Current model assessment.
2. Critical gaps.
3. Recommended target entities and relationships.
4. Open decisions that must be clarified before coding.
5. Suggested WP1 implementation sequence.
6. Verification commands.

## Vietnamese

Với database review, hãy viết:

1. Đánh giá model hiện tại.
2. Gap nghiêm trọng.
3. Entity và relationship target được khuyến nghị.
4. Quyết định còn mở cần làm rõ trước khi code.
5. Thứ tự implementation đề xuất cho WP1.
6. Các command verify.
