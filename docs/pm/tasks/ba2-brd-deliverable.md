# BA-002 - BRD Deliverables

Status: Done
Owner workstream: BA/PM
Last updated: 2026-06-02

## Goal

Create the formal Business Requirements Document for IDTS in separate English and Vietnamese versions, with both Markdown and DOCX outputs for mentor review and SAP490 deliverable preparation.

## Outputs

| File | Purpose |
| --- | --- |
| `docs/ba/brd/brd.en.md` | English BRD source document |
| `docs/ba/brd/brd.vi.md` | Vietnamese BRD source document |
| `docs/ba/brd/brd.en.docx` | English BRD review/submission document |
| `docs/ba/brd/brd.vi.docx` | Vietnamese BRD review/submission document |
| `docs/ba/tools/markdown_to_docx.py` | Local fallback helper for generating DOCX from Markdown when Pandoc is unavailable |

## Completion Notes

- BRD scope is based on the existing IDTS business baseline, BA pack, PM pack, SAP490 guidance, and mentor clarification about `Rejected` follow-up.
- BRD was revised to v1.1 using SAP490 hybrid style: business-first, with light SAP implementation context and detailed technical behavior deferred to SRS/FRS.
- Pandoc was tested for DOCX generation, but default rendering broke wide tables. Final DOCX files use the local fallback helper, which keeps content editable and converts wide tables into readable record blocks.
- DOCX files were rendered and visually checked through the Documents workflow.
- The local fallback helper was later updated to keep Markdown tables as real editable Word tables, with fixed table widths, wrapped content, header rows, and smaller table font for wide tables.

## Next Step

Review the BRD with the user/mentor. After approval or feedback, create SRS and FRS using the same folder-per-document and language-split pattern.

## Vietnamese

## Mục tiêu

Tạo tài liệu Business Requirements Document chính thức cho IDTS bằng hai bản tiếng Anh và tiếng Việt riêng, đồng thời có cả Markdown và DOCX để review với mentor và chuẩn bị deliverable SAP490.

## Kết quả

| File | Mục đích |
| --- | --- |
| `docs/ba/brd/brd.en.md` | File nguồn BRD tiếng Anh |
| `docs/ba/brd/brd.vi.md` | File nguồn BRD tiếng Việt |
| `docs/ba/brd/brd.en.docx` | File BRD tiếng Anh để review/nộp |
| `docs/ba/brd/brd.vi.docx` | File BRD tiếng Việt để review/nộp |
| `docs/ba/tools/markdown_to_docx.py` | Công cụ local tạo DOCX từ Markdown khi máy chưa có Pandoc/LibreOffice |

## Ghi chú hoàn thành

- Scope của BRD dựa trên business baseline IDTS, bộ tài liệu BA, bộ tài liệu PM, hướng dẫn SAP490 và clarification của mentor về follow-up sau `Rejected`.
- BRD đã được chỉnh lên v1.1 theo hướng SAP490 hybrid: ưu tiên nghiệp vụ, chỉ giữ bối cảnh triển khai SAP ở mức ngắn gọn và chuyển chi tiết kỹ thuật sang SRS/FRS.
- Đã thử tạo DOCX bằng Pandoc, nhưng render mặc định làm vỡ các bảng rộng. File DOCX cuối cùng ban đầu dùng local fallback helper, nội dung vẫn chỉnh sửa được và các bảng rộng được chuyển thành record block dễ đọc.
- Các file DOCX đã được render và kiểm tra trực quan bằng workflow của Documents.
- Helper fallback local sau đó đã được cập nhật để giữ Markdown table thành bảng Word thật có thể chỉnh sửa, với fixed table width, nội dung wrap, header row, và font bảng nhỏ hơn cho bảng rộng.

## Bước tiếp theo

Review BRD với user/mentor. Sau khi được duyệt hoặc có feedback, tạo SRS và FRS theo cùng pattern: mỗi loại tài liệu có folder riêng, tách file tiếng Anh và tiếng Việt.
