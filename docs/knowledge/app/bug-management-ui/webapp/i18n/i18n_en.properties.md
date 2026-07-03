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

## Metadata

- Source file: `app/bug-management-ui/webapp/i18n/i18n_en.properties`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/i18n/i18n_en.properties.md`
- Source layer: `app`
- Last reviewed: 2026-07-01
