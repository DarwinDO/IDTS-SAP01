"""Replace specification diagram code fences with rendered, traceable figures."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
FENCE = re.compile(r"^```mermaid\s*\n.*?^```\s*$", re.MULTILINE | re.DOTALL)


def figure(asset: str, title: str, source: str) -> str:
    return (
        f"![{title}](../../diagrams/rendered/{asset}.svg)\n\n"
        f"*Figure {asset.split('-', 1)[0]}. {title}. Canonical source: `{source}`.*"
    )


def replace_mermaid(path: Path, assets: list[tuple[str, str, str]]) -> None:
    text = path.read_text(encoding="utf-8")
    matches = list(FENCE.finditer(text))
    if len(matches) != len(assets):
        raise RuntimeError(f"{path}: expected {len(assets)} Mermaid blocks, found {len(matches)}")

    parts: list[str] = []
    cursor = 0
    for match, (asset, title, source) in zip(matches, assets, strict=True):
        parts.append(text[cursor : match.start()])
        parts.append(figure(asset, title, source))
        cursor = match.end()
    parts.append(text[cursor:])
    path.write_text("".join(parts), encoding="utf-8")


def update_header(text: str, old_version: str, new_version: str) -> str:
    return text.replace(f"Status: Draft {old_version}", f"Status: Draft {new_version}", 1).replace(
        "Last updated: 2026-07-10", "Last updated: 2026-07-11", 1
    )


def add_version_row(text: str, old_row: str, new_row: str) -> str:
    if old_row not in text:
        raise RuntimeError(f"Version row not found: {old_row}")
    return text.replace(old_row, old_row + "\n" + new_row, 1)


def main() -> None:
    brd_assets = [
        ("01-system-context", "System Context", "docs/diagrams/01-system-context-and-architecture.md"),
        ("03-use-case", "Use Case Diagram", "docs/diagrams/02-use-cases.md"),
        ("04-end-to-end-defect-flow", "End-to-End Defect Tracking Flow", "docs/diagrams/03-business-process-flows.md"),
    ]
    brd_en = ROOT / "docs/ba/brd/brd.en.md"
    brd_vi = ROOT / "docs/ba/brd/brd.vi.md"
    for path, anchor, heading, introduction in [
        (
            brd_en,
            "## 7. Roles and RACI",
            "## 6.1 Diagram Pack and Traceability",
            "The following review visuals summarize the approved business context, role coverage, and end-to-end defect flow. Detailed editable source remains under `docs/diagrams/`.",
        ),
        (
            brd_vi,
            "## 7. Roles và RACI",
            "## 6.1 Diagram Pack và Traceability",
            "Các hình review sau tóm tắt business context, role coverage và end-to-end defect flow đã được duyệt. Source có thể chỉnh sửa vẫn được giữ trong `docs/diagrams/`.",
        ),
    ]:
        text = path.read_text(encoding="utf-8")
        text = update_header(text, "v1.3", "v1.4")
        text = add_version_row(
            text,
            "| v1.3 | 2026-07-10 | IDTS Project Team | Mentor / Supervisor | Synced current implementation and review baseline: CAP/Fiori MVP workflow, audit/notification/attachment flows, PM monitoring, and optional human-review AI assistance. | Draft |"
            if path == brd_en
            else "| v1.3 | 2026-07-10 | IDTS Project Team | Mentor / Supervisor | Đồng bộ baseline implementation và review hiện tại: workflow CAP/Fiori MVP, luồng audit/notification/attachment, PM monitoring và AI hỗ trợ tùy chọn có human review. | Draft |",
            "| v1.4 | 2026-07-11 | IDTS Project Team | Mentor / Supervisor | Added rendered business-review figures and Diagram Pack traceability; canonical diagram source remains version controlled. | Draft |"
            if path == brd_en
            else "| v1.4 | 2026-07-11 | IDTS Project Team | Mentor / Supervisor | Bổ sung figure review đã render và traceability tới Diagram Pack; canonical diagram source vẫn được version control. | Draft |",
        )
        block = heading + "\n\n" + introduction + "\n\n" + "\n\n".join(figure(*asset) for asset in brd_assets) + "\n\n"
        if anchor not in text:
            raise RuntimeError(f"BRD anchor missing: {anchor}")
        path.write_text(text.replace(anchor, block + anchor, 1), encoding="utf-8")

    srs_assets = [("13-srs-system-context", "SRS System Context", "docs/diagrams/07-srs-system-context.md")]
    for path in [ROOT / "docs/ba/srs/srs.en.md", ROOT / "docs/ba/srs/srs.vi.md"]:
        text = path.read_text(encoding="utf-8")
        text = update_header(text, "v1.2", "v1.3")
        old_row = (
            "| v1.2 | 2026-07-10 | IDTS Project Team | Mentor / Supervisor | Synced the implemented attachment and optional advisory-AI baseline, with explicit human-review, privacy, and no-workflow-authority constraints. | Draft |"
            if path.name.endswith("en.md")
            else "| v1.2 | 2026-07-10 | IDTS Project Team | Mentor / Supervisor | Đồng bộ baseline attachment đã triển khai và AI advisory tùy chọn, với ràng buộc rõ về human review, privacy và không có workflow authority. | Draft |"
        )
        new_row = (
            "| v1.3 | 2026-07-11 | IDTS Project Team | Mentor / Supervisor | Replaced the review-facing system-context source block with a rendered, traceable figure and Diagram Pack reference. | Draft |"
            if path.name.endswith("en.md")
            else "| v1.3 | 2026-07-11 | IDTS Project Team | Mentor / Supervisor | Thay source block system-context dùng khi review bằng figure đã render, có traceability và tham chiếu Diagram Pack. | Draft |"
        )
        path.write_text(add_version_row(text, old_row, new_row), encoding="utf-8")
        replace_mermaid(path, srs_assets)

    frs_assets = [
        ("14-frs-main-defect-flow", "Main Defect Tracking Flow", "docs/diagrams/08-frs-functional-workflows.md"),
        ("15-frs-rejected-follow-up", "Rejected Follow-up Flow", "docs/diagrams/08-frs-functional-workflows.md"),
        ("16-frs-status-lifecycle", "Status Lifecycle", "docs/diagrams/08-frs-functional-workflows.md"),
        ("17-frs-create-assignment", "Bug Creation and Assignment Activity Flow", "docs/diagrams/08-frs-functional-workflows.md"),
        ("18-frs-developer-review", "Developer Review Decision Flow", "docs/diagrams/08-frs-functional-workflows.md"),
        ("19-frs-request-more-information", "Request More Information Flow", "docs/diagrams/08-frs-functional-workflows.md"),
        ("20-frs-resolve-retest-close-reopen", "Resolve, Retest, Close, and Reopen Flow", "docs/diagrams/08-frs-functional-workflows.md"),
        ("21-frs-pm-monitoring", "PM Monitoring and Escalation Flow", "docs/diagrams/08-frs-functional-workflows.md"),
    ]
    for path in [ROOT / "docs/ba/frs/frs.en.md", ROOT / "docs/ba/frs/frs.vi.md"]:
        text = path.read_text(encoding="utf-8")
        text = update_header(text, "v1.3", "v1.4")
        old_row = (
            "| v1.3 | 2026-07-10 | IDTS Project Team | Mentor / Supervisor | Synced real draft attachment behavior and optional advisory-AI review behavior with the implemented CAP/Fiori baseline. | Draft |"
            if path.name.endswith("en.md")
            else "| v1.3 | 2026-07-10 | IDTS Project Team | Mentor / Supervisor | Đồng bộ hành vi draft attachment thực và hành vi AI advisory review tùy chọn với baseline CAP/Fiori đã triển khai. | Draft |"
        )
        new_row = (
            "| v1.4 | 2026-07-11 | IDTS Project Team | Mentor / Supervisor | Replaced eight review-facing Mermaid blocks with rendered workflow figures and closed the visual-submission open issue. | Draft |"
            if path.name.endswith("en.md")
            else "| v1.4 | 2026-07-11 | IDTS Project Team | Mentor / Supervisor | Thay tám Mermaid block dùng khi review bằng workflow figure đã render và đóng open issue về visual submission. | Draft |"
        )
        text = add_version_row(text, old_row, new_row)
        text = text.replace(
            "| OI-FRS-005 | Confirm whether Mermaid diagram source in Markdown should be rendered as images for DOCX submission. | Team / Mentor | Affects final DOCX visual format only, not functional scope. |",
            "| OI-FRS-005 | Closed: workflow diagrams are rendered as figures in the FRS and standalone Diagram Pack. | IDTS Project Team | Visual DOCX and Drive review pack are the current review baseline. |",
        ).replace(
            "| OI-FRS-005 | Xác nhận Mermaid diagram source trong Markdown có cần render thành image cho DOCX submission không. | Team / Mentor | Ảnh hưởng visual format của DOCX cuối cùng, không đổi functional scope. |",
            "| OI-FRS-005 | Closed: workflow diagrams đã được render thành figure trong FRS và Diagram Pack riêng. | IDTS Project Team | Visual DOCX và Drive review pack là review baseline hiện tại. |",
        )
        path.write_text(text, encoding="utf-8")
        replace_mermaid(path, frs_assets)


if __name__ == "__main__":
    main()
