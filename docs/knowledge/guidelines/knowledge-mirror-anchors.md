# Knowledge Mirror Writing Guide — "Important source anchors"

This file provides the improved template and examples for the **"Important source anchors"** section inside source code knowledge mirrors (`docs/knowledge/db/...`, `docs/knowledge/srv/...`, `docs/knowledge/app/...`).

English version first. Vietnamese guidance follows.

---

## English

### Why the old pattern was weak

Previous anchors used repetitive generic text:

> Line 25: `async function prepareBugWrite(...)` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.

This does not help a new team member. It fails the "Source Code Knowledge Mirror Rule" requirement to explain:
- The exact line/declaration
- What IDTS business concept it controls
- How linked files are affected
- What breaks for real flows

### Goal of good anchors

Good anchors are short, precise, and **IDTS-oriented**. They connect code to:
- Status lifecycle and transitions (ASSIGNED, PENDING_ASSIGNMENT, REJECTED, RESOLVED, RETEST_REQUIRED, Closed...)
- Assignment rules (Component Category as key, DeveloperResponsibilities, nextProcessor)
- Ownership concepts (assignee vs nextProcessorUser/nextProcessorRole, Current Action Owner)
- Audit and follow-up (HistoryEvents + HistoryLogs, rejectionReason)
- Action capabilities and UI visibility (`canReject`, `canResolve` virtual fields + `@UI.Hidden`)
- Role-controlled behavior (Tester, Developer, PM)
- Side effects (history writing, notifications, status + nextProcessor updates)

### Recommended "Important source anchors" section (copy this structure)

Replace the old section with this in every mirror:

```markdown
### Important source anchors

These anchors highlight the most critical lines and declarations that control IDTS business behavior.
They are deliberately selective. For each anchor record:

- Exact location + minimal signature/declaration
- The IDTS domain concept or rule it directly implements (use the terms below)
- Business/user impact if this code is changed incorrectly
- Contracts in other layers that must stay consistent (CDS service/action, annotation, handler, seed data, UI facet)

- **Location**: `srv/bug-service/bug-write.js:25`
  `async function prepareBugWrite(req, entities, { isCreate })`
  **IDTS concept**: Core write pipeline executed on Bug create and patch. Auto-fills reporter on create, derives/validates `componentCategory` (the assignment key), decides initial/updated status (ASSIGNED vs PENDING_ASSIGNMENT), enforces `rejectionReason` for REJECTED status, calls `validateTransition` and `validateAssignee`.
  **Impact if broken**: New or edited bugs can receive wrong status, missing Component Category (breaks Developer responsibility matching), or enter REJECTED without reason + follow-up owner. PM monitoring flags and history become unreliable.
  **Must check together**: `srv/service.cds:4` (Bugs projection + virtual status flags + actions), `db/schema.cds:87` (Bugs entity + componentCategory + nextProcessor fields), `srv/bug-service/actions.js:184` (transitionBug and assignToDeveloper), `permissions.js`, `history.js`, Fiori `annotations/actions.cds` and Object Page assignee/status fields.

(Repeat for the 4–8 most important anchors in the file.)
```

### Recommended bullet format (use this for every anchor)

```
- **Location**: `path/to/file.js:NN`
  `code snippet or function/entity declaration`
  **IDTS concept**: <one sentence using domain terms>
  **Impact if broken**: <what Tester/Developer/PM experiences, which flow fails>
  **Must check together**: list of exact linked items in other layers (with line or entity/action reference when possible)
```

Keep bullets focused. One strong sentence per field is better than long paragraphs.

### IDTS domain vocabulary to prefer (use these terms)

Core entities and relationships:
- Bugs, componentCategory (assignment key), DeveloperProfiles, DeveloperResponsibilities, SAPModules, ApplicationComponents, DefectCategories, ComponentCategories

Status and transitions:
- STATUS.ASSIGNED, PENDING_ASSIGNMENT, IN_REVIEW, NEED_MORE_INFORMATION, IN_PROGRESS, RESOLVED, RETEST_REQUIRED, REJECTED, REOPENED, CLOSED
- validateTransition, transitionBug, rejectBug, resolveBug, requestMoreInformation, resubmitToDeveloper, reopenBug

Ownership:
- assignee (technical owner), nextProcessorUser, nextProcessorRole, currentActionOwnerDisplayName
- "Rejected is not final — it requires follow-up owner and action"

Audit and side effects:
- HistoryEvents (user-visible grouped), HistoryLogs (raw field audit)
- writeHistoryEvent, recordCreateSideEffects, recordUpdateSideEffects

Actions and UI control:
- assignToDeveloper, addComment, markInReview, startProgress, closeBug...
- canMarkInReview, canResolve, canReject, canClose, canReopen... (virtual capability fields)
- @UI.DataFieldForAction + @UI.Hidden using canXXX
- Side effects (Common.SideEffects)

PM and monitoring:
- isOverdue, isPendingAssignment, isRejectedFollowUp, isRetestRequired
- DeveloperWorkloads aggregate (assignee-based, includes zero-load active developers)

Other:
- draft enabled (`@odata.draft.enabled`)
- value helps (AssignableDevelopers, ValidDefectCategories)
- Tester / Developer / PM role checks

### Concrete rewritten examples (real IDTS code)

**Example 1 — bug-write.js (core create/update guard)**

