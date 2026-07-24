"""Validate SAP490 Blueprint v0.4 template fidelity and EN/VI table parity."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from zipfile import ZipFile

from docx import Document
from docx.oxml.ns import qn


ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / "docs" / "sap490" / "templates" / "Deliverable_template" / "Blueprint_Template.docx"
OUTPUTS = {
    "en": ROOT / "docs" / "sap490" / "generated" / "Blueprint_IDTS_SAP01_en_v0.4.docx",
    "vi": ROOT / "docs" / "sap490" / "generated" / "Blueprint_IDTS_SAP01_vi_v0.4.docx",
}

CORE_SHAPES = [(4, 1), (5, 6), (5, 5), (4, 5), (1, 1), (None, 3), (14, 4), (5, 3)]
ADDED_TABLES = {
    "en": [
        ("Layer", 7, 4),
        ("Capability ID", 10, 5),
        ("Object / System", 13, 5),
        ("Data object", 8, 5),
        ("Boundary", 9, 5),
        ("Role", 5, 4),
        ("Activity", 9, 5),
        ("Current status", 13, 6),
        ("Area", 8, 5),
        ("ID", 7, 5),
    ],
    "vi": [
        ("Lớp", 7, 4),
        ("Mã năng lực", 10, 5),
        ("Đối tượng / Hệ thống", 13, 5),
        ("Đối tượng dữ liệu", 8, 5),
        ("Ranh giới", 9, 5),
        ("Vai trò", 5, 4),
        ("Hoạt động", 9, 5),
        ("Trạng thái hiện tại", 13, 6),
        ("Phạm vi", 8, 5),
        ("Mã", 7, 5),
    ],
}
HEADING_1 = {
    "en": ["OVERVIEW", "ORGANIZATIONAL STRUCTURE", "BUSINESS PROCESS", "REPORTS"],
    "vi": ["TỔNG QUAN (OVERVIEW)", "CƠ CẤU TỔ CHỨC (ORGANIZATIONAL STRUCTURE)", "QUY TRÌNH NGHIỆP VỤ (BUSINESS PROCESS)", "BÁO CÁO (REPORTS)"],
}
FORBIDDEN = ["AAAA", "FPT Software HCM Co., Ltd.", "Nguyen Hoang Group", "Created By Van Bao Chau"]
TABLE_TITLES = {
    "en": [
        ("Current solution baseline", "Heading 3"),
        ("Functional capabilities", "Heading 3"),
        ("Information objects and integrations", "Heading 3"),
        ("Data ownership and retention", "Heading 3"),
        ("Interfaces and control boundaries", "Heading 3"),
        ("Roles and responsibilities", "Heading 2"),
        ("RACI responsibility matrix", "Heading 2"),
        ("Bug lifecycle, status transition and next processor", "Heading 3"),
        ("Verification and acceptance status", "Heading 2"),
        ("Known limitations", "Heading 2"),
    ],
    "vi": [
        ("Hiện trạng giải pháp", "Heading 3"),
        ("Các năng lực chức năng", "Heading 3"),
        ("Đối tượng thông tin và tích hợp", "Heading 3"),
        ("Quyền sở hữu và lưu giữ dữ liệu", "Heading 3"),
        ("Giao diện và ranh giới kiểm soát", "Heading 3"),
        ("Vai trò và trách nhiệm", "Heading 2"),
        ("Ma trận trách nhiệm RACI", "Heading 2"),
        ("Vòng đời bug, chuyển trạng thái và người xử lý tiếp", "Heading 3"),
        ("Trạng thái kiểm chứng và nghiệm thu", "Heading 2"),
        ("Các giới hạn đã biết", "Heading 2"),
    ],
}
ZERO_WIDTH_SPACE = "\u200b"


def fail(message: str, errors: list[str]) -> None:
    errors.append(message)


def style_signature(doc: Document) -> list[tuple[str, str, int]]:
    return [(style.style_id, style.name, int(style.type)) for style in doc.styles]


def numbering_signature(path: Path) -> tuple[list[str], list[str]]:
    with ZipFile(path) as archive:
        from lxml import etree

        root = etree.fromstring(archive.read("word/numbering.xml"))
    namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    abstract_ids = [node.get(f"{{{namespace['w']}}}abstractNumId") for node in root.xpath("./w:abstractNum", namespaces=namespace)]
    num_ids = [node.get(f"{{{namespace['w']}}}numId") for node in root.xpath("./w:num", namespaces=namespace)]
    return abstract_ids, num_ids


def section_signature(doc: Document) -> list[tuple]:
    result = []
    for section in doc.sections:
        result.append(
            (
                section.page_width,
                section.page_height,
                section.left_margin,
                section.right_margin,
                section.top_margin,
                section.bottom_margin,
                section.header_distance,
                section.footer_distance,
                section.orientation,
                section.start_type,
                section.different_first_page_header_footer,
                section.header.is_linked_to_previous,
                section.footer.is_linked_to_previous,
                section.first_page_header.is_linked_to_previous,
                section.first_page_footer.is_linked_to_previous,
                section.even_page_header.is_linked_to_previous,
                section.even_page_footer.is_linked_to_previous,
            )
        )
    return result


def table_header(table) -> str:
    return table.cell(0, 0).text.strip()


def border_signature(table) -> tuple:
    borders = table._tbl.tblPr.find(qn("w:tblBorders"))
    if borders is None:
        return ()
    return tuple(
        (
            edge,
            borders.find(qn(f"w:{edge}")).get(qn("w:val")) if borders.find(qn(f"w:{edge}")) is not None else None,
            borders.find(qn(f"w:{edge}")).get(qn("w:sz")) if borders.find(qn(f"w:{edge}")) is not None else None,
            borders.find(qn(f"w:{edge}")).get(qn("w:color")) if borders.find(qn(f"w:{edge}")) is not None else None,
        )
        for edge in ("top", "left", "bottom", "right", "insideH", "insideV")
    )


def cell_fill(cell) -> str | None:
    shading = cell._tc.get_or_add_tcPr().find(qn("w:shd"))
    return shading.get(qn("w:fill")) if shading is not None else None


def paragraph_signature(paragraph) -> tuple:
    return (
        paragraph.style.style_id,
        paragraph.alignment,
        paragraph.paragraph_format.line_spacing,
        paragraph.paragraph_format.space_before,
        paragraph.paragraph_format.space_after,
    )


def add_wrap_opportunities(text: str) -> str:
    """Mirror the generator's permitted slash and long CamelCase breaks."""
    value = str(text).replace(ZERO_WIDTH_SPACE, "")
    value = re.sub(r"/(?=\S)", f"/{ZERO_WIDTH_SPACE}", value)

    def polish_token(match: re.Match[str]) -> str:
        token = match.group(0)
        if len(token) < 12:
            return token
        return re.sub(
            r"(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])",
            ZERO_WIDTH_SPACE,
            token,
        )

    return re.sub(r"[A-Za-z][A-Za-z0-9]*", polish_token, value)


