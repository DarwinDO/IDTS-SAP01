"""Red/green quality contract for the mentor-facing SAP490 specifications.

This test intentionally checks content truth in addition to Office file
validity.  It prevents a schema-valid workbook from being accepted when its
runtime trace, test status, version history, or Vietnamese content is stale.
"""

from __future__ import annotations

from pathlib import Path
from functools import lru_cache
import re
import sys

from docx import Document
from openpyxl import load_workbook
from specification_catalog import FUNCTIONS, LIFECYCLE_ACTIONS, MESSAGES, TECH_REQUIREMENTS


ROOT = Path(__file__).resolve().parents[2]
GENERATED = ROOT / "docs" / "sap490" / "generated"
TECHNICAL_TEMPLATE = ROOT / "docs" / "sap490" / "templates" / "Deliverable_template" / "Technical_Specification.xlsx"

FILES = {
    "functional_en": GENERATED / "Functional_Specification_IDTS_SAP01_en_v0.7.xlsx",
    "functional_vi": GENERATED / "Functional_Specification_IDTS_SAP01_vi_v0.7.xlsx",
    "technical_en": GENERATED / "Technical_Specification_IDTS_SAP01_en_v0.7.xlsx",
    "technical_vi": GENERATED / "Technical_Specification_IDTS_SAP01_vi_v0.7.xlsx",
    "config_en": GENERATED / "Configuration_Note_IDTS_SAP01_en_v0.5.xlsx",
    "config_vi": GENERATED / "Configuration_Note_IDTS_SAP01_vi_v0.5.xlsx",
    "blueprint_en": GENERATED / "Blueprint_IDTS_SAP01_en_v0.6.docx",
    "blueprint_vi": GENERATED / "Blueprint_IDTS_SAP01_vi_v0.6.docx",
}

FORBIDDEN_TRACES = {
    "srv/auth-service.js",
    "srv/bug-service/read-models.js",
    "LoginPage.js",
    "ProfileMenu.js",
    "Dashboard.view.xml",
    "Dashboard.controller.js",
    "*Review.js",
}

REQUIRED_TRACES = {
    "srv/auth.js",
    "srv/bug-service/monitoring.js",
    "login-page.js",
    "LoginController.js",
    "ProfileShell.js",
    "dashboard.html",
    "dashboard-page.js",
    "ClassificationReview.js",
    "DuplicateReview.js",
    "HandoffSummaryReview.js",
    "SmartAssignDeveloper.js",
    "BugCollaboration.js",
}

REQUIRED_TEST_TRUTH = {
    "21 PASSED",
    "6 UAT PREPARED",
    "40/40 PASS",
    "25/25 PASS",
    "DISABLED / NOT ACCEPTED",
}


@lru_cache(maxsize=None)
def workbook_text(path: Path) -> str:
    workbook = load_workbook(path, data_only=False)
    return "\n".join(
        str(cell.value)
        for sheet in workbook.worksheets
        for row in sheet.iter_rows()
        for cell in row
        if cell.value not in (None, "")
    )


@lru_cache(maxsize=None)
def document_text(path: Path) -> str:
    document = Document(path)
    values = [paragraph.text for paragraph in document.paragraphs]
    values.extend(
        cell.text
        for table in document.tables
        for row in table.rows
        for cell in row.cells
    )
    return "\n".join(values)


def visible_cells(path: Path) -> list:
    workbook = load_workbook(path, data_only=False)
    return [
        cell
        for sheet in workbook.worksheets
        if sheet.sheet_state == "visible"
        for row in sheet.iter_rows()
        for cell in row
        if cell.value not in (None, "")
    ]


