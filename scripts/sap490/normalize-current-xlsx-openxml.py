"""Normalize current XLSX metadata without style reserialization.

Run this after the LibreOffice round-trip. Using openpyxl for this final cleanup
would reserialize the inherited font records and reintroduce OfficeCLI schema
ordering errors, so this helper changes only the required raw XML parts.
"""

from __future__ import annotations

import argparse
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree


MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
ElementTree.register_namespace("", MAIN_NS)


def normalize_xlsx(path: Path) -> tuple[int, int]:
    temporary_path = None
    with zipfile.ZipFile(path, "r") as source:
        workbook_xml = source.read("xl/workbook.xml")
        root = ElementTree.fromstring(workbook_xml)
        container = root.find(f"{{{MAIN_NS}}}definedNames")
        removed = 0
        if container is not None:
            for item in list(container):
                if "#REF!" in (item.text or "").upper():
                    container.remove(item)
                    removed += 1
            if not list(container):
                root.remove(container)
        replacement = ElementTree.tostring(
            root, encoding="utf-8", xml_declaration=True
        )
        replacements = {"xl/workbook.xml": replacement}
        removed_scales = 0
        for entry in source.infolist():
            if not entry.filename.startswith("xl/worksheets/sheet"):
                continue
            sheet_root = ElementTree.fromstring(source.read(entry.filename))
            page_setup = sheet_root.find(f"{{{MAIN_NS}}}pageSetup")
            if (
                page_setup is not None
                and page_setup.get("fitToWidth") is not None
                and page_setup.get("scale") is not None
            ):
                del page_setup.attrib["scale"]
                removed_scales += 1
                replacements[entry.filename] = ElementTree.tostring(
                    sheet_root, encoding="utf-8", xml_declaration=True
                )

        with tempfile.NamedTemporaryFile(
            prefix=f"{path.stem}-",
            suffix=".xlsx",
            dir=path.parent,
            delete=False,
        ) as temporary:
            temporary_path = Path(temporary.name)

        with zipfile.ZipFile(
            temporary_path, "w", compression=zipfile.ZIP_DEFLATED
        ) as target:
            for entry in source.infolist():
                payload = replacements.get(entry.filename, source.read(entry.filename))
                target.writestr(entry, payload)
    try:
        temporary_path.replace(path)
    finally:
        if temporary_path and temporary_path.exists():
            temporary_path.unlink()
    return removed, removed_scales


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="+", type=Path)
    args = parser.parse_args()
    for file_path in args.files:
        resolved = file_path.resolve()
        removed_names, removed_scales = normalize_xlsx(resolved)
        print(
            f"{resolved}: removed {removed_names} broken defined name(s); "
            f"removed {removed_scales} conflicting print scale(s)"
        )


if __name__ == "__main__":
    main()
