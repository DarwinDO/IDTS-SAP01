"""Create a compact PNG contact sheet for visual QA of rendered diagrams."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
PNG_DIR = ROOT / "docs" / "diagrams" / "rendered" / "png"
OUTPUT = ROOT / "docs" / "diagrams" / "rendered" / "diagram-contact-sheet.png"
THUMBNAIL = (480, 280)
COLUMNS = 3
PADDING = 24
LABEL_HEIGHT = 42


def main() -> None:
    images = sorted(PNG_DIR.glob("*.png"))
    if len(images) != 21:
        raise RuntimeError(f"Expected 21 rendered PNGs, found {len(images)}")
    rows = (len(images) + COLUMNS - 1) // COLUMNS
    width = COLUMNS * (THUMBNAIL[0] + PADDING) + PADDING
    height = rows * (THUMBNAIL[1] + LABEL_HEIGHT + PADDING) + PADDING
    sheet = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()

    for index, path in enumerate(images):
        image = Image.open(path).convert("RGBA")
        image.thumbnail(THUMBNAIL)
        col = index % COLUMNS
        row = index // COLUMNS
        x = PADDING + col * (THUMBNAIL[0] + PADDING)
        y = PADDING + row * (THUMBNAIL[1] + LABEL_HEIGHT + PADDING)
        offset_x = x + (THUMBNAIL[0] - image.width) // 2
        offset_y = y + (THUMBNAIL[1] - image.height) // 2
        sheet.paste(image, (offset_x, offset_y), image)
        draw.rectangle((x, y, x + THUMBNAIL[0], y + THUMBNAIL[1]), outline="#cbd5e1")
        draw.text((x, y + THUMBNAIL[1] + 10), path.stem, fill="#0f172a", font=font)

    sheet.save(OUTPUT)
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