def validate_technical_template_contract(path: Path, language: str) -> list[str]:
    """Protect the official inner layouts, not only tab names and outer styling."""
    failures = []
    template = load_workbook(TECHNICAL_TEMPLATE, data_only=False)
    workbook = load_workbook(path, data_only=False)
    expected_sheets = template.sheetnames
    if workbook.sheetnames != expected_sheets:
        failures.append(f"{path.name}: sheet order differs from official template")
    for name in expected_sheets:
        if workbook[name].sheet_state != template[name].sheet_state:
            failures.append(f"{path.name}/{name}: visibility differs from official template")

    layout = workbook["Screen Layout"]
    template_layout = template["Screen Layout"]
    required_layout_merges = {"B5:BG5", "B6:BG6", "B7:BG7", "C8:BG8"}
    if not required_layout_merges.issubset({str(item) for item in layout.merged_cells.ranges}):
        failures.append(f"{path.name}: Screen Layout official merged blocks were not preserved")
    if len(layout._images) < 2:
        failures.append(f"{path.name}: Screen Layout must contain two implemented-screen images")
    layout_text = "\n".join(str(cell.value) for row in layout.iter_rows() for cell in row if cell.value)
    for forbidden in ("Route / entry", "Controller / extension", "OData binding"):
        if forbidden in layout_text:
            failures.append(f"{path.name}: Screen Layout still contains custom source-map table header {forbidden!r}")

    definition = workbook["Screen Definition"]
    if str(definition["B9"].value or "").startswith("Screen ID"):
        failures.append(f"{path.name}: Screen Definition custom table replaced the official field grid")
    for coordinate in ("B10", "C11", "I11", "M11", "O11", "R11", "AW10"):
        if definition[coordinate].value in (None, ""):
            failures.append(f"{path.name}: Screen Definition official header {coordinate} is empty")

    messages = workbook["Message Definition"]
    expected_message_merges = {"B5:G5", "H5:L5", "M5:AP5", "AQ5:BG5"}
    if not expected_message_merges.issubset({str(item) for item in messages.merged_cells.ranges}):
        failures.append(f"{path.name}: Message Definition no longer uses the official four-column grid")
    message_text = "\n".join(
        str(cell.value) for row in messages.iter_rows()
        for cell in row if cell.value not in (None, "")
    )
    if any(value in message_text for value in ("Exact source", "Sanitized logging", "Frontend handling / evidence")):
        failures.append(f"{path.name}: technical trace leaked back into the four-column Message Definition")

    implementation_text = "\n".join(
        str(cell.value) for row in workbook["Technical Implementation"].iter_rows()
        for cell in row if cell.value not in (None, "")
    )
    required_flows = {
        "FLOW-COMMENT-CREATE", "FLOW-ATTACH-QUEUE", "FLOW-ATTACH-UPLOAD",
        "FLOW-ATTACH-DOWNLOAD", "FLOW-ATTACH-DELETE",
    }
    required_flows.update(f"FLOW-{action.upper()}" for action, *_ in LIFECYCLE_ACTIONS)
    for flow in sorted(required_flows):
        if flow not in implementation_text:
            failures.append(f"{path.name}: missing exact implementation flow {flow}")
    for forbidden in ("Add comment or attachment", "POST/PUT/DELETE /odata/v4/bug child entity", "qa:"):
        if forbidden in implementation_text:
            failures.append(f"{path.name}: generic or command-only implementation evidence remains: {forbidden}")
    full_text = workbook_text(path)
    for forbidden in ("WS92400001", "Credit Memo Request", "NamNH", "HuyNB", "ThaoML9"):
        if forbidden in full_text:
            failures.append(f"{path.name}: official-template sample residue remains: {forbidden}")

    if language == "vi":
        for forbidden in ("Route / entry", "Page / view", "Role-scoped", "Signed-in user", "Bug participants", "Anonymous"):
            if forbidden in workbook_text(path):
                failures.append(f"{path.name}: visible English reader-facing label remains: {forbidden}")
    return failures


