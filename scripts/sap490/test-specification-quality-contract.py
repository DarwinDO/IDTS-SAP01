"""Red/green quality contract for the mentor-facing SAP490 specifications.

This test intentionally checks content truth in addition to Office file
validity.  It prevents a schema-valid workbook from being accepted when its
runtime trace, test status, version history, or Vietnamese content is stale.
"""

from __future__ import annotations

from pathlib import Path
import re
import sys

from docx import Document
from openpyxl import load_workbook
from specification_catalog import FUNCTIONS, MESSAGES, TECH_REQUIREMENTS


ROOT = Path(__file__).resolve().parents[2]
GENERATED = ROOT / "docs" / "sap490" / "generated"

FILES = {
    "functional_en": GENERATED / "Functional_Specification_IDTS_SAP01_en_v0.7.xlsx",
    "functional_vi": GENERATED / "Functional_Specification_IDTS_SAP01_vi_v0.7.xlsx",
    "technical_en": GENERATED / "Technical_Specification_IDTS_SAP01_en_v0.6.xlsx",
    "technical_vi": GENERATED / "Technical_Specification_IDTS_SAP01_vi_v0.6.xlsx",
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


def workbook_text(path: Path) -> str:
    workbook = load_workbook(path, data_only=False)
    return "\n".join(
        str(cell.value)
        for sheet in workbook.worksheets
        for row in sheet.iter_rows()
        for cell in row
        if cell.value not in (None, "")
    )


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
