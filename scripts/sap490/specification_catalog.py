"""Shared bilingual catalogs for the SAP490 Functional/Technical Specifications.

The generators consume these records directly so EN/VI artifacts keep the same
IDs and row order.  Technical identifiers intentionally remain untranslated;
all reader-facing explanation has an EN and a VI value.
"""

from __future__ import annotations


FUNCTIONS = [
    {
        "id": "FN-AUTH-01", "requirement": "SRS-FR-AUTH",
        "name": {"en": "Sign in and session management", "vi": "Đăng nhập và quản lý phiên"},
        "objective": {"en": "Authenticate an active IDTS user and protect application requests.", "vi": "Xác thực người dùng IDTS đang hoạt động và bảo vệ request của ứng dụng."},
        "actors": "Tester / Developer / PM", "trigger": {"en": "Submit sign-in form", "vi": "Gửi biểu mẫu đăng nhập"},
        "result": {"en": "Session token is issued once; protected shell opens.", "vi": "Token phiên được cấp một lần; shell được bảo vệ được mở."},
        "endpoint": "/odata/v4/auth/", "source": "srv/auth.js::login", "evidence": "qa:auth:programmatic",
    },
    {
        "id": "FN-BUG-01", "requirement": "SRS-FR-BUG",
        "name": {"en": "Create and validate a bug", "vi": "Tạo và kiểm tra Bug"},
        "objective": {"en": "Create a complete defect record through the CAP draft flow.", "vi": "Tạo bản ghi lỗi đầy đủ qua luồng draft của CAP."},
        "actors": "Tester / PM", "trigger": {"en": "Choose Create and save the draft", "vi": "Chọn Tạo và lưu draft"},
        "result": {"en": "Active Bug is created as Assigned or Pending Assignment.", "vi": "Bug active được tạo ở trạng thái Assigned hoặc Pending Assignment."},
        "endpoint": "/odata/v4/bug/Bugs", "source": "srv/bug-service/bug-write.js::prepareBugWrite", "evidence": "qa:idts41:programmatic",
    },
    {
        "id": "FN-ASG-01", "requirement": "SRS-FR-ASG",
        "name": {"en": "Assign or reassign a Developer", "vi": "Phân công hoặc phân công lại Developer"},
        "objective": {"en": "Select an active Developer with a matching responsibility.", "vi": "Chọn Developer đang hoạt động và có trách nhiệm phù hợp."},
        "actors": "Tester / PM", "trigger": {"en": "Confirm assignment", "vi": "Xác nhận phân công"},
        "result": {"en": "Assignee, status, next processor, history and notification are updated.", "vi": "Assignee, trạng thái, người xử lý tiếp theo, lịch sử và thông báo được cập nhật."},
        "endpoint": "BugService.assignToDeveloper", "source": "srv/bug-service/actions.js::assignToDeveloper", "evidence": "qa:idts67:programmatic",
    },
    {
        "id": "FN-COLLAB-01", "requirement": "SRS-FR-COLLAB",
        "name": {"en": "Comment and attachment collaboration", "vi": "Cộng tác bằng bình luận và tệp đính kèm"},
        "objective": {"en": "Keep reproducible discussion and evidence on an active Bug.", "vi": "Lưu trao đổi và bằng chứng có thể kiểm tra lại trên Bug active."},
        "actors": "Tester / Developer / PM", "trigger": {"en": "Add comment or upload/delete attachment", "vi": "Thêm bình luận hoặc tải lên/xóa tệp"},
        "result": {"en": "Comment or attachment metadata is persisted; binary is stored in S3.", "vi": "Bình luận hoặc metadata tệp được lưu; binary được lưu trên S3."},
        "endpoint": "/odata/v4/bug/Comments; /Attachments", "source": "srv/bug-service/content.js", "evidence": "qa:comments-attachments:programmatic",
    },
    {
        "id": "FN-MON-01", "requirement": "SRS-FR-MON",
        "name": {"en": "Role-aware dashboard and monitoring", "vi": "Dashboard và giám sát theo vai trò"},
        "objective": {"en": "Show actionable queues and workload without granting write authority.", "vi": "Hiển thị hàng đợi và tải công việc cần xử lý mà không cấp quyền ghi."},
        "actors": "Tester / Developer / PM", "trigger": {"en": "Open dashboard or monitoring filter", "vi": "Mở dashboard hoặc bộ lọc giám sát"},
        "result": {"en": "Role-scoped KPIs, queues and workloads are returned.", "vi": "KPI, hàng đợi và tải công việc theo vai trò được trả về."},
        "endpoint": "/odata/v4/bug/DeveloperWorkloads", "source": "srv/bug-service/monitoring.js::readDeveloperWorkloads", "evidence": "qa:pm-monitoring:programmatic",
    },
    {
        "id": "FN-NOTIFY-01", "requirement": "SRS-FR-NOTIFY",
        "name": {"en": "In-app and email notification", "vi": "Thông báo trong ứng dụng và email"},
        "objective": {"en": "Notify the next responsible user without rolling back the Bug workflow.", "vi": "Thông báo người chịu trách nhiệm tiếp theo mà không rollback workflow Bug."},
        "actors": "System worker", "trigger": {"en": "Committed workflow notification", "vi": "Thông báo workflow đã commit"},
        "result": {"en": "In-app notification persists and email delivery is tracked.", "vi": "Thông báo trong ứng dụng được lưu và việc gửi email được theo dõi."},
        "endpoint": "/odata/v4/bug/NotificationDeliveries", "source": "srv/email/worker.js::startEmailWorker", "evidence": "qa:email-outbox:programmatic",
    },
]


