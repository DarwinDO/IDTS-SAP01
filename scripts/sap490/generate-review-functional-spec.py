"""Refresh the SAP490 Functional Specification from the official workbook template."""

from copy import copy
from datetime import date
from pathlib import Path
import shutil

from openpyxl import load_workbook
from openpyxl.cell.cell import MergedCell
from openpyxl.styles import Alignment


ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / "docs" / "sap490" / "templates" / "Deliverable_template" / "Functional_Specification.xlsx"
OUT = ROOT / "docs" / "sap490" / "generated"
DATE = date(2026, 7, 24)
VERSION = "0.4"


LABELS = {
    "en": {
        "title": "Functional Specification",
        "name": "IDTS CAP/Fiori MVP review baseline",
        "history": "Mentor-ready refresh: deployed OData paths, draft/active write lifecycle, exact action audit, expanded developer data, attachments, monitoring, and advisory-AI human-review behavior.",
        "overview": [
            "IDTS supports structured defect reporting for Tester, Developer, and PM roles.",
            "The system validates classification and responsibility-aware assignment, then controls lifecycle actions through CAP backend authority.",
            "Comments, draft attachments, history/audit, notification records, and PM monitoring provide evidence and ownership visibility.",
            "AI suggestions are optional, review-only, and cannot change a bug, authorization, assignment, classification, or workflow state.",
        ],
        "flow": [
            "Tester checks similar bugs and creates a structured report.",
            "System validates required catalog/classification data and assigns a suitable developer or leaves Pending Assignment.",
            "Developer reviews, requests information/rejects with reason, progresses, and resolves through authorized actions.",
            "Tester or PM retests, closes, or reopens; history and notification records remain auditable.",
            "PM monitors workload, overdue/queue states, and current action ownership.",
        ],
        "screen": "List Report and Object Page expose Bug Summary, Classification/Assignment, Reproduction, Evidence/Attachments, Comments, History, Notifications, PM monitoring, and context-local AI review actions.",
        "messages": [("IDTS-FS-001", "Required/invalid catalog data is rejected by CAP.", "Create/update validation"), ("IDTS-FS-002", "Only an authorized role can run this lifecycle action.", "Action authorization"), ("IDTS-FS-003", "AI suggestion requires human review and does not update the bug automatically.", "AI review")],
        "processing": "Fiori calls AuthService at /odata/v4/auth/ and BugService at /odata/v4/bug/. Create uses draft NEW, repeated PATCH and SAVE/CREATE; active editing uses EDIT, PATCH and UPDATE. CAP validates inputs and role/status permissions, derives system-owned values, writes exact-action history and notification side effects, and returns safe OData responses. PostgreSQL stores business metadata, S3 stores attachment bytes, and AiSuggestions stores only normalized PENDING advisory audit rows. The live AI provider remains disabled.",
    },
    "vi": {
        "title": "Đặc tả chức năng",
        "name": "IDTS CAP/Fiori MVP review baseline",
        "history": "Cập nhật mentor-ready: endpoint OData đã deploy, vòng đời ghi draft/active, exact action audit, dữ liệu Developer mở rộng, attachment, monitoring và AI advisory có human review.",
        "overview": [
            "IDTS hỗ trợ defect reporting có cấu trúc cho role Tester, Developer và PM.",
            "Hệ thống validate classification và assignment theo responsibility, sau đó kiểm soát lifecycle action bằng CAP backend authority.",
            "Comment, draft attachment, history/audit, notification record và PM monitoring cung cấp evidence và ownership visibility.",
            "AI suggestion là tùy chọn, review-only và không đổi bug, authorization, assignment, classification hoặc workflow state.",
        ],
        "flow": [
            "Tester kiểm tra similar bug và tạo report có cấu trúc.",
            "Hệ thống validate catalog/classification bắt buộc và assign developer phù hợp hoặc để Pending Assignment.",
            "Developer review, request information/reject kèm reason, progress và resolve qua action có quyền.",
            "Tester hoặc PM retest, close hoặc reopen; history và notification vẫn audit được.",
            "PM monitor workload, overdue/queue state và current action owner.",
        ],
        "screen": "List Report và Object Page có Bug Summary, Classification/Assignment, Reproduction, Evidence/Attachments, Comments, History, Notifications, PM monitoring và AI review action tại đúng context.",
        "messages": [("IDTS-FS-001", "CAP từ chối catalog data thiếu hoặc không hợp lệ.", "Create/update validation"), ("IDTS-FS-002", "Chỉ role được phép mới chạy lifecycle action này.", "Action authorization"), ("IDTS-FS-003", "AI suggestion cần human review và không tự update bug.", "AI review")],
        "processing": "Fiori gọi AuthService tại /odata/v4/auth/ và BugService tại /odata/v4/bug/. Tạo mới dùng draft NEW, PATCH lặp lại và SAVE/CREATE; sửa Bug active dùng EDIT, PATCH và UPDATE. CAP validate input và quyền role/status, derive system-owned value, ghi history exact-action và notification side effect rồi trả OData response an toàn. PostgreSQL lưu metadata nghiệp vụ, S3 lưu binary attachment và AiSuggestions chỉ lưu audit tư vấn đã chuẩn hóa ở PENDING. Live AI provider vẫn bị tắt.",
    },
}


