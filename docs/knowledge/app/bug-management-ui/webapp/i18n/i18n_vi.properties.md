# i18n_vi.properties — Vietnamese My Notifications copy

## N3 selected comment mention copy

**English:** The Vietnamese bundle mirrors `commentsMentionRecipientsLabel`, `commentsMentionRecipientsPlaceholder`, `commentsMentionRecipientsHelp`, and `notificationEventCOMMENT_MENTIONED` with UTF-8 user-facing wording. It preserves the same selected-ID-only rule as the fallback and English bundles.

**Tiếng Việt:** Bundle Vietnamese mirror `commentsMentionRecipientsLabel`, `commentsMentionRecipientsPlaceholder`, `commentsMentionRecipientsHelp` và `notificationEventCOMMENT_MENTIONED` bằng wording UTF-8 dành cho user. Nó giữ cùng rule chỉ dùng ID đã chọn như bundle fallback và English.

## English

N2 introduces this Vietnamese resource bundle for the Bug Management notification shell. It mirrors every `notification*` key in the fallback and English bundles: accessible bell/count, panel title, read/category filters, literal read state, action marker, time fallback, mark-all, loading/empty/load-more/retry and safe errors. It includes no raw backend/provider/audit wording.

Owner: DonHV. `NotificationShell.js` waits for the ResourceBundle before creating controls. A missing or mismatched key otherwise exposes a technical key or falls back inconsistently. Check all three property bundles, UI QA and the local `?lang=vi` browser fixture together. Preserve UTF-8 Vietnamese and reject replacement/mojibake characters.

## Tiếng Việt

N2 tạo bundle tiếng Việt này cho shell thông báo của Bug Management. Nó mirror mọi key `notification*` trong bundle fallback và tiếng Anh: tên chuông/count accessible, tiêu đề panel, filter trạng thái/category, chữ read-state, marker cần xử lý, thời gian fallback, mark-all, loading/empty/load-more/retry và lỗi an toàn. Không chứa wording backend/provider/audit thô.

N3 thêm đúng các lifecycle label giống bundle fallback/English, giữ `ASSIGNMENT_REMOVED` tách khỏi `PENDING_ASSIGNMENT`.

Owner: DonHV. `NotificationShell.js` chờ ResourceBundle trước khi tạo control. Thiếu/lệch key sẽ làm lộ key kỹ thuật hoặc fallback không nhất quán. Kiểm cùng ba property bundle, QA UI và fixture browser local `?lang=vi`. Giữ UTF-8 tiếng Việt, không có ký tự replacement/mojibake.
