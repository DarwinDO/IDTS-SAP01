# Knowledge: `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`

## English

### What this file is for

This SAPUI5 XML fragment adds the custom `History Timeline` section to the Fiori Elements Bug Object Page. The normal Fiori table still exists, but this fragment gives users a friendlier event-first view: who did what, when it happened, what changed, and why it matters.

### Beginner explanation

In this CAP/Fiori app, history is stored in two levels:

- `HistoryEvents`: one readable business event, for example “Added a comment” or “Resolved bug”.
- `HistoryLogs`: detailed field changes under that event, for example old value and new value.

This fragment is the UI layer for that idea. It binds to `historyEvents`, expands the nested `logs`, and renders each event as a list item with an icon, actor, timestamp, summary, optional detail table, and optional reason warning.

The important UI5 detail is the expression-binding syntax:

- `%{summary}` is used inside `visible` expressions so UI5 reads the raw string value.
- `%{changeCount}` is used so the number can be compared safely.
- Do not use `${summary}` for these `visible` expressions here. In a boolean property like `visible`, UI5 may try to convert the string itself into a boolean first, which causes console errors such as “is not a valid boolean value”.

### Flow in IDTS

1. User opens a bug Object Page.
2. `manifest.json` injects this fragment as the `HistoryTimeline` custom section.
3. The fragment reads `historyEvents` for the current bug.
4. CAP service logic enriches each event with display fields such as `actionTypeName`, `actorDisplayName`, and `changeCount`.
5. The UI shows a readable timeline summary first, then lets the user expand the detailed audit rows when needed.

### Important source anchors

- Location: `items="{ path: 'historyEvents', parameters: { $expand: 'logs', $orderby: 'createdAt desc' } }"`
  - IDTS concept: The Object Page uses grouped `HistoryEvents` as the primary human-readable history, while still loading detailed `HistoryLogs`.
  - Impact if broken: The timeline becomes empty or loses the detailed field-change rows.
  - Must check together: `srv/service.cds`, `srv/bug-service/history-read-models.js`, and `app/bug-management-ui/annotations/history-notifications.cds`.

- Location: `visible="{= !!%{summary} }"`
  - IDTS concept: The main timeline shows only the business event summary by default. Field-level changes are kept in `Show Details`.
  - Impact if broken: Users see noisy implementation-level field-change lines directly in the timeline.
  - Must check together: Browser console output during UAT and any change to `HistoryEvents.summary`.

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
- `srv/bug-service/history-read-models.js` fills the readable timeline fields. `groupedChangeContext` can still exist in the OData response for programmatic use, but this fragment no longer renders it directly.
- `app/bug-management-ui/annotations/history-notifications.cds` keeps the standard history table available beside this custom section.
- `app/bug-management-ui/webapp/i18n/i18n.properties` and `i18n_en.properties` provide all timeline labels.
- `scripts/qa/test-idts24-uat-playwright.js` uses this section as browser UAT evidence, so binding errors here can make IDTS-24 evidence unfit for SAP490.

### Safe editing checklist

- Keep this fragment read-only; it should explain history, not change workflow state.
- If you add text, add i18n keys in both `i18n.properties` and `i18n_en.properties`.
- If you add a new optional field in `visible`, prefer `%{fieldName}` inside expression bindings to avoid target-type conversion errors.
- Do not re-add `groupedChangeContext` as a default visible text row unless the UX decision changes. It is too noisy for the main timeline and belongs in the expandable details.
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

## 2026-07-06 Update: Limit initial History rendering with UI5 growing

### English

IDTS-47 enables `sap.m.List` growing on the Object Page History section. The first render now shows the newest 5 history events. Older events remain available through the standard UI5 growing trigger at the bottom of the list.

Why: this is the smallest supported UI fix for long audit trails. It keeps the backend history/audit model unchanged, preserves expandable `HistoryLogs`, and avoids bringing back the removed raw History table. `growingScrollToLoad` stays `false` because the Object Page contains multiple sections and scrollable content; an explicit growing trigger is clearer and avoids relying on scroll-to-load assumptions.

- **Location**: `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`
  **IDTS concept**: History should be newest-first and scan-friendly by default, while older audit events must still be reachable.
  **Impact if broken**: Bugs with many comments or lifecycle changes can stretch the Object Page, or users may lose access to older audit details.
  **Must check together**: UI5 `sap.m.List` growing behavior, Object Page browser evidence, and any future backend paging change for `HistoryEvents`.

### Vietnamese

IDTS-47 bật cơ chế `growing` của `sap.m.List` cho section History trên Object Page. Khi mở bug lần đầu, timeline chỉ render 5 history event mới nhất. Các event cũ không bị mất; user vẫn có thể bấm nút tải thêm mặc định của UI5 ở cuối list để xem tiếp.

Lý do chọn cách này: đây là fix UI nhỏ nhất nhưng vẫn đi theo cơ chế được SAPUI5 hỗ trợ cho list dài. Backend history/audit không đổi, dữ liệu `HistoryEvents` và `HistoryLogs` vẫn giữ nguyên, và phần `Show Details` vẫn mở được bảng chi tiết field/old value/new value. Cách này cũng tránh đưa bảng raw History cũ quay lại, vì bảng đó làm Object Page bị trùng thông tin và khó đọc hơn.

