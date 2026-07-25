# IDTS-101 — SAP490 Specifications Template Remediation

## English

- Owner: DonHV
- Status: Complete — local verification and same-ID Drive synchronization passed
- Due date: 2026-07-26
- Jira: `IDTS-101`
- Baseline Git SHA: `8009b2a6a72d73db28f190b3a0bcbb65b1ff4740`
- Baseline Render deploy: `dep-d9i0r537uimc73as0be0`

### Scope

- Regenerate Blueprint, Functional Specification, Technical Specification, and Configuration Note in English and Vietnamese from their official templates.
- Preserve every required sheet, section, style, header/footer, approval block, merge, print setting, and hidden-sheet state.
- Replace SAP sample residue with current IDTS CAP/Fiori content or a reasoned `N/A`.
- Trace current authentication, draft/active lifecycle, exact actions, PostgreSQL, S3, email outbox, and AI review/apply/metrics behavior.
- Update the eight existing Google Drive files in place after local acceptance.

### Acceptance status

- OfficeCLI schema validation: PASS, 8/8.
- Strict template/content validator: PASS.
- Functional Specification: 9/9 sheets.
- Technical Specification: 12/12 sheets.
- Configuration Note: 5/5 sheets; sheets `4` and `5` remain hidden.
- Blueprint: official three-section/style/core-table contract preserved.
- LibreOffice/PDF visual review: PASS, 105/105 pages.
- Google Drive same-ID synchronization: PASS, 8/8; metadata and raw-byte readback verified.
- Blueprint Drive preview pagination: PASS after refreshing the cached `NUMPAGES` result (`26` EN, `25` VI).

### Out of scope

- No CAP/Fiori runtime, OData, schema, or business workflow change.
- No live OpenAI acceptance claim.
- No mentor approval or signature is filled by the agent.

## Vietnamese

- Owner: DonHV
- Trạng thái: Hoàn thành — kiểm tra local và đồng bộ Drive giữ nguyên ID đã đạt
- Hạn: 26/07/2026
- Jira: `IDTS-101`
- Git SHA baseline: `8009b2a6a72d73db28f190b3a0bcbb65b1ff4740`
- Render deploy baseline: `dep-d9i0r537uimc73as0be0`

### Phạm vi

- Sinh lại Blueprint, Functional Specification, Technical Specification và Configuration Note bằng tiếng Anh/Việt từ đúng template chính thức.
- Giữ nguyên các sheet, section, style, header/footer, vùng approval, merge, print setting và trạng thái sheet ẩn bắt buộc.
- Thay dữ liệu mẫu SAP không thuộc IDTS bằng nội dung CAP/Fiori hiện hành hoặc `N/A` có lý do.
- Trace đúng auth, draft/active lifecycle, exact actions, PostgreSQL, S3, email outbox và AI review/apply/metrics.
- Sau khi local acceptance đạt, cập nhật tại chỗ đúng tám file hiện có trên Google Drive.

### Trạng thái nghiệm thu

- OfficeCLI schema validation: PASS 8/8.
- Validator nghiêm ngặt về template/nội dung: PASS.
- Functional Specification: đủ 9/9 sheet.
- Technical Specification: đủ 12/12 sheet.
- Configuration Note: đủ 5/5 sheet; sheet `4` và `5` vẫn ẩn.
- Blueprint: giữ đúng hợp đồng ba section/style/bảng lõi của template.
- Visual review qua LibreOffice/PDF: PASS 105/105 trang.
- Đồng bộ Drive giữ nguyên ID: PASS 8/8; metadata và raw-byte readback đã được xác minh.
- Phân trang Blueprint trên Drive preview: PASS sau khi cập nhật cache `NUMPAGES` (`26` EN, `25` VI).

### Ngoài phạm vi

- Không đổi CAP/Fiori runtime, OData, schema hoặc luồng nghiệp vụ.
- Không tuyên bố OpenAI live đã được nghiệm thu.
- Agent không tự điền phê duyệt hoặc chữ ký mentor.
