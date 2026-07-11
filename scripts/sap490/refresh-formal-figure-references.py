"""Point formal IDTS specifications at readable PNG figures and add SRS architecture/data-model context."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


FIGURE = re.compile(
    r"!\[(?P<title>[^]]+)\]\(\.\./\.\./diagrams/(?:rendered|review/png)/(?P<asset>[^)]+)\.(?:svg|png)\)(?:\{[^}]+\})?(?:\n\n\*(?P<caption>[^*]+)\*)?"
)

VI_TITLES = {
    "01-system-context-and-architecture": "Bối cảnh và kiến trúc hệ thống",
    "02-cap-fiori-architecture": "Kiến trúc CAP và Fiori",
    "03-use-case-diagram": "Use case theo vai trò",
    "04-end-to-end-process-flow": "Luồng xử lý defect đầu cuối",
    "09-conceptual-data-model": "Mô hình dữ liệu IDTS khái niệm",
    "13-srs-system-context": "Bối cảnh hệ thống SRS",
    "14-frs-main-flow": "Luồng theo dõi defect chính",
    "15-frs-rejected-sequence": "Luồng defect bị từ chối",
    "16-frs-lifecycle": "Vòng đời trạng thái defect",
    "17-frs-create-assignment": "Tạo defect và phân công",
    "18-frs-developer-review": "Developer review",
    "19-frs-request-information": "Yêu cầu thêm thông tin",
    "20-frs-resolve-retest-close-reopen": "Resolve, retest, close và reopen",
    "21-frs-pm-monitoring": "PM monitoring và workload",
}


def caption(asset: str, title: str, vietnamese: bool) -> str:
    number = asset.split("-", 1)[0]
    title = re.sub(r"^(?:Figure\s+\d+\.\s*)+", "", title)
    title = re.split(r"\.?\s*IDTS Diagram Pack", title, maxsplit=1)[0].rstrip(". ")
    if vietnamese:
        title = VI_TITLES.get(asset, title)
    source = "IDTS Diagram Pack; editable master is maintained as a draw.io file with the project artifacts."
    if vietnamese:
        source = "IDTS Diagram Pack; bản có thể chỉnh sửa được quản lý dưới dạng file draw.io cùng artifact của dự án."
    return f"![Figure {number}. {title}. {source}](../../diagrams/review/png/{asset}.png){{ width=6.5in }}\n\n"


def replace_figures(path: Path, vietnamese: bool) -> None:
    text = path.read_text(encoding="utf-8")
    text, count = FIGURE.subn(lambda match: caption(match["asset"], match["title"], vietnamese), text)
    if count == 0:
        raise RuntimeError(f"No formal figure reference found in {path}")
    text = re.sub(r"(\)\{ width=6\.5in \})\n{3,}", r"\1\n\n", text)
    path.write_text(text, encoding="utf-8")


def add_version(text: str, version: str, summary: str) -> str:
    if f"| {version} | 2026-07-11" in text:
        return text
    marker = "| v1.4 | 2026-07-11"
    if marker in text:
        row_end = text.index("\n", text.index(marker))
        row = f"| {version} | 2026-07-11 | IDTS Project Team | Mentor / Supervisor | {summary} | Draft |"
        return text[:row_end] + "\n" + row + text[row_end:]
    marker = "| v1.3 | 2026-07-11"
    if marker in text:
        row_end = text.index("\n", text.index(marker))
        row = f"| {version} | 2026-07-11 | IDTS Project Team | Mentor / Supervisor | {summary} | Draft |"
        return text[:row_end] + "\n" + row + text[row_end:]
    raise RuntimeError("Expected version-history marker not found")


def keep_one_architecture_block(text: str, architecture_heading: str, user_classes_heading: str) -> str:
    """Remove only a duplicated generated SRS architecture/data-model block."""
    first = text.find(architecture_heading)
    if first < 0:
        return text
    second = text.find(architecture_heading, first + len(architecture_heading))
    if second < 0:
        return text
    end = text.find(user_classes_heading, second)
    if end < 0:
        raise RuntimeError("Duplicated SRS figure block has no user-class boundary")
    return text[:second] + text[end:]


def update_brd_and_frs() -> None:
    for folder, stem in [("brd", "brd"), ("frs", "frs")]:
        for language in ("en", "vi"):
            path = ROOT / "docs" / "ba" / folder / f"{stem}.{language}.md"
            replace_figures(path, language == "vi")
            text = path.read_text(encoding="utf-8")
            text = text.replace("Status: Draft v1.4", "Status: Draft v1.5")
            summary = (
                "Replaced review figures with editable draw.io sources and readable PNG/PDF review outputs."
                if language == "en"
                else "Thay figure review bằng source draw.io có thể chỉnh sửa và output PNG/PDF dễ đọc."
            )
            path.write_text(add_version(text, "v1.5", summary), encoding="utf-8")


def update_srs() -> None:
    additions = {
        "en": (
            "### 4.1.1 CAP/Fiori Architecture\n\n"
            "This figure separates the browser UI, custom authentication, CAP OData service, workflow handlers, data model, and external delivery/storage adapters. It is a system view, not a deployment credential or endpoint specification.\n\n"
            + caption("02-cap-fiori-architecture", "CAP and Fiori Architecture", False)
            + "\n\n### 4.1.2 Conceptual Data Model\n\n"
            "This conceptual view explains the business relationships used for classification, assignment, history, notifications, attachments, and duplicate links. The CDS schema remains the implementation source of truth.\n\n"
            + caption("09-conceptual-data-model", "Conceptual IDTS Data Model", False)
            + "\n\n"
        ),
        "vi": (
            "### 4.1.1 Kiến trúc CAP/Fiori\n\n"
            "Figure này tách rõ UI trên trình duyệt, custom authentication, CAP OData service, workflow handler, data model và adapter email/lưu file. Đây là góc nhìn hệ thống, không chứa endpoint hay credential triển khai.\n\n"
            + caption("02-cap-fiori-architecture", "Kiến trúc CAP và Fiori", True)
            + "\n\n### 4.1.2 Mô hình dữ liệu khái niệm\n\n"
            "Góc nhìn khái niệm này giải thích quan hệ nghiệp vụ dùng cho classification, assignment, history, notification, attachment và duplicate link. CDS schema vẫn là nguồn triển khai chính thức.\n\n"
            + caption("09-conceptual-data-model", "Mô hình dữ liệu IDTS khái niệm", True)
            + "\n\n"
        ),
    }
    for language in ("en", "vi"):
        path = ROOT / "docs" / "ba" / "srs" / f"srs.{language}.md"
        replace_figures(path, language == "vi")
        text = path.read_text(encoding="utf-8")
        architecture_heading = "### 4.1.1 CAP/Fiori Architecture" if language == "en" else "### 4.1.1 Kiến trúc CAP/Fiori"
        user_classes_heading = "### 4.2 User Classes" if language == "en" else "### 4.2 Nhóm người dùng"
        text = keep_one_architecture_block(text, architecture_heading, user_classes_heading)
        text = text.replace("Status: Draft v1.3", "Status: Draft v1.4")
        anchor = user_classes_heading
        if anchor not in text:
            raise RuntimeError(f"SRS anchor not found in {path}")
        if architecture_heading not in text:
            text = text.replace(anchor, additions[language] + anchor, 1)
        summary = (
            "Replaced review figures with editable draw.io sources and added architecture/data-model figures for formal technical review."
            if language == "en"
            else "Thay figure review bằng source draw.io có thể chỉnh sửa và bổ sung figure kiến trúc/data model cho technical review."
        )
        path.write_text(add_version(text, "v1.4", summary), encoding="utf-8")


def main() -> None:
    update_brd_and_frs()
    update_srs()


if __name__ == "__main__":
    main()
