"""Generate the EN/VI Functional Specification from the official template."""

from __future__ import annotations

from copy import copy
from datetime import date
from pathlib import Path
import shutil

from openpyxl import load_workbook
from openpyxl.cell.cell import MergedCell
from openpyxl.drawing.image import Image as XLImage
from openpyxl.styles import Alignment


ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / "docs" / "sap490" / "templates" / "Deliverable_template" / "Functional_Specification.xlsx"
OUT = ROOT / "docs" / "sap490" / "generated"
DATE = date(2026, 7, 25)
VERSION = "0.6"


GROUPS = [
    ("AUTH", "Authentication and session", "SRS-FR-AUTH", "/odata/v4/auth/", "srv/auth.js", "qa:auth:programmatic"),
    ("BUG", "Bug creation and validation", "SRS-FR-BUG", "/odata/v4/bug/Bugs", "srv/bug-service/bug-write.js", "qa:idts41:programmatic"),
    ("ASSIGN", "Assignment and responsibility", "SRS-FR-ASG", "/odata/v4/bug/Bugs", "srv/bug-service/actions.js", "qa:idts67:programmatic"),
    ("LIFE", "Lifecycle actions", "SRS-FR-LIFE", "/odata/v4/bug/Bugs(...)/<action>", "srv/service.js", "qa:idts89:programmatic"),
    ("COLLAB", "Comments and attachments", "SRS-FR-COLLAB", "/odata/v4/bug/Comments; Attachments", "srv/bug-service/content.js", "qa:comments-attachments:programmatic"),
    ("MON", "Dashboard and monitoring", "SRS-FR-MON", "/odata/v4/bug/DeveloperWorkloads", "srv/bug-service/monitoring.js", "qa:pm-monitoring:programmatic"),
    ("NOTIFY", "In-app and email notification", "SRS-FR-NOTIFY", "/odata/v4/bug/NotificationDeliveries", "srv/email/worker.js", "qa:email-outbox:programmatic"),
    ("AI", "Human-reviewed AI assistance", "SRS-FR-AI", "/odata/v4/bug/<AI action>", "srv/ai/", "qa:idts72:acceptance"),
]

AI_SYMBOLS = [
    "acceptAiSuggestion",
    "rejectAiSuggestion",
    "ignoreAiSuggestion",
    "applyClassificationSuggestion",
    "confirmDuplicateSuggestion",
    "readAiOperationalMetrics",
    "operationStatus",
    "latencyMs",
]

LIFECYCLE_ACTIONS = [
    "assignToDeveloper",
    "moveToPendingAssignment",
    "markInReview",
    "requestMoreInformation",
    "resubmitToDeveloper",
    "rejectBug",
    "startProgress",
    "resolveBug",
    "sendToRetest",
    "closeBug",
    "reopenBug",
]


