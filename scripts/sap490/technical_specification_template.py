"""Generate the mentor-facing Technical Specification from the official template.

This module deliberately fills the template's existing sections instead of
replacing them with a new workbook design.  Technical detail that does not fit
an existing screen/message block is placed in Technical Implementation.
"""

from __future__ import annotations

from copy import copy
from datetime import date
from pathlib import Path
import shutil

from openpyxl import load_workbook
from openpyxl.cell.cell import MergedCell
from openpyxl.drawing.image import Image as XLImage
from openpyxl.styles import Alignment

from specification_catalog import AI_FUNCTIONS, LIFECYCLE_ACTIONS, MESSAGES


ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / "docs" / "sap490" / "templates" / "Deliverable_template" / "Technical_Specification.xlsx"
OUTPUT_DIR = ROOT / "docs" / "sap490" / "generated"
VERSION = "0.7"
DOCUMENT_DATE = date(2026, 7, 26)


def _anchor(sheet, coordinate):
    cell = sheet[coordinate]
    if not isinstance(cell, MergedCell):
        return cell
    for merged in sheet.merged_cells.ranges:
        if coordinate in merged:
            return sheet.cell(merged.min_row, merged.min_col)
    raise ValueError(f"No merge anchor for {sheet.title}!{coordinate}")


def _write(sheet, coordinate, value, *, wrap=True, vertical="top"):
    cell = _anchor(sheet, coordinate)
    cell.value = value
    if wrap:
        old = cell.alignment
        cell.alignment = Alignment(
            horizontal=old.horizontal,
            vertical=vertical,
            text_rotation=old.text_rotation,
            wrap_text=True,
            shrink_to_fit=False,
            indent=old.indent,
        )


def _clear_values(sheet, start_row, end_row, start_col=2, end_col=59):
    for row in sheet.iter_rows(
        min_row=start_row, max_row=end_row, min_col=start_col, max_col=end_col
    ):
        for cell in row:
            if not isinstance(cell, MergedCell):
                cell.value = None


def _copy_style(source, target):
    target._style = copy(source._style)
    target.number_format = source.number_format
    target.protection = copy(source.protection)


def _merge_once(sheet, cell_range):
    if cell_range not in {str(item) for item in sheet.merged_cells.ranges}:
        sheet.merge_cells(cell_range)


def _set_metadata(sheet, title, language):
    labels = {
        "en": ("Created by:", "Created date:", "Modified by:", "Modified date:", "Reviewed by:", "Reviewed date:", "Pending"),
        "vi": ("Người tạo:", "Ngày tạo:", "Người cập nhật:", "Ngày cập nhật:", "Người review:", "Ngày review:", "Chờ duyệt"),
    }[language]
    def replace_template_value(row, start_col, end_col, value, fallback_col):
        candidates = []
        for column in range(start_col, end_col + 1):
            cell = sheet.cell(row, column)
            if isinstance(cell, MergedCell):
                continue
            if cell.value not in (None, ""):
                candidates.append(cell)
        target = candidates[0] if candidates else sheet.cell(row, fallback_col)
        for cell in candidates:
            cell.value = None
        _write(sheet, target.coordinate, value, wrap=False)

    _write(sheet, "B2", title, wrap=False)
    # Template tabs do not use one fixed coordinate for these values. Locate
    # the populated sample/formula cell in each official metadata block and
    # replace it in place so no WS/Credit-Memo sample survives.
    replace_template_value(3, 3, 15, "IDTS-TECH", 6)
    replace_template_value(3, 17, 42, "IDTS CAP/Fiori Technical Baseline" if language == "en" else "Nền tảng kỹ thuật IDTS CAP/Fiori", 21)
    _write(sheet, "AQ2", labels[0], wrap=False)
    replace_template_value(2, 44, 50, "DonHV", 46)
    _write(sheet, "AY2", labels[1], wrap=False)
    replace_template_value(2, 52, 59, DOCUMENT_DATE.isoformat(), 55)
    _write(sheet, "AQ3", labels[2], wrap=False)
    replace_template_value(3, 44, 50, "DonHV", 46)
    _write(sheet, "AY3", labels[3], wrap=False)
    replace_template_value(3, 52, 59, DOCUMENT_DATE.isoformat(), 55)
    _write(sheet, "AQ4", labels[4], wrap=False)
    replace_template_value(4, 44, 50, "Mentor / Supervisor" if language == "en" else "Mentor / người hướng dẫn", 46)
    _write(sheet, "AY4", labels[5], wrap=False)
    replace_template_value(4, 52, 59, labels[6], 55)


def _set_print(sheet, area, title_rows=None, *, fit_height=0):
    sheet.print_area = area
    sheet.sheet_properties.pageSetUpPr.fitToPage = True
    sheet.page_setup.fitToWidth = 1
    sheet.page_setup.fitToHeight = fit_height
    if title_rows:
        sheet.print_title_rows = title_rows


def _write_template_table(sheet, start_row, groups, headers, rows, style_sheet):
    """Create a record table only in template tabs that provide no record grid."""
    header_style = style_sheet["B5"]
    data_style = style_sheet["B6"]
    for offset, values in enumerate([headers, *rows]):
        row = start_row + offset
        is_header = offset == 0
        for (start, end), value in zip(groups, values):
            start_col = sheet[f"{start}1"].column
            end_col = sheet[f"{end}1"].column
            for col in range(start_col, end_col + 1):
                target = sheet.cell(row, col)
                _copy_style(header_style if is_header else data_style, target)
                target.alignment = Alignment(
                    horizontal="center" if is_header else "left",
                    vertical="center" if is_header else "top",
                    wrap_text=True,
                    shrink_to_fit=False,
                )
            _merge_once(sheet, f"{start}{row}:{end}{row}")
            sheet[f"{start}{row}"] = value
        sheet.row_dimensions[row].height = 32 if is_header else 60
    return start_row + len(rows)


