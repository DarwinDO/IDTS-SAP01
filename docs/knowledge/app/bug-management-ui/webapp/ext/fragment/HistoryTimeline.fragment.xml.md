# Knowledge: `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`

## English

### What this file is for

Custom SAPUI5 XML fragment used by the Fiori Elements Object Page to render the bug history as an event-first timeline-style list.

### IDTS flow

When a user opens a Bug Object Page, the manifest injects this fragment as the `HistoryTimeline` section. The list binds to the bug-owned `historyEvents` composition, expands each event's `logs`, and displays the readable business event before the detailed field-level audit rows.

### Important source anchors

- `items="{ path: 'historyEvents', parameters: { $expand: 'logs', $orderby: 'createdAt desc' } }"`
  **IDTS concept**: Keeps the UI focused on grouped `HistoryEvents` while still allowing detail expansion from raw `HistoryLogs`.

- `groupedChangeContext` and `changeCount`
  **IDTS concept**: Uses the backend read model from `srv/bug-service/history-read-models.js` so users can scan the audit trail without reading every field delta first.

- i18n keys such as `historyTimelineTitle`, `historyTimelineNoData`, and `historyTimelineShowDetails`
  **IDTS concept**: Keeps user-facing text centralized for the Fiori app and prevents untranslated custom-section labels.

### Cross-folder

- Configured from `app/bug-management-ui/webapp/manifest.json`.
- Depends on `srv/service.cds` projection `BugService.HistoryEvents` with virtual fields `groupedChangeContext` and `changeCount`.
- Depends on `srv/bug-service/history-read-models.js` to enrich grouped history payloads at read time.
- Uses text keys from `app/bug-management-ui/webapp/i18n/i18n.properties` and `i18n_en.properties`.

## Vietnamese

### File này dùng để làm gì

Fragment XML SAPUI5 tùy chỉnh để Object Page của Fiori Elements hiển thị lịch sử bug theo dạng timeline dễ đọc.

### Flow IDTS

Khi user mở Object Page của một bug, manifest chèn fragment này vào section `HistoryTimeline`. Danh sách bind vào composition `historyEvents`, expand `logs`, hiển thị event nghiệp vụ dễ đọc trước rồi mới cho mở chi tiết audit từng field.

### Các điểm neo quan trọng

- Binding `historyEvents` với `$expand: 'logs'`
  **Khái niệm IDTS**: UI dùng `HistoryEvents` làm bề mặt đọc chính, còn `HistoryLogs` là chi tiết audit khi cần mở rộng.

- `groupedChangeContext` và `changeCount`
  **Khái niệm IDTS**: Dựa vào read model backend để người dùng scan lịch sử nhanh hơn.

- Các key i18n `historyTimelineTitle`, `historyTimelineNoData`, `historyTimelineShowDetails`
  **Khái niệm IDTS**: Text hiển thị được quản lý tập trung, tránh label hardcode trong custom section.

### Liên kết

`manifest.json`, `srv/service.cds`, `srv/bug-service/history-read-models.js`, và các file i18n của app.

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml.md`
- Source layer: `app`
- Last reviewed: 2026-06-27
