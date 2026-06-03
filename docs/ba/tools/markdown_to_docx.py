import argparse
import html
import re
import zipfile
from pathlib import Path


"""Fallback Markdown-to-DOCX helper.

Keep this script as a minimal no-third-party fallback for environments that
cannot run Pandoc or when Pandoc renders wide Markdown tables poorly. IDTS
formal deliverables should keep Markdown tables as real editable Word tables,
not flattened bullet lists or record blocks.
"""


W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def esc(text):
    return html.escape(text, quote=False)


def strip_inline(text):
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    return text


def inline_runs(text, bold=False, size=22):
    text = strip_inline(text)
    if not text:
        text = " "
    bold_xml = "<w:b/>" if bold else ""
    return (
        f"<w:r><w:rPr>{bold_xml}<w:rFonts w:ascii=\"Aptos\" "
        f"w:hAnsi=\"Aptos\" w:eastAsia=\"Aptos\"/><w:sz w:val=\"{size}\"/></w:rPr>"
        f"<w:t xml:space=\"preserve\">{esc(text)}</w:t></w:r>"
    )


def paragraph(text="", style=None, bold=False, align=None, size=22):
    ppr = ""
    if style or align:
        ppr_items = []
        if style:
            ppr_items.append(f"<w:pStyle w:val=\"{style}\"/>")
        if align:
            ppr_items.append(f"<w:jc w:val=\"{align}\"/>")
        ppr = f"<w:pPr>{''.join(ppr_items)}</w:pPr>"
    return f"<w:p>{ppr}{inline_runs(text, bold=bold, size=size)}</w:p>"


