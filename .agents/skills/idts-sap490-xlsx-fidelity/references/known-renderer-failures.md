# Known XLSX renderer failures

| Symptom | Typical cause | Required response |
| --- | --- | --- |
| Header border looks gray/faint | automatic or theme border color; thin anti-aliasing | use explicit ARGB from reference and compare Excel/PDF |
| Top/bottom border appears but side edges disappear | only anchor cell of merged range was styled | apply edges to physical boundary cells or use an approved renderer-safe span |
| Grid appears through body rows | no solid fill or accidental borders outside the formal block | apply reference fill across the intended band and remove unintended borders |
| Layout looks correct in LibreOffice but not Excel | renderer-specific merge/drawing interpretation | treat Excel/reference behavior as authoritative and document the difference |
| Diagram clips connectors or cell frames | global resize, changed anchor, or aspect-ratio drift | restore approved geometry; do not enlarge automatically |
| Text becomes tiny | broad shrink-to-fit or page fit | restore reference font and adjust approved local layout/content only |
| Unexpected blank pages | stale print area/page breaks or far-away formatted cells | compare print settings and used regions with the reference |
| Workbook style count explodes | creating new style objects per cell | reuse copied reference styles and audit style counts |
| Existing content disappears | editing the wrong candidate/current file or range | freeze paths/hashes and limit writes to the approved scope |
