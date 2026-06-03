# Upstream Source and Adaptation Notes

English:

This skill is adapted from `phucnt-bazone-vietnam/product-discovery`, the Ask Why Senior BA elicitation skill by Phuc NT / BA Zone / Digital School.

Source reviewed:

- `SKILL.md`
- `references/detection-logic.md`
- `references/requirement-layers.md`
- `references/question-library.json`
- `references/output-schema.json`
- `templates/findings-summary.md`
- `LICENSE`

Preserved concepts:

- Discovery-first workflow.
- Intent detection.
- Requirement layer detection using BABOK-style layers.
- Known / Unknown gap detection.
- Ask 3-5 contextual questions per turn.
- Solution bias handling.
- Business insight extraction.
- Edge case scan.
- Structured summary with open questions and assumptions.

Adapted for IDTS:

- Digital School examples were replaced with SAP defect tracking examples.
- Question bank was rewritten for bug creation, duplicate check, classification, assignment, Developer review, Rejected follow-up, retest/closure, notifications, audit, PM monitoring, Fiori UX, and authorization.
- Output schema was extended with IDTS scope classification and impacted artifact tracking.
- Handoff rules were aligned with `AGENTS.md`, canonical IDTS docs, SAP MCP-first routing, and bilingual documentation rules.

Not active in this repo:

- Claude Project Knowledge setup instructions.
- Digital School learner, mentor, course, payment, loyalty, and enrollment examples.
- Marketing or community workshop text.
- Any rule that would prevent this repo from writing BRD/SRS/FRS after discovery is complete.

License and attribution:

- Upstream license: MIT with attribution requirement.
- Original author attribution must remain visible: Phuc NT / BA Zone / Digital School.

Vietnamese:

Skill này được điều chỉnh từ `phucnt-bazone-vietnam/product-discovery`, Ask Why Senior BA elicitation skill của Phuc NT / BA Zone / Digital School.

Nguồn đã đọc:

- `SKILL.md`
- `references/detection-logic.md`
- `references/requirement-layers.md`
- `references/question-library.json`
- `references/output-schema.json`
- `templates/findings-summary.md`
- `LICENSE`

Các concept được giữ:

- Discovery-first workflow.
- Intent detection.
- Requirement layer detection theo BABOK-style layers.
- Known / Unknown gap detection.
- Hỏi 3-5 câu theo ngữ cảnh mỗi lượt.
- Xử lý solution bias.
- Business insight extraction.
- Edge case scan.
- Structured summary có open questions và assumptions.

Các phần đã adapt cho IDTS:

- Ví dụ Digital School được thay bằng ví dụ SAP defect tracking.
- Question bank được viết lại cho create bug, duplicate check, classification, assignment, Developer review, Rejected follow-up, retest/closure, notification, audit, PM monitoring, Fiori UX và authorization.
- Output schema được mở rộng thêm scope classification và impacted artifact tracking cho IDTS.
- Handoff rules được align với `AGENTS.md`, canonical IDTS docs, SAP MCP-first routing và bilingual documentation rules.

Không active trong repo này:

- Hướng dẫn setup Claude Project Knowledge.
- Ví dụ learner, mentor, course, payment, loyalty, enrollment của Digital School.
- Nội dung marketing hoặc workshop cộng đồng.
- Bất kỳ rule nào khiến repo này không được viết BRD/SRS/FRS sau khi discovery đã đủ rõ.

License và attribution:

- License gốc: MIT có yêu cầu attribution.
- Cần giữ attribution tác giả gốc: Phuc NT / BA Zone / Digital School.
