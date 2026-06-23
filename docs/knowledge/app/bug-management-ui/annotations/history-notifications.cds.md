# Knowledge: `app/bug-management-ui/annotations/history-notifications.cds`

## English

### What this file is for

Configures the table display (LineItem) for Comments, HistoryEvents, and Notifications facets on the Bug Object Page.

### IDTS flow

These annotations control what columns are shown in:
- Comment list (author, role, content, time)
- History timeline (action type, summary, actor, changes)
- Notification list

They rely on the enriched display fields and grouped history from the backend read models.

### Important source anchors

- `UI.LineItem` annotations for the three child entities.
  **IDTS concept**: Makes the audit trail (history), collaboration (comments), and notifications readable and useful on the detail screen.

### Cross-folder

- `srv/service.cds` (projections with display names)
- `srv/bug-service/history-read-models.js` and `history.js`
- `content.js` for comments

## Vietnamese

### File này dùng để làm gì

Cấu hình bảng hiển thị cho Comments, HistoryEvents, Notifications trên Object Page.

### Flow IDTS

Điều khiển cột hiển thị cho lịch sử, comment, thông báo.

Dựa vào dữ liệu đã enrich từ backend.

## Metadata

- Source file: `app/bug-management-ui/annotations/history-notifications.cds`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/annotations/history-notifications.cds.md`
- Source layer: `app`
- Last reviewed: 2026-06-22