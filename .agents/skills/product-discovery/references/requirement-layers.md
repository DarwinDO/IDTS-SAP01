# Requirement Layers - IDTS BABOK Mapping

Use this file to classify requirements before writing BRD/SRS/FRS or changing SAP CAP/Fiori behavior.

Vietnamese: Dùng file này để phân loại requirement trước khi viết BRD/SRS/FRS hoặc thay đổi hành vi SAP CAP/Fiori.

## 1. Business Requirement

English: Explains why IDTS needs the change and what business value it creates.

IDTS example: Reduce lost or unowned SAP defect reports by making assignment owner and nextProcessor visible.

Vietnamese: Giải thích vì sao IDTS cần thay đổi và giá trị nghiệp vụ là gì.

Ví dụ IDTS: Giảm bug SAP bị thất lạc hoặc không có owner bằng cách hiển thị rõ assignee và nextProcessor.

## 2. Stakeholder Requirement

English: Explains who needs what from their role perspective.

IDTS example: As a PM, I need to see overdue and Pending Assignment bugs so that I can intervene before delivery risk grows.

Vietnamese: Giải thích ai cần gì từ góc nhìn role của họ.

Ví dụ IDTS: Là PM, tôi cần xem bug overdue và Pending Assignment để can thiệp trước khi rủi ro delivery tăng.

## 3. Functional Requirement

English: Explains what the system must do.

IDTS example: The system shall filter Developer value help by Component Category and optional SAP Module.

Vietnamese: Giải thích hệ thống phải làm gì.

Ví dụ IDTS: Hệ thống phải lọc value help Developer theo Component Category và SAP Module nếu có.

## 4. Non-functional Requirement

English: Explains how well the system must work: usability, auditability, security, performance, reliability.

IDTS example: Status changes must be auditable with actor, timestamp, old value, new value, and reason.

Vietnamese: Giải thích hệ thống phải hoạt động tốt đến mức nào: usability, audit, security, performance, reliability.

Ví dụ IDTS: Mọi thay đổi status phải audit được với actor, timestamp, old value, new value và reason.

## 5. Transition Requirement

English: Explains how the team moves from the current state to the future state.

IDTS example: Existing markdown requirements must be aligned into BRD/SRS/FRS before Sprint 1 coding starts.

Vietnamese: Giải thích team chuyển từ hiện trạng sang trạng thái tương lai bằng cách nào.

Ví dụ IDTS: Các markdown requirement hiện có cần được đồng bộ thành BRD/SRS/FRS trước khi bắt đầu code Sprint 1.

## Layer Status Table

Use this table during discovery:

| Layer | Status | Evidence |
| --- | --- | --- |
| Business Requirement | Clear / Partial / Missing | Why the change matters |
| Stakeholder Requirement | Clear / Partial / Missing | Who needs what |
| Functional Requirement | Clear / Partial / Missing | What the system does |
| Non-functional Requirement | Clear / Partial / Missing | Quality/audit/security/usability |
| Transition Requirement | Clear / Partial / Missing | How to move from current to future |

Vietnamese: Khi discovery, dùng bảng trên để chỉ ra layer nào đã rõ, layer nào còn thiếu và bằng chứng tương ứng.
