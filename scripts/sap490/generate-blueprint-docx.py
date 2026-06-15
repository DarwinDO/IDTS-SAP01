from pathlib import Path
from shutil import copyfile

from docx import Document
from docx.oxml import OxmlElement
from docx.text.paragraph import Paragraph


ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / "docs" / "sap490" / "templates" / "Deliverable_template" / "Blueprint_Template.docx"
OUT_DIR = ROOT / "docs" / "sap490" / "generated"


def set_paragraph_text(paragraph, text):
    """Replace visible paragraph text while preserving the first run formatting."""
    if not paragraph.runs:
        paragraph.add_run()
    first = paragraph.runs[0]
    for run in paragraph.runs:
        run.text = ""
    parts = str(text).split("\n")
    first.text = parts[0]
    for part in parts[1:]:
        first.add_break()
        first.add_text(part)


def set_cell_text(cell, text):
    if not cell.paragraphs:
        cell.add_paragraph()
    set_paragraph_text(cell.paragraphs[0], text)
    for paragraph in cell.paragraphs[1:]:
        set_paragraph_text(paragraph, "")


def insert_paragraph_after(paragraph, text, style="Normal"):
    new_p = OxmlElement("w:p")
    paragraph._p.addnext(new_p)
    new_para = Paragraph(new_p, paragraph._parent)
    if style:
        new_para.style = style
    set_paragraph_text(new_para, text)
    return new_para


def find_paragraph(doc, text):
    for paragraph in doc.paragraphs:
        if paragraph.text.strip() == text:
            return paragraph
    raise ValueError(f"Paragraph not found: {text}")


def replace_heading(doc, old, new):
    paragraph = find_paragraph(doc, old)
    set_paragraph_text(paragraph, new)
    return paragraph


def fill_table(table, rows):
    for row_index, values in rows.items():
        for col_index, value in enumerate(values):
            if row_index < len(table.rows) and col_index < len(table.rows[row_index].cells):
                set_cell_text(table.rows[row_index].cells[col_index], value)


