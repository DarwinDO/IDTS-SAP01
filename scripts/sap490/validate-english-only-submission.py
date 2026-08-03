"""Fail when current SAP490 submission outputs violate the EN-only policy."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
GENERATED = ROOT / "docs" / "sap490" / "generated"
SUBMISSION_EXTENSIONS = {".docx", ".xlsx", ".pptx", ".pdf"}
VI_PATTERN = re.compile(r"(?:^|[_-])vi(?:[_-]|$)", re.IGNORECASE)


def main() -> int:
    violations = sorted(
        path.relative_to(ROOT).as_posix()
        for path in GENERATED.rglob("*")
        if path.is_file()
        and path.suffix.lower() in SUBMISSION_EXTENSIONS
        and VI_PATTERN.search(path.stem)
    )
    if violations:
        print("SAP490 EN-only submission validation: FAIL")
        for path in violations:
            print(f"- Vietnamese current artifact: {path}")
        return 1
    print("SAP490 EN-only submission validation: PASS")
    print("- no Vietnamese Office/PDF artifact exists in docs/sap490/generated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