LIFECYCLE_ACTIONS = [
    ("assignToDeveloper", "Tester / PM", "Pending Assignment", "Assigned"),
    ("moveToPendingAssignment", "Tester / PM", "Assigned / Rejected", "Pending Assignment"),
    ("markInReview", "Developer", "Assigned", "In Review"),
    ("requestMoreInformation", "Developer", "Assigned / In Review / In Progress", "Need More Information"),
    ("resubmitToDeveloper", "Tester / PM", "Need More Information", "Assigned"),
    ("rejectBug", "Developer", "Assigned / In Review", "Rejected"),
    ("startProgress", "Developer", "Assigned / In Review", "In Progress"),
    ("resolveBug", "Developer", "In Review / In Progress", "Resolved"),
    ("sendToRetest", "Tester / PM", "Resolved", "Retest Required"),
    ("closeBug", "Tester / PM", "Resolved / Retest Required", "Closed"),
    ("reopenBug", "Tester / PM", "Resolved / Retest Required / Closed", "Assigned / Pending Assignment"),
]

for action, actors, before, after in LIFECYCLE_ACTIONS:
    FUNCTIONS.append({
        "id": f"FN-LIFE-{len([f for f in FUNCTIONS if f['id'].startswith('FN-LIFE-')]) + 1:02d}",
        "requirement": "SRS-FR-LIFE",
        "name": {"en": action, "vi": action},
        "objective": {"en": f"Perform the exact {action} lifecycle operation.", "vi": f"Thực hiện chính xác thao tác vòng đời {action}."},
        "actors": actors,
        "trigger": {"en": f"Invoke {action}", "vi": f"Gọi {action}"},
        "result": {"en": f"Status changes from {before} to {after} when permitted.", "vi": f"Trạng thái chuyển từ {before} sang {after} khi hợp lệ."},
        "endpoint": f"BugService.{action}",
        "source": "srv/service.js → srv/bug-service/actions.js",
        "evidence": "qa:idts89:programmatic",
    })


