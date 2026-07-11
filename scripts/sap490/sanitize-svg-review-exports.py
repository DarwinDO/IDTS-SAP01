"""Remove Draw.io's embedded model and Base64 text fallbacks from review SVGs.

The editable source of truth is the matching ``.drawio`` file.  The SVG is a
review export only.  Removing embedded data makes the export smaller and
prevents binary fallback data from being mistaken for a credential by the
repository secret scanner.
"""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SVG_DIR = ROOT / "docs" / "diagrams" / "review" / "svg"


def sanitize(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = re.sub(r'\scontent="[^"]*"', "", text, count=1)
    text = re.sub(r'<image\b[^>]*xlink:href="data:image/png;base64,[^"]*"[^>]*/>', "", text)
    path.write_text(text, encoding="utf-8")


def main() -> None:
    files = sorted(SVG_DIR.glob("*.svg"))
    if not files:
        raise RuntimeError(f"No SVG files found under {SVG_DIR}")
    for path in files:
        sanitize(path)
    print(f"Sanitized {len(files)} Draw.io SVG review exports.")


if __name__ == "__main__":
    main()