TEXT = {
    "en": {
        "title": "FUNCTIONAL SPECIFICATION",
        "name": "IDTS CAP/Fiori Functional Baseline",
        "history": "v0.6 corrects runtime traces, expands screen/message/processing records, and aligns acceptance wording with verified Shared QA evidence.",
        "n_a_smart": "N/A — Not applicable to SAP CAP/Fiori implementation. IDTS uses Fiori Elements/SAPUI5 pages and OData V4; it does not generate SAP Smart Forms.",
        "screen_sections": [
            ("Login", "login.html / login-page.js / ext/login/LoginController.js", "Custom authentication entry; safe error, no sign-up"),
            ("Profile menu", "ext/login/ProfileShell.js", "Signed-in identity, role and sign-out"),
            ("Dashboard", "dashboard.html / dashboard-page.js", "Role-aware KPI and queues"),
            ("Bug List Report", "manifest.json / annotations", "Search, filter, create and navigation"),
            ("Bug Object Page", "annotations/actions.cds", "Summary, classification, assignment, lifecycle and evidence"),
            ("Smart Assign", "SmartAssignDeveloper.js", "Filtered Developer selection and review-only explanation"),
            ("AI review dialogs", "ClassificationReview.js / DuplicateReview.js / HandoffSummaryReview.js / SmartAssignDeveloper.js", "Accept/reject/ignore; apply/confirm remain explicit actions"),
        ],
        "messages": [
            ("IDTS-MSG-400-REQ", "Required or invalid value.", "400", "prepareBugWrite / code-list and classification validators", "field target", "Tester/PM create or update", "request transaction rolls back", "Inline field message; sanitized validation log"),
            ("IDTS-MSG-401-AUTH", "Your session is missing or expired. Sign in again.", "401", "srv/auth/custom-auth.js", "request", "Anonymous/expired session", "no mutation", "Login redirect or safe error; no token detail"),
            ("IDTS-MSG-403-ROLE", "You are not authorized to perform this action.", "403", "enforceBugCreatePermission / enforceBugWritePermission / enforceActionPermission", "action or field", "Role outside permission", "no mutation", "Message dialog; safe actor/action log"),
            ("IDTS-MSG-409-AI", "This AI suggestion has already changed. Reload and review the latest state.", "409", "srv/ai/review.js / srv/ai/classification-apply.js", "AiSuggestions", "Authorized AI reviewer", "AI review/apply transaction rolls back", "Review dialog reloads; no generic lifecycle claim"),
            ("IDTS-MSG-ATTACH", "The attachment could not be processed safely.", "400/502", "BugCollaboration.js / srv/bug-service/content.js", "attachment", "Authorized Bug participant", "attachment write rolls back; Bug remains", "Upload control error; provider detail sanitized"),
            ("IDTS-MSG-EMAIL", "Email delivery failed; the bug update was kept.", "200 + delivery FAILED", "srv/email/worker.js", "NotificationDeliveries", "System worker", "workflow stays committed; delivery retry tracked", "No workflow error dialog; sanitized delivery log"),
            ("IDTS-MSG-AI", "AI assistance is unavailable. Continue with the normal workflow.", "200 safe fallback or sanitized provider error", "srv/ai/provider.js and focused AI action", "AI review dialog", "Authorized user", "no Bug workflow mutation", "Safe fallback/no-result state; no prompt/raw response"),
        ],
        "processing": {
            "AUTH": "login-page.js and LoginController.js call AuthService.login in srv/auth.js. The raw token is returned once to the browser; only its hash is stored in AuthSessions.tokenHash. ProfileShell.js later calls me/logout, while custom-auth.js resolves the bearer token for protected BugService requests.",
            "BUG": "Fiori editFlow.createDocument starts OData draft NEW. Field edits send PATCH to Bugs.drafts. SAVE activates through CREATE. prepareBugWrite validates required fields, active code lists, classification and server-derived bugNumber, reporter and status in one transaction.",
            "ASSIGN": "The value help reads AssignableDevelopers. assignToDeveloper or normal Bug write validates role, active Developer and DeveloperResponsibilities. No assignee produces Pending Assignment; a valid explicit assignee produces Assigned.",
            "LIFE": "The eleven bound actions are registered in srv/service.js. transitionBug or the specialized action validates role, reason, assignee and status transition, updates the Bug, derives nextProcessor, writes HistoryEvents/HistoryLogs and queues Notifications in the same transaction.",
            "COLLAB": "Comments are hidden until an active Bug exists. Before create SAVE, BugCollaboration.js holds selected files in pendingCreateAttachmentsByBugId (client memory). After Bug activation succeeds, it calls the attachment API; PostgreSQL stores metadata and S3 stores binary content. Delete removes the authorized record/object.",
            "MON": "Role-aware read models calculate workload, overdue, Pending Assignment, Rejected follow-up and Retest Required queues without granting write authority.",
            "NOTIFY": "The workflow transaction creates Notifications and NotificationDeliveries. The background worker claims PENDING/eligible FAILED rows, calls Brevo/SMTP privately and records SENT/FAILED/SKIPPED without rolling back the Bug workflow.",
            "AI": "Suggestion actions use allowlisted Bug data. Review actions acceptAiSuggestion, rejectAiSuggestion and ignoreAiSuggestion persist reviewer state. applyClassificationSuggestion and confirmDuplicateSuggestion are separate authorized mutations. readAiOperationalMetrics is PM-only; operationStatus and latencyMs contain sanitized telemetry. Live OpenAI remains disabled/not accepted.",
        },
    },
    "vi": {
        "title": "ĐẶC TẢ CHỨC NĂNG",
        "name": "Đường cơ sở chức năng IDTS CAP/Fiori",
        "history": "v0.6 sửa truy vết runtime, bổ sung bản ghi màn hình/thông báo/xử lý và đồng bộ nội dung nghiệm thu với bằng chứng Shared QA đã xác minh.",
        "n_a_smart": "N/A — Không áp dụng cho triển khai SAP CAP/Fiori. IDTS dùng trang Fiori Elements/SAPUI5 và OData V4; hệ thống không sinh SAP Smart Form.",
        "screen_sections": [
            ("Đăng nhập", "login.html / login-page.js / ext/login/LoginController.js", "Điểm vào xác thực tùy chỉnh; lỗi an toàn, không có đăng ký"),
            ("Menu hồ sơ", "ext/login/ProfileShell.js", "Danh tính, vai trò đang đăng nhập và đăng xuất"),
            ("Dashboard", "dashboard.html / dashboard-page.js", "KPI và hàng đợi theo vai trò"),
            ("Bug List Report", "manifest.json / annotations", "Tìm kiếm, lọc, tạo và điều hướng"),
            ("Bug Object Page", "annotations/actions.cds", "Tóm tắt, phân loại, phân công, vòng đời và bằng chứng"),
            ("Smart Assign", "SmartAssignDeveloper.js", "Lọc Developer và giải thích chỉ để tham khảo"),
            ("Hộp thoại đánh giá AI", "ClassificationReview.js / DuplicateReview.js / HandoffSummaryReview.js / SmartAssignDeveloper.js", "Chấp nhận/từ chối/bỏ qua; áp dụng/xác nhận là thao tác riêng có chủ ý"),
        ],
        "messages": [
            ("IDTS-MSG-400-REQ", "Thiếu dữ liệu hoặc giá trị không hợp lệ.", "400", "prepareBugWrite / bộ kiểm tra code list và phân loại", "trường dữ liệu", "Tester/PM tạo hoặc cập nhật", "hoàn tác request transaction", "Hiện lỗi tại đúng trường; log validation đã làm sạch"),
            ("IDTS-MSG-401-AUTH", "Phiên đăng nhập thiếu hoặc hết hạn. Vui lòng đăng nhập lại.", "401", "srv/auth/custom-auth.js", "request", "Ẩn danh/phiên hết hạn", "không ghi dữ liệu", "Chuyển về đăng nhập hoặc lỗi an toàn; không lộ token"),
            ("IDTS-MSG-403-ROLE", "Bạn không có quyền thực hiện thao tác này.", "403", "enforceBugCreatePermission / enforceBugWritePermission / enforceActionPermission", "thao tác hoặc trường", "Vai trò ngoài quyền", "không ghi dữ liệu", "Hộp thoại dễ hiểu; log actor/action an toàn"),
            ("IDTS-MSG-409-AI", "Gợi ý AI này đã thay đổi. Hãy tải lại và đánh giá trạng thái mới nhất.", "409", "srv/ai/review.js / srv/ai/classification-apply.js", "AiSuggestions", "Người đánh giá AI có quyền", "hoàn tác transaction đánh giá/áp dụng AI", "Tải lại hộp thoại đánh giá; không tuyên bố 409 chung cho lifecycle"),
            ("IDTS-MSG-ATTACH", "Không thể xử lý tệp đính kèm một cách an toàn.", "400/502", "BugCollaboration.js / srv/bug-service/content.js", "tệp đính kèm", "Người tham gia Bug có quyền", "hoàn tác ghi tệp; Bug vẫn giữ nguyên", "Lỗi tại upload control; chi tiết provider được làm sạch"),
            ("IDTS-MSG-EMAIL", "Gửi email thất bại; thay đổi của Bug vẫn được giữ.", "200 + delivery FAILED", "srv/email/worker.js", "NotificationDeliveries", "Worker hệ thống", "workflow đã commit; theo dõi retry delivery", "Không hiện lỗi workflow; log delivery đã làm sạch"),
            ("IDTS-MSG-AI", "AI đang không khả dụng. Hãy tiếp tục luồng bình thường.", "200 fallback an toàn hoặc lỗi provider đã làm sạch", "srv/ai/provider.js và AI action tương ứng", "hộp thoại đánh giá AI", "Người dùng có quyền", "không thay đổi workflow Bug", "Trạng thái fallback/không có kết quả; không lộ prompt/raw response"),
        ],
        "processing": {
            "AUTH": "login-page.js và LoginController.js gọi AuthService.login trong srv/auth.js. Raw token chỉ được trả một lần cho trình duyệt; database chỉ lưu bản băm trong AuthSessions.tokenHash. ProfileShell.js gọi me/logout, còn custom-auth.js resolve bearer token cho request BugService được bảo vệ.",
            "BUG": "Fiori editFlow.createDocument bắt đầu OData draft NEW. Sửa field gửi PATCH tới Bugs.drafts. SAVE kích hoạt draft qua CREATE. prepareBugWrite kiểm tra field bắt buộc, code list active, classification và tự sinh bugNumber, reporter, status trong một transaction.",
            "ASSIGN": "Value help đọc AssignableDevelopers. assignToDeveloper hoặc Bug write kiểm tra role, Developer active và DeveloperResponsibilities. Không có assignee thì Pending Assignment; assignee hợp lệ được chọn rõ ràng thì Assigned.",
            "LIFE": "Mười một bound action được đăng ký trong srv/service.js. transitionBug hoặc action chuyên biệt kiểm tra role, reason, assignee và status transition; sau đó update Bug, xác định nextProcessor, ghi HistoryEvents/HistoryLogs và tạo Notifications trong cùng transaction.",
            "COLLAB": "Comment bị ẩn cho đến khi có Bug active. Trước khi SAVE tạo Bug, BugCollaboration.js giữ file đã chọn trong pendingCreateAttachmentsByBugId (bộ nhớ phía client). Sau khi activate thành công, UI gọi attachment API; PostgreSQL lưu metadata và S3 lưu binary. Delete xóa record/object sau khi kiểm quyền.",
            "MON": "Read model theo role tính workload, overdue, Pending Assignment, Rejected follow-up và Retest Required nhưng không cấp quyền ghi.",
            "NOTIFY": "Workflow transaction tạo Notifications và NotificationDeliveries. Worker claim dòng PENDING/FAILED còn lượt, gọi Brevo/SMTP bằng cấu hình private rồi ghi SENT/FAILED/SKIPPED mà không rollback Bug.",
            "AI": "Suggestion action chỉ dùng dữ liệu Bug allowlist. acceptAiSuggestion, rejectAiSuggestion và ignoreAiSuggestion lưu trạng thái review. applyClassificationSuggestion và confirmDuplicateSuggestion là mutation riêng có kiểm quyền. readAiOperationalMetrics chỉ cho PM; operationStatus và latencyMs là telemetry đã làm sạch. OpenAI live vẫn disabled/not accepted.",
        },
    },
}


