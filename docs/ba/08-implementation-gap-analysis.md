# 08 - Implementation Gap Analysis

Status: BA baseline draft v1  
Last updated: 2026-06-01

Implementation note - 2026-06-04:

WP1 Data Model Foundation has since expanded `db/schema.cds`, `srv/service.cds`, and `db/data/` from the minimal scaffold into a compile-ready CAP model. The original gap analysis below is kept for traceability and should be read as the pre-WP1 baseline.

Vietnamese: Ghi chú implementation - 2026-06-04: WP1 Data Model Foundation đã mở rộng `db/schema.cds`, `srv/service.cds` và `db/data/` từ scaffold tối giản thành CAP model compile-ready. Gap analysis bên dưới được giữ để traceability và nên đọc như baseline trước WP1.

## Current Repo Snapshot

| Area | Current state |
| --- | --- |
| Project type | SAP CAP Node.js project with Fiori app workspace. |
| Database model | `db/schema.cds` currently has a minimal `Bugs` entity only. |
| Service model | `srv/service.cds` exposes `Bugs` projection only. |
| Fiori app | `app/bug-management-ui` exists as generated Fiori app. |
| Local DB | SQLite dev dependency exists through `@cap-js/sqlite`. |
| Future DB | `@cap-js/postgres` dependency exists; HANA/PostgreSQL deployment not yet modeled. |

## Gap Summary

| Area | Current | Needed for MVP | Gap |
| --- | --- | --- | --- |
| Bug entity | Minimal fields: ID, title, description, status, priority, severity, category, createdAt. | Full bug fields with classification, assignment, reproduction, test context, planning, timestamps. | High |
| Master data | Not modeled. | Users, DeveloperProfiles, SAPModules, ApplicationComponents, DefectCategories, ComponentCategories, DeveloperResponsibilities. | High |
| Classification | Single `category` field. | SAP Module + Application Component + Defect Category + Component Category. | High |
| Assignment | No assignee model. | Assignee filtering by Developer Responsibility and optional SAP Module. | High |
| Status flow | String status only. | Controlled status set, backend transition validation, and explicit Rejected follow-up rules. | High |
| nextProcessor | Not modeled. | Auto-updated ownership field or queue behavior; required for rejected bug follow-up unless represented by a role queue. | High |
| Comments | Not modeled. | Bug-owned comments. | Medium |
| Attachments | Not modeled. | Attachment metadata and storage reference. | Medium |
| History logs | Not modeled. | Audit log for important changes. | High |
| Notifications | Not modeled. | Notification records/triggers. | Medium |
| PM monitoring | Not modeled. | Views/filters for workload, overdue, pending assignment, next processor. | High |
| Fiori annotations | Basic app files exist. | List Report/Object Page annotations, value helps, field groups, actions, semantic status. | High |
| CAP handlers | Not present. | Validation, status transition, assignment filtering, Rejected follow-up enforcement, nextProcessor, history log. | High |
| Seed data | Not confirmed. | Initial value lists and sample master data. | Medium |

## Recommended Implementation Phases

### Phase 1 - Core Model Foundation

Goal: Build the CDS data model needed for core bug tracking.

Tasks:

- Add Users and DeveloperProfiles.
- Add SAPModules, ApplicationComponents, DefectCategories, ComponentCategories.
- Add DeveloperResponsibilities.
- Expand Bugs with classification, assignment, reproduction, test context, planning, and nextProcessor fields.
- Add Comments and HistoryLogs.
- Add seed data for value helps.
- Run `cds compile srv --to edmx`.

### Phase 2 - Service and Value Help

Goal: Expose MVP entities and value helps through OData V4.

Tasks:

- Update `srv/service.cds` projections.
- Expose value-help entities needed by Fiori.
- Add service actions/functions only when needed for business operations.
- Keep service names stable for Fiori app.

### Phase 3 - CAP Handler Rules

Goal: Enforce business-critical logic in backend.

Tasks:

- Validate required fields.
- Validate classification pairs.
- Filter/validate assignee against DeveloperResponsibilities.
- Set Assigned or Pending Assignment on submit.
- Enforce status transition matrix.
- Enforce Rejected follow-up: rejection reason, nextProcessor or queue ownership, allowed return to Assigned or Pending Assignment.
- Maintain nextProcessor automatically.
- Write HistoryLogs for important actions.

### Phase 4 - Fiori Elements UX

Goal: Make the generated app usable for the core BA flow.

Tasks:

- Add List Report columns and filters.
- Add Object Page sections.
- Add value helps and dependent filters.
- Add action buttons for status transitions where appropriate.
- Add semantic status colors.
- Add message handling annotations where possible.

### Phase 5 - PM Monitoring

Goal: Support PM workload and risk monitoring.

Tasks:

- Add views/projections for open bugs, overdue bugs, pending assignment, workload by Developer, and nextProcessor queues.
- Add Fiori filters/views for PM.
- Add escalation flags if needed.

### Phase 6 - Attachments and Notifications

Goal: Add supporting evidence and notification records.

Tasks:

- Add Attachments metadata.
- Add Notifications records.
- Keep external notification delivery pluggable and non-hardcoded.

## Risks Before Coding

| Risk | Mitigation |
| --- | --- |
| Over-modeling too much before MVP | Implement phase by phase; do not build full ALM/test management. |
| Confusing SAP Module with IDTS feature/module | Use glossary and classification model consistently. |
| UI filters not matching backend validation | Implement backend validation first or in same phase. |
| Status actions exposed incorrectly | Use authorization matrix and status transition matrix. |
| nextProcessor misunderstood as second assignee | Keep docs and UI labels clear; backend updates automatically. |
| Rejected bugs left without owner | Require rejection reason, nextProcessor or role queue ownership, notification/history log, and follow-up transition. |
| History log forgotten | Add history logging to each critical handler early. |

## First Coding Recommendation

Start with Phase 1 only: CDS model + seed data + compile. Do not implement all handlers and Fiori actions in the same change. The current schema is too minimal, so a clear data model foundation is the safest first implementation step.

Vietnamese:

- Gap `Rejected` hiện tại: model/service/handler chưa có cách enforce bug bị reject phải có lý do, người xử lý tiếp và bước follow-up rõ ràng.
- Khi code Phase 1-3, cần bảo đảm `Rejected` không bị hiểu là trạng thái kết thúc; bug phải có đường quay lại `Assigned` hoặc `Pending Assignment` sau khi Tester hoặc PM xử lý.