def table_grid_widths(table) -> list[int]:
    return [int(column.get(qn("w:w"))) for column in table._tbl.tblGrid.gridCol_lst]


def check_wrap_polish(language: str, table, header: str, errors: list[str]) -> None:
    widths = table_grid_widths(table)
    capability_header = ADDED_TABLES[language][1][0]
    entity_header = ADDED_TABLES[language][2][0]
    minimums = None
    if header == capability_header:
        minimums = [1.05, 1.45]
    elif header == entity_header:
        minimums = [1.60]
    if minimums is not None:
        for index, minimum_inches in enumerate(minimums):
            if index >= len(widths) or widths[index] < int(minimum_inches * 1440):
                actual = widths[index] / 1440 if index < len(widths) else 0
                fail(
                    f"{language}: table {header!r} column {index + 1} is {actual:.2f} in; "
                    f"minimum for readable wrapping is {minimum_inches:.2f} in",
                    errors,
                )
    for row_index, row in enumerate(table.rows, 1):
        for column_index, cell in enumerate(row.cells, 1):
            for paragraph in cell.paragraphs:
                actual = paragraph.text
                expected = add_wrap_opportunities(actual)
                if actual != expected:
                    fail(
                        f"{language}: table {header!r} row {row_index} column {column_index} "
                        "is missing a permitted slash/CamelCase wrap opportunity",
                        errors,
                    )


