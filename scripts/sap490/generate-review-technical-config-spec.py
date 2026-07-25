"""Generate Technical Specification and Configuration Note from official templates."""

from __future__ import annotations

from copy import copy
from datetime import date
from pathlib import Path
import shutil

from openpyxl import load_workbook
from openpyxl.cell.cell import MergedCell
from openpyxl.drawing.image import Image as XLImage
from openpyxl.styles import Alignment, Font


ROOT = Path(__file__).resolve().parents[2]
TEMPLATES = ROOT / "docs" / "sap490" / "templates" / "Deliverable_template"
OUT = ROOT / "docs" / "sap490" / "generated"
DATE = date(2026, 7, 25)
TECH_VERSION = "0.5"
CONFIG_VERSION = "0.5"

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
        "history": "v0.5 corrects exact files/symbols, completes assignment/monitoring trace, and formalizes transaction, provider, migration, and failure paths.",
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
        "history": "v0.5 sửa đúng file/symbol, hoàn thiện truy vết phân công/giám sát và mô tả trang trọng transaction, provider, migration cùng failure path.",
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

CONFIG_ITEMS = {
    "en": [
        ("Authentication", "All | srv/auth.js; srv/auth/custom-auth.js; /odata/v4/auth/", "Required; session duration from private CAP config", "DonHV", "Login/me/logout + anonymous 401 + sanitized error evidence", "Revoke sessions or roll back runtime deploy"),
        ("BugService", "All | srv/service.cds; srv/service.js; /odata/v4/bug/", "Required; no private default", "DonHV", "Metadata/compile, role and lifecycle regression", "Roll back runtime deploy"),
        ("CAP profiles", "Local/QA | package.json and private environment", "SQLite local; PostgreSQL QA; HANA direction undecided", "DonHV", "Resolve profile and database binding without printing URL", "Restore prior private profile/binding"),
        ("PostgreSQL", "Shared QA | Render database binding", "Required for shared QA; no credential in workbook", "DonHV", "Persistence/readback after restart; 21 PASSED + 6 UAT PREPARED truth", "Backup/readback then restore or migrate"),
        ("SQLite", "Local | db.sqlite generated locally", "Default local-only development store", "Each developer", "cds deploy local + focused tests", "Regenerate local database from approved seed"),
        ("AWS S3", "Shared QA | private attachment binding", "Required for live attachment binary; no key stored here", "DonHV", "Upload/download/SHA-256/reload/delete evidence", "Disable binding and use approved local fallback only outside QA"),
        ("Email provider", "Shared QA | private Brevo/SMTP configuration", "Optional delivery channel; workflow remains independent", "DonHV", "NotificationDeliveries PENDING→SENT and inbox evidence", "Disable email; preserve in-app notification/outbox rows"),
        ("Render", "Shared QA | service settings/deploy control", "Manual deploy; pre-deploy remains safe; no broad seed reload", "DonHV", "Frozen commit/deploy ID, health 200, protected 401, authenticated smoke", "Roll back to prior live deploy"),
        ("AI", "All | private AI config and srv/ai provider seam", "Disabled by default; live OpenAI NOT ACCEPTED", "DonHV", "25/25 disabled-provider/fallback/no-mutation evidence", "Keep disabled; normal workflow remains available"),
        ("Security", "All | private environment and repository gates", "Mandatory; no secret/private value in source or evidence", "All members", "Secret scan, safe error and role-boundary tests", "Revoke exposed value and rotate credential"),
        ("Migration", "Shared QA | additive migration helper", "Required only for schema change; idempotent", "DonHV", "Dry-run, backup, run twice, schema/data readback", "Transaction rollback or restore backup"),
        ("Health check", "Shared QA | /odata/v4/auth/$metadata and protected OData", "Required before acceptance", "DonHV/NhanT", "Metadata 200; anonymous 401; authenticated 200; no 5xx", "Stop acceptance and roll back deploy"),
        ("Developer dataset", "Shared QA | Users and DeveloperResponsibilities", "14 users: 12 Developers; 30 responsibilities", "DonHV", "Count/readback plus smart-assignment smoke", "Restore database backup; do not broad-seed reload"),
    ],
    "vi": [
        ("Xác thực", "Mọi môi trường | srv/auth.js; srv/auth/custom-auth.js; /odata/v4/auth/", "Bắt buộc; thời hạn phiên lấy từ cấu hình CAP riêng tư", "DonHV", "Bằng chứng đăng nhập/me/đăng xuất + ẩn danh 401 + lỗi đã làm sạch", "Thu hồi phiên hoặc quay lại bản deploy trước"),
        ("BugService", "Mọi môi trường | srv/service.cds; srv/service.js; /odata/v4/bug/", "Bắt buộc; không có giá trị riêng tư mặc định", "DonHV", "Metadata/compile, quyền theo vai trò và hồi quy vòng đời", "Quay lại bản deploy trước"),
        ("CAP profile", "Local/QA | package.json và biến môi trường riêng tư", "SQLite local; PostgreSQL QA; hướng HANA chưa quyết định", "DonHV", "Xác nhận profile và liên kết database nhưng không in URL", "Khôi phục profile/liên kết riêng tư trước đó"),
        ("PostgreSQL", "Shared QA | liên kết database Render", "Bắt buộc cho Shared QA; không ghi credential trong workbook", "DonHV", "Lưu bền/readback sau restart; sự thật 21 PASSED + 6 UAT PREPARED", "Backup/readback rồi khôi phục hoặc migrate"),
        ("SQLite", "Local | db.sqlite được tạo cục bộ", "Kho dữ liệu mặc định chỉ cho phát triển local", "Mỗi developer", "cds deploy local + test tập trung", "Tạo lại database local từ seed đã duyệt"),
        ("AWS S3", "Shared QA | liên kết tệp đính kèm riêng tư", "Bắt buộc cho binary tệp live; không lưu key tại đây", "DonHV", "Bằng chứng upload/download/SHA-256/reload/delete", "Tắt liên kết và chỉ dùng fallback local được duyệt ngoài QA"),
        ("Nhà cung cấp email", "Shared QA | cấu hình Brevo/SMTP riêng tư", "Kênh giao tùy chọn; workflow độc lập", "DonHV", "NotificationDeliveries PENDING→SENT và bằng chứng inbox", "Tắt email; giữ thông báo trong ứng dụng và outbox"),
        ("Render", "Shared QA | cấu hình service/kiểm soát deploy", "Deploy thủ công; pre-deploy an toàn; không nạp lại seed rộng", "DonHV", "Commit/deploy ID cố định, health 200, route bảo vệ 401, smoke có đăng nhập", "Quay lại deploy live trước"),
        ("AI", "Mọi môi trường | cấu hình AI riêng tư và provider seam srv/ai", "Mặc định tắt; OpenAI live CHƯA NGHIỆM THU", "DonHV", "Bằng chứng 25/25 cho provider tắt/fallback/không mutation", "Giữ trạng thái tắt; workflow thường vẫn hoạt động"),
        ("Bảo mật", "Mọi môi trường | biến riêng tư và gate repository", "Bắt buộc; không để secret/giá trị riêng tư trong source/evidence", "Tất cả thành viên", "Secret scan, lỗi an toàn và test ranh giới vai trò", "Thu hồi giá trị lộ và xoay credential"),
        ("Migration", "Shared QA | helper migration cộng thêm", "Chỉ bắt buộc khi đổi schema; idempotent", "DonHV", "Dry-run, backup, chạy hai lần, readback schema/data", "Rollback transaction hoặc khôi phục backup"),
        ("Health check", "Shared QA | /odata/v4/auth/$metadata và OData được bảo vệ", "Bắt buộc trước nghiệm thu", "DonHV/NhanT", "Metadata 200; ẩn danh 401; có đăng nhập 200; không 5xx", "Dừng nghiệm thu và quay lại deploy trước"),
        ("Bộ dữ liệu developer", "Shared QA | Users và DeveloperResponsibilities", "14 user: 12 Developer; 30 responsibility", "DonHV", "Đếm/readback và smoke smart assignment", "Khôi phục backup; không nạp lại seed rộng"),
    ],
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
        "F3": function_id,
        "U3": function_name,
        "G3": None,
        "V3": None,
        "AS2": " DonHV",
        "BB2": DATE.isoformat(),
        "AS3": " DonHV",
        "BD3": DATE.isoformat(),
        "AS4": " Mentor / Supervisor",
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
        "N14": DATE.isoformat(),
        "Z14": DATE.isoformat(),
        "AE19": "DonHV",
        "Z19": "Pending",
        "U19": "Pending",
    }.items():
        write(cover, coordinate, value)

    history = workbook["Histories"]
    clear_rows(history, 3, 10)
    history_rows = {
        "en": [
            ("0.1", "Initial technical baseline", "Architecture, service and persistence scope", date(2026, 6, 21)),
            ("0.2", "Shared QA integrations", "PostgreSQL, S3, Render and email outbox", date(2026, 7, 2)),
            ("0.3", "Security and AI boundary", "Authentication, safe error and advisory AI", date(2026, 7, 24)),
            ("0.4", "Official-template remediation", "All 12 sheets and exact action inventory", date(2026, 7, 25)),
            ("0.5", labels["history"], "Trace, completeness and formal layout", DATE),
        ],
        "vi": [
            ("0.1", "Nền kỹ thuật ban đầu", "Phạm vi kiến trúc, service và persistence", date(2026, 6, 21)),
            ("0.2", "Tích hợp Shared QA", "PostgreSQL, S3, Render và email outbox", date(2026, 7, 2)),
            ("0.3", "Ranh giới bảo mật và AI", "Xác thực, lỗi an toàn và AI tư vấn", date(2026, 7, 24)),
            ("0.4", "Khắc phục theo template chính thức", "Đủ 12 sheet và danh mục action chính xác", date(2026, 7, 25)),
            ("0.5", labels["history"], "Truy vết, độ đầy đủ và bố cục trang trọng", DATE),
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
        "SRS-FR-AUTH | AuthService | /odata/v4/auth/ | srv/auth.js::login/logout/me; srv/auth/custom-auth.js resolves bearer sessions. Raw token is returned once; only AuthSessions.tokenHash is stored.",
        "SRS-FR-BUG | BugService.Bugs | draft NEW/PATCH/SAVE→CREATE; active EDIT/PATCH/SAVE→UPDATE | srv/service.js; srv/bug-service/bug-write.js; srv/bug-service/drafts.js.",
        "SRS-FR-ASG | AssignableDevelopers and assignment actions | srv/bug-service/actions.js plus permission/assignee validators | validates active DeveloperResponsibilities; no assignee produces Pending Assignment.",
        "SRS-FR-LIFE | Bound actions | " + ", ".join(EXACT_ACTIONS) + " | srv/service.js and srv/bug-service/actions.js; exact action history is persisted.",
        "SRS-FR-COLLAB | Comments/Attachments | BugCollaboration.js holds pendingCreateAttachmentsByBugId before activation; srv/bug-service/content.js validates writes; PostgreSQL metadata and S3 binary.",
        "SRS-FR-MON | DeveloperWorkloads and PM queues | srv/bug-service/monitoring.js::readDeveloperWorkloads and related read-model enrichment | read-only role-aware monitoring.",
        "SRS-FR-NOTIFY | Notifications/NotificationDeliveries | transaction writer in history flow plus asynchronous srv/email/worker.js; provider failure does not roll back Bug workflow.",
        "SRS-FR-AI | Human review/apply/confirm/metrics | " + ", ".join(AI_SYMBOLS) + " | stale/already-reviewed conflicts return 409 only in AI review/apply paths.",
    ]
    write_lines(requirements, 6, requirement_rows, 54, end_column="AP")

    design = workbook["Technical Design"]
    clear_rows(design, 6, 129)
    design_rows = {
        5: "Business Process",
        6: "Fiori/UI5 → OData V4 → CAP service → handler/validator → request transaction → PostgreSQL/S3/Brevo/AI provider → safe response.",
        7: "WBS & Timeline",
        8: "Runtime baseline: 8009b2a6a72d73db28f190b3a0bcbb65b1ff4740; documentation baseline origin/dev 9eee79cbb741962403b2d35ee33efc2eb3d18c46; Render deploy dep-d9i0r537uimc73as0be0.",
        9: "Data Dictionary Objects",
        10: "Package",
        11: "N/A — CAP project modules are organized by app/, srv/ and db/ rather than an ABAP package.",
        12: "Tables",
        13: "Bugs owns classifications, assignee and nextProcessor. Compositions link Comments, Attachments, HistoryEvents/HistoryLogs and Notifications. Users/AuthSessions provide identity; NotificationDeliveries is the email outbox; DuplicateLinks/AiSuggestions hold reviewed AI outcomes.",
        16: "Domain",
        17: "CDS types, status/action constants, roles and code lists define the bounded domain values.",
        32: "Data Element",
        33: "CDS scalar fields and associations define technical types, nullability and relationships.",
        48: "View",
        49: "BugService projections, AssignableDevelopers, DeveloperWorkloads from srv/bug-service/monitoring.js, and PM/AI operational read models.",
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
        77: "srv/service.js registers handlers from srv/bug-service; AuthService is implemented in srv/auth.js; custom bearer middleware is in srv/auth/custom-auth.js; provider modules live under srv/email and srv/ai.",
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
        102: "Private provider seams support AWS S3, Brevo email and optional OpenAI. Attachment metadata is transactional in PostgreSQL while binary content is external; email uses bounded retry/locking; secrets and raw provider errors are never exposed.",
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
        "login.html + login-page.js + ext/login/LoginController.js → AuthService.login in srv/auth.js → protected application entry",
        "ext/login/ProfileShell.js → AuthService.me/logout → signed-in identity and safe sign-out",
        "dashboard.html + dashboard-page.js → BugService read models in srv/bug-service/monitoring.js → role-aware KPI and monitoring queues",
        "manifest.json + annotations → Bug List Report → filter, create and navigate",
        "annotations/actions.cds → Bug Object Page → summary, classification, assignment, lifecycle and evidence",
        "BugCollaboration.js and focused fragments/controllers → smart assign, comments, attachments, history, ClassificationReview.js, DuplicateReview.js, HandoffSummaryReview.js and SmartAssignDeveloper.js",
        "Every action refreshes OData state; backend authorization/validation remains authoritative.",
    ]
    if language == "vi":
        layout_rows = [
            "login.html + login-page.js + ext/login/LoginController.js → AuthService.login trong srv/auth.js → điểm vào ứng dụng được bảo vệ",
            "ext/login/ProfileShell.js → AuthService.me/logout → danh tính đăng nhập và đăng xuất an toàn",
            "dashboard.html + dashboard-page.js → BugService read model trong srv/bug-service/monitoring.js → KPI/hàng đợi giám sát theo vai trò",
            "manifest.json + annotations → Bug List Report → lọc, tạo và điều hướng",
            "annotations/actions.cds → Bug Object Page → summary, classification, assignment, lifecycle và evidence",
            "BugCollaboration.js và fragment/controller chuyên trách → smart assign, bình luận, tệp đính kèm, lịch sử, ClassificationReview.js, DuplicateReview.js, HandoffSummaryReview.js và SmartAssignDeveloper.js",
            "Mọi action refresh trạng thái OData; authorization/validation backend luôn là lớp quyết định.",
        ]
    for coordinate, value in {
        "F3": "IDTS-UI",
        "U3": "IDTS Fiori Application",
        "G3": None,
        "V3": None,
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
    write(definition, "F3", "IDTS-UI")
    write(definition, "U3", "IDTS Fiori Application")
    write(definition, "G3", None)
    write(definition, "V3", None)
    write(definition, "B9", "1. Fiori Elements and SAPUI5")
    write(definition, "B10", "No")
    write(definition, "R10", "Screen items / binding")
    write(definition, "AW10", "Annotation/manifest/handler and behavior")
    screen_rows = [
        ("Login", "AuthService.login", "login.html / login-page.js / LoginController.js", "Safe auth entry; no raw SQL/stack trace"),
        ("Profile", "AuthService.me/logout", "ProfileShell.js", "Identity, role and sign-out"),
        ("Dashboard", "Bugs/DeveloperWorkloads", "dashboard.html / dashboard-page.js", "Read-only role-aware KPIs"),
        ("List Report", "BugService.Bugs", "manifest.json + annotations", "Filter, create and navigate"),
        ("Object Page Summary", "BugService.Bugs", "annotations/actions.cds", "Business summary and validation state"),
        ("Classification", "ApplicationComponents/DefectCategories", "annotations value helps", "Active compatible values"),
        ("Assignment", "AssignableDevelopers", "SmartAssignDeveloper.js", "No automatic assignment; backend revalidates"),
        ("Lifecycle Actions", "BugService.<bound action>", "annotations/actions.cds + service.js", "Role/state/reason checked"),
        ("Comments", "Bugs.comments", "BugCollaboration.js / CommentsSection.fragment.xml", "Hidden in create; available after save"),
        ("Attachments", "Bugs.attachments", "BugCollaboration.js / AttachmentsSection.fragment.xml", "Client pending memory then attachment API"),
        ("History", "HistoryEvents/HistoryLogs", "History section control/fragment", "Exact action and changed fields; bounded loading"),
        ("Notifications", "Notifications/NotificationDeliveries", "notification section/profile shell", "In-app/read state and delivery status"),
        ("Classification AI", "AiSuggestions/actions", "ClassificationReview.js", "Review first; apply explicit"),
        ("Duplicate AI", "AiSuggestions/DuplicateLinks", "DuplicateReview.js", "Review then explicit confirmation"),
        ("Handoff AI", "AiSuggestions", "HandoffSummaryReview.js", "Review-only summary"),
        ("Smart Assign AI", "AiSuggestions/AssignableDevelopers", "SmartAssignDeveloper.js", "Explanation only; no auto assignment"),
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
        ("IDTS-TECH-400", "EN/VI", "prepareBugWrite/code-list/classification/attachment validators; field or action target", "400; request transaction rolls back; no mutation"),
        ("IDTS-TECH-401", "EN/VI", "srv/auth/custom-auth.js: missing, expired or revoked AuthSession", "401; no raw token/session detail"),
        ("IDTS-TECH-403", "EN/VI", "enforceBugCreatePermission/enforceBugWritePermission/enforceActionPermission", "403; safe actor/action log; no mutation"),
        ("IDTS-TECH-409-AI", "EN/VI", "srv/ai/review.js or srv/ai/classification-apply.js: stale/already-reviewed suggestion", "409 only for AI conflict; transaction not committed"),
        ("IDTS-TECH-ATTACH", "EN/VI", "BugCollaboration.js/content.js/provider seam", "400/502 sanitized; attachment write rolls back"),
        ("IDTS-TECH-EMAIL", "EN/VI", "Provider error sanitized in NotificationDeliveries", "Bug workflow remains committed; delivery retry/FAILED tracked"),
        ("IDTS-TECH-AI", "EN/VI", "Provider disabled/error/no-result fallback", "No raw prompt/response; no autonomous workflow mutation"),
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
        "Authentication flow: login-page.js/LoginController.js → POST /odata/v4/auth/login → srv/auth.js::login → Users/password verification → AuthSessions.tokenHash insert → raw token returned once. ProfileShell.js calls me/logout; custom-auth.js resolves bearer sessions.",
        "Draft create flow: editFlow.createDocument → POST Bugs (draft NEW) → repeated PATCH Bugs.drafts → SAVE/activation → CREATE active Bugs. srv/service.js registers prepareDraftNew/prepareDraftPatch/handleDraftSave and prepareBugWrite validates before commit.",
        "Active edit flow: Fiori EDIT creates a draft copy → PATCH Bugs.drafts → SAVE → UPDATE active Bugs. Request transaction keeps Bug, nextProcessor, HistoryEvents/HistoryLogs and Notifications consistent.",
        "Assignment flow: UI value help reads AssignableDevelopers → explicit user selection → assignToDeveloper or create/update write → permission and DeveloperResponsibilities validation → Assigned or Pending Assignment → exact history/notification.",
        "Lifecycle flow: bound action HTTP request → srv/service.js registration → srv/bug-service/actions.js transition helper → permission/status/reason/assignee checks → transaction update → determineNextProcessor → history and notification side effects.",
        "Collaboration flow: comments become available after save. BugCollaboration.js holds pendingCreateAttachmentsByBugId in client memory before create SAVE; after activation it calls the attachment API. PostgreSQL stores metadata; S3 stores binary; authorized delete removes both references.",
        "Monitoring flow: dashboard-page.js → OData reads → srv/bug-service/monitoring.js::readDeveloperWorkloads and related enrichment → role-aware read-only KPIs/queues; monitoring alone never mutates a Bug.",
        "Email flow: committed business event creates Notifications/NotificationDeliveries → worker claims eligible rows with lock/retry fields → Brevo/SMTP provider → SENT/FAILED/SKIPPED. Provider failure never rolls back the Bug transaction.",
        "AI flow: focused review controllers call suggestion/review actions → srv/ai handlers validate reviewer and current suggestion → review status persists. applyClassificationSuggestion and confirmDuplicateSuggestion are separate authorized mutations; HTTP 409 is limited to stale/already-reviewed AI state.",
        "Migration/deployment: schema changes use additive idempotent migration and database backup/readback; Render deploy is manual against a frozen commit; verify health/auth/OData/logs and rollback runtime independently when needed.",
        "Evidence baseline: 21 PASSED + 6 UAT PREPARED; Shared QA lifecycle 40/40 PASS; AI 25/25 PASS in disabled-provider/fallback mode; S3 and Brevo live integration evidence PASS; OpenAI live DISABLED / NOT ACCEPTED.",
    ]
    for row, text in enumerate(implementation_rows, 6):
        merge_row(implementation, row, "B", "W")
        write_wrapped(implementation, f"B{row}", text)
        writable(implementation, f"B{row}").font = Font(name="Times New Roman", size=12)
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
    write(cover, "I21", DATE.isoformat())

    changes = workbook["Record of change"]
    clear_rows(changes, 4, 8)
    history_rows = {
        "en": [
            (1, "2026-06-21", "0.1", "Initial configuration baseline", "Document local CAP/SQLite setup", "Mentor / Supervisor", "Pending"),
            (2, "2026-07-02", "0.2", "Shared QA configuration", "Add Render, PostgreSQL, S3 and Brevo controls", "Mentor / Supervisor", "Pending"),
            (3, "2026-07-24", "0.3", "Security and AI controls", "Clarify private configuration and disabled live OpenAI", "Mentor / Supervisor", "Pending"),
            (4, "2026-07-25", "0.4", "Official-template remediation", "Align five official sheets with deployed CAP/Fiori baseline", "Mentor / Supervisor", "Pending"),
            (5, DATE.isoformat(), CONFIG_VERSION, "Runtime trace and formal-layout correction", "Add exact location, verification, rollback and evidence controls", "Mentor / Supervisor", "Pending"),
        ],
        "vi": [
            (1, "2026-06-21", "0.1", "Nền cấu hình ban đầu", "Ghi nhận CAP/SQLite local", "Người hướng dẫn", "Chờ đánh giá"),
            (2, "2026-07-02", "0.2", "Cấu hình Shared QA", "Bổ sung kiểm soát Render, PostgreSQL, S3 và Brevo", "Người hướng dẫn", "Chờ đánh giá"),
            (3, "2026-07-24", "0.3", "Kiểm soát bảo mật và AI", "Làm rõ cấu hình riêng tư và OpenAI live đang tắt", "Người hướng dẫn", "Chờ đánh giá"),
            (4, "2026-07-25", "0.4", "Khắc phục theo template chính thức", "Đồng bộ đủ năm sheet với nền CAP/Fiori đã triển khai", "Người hướng dẫn", "Chờ đánh giá"),
            (5, DATE.isoformat(), CONFIG_VERSION, "Sửa truy vết runtime và bố cục trang trọng", "Bổ sung vị trí, cách kiểm tra, rollback và bằng chứng chính xác", "Người hướng dẫn", "Chờ đánh giá"),
        ],
    }[language]
    for row, record in enumerate(history_rows, 4):
        for column, value in enumerate(record, 1):
            coordinate = changes.cell(row, column).coordinate
            write_wrapped(changes, coordinate, value, vertical="center")
        changes.row_dimensions[row].height = 44

    checklist = workbook["Checklist"]
    clear_rows(checklist, 4, 40)
    for row, (item, location, required_default, owner, verify, rollback) in enumerate(CONFIG_ITEMS[language], 4):
        values = ("IDTS", row - 3, item, location, required_default, f"{owner} | Verify: {verify}", f"Rollback/evidence: {rollback}")
        for coordinate, value in zip(
            (f"B{row}", f"C{row}", f"D{row}", f"E{row}", f"F{row}", f"G{row}", f"H{row}"),
            values,
        ):
            write_wrapped(checklist, coordinate, value, vertical="top")
        checklist.row_dimensions[row].height = 64
    common_note = (
        "Security note: this workbook documents keys and locations only. It never stores credentials, tokens, private endpoints, database URLs or personal data."
        if language == "en"
        else "Lưu ý bảo mật: workbook này chỉ mô tả tên cấu hình và vị trí. Không lưu credential, token, endpoint riêng tư, URL database hoặc dữ liệu cá nhân."
    )
    write_wrapped(checklist, "D20", common_note, vertical="top")
    checklist.row_dimensions[20].height = 44

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
        write(sheet, "A4", "IDTS CAP/Fiori configuration control" if language == "en" else "Kiểm soát cấu hình IDTS CAP/Fiori")
        write(
            sheet,
            "C5",
            "No credentials, tokens, private endpoint or personal data are stored in this artifact."
            if language == "en"
            else "Tài liệu này không lưu credential, token, endpoint riêng tư hoặc dữ liệu cá nhân.",
        )
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