AI_FUNCTIONS = [
    ("FN-AI-01", "suggestSimilarBugs", "srv/ai/duplicate-detection.js::suggestSimilarBugs", "Review similar Bug candidates; no workflow mutation.", "Xem các Bug tương tự; không thay đổi workflow."),
    ("FN-AI-02", "suggestClassification", "srv/ai/classification-suggestion.js::suggestClassification", "Review suggested classification values.", "Xem các giá trị phân loại được đề xuất."),
    ("FN-AI-03", "summarizeBugHandoff", "srv/ai/bug-summary.js::summarizeBugHandoff", "Review a grounded handoff summary.", "Xem bản tóm tắt bàn giao có căn cứ."),
    ("FN-AI-04", "explainSmartAssignment", "srv/ai/assignment-explanation.js::explainSmartAssignment", "Explain candidates without automatic assignment.", "Giải thích ứng viên mà không tự động phân công."),
    ("FN-AI-05", "acceptAiSuggestion", "srv/ai/review.js::acceptAiSuggestion", "Persist the human ACCEPTED review decision only.", "Chỉ lưu quyết định review ACCEPTED của con người."),
    ("FN-AI-06", "rejectAiSuggestion", "srv/ai/review.js::rejectAiSuggestion", "Persist the human REJECTED review decision only.", "Chỉ lưu quyết định review REJECTED của con người."),
    ("FN-AI-07", "ignoreAiSuggestion", "srv/ai/review.js::ignoreAiSuggestion", "Persist the human IGNORED review decision only.", "Chỉ lưu quyết định review IGNORED của con người."),
    ("FN-AI-08", "applyClassificationSuggestion", "srv/ai/classification-apply.js::applyClassificationSuggestion", "Explicitly apply an accepted current suggestion.", "Áp dụng rõ ràng suggestion hiện tại đã được chấp nhận."),
    ("FN-AI-09", "confirmDuplicateSuggestion", "srv/ai/duplicate-confirmation.js::confirmDuplicateSuggestion", "Explicitly confirm an accepted duplicate candidate.", "Xác nhận rõ ràng ứng viên duplicate đã được chấp nhận."),
    ("FN-AI-10", "readAiOperationalMetrics", "srv/ai/metrics.js::readAiOperationalMetrics", "Return PM-only sanitized operationStatus and latencyMs metrics.", "Trả về metrics operationStatus và latencyMs đã làm sạch chỉ dành cho PM."),
]

for function_id, action, source, objective_en, objective_vi in AI_FUNCTIONS:
    FUNCTIONS.append({
        "id": function_id, "requirement": "SRS-FR-AI", "name": {"en": action, "vi": action},
        "objective": {"en": objective_en, "vi": objective_vi}, "actors": "Tester / Developer / PM (action-specific)",
        "trigger": {"en": f"Invoke {action}", "vi": f"Gọi {action}"},
        "result": {"en": "Reviewable result or explicit authorized mutation.", "vi": "Kết quả để review hoặc mutation rõ ràng đã được cấp quyền."},
        "endpoint": f"BugService.{action}", "source": source, "evidence": "qa:idts72:acceptance",
    })