EN = {
    "output": "Blueprint_IDTS_SAP01_en_v0.1.docx",
    "cover": [
        "Issue and Defect Tracking System in SAP",
        "SAP490 Project Blueprint | English Version | v0.1",
        "Stack: SAP CAP Node.js, OData V4, SAP Fiori Elements/SAPUI5, SQLite local",
        "Prepared by: DonHV | Date: 2026-06-10 | Template: Blueprint_Template.docx",
    ],
    "history": {
        2: [
            "2026-06-10",
            "Initial IDTS Blueprint",
            "Created an English Blueprint by copying and filling the official SAP490 Blueprint template.",
            "DonHV / Codex",
            "A",
            "v0.1",
        ],
        3: [
            "2026-06-10",
            "Language split correction",
            "Separated SAP490 Blueprint deliverables into English and Vietnamese template-filled files.",
            "DonHV / Codex",
            "C",
            "v0.1",
        ],
    },
    "advisor": {
        2: ["Created by", "DonHV - Team Leader / Backend CAP Lead", "", "2026-06-10", "Draft for mentor/team review"],
        3: ["Reviewed by", "Mentor / Team Review", "", "TBD", "Pending review"],
        4: ["Approved by", "Mentor / Supervisor", "", "TBD", "Not approved yet"],
    },
    "fu": {
        2: ["Reviewed by", "FPT University / Mentor", "", "TBD", "Pending review"],
        3: ["Approved by", "FPT University / Supervisor", "", "TBD", "Not approved yet"],
    },
    "toc": "Table of Contents\nUpdate this table in Microsoft Word before final submission: References > Update Table.",
    "overview": [
        "IDTS is an internal SAP-oriented issue and defect tracking system for software testing. It helps Testers record defects, classify them by optional SAP Module, Application Component and Defect Category, assign a suitable Developer, track follow-up ownership through nextProcessor, and support PM monitoring through history and notification records.",
        "The MVP scope is limited to defect tracking. IDTS does not replace Jira, SAP Cloud ALM, SAP Solution Manager, or source-code workflow tools, and it does not implement code fixing, CI/CD, code review workflow, or mandatory AI root cause analysis.",
        "Current baseline: WP1-WP3 MVP backend, OData service, value help, handler validation, history, and notification records are implemented. WP4 core Fiori screens exist, while deeper UI QA and real attachment upload remain open.",
    ],
    "diagram_note": "Detailed diagrams are maintained under docs/diagrams. This Blueprint keeps the process content in the school template's table structure to preserve the official layout; diagrams can be referenced during mentor presentation unless the template is revised.",
    "org": "MVP roles are Tester, Developer, and PM. Reporter and Admin are deferred as separate roles. DonHV leads Backend CAP and documentation consolidation; NhanT supports backend verification/QA; DatDT and SangVN focus on Fiori/UI5 delivery.",
    "business_intro": "The core process starts when a Tester detects a defect and ends when a Tester or PM closes the bug after retest. Need More Information and Rejected are follow-up states, not silent endings.",
    "process_flow": "Detect bug -> Check duplicate -> Create report -> Classify -> Assign or Pending Assignment -> Developer review -> Request information / Reject / In Progress / Resolve -> Retest -> Close or Reopen -> PM monitoring.",
    "reports_intro": "Based on local requirements, the following reports and views can be used for PM monitoring, QA evidence, and mentor review.",
    "glossary": {
        1: ["IDTS", "Issue and Defect Tracking System in SAP.", "Project/application name."],
        2: ["SAP CAP", "Cloud Application Programming model used for the Node.js backend and CDS data model.", "Backend stack."],
        3: ["SAP Fiori Elements", "Metadata-driven SAP UI approach used for List Report/Object Page screens.", "Frontend baseline."],
        4: ["SAP Module", "Optional SAP business context such as FI, MM, SD, or Not Applicable.", "Optional context."],
        5: ["Application Component", "The area where the defect appears, such as Bug Management UI, CAP Backend, or Database.", "Required classification."],
        6: ["Defect Category", "The defect type or technical layer, such as UI/Fiori, Backend/CAP, Database, or Authorization.", "Required classification."],
        7: ["Component Category", "A valid pair of Application Component and Defect Category used as the assignment key.", "Derived or validated."],
        8: ["Developer Responsibility", "Mapping that defines which Developer can handle which Component Category and optional SAP Module.", "Assignee filtering."],
        9: ["nextProcessor", "Current person or role/queue expected to take the next action.", "Not a second assignee."],
        10: ["Retest Required", "Status used after resolution when Tester/PM verification is needed before closure.", "Core lifecycle status."],
    },
    "steps": {
        1: [
            "1",
            "Report and classify defect",
            "Tester checks existing bugs, creates the report, enters reproduction details, expected/actual results, severity, environment, Application Component, Defect Category, and optional SAP Module.",
            "Tester",
        ],
        2: [
            "2",
            "Assign, review, and follow up",
            "System validates Component Category and Developer Responsibility. Tester assigns a Developer or leaves the bug Pending Assignment. Developer can review, comment, request information, reject with reason, or move to In Progress.",
            "Tester / Developer / System",
        ],
        3: [
            "3",
            "Resolve, retest, close, and monitor",
            "Developer resolves with required note when applicable. Tester or PM retests, closes, or reopens. System records history and notification records; PM monitors workload, overdue bugs, rejected follow-up, and queues.",
            "Developer / Tester / PM / System",
        ],
    },
    "reports": {
        1: ["1", "Operational bug monitoring: open bugs by status, assignee, priority, severity, Application Component, Defect Category, nextProcessor, and overdue state.", "N/A - Fiori List Report / PM view"],
        2: ["2", "QA and audit evidence: bug history, comments, notification records, rejected follow-up queue, and retest required queue.", "N/A - Fiori Object Page / PM view"],
    },
}