def writable(ws, coordinate):
    cell = ws[coordinate]
    if not isinstance(cell, MergedCell):
        return cell
    for merged in ws.merged_cells.ranges:
        if coordinate in merged:
            return ws.cell(merged.min_row, merged.min_col)
    raise ValueError(f"No merge anchor for {ws.title}!{coordinate}")


def write(ws, coordinate, value):
    cell = writable(ws, coordinate)
    cell.value = value


def write_wrapped(ws, coordinate, value, *, vertical="top"):
    cell = writable(ws, coordinate)
    cell.value = value
    alignment = copy(cell.alignment)
    cell.alignment = Alignment(
        horizontal=alignment.horizontal,
        vertical=vertical,
        text_rotation=alignment.text_rotation,
        wrap_text=True,
        shrink_to_fit=False,
        indent=alignment.indent,
    )


def make_text_visible(ws, coordinates):
    """Preserve template typography but force printable text to black."""
    for coordinate in coordinates:
        cell = writable(ws, coordinate)
        font = copy(cell.font)
        font.color = "FF000000"
        cell.font = font


def merge_row(ws, row, start_column, end_column):
    target = f"{start_column}{row}:{end_column}{row}"
    if target not in {str(item) for item in ws.merged_cells.ranges}:
        ws.merge_cells(target)


