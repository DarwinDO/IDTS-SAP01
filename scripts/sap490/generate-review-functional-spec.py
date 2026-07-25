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
VERSION = "0.5"


GROUPS = [
    ("AUTH", "Authentication and session", "SRS-FR-AUTH", "/odata/v4/auth/", "srv/auth-service.js", "qa:auth:programmatic"),
    ("BUG", "Bug creation and validation", "SRS-FR-BUG", "/odata/v4/bug/Bugs", "srv/bug-service/bug-write.js", "qa:idts41:programmatic"),
    ("ASSIGN", "Assignment and responsibility", "SRS-FR-ASG", "/odata/v4/bug/Bugs", "srv/bug-service/actions.js", "qa:idts67:programmatic"),
    ("LIFE", "Lifecycle actions", "SRS-FR-LIFE", "/odata/v4/bug/Bugs(...)/<action>", "srv/service.js", "qa:idts89:programmatic"),
    ("COLLAB", "Comments and attachments", "SRS-FR-COLLAB", "/odata/v4/bug/Comments; Attachments", "srv/bug-service/content.js", "qa:comments-attachments:programmatic"),
    ("MON", "Dashboard and monitoring", "SRS-FR-MON", "/odata/v4/bug/DeveloperWorkloads", "srv/bug-service/read-models.js", "qa:pm-monitoring:programmatic"),
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
        "history": "v0.5 remediates all nine official-template tabs, removes SAP SD sample content, and traces every function to the deployed CAP/Fiori baseline.",
        "n_a_smart": "N/A — Not applicable to SAP CAP/Fiori implementation. IDTS uses Fiori Elements/SAPUI5 pages and OData V4; it does not generate SAP Smart Forms.",
        "screen_sections": [
            ("Login", "login.html / LoginPage.js", "Custom authentication entry; safe error, no sign-up"),
            ("Profile menu", "ProfileMenu.js", "Signed-in identity, role and sign-out"),
            ("Dashboard", "Dashboard.view.xml / Dashboard.controller.js", "Role-aware KPI and queues"),
            ("Bug List Report", "manifest.json / annotations", "Search, filter, create and navigation"),
            ("Bug Object Page", "annotations/actions.cds", "Summary, classification, assignment, lifecycle and evidence"),
            ("Smart Assign", "SmartAssignDeveloper.js", "Filtered Developer selection and review-only explanation"),
            ("AI review dialogs", "*Review.js", "Accept/reject/ignore; apply/confirm remain explicit actions"),
        ],
        "messages": [
            ("IDTS-MSG-400-REQ", "Required or invalid value.", "400", "Create/update validation", "Inline on the target field"),
            ("IDTS-MSG-401-AUTH", "Your session is missing or expired. Sign in again.", "401", "Auth middleware", "Before protected service processing"),
            ("IDTS-MSG-403-ROLE", "You are not authorized to perform this action.", "403", "Role/action authorization", "Before mutation"),
            ("IDTS-MSG-409-STATE", "The bug state changed. Reload and try again.", "409", "Stale/repeated action", "Before commit"),
            ("IDTS-MSG-ATTACH", "The attachment could not be processed safely.", "400/502", "Attachment validation/storage", "Upload/download"),
            ("IDTS-MSG-EMAIL", "Email delivery failed; the bug update was kept.", "200 + delivery FAILED", "Outbox worker", "After workflow commit"),
            ("IDTS-MSG-AI", "AI assistance is unavailable. Continue with the normal workflow.", "200/503 safe fallback", "AI provider seam", "No business mutation"),
        ],
        "processing": {
            "AUTH": "Login UI sends credentials to AuthService. srv/auth-service.js validates the account, creates a hashed AuthSessions record and returns a bearer token. Protected BugService requests resolve that session again.",
            "BUG": "Fiori editFlow.createDocument starts OData draft NEW. Field edits send PATCH to Bugs.drafts. SAVE activates through CREATE. prepareBugWrite validates required fields, active code lists, classification and server-derived bugNumber, reporter and status in one transaction.",
            "ASSIGN": "The value help reads AssignableDevelopers. assignToDeveloper or normal Bug write validates role, active Developer and DeveloperResponsibilities. No assignee produces Pending Assignment; a valid explicit assignee produces Assigned.",
            "LIFE": "The eleven bound actions are registered in srv/service.js. transitionBug or the specialized action validates role, reason, assignee and status transition, updates the Bug, derives nextProcessor, writes HistoryEvents/HistoryLogs and queues Notifications in the same transaction.",
            "COLLAB": "Comments are available after a Bug exists. Draft attachment upload holds content in the draft flow; activation persists metadata in PostgreSQL and binary content through the configured S3 attachment storage. Delete removes the authorized record/object.",
            "MON": "Role-aware read models calculate workload, overdue, Pending Assignment, Rejected follow-up and Retest Required queues without granting write authority.",
            "NOTIFY": "The workflow transaction creates Notifications and NotificationDeliveries. The background worker claims PENDING/eligible FAILED rows, calls Brevo/SMTP privately and records SENT/FAILED/SKIPPED without rolling back the Bug workflow.",
            "AI": "Suggestion actions use allowlisted Bug data. Review actions acceptAiSuggestion, rejectAiSuggestion and ignoreAiSuggestion persist reviewer state. applyClassificationSuggestion and confirmDuplicateSuggestion are separate authorized mutations. readAiOperationalMetrics is PM-only; operationStatus and latencyMs contain sanitized telemetry. Live OpenAI remains disabled/not accepted.",
        },
    },
    "vi": {
        "title": "ĐẶC TẢ CHỨC NĂNG",
        "name": "Đường cơ sở chức năng IDTS CAP/Fiori",
        "history": "v0.5 hoàn thiện đủ chín tab của mẫu chính thức, loại nội dung mẫu SAP SD và truy vết từng chức năng tới baseline CAP/Fiori đã triển khai.",
        "n_a_smart": "N/A — Không áp dụng cho triển khai SAP CAP/Fiori. IDTS dùng trang Fiori Elements/SAPUI5 và OData V4; hệ thống không sinh SAP Smart Form.",
        "screen_sections": [
            ("Đăng nhập", "login.html / LoginPage.js", "Điểm vào custom authentication; lỗi an toàn, không có đăng ký"),
            ("Menu hồ sơ", "ProfileMenu.js", "Danh tính, role đang đăng nhập và đăng xuất"),
            ("Dashboard", "Dashboard.view.xml / Dashboard.controller.js", "KPI và hàng đợi theo role"),
            ("Bug List Report", "manifest.json / annotations", "Tìm kiếm, lọc, tạo và điều hướng"),
            ("Bug Object Page", "annotations/actions.cds", "Tóm tắt, phân loại, phân công, vòng đời và bằng chứng"),
            ("Smart Assign", "SmartAssignDeveloper.js", "Lọc Developer và giải thích chỉ để tham khảo"),
            ("Hộp thoại AI review", "*Review.js", "Accept/reject/ignore; apply/confirm là action riêng có chủ ý"),
        ],
        "messages": [
            ("IDTS-MSG-400-REQ", "Thiếu dữ liệu hoặc giá trị không hợp lệ.", "400", "Validation create/update", "Hiện tại đúng field"),
            ("IDTS-MSG-401-AUTH", "Phiên đăng nhập thiếu hoặc hết hạn. Vui lòng đăng nhập lại.", "401", "Auth middleware", "Trước xử lý service được bảo vệ"),
            ("IDTS-MSG-403-ROLE", "Bạn không có quyền thực hiện thao tác này.", "403", "Role/action authorization", "Trước mutation"),
            ("IDTS-MSG-409-STATE", "Trạng thái Bug đã thay đổi. Hãy tải lại và thử lại.", "409", "Action cũ/lặp", "Trước commit"),
            ("IDTS-MSG-ATTACH", "Không thể xử lý tệp đính kèm một cách an toàn.", "400/502", "Attachment validation/storage", "Upload/download"),
            ("IDTS-MSG-EMAIL", "Gửi email thất bại; thay đổi của Bug vẫn được giữ.", "200 + delivery FAILED", "Outbox worker", "Sau workflow commit"),
            ("IDTS-MSG-AI", "AI đang không khả dụng. Hãy tiếp tục luồng bình thường.", "200/503 fallback an toàn", "AI provider seam", "Không mutation nghiệp vụ"),
        ],
        "processing": {
            "AUTH": "UI đăng nhập gửi credentials tới AuthService. srv/auth-service.js kiểm tra tài khoản, tạo AuthSessions với token đã băm và trả bearer token. Mỗi request BugService được bảo vệ đều resolve lại session này.",
            "BUG": "Fiori editFlow.createDocument bắt đầu OData draft NEW. Sửa field gửi PATCH tới Bugs.drafts. SAVE kích hoạt draft qua CREATE. prepareBugWrite kiểm tra field bắt buộc, code list active, classification và tự sinh bugNumber, reporter, status trong một transaction.",
            "ASSIGN": "Value help đọc AssignableDevelopers. assignToDeveloper hoặc Bug write kiểm tra role, Developer active và DeveloperResponsibilities. Không có assignee thì Pending Assignment; assignee hợp lệ được chọn rõ ràng thì Assigned.",
            "LIFE": "Mười một bound action được đăng ký trong srv/service.js. transitionBug hoặc action chuyên biệt kiểm tra role, reason, assignee và status transition; sau đó update Bug, xác định nextProcessor, ghi HistoryEvents/HistoryLogs và tạo Notifications trong cùng transaction.",
            "COLLAB": "Comment chỉ hoạt động sau khi Bug tồn tại. Upload attachment trước save đi theo draft; khi activate, metadata vào PostgreSQL và binary qua storage S3 đã cấu hình. Delete xóa record/object sau khi kiểm quyền.",
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
            "AT2": "DonHV",
            "BC2": DATE,
            "AT3": "DonHV",
            "BE3": DATE,
            "AT4": "Mentor / Supervisor",
            "BE4": "Pending",
        }
    elif ws.title == "Screen Layout":
        values = {
            "AS2": "DonHV",
            "BB2": DATE,
            "AS3": "Mentor / Supervisor",
            "BD3": "Pending",
        }
    else:
        date_column = "BC" if ws.title == "Message Definition" else "BB"
        values = {
            "I3": "IDTS-FS",
            "W3": "IDTS CAP/Fiori",
            "AS2": "DonHV",
            f"{date_column}2": DATE,
            "AS3": "DonHV",
            f"{date_column}3": DATE,
            "AS4": "Mentor / Supervisor",
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
        "N12": DATE,
        "Z12": DATE,
        "AE17": "DonHV",
        "Z17": "Pending",
        "U17": "Pending",
    }.items():
        write(cover, coordinate, value)

    history = workbook["Histories"]
    write(history, "B3", 1)
    write(history, "C3", VERSION)
    write(history, "D3", labels["history"])
    write(history, "E3", "All 9 official sheets")
    write(history, "F3", DATE)
    write(history, "G3", "DonHV")

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
        "Runtime baseline: origin/dev 8009b2a6a72d73db28f190b3a0bcbb65b1ff4740; "
        "Render deploy dep-d9i0r537uimc73as0be0. Each function traces to a requirement, OData contract, source handler and focused test.",
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
        ("Title", "Edm.String", "I/O", "Single", "Bugs.title", "255", "Yes", "Text", "No", "Required"),
        ("Priority", "Association", "I/O", "Single", "Bugs.priority", "-", "Yes", "Value help", "Yes", "Active code only"),
        ("Severity", "Association", "I/O", "Single", "Bugs.severity", "-", "Yes", "Value help", "Yes", "Active code only"),
        ("Assignee", "Association", "I/O", "Single", "Bugs.assignee", "-", "No", "Smart value help", "Yes", "Role/responsibility validated"),
        ("Status", "Association", "O", "Single", "Bugs.status", "-", "Yes", "Semantic status", "No", "Backend-owned"),
        ("Attachment", "Composition", "I/O", "Multi", "Bugs.attachments", "-", "No", "Upload set", "No", "Metadata PostgreSQL; binary S3"),
        ("AI review", "Bound action", "I/O", "Single", "AiSuggestions", "-", "No", "Review dialog", "No", "No automatic workflow mutation"),
    ]
    field_rows = [13, 14, 15, 17, 20, 22, 25]
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
        message_id, message, http_status, context, timing = record
        write(messages, f"B{row}", message_id)
        write(messages, f"F{row}", "EN" if language == "en" else "VI")
        write(messages, f"J{row}", f"{message} [HTTP {http_status}]")
        write(messages, f"AG{row}", f"{context}; {timing}")
        messages.row_dimensions[row].height = 38

    processing = workbook["Processing Description"]
    metadata(processing)
    clear_rows(processing, 6, 80)
    for index, (code, _, requirement, endpoint, handler, test) in enumerate(GROUPS, 1):
        row = 5 + (index * 2)
        merge_row(processing, row, "B", "AP")
        merge_row(processing, row + 1, "B", "AP")
        write_wrapped(processing, f"B{row}", f"{code} | {requirement} | {endpoint}", vertical="center")
        write_wrapped(processing, f"B{row + 1}", f"{labels['processing'][code]} Source: {handler}. Evidence: {test}.")
        processing.row_dimensions[row].height = 24
        processing.row_dimensions[row + 1].height = 72
    merge_row(processing, 24, "B", "AP")
    merge_row(processing, 26, "B", "AP")
    write_wrapped(processing, "B24", "Exact lifecycle actions: " + ", ".join(LIFECYCLE_ACTIONS))
    write_wrapped(processing, "B26", "AI review/apply/metrics symbols: " + ", ".join(AI_SYMBOLS))

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