SCREENS = [
    ("SCR-LOGIN", "Login", "Đăng nhập", "Custom SAPUI5 page", "login.html", "login-page.js; ext/login/LoginController.js", "AuthService.login", "Tester / Developer / PM", "Email, password, safe message", "Dashboard / protected app"),
    ("SCR-PROFILE", "Profile menu", "Menu hồ sơ", "SAPUI5 popover", "Profile shell", "ext/login/ProfileShell.js", "AuthService.me/logout", "Signed-in user", "Name, email, role, Sign Out", "Login after logout"),
    ("SCR-DASH", "Role dashboard", "Dashboard theo vai trò", "Custom SAPUI5 page", "dashboard.html", "dashboard-page.js", "BugService read models", "Tester / Developer / PM", "KPI cards, queues, workload", "Bug List Report"),
    ("SCR-LIST", "Bug List Report", "Danh sách Bug", "Fiori Elements List Report", "manifest route", "manifest.json; annotations", "BugService.Bugs", "Role-scoped", "Filters, table, Create", "Bug Object Page"),
    ("SCR-OBJECT", "Bug Object Page", "Trang chi tiết Bug", "Fiori Elements Object Page", "Bugs object route", "annotations/actions.cds", "BugService.Bugs", "Role-scoped", "Summary, classification, assignment, lifecycle", "Focused sections/dialogs"),
    ("SCR-COMMENT", "Comments", "Bình luận", "Object Page section", "Bug Object Page", "ext/sections/BugCollaboration.js", "Bugs.comments", "Bug participants", "Thread and Add Comment", "Same Object Page"),
    ("SCR-ATTACH", "Attachments", "Tệp đính kèm", "Object Page section", "Bug Object Page", "ext/sections/BugCollaboration.js", "Bugs.attachments", "Bug participants", "Upload, download, delete", "Same Object Page"),
    ("SCR-HISTORY", "History", "Lịch sử", "Object Page section", "Bug Object Page", "History section control", "HistoryEvents/HistoryLogs", "Bug participants", "Timeline and Show More", "Same Object Page"),
    ("SCR-NOTIFY", "Notifications", "Thông báo", "Application section/popover", "Protected shell", "ProfileShell / notification UI", "Notifications/NotificationDeliveries", "Signed-in user", "Read state and delivery status", "Related Bug"),
    ("SCR-ASSIGN", "Smart assignment", "Phân công thông minh", "Dialog/value help", "Bug Object Page", "ext/actions/SmartAssignDeveloper.js", "AssignableDevelopers", "Tester / PM", "Search, workload, responsibility, explanation", "Assignment section"),
    ("SCR-AI-CLASS", "Classification review", "Review phân loại", "Dialog", "Classification section", "ext/actions/ClassificationReview.js", "AiSuggestions/actions", "Tester / PM", "Accept, reject, ignore, apply", "Classification section"),
    ("SCR-AI-DUP", "Duplicate review", "Review trùng lặp", "Dialog", "Bug summary", "ext/actions/DuplicateReview.js", "AiSuggestions/DuplicateLinks", "Tester / PM", "Candidates, review, confirm", "Bug summary"),
    ("SCR-AI-HANDOFF", "Handoff summary review", "Review tóm tắt bàn giao", "Dialog", "History section", "ext/actions/HandoffSummaryReview.js", "AiSuggestions", "Bug participants", "Grounded summary and review", "History section"),
]