def clear_rows(ws, start, end):
    for row in ws.iter_rows(min_row=start, max_row=end):
        for cell in row:
            if not isinstance(cell, MergedCell):
                cell.value = None


def remove_broken_defined_names(workbook):
    broken = [
        name
        for name, item in workbook.defined_names.items()
        if "#REF!" in str(item.attr_text)
    ]
    for name in broken:
        del workbook.defined_names[name]


def metadata(ws):
    for row in (2, 3, 4):
        for column in ("AS", "AT", "AU", "AV", "AW", "AX", "BB", "BC", "BD", "BE"):
            try:
                write(ws, f"{column}{row}", None)
            except ValueError:
                pass
    if ws.title == "Function Overview":
        values = {
            "I3": "IDTS-FS",
            "AB3": "IDTS CAP/Fiori",
            "AT2": " DonHV",
            "BC2": DATE.isoformat(),
            "AT3": " DonHV",
            "BE3": DATE.isoformat(),
            "AT4": " Mentor / Supervisor",
            "BE4": "Pending",
        }
    elif ws.title == "Screen Layout":
        values = {
            "AS2": " DonHV",
            "BB2": DATE.isoformat(),
            "AS3": " Mentor / Supervisor",
            "BD3": "Pending",
        }
    else:
        date_column = "BC" if ws.title == "Message Definition" else "BB"
        values = {
            "I3": "IDTS-FS",
            "W3": "IDTS CAP/Fiori",
            "AS2": " DonHV",
            f"{date_column}2": DATE.isoformat(),
            "AS3": " DonHV",
            f"{date_column}3": DATE.isoformat(),
            "AS4": " Mentor / Supervisor",
            f"{date_column}4": "Pending",
        }
    for coordinate, value in values.items():
        try:
            write(ws, coordinate, value)
        except ValueError:
            continue