def _fill_cover_and_history(workbook, language):
    cover = workbook["Cover"]
    title = "TECHNICAL SPECIFICATION" if language == "en" else "ĐẶC TẢ KỸ THUẬT"
    name = "IDTS CAP/Fiori Technical Baseline" if language == "en" else "Nền tảng kỹ thuật IDTS CAP/Fiori"
    for coordinate, value in {
        "B8": title, "N11": "IDTS", "Z11": "Issue and Defect Tracking System in SAP",
        "N12": "IDTS-TECH", "N13": name, "N14": DOCUMENT_DATE.isoformat(),
        "Z14": DOCUMENT_DATE.isoformat(), "AE19": "DonHV", "Z19": "Pending" if language == "en" else "Chờ duyệt",
        "U19": "Pending" if language == "en" else "Chờ duyệt",
    }.items():
        _write(cover, coordinate, value, wrap=False)
    _set_print(cover, "B1:BG24")

    history = workbook["Histories"]
    _clear_values(history, 3, 10, 2, 7)
    rows = {
        "en": [
            ("0.1", "Initial technical baseline", "Architecture, service and persistence scope", "2026-06-21"),
            ("0.2", "Shared QA integrations", "PostgreSQL, S3, Render and email outbox", "2026-07-02"),
            ("0.3", "Security and AI boundary", "Authentication, safe error and advisory AI", "2026-07-24"),
            ("0.4", "Official-template remediation", "All 12 sheets and exact action inventory", "2026-07-25"),
            ("0.5", "Runtime trace correction", "Exact source symbols, test truth and failure paths", "2026-07-25"),
            ("0.6", "Formal table remediation", "Structured catalogs and bilingual parity", "2026-07-25"),
            ("0.7", "Template-fidelity remediation", "Restore official inner layouts and exact per-action trace", DOCUMENT_DATE.isoformat()),
        ],
        "vi": [
            ("0.1", "Nền kỹ thuật ban đầu", "Kiến trúc, service và phạm vi lưu trữ", "2026-06-21"),
            ("0.2", "Tích hợp Shared QA", "PostgreSQL, S3, Render và email outbox", "2026-07-02"),
            ("0.3", "Ranh giới bảo mật và AI", "Xác thực, lỗi an toàn và AI tư vấn", "2026-07-24"),
            ("0.4", "Khắc phục theo template chính thức", "Đủ 12 sheet và danh mục action chính xác", "2026-07-25"),
            ("0.5", "Sửa truy vết runtime", "Source symbol, sự thật kiểm thử và failure path chính xác", "2026-07-25"),
            ("0.6", "Chuẩn hóa bảng formal", "Catalog có cấu trúc và parity song ngữ", "2026-07-25"),
            ("0.7", "Khôi phục độ trung thành với template", "Dùng đúng layout bên trong và truy vết riêng từng action", DOCUMENT_DATE.isoformat()),
        ],
    }[language]
    for row_number, (version, summary, affected, changed) in enumerate(rows, 3):
        for coordinate, value in {
            f"B{row_number}": row_number - 2, f"C{row_number}": version,
            f"D{row_number}": summary, f"E{row_number}": affected,
            f"F{row_number}": changed, f"G{row_number}": "DonHV",
        }.items():
            _write(history, coordinate, value, wrap=False)
        history.row_dimensions[row_number].height = 36
    _set_print(history, "B1:G10", "1:2")


def _fill_intro_scope_assumptions(workbook, language):
    titles = {
        "en": ("Introduction", "Scope", "Assumptions"),
        "vi": ("Giới thiệu", "Phạm vi", "Giả định"),
    }[language]
    intro = workbook["Introduction"]
    _set_metadata(intro, titles[0], language)
    processing = {
        "H6": "Online", "P6": "Dialog / OData service", "V6": "IDTS SRS and approved Jira baseline",
        "H10": "Yes — English and Vietnamese specifications",
    }
    if language == "vi":
        processing.update({"H6": "Trực tuyến", "P6": "Dialog / OData service", "V6": "IDTS SRS và Jira baseline đã duyệt", "H10": "Có — đặc tả tiếng Anh và tiếng Việt"})
    for coordinate, value in processing.items():
        _write(intro, coordinate, value, wrap=False)
    intro_text = {
        "en": "IDTS is implemented with SAP CAP Node.js and OData V4, consumed by SAP Fiori Elements/SAPUI5. CDS defines the service contract; Node.js handlers enforce authentication, authorization, validation, transactions, history, notifications, attachments and human-reviewed AI boundaries.",
        "vi": "IDTS được triển khai bằng SAP CAP Node.js và OData V4, được SAP Fiori Elements/SAPUI5 sử dụng. CDS định nghĩa service contract; handler Node.js kiểm soát xác thực, phân quyền, validation, transaction, lịch sử, thông báo, tệp đính kèm và ranh giới AI có con người review.",
    }[language]
    _write(intro, "C15", intro_text)
    intro.row_dimensions[15].height = 88
    _write(intro, "B16", "No additional supplement." if language == "en" else "Không có phụ lục bổ sung.")
    _set_print(intro, "B1:BG16", "1:4")

    scope = workbook["Scope"]
    _set_metadata(scope, titles[1], language)
    _clear_values(scope, 6, 30)
    scope_rows = {
        "en": [
            "SCP-01 — IN SCOPE — AuthService, BugService, draft/active writes and eleven exact lifecycle actions.",
            "SCP-02 — IN SCOPE — Comments, attachments, history, notifications, monitoring and role authorization.",
            "SCP-03 — IN SCOPE — Human-reviewed AI suggestions, decisions, explicit apply/confirm and sanitized metrics.",
            "SCP-04 — OUT OF SCOPE — ABAP/RAP, SAP Transport Requests and autonomous AI workflow decisions.",
            "SCP-05 — LIMITATION — Shared QA is mentor/demo scope; live OpenAI remains DISABLED / NOT ACCEPTED.",
        ],
        "vi": [
            "SCP-01 — TRONG PHẠM VI — AuthService, BugService, ghi draft/active và mười một action vòng đời chính xác.",
            "SCP-02 — TRONG PHẠM VI — Bình luận, tệp đính kèm, lịch sử, thông báo, giám sát và phân quyền.",
            "SCP-03 — TRONG PHẠM VI — Suggestion AI có review, quyết định, apply/confirm rõ ràng và metrics đã làm sạch.",
            "SCP-04 — NGOÀI PHẠM VI — ABAP/RAP, SAP Transport Request và AI tự động quyết định workflow.",
            "SCP-05 — GIỚI HẠN — Shared QA phục vụ mentor/demo; OpenAI live vẫn TẮT / CHƯA NGHIỆM THU.",
        ],
    }[language]
    for row, value in enumerate(scope_rows, 6):
        _merge_once(scope, f"B{row}:BG{row}")
        _write(scope, f"B{row}", value)
        scope.row_dimensions[row].height = 34
    _write(scope, "B31", "No additional supplement." if language == "en" else "Không có phụ lục bổ sung.")
    _set_print(scope, "B1:BG31", "1:5")

    assumptions = workbook["Assumptions"]
    _set_metadata(assumptions, titles[2], language)
    _clear_values(assumptions, 6, 41)
    assumption_rows = {
        "en": [
            "ASM-01 — Local development uses SQLite; local records are not Shared QA evidence.",
            "ASM-02 — Shared QA uses Render PostgreSQL and must retain data after restart/redeploy.",
            "ASM-03 — Schema migrations are additive and idempotent; broad seed reload is forbidden.",
            "ASM-04 — S3, Brevo and database credentials remain private and never appear in evidence.",
            "ASM-05 — Live OpenAI is disabled; mock/fallback PASS is not provider-live acceptance.",
            "ASM-06 — Shared QA evidence is valid only for the frozen Git and Render deploy SHA.",
        ],
        "vi": [
            "ASM-01 — Phát triển local dùng SQLite; dữ liệu local không phải evidence Shared QA.",
            "ASM-02 — Shared QA dùng PostgreSQL trên Render và phải giữ dữ liệu sau restart/redeploy.",
            "ASM-03 — Migration schema phải cộng thêm và idempotent; cấm nạp lại seed diện rộng.",
            "ASM-04 — Credential S3, Brevo và database luôn riêng tư, không xuất hiện trong evidence.",
            "ASM-05 — OpenAI live đang tắt; PASS mock/fallback không phải nghiệm thu provider live.",
            "ASM-06 — Evidence Shared QA chỉ hợp lệ với Git SHA và Render deploy SHA đã cố định.",
        ],
    }[language]
    for row, value in enumerate(assumption_rows, 6):
        _merge_once(assumptions, f"B{row}:BG{row}")
        _write(assumptions, f"B{row}", value)
        assumptions.row_dimensions[row].height = 34
    _write(assumptions, "B42", "No additional supplement." if language == "en" else "Không có phụ lục bổ sung.")
    _set_print(assumptions, "B1:BG42", "1:5")


