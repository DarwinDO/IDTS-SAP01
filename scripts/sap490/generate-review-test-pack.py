"""Create current SAP490 review test artifacts from official templates.

Execution facts are deliberately conservative: only suites freshly evidenced in
the review session are marked PASS.
"""

from copy import copy
from datetime import date
from pathlib import Path
import shutil

from openpyxl import load_workbook
from openpyxl.cell.cell import MergedCell
from openpyxl.styles import Alignment


ROOT = Path(__file__).resolve().parents[2]
TEMPLATES = ROOT / "docs" / "sap490" / "templates" / "Deliverable_template"
TOP_TEMPLATE = ROOT / "docs" / "sap490" / "templates" / "2_SAP490_Test Report Template (1).xlsx"
OUT = ROOT / "docs" / "sap490" / "generated"
DATE = date(2026, 7, 10)


CASES = [
    ("RV-01", "Authentication and role boundary", "Xác thực và ranh giới role", "Authorized PM, Tester, and Developer use only their allowed actions.", "PM, Tester và Developer có quyền chỉ dùng action được phép.", "PASS", "qa:auth:programmatic (28 checks)"),
    ("RV-02", "Bug creation and catalog validation", "Tạo bug và validation catalog", "Invalid or unauthorized draft/create data is blocked without changing persisted business state.", "Dữ liệu draft/create sai hoặc không có quyền bị chặn và không đổi business state đã lưu.", "PASS", "qa:idts41:programmatic"),
    ("RV-03", "Comments and draft attachment evidence", "Comment và draft attachment evidence", "Comment/attachment context, persistence, and safe UI behavior remain correct.", "Context, persistence và UI an toàn của comment/attachment vẫn đúng.", "PASS", "qa:comments-attachments:programmatic; qa:idts73:programmatic"),
    ("RV-04", "AI provider and safe advisory review", "AI provider và advisory review an toàn", "Disabled/failure/unsafe AI states remain review-only, sanitized, and do not mutate the bug.", "State AI disabled/failure/unsafe vẫn review-only, đã sanitize và không đổi bug.", "PASS", "qa:idts64/idts65-idts71 programmatic"),
    ("RV-05", "AI review UI placement and copy", "Vị trí và copy UI AI review", "Similar, classification, and handoff actions are context-local, safe, and visibly review-only.", "Action similar, classification và handoff ở đúng context, an toàn và hiển thị review-only.", "PASS", "qa:idts74-idts77:programmatic"),
    ("RV-06", "PM monitoring release regression", "PM monitoring release regression", "PM can review workload, overdue state, queues, and current action ownership.", "PM có thể xem workload, overdue state, queue và current action owner.", "PASS", "qa:pm-monitoring:programmatic (20 checks)"),
]


def copy_template(template, output, top_level=False):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / output
    shutil.copy2(TOP_TEMPLATE if top_level else TEMPLATES / template, path)
    return path


def cell(ws, coordinate):
    target = ws[coordinate]
    if not isinstance(target, MergedCell):
        return target
    for merged in ws.merged_cells.ranges:
        if coordinate in merged:
            return ws.cell(merged.min_row, merged.min_col)
    raise ValueError(f"No merge anchor for {ws.title}!{coordinate}")


def write(ws, coordinate, value):
    target = cell(ws, coordinate)
    target.value = value
    old = copy(target.alignment)
    target.alignment = Alignment(
        horizontal=old.horizontal,
        vertical=old.vertical or "top",
        wrap_text=True,
        text_rotation=old.text_rotation,
        shrink_to_fit=old.shrink_to_fit,
        indent=old.indent,
    )


def cover(ws, title, function_id, function_name):
    for coordinate, value in (("B8", title), ("N11", "IDTS"), ("Z11", "Issue and Defect Tracking System in SAP"), ("N12", function_id), ("N13", function_name), ("N14", DATE), ("Z14", DATE), ("AE19", "DonHV")):
        write(ws, coordinate, value)


def history(ws, version, description, sheets):
    for coordinate, value in zip(("B3", "C3", "D3", "E3", "F3", "G3"), (1, version, description, sheets, DATE, "DonHV")):
        write(ws, coordinate, value)