`growingScrollToLoad` được giữ là `false` vì Object Page có nhiều section và vùng scroll phức tạp. Nếu dùng tự động load khi scroll, user có thể không hiểu khi nào list tải thêm hoặc việc load thêm có thể phụ thuộc vào container scroll của Fiori Elements. Nút tải thêm rõ ràng hơn cho QA và cho người dùng cuối.

- **Vị trí**: `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`
  **Khái niệm IDTS**: History nên hiển thị theo hướng mới nhất trước và dễ scan, nhưng các audit event cũ vẫn phải xem được khi cần.
  **Ảnh hưởng nếu sai**: Bug có nhiều comment hoặc nhiều lần đổi trạng thái sẽ kéo Object Page quá dài, hoặc ngược lại user có thể không truy cập được lịch sử cũ.
  **Phải kiểm tra cùng**: Cơ chế `growing` của UI5 `sap.m.List`, browser evidence trên Object Page, và mọi thay đổi backend paging trong tương lai cho `HistoryEvents`.

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml.md`
- Source layer: `app`
- Last reviewed: 2026-06-28

## 2026-07-02 Update: Hide grouped change context from the main timeline

### English

The fragment no longer renders `groupedChangeContext` as a default text line under each history summary.

Why: the timeline should be easy to scan. The main line should say the business event, for example “Requested more information. Status changed from Assigned to Need More Information.” The field-level changes such as current action owner, owner role, assignee, or status are still available in the expandable `Show Details` table. Showing both summary and grouped field changes by default made the timeline noisy and exposed implementation wording too prominently.

- **Location**: `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`
  **IDTS concept**: History has two reading levels: event summary first, field-level audit details only when expanded.
  **Impact if broken**: Users see noisy technical field-change lines directly in the timeline, making the Object Page harder to read.
  **Must check together**: `srv/bug-service/history-read-models.js`, `HistoryEvents.groupedChangeContext`, `HistoryEvents.logs`, and browser smoke on the Object Page History section.

### Vietnamese

Fragment này không còn render `groupedChangeContext` thành một dòng text mặc định dưới mỗi history summary.

Lý do: timeline cần dễ đọc trước. Dòng chính chỉ nên nói event nghiệp vụ, ví dụ “Requested more information. Status changed from Assigned to Need More Information.” Các thay đổi chi tiết từng field như người đang xử lý, vai trò xử lý, assignee hoặc status vẫn nằm trong bảng `Show Details`. Nếu hiện cả summary và grouped field changes cùng lúc thì timeline bị rối và lộ wording kỹ thuật quá nhiều.

- **Vị trí**: `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`
  **Khái niệm IDTS**: History có hai tầng đọc: summary của event trước, chi tiết audit từng field chỉ xem khi mở rộng.
  **Ảnh hưởng nếu sai**: User thấy các dòng field-change kỹ thuật ngay trên timeline, làm Object Page khó đọc hơn.
  **Phải kiểm tra cùng**: `srv/bug-service/history-read-models.js`, `HistoryEvents.groupedChangeContext`, `HistoryEvents.logs`, và browser smoke ở Object Page History section.

## 2026-07-10 Update: Handoff review action lives inside History

### English

IDTS-78 moves the `Review Handoff Summary` entry point into this History fragment. The old `HandoffSummarySection.fragment.xml` was deleted because it created a separate titled Object Page section. That separate section made the page look like handoff was an isolated AI feature instead of a review tool connected to lifecycle history.

The fragment now renders a thin action row above the history list:

- left side: short user-facing helper text;
- right side: `Review Handoff Summary` button;
- below it: the normal newest-first History timeline with growing enabled.

Important anchor:

- **Location**: top `section:SmartAssignmentSection` wrapper containing `HandoffSummaryReview.openDialog`
  **IDTS concept**: Handoff summary is understood from the current bug lifecycle and history, so the entry point belongs inside History.
  **Impact if broken**: Users may lose the handoff review action, or a separate Handoff Summary section may come back.
  **Must check together**: `manifest.json`, `HandoffSummaryReview.js`, i18n `handoffSummarySectionHint`, and `scripts/qa/test-idts76-handoff-summary-ui.js`.

### Vietnamese

IDTS-78 chuyển điểm vào `Review Handoff Summary` vào chính History fragment này. File `HandoffSummarySection.fragment.xml` cũ đã bị xóa vì nó tạo ra một section Object Page riêng có tiêu đề riêng. Section riêng đó làm trang trông như handoff là một AI feature tách biệt, trong khi đúng ra nó là công cụ review gắn với lifecycle history.

Fragment hiện render một action row mỏng phía trên danh sách history:

- bên trái: câu hướng dẫn ngắn cho user;
- bên phải: nút `Review Handoff Summary`;
- bên dưới: timeline History mới nhất trước và có cơ chế tải thêm.

Anchor quan trọng:

- **Vị trí**: wrapper `section:SmartAssignmentSection` đầu file chứa `HandoffSummaryReview.openDialog`
  **Khái niệm IDTS**: Handoff summary cần được hiểu từ lifecycle/history của bug hiện tại, nên điểm vào phải nằm trong History.
  **Ảnh hưởng nếu sai**: User có thể mất nút handoff review, hoặc section Handoff Summary riêng có thể quay lại.
  **Phải kiểm tra cùng**: `manifest.json`, `HandoffSummaryReview.js`, i18n `handoffSummarySectionHint`, và `scripts/qa/test-idts76-handoff-summary-ui.js`.