def _requirement_rows(language):
    rows = [
        ("SRS-FR-AUTH", "Authenticate users and protect bearer sessions", "Tester / Developer / PM", "AuthService /odata/v4/auth/", "srv/auth.js; srv/auth/custom-auth.js", "Users; AuthSessions; EVID-AUTH"),
        ("SRS-FR-BUG", "Create and update valid Bugs through draft/active writes", "Tester / PM", "BugService /odata/v4/bug/", "srv/service.js; srv/bug-service/bug-write.js", "Bugs; code lists; EVID-BUG-WRITE"),
        ("SRS-FR-ASG", "Assign an eligible Developer", "Tester / PM", "assignToDeveloper", "srv/bug-service/actions.js; permissions.js", "Bugs; DeveloperResponsibilities; EVID-ASSIGN"),
        ("SRS-FR-LIFE", "Enforce eleven exact lifecycle actions", "Action-specific", "BugService bound actions", "srv/service.js; srv/bug-service/actions.js", "Bugs; HistoryEvents; Notifications; EVID-IDTS-89"),
        ("SRS-FR-COLLAB", "Persist comments and attachment evidence", "Bug participants", "Comments / Attachments", "BugCollaboration.js; srv/bug-service/content.js", "Comments; PostgreSQL metadata; S3 binary; EVID-ATTACH"),
        ("SRS-FR-MON", "Return role-aware workload and queues", "Tester / Developer / PM", "DeveloperWorkloads", "srv/bug-service/monitoring.js", "Read-only KPI rows; EVID-MONITOR"),
        ("SRS-FR-NOTIFY", "Persist in-app notification and outbox delivery state", "System", "Notifications / NotificationDeliveries", "srv/email/outbox.js; srv/email/worker.js", "Notification and delivery state; EVID-EMAIL"),
        ("SRS-FR-AI", "Provide human-reviewed AI assistance", "Action-specific", "BugService AI actions", "srv/ai/", "AiSuggestions; DuplicateLinks; EVID-AI-FALLBACK"),
    ]
    if language == "vi":
        translations = [
            "Xác thực người dùng và bảo vệ phiên bearer", "Tạo và cập nhật Bug hợp lệ qua ghi draft/active",
            "Phân công Developer đủ điều kiện", "Kiểm soát mười một action vòng đời chính xác",
            "Lưu bình luận và evidence tệp đính kèm", "Trả về workload và hàng đợi theo vai trò",
            "Lưu thông báo trong ứng dụng và trạng thái delivery outbox", "Cung cấp hỗ trợ AI có con người review",
        ]
        role_translations = {
            "Tester / Developer / PM": "Tester / Developer / PM",
            "Tester / PM": "Tester / PM",
            "Action-specific": "Tùy theo action",
            "Bug participants": "Người tham gia xử lý Bug",
            "System": "Hệ thống",
        }
        rows = [(r[0], translations[i], role_translations.get(r[2], r[2]), r[3], r[4], r[5]) for i, r in enumerate(rows)]
    return rows


def _fill_requirements(workbook, language):
    sheet = workbook["Functional Requirements"]
    _set_metadata(sheet, "Functional Requirements" if language == "en" else "Yêu cầu chức năng", language)
    _clear_values(sheet, 5, 70)
    headers = ["Requirement ID", "Technical objective", "Role", "Service / operation", "Source", "Data / evidence"]
    if language == "vi":
        headers = ["Mã yêu cầu", "Mục tiêu kỹ thuật", "Vai trò", "Service / thao tác", "Source", "Dữ liệu / evidence"]
    end = _write_template_table(
        sheet, 5,
        [("B", "F"), ("G", "Q"), ("R", "V"), ("W", "AB"), ("AC", "AP"), ("AQ", "BG")],
        headers, _requirement_rows(language), workbook["Message Definition"],
    )
    _set_print(sheet, f"B1:BG{end}", "1:5")


