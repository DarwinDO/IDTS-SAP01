# Knowledge: `app/bug-management-ui/webapp/i18n/i18n_en.properties`

## English

### What this file is for

English-specific i18n texts (overrides or additions to the base i18n.properties).

Contains the same keys as the base file but targeted for English locale.

### IDTS impact

Provides clear English labels for Create Bug flow, action buttons, default headers, and the custom History Timeline section in the Fiori UI.

### Important source anchors

- `historyTimelineTitle`, `historyTimelineNoData`, and `historyTimelineShowDetails`
  **IDTS concept**: English labels for the custom grouped history timeline section and expandable detail panel.

## Vietnamese

### File này dùng để làm gì

Text tiếng Anh cụ thể cho i18n.

### Ảnh hưởng IDTS

Cung cấp nhãn rõ ràng tiếng Anh cho các flow tạo bug, action, và History Timeline.

## IDTS-43 update - English labels for Create Bug and History

### English

IDTS-43 keeps this English bundle aligned with the base bundle by defining the same visible labels:

- `createBug=Create Bug`
- `historyTimelineTitle=History`

For a new Fiori learner, this matters because Fiori resolves labels through the i18n model. If the manifest references `{i18n>createBug}` and this key is missing, the UI can display a technical placeholder instead of a clean button label.

Important anchor:

- Location: `createBug` and `historyTimelineTitle`
  - IDTS concept: English text for role-aware create and the single History section.
  - Impact if broken: English locale users can see inconsistent labels or missing-key placeholders.
  - Must check together: base `i18n.properties`, `manifest.json`, and the Object Page History configuration.

### Vietnamese

IDTS-43 giữ file English bundle này đồng bộ với base bundle bằng cách định nghĩa cùng các label hiển thị:

- `createBug=Create Bug`
- `historyTimelineTitle=History`

Với người mới học Fiori, điểm này quan trọng vì Fiori lấy label qua i18n model. Nếu manifest reference `{i18n>createBug}` mà key này bị thiếu, UI có thể hiện placeholder kỹ thuật thay vì label button sạch.

Điểm neo quan trọng:

- Vị trí: `createBug` và `historyTimelineTitle`
  - Khái niệm IDTS: text tiếng Anh cho create theo role và một section History duy nhất.
  - Ảnh hưởng nếu sai: User dùng English locale có thể thấy label lệch hoặc placeholder key bị thiếu.
  - Phải kiểm tra cùng: base `i18n.properties`, `manifest.json`, và cấu hình History trên Object Page.

## IDTS-54 update - English dashboard labels

### English

IDTS-54 keeps the English bundle aligned with the base bundle by adding the same `dashboard*` keys used by the custom dashboard page.

Important anchor:

- Location: keys beginning with `dashboard`
  - IDTS concept: English locale text for role-based dashboard tiles, focus list, workload list, and safe load error.
  - Impact if broken: English users can see missing-key placeholders or inconsistent dashboard wording.
  - Must check together: base `i18n.properties`, `dashboard.html`, and `dashboard-page.js`.

### Vietnamese

IDTS-54 giữ English bundle đồng bộ với base bundle bằng cách thêm cùng các key `dashboard*` mà custom dashboard page đang dùng.

Anchor quan trọng:

- Vị trí: các key bắt đầu bằng `dashboard`
  - Khái niệm IDTS: text English cho tile dashboard theo role, focus list, workload list, và lỗi load dữ liệu an toàn.
  - Ảnh hưởng nếu sai: user dùng English locale có thể thấy placeholder key hoặc wording dashboard không đồng nhất.
  - Phải kiểm tra cùng: base `i18n.properties`, `dashboard.html`, và `dashboard-page.js`.

## IDTS-55 update - comments and evidence text

### English

IDTS-55 adds the English user-facing strings for the custom Comments and Evidence / Attachments sections.

Important anchors:

- **Location**: `app/bug-management-ui/webapp/i18n/i18n_en.properties:158`
  `commentsSectionTitle=Comments`
  **IDTS concept**: English title and labels for the custom comment feed.
  **Impact if broken**: English users may see missing keys or unclear comment labels.
  **Must check together**: `CommentsSection.fragment.xml`, `i18n.properties`, and browser smoke.

- **Location**: `app/bug-management-ui/webapp/i18n/i18n_en.properties:171`
  `attachmentsSectionTitle=Evidence / Attachments`
  **IDTS concept**: English title and labels for evidence upload/list UX.
  **Impact if broken**: The attachment section may show missing keys or text that feels internal rather than product-facing.
  **Must check together**: `AttachmentsSection.fragment.xml`, `i18n.properties`, and browser smoke.

### Vietnamese

IDTS-55 thêm các chuỗi tiếng Anh hiển thị cho custom Comments và Evidence / Attachments sections.

Các anchor quan trọng:

- **Vị trí**: `app/bug-management-ui/webapp/i18n/i18n_en.properties:158`
  `commentsSectionTitle=Comments`
  **Khái niệm IDTS**: Title và label tiếng Anh cho comment feed custom.
  **Ảnh hưởng nếu sai**: User dùng tiếng Anh có thể thấy missing key hoặc label comment khó hiểu.
  **Phải kiểm tra cùng**: `CommentsSection.fragment.xml`, `i18n.properties`, và browser smoke.

- **Vị trí**: `app/bug-management-ui/webapp/i18n/i18n_en.properties:171`
  `attachmentsSectionTitle=Evidence / Attachments`
  **Khái niệm IDTS**: Title và label tiếng Anh cho UX upload/list evidence.
  **Ảnh hưởng nếu sai**: Attachment section có thể hiện missing key hoặc text quá nội bộ/dev-facing.
  **Phải kiểm tra cùng**: `AttachmentsSection.fragment.xml`, `i18n.properties`, và browser smoke.

## IDTS-56 update - English Smart Assign labels

### English

This file mirrors the base bundle's `smartAssign*` labels for English locale users.

Important anchors:

- `smartAssignDeveloper=Smart Assign`
- `smartAssignDialogTitle=Smart Assign Developer`
- `smartAssignBusyWarning` and `smartAssignUnavailableWarning`
- `smartAssignAssignedToast` and `smartAssignAssignFailed`

Impact if broken: the Object Page action or dialog can display missing i18n placeholders in English locales.

Must check together: base `i18n.properties`, `manifest.json`, and `SmartAssignDeveloper.js`.

### Vietnamese

File này giữ các label `smartAssign*` cho English locale, đồng bộ với base bundle.

Các key quan trọng:

- `smartAssignDeveloper=Smart Assign`
- `smartAssignDialogTitle=Smart Assign Developer`
- `smartAssignBusyWarning` và `smartAssignUnavailableWarning`
- `smartAssignAssignedToast` và `smartAssignAssignFailed`

Nếu thiếu key, Object Page action hoặc dialog có thể hiện placeholder kỹ thuật thay vì label sạch.

Phải kiểm tra cùng: base `i18n.properties`, `manifest.json`, và `SmartAssignDeveloper.js`.

## IDTS-73 update - Create-time attachment pending text

### English

IDTS-73 adds `attachmentsPendingNoData`. This is the English fallback key for the pending local-file list on the Create Bug page.

### Vietnamese

IDTS-73 thêm `attachmentsPendingNoData`. Đây là key tiếng Anh dự phòng cho danh sách local-file đang chờ trên Create Bug page.

## Metadata

- Source file: `app/bug-management-ui/webapp/i18n/i18n_en.properties`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/i18n/i18n_en.properties.md`
- Source layer: `app`
- Last reviewed: 2026-07-01