def scenario(language):
    version = "0.3"
    output = copy_template("Test_Scenario.xlsx", f"Test_Scenario_IDTS_SAP01_{language}_v{version}.xlsx")
    wb = load_workbook(output)
    cover(wb["Cover"], "Test Scenario" if language == "en" else "Kịch bản kiểm thử", "IDTS-REVIEW-TEST", "Current implementation review" if language == "en" else "Review implementation hiện tại")
    history(wb["Histories"], version, "Current review scenarios linked to fresh programmatic evidence." if language == "en" else "Kịch bản review hiện tại liên kết với bằng chứng programmatic mới.", "Test Scenario, Test Cases")
    matrix = wb["Test Scenario"]
    for row, (case_id, en, vi, *_rest) in enumerate(CASES, 3):
        write(matrix, f"A{row}", row - 2)
        write(matrix, f"B{row}", en if language == "en" else vi)
        write(matrix, matrix.cell(row, row).coordinate, "X")
    cases = wb["Test Cases"]
    for coordinate, value in (("B3", "IDTS review evidence"), ("L3", "CAP/Fiori MVP regression"), ("BF3", "DonHV"), ("BO3", DATE), ("BV3", "Mentor / Supervisor"), ("CC3", "Pending review")):
        write(cases, coordinate, value)
    for row, (case_id, en, vi, expected_en, expected_vi, status, evidence) in enumerate(CASES, 8):
        write(cases, f"B{row}", case_id)
        write(cases, f"E{row}", en if language == "en" else vi)
        write(cases, f"Y{row}", "Seeded role/data; no credentials")
        write(cases, f"AP{row}", expected_en if language == "en" else expected_vi)
        cases.row_dimensions[row].height = 40
    wb.properties.title = f"IDTS SAP490 Test Scenario {language.upper()} v{version}"
    wb.properties.creator = "IDTS SAP01 Team"
    wb.save(output)
    return output


def unit(language):
    version = "0.3"
    output = copy_template("Unit_Test.xlsx", f"Unit_Test_IDTS_SAP01_{language}_v{version}.xlsx")
    wb = load_workbook(output)
    cover(wb["Cover"], "Unit Test" if language == "en" else "Kiểm thử đơn vị", "IDTS-REVIEW-UT", "Programmatic regression evidence" if language == "en" else "Bằng chứng regression programmatic")
    history(wb["Histories"], version, "Selected review-session programmatic evidence for all listed cases." if language == "en" else "Bằng chứng programmatic đã chọn trong phiên review cho toàn bộ case liệt kê.", "UT, Evidence")
    ws = wb["UT"]
    for coordinate, value in (("B3", "IDTS-REVIEW-UT"), ("L3", "CAP/Fiori review regression"), ("AO3", "DonHV"), ("AX3", DATE)):
        write(ws, coordinate, value)
    for row, (case_id, en, vi, expected_en, expected_vi, status, evidence) in enumerate(CASES, 8):
        write(ws, f"B{row}", case_id)
        write(ws, f"E{row}", en if language == "en" else vi)
        write(ws, f"Y{row}", expected_en if language == "en" else expected_vi)
        write(ws, f"AX{row}", "DonHV")
        write(ws, f"BD{row}", DATE)
        write(ws, f"BJ{row}", status)
        write(ws, f"BL{row}", evidence)
        ws.row_dimensions[row].height = 42
    evidence_ws = wb["Evidence"]
    write(evidence_ws, "B3", "Repository QA scripts and sanitized command evidence. No credentials, private endpoint, or raw provider output is included.")
    wb.properties.title = f"IDTS SAP490 Unit Test {language.upper()} v{version}"
    wb.properties.creator = "IDTS SAP01 Team"
    wb.save(output)
    return output