def _fill_design(workbook, language):
    sheet = workbook["Technical Design"]
    _set_metadata(sheet, "Technical Design" if language == "en" else "Thiết kế kỹ thuật", language)
    descriptions = {
        "en": {
            5: "End-to-end CAP/Fiori workflow; architecture diagram is shown in the official graphic area. AuthSessions stores only the SHA-256 tokenHash; the raw bearer token is returned once.",
            7: "N/A — project planning is controlled in Jira; this specification documents the implemented technical baseline.",
            10: "Node.js package: idts-sap01; CAP modules are organized under app/, srv/ and db/.",
            12: "CDS entities: Users, Bugs, Comments, Attachments, HistoryEvents, HistoryLogs, Notifications, NotificationDeliveries, AiSuggestions, DuplicateLinks and code lists.",
            16: "CDS types and code-list values define stable business codes; classic ABAP domains are not used.",
            32: "CDS elements define UUIDs, associations, compositions, timestamps, status codes and validation targets.",
            48: "CAP projections/read models expose Bugs, DeveloperWorkloads and role-aware monitoring data.",
            50: "N/A — JavaScript/CDS structures replace classic ABAP table types.",
            52: "db/schema.cds defines persistence; srv/service.cds defines service projections/actions/functions.",
            57: "app/bug-management-ui/annotations.cds and annotations/actions.cds provide Fiori metadata extensions.",
            60: "AuthService and BugService are declared in CDS and implemented by adjacent Node.js service handlers.",
            62: "OData V4 endpoints: /odata/v4/auth/ and /odata/v4/bug/. Render exposes the same contracts on Shared QA.",
            64: "@UI, @Common, @Capabilities and action annotations drive List Report/Object Page behavior.",
            66: "N/A — classic ABAP Function Groups are not used; behavior is organized as CAP/Node.js modules.",
            68: "N/A — CAP event handlers and JavaScript helpers replace classic ABAP Function Modules.",
            74: "Login, profile, dashboard, Fiori Elements List Report/Object Page and review dialogs are documented in Screen Layout/Definition.",
            76: "JavaScript modules use explicit require/sap.ui.define dependencies; no ABAP include programs apply.",
            79: "Fiori controller extensions provide supported custom actions/sections without DOM or internal-control manipulation.",
            85: "BugService extends cds.ApplicationService; helper modules encapsulate permissions, transitions, history, content, monitoring, email and AI.",
            92: "Canonical safe messages are listed in Message Definition; no ABAP Message Class is used.",
            94: "Bug number generation is handled by backend logic; no SAP Number Range Object is configured.",
            96: "N/A — IDTS does not generate SAP Smart Forms.", 98: "N/A — no Smartform Style is used.",
            100: "Bug lifecycle states/actions are implemented as CAP bound actions with transaction-scoped history and notification side effects.",
            102: "Next processor, assignee, reason and action parameters form the workflow context; classic workflow container elements do not apply.",
            104: "Jira controls project tasks; runtime work queues are derived from Bug ownership/status and are not SAP Workflow tasks.",
            106: "AWS S3 stores attachment binary; Brevo sends email; Render PostgreSQL stores Shared QA data; live OpenAI remains disabled.",
            108: "manifest.json routes Login/Dashboard/List Report/Object Page; actions return users to the affected Bug context.",
            115: "Official architecture diagram and sanitized Shared QA screenshots are embedded in the relevant template regions.",
            123: "Priority, Severity, Environment, SAP Module, Application Component and Defect Category are validated catalogs.",
            126: "Tester, Developer and PM roles are resolved server-side; UI visibility never replaces backend authorization.",
        },
        "vi": {
            5: "Luồng CAP/Fiori end-to-end; sơ đồ kiến trúc nằm trong vùng hình ảnh chính thức của template. AuthSessions chỉ lưu tokenHash SHA-256; raw bearer token chỉ được trả một lần.",
            7: "N/A — Jira quản lý kế hoạch dự án; đặc tả này mô tả baseline kỹ thuật đã triển khai.",
            10: "Node.js package: idts-sap01; module CAP được tổ chức trong app/, srv/ và db/.",
            12: "Entity CDS: Users, Bugs, Comments, Attachments, HistoryEvents, HistoryLogs, Notifications, NotificationDeliveries, AiSuggestions, DuplicateLinks và các code list.",
            16: "Type CDS và giá trị code list định nghĩa mã nghiệp vụ ổn định; không dùng ABAP domain cổ điển.",
            32: "Element CDS định nghĩa UUID, association, composition, timestamp, status code và validation target.",
            48: "Projection/read model CAP expose Bugs, DeveloperWorkloads và dữ liệu giám sát theo vai trò.",
            50: "N/A — cấu trúc JavaScript/CDS thay thế ABAP table type cổ điển.",
            52: "db/schema.cds định nghĩa persistence; srv/service.cds định nghĩa projection/action/function của service.",
            57: "app/bug-management-ui/annotations.cds và annotations/actions.cds cung cấp metadata extension cho Fiori.",
            60: "AuthService và BugService được khai báo trong CDS và triển khai bởi handler Node.js service nằm cạnh service definition.",
            62: "Endpoint OData V4: /odata/v4/auth/ và /odata/v4/bug/. Shared QA trên Render expose cùng contract.",
            64: "Annotation @UI, @Common, @Capabilities và action điều khiển List Report/Object Page.",
            66: "N/A — không dùng ABAP Function Group; behavior được tổ chức bằng module CAP/Node.js.",
            68: "N/A — CAP event handler và helper JavaScript thay thế ABAP Function Module.",
            74: "Login, profile, dashboard, Fiori Elements List Report/Object Page và review dialog được mô tả trong Screen Layout/Definition.",
            76: "Module JavaScript dùng dependency require/sap.ui.define rõ ràng; không áp dụng ABAP include program.",
            79: "Fiori controller extension cung cấp action/section tùy biến được hỗ trợ, không thao tác DOM hoặc internal control.",
            85: "BugService extends cds.ApplicationService; helper module tách permissions, transitions, history, content, monitoring, email và AI.",
            92: "Thông báo an toàn chuẩn nằm trong Message Definition; không dùng ABAP Message Class.",
            94: "Backend sinh Bug number; không cấu hình SAP Number Range Object.",
            96: "N/A — IDTS không tạo SAP Smart Form.", 98: "N/A — không dùng Smartform Style.",
            100: "Trạng thái/action vòng đời Bug được triển khai bằng CAP bound action với history và notification trong transaction.",
            102: "Next processor, assignee, reason và tham số action tạo workflow context; không áp dụng workflow container cổ điển.",
            104: "Jira quản lý task dự án; runtime queue được suy ra từ ownership/status của Bug, không phải SAP Workflow task.",
            106: "AWS S3 lưu binary tệp; Brevo gửi email; PostgreSQL trên Render lưu Shared QA; OpenAI live vẫn tắt.",
            108: "manifest.json định tuyến Login/Dashboard/List Report/Object Page; action đưa người dùng về Bug liên quan.",
            115: "Sơ đồ kiến trúc chính thức và screenshot Shared QA đã làm sạch được chèn vào vùng template phù hợp.",
            123: "Priority, Severity, Environment, SAP Module, Application Component và Defect Category là catalog được validate.",
            126: "Backend resolve vai trò Tester, Developer và PM; visibility UI không thay thế authorization backend.",
        },
    }[language]
    heading_rows = sorted(descriptions)
    for heading_row in heading_rows:
        next_heading = next((item for item in heading_rows if item > heading_row), 130)
        body_row = heading_row + 1
        if body_row >= next_heading:
            continue
        _merge_once(sheet, f"B{body_row}:AP{body_row}")
        _write(sheet, f"B{body_row}", descriptions[heading_row])
        sheet.row_dimensions[body_row].height = 48
    sheet._images = []
    diagram = XLImage(ROOT / "docs" / "diagrams" / "rendered" / "png" / "02-cap-fiori-architecture.png")
    diagram.width, diagram.height = 480, 340
    sheet.add_image(diagram, "AQ5")
    _set_print(sheet, "B1:BG129", "1:4")


