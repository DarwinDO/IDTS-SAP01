# Knowledge: `app/bug-management-ui/annotations/history-notifications.cds`

> **Ownership / debug anchor:** SangVN owns readable history/notification presentation (backup: NhanT). When an event looks wrong, compare this UI annotation with the event written by `srv/bug-service/history.js`.
> **Ownership / điểm debug:** SangVN sở hữu cách trình bày history/notification dễ đọc (backup: NhanT). Khi event hiển thị sai, so annotation này với event do `srv/bug-service/history.js` ghi.

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

## Execution map / Sơ đồ thực thi (2026-07-18)

**English.** Backend workflows persist Comments, HistoryEvents/Logs, Notifications, and DuplicateLinks; this file only describes their read-only tables, labels, criticality, and hidden technical fields. Fiori reads navigation properties from the current Bug and renders rows. Wrong data/actor belongs in backend history/notification writers; correct data with wrong label/order/visibility belongs here. Notification email delivery details remain a separate entity.

**Tiếng Việt.** Backend workflow persist Comments, HistoryEvents/Logs, Notifications và DuplicateLinks; file này chỉ mô tả table read-only, label, criticality và field kỹ thuật cần ẩn. Fiori đọc navigation từ Bug hiện tại rồi render row. Dữ liệu/actor sai thì debug writer backend; dữ liệu đúng nhưng label/thứ tự/visibility sai thì debug file này. Chi tiết gửi email vẫn nằm ở entity delivery riêng.