def check_table_format(language: str, table, prototype, header: str, doc: Document, errors: list[str]) -> None:
    if table.style.style_id != prototype.style.style_id:
        fail(f"{language}: table {header!r} style is {table.style.style_id}, expected {prototype.style.style_id}", errors)
    if border_signature(table) != border_signature(prototype):
        fail(f"{language}: table {header!r} border signature differs from the core Reports table", errors)
    normal_style = doc.styles["Normal"]
    if normal_style.font.name != "Arial" or normal_style.font.size is None or normal_style.font.size.pt != 10:
        fail(f"{language}: Normal style is not the expected inherited Arial 10 pt", errors)
    for column_index, cell in enumerate(table.rows[0].cells):
        prototype_cell = prototype.rows[0].cells[min(column_index, len(prototype.columns) - 1)]
        if cell_fill(cell) != cell_fill(prototype_cell):
            fail(f"{language}: table {header!r} header column {column_index + 1} fill differs from the core Reports table", errors)
        if paragraph_signature(cell.paragraphs[0]) != paragraph_signature(prototype_cell.paragraphs[0]):
            fail(f"{language}: table {header!r} header column {column_index + 1} paragraph format differs from the core Reports table", errors)
    for row_index, row in enumerate(table.rows[1:], 2):
        for column_index, cell in enumerate(row.cells):
            prototype_column = 0 if column_index == 0 else min(column_index, len(prototype.columns) - 1)
            prototype_cell = prototype.rows[1].cells[prototype_column]
            if paragraph_signature(cell.paragraphs[0]) != paragraph_signature(prototype_cell.paragraphs[0]):
                fail(f"{language}: table {header!r} row {row_index} column {column_index + 1} paragraph format differs from the core Reports table", errors)
            for run in cell.paragraphs[0].runs:
                if run.font.name is not None or run.font.size is not None:
                    fail(f"{language}: table {header!r} row {row_index} column {column_index + 1} overrides inherited Arial 10 pt", errors)