VI = {
    "output": "Blueprint_IDTS_SAP01_vi_v0.1.docx",
    "cover": [
        "Hệ Thống Quản Lý Bug và Defect trong SAP",
        "SAP490 Project Blueprint | Phiên bản tiếng Việt | v0.1",
        "Công nghệ: SAP CAP Node.js, OData V4, SAP Fiori Elements/SAPUI5, SQLite local",
        "Người chuẩn bị: DonHV | Ngày: 2026-06-10 | Template: Blueprint_Template.docx",
    ],
    "history": {
        2: [
            "2026-06-10",
            "Tạo Blueprint IDTS ban đầu",
            "Tạo bản Blueprint tiếng Việt bằng cách copy và fill trực tiếp từ template SAP490 chính thức.",
            "DonHV / Codex",
            "A",
            "v0.1",
        ],
        3: [
            "2026-06-10",
            "Tách ngôn ngữ",
            "Tách deliverable SAP490 Blueprint thành hai file template-filled riêng cho tiếng Anh và tiếng Việt.",
            "DonHV / Codex",
            "C",
            "v0.1",
        ],
    },
    "advisor": {
        2: ["Created by", "DonHV - Team Leader / Backend CAP Lead", "", "2026-06-10", "Bản nháp để mentor/team review"],
        3: ["Reviewed by", "Mentor / Team Review", "", "TBD", "Chờ review"],
        4: ["Approved by", "Mentor / Supervisor", "", "TBD", "Chưa được duyệt"],
    },
    "fu": {
        2: ["Reviewed by", "FPT University / Mentor", "", "TBD", "Chờ review"],
        3: ["Approved by", "FPT University / Supervisor", "", "TBD", "Chưa được duyệt"],
    },
    "toc": "Mục lục\nCập nhật mục lục trong Microsoft Word trước khi nộp: References > Update Table.",
    "overview": [
        "IDTS là hệ thống nội bộ theo định hướng SAP để quản lý issue và defect trong quá trình kiểm thử phần mềm. Hệ thống giúp Tester ghi nhận bug, phân loại theo SAP Module tùy chọn, Application Component và Defect Category, assign Developer phù hợp, theo dõi người hoặc queue xử lý tiếp theo thông qua nextProcessor, và hỗ trợ PM theo dõi bằng history log và notification record.",
        "Phạm vi MVP chỉ tập trung vào quản lý defect. IDTS không thay thế Jira, SAP Cloud ALM, SAP Solution Manager hoặc công cụ quản lý source code, và không triển khai sửa code trực tiếp, CI/CD, code review workflow hoặc AI Root Cause Analysis bắt buộc.",
        "Baseline hiện tại: WP1-WP3 ở mức MVP đã có backend, OData service, value help, handler validation, history và notification records. WP4 đã có core Fiori screens; UI QA sâu hơn và upload attachment thật vẫn còn mở.",
    ],
    "diagram_note": "Các diagram chi tiết được duy trì trong docs/diagrams. Blueprint này giữ nội dung process trong cấu trúc bảng của template trường để bảo toàn layout chính thức; diagram có thể được tham chiếu khi trình bày với mentor nếu chưa sửa template.",
    "org": "MVP dùng ba role active: Tester, Developer và PM. Reporter và Admin chưa tách thành role riêng. DonHV lead Backend CAP và tổng hợp tài liệu; NhanT hỗ trợ backend verification/QA; DatDT và SangVN tập trung Fiori/UI5.",
    "business_intro": "Quy trình cốt lõi bắt đầu khi Tester phát hiện defect và kết thúc khi Tester hoặc PM đóng bug sau khi retest. Need More Information và Rejected là trạng thái cần follow-up, không phải điểm kết thúc im lặng.",
    "process_flow": "Phát hiện bug -> Kiểm tra trùng -> Tạo report -> Phân loại -> Assign hoặc Pending Assignment -> Developer review -> Request information / Reject / In Progress / Resolve -> Retest -> Close hoặc Reopen -> PM monitoring.",
    "reports_intro": "Dựa trên yêu cầu local, các report và view sau có thể dùng cho PM monitoring, bằng chứng QA và review với mentor.",
    "glossary": {
        1: ["IDTS", "Issue and Defect Tracking System in SAP.", "Tên project/ứng dụng."],
        2: ["SAP CAP", "Cloud Application Programming model dùng cho backend Node.js và data model CDS.", "Backend stack."],
        3: ["SAP Fiori Elements", "Cách xây UI SAP dựa trên metadata cho màn hình List Report/Object Page.", "Frontend baseline."],
        4: ["SAP Module", "Ngữ cảnh nghiệp vụ SAP tùy chọn như FI, MM, SD hoặc Not Applicable.", "Thông tin context tùy chọn."],
        5: ["Application Component", "Khu vực nơi defect xuất hiện, ví dụ Bug Management UI, CAP Backend hoặc Database.", "Phân loại bắt buộc."],
        6: ["Defect Category", "Loại defect hoặc tầng kỹ thuật, ví dụ UI/Fiori, Backend/CAP, Database hoặc Authorization.", "Phân loại bắt buộc."],
        7: ["Component Category", "Cặp hợp lệ giữa Application Component và Defect Category, dùng làm khóa assignment.", "Được derive hoặc validate."],
        8: ["Developer Responsibility", "Mapping xác định Developer nào xử lý được Component Category nào, có thể giới hạn thêm theo SAP Module.", "Filter assignee."],
        9: ["nextProcessor", "Người hoặc role/queue đang được kỳ vọng thực hiện bước tiếp theo.", "Không phải assignee thứ hai."],
        10: ["Retest Required", "Trạng thái sau khi resolve khi cần Tester/PM kiểm tra trước khi đóng bug.", "Trạng thái lifecycle chính."],
    },
    "steps": {
        1: [
            "1",
            "Ghi nhận và phân loại defect",
            "Tester kiểm tra bug đã tồn tại, tạo report, nhập bước tái hiện, expected/actual result, severity, environment, Application Component, Defect Category và SAP Module tùy chọn.",
            "Tester",
        ],
        2: [
            "2",
            "Assign, review và follow-up",
            "Hệ thống validate Component Category và Developer Responsibility. Tester assign Developer hoặc để Pending Assignment. Developer có thể review, comment, request information, reject kèm reason hoặc chuyển In Progress.",
            "Tester / Developer / System",
        ],
        3: [
            "3",
            "Resolve, retest, close và monitor",
            "Developer resolve kèm note khi bắt buộc. Tester hoặc PM retest, close hoặc reopen. Hệ thống ghi history và notification records; PM theo dõi workload, overdue bug, rejected follow-up và queue.",
            "Developer / Tester / PM / System",
        ],
    },
    "reports": {
        1: ["1", "Theo dõi bug vận hành: open bugs theo status, assignee, priority, severity, Application Component, Defect Category, nextProcessor và overdue state.", "N/A - Fiori List Report / PM view"],
        2: ["2", "Bằng chứng QA và audit: bug history, comments, notification records, rejected follow-up queue và retest required queue.", "N/A - Fiori Object Page / PM view"],
    },
}