def validate_catalog_sources() -> list[str]:
    failures = []
    references = [item["source"] for item in FUNCTIONS]
    references.extend(item["source"] for item in MESSAGES)
    references.extend(item[5] for item in TECH_REQUIREMENTS)
    for reference in references:
        for segment in re.split(r"\s*[;→]\s*", reference):
            if not segment.startswith(("app/", "srv/", "db/")):
                continue
            path_text, _, symbol = segment.partition("::")
            path = ROOT / path_text.rstrip("/.,")
            if not path.exists():
                failures.append(f"catalog source path does not exist: {path_text}")
                continue
            if symbol and path.is_file() and symbol not in path.read_text(encoding="utf-8"):
                failures.append(f"catalog source symbol does not exist: {reference}")
    return failures


def main() -> int:
    failures: list[str] = validate_catalog_sources()
    for label, path in FILES.items():
        if not path.exists():
            failures.append(f"{label}: missing expected versioned artifact {path.name}")

    if failures:
        print("\n".join(f"FAIL: {item}" for item in failures))
        return 1

    failures.extend(validate_technical_template_contract(FILES["technical_en"], "en"))
    failures.extend(validate_technical_template_contract(FILES["technical_vi"], "vi"))

    functional_text = workbook_text(FILES["functional_en"]) + "\n" + workbook_text(FILES["functional_vi"])
    technical_text = workbook_text(FILES["technical_en"]) + "\n" + workbook_text(FILES["technical_vi"])
    config_text = workbook_text(FILES["config_en"]) + "\n" + workbook_text(FILES["config_vi"])
    blueprint_text = document_text(FILES["blueprint_en"]) + "\n" + document_text(FILES["blueprint_vi"])
    all_text = "\n".join((functional_text, technical_text, config_text, blueprint_text))

    for trace in sorted(FORBIDDEN_TRACES):
        if trace in all_text:
            failures.append(f"forbidden stale runtime trace remains: {trace}")
    for trace in sorted(REQUIRED_TRACES):
        if trace not in all_text:
            failures.append(f"missing exact runtime trace: {trace}")
    for truth in sorted(REQUIRED_TEST_TRUTH):
        if truth not in blueprint_text:
            failures.append(f"Blueprint missing current test truth: {truth}")

    for requirement in ("SRS-FR-ASG", "SRS-FR-MON"):
        if requirement not in technical_text:
            failures.append(f"Technical Specification missing requirement group {requirement}")

    if "token returned once" not in all_text.casefold() and "raw token is returned once" not in all_text.casefold():
        failures.append("AuthSessions wording does not explain one-time raw token return")
    if "tokenHash" not in all_text:
        failures.append("AuthSessions wording does not name tokenHash")
    if "pendingCreateAttachmentsByBugId" not in functional_text + technical_text:
        failures.append("Attachment create flow does not trace pending client-memory storage")

    generic_409_patterns = (
        "Stale/repeated transition",
        "The bug state changed. Reload and try again. [HTTP 409]",
        "Trạng thái Bug đã thay đổi. Hãy tải lại và thử lại. [HTTP 409]",
    )
    if any(pattern in all_text for pattern in generic_409_patterns):
        failures.append("HTTP 409 is still described as a generic lifecycle response")

    for path in (FILES["technical_en"], FILES["technical_vi"]):
        workbook = load_workbook(path, data_only=False)
        implementation = workbook["Technical Implementation"]
        bad_fonts = [
            cell.coordinate
            for row in implementation.iter_rows()
            for cell in row
            if cell.value not in (None, "")
            and (cell.font.name or "").casefold() == "calibri"
        ]
        if bad_fonts:
            failures.append(f"{path.name}: non-template Technical Implementation font at {bad_fonts[:8]}")

    for path in (FILES["config_vi"],):
        text = workbook_text(path)
        repeated = text.count("No secrets in this workbook")
        if repeated:
            failures.append(f"{path.name}: repeated English no-secret note remains ({repeated})")
        english_sentences = re.findall(
            r"\b(?:Initial|Shared QA configuration|Security and AI controls|Configured|Required per schema change)\b",
            text,
        )
        if english_sentences:
            failures.append(f"{path.name}: visible English residue remains: {sorted(set(english_sentences))}")

    for path in FILES.values():
        text = workbook_text(path) if path.suffix == ".xlsx" else document_text(path)
        if "###" in text:
            failures.append(f"{path.name}: contains Excel overflow marker ###")
        if "Created bDonHV" in text or "IDTSIDTS-TECH" in text:
            failures.append(f"{path.name}: contains concatenated metadata")

    for path in (FILES["functional_en"], FILES["functional_vi"]):
        workbook = load_workbook(path, data_only=False)
        definition = workbook["Screen Definition"]
        populated = sum(
            1
            for row in definition.iter_rows(min_row=12)
            if any(cell.value not in (None, "") for cell in row)
        )
        if populated < 18:
            failures.append(f"{path.name}: Screen Definition has only {populated} populated rows; expected >=18")

    formal_paths = (
        FILES["functional_en"], FILES["functional_vi"],
        FILES["technical_en"], FILES["technical_vi"],
    )
    for path in formal_paths:
        workbook = load_workbook(path, data_only=False)
        for sheet in workbook.worksheets:
            for row in sheet.iter_rows():
                for cell in row:
                    value = str(cell.value or "")
                    if " | " in value:
                        failures.append(f"{path.name}/{sheet.title}!{cell.coordinate}: raw pipe-delimited record")
                    is_function_data = sheet.title != "Function Overview" or cell.row >= 15
                    is_requirement_data = sheet.title != "Function Overview" or cell.row >= 15
                    if is_function_data and len(re.findall(r"\bFN-[A-Z]+-\d+\b", value)) > 1:
                        failures.append(f"{path.name}/{sheet.title}!{cell.coordinate}: multiple Function IDs in one cell")
                    if is_requirement_data and len(re.findall(r"\bSRS-FR-[A-Z]+\b", value)) > 1:
                        failures.append(f"{path.name}/{sheet.title}!{cell.coordinate}: multiple Requirement IDs in one cell")

    for path in (FILES["technical_en"], FILES["technical_vi"]):
        workbook = load_workbook(path, data_only=False)
        layout_text = "\n".join(
            str(cell.value) for row in workbook["Screen Layout"].iter_rows()
            for cell in row if cell.value not in (None, "")
        )
        if "→" in layout_text or "Route/Page/Extension map" in layout_text:
            failures.append(f"{path.name}: Screen Layout still contains prose trace instead of screen records")
        if "IDTS-TECH-" in workbook_text(path):
            failures.append(f"{path.name}: independent technical message catalog remains")

    message_id_sets = {}
    for label in ("functional_en", "functional_vi", "technical_en", "technical_vi"):
        workbook = load_workbook(FILES[label], data_only=False)
        message_id_sets[label] = {
            str(cell.value) for row in workbook["Message Definition"].iter_rows()
            for cell in row if isinstance(cell.value, str) and cell.value.startswith("IDTS-MSG-")
        }
    expected_messages = message_id_sets["functional_en"]
    for label, ids in message_id_sets.items():
        if ids != expected_messages:
            failures.append(f"{label}: Message ID parity mismatch: {sorted(ids ^ expected_messages)}")

    for path in (FILES["technical_vi"],):
        text = workbook_text(path)
        forbidden_vi_prose = (
            "Route/Page/Extension map", "Safe auth entry", "Read-only role-aware KPIs",
            "Business Process", "Data Dictionary Objects", "Technical meaning",
        )
        for phrase in forbidden_vi_prose:
            if phrase in text:
                failures.append(f"{path.name}: visible English prose remains: {phrase}")

    if failures:
        print("\n".join(f"FAIL: {item}" for item in failures))
        return 1
    print("PASS: SAP490 specification quality contract")
    return 0


if __name__ == "__main__":
    sys.exit(main())