MESSAGES = [
    {
        "id": "IDTS-MSG-400-REQ", "http": "400", "target": "Field / request",
        "message": {"en": "Enter a valid required value.", "vi": "Hãy nhập giá trị bắt buộc hợp lệ."},
        "trigger": {"en": "Required, code-list or classification validation fails.", "vi": "Kiểm tra required, code list hoặc phân loại thất bại."},
        "screen": "Create/Edit Bug", "role": "Tester / PM", "timing": {"en": "Before write commit", "vi": "Trước khi commit dữ liệu ghi"},
        "ui": {"en": "Inline field/request message.", "vi": "Thông báo tại field/request."},
        "source": "srv/bug-service/bug-write.js::prepareBugWrite", "rollback": {"en": "Request transaction rolls back; no mutation.", "vi": "Transaction của request rollback; không mutation."},
        "log": {"en": "Sanitized validation context only.", "vi": "Chỉ ghi ngữ cảnh validation đã làm sạch."}, "evidence": "qa:idts41:programmatic",
    },
    {
        "id": "IDTS-MSG-401-AUTH", "http": "401", "target": "Request",
        "message": {"en": "Your session is missing or expired. Sign in again.", "vi": "Phiên đăng nhập không tồn tại hoặc đã hết hạn. Hãy đăng nhập lại."},
        "trigger": {"en": "Bearer session is missing, expired or revoked.", "vi": "Phiên bearer bị thiếu, hết hạn hoặc bị thu hồi."},
        "screen": "Protected application", "role": "Anonymous / expired user", "timing": {"en": "Before protected handler", "vi": "Trước handler được bảo vệ"},
        "ui": {"en": "Safe error or login redirect.", "vi": "Lỗi an toàn hoặc chuyển về đăng nhập."},
        "source": "srv/auth/custom-auth.js", "rollback": {"en": "No mutation starts.", "vi": "Không mutation nào bắt đầu."},
        "log": {"en": "No token/session detail.", "vi": "Không ghi chi tiết token/session."}, "evidence": "qa:auth:programmatic",
    },
    {
        "id": "IDTS-MSG-403-ROLE", "http": "403", "target": "Action / field",
        "message": {"en": "You are not authorized to perform this action.", "vi": "Bạn không có quyền thực hiện thao tác này."},
        "trigger": {"en": "The authenticated role or ownership is not permitted.", "vi": "Vai trò hoặc ownership đã xác thực không được phép."},
        "screen": "Role-controlled action", "role": "Unauthorized authenticated user", "timing": {"en": "Before mutation", "vi": "Trước mutation"},
        "ui": {"en": "Safe message dialog.", "vi": "Hộp thoại thông báo an toàn."},
        "source": "srv/bug-service/permissions.js", "rollback": {"en": "No business mutation is committed.", "vi": "Không mutation nghiệp vụ nào được commit."},
        "log": {"en": "Sanitized actor/action context.", "vi": "Ngữ cảnh actor/action đã làm sạch."}, "evidence": "qa:auth:programmatic",
    },
    {
        "id": "IDTS-MSG-409-AI", "http": "409", "target": "AiSuggestions",
        "message": {"en": "This AI suggestion changed. Reload and review the latest state.", "vi": "Suggestion AI đã thay đổi. Hãy tải lại và review trạng thái mới nhất."},
        "trigger": {"en": "Suggestion is stale or already reviewed.", "vi": "Suggestion đã cũ hoặc đã được review."},
        "screen": "AI review dialog", "role": "Authorized reviewer", "timing": {"en": "Before review/apply commit", "vi": "Trước commit review/apply"},
        "ui": {"en": "Close/reload review state.", "vi": "Đóng/tải lại trạng thái review."},
        "source": "srv/ai/review.js; srv/ai/classification-apply.js", "rollback": {"en": "AI transaction is not committed.", "vi": "Transaction AI không được commit."},
        "log": {"en": "Sanitized suggestion ID/status.", "vi": "Suggestion ID/status đã làm sạch."}, "evidence": "qa:idts91:programmatic",
    },
    {
        "id": "IDTS-MSG-ATTACH", "http": "400 / 502", "target": "Attachment",
        "message": {"en": "The attachment could not be processed safely.", "vi": "Không thể xử lý tệp đính kèm một cách an toàn."},
        "trigger": {"en": "File validation or storage provider operation fails.", "vi": "Validation file hoặc thao tác storage provider thất bại."},
        "screen": "Attachments section", "role": "Bug participant", "timing": {"en": "During attachment request", "vi": "Trong request tệp đính kèm"},
        "ui": {"en": "Upload control error with retry guidance.", "vi": "Lỗi upload control kèm hướng dẫn thử lại."},
        "source": "srv/bug-service/content.js", "rollback": {"en": "Attachment write rolls back; Bug remains.", "vi": "Ghi attachment rollback; Bug được giữ nguyên."},
        "log": {"en": "Provider detail is sanitized.", "vi": "Chi tiết provider được làm sạch."}, "evidence": "qa:comments-attachments:programmatic",
    },
    {
        "id": "IDTS-MSG-EMAIL", "http": "Delivery FAILED", "target": "NotificationDeliveries",
        "message": {"en": "Email delivery failed; the Bug update was kept.", "vi": "Gửi email thất bại; cập nhật Bug vẫn được giữ."},
        "trigger": {"en": "Email provider call fails after workflow commit.", "vi": "Lời gọi email provider thất bại sau khi workflow commit."},
        "screen": "Notification delivery status", "role": "System worker", "timing": {"en": "After workflow commit", "vi": "Sau khi workflow commit"},
        "ui": {"en": "No workflow error dialog; delivery remains observable.", "vi": "Không hiện lỗi workflow; delivery vẫn được theo dõi."},
        "source": "srv/email/worker.js", "rollback": {"en": "Bug workflow is not rolled back.", "vi": "Workflow Bug không rollback."},
        "log": {"en": "Sanitized provider summary and retry state.", "vi": "Tóm tắt provider và trạng thái retry đã làm sạch."}, "evidence": "qa:email-outbox:programmatic",
    },
    {
        "id": "IDTS-MSG-AI", "http": "200 fallback / sanitized error", "target": "AI review dialog",
        "message": {"en": "AI assistance is unavailable. Continue with the normal workflow.", "vi": "Hỗ trợ AI hiện không khả dụng. Hãy tiếp tục workflow thông thường."},
        "trigger": {"en": "Provider is disabled, unavailable or returns no safe result.", "vi": "Provider bị tắt, không khả dụng hoặc không trả kết quả an toàn."},
        "screen": "AI review dialog", "role": "Authorized user", "timing": {"en": "After AI request", "vi": "Sau request AI"},
        "ui": {"en": "Safe fallback/no-result state.", "vi": "Trạng thái fallback/không có kết quả an toàn."},
        "source": "srv/ai/provider.js", "rollback": {"en": "No autonomous Bug workflow mutation.", "vi": "Không tự động mutation workflow Bug."},
        "log": {"en": "No raw prompt, response or secret.", "vi": "Không ghi prompt, response hoặc secret thô."}, "evidence": "qa:idts72:acceptance",
    },
]


