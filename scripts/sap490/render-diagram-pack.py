"""Extract the canonical IDTS Mermaid/PlantUML diagrams into stable review assets."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DIAGRAM_DIR = ROOT / "docs" / "diagrams"
OUTPUT_DIR = DIAGRAM_DIR / "rendered"
SOURCE_DIR = OUTPUT_DIR / "source"

SPECS = [
    ("01-system-context-and-architecture.md", ["01-system-context", "02-cap-fiori-architecture"]),
    ("02-use-cases.md", ["03-use-case"]),
    ("03-business-process-flows.md", ["04-end-to-end-defect-flow", "05-duplicate-checking", "06-assignment-decision", "07-developer-review"]),
    ("04-status-lifecycle.md", ["08-status-lifecycle"]),
    ("05-conceptual-data-model.md", ["09-conceptual-data-model"]),
    ("06-notification-audit-monitoring.md", ["10-submit-notification", "11-developer-review-notification", "12-pm-monitoring"]),
    ("07-srs-system-context.md", ["13-srs-system-context"]),
    ("08-frs-functional-workflows.md", ["14-frs-main-defect-flow", "15-frs-rejected-follow-up", "16-frs-status-lifecycle", "17-frs-create-assignment", "18-frs-developer-review", "19-frs-request-more-information", "20-frs-resolve-retest-close-reopen", "21-frs-pm-monitoring"]),
]

FENCE = re.compile(r"^```(?P<format>mermaid|plantuml)\s*\n(?P<source>.*?)^```\s*$", re.MULTILINE | re.DOTALL)


def preceding_heading(markdown: str, offset: int) -> str:
    headings = re.findall(r"^#{1,6}\s+(.+?)\s*$", markdown[:offset], re.MULTILINE)
    return headings[-1] if headings else "Untitled diagram"


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    manifest: list[dict[str, str]] = []

    for file_name, asset_names in SPECS:
        source_path = DIAGRAM_DIR / file_name
        markdown = source_path.read_text(encoding="utf-8")
        fences = list(FENCE.finditer(markdown))
        if len(fences) != len(asset_names):
            raise RuntimeError(f"{file_name}: expected {len(asset_names)} diagrams, found {len(fences)}")

        for fence, asset_name in zip(fences, asset_names, strict=True):
            diagram_format = fence.group("format")
            diagram_source = fence.group("source").strip() + "\n"
            extension = "mmd" if diagram_format == "mermaid" else "puml"
            target = SOURCE_DIR / f"{asset_name}.{extension}"
            # Keep source bytes stable across Windows/Linux so manifest hashes are directly verifiable.
            target.write_text(diagram_source, encoding="utf-8", newline="\n")
            manifest.append(
                {
                    "id": asset_name.split("-", 1)[0],
                    "asset": asset_name,
                    "title": preceding_heading(markdown, fence.start()),
                    "format": diagram_format,
                    "sourceDocument": f"docs/diagrams/{file_name}",
                    "sourceAsset": f"docs/diagrams/rendered/source/{target.name}",
                    "svgAsset": f"docs/diagrams/rendered/{asset_name}.svg",
                    "sha256": hashlib.sha256(diagram_source.encode("utf-8")).hexdigest(),
                }
            )

    (OUTPUT_DIR / "manifest.json").write_text(
        json.dumps({"diagramCount": len(manifest), "diagrams": manifest}, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    print(f"Extracted {len(manifest)} diagrams to {OUTPUT_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