def _fill_standards(workbook, language):
    sheet = workbook["Development Standards"]
    _set_metadata(sheet, "Development Standards" if language == "en" else "Tiêu chuẩn phát triển", language)
    details = {
        "en": {
            5: "CAP entities/services use stable business names; JavaScript symbols use camelCase; constants use explicit codes.",
            35: "CDS defines UUID keys, associations/compositions, constraints and audit fields; PostgreSQL follows CAP deployment output.",
            38: "N/A — CAP/Node.js modules replace classic ABAP Function Groups.", 40: "N/A — CAP handlers/helpers replace classic ABAP Function Modules.",
            43: "Non-obvious entry points explain trigger, input, decision, side effect, next dependency and breakpoint.",
            47: "Follow repository lint/format conventions; do not reformat unrelated files.",
            50: "Focused programmatic, API, integration and browser tests require positive, negative, role and persistence evidence.",
            53: "Tester, Developer and PM roles are resolved server-side from the authenticated IDTS user.",
            55: "N/A — IDTS uses CAP read models and Fiori Elements, not ABAP RAP My Inbox.",
            61: "Use CAP query API and request transactions; validate before mutation and keep workflow/history/notification consistent.",
            63: "UI text must be human-facing and sanitized; never expose SQL, stack traces, credentials or developer-only copy.",
            66: "Configuration is profile/environment based; secrets remain private and never enter source or evidence.",
            69: "Use Fiori/UI5 controls and official diagram assets; do not copy mock HTML/CSS into runtime.",
            71: "Validate active Priority, Severity, Environment and classification catalogs in CAP.",
        },
        "vi": {
            5: "Entity/service CAP dùng tên nghiệp vụ ổn định; symbol JavaScript dùng camelCase; constant dùng code rõ ràng.",
            35: "CDS định nghĩa UUID, association/composition, constraint và audit field; PostgreSQL theo output deploy của CAP.",
            38: "N/A — module CAP/Node.js thay thế ABAP Function Group cổ điển.", 40: "N/A — CAP handler/helper thay thế ABAP Function Module cổ điển.",
            43: "Entry point không hiển nhiên phải giải thích trigger, input, quyết định, side effect, dependency tiếp theo và breakpoint.",
            47: "Theo lint/format của repository; không reformat file không liên quan.",
            50: "Test programmatic, API, integration và browser cần evidence positive, negative, role và persistence.",
            53: "Backend resolve vai trò Tester, Developer và PM từ người dùng IDTS đã xác thực.",
            55: "N/A — IDTS dùng CAP read model và Fiori Elements, không dùng ABAP RAP My Inbox.",
            61: "Dùng CAP query API và request transaction; validate trước mutation, giữ nhất quán workflow/history/notification.",
            63: "Text UI phải dễ hiểu và được làm sạch; không lộ SQL, stack trace, credential hoặc copy nội bộ.",
            66: "Cấu hình theo profile/environment; secret luôn riêng tư và không nằm trong source/evidence.",
            69: "Dùng Fiori/UI5 control và diagram chính thức; không copy HTML/CSS mock vào runtime.",
            71: "CAP validate catalog Priority, Severity, Environment và classification đang active.",
        },
    }[language]
    for heading_row, text in details.items():
        body_row = heading_row + 1
        _write(sheet, f"C{body_row}", text)
        sheet.row_dimensions[body_row].height = max(sheet.row_dimensions[body_row].height or 15, 42)
    _set_print(sheet, "B1:BG83", "1:4")


def _fill_screen_layout(workbook, language):
    sheet = workbook["Screen Layout"]
    _set_metadata(sheet, "Screen Layout" if language == "en" else "Bố cục màn hình", language)
    _write(sheet, "B5", "Representative implemented screens" if language == "en" else "Các màn hình đã triển khai tiêu biểu", vertical="center")
    _write(sheet, "B6", "Layout 1 — Tester Bug Object Page" if language == "en" else "Bố cục 1 — Trang chi tiết Bug của Tester", vertical="center")
    _write(sheet, "B7", "Fiori Elements Object Page: summary, classification, assignment, collaboration, history and lifecycle actions." if language == "en" else "Fiori Elements Object Page: tóm tắt, phân loại, phân công, cộng tác, lịch sử và action vòng đời.")
    _write(sheet, "B16", "Layout 2 — Developer actions are shown below the Tester layout." if language == "en" else "Bố cục 2 — Action của Developer được minh họa bên dưới bố cục Tester.")
    sheet._images = []
    tester = XLImage(ROOT / "docs" / "pm" / "evidence" / "idts-100" / "shared-qa-attachments" / "idts73_saved_attachments_and_comments.png")
    developer = XLImage(ROOT / "docs" / "pm" / "evidence" / "idts-100" / "shared-qa-ai-browser" / "all-review-actions" / "02_classification_dialog.png")
    tester.width, tester.height = 1120, 450
    developer.width, developer.height = 1120, 450
    sheet.add_image(tester, "B9")
    sheet.add_image(developer, "B10")
    _set_print(sheet, "B1:BG16", "1:4", fit_height=1)