PROCESS_STEPS = [
    ("STEP-01", "Tester / PM", "Sign in", "—", "Authenticated", "Authenticated user/session", "Auth session token issued once"),
    ("STEP-02", "Tester / PM", "Create Bug draft and save", "Draft", "Assigned / Pending Assignment", "Developer or Tester/PM", "Bug, history and notification commit"),
    ("STEP-03", "Developer", "Review and work on assigned Bug", "Assigned", "In Review / In Progress", "Developer", "Exact action history"),
    ("STEP-04", "Developer", "Request more information", "Assigned / In Review / In Progress", "Need More Information", "Reporter Tester", "Notification to reporter"),
    ("STEP-05", "Tester / PM", "Resubmit corrected information", "Need More Information", "Assigned", "Developer", "History and notification"),
    ("STEP-06", "Developer", "Resolve Bug", "In Review / In Progress", "Resolved", "Tester / PM", "Resolution history and notification"),
    ("STEP-07", "Tester / PM", "Retest and close or reopen", "Resolved / Retest Required", "Closed / Assigned", "None / Developer", "Final or reopened history"),
]


TECH_REQUIREMENTS = [
    ("SRS-FR-AUTH", "Authenticate users and enforce bearer sessions", "Tester / Developer / PM", "/odata/v4/auth/", "Verify password hash; persist tokenHash; resolve protected request user", "srv/auth.js; srv/auth/custom-auth.js", "Users; AuthSessions", "qa:auth:programmatic"),
    ("SRS-FR-BUG", "Create/update valid Bugs through draft and active writes", "Tester / PM", "/odata/v4/bug/Bugs", "Validate required fields, active catalogs and derived classification before commit", "srv/service.js; srv/bug-service/bug-write.js", "Bugs; code lists", "qa:idts41:programmatic"),
    ("SRS-FR-ASG", "Assign an eligible Developer", "Tester / PM", "BugService.assignToDeveloper", "Validate role, active Developer and DeveloperResponsibilities", "srv/bug-service/actions.js; permissions.js", "Bugs; DeveloperResponsibilities", "qa:idts67:programmatic"),
    ("SRS-FR-LIFE", "Enforce eleven exact lifecycle actions", "Role/action-specific", "BugService bound actions", "Validate role, status, reason and assignee; derive next processor", "srv/service.js; srv/bug-service/actions.js", "Bugs; HistoryEvents; HistoryLogs", "qa:idts89:programmatic"),
    ("SRS-FR-COLLAB", "Persist comments and attachment evidence", "Bug participants", "/Comments; /Attachments", "Authorize active Bug collaboration and separate metadata from binary storage", "srv/bug-service/content.js", "Comments; Attachments; S3 object", "qa:comments-attachments:programmatic"),
    ("SRS-FR-MON", "Return role-aware workload and queues", "Tester / Developer / PM", "/DeveloperWorkloads", "Build read-only KPI/filter rows from current Bug ownership and dates", "srv/bug-service/monitoring.js", "Bugs; DeveloperProfiles", "qa:pm-monitoring:programmatic"),
    ("SRS-FR-NOTIFY", "Persist in-app and outbox delivery state", "System", "/NotificationDeliveries", "Commit notification with workflow; send externally after commit with retry/lock", "srv/email/outbox.js::writeNotificationRecord; srv/email/worker.js::startEmailWorker", "Notifications; NotificationDeliveries", "qa:email-outbox:programmatic"),
    ("SRS-FR-AI", "Provide human-reviewed AI assistance", "Action-specific", "BugService AI actions", "Use allowlisted data, persist review state, require explicit apply/confirm mutation", "srv/ai/", "AiSuggestions; DuplicateLinks", "qa:idts72:acceptance"),
]