- **Location**: `srv/bug-service/bug-write.js:25`
  `async function prepareBugWrite(req, entities, { isCreate })`
  **IDTS concept**: Central write pipeline. On create sets bugNumber + reporter, derives/validates componentCategory, forces status to ASSIGNED or PENDING_ASSIGNMENT, blocks REJECTED without rejectionReason, enforces validateTransition and validateAssignee.
  **Impact if broken**: Bugs bypass assignment rules and status model; rejected bugs have no reason; PM sees wrong isPendingAssignment / isRejectedFollowUp.
  **Must check together**: `srv/service.cds:4` (Bugs + virtuals), `db/schema.cds:87` (Bugs + ComponentCategories), `srv/bug-service/actions.js` (all transition callers), permissions.js, history.js, Fiori status/assignee annotations.

**Example 2 — actions.js (lifecycle transition centralizer)**

- **Location**: `srv/bug-service/actions.js:184`
  `async function transitionBug(req, entities, options)`
  **IDTS concept**: Single implementation for all developer/Tester lifecycle buttons. Enforces permission, optional reason, assignee presence, calls validateTransition, updates status + nextProcessor + rejectionReason, triggers history + notification side effects.
  **Impact if broken**: Developer can perform invalid transitions (e.g. direct to Closed), no history for PM, nextProcessor not updated, notifications missing for REJECTED / Resolved / Retest Required.
  **Must check together**: `srv/service.cds:29-78` (action declarations with note params), `annotations/actions.cds` (DataFieldForAction + @UI.Hidden on canXXX), `bug-write.js` (validateTransition), history.js, service.js wiring.

**Example 3 — db/schema.cds (core Bugs shape + compositions)**

- **Location**: `db/schema.cds:87` (entity Bugs) + lines 102, 114-118
  `entity Bugs { ... componentCategory : Association to ComponentCategories not null; ... comments, attachments, historyEvents, notifications, duplicateLinks as Composition ... }`
  **IDTS concept**: Central aggregate. componentCategory is the assignment key (derived from Application Component + Defect Category). Compositions own child lifecycle data (HistoryEvents for grouped timeline, attachments via @cap-js/attachments).
  **Impact if broken**: Assignment logic and DeveloperWorkloads break; history/audit becomes inconsistent; attachment rules (size, media types) lost.
  **Must check together**: `srv/service.cds:4` (projection + virtuals), `srv/service.js` + bug-service/* (read/write handlers), `app/.../annotations/object-page.cds` and `history-notifications.cds` (facets), seed data in db/data/.

**Example 4 — service.cds (action contract + virtual capabilities)**

- **Location**: `srv/service.cds:30-78` (inside Bugs actions) + virtuals ~16-28
  `action assignToDeveloper(assigneeID: UUID, note: String) returns Bugs; ... virtual canReject : Boolean, ...`
  **IDTS concept**: Public OData contract for Fiori buttons. Virtual canXXX fields drive @UI.Hidden in annotations and also server-side permission checks. Actions carry optional note/reason for transitions that require explanation (Reject, Need More Info, Resolve, Reopen).
  **Impact if broken**: Wrong buttons visible to wrong roles, missing notes on mandatory transitions, broken PM monitoring derived fields.
  **Must check together**: `annotations/actions.cds` + `capabilities.cds`, `srv/bug-service/actions.js` + `permissions.js`, handler implementations.

### When to update the anchors section

Update the anchors + the whole mirror note in the same task whenever you:
- Add, rename, or remove an action, virtual field, status rule, or composition
- Change how nextProcessor, componentCategory, or rejectionReason is set
- Modify permission or transition validation logic
- Add new side effects (history/notification)

Always keep the "Must check together" references accurate.

---

## Vietnamese

### Mục đích

Phần "Important source anchors" nhằm giúp thành viên mới nhanh chóng tìm được những dòng code quan trọng nhất ảnh hưởng đến nghiệp vụ IDTS (trạng thái, phân công, lịch sử, quyền hạn, nextProcessor...).

### Cấu trúc khuyến nghị (dùng lại)

Dùng đúng cấu trúc và format bullet đã nêu ở phần English ở trên.

### Thuật ngữ IDTS nên dùng (tiếng Việt tương đương)

- Trạng thái: ASSIGNED (Đã phân công), PENDING_ASSIGNMENT (Chờ phân công), REJECTED (Bị từ chối — không phải trạng thái cuối), RESOLVED, RETEST_REQUIRED...
- Phân công: componentCategory (khóa phân công), assignee (người chịu trách nhiệm kỹ thuật), nextProcessorUser / nextProcessorRole
- Hành động: assignToDeveloper, rejectBug, requestMoreInformation, resolveBug, resubmitToDeveloper...
- Lịch sử & side effect: HistoryEvents (lịch sử gộp cho người dùng), HistoryLogs (audit chi tiết)
- Khả năng hành động: canReject, canResolve... (dùng để ẩn/hiện nút trên Fiori)
- Vai trò: Tester, Developer, PM
- PM monitoring: isOverdue, DeveloperWorkloads, isRejectedFollowUp...

### Ví dụ đã viết lại (giống phần English)

Sử dụng các ví dụ cụ thể ở trên (giữ nguyên ý, có thể dịch ngắn gọn khi đưa vào mirror file).

### Lưu ý khi viết

- Ưu tiên giải thích "ảnh hưởng gì đến luồng nghiệp vụ IDTS" thay vì nói chung chung về "metadata".
- Mỗi bullet nên chỉ ra rõ file + dòng ở lớp khác cần kiểm tra cùng.
- Cập nhật phần này cùng lúc khi sửa source và cập nhật mirror note.

---

## Metadata

- Reference for: all `docs/knowledge/{db,srv,app}/**/*.md` mirror notes
- Related rule: Agents.md → "Source Code Knowledge Mirror Rule"
- Created for: improving onboarding and long-term maintainability of IDTS knowledge base
- Style: bilingual, IDTS-domain-first, actionable for new team members
- Last updated: 2026-06-22 (by donhv / agent)

Use this file as the living template when creating or refreshing any source mirror.