def _screen_rows(language):
    rows = [
        ("Title", "Text", "I", "1", "String", 200, "Yes", "Bug title", "Required; safe inline message"),
        ("Priority", "VH", "I", "1", "Assoc", 36, "Yes", "Active values", "Backend validates active catalog"),
        ("Severity", "VH", "I", "1", "Assoc", 36, "Yes", "Active values", "Backend validates active catalog"),
        ("Environment", "VH", "I", "1", "Assoc", 36, "Yes", "Active values", "Backend validates active catalog"),
        ("Assignee", "VH", "I", "1", "Assoc", 36, "No", "Smart assign", "Tester/PM only; empty means Pending Assignment"),
        ("Bug Number", "Text", "O", "1", "String", 20, "No", "Backend generated", "Read-only identifier"),
        ("Status", "Status", "O", "1", "Assoc", 36, "No", "Derived", "Changed only by validated lifecycle actions"),
        ("Current Action Owner", "Text", "O", "1", "Assoc", 36, "No", "Derived", "Different from technical assignee when workflow changes"),
        ("Comment", "TextArea", "I", "N", "String", 2000, "No", "After save", "Authorized Bug participant"),
        ("Attachment", "Upload", "I", "N", "Binary", "10 MB", "No", "Upload", "Pending in client memory before Bug activation; metadata DB, binary S3"),
        ("History", "Timeline", "O", "N", "Comp", "-", "No", "Show More", "Read-only audit timeline"),
        ("Lifecycle action", "Button", "I", "1", "Action", "-", "Role", "Object Page", "Backend permission and transition validation"),
        ("AI review", "Dialog", "I", "1", "Action", "-", "Role", "Review", "Review-only unless explicit apply/confirm"),
        ("Notification", "List", "O", "N", "Comp", "-", "No", "User scope", "In-app state independent from email delivery"),
        ("Dashboard KPI", "Card", "O", "N", "ReadModel", "-", "No", "Role filter", "No write authority"),
        ("Email delivery", "Status", "O", "N", "Comp", "-", "No", "Worker", "PENDING/SENT/FAILED/SKIPPED"),
    ]
    if language == "vi":
        translations = {
            "Title": "Tiêu đề", "Priority": "Mức ưu tiên", "Severity": "Mức nghiêm trọng", "Environment": "Môi trường",
            "Assignee": "Developer được phân công", "Bug Number": "Mã Bug", "Status": "Trạng thái", "Current Action Owner": "Người xử lý hiện tại",
            "Comment": "Bình luận", "Attachment": "Tệp đính kèm", "History": "Lịch sử", "Lifecycle action": "Action vòng đời",
            "AI review": "Review AI", "Notification": "Thông báo", "Dashboard KPI": "KPI dashboard", "Email delivery": "Trạng thái gửi email",
        }
        defaults = {
            "Bug title": "Tiêu đề Bug", "Active value help": "Value help đang active",
            "Active values": "Giá trị active", "Smart assign": "Phân công thông minh",
            "Smart assignment help": "Value help phân công thông minh", "Backend generated": "Backend tự sinh",
            "Backend derived": "Backend suy ra", "After active save": "Sau khi lưu Bug active",
            "Derived": "Backend suy ra", "After save": "Sau khi lưu", "Upload": "Tải lên",
            "Upload control": "Control tải lên", "Show More": "Xem thêm", "Object Page action": "Action trên Object Page",
            "Object Page": "Trang chi tiết", "Review": "Xem xét", "Role filter": "Lọc theo vai trò", "Worker": "Tiến trình nền",
            "Review dialog": "Dialog review", "User scope": "Theo người dùng", "Role-filtered": "Lọc theo vai trò",
            "System worker": "Worker hệ thống",
        }
        remarks = {
            "Required; safe inline message": "Bắt buộc; thông báo inline an toàn",
            "Backend validates active catalog": "Backend kiểm tra catalog đang active",
            "Tester/PM only; empty means Pending Assignment": "Chỉ Tester/PM; để trống thì thành Pending Assignment",
            "Read-only identifier": "Mã định danh chỉ đọc", "Changed only by validated lifecycle actions": "Chỉ đổi qua action vòng đời đã validate",
            "Different from technical assignee when workflow changes": "Có thể khác assignee kỹ thuật khi workflow thay đổi",
            "Authorized Bug participant": "Người tham gia Bug đã được cấp quyền",
            "Pending in client memory before Bug activation; metadata DB, binary S3": "Tạm giữ trong bộ nhớ trình duyệt trước khi activate Bug; metadata ở DB, binary ở S3",
            "Read-only audit timeline": "Timeline audit chỉ đọc", "Backend permission and transition validation": "Backend kiểm tra quyền và transition",
            "Review-only unless explicit apply/confirm": "Chỉ review trừ khi apply/confirm rõ ràng",
            "In-app state independent from email delivery": "Trạng thái trong ứng dụng độc lập với việc gửi email",
            "No write authority": "Không cấp quyền ghi", "PENDING/SENT/FAILED/SKIPPED": "PENDING/SENT/FAILED/SKIPPED",
        }
        rows = [
            (translations[a], b, c, d, e, f, "Có" if g == "Yes" else ("Không" if g == "No" else "Theo vai trò"), defaults.get(h, h), remarks.get(i, i))
            for a, b, c, d, e, f, g, h, i in rows
        ]
    return rows


def _fill_screen_definition(workbook, language):
    sheet = workbook["Screen Definition"]
    _set_metadata(sheet, "Screen Definition" if language == "en" else "Định nghĩa màn hình", language)
    _write(sheet, "B5", "Bug List Report and Object Page" if language == "en" else "Danh sách Bug và trang chi tiết Bug", wrap=False)
    _write(sheet, "B9", "1. Bug List Report / Object Page" if language == "en" else "1. Danh sách Bug / trang chi tiết Bug")
    if language == "vi":
        for coordinate, value in {"B10": "STT", "R10": "Thành phần màn hình", "AW10": "Ghi chú", "C11": "Tên", "I11": "Loại", "M11": "I/O", "O11": "Một/Nhiều", "R11": "Kiểu dữ liệu", "U11": "Độ dài", "X11": "Thập phân", "AA11": "Bắt buộc", "AE11": "Giá trị mặc định", "AI11": "Định dạng"}.items():
            _write(sheet, coordinate, value, vertical="center")
    rows = _screen_rows(language)
    target_rows = [13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29]
    anchors = ("C", "I", "M", "O", "R", "U", "AA", "AE", "AW")
    for index, (target_row, values) in enumerate(zip(target_rows, rows), 1):
        _write(sheet, f"B{target_row}", index, vertical="center")
        for column, value in zip(anchors, values):
            _write(sheet, f"{column}{target_row}", value)
        sheet.row_dimensions[target_row].height = 42
    _write(sheet, "B32", "2. Footer / Supplement" if language == "en" else "2. Footer / phụ lục")
    _write(sheet, "C43", "N/A — actions and navigation use the Fiori Elements Object Page toolbar and sections." if language == "en" else "N/A — action và điều hướng dùng toolbar/section của Fiori Elements Object Page.")
    _set_print(sheet, "B1:BG43", "1:11", fit_height=1)


def _fill_messages(workbook, language):
    sheet = workbook["Message Definition"]
    _set_metadata(sheet, "Message Definition" if language == "en" else "Định nghĩa thông báo", language)
    if language == "vi":
        for coordinate, value in {"B5": "Mã thông báo", "H5": "Ngôn ngữ", "M5": "Nội dung thông báo", "AQ5": "Thời điểm hiển thị"}.items():
            _write(sheet, coordinate, value, vertical="center")
    _clear_values(sheet, 6, 31)
    for row, item in enumerate(MESSAGES, 6):
        _write(sheet, f"B{row}", item["id"], vertical="center")
        _write(sheet, f"H{row}", "EN" if language == "en" else "VI", vertical="center")
        _write(sheet, f"M{row}", item["message"][language])
        _write(sheet, f"AQ{row}", item["timing"][language])
        sheet.row_dimensions[row].height = 54
    _set_print(sheet, f"B1:BG{5 + len(MESSAGES)}", "1:5")