def check_output(language: str, path: Path, template: Document, errors: list[str]) -> list[tuple[int, int]]:
    if not path.exists() or path.stat().st_size == 0:
        fail(f"{language}: missing output {path}", errors)
        return []
    doc = Document(path)
    if len(doc.sections) != 3:
        fail(f"{language}: expected 3 sections, found {len(doc.sections)}", errors)
    if section_signature(doc) != section_signature(template):
        fail(f"{language}: page setup or header/footer linkage differs from the official template", errors)
    if style_signature(doc) != style_signature(template):
        fail(f"{language}: style IDs, names or types differ from the official template", errors)
    if numbering_signature(path) != numbering_signature(TEMPLATE):
        fail(f"{language}: numbering IDs differ from the official template", errors)
    if len(doc.tables) != 18:
        fail(f"{language}: expected 18 tables (8 core + 10 approved), found {len(doc.tables)}", errors)

    core_tables = [doc.tables[index] for index in [0, 1, 2, 3, 4, 5, 14, 15]] if len(doc.tables) >= 16 else []
    if len(core_tables) == 8:
        core_shapes = [(len(table.rows), len(table.columns)) for table in core_tables]
        for index, ((expected_rows, expected_cols), actual) in enumerate(zip(CORE_SHAPES, core_shapes, strict=True), 1):
            if actual[1] != expected_cols or (expected_rows is not None and actual[0] != expected_rows):
                fail(f"{language}: core template table {index} has shape {actual}, expected ({expected_rows or 'content-sized'}, {expected_cols})", errors)
    else:
        fail(f"{language}: could not identify all 8 core template tables", errors)

    added = []
    reports_prototype = core_tables[-1] if core_tables else None
    for header, expected_rows, expected_cols in ADDED_TABLES[language]:
        matches = [table for table in doc.tables if table_header(table) == header]
        if len(matches) != 1:
            fail(f"{language}: expected one added table headed {header!r}, found {len(matches)}", errors)
            continue
        table = matches[0]
        shape = (len(table.rows), len(table.columns))
        added.append(shape)
        if shape != (expected_rows, expected_cols):
            fail(f"{language}: table {header!r} has shape {shape}, expected {(expected_rows, expected_cols)}", errors)
        first_row = table.rows[0]._tr
        if first_row.find(".//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tblHeader") is None:
            fail(f"{language}: table {header!r} does not repeat its header row", errors)
        for row_index, row in enumerate(table.rows[1:], 2):
            if row._tr.find(".//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}cantSplit") is None:
                fail(f"{language}: table {header!r} row {row_index} may split across pages", errors)
        if reports_prototype is not None:
            check_table_format(language, table, reports_prototype, header, doc, errors)
        check_wrap_polish(language, table, header, errors)

    for title, expected_style in TABLE_TITLES[language]:
        matches = [paragraph for paragraph in doc.paragraphs if paragraph.text.strip() == title]
        if len(matches) != 1:
            fail(f"{language}: expected one table title {title!r}, found {len(matches)}", errors)
        elif matches[0].style.name != expected_style:
            fail(f"{language}: table title {title!r} uses {matches[0].style.name}, expected {expected_style}", errors)

    headings = [paragraph.text.strip() for paragraph in doc.paragraphs if paragraph.style.name == "Heading 1" and paragraph.text.strip()]
    if headings != HEADING_1[language]:
        fail(f"{language}: Heading 1 hierarchy is {headings}, expected {HEADING_1[language]}", errors)

    all_text = "\n".join(paragraph.text for paragraph in doc.paragraphs)
    all_text += "\n" + "\n".join(cell.text for table in doc.tables for row in table.rows for cell in row.cells)
    for value in FORBIDDEN:
        if value in all_text:
            fail(f"{language}: sample/placeholder text remains: {value!r}", errors)
    if "v0.4" not in all_text:
        fail(f"{language}: internal version v0.4 not found", errors)
    if "v0.3.docx" in path.name or "v0.4" not in path.name:
        fail(f"{language}: filename/version mismatch: {path.name}", errors)

    normalized = all_text.replace("‑", "-").replace("–", "-")
    found_bp = sorted({int(value) for value in re.findall(r"BP-(\d{2})", normalized) if 1 <= int(value) <= 13})
    if found_bp != list(range(1, 14)):
        fail(f"{language}: BP coverage is {found_bp}, expected BP-01 through BP-13", errors)
    return added


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    errors: list[str] = []
    if not TEMPLATE.exists():
        print(f"FAIL: missing template {TEMPLATE}")
        return 1
    template = Document(TEMPLATE)
    if len(template.sections) != 3 or len(template.tables) != 8:
        print(f"FAIL: official template contract changed: sections={len(template.sections)}, tables={len(template.tables)}")
        return 1
    parity = {language: check_output(language, path, template, errors) for language, path in OUTPUTS.items()}
    if parity["en"] != parity["vi"]:
        fail(f"EN/VI added-table shape parity failed: EN={parity['en']}, VI={parity['vi']}", errors)
    if errors:
        print(f"FAIL: Blueprint validation found {len(errors)} issue(s)")
        for error in errors:
            print(f"- {error}")
        return 1
    print("PASS: Blueprint v0.4 validation")
    print("- official template: 3 sections, 8 preserved core tables")
    print("- outputs: 18 tables each (8 core + 10 approved content tables)")
    print("- style and numbering definitions: semantic template parity")
    print("- added-table EN/VI shape parity: PASS")
    print("- added-table format signature and Heading 2/3 hierarchy: PASS")
    print("- column-width and permitted slash/CamelCase wrap polish: PASS")
    print("- BP-01 through BP-13: PASS")
    print("- heading hierarchy, version and placeholder checks: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