def build_blueprint(content):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    output = OUT_DIR / content["output"]
    copyfile(TEMPLATE, output)
    doc = Document(output)

    fill_table(doc.tables[0], {0: [content["cover"][0]], 1: [content["cover"][1]], 2: [content["cover"][2]], 3: [content["cover"][3]]})
    fill_table(doc.tables[1], content["history"])
    fill_table(doc.tables[2], content["advisor"])
    fill_table(doc.tables[3], content["fu"])
    fill_table(doc.tables[4], {0: [content["toc"]]})
    fill_table(doc.tables[5], content["glossary"])
    fill_table(doc.tables[6], content["steps"])
    fill_table(doc.tables[7], content["reports"])

    overview_heading = find_paragraph(doc, "OVERVIEW")
    anchor = overview_heading
    for paragraph_text in content["overview"]:
        anchor = insert_paragraph_after(anchor, paragraph_text)

    diagram_heading = find_paragraph(doc, "Flow chart shapes usage")
    set_paragraph_text(diagram_heading, "Blueprint Diagram Usage" if content is EN else "Cách sử dụng diagram trong Blueprint")
    insert_paragraph_after(diagram_heading, content["diagram_note"])

    org_heading = find_paragraph(doc, "ORGANIZATIONAL STRUCTURE")
    if content is VI:
        set_paragraph_text(org_heading, "CƠ CẤU TỔ CHỨC")
    insert_paragraph_after(org_heading, content["org"])

    bp_heading = find_paragraph(doc, "BUSINESS PROCESS")
    if content is VI:
        set_paragraph_text(bp_heading, "QUY TRÌNH NGHIỆP VỤ")
    insert_paragraph_after(bp_heading, content["business_intro"])

    replace_heading(doc, "SD-MD-01 Customer Master Data", "IDTS-BP-01 Bug and Defect Tracking Process" if content is EN else "IDTS-BP-01 Quy trình quản lý bug/defect")

    flow_heading = find_paragraph(doc, "Process Flow")
    if content is VI:
        set_paragraph_text(flow_heading, "Luồng xử lý")
    insert_paragraph_after(flow_heading, content["process_flow"])

    if content is VI:
        set_paragraph_text(find_paragraph(doc, "Process Description"), "Mô tả quy trình")
        set_paragraph_text(find_paragraph(doc, "REPORTS"), "BÁO CÁO")

    reports_para = find_paragraph(doc, "Based on local requirement, following are reports that can use in the future")
    set_paragraph_text(reports_para, content["reports_intro"])

    doc.save(output)
    return output


def main():
    if not TEMPLATE.exists():
        raise FileNotFoundError(TEMPLATE)
    outputs = [build_blueprint(EN), build_blueprint(VI)]
    for output in outputs:
        print(output.relative_to(ROOT))


if __name__ == "__main__":
    main()
