# Knowledge: `app/bug-management-ui/annotations.cds`

> **Ownership / debug anchor:** DatDT owns this annotation aggregator (backup: SangVN). If a whole UI rule disappears, trace this import chain before changing the Fiori page.
> **Ownership / điểm debug:** DatDT sở hữu file gom annotation này (backup: SangVN). Nếu cả một rule UI biến mất, lần theo chuỗi import này trước khi sửa trang Fiori.

## English

### What this file is for

Root aggregator for all Fiori annotations used by the bug management app. It imports the main service and then brings in the modular annotation files for labels, value helps, capabilities, list report, object page, actions, ownership, history/notifications, etc.

### IDTS flow

CAP combines these annotations with the metadata from `srv/service.cds` at runtime/build time. Fiori Elements then uses the combined metadata to generate the List Report and Object Page with IDTS-specific buttons, facets, value helps, and visibility rules.

### Important source anchors

- The series of `using from './annotations/xxx';` imports.
  **IDTS concept**: This file is the single place that assembles all IDTS UI behavior: action buttons with capability-driven visibility, dependent value helps (Application Component → Defect Category), history and notification facets, attachment handling, and ownership display.
  **Impact if broken**: The entire custom Fiori UI for bug management (buttons, sections, filtering, labels) breaks or falls back to generic generated UI.
  **Must check together**: All files under `app/bug-management-ui/annotations/`, `srv/service.cds`, `app/bug-management-ui/webapp/manifest.json`.

### Cross-folder dependency map

Bridges the annotation world to the service contract (`srv/service.cds`) and the app bootstrap (`manifest.json`).

### Safe editing checklist

When adding or renaming an annotation sub-file, update the import here. After annotation changes, recompile metadata and test in the browser (action visibility, value help, facets).

## Vietnamese

### File này dùng để làm gì

File gốc tổng hợp tất cả annotation Fiori cho app quản lý bug. Nó import service chính và kéo các file annotation con (labels, value helps, capabilities, list report, object page, actions, ownership, history/notifications...).

### Flow hoạt động trong IDTS

CAP trộn các annotation này với metadata từ service.cds. Fiori Elements dùng kết quả để sinh List Report/Object Page với nút, facet, value help và quy tắc ẩn/hiện đặc thù của IDTS.

### Các điểm neo quan trọng trong source

Các dòng import annotation con. Đây là nơi lắp ráp toàn bộ hành vi UI IDTS (nút action theo capability, value help phụ thuộc, history/notification facet, attachment...).

### Liên kết với file/folder khác

Nối annotation với service contract và manifest.

### Checklist sửa an toàn

Thêm/đổi tên file annotation con → cập nhật import ở đây. Sau khi sửa annotation, compile metadata và test browser (visibility nút, value help, facet).

## Metadata

- Source file: `app/bug-management-ui/annotations.cds`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/annotations.cds.md`
- Source layer: `app`
- Last reviewed: 2026-06-22
