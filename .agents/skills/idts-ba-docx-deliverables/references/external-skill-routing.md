# External Document Skill Routing for IDTS

## English

This reference records how to use the external document skills installed under `.agents/skills/`. Treat them as supporting material. They do not override `AGENTS.md`, `idts-ba-docx-deliverables`, SAP490 hybrid decisions, or IDTS business scope.

| Skill | Best Use in IDTS | Use Level | Notes |
| --- | --- | --- | --- |
| `docx` | Advanced DOCX/OOXML work, tracked changes, comments, table of contents, headers/footers, and complex Word manipulation. | Secondary / advanced | Proprietary license is declared in its frontmatter. Use as guidance for local work; be careful before copying long content or scripts outside its installed skill folder. |
| `docx-manipulation` | Practical `python-docx` generation for headings, styles, tables, images, margins, and simple templates. | Secondary / practical | Good fit for BRD/SRS/FRS DOCX generation when tables must remain real Word tables. Its metadata mentions an office MCP server, but IDTS does not rely on that server unless separately configured. |
| `brd-creation` | BRD structure checklist: executive summary, business objectives, scope, stakeholders, assumptions, risks, KPIs, approval. | Supporting checklist | Generic BA guidance. Adapt to IDTS and SAP490 hybrid; do not include irrelevant e-commerce/mobile examples. |
| `srs-documentation` | SRS outline and validation checklist for formal software requirements. | Supporting checklist | It references IEEE 830. Use `srs-29148-guidelines.md` as the primary SRS quality guide, then use this skill only for supplemental structure ideas. |
| `frs-creation` | Detailed functional requirement format, process/input/output, acceptance criteria, data and UI behavior. | Supporting checklist | Useful for IDTS FRS after BRD/SRS baseline is confirmed. Keep CAP/Fiori technical details consistent with SAP MCP/Fiori guidance. |

### Recommended Combination

- BRD: `idts-ba-docx-deliverables` + `product-discovery` + `brd-creation` + `docx-manipulation` or `documents`.
- SRS: `idts-ba-docx-deliverables` + `srs-29148-guidelines.md` + `srs-documentation` + `dev-lifecycle` + `verify`.
- FRS: `idts-ba-docx-deliverables` + `frs-creation` + SAP CAP/Fiori/UI5 routing when implementation behavior is specified.
- DOCX layout repair: `documents` first when available, then `docx-manipulation`, then `docx` for OOXML-level fixes.

## Vietnamese

Reference này ghi lại cách dùng các external document skills đã cài dưới `.agents/skills/`. Chỉ xem chúng là tài liệu hỗ trợ. Chúng không được override `AGENTS.md`, `idts-ba-docx-deliverables`, quyết định SAP490 hybrid, hoặc scope nghiệp vụ IDTS.

| Skill | Cách dùng tốt nhất trong IDTS | Mức dùng | Ghi chú |
| --- | --- | --- | --- |
| `docx` | DOCX/OOXML nâng cao, tracked changes, comments, table of contents, header/footer, và thao tác Word phức tạp. | Phụ / nâng cao | Frontmatter khai báo proprietary license. Dùng như guidance cho local work; cẩn trọng trước khi copy nội dung dài hoặc script ra ngoài thư mục skill đã cài. |
| `docx-manipulation` | Generate tài liệu thực dụng bằng `python-docx`: heading, style, table, image, margin, template đơn giản. | Phụ / thực dụng | Phù hợp cho BRD/SRS/FRS DOCX khi bảng phải là bảng Word thật. Metadata có nhắc office MCP server, nhưng IDTS không phụ thuộc server đó nếu chưa cấu hình riêng. |
| `brd-creation` | Checklist cấu trúc BRD: executive summary, business objectives, scope, stakeholders, assumptions, risks, KPIs, approval. | Checklist hỗ trợ | Guidance BA generic. Phải điều chỉnh theo IDTS và SAP490 hybrid; không đưa ví dụ e-commerce/mobile không liên quan. |
| `srs-documentation` | Outline và checklist validation cho tài liệu software requirements chính thức. | Checklist hỗ trợ | Skill này dựa vào IEEE 830. Dùng `srs-29148-guidelines.md` làm guide chính cho chất lượng SRS, rồi chỉ dùng skill này để tham khảo thêm cấu trúc. |
| `frs-creation` | Format functional requirement chi tiết, process/input/output, acceptance criteria, data và UI behavior. | Checklist hỗ trợ | Hữu ích cho FRS của IDTS sau khi BRD/SRS baseline được xác nhận. CAP/Fiori technical detail phải nhất quán với SAP MCP/Fiori guidance. |

### Tổ Hợp Khuyến Nghị

- BRD: `idts-ba-docx-deliverables` + `product-discovery` + `brd-creation` + `docx-manipulation` hoặc `documents`.
- SRS: `idts-ba-docx-deliverables` + `srs-29148-guidelines.md` + `srs-documentation` + `dev-lifecycle` + `verify`.
- FRS: `idts-ba-docx-deliverables` + `frs-creation` + SAP CAP/Fiori/UI5 routing khi mô tả hành vi implementation.
- Sửa layout DOCX: ưu tiên `documents` khi có, sau đó `docx-manipulation`, rồi mới dùng `docx` cho fix cấp OOXML.
