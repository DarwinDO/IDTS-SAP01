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

File nay giu cac label `smartAssign*` cho English locale, dong bo voi base bundle.

Neu thieu key, Object Page action hoac dialog co the hien placeholder ky thuat thay vi label sach.

## Metadata

- Source file: `app/bug-management-ui/webapp/i18n/i18n_en.properties`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/i18n/i18n_en.properties.md`
- Source layer: `app`
- Last reviewed: 2026-07-06