TECH_FLOWS = [
    ("FLOW-AUTH", "Submit sign-in form", "POST /odata/v4/auth/login", "AuthService", "srv/auth.js::login", "Request transaction", "Users read; AuthSessions insert", "Token returned once or safe 401", "qa:auth:programmatic"),
    ("FLOW-DRAFT-CREATE", "Create and edit draft", "POST/PATCH /odata/v4/bug/Bugs draft; SAVE", "BugService.Bugs", "prepareDraftNew / prepareDraftPatch / handleDraftSave / prepareBugWrite", "CAP request transaction", "Bugs insert; history/notification", "Active Bug or safe validation error", "qa:idts41:programmatic"),
    ("FLOW-ACTIVE-EDIT", "Edit active Bug and save", "EDIT/PATCH /odata/v4/bug/Bugs draft; SAVE/UPDATE", "BugService.Bugs", "prepareDraftPatch / prepareBugWrite", "CAP request transaction", "Bugs update; history/notification", "Updated active Bug", "qa:idts23:full-regression"),
    ("FLOW-ASSIGN", "Confirm Developer selection", "POST /odata/v4/bug/Bugs(...)/BugService.assignToDeveloper", "BugService", "srv/bug-service/actions.js::assignToDeveloper", "CAP request transaction", "Bugs/next processor/history/notification", "Assigned or safe 400/403", "qa:idts67:programmatic"),
    ("FLOW-LIFECYCLE", "Invoke bound lifecycle action", "POST /odata/v4/bug/Bugs(...)/BugService.<action>", "BugService", "srv/bug-service/actions.js::transitionBug", "CAP request transaction", "Bug/status/history/notification", "Exact permitted transition", "qa:idts89:programmatic"),
    ("FLOW-COLLAB", "Add comment or attachment", "POST/PUT/DELETE /odata/v4/bug child entity", "BugService", "BugCollaboration.js::pendingCreateAttachmentsByBugId; srv/bug-service/content.js", "CAP request + S3 provider boundary", "Client pending memory; PostgreSQL metadata; S3 binary", "Persisted evidence or safe error", "qa:comments-attachments:programmatic"),
    ("FLOW-MON", "Open dashboard/filter", "GET /odata/v4/bug read model", "BugService", "srv/bug-service/monitoring.js::readDeveloperWorkloads", "Read-only request", "No mutation", "Role-scoped KPI rows", "qa:pm-monitoring:programmatic"),
    ("FLOW-EMAIL", "Process eligible outbox row", "Background worker", "Email worker", "srv/email/worker.js", "Worker transaction after workflow commit", "NotificationDeliveries status/retry", "SENT/FAILED/SKIPPED", "qa:email-outbox:programmatic"),
    ("FLOW-AI", "Request/review/apply AI assistance", "POST /odata/v4/bug BugService AI action", "BugService", "acceptAiSuggestion; rejectAiSuggestion; ignoreAiSuggestion; applyClassificationSuggestion; confirmDuplicateSuggestion; readAiOperationalMetrics", "Action transaction", "AiSuggestions.operationStatus/latencyMs; optional explicit Bug/DuplicateLink mutation", "Review result or safe fallback", "qa:idts72:acceptance"),
]