def writable(ws, coord):
    target = ws[coord]
    if not isinstance(target, MergedCell):
        return target
    for merged in ws.merged_cells.ranges:
        if coord in merged:
            return ws.cell(merged.min_row, merged.min_col)
    raise ValueError(f"No merge anchor for {ws.title}!{coord}")


def write(ws, coord, value):
    target = writable(ws, coord)
    target.value = value
    old = copy(target.alignment)
    target.alignment = Alignment(horizontal=old.horizontal, vertical=old.vertical or "top", wrap_text=True, text_rotation=old.text_rotation, shrink_to_fit=old.shrink_to_fit, indent=old.indent)


def cover(ws, labels):
    for coord, value in (("B8", labels["title"]), ("N11", "IDTS"), ("Z11", "Issue and Defect Tracking System in SAP"), ("N12", "IDTS-FS-REVIEW"), ("N13", labels["name"]), ("N14", DATE), ("Z14", DATE), ("AE19", "DonHV")):
        write(ws, coord, value)


def build(language):
    labels = LABELS[language]
    OUT.mkdir(parents=True, exist_ok=True)
    output = OUT / f"Functional_Specification_IDTS_SAP01_{language}_v{VERSION}.xlsx"
    shutil.copy2(TEMPLATE, output)
    wb = load_workbook(output)
    cover(wb["Cover"], labels)
    histories = wb["Histories"]
    for coord, value in zip(("B3", "C3", "D3", "E3", "F3", "G3"), (1, VERSION, labels["history"], "All mapped sheets", DATE, "DonHV")):
        write(histories, coord, value)
    overview = wb["Function Overview"]
    for row, value in enumerate(labels["overview"], 15):
        write(overview, f"B{row}", value)
        overview.row_dimensions[row].height = 42
    flow = wb["Process Flow"]
    for row, value in enumerate(labels["flow"], 6):
        write(flow, f"B{row}", value)
        flow.row_dimensions[row].height = 38
    for name in ("Screen Layout", "Screen Definition"):
        ws = wb[name]
        write(ws, "B4", labels["screen"])
    smart_form = wb["Smart Form Structure"]
    write(smart_form, "B4", "Not applicable: IDTS uses Fiori Elements/SAPUI5; no SAP Smart Form is implemented.")
    messages = wb["Message Definition"]
    for row, (message_id, message, timing) in enumerate(labels["messages"], 6):
        write(messages, f"B{row}", message_id)
        write(messages, f"F{row}", "English" if language == "en" else "Vietnamese")
        write(messages, f"J{row}", message)
        write(messages, f"AG{row}", timing)
        messages.row_dimensions[row].height = 40
    processing = wb["Processing Description"]
    write(processing, "B6", labels["processing"])
    processing.row_dimensions[6].height = 84
    wb.properties.title = f"IDTS SAP490 Functional Specification {language.upper()} v{VERSION}"
    wb.properties.subject = "Current CAP/Fiori review baseline"
    wb.properties.creator = "IDTS SAP01 Team"
    wb.save(output)
    return output


def main():
    for language in ("en", "vi"):
        print(build(language).relative_to(ROOT))


if __name__ == "__main__":
    main()