def build(language):
    labels = TEXT[language]
    output = OUT / f"Functional_Specification_IDTS_SAP01_{language}_v{VERSION}.xlsx"
    OUT.mkdir(parents=True, exist_ok=True)
    shutil.copy2(TEMPLATE, output)
    workbook = load_workbook(output)
    remove_broken_defined_names(workbook)

    cover = workbook["Cover"]
    for coordinate, value in {
        "B8": labels["title"],
        "N11": "IDTS",
        "Z11": "Issue and Defect Tracking System in SAP",
        "N12": DATE.isoformat(),
        "Z12": DATE.isoformat(),
        "AE17": "DonHV",
        "Z17": "Pending",
        "U17": "Pending",
    }.items():
        write(cover, coordinate, value)

    history = workbook["Histories"]
    clear_rows(history, 3, 10)
    history_rows = {
        "en": [
            ("0.1", "Initial functional baseline", "Cover and initial process scope", date(2026, 6, 21)),
            ("0.2", "Sprint workflow alignment", "Function overview and lifecycle flow", date(2026, 7, 2)),
            ("0.3", "Shared QA and integration", "Attachment, email and monitoring behavior", date(2026, 7, 24)),
            ("0.4", "AI advisory baseline", "Human-review AI functions and boundaries", date(2026, 7, 24)),
            ("0.5", "Official-template remediation", "All 9 sheets; SAP sample residue removed", date(2026, 7, 25)),
            ("0.6", labels["history"], "Runtime trace, completeness and formality", DATE),
        ],
        "vi": [
            ("0.1", "Nền đặc tả chức năng ban đầu", "Trang bìa và phạm vi quy trình ban đầu", date(2026, 6, 21)),
            ("0.2", "Đồng bộ quy trình Sprint", "Tổng quan chức năng và luồng vòng đời", date(2026, 7, 2)),
            ("0.3", "Shared QA và tích hợp", "Hành vi tệp đính kèm, email và giám sát", date(2026, 7, 24)),
            ("0.4", "Nền AI tư vấn", "Chức năng AI có con người đánh giá và ranh giới", date(2026, 7, 24)),
            ("0.5", "Khắc phục theo template chính thức", "Đủ 9 sheet; loại nội dung mẫu SAP", date(2026, 7, 25)),
            ("0.6", labels["history"], "Truy vết runtime, độ đầy đủ và tính trang trọng", DATE),
        ],
    }[language]
    for index, (version, summary, affected, changed_date) in enumerate(history_rows, 3):
        for coordinate, value in {
            f"B{index}": index - 2,
            f"C{index}": version,
            f"D{index}": summary,
            f"E{index}": affected,
            f"F{index}": changed_date.isoformat(),
            f"G{index}": "DonHV",
        }.items():
            write(history, coordinate, value)
        history.row_dimensions[index].height = 34

    overview = workbook["Function Overview"]
    metadata(overview)
    write(overview, "I3", "IDTS-FS")
    write(overview, "AB3", labels["name"])
    write(overview, "AB6", "SRS-FR-AUTH; SRS-FR-BUG; SRS-FR-ASG; SRS-FR-LIFE; SRS-FR-COLLAB; SRS-FR-MON; SRS-FR-NOTIFY; SRS-FR-AI")
    for row, pair_start in enumerate(range(0, len(GROUPS), 2), 15):
        lines = []
        for code, name, requirement, endpoint, handler, test in GROUPS[pair_start:pair_start + 2]:
            lines.append(f"{code} — {name} | {requirement} | {endpoint} | {handler} | {test}")
        merge_row(overview, row, "B", "BH")
        write_wrapped(overview, f"B{row}", "\n".join(lines))
        overview.row_dimensions[row].height = 42
    merge_row(overview, 19, "B", "BH")
    write_wrapped(overview, "B19", "AI review/apply symbols: " + ", ".join(AI_SYMBOLS))
    overview.row_dimensions[19].height = 42
    merge_row(overview, 21, "B", "BH")
    write_wrapped(
        overview,
        "B21",
        "Runtime baseline: 8009b2a6a72d73db28f190b3a0bcbb65b1ff4740; documentation baseline: "
        "origin/dev 9eee79cbb741962403b2d35ee33efc2eb3d18c46; Render deploy dep-d9i0r537uimc73as0be0. "
        "Each function traces to a requirement, OData contract, exact source handler and focused evidence.",
    )
    overview.row_dimensions[21].height = 48

    process = workbook["Process Flow"]
    metadata(process)
    process._images = []
    flow_rows = [
        "1. Sign in → AuthService validates account/session → open protected Fiori shell.",
        "2. Tester/PM creates draft: NEW → PATCH → SAVE/CREATE; backend validation remains authoritative.",
        "3. Select valid Developer → Assigned; leave empty → Pending Assignment.",
        "4. Developer actions: " + ", ".join(LIFECYCLE_ACTIONS[2:7]) + ".",
        "5. Tester/PM follow-up: resubmit, retest, close or reopen; exact history and notifications are persisted.",
        "6. Comments and attachments support evidence; PostgreSQL stores metadata and S3 stores binary content.",
        "7. AI suggestions are reviewed first; apply/duplicate confirmation are explicit authorized actions; OpenAI live is disabled.",
    ]
    if language == "vi":
        flow_rows = [
            "1. Đăng nhập → AuthService kiểm tra account/session → mở Fiori shell được bảo vệ.",
            "2. Tester/PM tạo draft: NEW → PATCH → SAVE/CREATE; backend luôn là nơi validation cuối.",
            "3. Chọn Developer hợp lệ → Assigned; để trống → Pending Assignment.",
            "4. Developer xử lý qua các action có kiểm quyền và điều kiện trạng thái.",
            "5. Tester/PM resubmit, retest, close hoặc reopen; history exact-action và notification được persist.",
            "6. Comment/attachment lưu bằng chứng; PostgreSQL lưu metadata và S3 lưu binary.",
            "7. AI suggestion phải review; apply/xác nhận duplicate là action riêng có kiểm quyền; OpenAI live đang tắt.",
        ]
    for row, text in enumerate(flow_rows, 6):
        merge_row(process, row, "B", "AH")
        write_wrapped(process, f"B{row}", text)
        process.row_dimensions[row].height = 38
    flow_image = XLImage(ROOT / "docs" / "diagrams" / "rendered" / "png" / "04-end-to-end-defect-flow.png")
    flow_image.width = 720
    flow_image.height = 405
    process.add_image(flow_image, "AJ6")
    write(process, "B44", "Supplement / Bổ sung: source baseline 8009b2a6a72d73db28f190b3a0bcbb65b1ff4740")
    process_supplement = [
        "Role flow: Tester/PM creates and assigns; the assigned Developer reviews and resolves; Tester/PM retests, closes or reopens.",
        "Control flow: every write is revalidated by CAP authorization, code-list, assignee and lifecycle rules before commit.",
        "Atomic side effects: Bug state, next processor, exact-action history and in-app notification commit in one request transaction.",
        "External boundaries: PostgreSQL stores business metadata, S3 stores attachment binary, and the email worker runs after workflow commit.",
    ]
    if language == "vi":
        process_supplement = [
            "Luồng vai trò: Tester/PM tạo và phân công; Developer được giao việc review/xử lý; Tester/PM kiểm thử lại, đóng hoặc mở lại.",
            "Luồng kiểm soát: mọi thao tác ghi đều được CAP kiểm tra lại quyền, code list, assignee và vòng đời trước khi commit.",
            "Side effect nguyên tử: trạng thái Bug, người xử lý tiếp theo, exact-action history và thông báo trong ứng dụng commit trong cùng request transaction.",
            "Ranh giới ngoài: PostgreSQL lưu metadata nghiệp vụ, S3 lưu binary attachment, email worker chạy sau workflow commit.",
        ]
    for row, text in enumerate(process_supplement, 45):
        merge_row(process, row, "B", "BG")
        write_wrapped(process, f"B{row}", text)
        process.row_dimensions[row].height = 34

    layout = workbook["Screen Layout"]
    metadata(layout)
    clear_rows(layout, 28, 78)
    additional_sections = [
        ("Comments", "Comments section/controller extension", "Threaded collaboration after Bug creation"),
        ("Attachments", "Attachment control + provider seam", "Draft upload, S3 persistence, download and delete"),
        ("History", "HistoryEvents/HistoryLogs fragment", "Exact action, actor, status and changed fields"),
        ("Notifications", "Notification section/profile popover", "In-app read state and delivery visibility"),
        ("Classification", "annotation value helps", "Active SAP module/component/category controls"),
        ("Assignment", "Assignment section + smart value help", "Explicit valid Developer selection; no auto-assign"),
        ("Lifecycle actions", "actions.cds + controller extensions", "Role/status-aware bound actions"),
        ("Monitoring filters", "Dashboard/List Report filters", "Pending, overdue, rejected and retest queues"),
        ("Empty/error states", "Fiori messages and busy handling", "Human-readable recovery without dev-facing text"),
        ("Responsive/accessibility", "UI5 layout and semantic controls", "Desktop/tablet, keyboard focus and labels"),
    ]
    if language == "vi":
        additional_sections = [
            ("Bình luận", "Comments section/controller extension", "Trao đổi theo luồng sau khi Bug được tạo"),
            ("Tệp đính kèm", "Attachment control + provider seam", "Upload draft, lưu S3, download và delete"),
            ("Lịch sử", "HistoryEvents/HistoryLogs fragment", "Exact action, actor, status và field thay đổi"),
            ("Thông báo", "Notification section/profile popover", "Trạng thái đọc trong ứng dụng và delivery"),
            ("Phân loại", "annotation value helps", "Kiểm soát SAP module/component/category active"),
            ("Phân công", "Assignment section + smart value help", "Chọn Developer hợp lệ rõ ràng; không auto-assign"),
            ("Action vòng đời", "actions.cds + controller extensions", "Bound action theo role/status"),
            ("Bộ lọc monitoring", "Dashboard/List Report filters", "Hàng đợi pending, overdue, rejected và retest"),
            ("Trạng thái rỗng/lỗi", "Fiori messages and busy handling", "Hướng phục hồi dễ hiểu, không có text nội bộ"),
            ("Responsive/accessibility", "UI5 layout and semantic controls", "Desktop/tablet, keyboard focus và label"),
        ]
    record_rows = [28, 29, 30, 31, 33, 35, 37, 38, 39, 41, 43, 45, 47, 49, 50, 51, 52]
    all_sections = labels["screen_sections"] + additional_sections
    for index, ((name, technical, purpose), row) in enumerate(zip(all_sections, record_rows), 1):
        write(layout, f"C{row}", index)
        write(layout, f"F{row}", name)
        if not isinstance(layout[f"N{row}"], MergedCell):
            write(layout, f"N{row}", technical)
        write(layout, f"S{row}", "Fiori Object Page/shell")
        write(layout, f"AA{row}", purpose)
        layout.row_dimensions[row].height = max(layout.row_dimensions[row].height or 19.5, 34)
        visible_cells = [f"C{row}", f"F{row}", f"S{row}", f"AA{row}"]
        if not isinstance(layout[f"N{row}"], MergedCell):
            visible_cells.append(f"N{row}")
        make_text_visible(layout, visible_cells)
    make_text_visible(layout, ["C27", "F27", "N27", "S27", "AA27"])
    screen_supplement = [
        "Navigation: login → role-aware dashboard/List Report → Bug Object Page → focused dialog/action → refreshed OData state.",
        "UX/security boundary: Fiori Elements remains the standard List/Object Page shell; custom SAPUI5 is limited to focused experiences, and UI visibility never replaces backend authorization or validation.",
    ]
    if language == "vi":
        screen_supplement = [
            "Điều hướng: đăng nhập → dashboard/List Report theo role → Bug Object Page → dialog/action tập trung → refresh trạng thái OData.",
            "Ranh giới UX/bảo mật: Fiori Elements giữ vai trò shell chuẩn; custom SAPUI5 chỉ dùng cho trải nghiệm cần thiết, và ẩn/hiện UI không thay thế authorization hoặc validation backend.",
        ]
    for row, text in enumerate(screen_supplement, 94):
        merge_row(layout, row, "B", "BG")
        write_wrapped(layout, f"B{row}", text)
        layout.row_dimensions[row].height = 40

    definition = workbook["Screen Definition"]
    metadata(definition)
    clear_rows(definition, 12, 74)
    write(definition, "B9", "1. IDTS Fiori screens")
    write(definition, "B12", "1.1 Main fields and actions")
    fields = [
        ("Title", "Edm.String", "I/O", "Single", "Bugs.title", "255", "Yes", "Text", "No", "Required; backend validated"),
        ("Description", "Edm.String", "I/O", "Single", "Bugs.description", "-", "Yes", "Text area", "No", "Required during activation"),
        ("Steps to Reproduce", "Edm.String", "I/O", "Single", "Bugs.stepsToReproduce", "-", "Yes", "Text area", "No", "Required during activation"),
        ("Actual Result", "Edm.String", "I/O", "Single", "Bugs.actualResult", "-", "Yes", "Text area", "No", "Required during activation"),
        ("Expected Result", "Edm.String", "I/O", "Single", "Bugs.expectedResult", "-", "Yes", "Text area", "No", "Required during activation"),
        ("Priority", "Association", "I/O", "Single", "Bugs.priority", "-", "Yes", "Fixed value help", "Yes", "Active code only"),
        ("Severity", "Association", "I/O", "Single", "Bugs.severity", "-", "Yes", "Fixed value help", "Yes", "Active code only"),
        ("Environment", "Association", "I/O", "Single", "Bugs.environment", "-", "Yes", "Fixed value help", "Yes", "Active code only"),
        ("Application Component", "Association", "I/O", "Single", "Bugs.applicationComponent", "-", "Yes", "Value help", "Yes", "Active classification"),
        ("Defect Category", "Association", "I/O", "Single", "Bugs.defectCategory", "-", "Yes", "Value help", "Yes", "Must match Component Category"),
        ("SAP Module", "Association", "I/O", "Single", "Bugs.sapModule", "-", "No", "Value help", "Yes", "Optional assignment context"),
        ("Assignee", "Association", "I/O", "Single", "Bugs.assignee", "-", "No", "Smart value help", "Yes", "Tester/PM; responsibility validated"),
        ("Status", "Association", "O", "Single", "Bugs.status", "-", "Yes", "Semantic status", "No", "Backend-owned"),
        ("Current Action Owner", "Association", "O", "Single", "Bugs.nextProcessorUser", "-", "No", "Display", "No", "Distinct from technical assignee"),
        ("Comment", "Composition", "I/O", "Multi", "Bugs.comments", "-", "No", "Thread/list", "No", "Hidden during create; available after save"),
        ("Attachment", "Composition", "I/O", "Multi", "Bugs.attachments", "-", "No", "Upload set", "No", "Pending client memory → API → PostgreSQL/S3"),
        ("History", "Composition", "O", "Multi", "Bugs.historyEvents", "-", "No", "Timeline/show more", "No", "Exact action, actor and changed fields"),
        ("Notification", "Composition", "O", "Multi", "Notifications", "-", "No", "List/status", "No", "In-app plus email delivery state"),
        ("Lifecycle Actions", "Bound actions", "I/O", "Multi", "BugService.<action>", "-", "No", "Action buttons", "No", "Visibility advisory; backend authorizes"),
        ("AI Review", "Bound actions", "I/O", "Multi", "AiSuggestions", "-", "No", "Review dialog", "No", "Review does not mutate Bug workflow"),
    ]
    field_rows = [13, 14, 15, 17, 20, 22, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38]
    for index, (record, row) in enumerate(zip(fields, field_rows), 1):
        name, kind, io, cardinality, binding, length, required, fmt, help_flag, remark = record
        values = {
            f"B{row}": index,
            f"C{row}": name,
            f"I{row}": kind,
            f"M{row}": io,
            f"O{row}": cardinality,
            f"R{row}": binding,
            f"U{row}": length,
            f"AA{row}": required,
            f"AI{row}": fmt,
            f"AQ{row}": help_flag,
            f"AW{row}": remark,
        }
        for coordinate, value in values.items():
            write(definition, coordinate, value)
        definition.row_dimensions[row].height = max(definition.row_dimensions[row].height or 19.5, 34)
        make_text_visible(definition, list(values))
    make_text_visible(
        definition,
        ["B9", "B10", "R10", "AW10", "C11", "I11", "M11", "O11", "R11", "U11",
         "X11", "AA11", "AE11", "AI11", "AM11", "AQ11", "B12"],
    )

    smart = workbook["Smart Form Structure"]
    smart._images = []
    merge_row(smart, 2, "B", "AG")
    merge_row(smart, 4, "B", "AG")
    write_wrapped(smart, "B2", "Smart Form Structure — N/A", vertical="center")
    write_wrapped(smart, "B4", labels["n_a_smart"])
    smart.row_dimensions[2].height = 28
    smart.row_dimensions[4].height = 52
    smart.print_area = "B1:AG57"
    clear_rows(smart, 44, 57)
    write(smart, "B44", 1)
    write(smart, "E44", "Applicability")
    write(smart, "M44", "N/A")
    write(smart, "R44", "Entire sheet")
    write(smart, "Z44", labels["n_a_smart"])
    smart.row_dimensions[44].height = 54

    messages = workbook["Message Definition"]
    metadata(messages)
    clear_rows(messages, 6, 40)
    for row, record in enumerate(labels["messages"], 6):
        message_id, message, http_status, handler, target, role, rollback, ui_log = record
        write(messages, f"B{row}", message_id)
        write(messages, f"F{row}", "EN" if language == "en" else "VI")
        write(messages, f"J{row}", f"{message} [HTTP {http_status}]")
        write(messages, f"AG{row}", f"Handler: {handler}; target: {target}; role/context: {role}; rollback: {rollback}; UI/log: {ui_log}")
        messages.row_dimensions[row].height = 58

    processing = workbook["Processing Description"]
    metadata(processing)
    clear_rows(processing, 6, 80)
    function_records = [
        (code, requirement, endpoint, handler, labels["processing"][code], test)
        for code, _, requirement, endpoint, handler, test in GROUPS
    ]
    function_records.extend(
        (
            f"LIFE-{action}",
            "SRS-FR-LIFE",
            f"/odata/v4/bug/Bugs(...)/BugService.{action}",
            "srv/service.js → srv/bug-service/actions.js",
            f"Bound action {action} rechecks role/state and commits permitted Bug/history/notification changes in the request transaction.",
            "qa:idts89:programmatic",
        )
        for action in LIFECYCLE_ACTIONS
    )
    function_records.extend([
        ("AI-review", "SRS-FR-AI", "/odata/v4/bug/<accept|reject|ignore>AiSuggestion", "srv/ai/review.js", "Persist reviewer decision only; no automatic Bug mutation.", "qa:idts91:programmatic"),
        ("AI-classification", "SRS-FR-AI", "/odata/v4/bug/applyClassificationSuggestion", "srv/ai/classification-apply.js", "Apply only an accepted, current classification suggestion through normal CAP validation.", "qa:idts92:programmatic"),
        ("AI-duplicate", "SRS-FR-AI", "/odata/v4/bug/confirmDuplicateSuggestion", "srv/ai/duplicate-confirmation.js", "Confirm an accepted candidate without self/reverse duplicate and without lifecycle mutation.", "qa:idts95:programmatic"),
        ("AI-metrics", "SRS-FR-AI", "/odata/v4/bug/readAiOperationalMetrics", "srv/ai/metrics.js", "PM-only sanitized operational counts/latency; no prompt, response, email or secret.", "qa:idts97:programmatic"),
    ])
    for index, (code, requirement, endpoint, handler, description, test) in enumerate(function_records, 1):
        row = 5 + (index * 2)
        merge_row(processing, row, "B", "AP")
        merge_row(processing, row + 1, "B", "AP")
        write_wrapped(processing, f"B{row}", f"{code} | {requirement} | {endpoint}", vertical="center")
        write_wrapped(processing, f"B{row + 1}", f"{description} Source: {handler}. Transaction/storage/evidence boundary: {test}.")
        processing.row_dimensions[row].height = 24
        processing.row_dimensions[row + 1].height = 72

    workbook.properties.title = f"IDTS SAP490 Functional Specification {language.upper()} v{VERSION}"
    workbook.properties.subject = "Official-template functional baseline for CAP/Fiori"
    workbook.properties.creator = "IDTS SAP01 Team"
    workbook.save(output)
    return output


def main():
    for language in ("en", "vi"):
        print(build(language).relative_to(ROOT))


if __name__ == "__main__":
    main()