def column_widths(rows, total_width=9638):
    col_count = max(len(r) for r in rows)
    padded_rows = [r + [""] * (col_count - len(r)) for r in rows]
    scores = []
    for col_idx in range(col_count):
        longest = max(len(row[col_idx]) for row in padded_rows)
        scores.append(max(4, min(longest, 45)))

    min_width = 850 if col_count >= 5 else 1200
    if min_width * col_count > total_width:
        min_width = max(500, total_width // col_count)

    available = max(0, total_width - (min_width * col_count))
    total_score = sum(scores) or col_count
    widths = [min_width + int(available * score / total_score) for score in scores]
    widths[-1] += total_width - sum(widths)
    return widths


def table(rows):
    if not rows:
        return ""
    col_count = max(len(r) for r in rows)
    widths = column_widths(rows)
    total_width = sum(widths)
    grid = "".join(f"<w:gridCol w:w=\"{width}\"/>" for width in widths)
    out = [
        "<w:tbl>",
        "<w:tblPr><w:tblStyle w:val=\"TableGrid\"/>"
        f"<w:tblW w:w=\"{total_width}\" w:type=\"dxa\"/>"
        "<w:tblLayout w:type=\"fixed\"/>"
        "<w:tblLook w:firstRow=\"1\" w:noHBand=\"0\" w:noVBand=\"1\"/></w:tblPr>",
        f"<w:tblGrid>{grid}</w:tblGrid>",
    ]
    for idx, row in enumerate(rows):
        out.append("<w:tr>")
        if idx == 0:
            out.append("<w:trPr><w:tblHeader/></w:trPr>")
        for col_idx, cell in enumerate(row + [""] * (col_count - len(row))):
            shade = "<w:shd w:fill=\"EAF2F8\"/>" if idx == 0 else ""
            bold = idx == 0
            width = widths[col_idx]
            out.append(
                "<w:tc>"
                f"<w:tcPr><w:tcW w:w=\"{width}\" w:type=\"dxa\"/>{shade}"
                "<w:tcMar><w:top w:w=\"90\" w:type=\"dxa\"/>"
                "<w:left w:w=\"110\" w:type=\"dxa\"/>"
                "<w:bottom w:w=\"90\" w:type=\"dxa\"/>"
                "<w:right w:w=\"110\" w:type=\"dxa\"/></w:tcMar>"
                "<w:vAlign w:val=\"center\"/></w:tcPr>"
                f"{paragraph(cell, bold=bold, size=18 if col_count >= 5 else 20)}"
                "</w:tc>"
            )
        out.append("</w:tr>")
    out.append("</w:tbl>")
    return "".join(out)


def parse_table(lines, start):
    rows = []
    i = start
    while i < len(lines):
        line = lines[i].strip()
        if not (line.startswith("|") and line.endswith("|")):
            break
        cells = [strip_inline(c.strip()) for c in line.strip("|").split("|")]
        if all(re.fullmatch(r":?-{3,}:?", c.replace(" ", "")) for c in cells):
            i += 1
            continue
        rows.append(cells)
        i += 1
    return rows, i


def markdown_to_body(md_text):
    lines = md_text.splitlines()
    body = []
    i = 0
    while i < len(lines):
        raw = lines[i]
        line = raw.rstrip()
        stripped = line.strip()
        if not stripped:
            i += 1
            continue
        if stripped.startswith("|") and stripped.endswith("|"):
            rows, i = parse_table(lines, i)
            body.append(table(rows))
            continue
        if stripped.startswith("# "):
            body.append(paragraph(stripped[2:].strip(), "Title", bold=True, align="center"))
        elif stripped.startswith("## "):
            body.append(paragraph(stripped[3:].strip(), "Heading1", bold=True))
        elif stripped.startswith("### "):
            body.append(paragraph(stripped[4:].strip(), "Heading2", bold=True))
        elif re.match(r"^\d+\.\s+", stripped):
            body.append(paragraph(stripped, "ListNumber"))
        elif stripped.startswith("- "):
            body.append(paragraph(f"- {stripped[2:].strip()}", "ListBullet"))
        else:
            body.append(paragraph(stripped))
        i += 1
    return "".join(body)


def content_types():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>"""


def root_rels():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>"""


def document_rels():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""


def styles_xml():
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="{W_NS}">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos" w:eastAsia="Aptos"/><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="240"/><w:jc w:val="center"/></w:pPr>
    <w:rPr><w:b/><w:color w:val="1F4E79"/><w:sz w:val="36"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:keepNext/><w:spacing w:before="280" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:color w:val="1F4E79"/><w:sz w:val="28"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:keepNext/><w:spacing w:before="180" w:after="100"/></w:pPr>
    <w:rPr><w:b/><w:color w:val="2F5597"/><w:sz w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListBullet">
    <w:name w:val="List Bullet"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListNumber">
    <w:name w:val="List Number"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr><w:tblBorders>
      <w:top w:val="single" w:sz="4" w:color="BFBFBF"/>
      <w:left w:val="single" w:sz="4" w:color="BFBFBF"/>
      <w:bottom w:val="single" w:sz="4" w:color="BFBFBF"/>
      <w:right w:val="single" w:sz="4" w:color="BFBFBF"/>
      <w:insideH w:val="single" w:sz="4" w:color="BFBFBF"/>
      <w:insideV w:val="single" w:sz="4" w:color="BFBFBF"/>
    </w:tblBorders><w:tblCellMar>
      <w:top w:w="90" w:type="dxa"/><w:left w:w="90" w:type="dxa"/>
      <w:bottom w:w="90" w:type="dxa"/><w:right w:w="90" w:type="dxa"/>
    </w:tblCellMar></w:tblPr>
  </w:style>
</w:styles>"""


def document_xml(body):
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="{W_NS}" xmlns:r="{R_NS}">
  <w:body>
    {body}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>"""


def core_xml(title):
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:dcterms="http://purl.org/dc/terms/"
  xmlns:dcmitype="http://purl.org/dc/dcmitype/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>{esc(title)}</dc:title>
  <dc:creator>IDTS Project Team</dc:creator>
  <cp:lastModifiedBy>IDTS Project Team</cp:lastModifiedBy>
</cp:coreProperties>"""


def app_xml():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
  xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>IDTS Markdown to DOCX</Application>
</Properties>"""


def build_docx(md_path, out_path, title):
    md_text = Path(md_path).read_text(encoding="utf-8")
    body = markdown_to_body(md_text)
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types())
        z.writestr("_rels/.rels", root_rels())
        z.writestr("word/_rels/document.xml.rels", document_rels())
        z.writestr("word/document.xml", document_xml(body))
        z.writestr("word/styles.xml", styles_xml())
        z.writestr("docProps/core.xml", core_xml(title))
        z.writestr("docProps/app.xml", app_xml())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("markdown")
    parser.add_argument("output")
    parser.add_argument("--title", default="Business Requirements Document")
    args = parser.parse_args()
    build_docx(args.markdown, args.output, args.title)


if __name__ == "__main__":
    main()
