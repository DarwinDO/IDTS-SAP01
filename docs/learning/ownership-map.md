# IDTS Ownership Map

## English

Effective from 2026-07-13 (Asia/Bangkok), this map defines both file ownership and flow ownership. A primary owner maintains the area. A backup owner must be able to perform the first debugging pass when the primary owner is unavailable.

### Runtime file ownership

| Primary owner | Backup | Exact runtime scope |
| --- | --- | --- |
| DonHV | NhanT | `db/schema.cds`; every runtime file under `srv/` (service wiring, auth, bug-service, email, and AI). |
| DatDT | SangVN | `app/services.cds`; `app/bug-management-ui/annotations.cds`; annotations `labels.cds`, `list-report.cds`, `pm-monitoring.cds`; `webapp/index.html`, `login.html`, `dashboard.html`, `Component.js`, `auth-guard.js`, `login-page.js`, `dashboard-page.js`, both CSS files; `ext/ai/AiReviewUi.js`; all `ext/login/`; `ClassificationReview.js`, `DuplicateReview.js`, `HandoffSummaryReview.js`; `ClassificationReviewField.fragment.xml`, `SimilarBugReviewField.fragment.xml`. |
| SangVN | DatDT | annotations `actions.cds`, `capabilities.cds`, `history-notifications.cds`, `object-page.cds`, `ownership-assignment.cds`, `value-helps.cds`; `ext/sections/BugCollaboration.js`; both `ext/controls/`; `BugListActions.js`, `SmartAssignDeveloper.js`; `AttachmentsSection.fragment.xml`, `CommentsSection.fragment.xml`, `HistoryTimeline.fragment.xml`, `SmartAssignmentSection.fragment.xml`. |
| NhanT | DonHV | Every QA/browser harness and integration-test file under `scripts/qa/` and `app/bug-management-ui/webapp/test/`. These files are outside the 72-file runtime-comment retrofit, but remain code ownership. |

The three runtime groups above contain exactly 72 non-generated JS/CDS/XML/HTML/CSS files. A source file has one primary owner only; a runtime behavior can have several contributors.

### End-to-end flow ownership

| Flow | Primary | Backup | Required trace |
| --- | --- | --- | --- |
| Authentication, session, profile | DonHV | DatDT | Login UI -> AuthService -> Users/AuthSessions -> bearer token -> auth guard. |
| Create, validation, lifecycle | DonHV | SangVN | Fiori draft/OData -> service hooks -> validation -> Bugs/history/notifications. |
| Assignment, comments, attachments | SangVN | DonHV | Object Page -> OData action/composition -> authorization -> PostgreSQL/S3/history. |
| Dashboard, monitoring, history UI | DatDT | NhanT | Dashboard/Object Page -> OData read model -> derived monitoring/history fields. |
| Notification and email outbox | DonHV | NhanT | workflow event -> Notifications -> NotificationDeliveries -> worker/provider. |
| AI assistance | DonHV | DatDT and NhanT | UI review -> OData action -> safe provider/fallback -> AiSuggestions audit. |
| QA and release evidence | NhanT | DonHV | scenario -> browser/API harness -> evidence -> Jira/PR gate. |

## Vietnamese

Từ 13/07/2026 (Asia/Bangkok), map này định nghĩa đồng thời file ownership và flow ownership. Primary owner bảo trì khu vực chính. Backup owner phải làm được vòng debug đầu tiên khi primary owner không có mặt.

### Ownership theo runtime file

| Primary owner | Backup | Phạm vi runtime chính xác |
| --- | --- | --- |
| DonHV | NhanT | `db/schema.cds`; mọi runtime file trong `srv/` gồm service wiring, auth, bug-service, email và AI. |
| DatDT | SangVN | `app/services.cds`; `app/bug-management-ui/annotations.cds`; annotation `labels.cds`, `list-report.cds`, `pm-monitoring.cds`; `webapp/index.html`, `login.html`, `dashboard.html`, `Component.js`, `auth-guard.js`, `login-page.js`, `dashboard-page.js`, hai file CSS; `ext/ai/AiReviewUi.js`; toàn bộ `ext/login/`; `ClassificationReview.js`, `DuplicateReview.js`, `HandoffSummaryReview.js`; `ClassificationReviewField.fragment.xml`, `SimilarBugReviewField.fragment.xml`. |
| SangVN | DatDT | annotation `actions.cds`, `capabilities.cds`, `history-notifications.cds`, `object-page.cds`, `ownership-assignment.cds`, `value-helps.cds`; `ext/sections/BugCollaboration.js`; hai file `ext/controls/`; `BugListActions.js`, `SmartAssignDeveloper.js`; `AttachmentsSection.fragment.xml`, `CommentsSection.fragment.xml`, `HistoryTimeline.fragment.xml`, `SmartAssignmentSection.fragment.xml`. |
| NhanT | DonHV | Mọi QA/browser harness và integration-test trong `scripts/qa/` và `app/bug-management-ui/webapp/test/`. Những file này không thuộc đợt comment 72 runtime file nhưng vẫn thuộc code ownership. |

Ba nhóm runtime phía trên chứa đúng 72 file JS/CDS/XML/HTML/CSS không generated. Mỗi source file chỉ có một primary owner; một runtime behavior có thể có nhiều contributor.

### Ownership theo flow end-to-end

| Flow | Primary | Backup | Trace bắt buộc |
| --- | --- | --- | --- |
| Authentication, session, profile | DonHV | DatDT | Login UI -> AuthService -> Users/AuthSessions -> bearer token -> auth guard. |
| Create, validation, lifecycle | DonHV | SangVN | Fiori draft/OData -> service hooks -> validation -> Bugs/history/notifications. |
| Assignment, comments, attachments | SangVN | DonHV | Object Page -> OData action/composition -> authorization -> PostgreSQL/S3/history. |
| Dashboard, monitoring, history UI | DatDT | NhanT | Dashboard/Object Page -> OData read model -> derived monitoring/history fields. |
| Notification và email outbox | DonHV | NhanT | workflow event -> Notifications -> NotificationDeliveries -> worker/provider. |
| AI assistance | DonHV | DatDT và NhanT | UI review -> OData action -> safe provider/fallback -> AiSuggestions audit. |
| QA và release evidence | NhanT | DonHV | scenario -> browser/API harness -> evidence -> Jira/PR gate. |
