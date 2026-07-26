"""Generate the SAP490 generated-artifact archive manifest from the Git tag.

The manifest is reproducible even after historical binaries are removed from
the current tree because every archived byte is read from the immutable tag.
"""

from __future__ import annotations

import hashlib
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TAG = "sap490-generated-archive-20260726"
GENERATED_PREFIX = "docs/sap490/generated/"
OUTPUT = ROOT / "docs/sap490/generated-archive-manifest-20260726.md"

CURRENT = {
    "Blueprint_IDTS_SAP01_en_v0.6.docx",
    "Blueprint_IDTS_SAP01_vi_v0.6.docx",
    "Functional_Specification_IDTS_SAP01_en_v0.7.xlsx",
    "Functional_Specification_IDTS_SAP01_vi_v0.7.xlsx",
    "Technical_Specification_IDTS_SAP01_en_v0.6.xlsx",
    "Technical_Specification_IDTS_SAP01_vi_v0.6.xlsx",
    "Configuration_Note_IDTS_SAP01_en_v0.5.xlsx",
    "Configuration_Note_IDTS_SAP01_vi_v0.5.xlsx",
    "Test_Scenario_IDTS_SAP01_en_v0.3.xlsx",
    "Test_Scenario_IDTS_SAP01_vi_v0.3.xlsx",
    "Unit_Test_IDTS_SAP01_en_v0.4.xlsx",
    "Unit_Test_IDTS_SAP01_vi_v0.4.xlsx",
    "Functional_Test_IDTS_SAP01_en_v0.3.xlsx",
    "Functional_Test_IDTS_SAP01_vi_v0.3.xlsx",
    "Test_Report_IDTS_SAP01_en_v0.4.xlsx",
    "Test_Report_IDTS_SAP01_vi_v0.4.xlsx",
    "UAT_IDTS_SAP01_en_prepared_v0.2.xlsx",
    "UAT_IDTS_SAP01_vi_prepared_v0.2.xlsx",
    "Test_And_Fix_Bug_IDTS_SAP01_en_v0.5.xlsx",
    "Test_And_Fix_Bug_IDTS_SAP01_vi_v0.5.xlsx",
    "TR_Management_IDTS_SAP01_en_v0.3.xlsx",
    "TR_Management_IDTS_SAP01_vi_v0.3.xlsx",
    "Integration_Evidence_Index_IDTS_SAP01_v0.1.xlsx",
    "SAP490_Review_Matrices_IDTS_SAP01_20260724.xlsx",
    "Team_Contribution_Matrix_IDTS_SAP01_20260724.xlsx",
    "Final_Project_Report_IDTS_SAP01_mentor_review_draft_v0.1.docx",
}


def git(*args: str, binary: bool = False):
    result = subprocess.run(
        ["git", *args], cwd=ROOT, check=True, capture_output=True,
        text=not binary,
    )
    return result.stdout


def replacement_for(name: str) -> str:
    if name == "Test_And_Fix_Bug_IDTS_Demo_20260603-163617.xlsx":
        return "Test_And_Fix_Bug_IDTS_SAP01_en_v0.5.xlsx / vi_v0.5"
    for current in sorted(CURRENT):
        normalized_old = re.sub(r"(?:v0\.\d+|20260722)", "VERSION", name)
        normalized_current = re.sub(r"(?:v0\.\d+|20260724)", "VERSION", current)
        if normalized_old == normalized_current:
            return current
    return "Không có bản thay thế trực tiếp; giữ để truy xuất lịch sử qua tag"


def version_of(name: str) -> str:
    match = re.search(r"v0\.\d+|2026\d{4}", name)
    return match.group(0) if match else "n/a"


def main() -> None:
    baseline = git("rev-list", "-n", "1", TAG).strip()
    rows = []
    listing = git("ls-tree", "-r", "--long", TAG, "docs/sap490/generated").splitlines()
    for line in listing:
        metadata, path = line.split("\t", 1)
        mode, object_type, blob, size = metadata.split()
        if object_type != "blob" or not path.lower().endswith((".xlsx", ".docx")):
            continue
        name = Path(path).name
        if name in CURRENT:
            continue
        payload = git("show", f"{TAG}:{path}", binary=True)
        rows.append((path, version_of(name), int(size), hashlib.sha256(payload).hexdigest(), blob, replacement_for(name)))

    missing_current = sorted(name for name in CURRENT if not (ROOT / GENERATED_PREFIX / name).exists())
    if missing_current:
        raise SystemExit("Missing current artifacts: " + ", ".join(missing_current))

    lines = [
        "# SAP490 Generated Artifact Archive Manifest — 2026-07-26",
        "",
        "## Chính sách",
        "",
        f"- Baseline trước cleanup: `{baseline}`.",
        f"- Annotated tag: `{TAG}`.",
        "- Các binary lịch sử bị loại khỏi current tree nhưng vẫn truy xuất nguyên byte qua Git tag/history.",
        "- IDTS-104 không xóa, đổi tên hoặc cập nhật file trên Google Drive.",
        "- Không rewrite Git history; vì vậy cleanup làm cây hiện hành dễ đọc hơn nhưng không làm nhỏ `.git` đã clone.",
        "",
        "## Artifact hiện hành được giữ trong current tree",
        "",
    ]
    lines.extend(f"- `{GENERATED_PREFIX}{name}`" for name in sorted(CURRENT))
    lines.extend([
        "",
        "## Artifact lịch sử được lưu qua tag",
        "",
        "| Đường dẫn cũ | Version | Bytes | SHA-256 | Git blob | Artifact hiện hành thay thế | Drive |",
        "| --- | --- | ---: | --- | --- | --- | --- |",
    ])
    for path, version, size, digest, blob, replacement in rows:
        lines.append(
            f"| `{path}` | `{version}` | {size} | `{digest}` | `{blob}` | `{replacement}` | Không thay đổi trong IDTS-104 |"
        )
    lines.extend([
        "",
        "## Cách truy xuất",
        "",
        "```powershell",
        f"git archive --format=zip --output=.tmp/sap490-archive.zip {TAG} docs/sap490/generated/<file-name>",
        "Expand-Archive -LiteralPath .tmp/sap490-archive.zip -DestinationPath .tmp/sap490-archive",
        "```",
        "",
        "> `git archive` giữ nguyên byte của DOCX/XLSX. Không dùng redirect text (`git show ... > file`) cho binary trên Windows.",
        "",
        f"Tổng số artifact lịch sử: **{len(rows)}**.",
    ])
    OUTPUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"WROTE {OUTPUT.relative_to(ROOT)} ({len(rows)} archived artifacts)")


if __name__ == "__main__":
    main()
