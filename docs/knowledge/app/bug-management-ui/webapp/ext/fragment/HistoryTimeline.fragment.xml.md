# Knowledge: `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`

## English

### What this file is for

This SAPUI5 XML fragment adds the custom `History Timeline` section to the Fiori Elements Bug Object Page. The normal Fiori table still exists, but this fragment gives users a friendlier event-first view: who did what, when it happened, what changed, and why it matters.

### Beginner explanation

In this CAP/Fiori app, history is stored in two levels:

- `HistoryEvents`: one readable business event, for example “Added a comment” or “Resolved bug”.
- `HistoryLogs`: detailed field changes under that event, for example old value and new value.

This fragment is the UI layer for that idea. It binds to `historyEvents`, expands the nested `logs`, and renders each event as a list item with an icon, actor, timestamp, summary, optional grouped change text, optional detail table, and optional reason warning.

The important UI5 detail is the expression-binding syntax:

- `%{summary}` is used inside `visible` expressions so UI5 reads the raw string value.
- `%{changeCount}` is used so the number can be compared safely.
- Do not use `${summary}` for these `visible` expressions here. In a boolean property like `visible`, UI5 may try to convert the string itself into a boolean first, which causes console errors such as “is not a valid boolean value”.

### Flow in IDTS

1. User opens a bug Object Page.
2. `manifest.json` injects this fragment as the `HistoryTimeline` custom section.
3. The fragment reads `historyEvents` for the current bug.
4. CAP service logic enriches each event with display fields such as `actionTypeName`, `actorDisplayName`, `groupedChangeContext`, and `changeCount`.
5. The UI shows a readable timeline first, then lets the user expand the detailed audit rows when needed.

### Important source anchors

- Location: `items="{ path: 'historyEvents', parameters: { $expand: 'logs', $orderby: 'createdAt desc' } }"`
  - IDTS concept: The Object Page uses grouped `HistoryEvents` as the primary human-readable history, while still loading detailed `HistoryLogs`.
  - Impact if broken: The timeline becomes empty or loses the detailed field-change rows.
  - Must check together: `srv/service.cds`, `srv/bug-service/history-read-models.js`, and `app/bug-management-ui/annotations/history-notifications.cds`.

- Location: `visible="{= !!%{summary} }"` and `visible="{= !!%{groupedChangeContext} }"`
  - IDTS concept: Summary and grouped change context are optional readable text blocks.
  - Impact if broken: UI5 can log binding format errors and hide or render timeline text incorrectly.
  - Must check together: Browser console output during IDTS-24 UAT and any change to `HistoryEvents.summary` or `groupedChangeContext`.

- Location: `visible="{= %{changeCount} > 0 }"`
  - IDTS concept: The “Show Details” panel should appear only when there are raw audit log rows.
  - Impact if broken: Users either cannot inspect field-level changes or see an empty details panel.
  - Must check together: `HistoryEvents.logs`, `HistoryLogs`, and the backend enrichment that calculates `changeCount`.

- Location: `ObjectStatus text="{reason}" ... visible="{= !!%{reason} }"`
  - IDTS concept: Rejection, request-more-information, and other reason-based actions need visible explanation.
  - Impact if broken: Users may miss the reason behind a workflow decision.
  - Must check together: lifecycle actions in `srv/bug-service/actions.js` and annotations for history/reason display.

### Cross-folder impact

- `app/bug-management-ui/webapp/manifest.json` registers this fragment as the Object Page custom section.
- `srv/service.cds` exposes `BugService.HistoryEvents` and its nested `logs`.
- `srv/bug-service/history-read-models.js` fills the readable timeline fields.
- `app/bug-management-ui/annotations/history-notifications.cds` keeps the standard history table available beside this custom section.
- `app/bug-management-ui/webapp/i18n/i18n.properties` and `i18n_en.properties` provide all timeline labels.
- `scripts/qa/test-idts24-uat-playwright.js` uses this section as browser UAT evidence, so binding errors here can make IDTS-24 evidence unfit for SAP490.

### Safe editing checklist

- Keep this fragment read-only; it should explain history, not change workflow state.
- If you add text, add i18n keys in both `i18n.properties` and `i18n_en.properties`.
- If you add a new optional field in `visible`, prefer `%{fieldName}` inside expression bindings to avoid target-type conversion errors.
- If you change fields coming from `HistoryEvents`, verify the backend projection and read-model enrichment still provide them.
- Rerun browser UAT and inspect console output, not only screenshots.

## Vietnamese

### File này dùng để làm gì

Fragment XML SAPUI5 này thêm section custom `History Timeline` vào Bug Object Page của Fiori Elements. Bảng History chuẩn vẫn còn, nhưng fragment này giúp user đọc lịch sử theo kiểu dễ hiểu hơn: ai đã làm gì, làm lúc nào, thay đổi gì, và lý do là gì.

### Giải thích cho người mới

Trong app CAP/Fiori này, lịch sử được chia thành hai tầng:

- `HistoryEvents`: một event nghiệp vụ dễ đọc, ví dụ “Added a comment” hoặc “Resolved bug”.
- `HistoryLogs`: chi tiết thay đổi từng field bên dưới event đó, ví dụ giá trị cũ và giá trị mới.

Fragment này là phần UI cho ý tưởng đó. Nó bind vào `historyEvents`, expand thêm `logs`, rồi render mỗi event thành một item gồm icon, người thực hiện, thời gian, summary, đoạn mô tả thay đổi nếu có, bảng detail nếu có, và reason warning nếu action có lý do.

Chi tiết UI5 quan trọng nằm ở expression binding:

- `%{summary}` được dùng trong `visible` để UI5 đọc raw string value.
- `%{changeCount}` được dùng để so sánh number an toàn.
- Không dùng `${summary}` cho các expression `visible` trong fragment này. Vì `visible` là boolean property, UI5 có thể cố convert string thành boolean trước, gây lỗi console kiểu “is not a valid boolean value”.

### Flow trong IDTS

1. User mở Object Page của một bug.
2. `manifest.json` chèn fragment này vào custom section `HistoryTimeline`.
3. Fragment đọc `historyEvents` của bug hiện tại.
4. CAP service enrich mỗi event bằng các field dễ hiển thị như `actionTypeName`, `actorDisplayName`, `groupedChangeContext`, và `changeCount`.
5. UI hiển thị timeline dễ đọc trước, sau đó cho user mở bảng audit chi tiết khi cần.

### Các điểm neo quan trọng

- Vị trí: `items="{ path: 'historyEvents', parameters: { $expand: 'logs', $orderby: 'createdAt desc' } }"`
  - Khái niệm IDTS: Object Page dùng `HistoryEvents` làm lịch sử chính dễ đọc, nhưng vẫn load được `HistoryLogs` chi tiết.
  - Ảnh hưởng nếu sai: Timeline bị trống hoặc mất các dòng thay đổi field chi tiết.
  - Phải kiểm tra cùng: `srv/service.cds`, `srv/bug-service/history-read-models.js`, và `app/bug-management-ui/annotations/history-notifications.cds`.

- Vị trí: `visible="{= !!%{summary} }"` và `visible="{= !!%{groupedChangeContext} }"`
  - Khái niệm IDTS: Summary và grouped change context là các đoạn text dễ đọc nhưng có thể không phải event nào cũng có.
  - Ảnh hưởng nếu sai: UI5 có thể báo lỗi binding format và timeline có thể ẩn hoặc render text sai.
  - Phải kiểm tra cùng: Console browser khi chạy IDTS-24 UAT và mọi thay đổi liên quan `HistoryEvents.summary` hoặc `groupedChangeContext`.

- Vị trí: `visible="{= %{changeCount} > 0 }"`
  - Khái niệm IDTS: Panel “Show Details” chỉ nên hiện khi event có audit log chi tiết.
  - Ảnh hưởng nếu sai: User không xem được field-level changes, hoặc thấy panel detail trống.
  - Phải kiểm tra cùng: `HistoryEvents.logs`, `HistoryLogs`, và backend enrichment tính `changeCount`.

- Vị trí: `ObjectStatus text="{reason}" ... visible="{= !!%{reason} }"`
  - Khái niệm IDTS: Các action như reject hoặc request more information cần hiển thị lý do rõ ràng.
  - Ảnh hưởng nếu sai: User có thể không thấy lý do của quyết định workflow.
  - Phải kiểm tra cùng: lifecycle actions trong `srv/bug-service/actions.js` và annotation hiển thị history/reason.

### Liên kết với file khác

- `app/bug-management-ui/webapp/manifest.json` đăng ký fragment này làm custom section trên Object Page.
- `srv/service.cds` expose `BugService.HistoryEvents` và `logs` bên trong.
- `srv/bug-service/history-read-models.js` fill các field dễ đọc cho timeline.
- `app/bug-management-ui/annotations/history-notifications.cds` giữ bảng History chuẩn bên cạnh custom section này.
- `app/bug-management-ui/webapp/i18n/i18n.properties` và `i18n_en.properties` chứa toàn bộ label của timeline.
- `scripts/qa/test-idts24-uat-playwright.js` dùng section này làm evidence browser UAT, nên lỗi binding ở đây có thể làm evidence IDTS-24 không đủ sạch để đưa vào SAP490.

### Checklist sửa an toàn

- Giữ fragment này chỉ để đọc lịch sử; không thêm logic đổi trạng thái workflow ở đây.
- Nếu thêm text mới, thêm key i18n vào cả `i18n.properties` và `i18n_en.properties`.
- Nếu thêm field optional trong `visible`, ưu tiên `%{fieldName}` trong expression binding để tránh lỗi convert target type.
- Nếu đổi field lấy từ `HistoryEvents`, kiểm tra lại projection backend và read-model enrichment.
- Chạy lại browser UAT và xem console output, không chỉ nhìn screenshot.

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml.md`
- Source layer: `app`
- Last reviewed: 2026-06-28