def functional(language):
    version = "0.2"
    output = copy_template("Functional_Test.xlsx", f"Functional_Test_IDTS_SAP01_{language}_v{version}.xlsx")
    wb = load_workbook(output)
    cover(wb["Cover"], "Functional Test" if language == "en" else "Kiểm thử chức năng", "IDTS-REVIEW-FT", "Evidence-backed review regression" if language == "en" else "Regression review có bằng chứng")
    history(wb["Histories"], version, "Functional review matrix refreshed from current CAP/Fiori and AI advisory evidence." if language == "en" else "Ma trận functional review được refresh từ bằng chứng CAP/Fiori và AI advisory hiện tại.", "Test Cases, Test Result, Test Data Description")
    cases = wb["Test Cases"]
    for coordinate, value in (("B3", "IDTS review regression"), ("L3", "CAP/Fiori MVP")):
        write(cases, coordinate, value)
    for row, (case_id, en, vi, expected_en, expected_vi, _status, _evidence) in enumerate(CASES, 8):
        write(cases, f"B{row}", case_id)
        write(cases, f"E{row}", en if language == "en" else vi)
        write(cases, f"Y{row}", "Authorized seeded role and valid test data")
        write(cases, f"AP{row}", expected_en if language == "en" else expected_vi)
        cases.row_dimensions[row].height = 40
    results = wb["Test Result"]
    for row, (case_id, en, vi, _expected_en, _expected_vi, status, evidence) in enumerate(CASES, 10):
        write(results, f"B{row}", case_id)
        write(results, f"E{row}", en if language == "en" else vi)
        write(results, f"L{row}", evidence)
        write(results, f"BJ{row}", status)
        write(results, f"BL{row}", DATE)
        results.row_dimensions[row].height = 38
    data = wb["Test Data Description"]
    write(data, "B3", "IDTS review data")
    write(data, "L3", "Seeded roles, approved catalog values, and safe mock/disabled AI modes. No private credentials.")
    wb.properties.title = f"IDTS SAP490 Functional Test {language.upper()} v{version}"
    wb.properties.creator = "IDTS SAP01 Team"
    wb.save(output)
    return output


def report(language):
    version = "0.2"
    output = copy_template(None, f"Test_Report_IDTS_SAP01_{language}_v{version}.xlsx", top_level=True)
    wb = load_workbook(output)
    cover_ws = wb["Cover"]
    for coordinate, value in (("B4", "Issue and Defect Tracking System in SAP"), ("B5", "IDTS-SAP01"), ("F4", "DonHV"), ("F5", DATE), ("F6", version), ("B11", DATE), ("C11", version), ("E11", "Current review regression report; PASS reflects fresh selected evidence and PLANNED is not an execution result."), ("F11", "CAP/Fiori review evidence")):
        write(cover_ws, coordinate, value)
    test_cases = wb["Test Cases"]
    for row, (case_id, en, vi, expected_en, _expected_vi, status, evidence) in enumerate(CASES, 9):
        write(test_cases, f"B{row}", case_id)
        write(test_cases, f"C{row}", en if language == "en" else vi)
        write(test_cases, f"D{row}", "Feature 1" if row <= 11 else "Feature 2")
        write(test_cases, f"E{row}", expected_en)
        write(test_cases, f"F{row}", evidence)
    stats = wb["Test Statistics"]
    write(stats, "C3", "IDTS SAP490 review regression")
    write(stats, "C6", "6 selected suites PASS with fresh programmatic evidence; UAT sign-off remains separate and pending.")
    feature1 = wb["Feature 1"]
    feature2 = wb["Feature 2"]
    for ws, subset, title in ((feature1, CASES[:3], "Core CAP/Fiori"), (feature2, CASES[3:], "AI review and PM monitoring")):
        write(ws, "B1", title)
        for row, (case_id, en, vi, expected_en, expected_vi, status, evidence) in enumerate(subset, 12):
            write(ws, f"A{row}", case_id)
            write(ws, f"B{row}", en if language == "en" else vi)
            write(ws, f"C{row}", expected_en if language == "en" else expected_vi)
            write(ws, f"F{row}", status)
            write(ws, f"H{row}", evidence)
            ws.row_dimensions[row].height = 38
    wb.properties.title = f"IDTS SAP490 Test Report {language.upper()} v{version}"
    wb.properties.creator = "IDTS SAP01 Team"
    wb.save(output)
    return output


def main():
    outputs = []
    for language in ("en", "vi"):
        outputs.extend((scenario(language), unit(language), functional(language), report(language)))
    for output in outputs:
        print(output.relative_to(ROOT))


if __name__ == "__main__":
    main()