def _flow_rows(language):
    rows = [
        ("FLOW-AUTH", "Submit sign-in", "POST /odata/v4/auth/login", "srv/auth.js::login", "Read Users; insert AuthSessions; return raw token once", "EVID-AUTH"),
        ("FLOW-DRAFT-NEW", "Choose Create", "NEW draft", "srv/service.js::prepareDraftNew", "Authorize create; initialize draft only", "EVID-BUG-WRITE"),
        ("FLOW-DRAFT-PATCH", "Edit draft field", "PATCH Bugs.drafts", "srv/bug-service/drafts.js::prepareDraftPatch", "Validate projected draft state; no active mutation", "EVID-BUG-WRITE"),
        ("FLOW-DRAFT-SAVE", "Save draft", "SAVE draft", "srv/bug-service/drafts.js::handleDraftSave", "Activate draft and route active CREATE/UPDATE", "EVID-BUG-WRITE"),
        ("FLOW-ACTIVE-CREATE", "Activate new Bug", "CREATE Bugs", "srv/bug-service/bug-write.js::prepareBugWrite", "Insert Bug; history; notification in request transaction", "EVID-BUG-WRITE"),
        ("FLOW-ACTIVE-UPDATE", "Save edited Bug", "UPDATE Bugs", "srv/bug-service/bug-write.js::prepareBugWrite", "Update Bug after permission/transition validation", "EVID-BUG-WRITE"),
        ("FLOW-ASSIGN", "Confirm Developer", "assignToDeveloper", "srv/bug-service/actions.js::assignToDeveloper", "Update assignee/status/next processor/history/notification", "EVID-ASSIGN"),
    ]
    for action, actors, before, after in LIFECYCLE_ACTIONS:
        rows.append((f"FLOW-{action.upper()}", f"{actors} invokes action", action, f"srv/bug-service/actions.js::{action}", f"Validate {before} → {after}; commit Bug/history/notification atomically", "EVID-IDTS-89"))
    rows.extend([
        ("FLOW-COMMENT-CREATE", "Add Comment", "CREATE Comments", "srv/bug-service/content.js::prepareCommentCreate", "Authorize participant; persist comment metadata", "EVID-COMMENT"),
        ("FLOW-ATTACH-QUEUE", "Select file before Bug save", "Client pending memory", "BugCollaboration.js::queuePendingCreateAttachments", "Validate and retain File object in browser memory; no S3 write", "EVID-ATTACH"),
        ("FLOW-ATTACH-UPLOAD", "Upload/flush after activation", "PUT Attachments/content", "BugCollaboration.js::uploadFilesToSavedBug; content.js::prepareAttachmentWrite", "Persist PostgreSQL metadata and S3 binary", "EVID-ATTACH"),
        ("FLOW-ATTACH-DOWNLOAD", "Choose Download", "GET Attachments/content", "BugCollaboration.js::onDownloadAttachment", "Read authorized S3 binary; return safe filename/content", "EVID-ATTACH"),
        ("FLOW-ATTACH-DELETE", "Confirm Delete", "DELETE Attachments", "BugCollaboration.js::onDeleteAttachment", "Delete authorized metadata/S3 object; preserve Bug", "EVID-ATTACH"),
        ("FLOW-HISTORY-READ", "Open History / Show More", "GET HistoryEvents/HistoryLogs", "srv/bug-service/history.js", "Read paged immutable audit records; no mutation", "EVID-HISTORY"),
        ("FLOW-NOTIFY-OUTBOX", "Workflow commits notification", "Internal CAP transaction", "srv/email/outbox.js::writeNotificationRecord", "Insert Notifications and NotificationDeliveries", "EVID-EMAIL"),
        ("FLOW-EMAIL-WORKER", "Worker polls eligible rows", "Background worker", "srv/email/worker.js::startEmailWorker", "Claim with lock; send; update retry/SENT/FAILED/SKIPPED", "EVID-EMAIL"),
        ("FLOW-MONITOR", "Open dashboard/queue", "GET read model", "srv/bug-service/monitoring.js::readDeveloperWorkloads", "Return role-scoped KPI rows; no mutation", "EVID-MONITOR"),
    ])
    for function_id, action, source, objective_en, objective_vi in AI_FUNCTIONS:
        rows.append((f"FLOW-{function_id}", f"Invoke {action}", action, source, objective_en if language == "en" else objective_vi, "EVID-AI-FALLBACK"))
    if language == "vi":
        vi_base = {
            "FLOW-AUTH": ("Gửi biểu mẫu đăng nhập", "Đọc Users; thêm AuthSessions; chỉ trả raw token một lần"),
            "FLOW-DRAFT-NEW": ("Chọn Tạo", "Kiểm tra quyền tạo; chỉ khởi tạo draft"),
            "FLOW-DRAFT-PATCH": ("Sửa field trên draft", "Validate trạng thái draft dự kiến; chưa thay đổi Bug active"),
            "FLOW-DRAFT-SAVE": ("Lưu draft", "Activate draft rồi chuyển sang CREATE/UPDATE active"),
            "FLOW-ACTIVE-CREATE": ("Activate Bug mới", "Thêm Bug, history và notification trong request transaction"),
            "FLOW-ACTIVE-UPDATE": ("Lưu Bug đã sửa", "Cập nhật Bug sau khi kiểm tra permission/transition"),
            "FLOW-ASSIGN": ("Xác nhận Developer", "Cập nhật assignee/status/next processor/history/notification"),
            "FLOW-COMMENT-CREATE": ("Thêm bình luận", "Cấp quyền người tham gia; lưu metadata bình luận"),
            "FLOW-ATTACH-QUEUE": ("Chọn tệp trước khi lưu Bug", "Validate và giữ File trong bộ nhớ trình duyệt; chưa ghi S3"),
            "FLOW-ATTACH-UPLOAD": ("Tải lên sau khi activate", "Lưu metadata PostgreSQL và binary S3"),
            "FLOW-ATTACH-DOWNLOAD": ("Chọn tải xuống", "Đọc binary S3 đã cấp quyền; trả tên/nội dung an toàn"),
            "FLOW-ATTACH-DELETE": ("Xác nhận xóa", "Xóa metadata/S3 object đã cấp quyền; giữ nguyên Bug"),
            "FLOW-HISTORY-READ": ("Mở Lịch sử / Xem thêm", "Đọc audit record bất biến có phân trang; không mutation"),
            "FLOW-NOTIFY-OUTBOX": ("Workflow commit thông báo", "Thêm Notifications và NotificationDeliveries"),
            "FLOW-EMAIL-WORKER": ("Worker polling các dòng đủ điều kiện", "Claim bằng lock; gửi; cập nhật retry/SENT/FAILED/SKIPPED"),
            "FLOW-MONITOR": ("Mở dashboard/hàng đợi", "Trả KPI theo vai trò; không mutation"),
        }
        lifecycle_map = {f"FLOW-{action.upper()}": (actors, before, after) for action, actors, before, after in LIFECYCLE_ACTIONS}
        translated = []
        for flow, trigger, request, source, effect, evidence in rows:
            if flow in vi_base:
                trigger, effect = vi_base[flow]
            elif flow in lifecycle_map:
                actors, before, after = lifecycle_map[flow]
                trigger = f"{actors} gọi action"
                effect = f"Kiểm tra {before} → {after}; commit Bug/history/notification atomically"
            elif flow.startswith("FLOW-FN-AI-"):
                trigger = "Gọi action hỗ trợ AI"
            translated.append((flow, trigger, request, source, effect, evidence))
        rows = translated
    return rows


