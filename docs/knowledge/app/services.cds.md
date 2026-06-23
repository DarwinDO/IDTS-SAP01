# Knowledge: `app/services.cds`

## English

### What this file is for

Tiny aggregator that pulls in the Fiori annotations for the bug-management-ui app. It tells the CAP build to include all the UI metadata defined under `app/bug-management-ui/annotations`.

### IDTS flow

When the CAP server starts or the Fiori app is built, this file causes the annotation files (list-report, object-page, actions, value-helps, capabilities, etc.) to be merged with the service metadata from `srv/service.cds`.

Without this, Fiori Elements would not know about the custom buttons, facets, value helps, or hidden logic.

### Important source anchors

- `using from './bug-management-ui/annotations';`
  **IDTS concept**: The single import that brings all IDTS-specific Fiori UI metadata (action buttons for assign/reject/resolve, history facet, attachment rules, capability-driven visibility, dependent value helps for Application Component → Defect Category, etc.).
  **Impact if broken**: The Fiori app loses all custom UI behavior — no action buttons, wrong facets, no value help filtering, bad labels.
  **Must check together**: `app/bug-management-ui/annotations/*` (all sub files), `srv/service.cds`, `app/bug-management-ui/webapp/manifest.json`.

### Cross-folder dependency map

Links the annotation layer to the service contract (`srv/service.cds`) and the app manifest.

### Safe editing checklist

When you add a new annotation module, import it here. When you change annotation behavior, also verify the compiled metadata and browser behavior.

## Vietnamese

### File này dùng để làm gì

File nhỏ dùng để kéo toàn bộ annotation Fiori của app bug-management-ui vào build. Nó bảo CAP phải include metadata UI được định nghĩa dưới annotations.

### Flow hoạt động trong IDTS

Khi CAP chạy hoặc build Fiori, file này khiến tất cả annotation (list-report, object-page, actions, value-helps, capabilities...) được trộn vào metadata của service.

Nếu thiếu, Fiori Elements sẽ không biết nút action, facet, value help hay logic ẩn/hiện.

### Các điểm neo quan trọng trong source

Import duy nhất kéo toàn bộ metadata UI IDTS (nút assign/reject/resolve, history facet, attachment, capability visibility, value help phụ thuộc component → defect category...).

### Liên kết với file/folder khác

Nối annotation layer với service contract (srv/service.cds) và manifest của app.

### Checklist sửa an toàn

Thêm annotation module mới → import ở đây. Thay đổi annotation → verify metadata compiled + browser.

## Metadata

- Source file: `app/services.cds`
- Knowledge mirror: `docs/knowledge/app/services.cds.md`
- Source layer: `app`
- Last reviewed: 2026-06-22