"""Generate Technical Specification and Configuration Note from official templates."""

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
TEMPLATES = ROOT / "docs" / "sap490" / "templates" / "Deliverable_template"
OUT = ROOT / "docs" / "sap490" / "generated"
DATE = date(2026, 7, 25)
TECH_VERSION = "0.4"
CONFIG_VERSION = "0.4"

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

EXACT_ACTIONS = [
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

TECH_TEXT = {
    "en": {
        "title": "TECHNICAL SPECIFICATION",
        "name": "IDTS CAP/Fiori Technical Baseline",
        "history": "v0.4 completes all twelve official-template tabs, removes legacy ABAP/Credit Memo examples, and traces the deployed CAP/Fiori implementation.",
        "intro": [
            "IDTS is a SAP CAP Node.js application exposed through OData V4 and consumed by SAP Fiori Elements/SAPUI5.",
            "CDS defines the domain and service contract. Node.js handlers enforce authentication, authorization, validation, transactions, audit/history, notifications, attachments and AI review boundaries.",
        ],
        "scope": [
            "In scope: AuthService, BugService, draft/active writes, eleven lifecycle actions, comments, attachments, history, notifications, monitoring and human-reviewed AI.",
            "Out of scope: ABAP/RAP implementation, SAP Transport Requests, autonomous AI decisions, final production topology and live OpenAI acceptance.",
        ],
        "assumptions": [
            "Local development uses SQLite. Shared QA uses Render and PostgreSQL. SAP HANA remains a future deployment option, not the accepted current runtime.",
            "Attachment metadata is stored in PostgreSQL and binary content in AWS S3. Email uses an outbox with Brevo/SMTP private configuration.",
            "OpenAI live remains DISABLED / NOT ACCEPTED. Mock, fallback and no-mutation tests do not prove a live provider.",
        ],
        "standards": [
            ("Naming Convention", "CAP entities/services use stable business names; JavaScript symbols use camelCase; constants use explicit codes."),
            ("Table Design", "CDS entities define UUID keys, associations/compositions, constraints and audit fields. PostgreSQL naming follows CAP deployment output."),
            ("Function Group", "N/A — classic ABAP Function Groups are not used; modules are organized under srv/bug-service, srv/auth and srv/ai."),
            ("Function Module", "N/A — classic ABAP Function Modules are not used; CAP event handlers and JavaScript helpers provide the behavior."),
            ("Code Comment", "Non-obvious entry points explain trigger, input, decision, side effect, next dependency and breakpoint in Vietnamese; mirrors remain bilingual."),
            ("Pretty Printer", "Use repository lint/format conventions; do not reformat unrelated files."),
            ("Test Program", "Focused programmatic, API, integration and browser tests are required with positive, negative, role and persistence evidence."),
            ("Custom Role", "Tester, Developer and PM are business roles resolved server-side from the authenticated IDTS user."),
            ("RAP Model for My Inbox display", "N/A — IDTS uses CAP OData read models and Fiori Elements rather than ABAP RAP My Inbox."),
            ("DB Query", "Use CAP query API and request transaction; validate before mutation and keep workflow/history/notification consistency."),
            ("Texts in Code", "UI text is human-facing and sanitized; internal SQL, stack traces, credentials and developer-only copy are forbidden."),
            ("System Program & Environment", "Configuration is profile/environment based; secrets remain private and are never stored in source or evidence."),
            ("Graphics", "Fiori/UI5 controls and official diagram assets are used; no copied mock HTML/CSS in runtime."),
            ("Catalogs", "Priority, severity, environment and classification values are active code-list records validated by CAP."),
        ],
    },
    "vi": {
        "title": "ĐẶC TẢ KỸ THUẬT",
        "name": "Đường cơ sở kỹ thuật IDTS CAP/Fiori",
        "history": "v0.4 hoàn thiện đủ mười hai tab của mẫu chính thức, loại ví dụ ABAP/Credit Memo cũ và truy vết triển khai CAP/Fiori đang chạy.",
        "intro": [
            "IDTS là ứng dụng SAP CAP Node.js, expose qua OData V4 và được SAP Fiori Elements/SAPUI5 sử dụng.",
            "CDS định nghĩa domain và service contract. Handler Node.js kiểm soát authentication, authorization, validation, transaction, audit/history, notification, attachment và ranh giới AI review.",
        ],
        "scope": [
            "Trong phạm vi: AuthService, BugService, draft/active write, mười một lifecycle action, comment, attachment, history, notification, monitoring và AI có human review.",
            "Ngoài phạm vi: triển khai ABAP/RAP, SAP Transport Request, AI tự quyết định, topology production cuối cùng và nghiệm thu OpenAI live.",
        ],
        "assumptions": [
            "Local dùng SQLite. Shared QA dùng Render và PostgreSQL. SAP HANA là hướng tương lai, không phải runtime hiện đã nghiệm thu.",
            "Metadata attachment lưu PostgreSQL, binary lưu AWS S3. Email dùng outbox với cấu hình Brevo/SMTP private.",
            "OpenAI live vẫn DISABLED / NOT ACCEPTED. Test mock, fallback và no-mutation không chứng minh provider live.",
        ],
        "standards": [
            ("Quy ước đặt tên", "Entity/service CAP dùng tên nghiệp vụ ổn định; symbol JavaScript dùng camelCase; constant dùng code rõ ràng."),
            ("Thiết kế bảng", "Entity CDS định nghĩa UUID, association/composition, constraint và audit field. PostgreSQL theo output deploy của CAP."),
            ("Function Group", "N/A — không dùng ABAP Function Group; module được tổ chức trong srv/bug-service, srv/auth và srv/ai."),
            ("Function Module", "N/A — không dùng ABAP Function Module; CAP event handler và helper JavaScript đảm nhiệm hành vi."),
            ("Comment code", "Entry point khó phải giải thích trigger, input, quyết định, side effect, dependency tiếp theo và breakpoint bằng tiếng Việt; mirror song ngữ."),
            ("Định dạng code", "Theo lint/format của repository; không reformat file không liên quan."),
            ("Chương trình test", "Bắt buộc có test programmatic/API/integration/browser với positive, negative, role và persistence evidence."),
            ("Role tùy chỉnh", "Tester, Developer và PM là business role được backend resolve từ IDTS user đã đăng nhập."),
            ("RAP My Inbox", "N/A — IDTS dùng CAP OData read model và Fiori Elements, không dùng ABAP RAP My Inbox."),
            ("DB Query", "Dùng CAP query API và request transaction; validate trước mutation, giữ nhất quán workflow/history/notification."),
            ("Text trong code", "Text UI phải dễ hiểu và sanitize; cấm lộ SQL, stack trace, credential hoặc copy nội bộ."),
            ("Môi trường", "Cấu hình theo profile/environment; secret luôn private và không nằm trong source/evidence."),
            ("Đồ họa", "Dùng Fiori/UI5 control và diagram chính thức; không copy HTML/CSS mock vào runtime."),
            ("Catalog", "Priority, severity, environment và classification là code-list active được CAP validate."),
        ],
    },
}

CONFIG_ITEMS = [
    ("Authentication", "AuthService /odata/v4/auth/; hashed AuthSessions; bearer mapping and server-side role checks", "Configured"),
    ("BugService", "BugService /odata/v4/bug/; projections, read models, drafts and bound actions", "Configured"),
    ("CAP profiles", "SQLite local; PostgreSQL shared QA; production/HANA direction remains undecided", "Configured / decision pending"),
    ("PostgreSQL", "Business metadata, history, notifications, delivery and AI audit rows", "Shared QA live"),
    ("SQLite", "Local developer database only; not shared-QA evidence", "Local only"),
    ("AWS S3", "Attachment binary storage; metadata remains in PostgreSQL", "Private binding"),
    ("Email provider", "NotificationDeliveries outbox with Brevo API/SMTP provider seam", "Private binding"),
    ("Render", "Manual deploy; service health /odata/v4/auth/$metadata; no broad seed reload", "Shared QA live"),
    ("AI", "Human-review actions plus apply/duplicate confirmation/PM metrics; OpenAI live disabled", "DISABLED / NOT ACCEPTED live"),
    ("Security", "No secret in source, Jira or evidence; safe errors and role checks", "Mandatory"),
    ("Migration", "Additive, idempotent PostgreSQL migrations with backup/readback", "Required per schema change"),
    ("Rollback", "Rollback runtime deploy independently; additive nullable columns may remain", "Documented"),
    ("Health check", "Auth metadata 200; anonymous protected OData 401; authenticated smoke 200", "Required"),
    ("Developer dataset", "14 users, including 12 Developers and 30 DeveloperResponsibilities", "Shared QA baseline"),
]


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


def metadata(ws, function_id="IDTS-TECH", function_name="IDTS CAP/Fiori"):
    for row in (2, 3, 4):
        for column in ("AS", "AT", "AU", "AV", "AW", "AX", "BB", "BC", "BD"):
            try:
                write(ws, f"{column}{row}", None)
            except ValueError:
                pass
    values = {
        "G3": function_id,
        "V3": function_name,
        "AS2": "DonHV",
        "BB2": DATE,
        "AS3": "DonHV",
        "BD3": DATE,
        "AS4": "Mentor / Supervisor",
        "BD4": "Pending",
    }
    for coordinate, value in values.items():
        try:
            write(ws, coordinate, value)
        except ValueError:
            pass


def write_lines(ws, start_row, lines, height=36, *, start_column="B", end_column="BG"):
    for row, line in enumerate(lines, start_row):
        merge_row(ws, row, start_column, end_column)
        write_wrapped(ws, f"{start_column}{row}", line)
        ws.row_dimensions[row].height = height


def technical(language):
    labels = TECH_TEXT[language]
    output = OUT / f"Technical_Specification_IDTS_SAP01_{language}_v{TECH_VERSION}.xlsx"
    shutil.copy2(TEMPLATES / "Technical_Specification.xlsx", output)
    workbook = load_workbook(output)
    remove_broken_defined_names(workbook)

    cover = workbook["Cover"]
    for coordinate, value in {
        "B8": labels["title"],
        "N11": "IDTS",
        "Z11": "Issue and Defect Tracking System in SAP",
        "N12": "IDTS-TECH",
        "N13": labels["name"],
        "N14": DATE,
        "Z14": DATE,
        "AE19": "DonHV",
        "Z19": "Pending",
        "U19": "Pending",
    }.items():
        write(cover, coordinate, value)

    history = workbook["Histories"]
    for coordinate, value in {
        "B3": 1,
        "C3": TECH_VERSION,
        "D3": labels["history"],
        "E3": "All 12 official sheets",
        "F3": DATE,
        "G3": "DonHV",
    }.items():
        write(history, coordinate, value)

    for name in (
        "Introduction",
        "Scope",
        "Assumptions",
        "Functional Requirements",
        "Technical Design",
        "Development Standards",
        "Screen Layout",
        "Screen Definition",
        "Message Definition",
    ):
        metadata(workbook[name])

    intro = workbook["Introduction"]
    clear_rows(intro, 15, 15)
    write_lines(intro, 15, labels["intro"], 44, start_column="C")

    scope = workbook["Scope"]
    clear_rows(scope, 6, 30)
    write_lines(scope, 6, labels["scope"], 44)
    scope_supplement = [
        "Runtime boundary: shared QA is a mentor/demo environment, not the final production architecture.",
        "Control boundary: UI visibility never replaces CAP authorization, validation or transaction checks.",
        "Change boundary: this specification documents the merged runtime and does not authorize a runtime or schema change.",
    ]
    if language == "vi":
        scope_supplement = [
            "Ranh giới runtime: Shared QA là môi trường mentor/demo, chưa phải kiến trúc production cuối cùng.",
            "Ranh giới kiểm soát: ẩn/hiện UI không thay thế authorization, validation hoặc transaction check của CAP.",
            "Ranh giới thay đổi: tài liệu này mô tả runtime đã merge và không tự cho phép thay đổi runtime/schema.",
        ]
    write_lines(scope, 32, scope_supplement, 40)

    assumptions = workbook["Assumptions"]
    clear_rows(assumptions, 6, 41)
    write_lines(assumptions, 6, labels["assumptions"], 44)
    assumption_supplement = [
        "Operational assumption: Render deployment is manual and must identify the exact Git commit before acceptance evidence is recorded.",
        "Persistence assumption: PostgreSQL migrations are additive/idempotent; broad seed reload is not part of shared-QA rollout.",
        "Provider assumption: S3/Brevo credentials remain private; live OpenAI is disabled and deterministic fallback evidence is labelled accurately.",
    ]
    if language == "vi":
        assumption_supplement = [
            "Giả định vận hành: Render deploy thủ công và phải xác định đúng Git commit trước khi ghi evidence nghiệm thu.",
            "Giả định persistence: migration PostgreSQL phải cộng thêm/idempotent; không chạy broad seed reload khi rollout Shared QA.",
            "Giả định provider: credential S3/Brevo luôn private; OpenAI live đang tắt và evidence fallback deterministic phải được ghi đúng.",
        ]
    write_lines(assumptions, 43, assumption_supplement, 40)

    requirements = workbook["Functional Requirements"]
    clear_rows(requirements, 5, 70)
    requirement_rows = [
        "SRS-FR-AUTH | AuthService | /odata/v4/auth/ | srv/auth-service.js | login/logout/me and hashed session validation.",
        "SRS-FR-BUG | BugService.Bugs | draft NEW/PATCH/SAVE→CREATE; active EDIT/PATCH/SAVE→UPDATE | srv/service.js and srv/bug-service/bug-write.js.",
        "SRS-FR-LIFE | Bound actions | " + ", ".join(EXACT_ACTIONS) + " | srv/service.js and srv/bug-service/actions.js.",
        "SRS-FR-COLLAB | Comments/Attachments | CAP composition and attachment provider | PostgreSQL metadata and S3 binary.",
        "SRS-FR-NOTIFY | Notifications/NotificationDeliveries | transactional writer plus asynchronous email worker.",
        "SRS-FR-AI | Human review/apply/confirm/metrics | " + ", ".join(AI_SYMBOLS) + ".",
    ]
    write_lines(requirements, 6, requirement_rows, 54, end_column="AP")

    design = workbook["Technical Design"]
    clear_rows(design, 6, 129)
    design_rows = {
        5: "Business Process",
        6: "Fiori/UI5 → OData V4 → CAP service → handler/validator → request transaction → PostgreSQL/S3/Brevo/AI provider → safe response.",
        7: "WBS & Timeline",
        8: "Runtime baseline: origin/dev 8009b2a6a72d73db28f190b3a0bcbb65b1ff4740; Render deploy dep-d9i0r537uimc73as0be0.",
        9: "Data Dictionary Objects",
        10: "Package",
        11: "N/A — CAP project modules are organized by app/, srv/ and db/ rather than an ABAP package.",
        12: "Tables",
        13: "Bugs, Users, AuthSessions, Comments, Attachments, HistoryEvents, HistoryLogs, Notifications, NotificationDeliveries, DuplicateLinks, AiSuggestions.",
        16: "Domain",
        17: "CDS types, status/action constants, roles and code lists define the bounded domain values.",
        32: "Data Element",
        33: "CDS scalar fields and associations define technical types, nullability and relationships.",
        48: "View",
        49: "BugService projections, AssignableDevelopers, DeveloperWorkloads and PM/AI operational read models.",
        50: "Table Type",
        51: "N/A — CAP CDS entities/projections replace classic ABAP table types.",
        52: "Data Definition",
        53: "db/schema.cds defines persistence; srv/service.cds defines the public OData contract.",
        57: "CDS Metadata Extension",
        58: "app/bug-management-ui/annotations/*.cds supplies Fiori UI, value help and action annotations.",
        60: "Service Definition",
        61: "AuthService (/odata/v4/auth/) and BugService (/odata/v4/bug/).",
        62: "Service Binding",
        63: "CAP Node.js OData V4 runtime binds the CDS services; no classic SAP service binding object is used.",
        64: "Annotation Model",
        65: "Fiori Elements consumes service metadata plus annotation CDS and manifest routing.",
        66: "Function Group",
        67: "N/A — JavaScript modules under srv/ replace classic ABAP Function Groups.",
        68: "Function Module",
        69: "N/A — CAP event handlers and helpers replace classic ABAP Function Modules.",
        74: "Screens",
        75: "Login, profile shell, dashboard, List Report, Object Page and SAPUI5 extension dialogs.",
        76: "Includes",
        77: "srv/service.js composes focused modules from srv/bug-service, srv/auth, srv/email and srv/ai.",
        79: "Enhancement Implementation",
        80: "SAPUI5 controller extensions and fragments are used only where Fiori Elements annotations are insufficient.",
        85: "Class",
        86: "BugService extends cds.ApplicationService; focused JavaScript modules encapsulate domain operations.",
        87: "Message Class",
        88: "N/A — CAP returns sanitized OData errors and a documented message catalog instead of an ABAP Message Class.",
        89: "Number Range Object",
        90: "N/A — Bug numbers are generated by the CAP backend; no classic SAP number-range object is used.",
        91: "Smart Forms",
        92: "N/A — IDTS uses Fiori Elements/SAPUI5 pages and does not generate SAP Smart Forms.",
        93: "Smartform Style",
        94: "N/A — no SAP Smart Form is generated, so no Smartform Style applies.",
        95: "Workflow Scenario",
        96: "CAP bound actions implement assignment and lifecycle transitions; exact action types are recorded in HistoryEvents.",
        97: "Container Element",
        98: "N/A — CAP request data, entity state and transaction context replace classic workflow container elements.",
        99: "Task",
        100: "Lifecycle actions validate role, state, assignee and reason before committing Bug, history and notification side effects.",
        101: "Provider",
        102: "Private provider seams support AWS S3, Brevo email and optional OpenAI; secrets and raw provider errors are never exposed.",
        103: "Navigation Target Object",
        104: "Fiori routes and semantic navigation open dashboard, List Report and Bug Object Page targets.",
        105: "Graphic",
        106: "Official IDTS architecture/process diagrams are generated from maintained diagram sources and inserted without changing business meaning.",
        107: "Catalogs",
        108: "Priority, severity, environment, application component, defect category and responsibility code lists are validated as active.",
        109: "Roles",
        110: "Tester, Developer and PM authorization is resolved server-side from the authenticated IDTS user and rechecked for every mutation.",
    }
    for row, value in design_rows.items():
        write(design, f"B{row}", value)
        design.row_dimensions[row].height = 38 if row % 2 == 0 or row in (11, 13, 17, 33, 49, 51, 53, 58, 61, 63, 65, 67, 69, 75, 77, 80, 86) else 24
    design._images = []
    architecture = XLImage(ROOT / "docs" / "diagrams" / "rendered" / "png" / "02-cap-fiori-architecture.png")
    architecture.width = 1050
    architecture.height = 760
    design.add_image(architecture, "AQ5")

    standards = workbook["Development Standards"]
    for heading, detail in labels["standards"]:
        target_row = None
        for row in range(5, 90):
            if str(standards[f"B{row}"].value or "").strip().lower() == heading.lower():
                target_row = row
                break
        if target_row is None:
            continue
        write(standards, f"C{target_row + 1}", detail)
        standards.row_dimensions[target_row + 1].height = 42

    layout = workbook["Screen Layout"]
    clear_rows(layout, 5, 15)
    layout_rows = [
        "login.html + LoginPage.js → AuthService.login → protected application entry",
        "ProfileMenu.js → AuthService.me/logout → signed-in identity and safe sign-out",
        "Dashboard.view.xml/controller → BugService read models → role-aware KPI and monitoring queues",
        "manifest.json + annotations → Bug List Report → filter, create and navigate",
        "annotations/actions.cds → Bug Object Page → summary, classification, assignment, lifecycle and evidence",
        "controller extensions/fragments → smart assign, comments, attachments, history and AI review dialogs",
        "Every action refreshes OData state; backend authorization/validation remains authoritative.",
    ]
    if language == "vi":
        layout_rows = [
            "login.html + LoginPage.js → AuthService.login → điểm vào ứng dụng được bảo vệ",
            "ProfileMenu.js → AuthService.me/logout → danh tính đăng nhập và đăng xuất an toàn",
            "Dashboard.view.xml/controller → BugService read model → KPI/hàng đợi monitoring theo role",
            "manifest.json + annotations → Bug List Report → lọc, tạo và điều hướng",
            "annotations/actions.cds → Bug Object Page → summary, classification, assignment, lifecycle và evidence",
            "controller extension/fragment → smart assign, comment, attachment, history và AI review dialog",
            "Mọi action refresh trạng thái OData; authorization/validation backend luôn là lớp quyết định.",
        ]
    for coordinate, value in {
        "G3": "IDTS-UI",
        "V3": "IDTS Fiori Application",
        "B5": "Route/Page/Extension map",
    }.items():
        write(layout, coordinate, value)
    for row, value in enumerate(layout_rows, 6):
        merge_row(layout, row, "B", "BG")
        write_wrapped(layout, f"B{row}", value)
        layout.row_dimensions[row].height = 34
    supplement = (
        "Supplement: custom SAPUI5 is limited to interaction-rich surfaces; standard List/Object Page behavior remains Fiori Elements."
        if language == "en"
        else "Bổ sung: custom SAPUI5 chỉ dùng cho vùng tương tác cần thiết; List/Object Page chuẩn vẫn do Fiori Elements cung cấp."
    )
    merge_row(layout, 17, "B", "BG")
    write_wrapped(layout, "B17", supplement)
    layout.row_dimensions[17].height = 40

    definition = workbook["Screen Definition"]
    clear_rows(definition, 9, 41)
    write(definition, "B2", "Screen Definition")
    write(definition, "G3", "IDTS-UI")
    write(definition, "V3", "IDTS Fiori Application")
    write(definition, "B9", "1. Fiori Elements and SAPUI5")
    write(definition, "B10", "No")
    write(definition, "R10", "Screen items / binding")
    write(definition, "AW10", "Annotation/manifest/handler and behavior")
    screen_rows = [
        ("Login", "AuthService.login", "login.html / LoginPage.js", "Safe auth entry; no raw SQL/stack trace"),
        ("Profile", "AuthService.me/logout", "ProfileMenu.js", "Role and sign-out"),
        ("Dashboard", "Bugs/DeveloperWorkloads", "Dashboard controller", "Read-only role-aware KPIs"),
        ("List Report", "BugService.Bugs", "manifest + annotations", "Filter, create and navigate"),
        ("Object Page", "BugService.Bugs", "annotations/actions.cds", "Details and authorized actions"),
        ("Smart Assign", "AssignableDevelopers", "SmartAssignDeveloper.js", "No automatic assignment"),
        ("AI reviews", "AiSuggestions/actions", "*Review.js", "Review state first; apply/confirm explicit"),
    ]
    for row, (name, binding, technical, remark) in enumerate(screen_rows, 11):
        write(definition, f"B{row}", row - 10)
        write(definition, f"C{row}", name)
        write(definition, f"R{row}", binding)
        write(definition, f"AI{row}", technical)
        write(definition, f"AW{row}", remark)
        definition.row_dimensions[row].height = 36

    messages = workbook["Message Definition"]
    clear_rows(messages, 5, 31)
    write(messages, "B5", "Message ID")
    write(messages, "H5", "Language")
    write(messages, "M5", "Sanitized message / source")
    write(messages, "AQ5", "HTTP/status and log behavior")
    message_rows = [
        ("IDTS-TECH-400", "EN/VI", "Validation target from prepareBugWrite/code-list/classification validators", "400; no mutation"),
        ("IDTS-TECH-401", "EN/VI", "Missing/expired AuthSession", "401; no token detail"),
        ("IDTS-TECH-403", "EN/VI", "Role/action permission denied", "403; safe log context"),
        ("IDTS-TECH-409", "EN/VI", "Stale/repeated transition", "409; transaction not committed"),
        ("IDTS-TECH-EMAIL", "EN/VI", "Provider error sanitized in NotificationDeliveries", "Workflow remains committed"),
        ("IDTS-TECH-AI", "EN/VI", "Provider disabled/error fallback", "No raw prompt/response; no workflow mutation"),
    ]
    for row, record in enumerate(message_rows, 6):
        for coordinate, value in zip((f"B{row}", f"H{row}", f"M{row}", f"AQ{row}"), record):
            write(messages, coordinate, value)
        messages.row_dimensions[row].height = 38

    implementation = workbook["Technical Implementation"]
    write(implementation, "B3", "Technical Implementation")
    write(implementation, "B4", "IDTS-TECH")
    write(implementation, "L4", labels["name"])
    write(implementation, "B5", "Entry trace")
    implementation_rows = [
        "UI trigger → OData V4 request → service.cds contract → service.js event registration → focused helper → request transaction → database/external side effect → safe response.",
        "Draft create: editFlow.createDocument → NEW Bugs.drafts → PATCH Bugs.drafts → SAVE → CREATE Bugs; active edit: EDIT → PATCH → UPDATE.",
        "Authorization: bearer token → AuthSessions → req.user/IDTS actor → enforceBugCreatePermission, enforceBugWritePermission or enforceActionPermission.",
        "Atomicity: Bug update, nextProcessor, HistoryEvents/HistoryLogs and Notifications use the same CAP request transaction; email worker runs after commit.",
        "Storage: PostgreSQL business metadata; AWS S3 attachment binary; NotificationDeliveries outbox; AiSuggestions review/telemetry.",
        "AI contract: " + ", ".join(AI_SYMBOLS) + ".",
        "Lifecycle contract: " + ", ".join(EXACT_ACTIONS) + ".",
        "Deployment: additive idempotent migration, manual Render deploy, health/auth/OData smoke, log scan and rollback to previous runtime deploy when required.",
    ]
    for row, text in enumerate(implementation_rows, 6):
        merge_row(implementation, row, "B", "W")
        write_wrapped(implementation, f"B{row}", text)
        implementation.row_dimensions[row].height = 56

    workbook.properties.title = f"IDTS SAP490 Technical Specification {language.upper()} v{TECH_VERSION}"
    workbook.properties.subject = "Official-template technical baseline for CAP/Fiori"
    workbook.properties.creator = "IDTS SAP01 Team"
    workbook.save(output)
    return output


def configuration(language):
    output = OUT / f"Configuration_Note_IDTS_SAP01_{language}_v{CONFIG_VERSION}.xlsx"
    shutil.copy2(TEMPLATES / "Configuration_Note.xlsx", output)
    workbook = load_workbook(output)
    remove_broken_defined_names(workbook)

    cover = workbook["Cover"]
    write(cover, "I19", "IDTS-SAP01")
    write(cover, "I20", CONFIG_VERSION)
    write(cover, "I21", DATE)

    changes = workbook["Record of change"]
    clear_rows(changes, 4, 8)
    history_rows = {
        "en": [
            (1, "2026-06-21", "0.1", "Initial configuration baseline", "Document local CAP/SQLite setup", "Mentor / Supervisor", "Pending"),
            (2, "2026-07-02", "0.2", "Shared QA configuration", "Add Render, PostgreSQL, S3 and Brevo controls", "Mentor / Supervisor", "Pending"),
            (3, "2026-07-24", "0.3", "Security and AI controls", "Clarify private configuration and disabled live OpenAI", "Mentor / Supervisor", "Pending"),
            (4, DATE, CONFIG_VERSION, "Remediate all five official sheets", "Align with deployed CAP/Fiori baseline and remove stale samples", "Mentor / Supervisor", "Pending"),
        ],
        "vi": [
            (1, "2026-06-21", "0.1", "Baseline cấu hình ban đầu", "Ghi nhận CAP/SQLite local", "Mentor / Supervisor", "Pending"),
            (2, "2026-07-02", "0.2", "Cấu hình Shared QA", "Bổ sung kiểm soát Render, PostgreSQL, S3 và Brevo", "Mentor / Supervisor", "Pending"),
            (3, "2026-07-24", "0.3", "Kiểm soát bảo mật và AI", "Làm rõ cấu hình private và OpenAI live đang tắt", "Mentor / Supervisor", "Pending"),
            (4, DATE, CONFIG_VERSION, "Hoàn thiện đủ năm sheet chính thức", "Đồng bộ baseline CAP/Fiori đã deploy và xóa mẫu cũ", "Mentor / Supervisor", "Pending"),
        ],
    }[language]
    for row, record in enumerate(history_rows, 4):
        for column, value in enumerate(record, 1):
            coordinate = changes.cell(row, column).coordinate
            write_wrapped(changes, coordinate, value, vertical="center")
        changes.row_dimensions[row].height = 44

    checklist = workbook["Checklist"]
    clear_rows(checklist, 4, 40)
    for row, (item, detail, status) in enumerate(CONFIG_ITEMS, 4):
        values = ("IDTS", row - 3, item, detail, "N/A", status, "No secrets in this workbook")
        for coordinate, value in zip(
            (f"B{row}", f"C{row}", f"D{row}", f"E{row}", f"F{row}", f"G{row}", f"H{row}"),
            values,
        ):
            write(checklist, coordinate, value)
        checklist.row_dimensions[row].height = 40

    notes = {
        "en": {
            "4": "N/A — Not applicable to SAP CAP/Fiori implementation. IDTS does not use classic SAP customizing transactions or T-codes. Equivalent runtime configuration uses CAP profiles and private environment variables.",
            "5": "N/A — This is not an SAP Transport Request. IDTS uses Git branches, reviewed pull requests, additive database migration and controlled Render deployment.",
        },
        "vi": {
            "4": "N/A — Không áp dụng cho triển khai SAP CAP/Fiori. IDTS không dùng transaction customizing hoặc T-code SAP cổ điển. Cấu hình tương đương dùng CAP profile và biến môi trường private.",
            "5": "N/A — Đây không phải SAP Transport Request. IDTS dùng Git branch, pull request được review, migration database cộng thêm và deploy Render có kiểm soát.",
        },
    }[language]
    for sheet_name in ("4", "5"):
        sheet = workbook[sheet_name]
        clear_rows(sheet, 4, 20)
        write(sheet, "A4", "IDTS CAP/Fiori configuration control")
        write(sheet, "C5", "No credentials, tokens, private endpoint or personal data are stored in this artifact.")
        write(sheet, "C6", notes[sheet_name])
        sheet.row_dimensions[6].height = 72

    workbook.properties.title = f"IDTS SAP490 Configuration Note {language.upper()} v{CONFIG_VERSION}"
    workbook.properties.subject = "Official-template secret-free CAP/Fiori configuration baseline"
    workbook.properties.creator = "IDTS SAP01 Team"
    workbook.save(output)
    return output


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for language in ("en", "vi"):
        print(technical(language).relative_to(ROOT))
        print(configuration(language).relative_to(ROOT))


if __name__ == "__main__":
    main()