def _fill_implementation(workbook, language):
    sheet = workbook["Technical Implementation"]
    _write(sheet, "B3", "Technical Implementation" if language == "en" else "Triển khai kỹ thuật", wrap=False)
    _write(sheet, "B4", "IDTS-TECH", wrap=False)
    _write(sheet, "L4", "IDTS CAP/Fiori Technical Baseline" if language == "en" else "Nền tảng kỹ thuật IDTS CAP/Fiori", wrap=False)
    _write(sheet, "X3", "Created by:" if language == "en" else "Người tạo:", wrap=False)
    _write(sheet, "AC3", "DonHV", wrap=False)
    _write(sheet, "X4", "Modified date:" if language == "en" else "Ngày cập nhật:", wrap=False)
    _write(sheet, "AC4", DOCUMENT_DATE.isoformat(), wrap=False)
    _write(sheet, "X5", "Reviewed by:" if language == "en" else "Người review:", wrap=False)
    _write(sheet, "AC5", "Pending" if language == "en" else "Chờ duyệt", wrap=False)
    headers = ["Flow ID", "Trigger / request", "Exact source", "Transaction / data effect", "Evidence ID"]
    if language == "vi":
        headers = ["Mã luồng", "Trigger / request", "Source chính xác", "Transaction / ảnh hưởng dữ liệu", "Mã evidence"]
    rows = [(flow, f"{trigger}; {request}", source, effect, evidence) for flow, trigger, request, source, effect, evidence in _flow_rows(language)]
    end = _write_template_table(
        sheet, 7,
        [("B", "E"), ("F", "J"), ("K", "O"), ("P", "V"), ("W", "AG")],
        headers, rows, workbook["Message Definition"],
    )
    _set_print(sheet, f"B1:AG{end}", "1:7", fit_height=3)


def _localize_template_headings(workbook):
    translations = {
        "Technical Specification": "Đặc tả kỹ thuật", "TECHNICAL SPECIFICATION": "ĐẶC TẢ KỸ THUẬT",
        "Introduction": "Giới thiệu", "Scope": "Phạm vi", "Assumptions": "Giả định",
        "Functional Requirements": "Yêu cầu chức năng", "Technical Design": "Thiết kế kỹ thuật",
        "Development Standards": "Tiêu chuẩn phát triển", "Screen Layout": "Bố cục màn hình",
        "Screen Definition": "Định nghĩa màn hình", "Message Definition": "Định nghĩa thông báo",
        "Technical Implementation": "Triển khai kỹ thuật", "Function ID": "Mã chức năng", "Function Name": "Tên chức năng",
        "Created by:": "Người tạo:", "Created date:": "Ngày tạo:", "Modified by:": "Người cập nhật:",
        "Modified date:": "Ngày cập nhật:", "Reviewed by:": "Người review:", "Reviewed date:": "Ngày review:",
        "Business Process": "Quy trình nghiệp vụ", "WBS & Timeline": "WBS và tiến độ",
        "Data Dictionary Objects ": "Đối tượng từ điển dữ liệu", "Data Dictionary Objects": "Đối tượng từ điển dữ liệu", "Package": "Package", "Tables": "Bảng dữ liệu",
        "Domain": "Miền dữ liệu", "Data Element": "Phần tử dữ liệu", "View": "View", "Table Type": "Kiểu bảng",
        "Data Definition": "Định nghĩa dữ liệu", "CDS Metadata Extension": "CDS Metadata Extension",
        "Service Definition": "Định nghĩa service", "Service Binding": "Service binding", "Annotation Model": "Mô hình annotation",
        "Function Group": "Function Group (không áp dụng)", "Function Module": "Function Module (không áp dụng)",
        "Screens": "Màn hình", "Includes": "Module phụ thuộc", "Enhancement Implementation": "Triển khai extension",
        "Class": "Lớp/service", "Message Class": "Danh mục thông báo", "Number Range Object": "Đối tượng sinh số",
        "Smart Forms": "Smart Forms (không áp dụng)", "Smartform Style": "Smartform Style (không áp dụng)",
        "Workflow Scenario": "Kịch bản workflow", "Container Element": "Dữ liệu workflow", "Task": "Task",
        "Provider": "Provider", "Navigation Target Object": "Đích điều hướng", "Graphic": "Đồ họa",
        "Catalogs": "Catalog", "Roles": "Vai trò", "Naming Convention": "Quy ước đặt tên", "Table Design": "Thiết kế bảng",
        "Code Comment": "Comment trong code", "Pretty Printer": "Định dạng code", "Test Program": "Chương trình kiểm thử",
        "Custom Role": "Vai trò tùy chỉnh", "RAP Model for My Inbox display": "RAP My Inbox (không áp dụng)",
        "DB Query": "Truy vấn database", "Texts in Code": "Text trong code", "System Program & Environment": "Chương trình và môi trường",
        "Graphics": "Đồ họa", "Pending": "Chờ duyệt", "Supplement": "Phụ lục",
    }
    for sheet in workbook.worksheets:
        for row in sheet.iter_rows():
            for cell in row:
                if not isinstance(cell, MergedCell) and isinstance(cell.value, str):
                    stripped = cell.value.strip()
                    if stripped in translations:
                        cell.value = cell.value[: len(cell.value) - len(cell.value.lstrip())] + translations[stripped]


def generate_technical_specification(language):
    if language not in {"en", "vi"}:
        raise ValueError(f"Unsupported language: {language}")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output = OUTPUT_DIR / f"Technical_Specification_IDTS_SAP01_{language}_v{VERSION}.xlsx"
    shutil.copy2(TEMPLATE, output)
    workbook = load_workbook(output)
    for name, item in list(workbook.defined_names.items()):
        if "#REF!" in str(item.attr_text):
            del workbook.defined_names[name]

    _fill_cover_and_history(workbook, language)
    _fill_intro_scope_assumptions(workbook, language)
    _fill_requirements(workbook, language)
    _fill_design(workbook, language)
    _fill_standards(workbook, language)
    _fill_screen_layout(workbook, language)
    _fill_screen_definition(workbook, language)
    _fill_messages(workbook, language)
    _fill_implementation(workbook, language)
    if language == "vi":
        _localize_template_headings(workbook)
    workbook.properties.title = f"IDTS SAP490 Technical Specification {language.upper()} v{VERSION}"
    workbook.properties.subject = "Official-template CAP/Fiori technical baseline"
    workbook.properties.creator = "IDTS SAP01 Team"
    workbook.save(output)
    return output
