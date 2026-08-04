# Bộ câu hỏi thực tế cho buổi review mentor — IDTS SAP01

Tài liệu này phục vụ đối thoại review, không phải ngân hàng Knowledge Gate. Khi trả lời, hãy mở file được dẫn chiếu và chỉ khẳng định điều có code/evidence. Trạng thái test phải giữ đúng: **21 case PASSED, 6 human UAT PREPARED, OpenAI live DISABLED / NOT ACCEPTED**.

## Phần A — Mentor có thể hỏi team

### 1. IDTS giải quyết vấn đề gì và khác Jira ở đâu?

- **Trả lời 30–60 giây:** IDTS quản lý defect trong ngữ cảnh kiểm thử SAP: tạo bug có phân loại SAP, phân công đúng Developer, điều phối người xử lý tiếp theo, lưu comment/attachment, history và notification. IDTS không thay Jira; Jira quản lý công việc phát triển rộng hơn, còn IDTS tập trung vào vòng đời defect nghiệp vụ của đề tài.
- **Giải thích sâu:** Phạm vi cố ý không có source control, sprint planning, code review hay incident management đầy đủ. Giá trị riêng là catalog SAP Module/Application Component/Defect Category, assignment responsibility và audit theo workflow.
- **Mở đối chiếu:** `IDTS-PROJECT-SCOPE-SAP01.md`; `IDTS-Business-Rule.md`; `db/schema.cds::Bugs`.
- **Không được nói sai:** Không nói IDTS thay thế Jira hoặc tự sửa code.
- **Mentor có thể hỏi tiếp:** Chức năng nào chứng minh IDTS có domain riêng thay vì chỉ là CRUD?

### 2. Vì sao chọn CAP và Fiori Elements/UI5?

- **Trả lời 30–60 giây:** CAP tạo nhanh domain model, OData V4, draft và transaction; Fiori Elements sinh List Report/Object Page từ metadata. Custom UI5 chỉ dùng cho login, dashboard và tương tác đặc thù mà template chuẩn chưa đáp ứng.
- **Giải thích sâu:** Backend vẫn là lớp quyết định quyền/validation; UI metadata giúp giảm code giao diện thủ công nhưng không thay authorization.
- **Mở đối chiếu:** `srv/service.cds`; `app/bug-management-ui/annotations.cds`; `app/bug-management-ui/webapp/manifest.json`.
- **Không được nói sai:** Không nói mọi UI đều auto-generated hoặc hệ thống đang dùng XSUAA/BTP.
- **Mentor có thể hỏi tiếp:** Phần nào là Fiori Elements, phần nào là custom SAPUI5?

### 3. `service.cds` nối với `service.js` như thế nào?

- **Trả lời 30–60 giây:** `srv/service.cds` khai báo `BugService` và contract OData. CAP tìm implementation JS cùng service và khởi tạo class export trong `srv/service.js`; `init()` đăng ký before/on/after handler cho entity/action đã expose.
- **Giải thích sâu:** CDS quyết định tên entity/action công khai; JS dùng `this.before`, `this.on`, `this.after` để chen logic vào pipeline CAP. `super.init()` hoàn tất đăng ký chuẩn của `ApplicationService`.
- **Mở đối chiếu:** `srv/service.cds::service BugService`; `srv/service.js::class BugService`; `srv/service.js::init`.
- **Không được nói sai:** Không nói browser import hoặc gọi trực tiếp `service.js`.
- **Mentor có thể hỏi tiếp:** Nếu đổi tên file JS nhưng không cấu hình implementation thì chuyện gì xảy ra?

### 4. Vì sao `BugService` có endpoint `/odata/v4/bug/`?

- **Trả lời 30–60 giây:** Tên service và annotation/path trong CDS được CAP compile thành OData service; CAP mount OData V4 theo path công khai. Frontend khai URI này trong data source của `manifest.json`.
- **Giải thích sâu:** Request HTTP vào router CAP, được map theo service/entity/action metadata rồi mới chạy handler đã đăng ký. Endpoint không được hardcode trong từng hàm JS.
- **Mở đối chiếu:** `srv/service.cds`; `app/bug-management-ui/webapp/manifest.json`; chạy `cds compile srv --to edmx`.
- **Không được nói sai:** Không nói `service.js` tự tạo URL.
- **Mentor có thể hỏi tiếp:** Nếu đổi service path thì frontend cần sửa ở đâu?

### 5. Draft `NEW → PATCH → SAVE` khác active `CREATE/UPDATE` thế nào?

- **Trả lời 30–60 giây:** `NEW` tạo draft rỗng, các thay đổi form gửi `PATCH` vào draft, `SAVE` kích hoạt draft. Khi activate, CAP ghi active entity bằng `CREATE` cho bug mới hoặc `UPDATE` cho bug active đã được `EDIT` thành draft.
- **Giải thích sâu:** Draft events phục vụ phiên chỉnh sửa tạm; active events là persistence cuối. Vì vậy validation được đặt ở cả draft và active boundary để không thể bypass bằng direct OData.
- **Mở đối chiếu:** `srv/service.js::before NEW/PATCH/CREATE/UPDATE`; `srv/bug-service/drafts.js`; `app/bug-management-ui/webapp/ext/actions/BugListActions.js`.
- **Không được nói sai:** `creationMode: "NewPage"` không phải tên event CAP; nó là lựa chọn điều hướng UI.
- **Mentor có thể hỏi tiếp:** Chỉnh một bug active thì event nào chỉ chạy một lần và event nào có thể chạy nhiều lần?

### 6. Backend chống gọi API trực tiếp bỏ qua UI ra sao?

- **Trả lời 30–60 giây:** Mọi write/action đi qua handler backend kiểm user, role, ownership, catalog, assignee và status transition. Ẩn nút trên UI chỉ là UX; direct HTTP vẫn bị backend trả 400/401/403 nếu sai.
- **Giải thích sâu:** Write thông thường dùng `enforceBugWritePermission`; create gọi thêm `enforceBugCreatePermission`; bound lifecycle action dùng `enforceActionPermission`. Validation chạy trước persistence trong transaction request.
- **Mở đối chiếu:** `srv/bug-service/permissions.js`; `srv/bug-service/bug-write.js`; `srv/service.js`.
- **Không được nói sai:** Không nói sessionStorage hoặc visibility là security boundary.
- **Mentor có thể hỏi tiếp:** Developer PATCH `assignee_ID` trực tiếp sẽ bị chặn ở đâu?

### 7. `assignee` khác `nextProcessorUser` thế nào?

- **Trả lời 30–60 giây:** Assignee là Developer chịu trách nhiệm kỹ thuật cho bug. Next processor là người cần hành động ở bước hiện tại; có thể là assignee khi đang xử lý, reporter/Tester khi cần bổ sung hoặc retest, và PM khi chờ phân công.
- **Giải thích sâu:** Assignee có thể giữ nguyên khi status chuyển sang Resolved, nhưng next processor đổi về Tester để retest. Hai field tách nhau để ownership kỹ thuật không bị nhầm với work queue hiện tại.
- **Mở đối chiếu:** `db/schema.cds::Bugs`; `srv/bug-service/bug-write.js::determineNextProcessor`; `srv/bug-service/actions.js::transitionBug`.
- **Không được nói sai:** Không gọi next processor là người tạo bug trong mọi trạng thái.
- **Mentor có thể hỏi tiếp:** Resolve từ IN_PROGRESS thì hai field này lần lượt là ai?

### 8. Vì sao không chọn Developer thì thành `Pending Assignment`?

- **Trả lời 30–60 giây:** Hệ thống không auto-assign ngẫu nhiên. Khi tạo bug hợp lệ nhưng chưa có assignee, backend đặt `PENDING_ASSIGNMENT` để PM/Tester chủ động chọn người phù hợp và workload minh bạch.
- **Giải thích sâu:** Nếu có assignee hợp lệ thì trạng thái đầu là `ASSIGNED`; backend kiểm Developer active và responsibility phù hợp trước khi chấp nhận.
- **Mở đối chiếu:** `srv/bug-service/bug-write.js::validateAssignee`; `srv/bug-service/permissions.js`; `IDTS-Business-Rule.md`.
- **Không được nói sai:** Không gọi assignee trống là lỗi dữ liệu.
- **Mentor có thể hỏi tiếp:** Vì sao không chọn người có workload thấp nhất tự động?

### 9. Role nào được tạo, assign, resolve, close và reopen?

- **Trả lời 30–60 giây:** Tester và PM tạo bug; Tester/PM assign hoặc reassign; Developer được phân công thực hiện review/progress/request-info/resolve/reject theo rule; Tester hoặc PM retest/close/reopen theo trạng thái và ownership.
- **Giải thích sâu:** Quyền cụ thể phụ thuộc cả role, status và actor liên quan chứ không chỉ role chung. UI capability phản ánh rule, backend vẫn kiểm lại.
- **Mở đối chiếu:** `srv/bug-service/permissions.js`; `srv/bug-service/constants.js`; `app/bug-management-ui/annotations/actions.cds`.
- **Không được nói sai:** Không nói mọi Developer có thể resolve mọi bug.
- **Mentor có thể hỏi tiếp:** Direct action với đúng role nhưng sai assignee có được qua không?

### 10. Comment được lưu và audit như thế nào?

- **Trả lời 30–60 giây:** Sau khi bug tồn tại, người dùng gửi comment qua composition OData. Backend kiểm quyền/context, gắn author và timestamp; sự kiện liên quan được ghi history để truy vết mà không biến comment thành status transition.
- **Giải thích sâu:** Comment bị ẩn ở create vì root bug chưa active ổn định. Dữ liệu comment nằm trong PostgreSQL/SQLite theo môi trường và vẫn còn sau reload.
- **Mở đối chiếu:** `db/schema.cds::Comments`; `srv/bug-service/content.js::prepareCommentCreate`; `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js`.
- **Không được nói sai:** Không nói comment lưu trong browser hoặc S3.
- **Mentor có thể hỏi tiếp:** Vì sao comment create cần backend gắn author thay vì tin field từ client?

### 11. Attachment trước Save nằm ở đâu; sau Save nằm ở đâu?

- **Trả lời 30–60 giây:** Attachment dùng draft flow chuẩn của Fiori Elements và `@cap-js/attachments`. Người dùng vào Edit, upload file vào draft rồi Save. Chỉ sau khi draft được activate thì attachment thuộc bản active; metadata/reference nằm trong HANA, còn binary do storage adapter đưa tới S3.
- **Giải thích sâu:** Fiori Elements sở hữu Save/Discard và CSRF/session. Discard không được tạo attachment active. Đây là CAP draft persistence, không còn là browser-memory queue tự viết.
- **Mở đối chiếu:** `db/schema.cds::BugAttachments`; `app/bug-management-ui/annotations/object-page.cds::Attachments`; `srv/bug-service/content.js`; package `@cap-js/attachments`.
- **Không được nói sai:** Không nói custom controller tự gọi `draftEdit`, upload rồi `draftActivate`, hoặc file chỉ nằm trong browser memory tới sau Save.
- **Mentor có thể hỏi tiếp:** Tại sao không upload S3 trước rồi mới tạo bug?

### 12. Vì sao attachment dùng PostgreSQL + S3 thay vì lưu toàn bộ trong DB?

- **Trả lời 30–60 giây:** Database phù hợp với metadata, quan hệ và transaction; S3 phù hợp với binary dung lượng lớn và download streaming. Tách hai phần giúp DB nhẹ hơn, nhưng vẫn truy vết file thuộc bug nào.
- **Giải thích sâu:** `@cap-js/attachments` quản lý storage reference/content endpoint. IDTS bổ sung size, MIME/role validation và history; không expose bucket URL hoặc credential cho client.
- **Mở đối chiếu:** `package.json` dependency `@cap-js/attachments`; `db/schema.cds::BugAttachments`; evidence `docs/pm/evidence/idts-100/shared-qa-attachments/`.
- **Không được nói sai:** Không nói binary S3 và metadata DB luôn nằm trong cùng một distributed transaction.
- **Mentor có thể hỏi tiếp:** Nếu S3 upload thất bại sau khi bug save thì recovery thế nào?

### 13. `HistoryEvents` khác `HistoryLogs` thế nào?

- **Trả lời 30–60 giây:** `HistoryEvents` là một hành động nghiệp vụ dễ đọc, ví dụ Resolve Bug. `HistoryLogs` là các thay đổi field thuộc event đó, gồm field name, old value và new value.
- **Giải thích sâu:** Một event có thể có nhiều logs: status, assignee, next processor user và role. UI timeline đọc event summary; phần chi tiết expand đọc logs.
- **Mở đối chiếu:** `db/schema.cds::HistoryEvents/HistoryLogs`; `srv/bug-service/history.js::writeHistoryEvent`; `srv/bug-service/history-read-models.js`.
- **Không được nói sai:** Không gọi hai entity là dữ liệu trùng nhau.
- **Mentor có thể hỏi tiếp:** Reassign có thể sinh những HistoryLogs nào?

### 14. Vì sao history và Bug update cần cùng transaction?

- **Trả lời 30–60 giây:** Nếu bug đổi nhưng history không ghi được, audit trở nên không đáng tin. Vì vậy update bug và insert history dùng cùng transaction request; một phần lỗi thì rollback toàn bộ.
- **Giải thích sâu:** `nextState` chỉ là object dự đoán trong memory để validate. Dữ liệu thật được update qua `cds.tx(req)`; history cũng dùng cùng transaction đó.
- **Mở đối chiếu:** `srv/bug-service/actions.js::transitionBug`; `srv/bug-service/history.js::writeHistoryEvent`; `scripts/qa/test-idts89-one-to-one-action-audit.js`.
- **Không được nói sai:** Không nói `nextState` đã được ghi DB.
- **Mentor có thể hỏi tiếp:** Test nào chứng minh history failure rollback bug update?

### 15. Notification khác email ở đâu?

- **Trả lời 30–60 giây:** Notification là bản ghi nghiệp vụ trong app cho người nhận. Email là một kênh giao hàng bên ngoài; mỗi lần gửi được theo dõi bằng `NotificationDeliveries` để biết pending, sent hay failed.
- **Giải thích sâu:** Workflow tạo notification/delivery trong transaction. Worker gửi email sau transaction, nên provider chậm/lỗi không kéo theo rollback bug.
- **Mở đối chiếu:** `db/schema.cds::Notifications/NotificationDeliveries`; `srv/email/outbox.js`; annotation `app/bug-management-ui/annotations/history-notifications.cds`.
- **Không được nói sai:** Không nói có notification record đồng nghĩa inbox chắc chắn đã nhận mail.
- **Mentor có thể hỏi tiếp:** Muốn biết email đã gửi thành công thì đọc entity nào?

### 16. Outbox pattern hoạt động như thế nào?

- **Trả lời 30–60 giây:** Business transaction ghi delivery `PENDING` vào DB thay vì gọi provider ngay. Worker định kỳ lấy delivery đủ điều kiện, claim lock, tăng attempt, gọi sender rồi cập nhật `SENT` hoặc `FAILED` cùng lịch retry.
- **Giải thích sâu:** Outbox tách độ tin cậy nghiệp vụ khỏi SMTP/Brevo. Uniqueness ngăn cùng notification/channel sinh delivery trùng.
- **Mở đối chiếu:** `srv/email/outbox.js::enqueueNotificationDelivery/processEmailDeliveries`; `db/schema.cds::NotificationDeliveries`; `@assert.unique.notificationChannel`.
- **Không được nói sai:** Không nói outbox đảm bảo exactly-once tuyệt đối với mọi provider; nó giảm duplicate bằng claim/idempotency dữ liệu.
- **Mentor có thể hỏi tiếp:** Vì sao candidate lấy `batchSize * 3` rồi mới filter?

### 17. Worker là gì; vì sao cần lock token và retry?

- **Trả lời 30–60 giây:** Worker là vòng xử lý nền chạy trong Node process, không phải người dùng. `startEmailWorker()` tạo sender, gọi `processEmailDeliveries()` theo poll interval. Lock token giúp chỉ một worker claim một delivery; retry xử lý lỗi tạm thời.
- **Giải thích sâu:** Claim dùng conditional UPDATE dựa trên trạng thái/attempt/lock cũ. `lockedUntil` giải phóng delivery nếu worker chết giữa chừng; `nextAttemptAt` tạo backoff.
- **Mở đối chiếu:** `srv/email/worker.js::startEmailWorker`; `srv/email/outbox.js::processEmailDeliveries`; `srv/email/sender.js::createEmailSender`.
- **Không được nói sai:** Không gọi mỗi email là một OS thread hoặc server riêng.
- **Mentor có thể hỏi tiếp:** Hai instance Render cùng poll một delivery thì điều gì ngăn gửi đôi?

### 18. Vì sao email lỗi không rollback workflow Bug?

- **Trả lời 30–60 giây:** Bug workflow là dữ liệu cốt lõi; email là side effect có thể retry. Transaction chỉ cần lưu notification/delivery. Việc gọi provider diễn ra sau đó, lỗi sẽ thành `FAILED` và không làm mất thay đổi bug hợp lệ.
- **Giải thích sâu:** Đây là mục tiêu chính của outbox: eventual delivery. Nếu gửi SMTP trực tiếp trong transaction, timeout bên ngoài sẽ kéo dài/rollback business request không cần thiết.
- **Mở đối chiếu:** `srv/email/outbox.js`; `scripts/qa/test-email-outbox-programmatic.js`.
- **Không được nói sai:** Không nói lỗi email bị bỏ qua; nó vẫn có attempt, last error đã sanitize và retry state.
- **Mentor có thể hỏi tiếp:** Khi nào delivery không nên retry nữa?

### 19. `PENDING/SENT/FAILED/SKIPPED` có nghĩa gì?

- **Trả lời 30–60 giây:** `PENDING` chờ worker; `SENT` provider nhận gửi thành công; `FAILED` attempt lỗi và có thể retry nếu chưa vượt giới hạn; `SKIPPED` là cố ý không gửi, ví dụ email disabled hoặc recipient không hợp lệ theo rule.
- **Giải thích sâu:** `attemptCount`, `lastAttemptAt`, `nextAttemptAt`, `sentAt` và provider message ID giúp phân biệt trạng thái vận hành.
- **Mở đối chiếu:** `db/schema.cds::NotificationDeliveries`; `srv/email/outbox.js`; `scripts/qa/test-email-outbox-programmatic.js`.
- **Không được nói sai:** `SENT` không chứng minh người dùng đã đọc email; inbox confirmation là evidence riêng.
- **Mentor có thể hỏi tiếp:** FAILED khác SKIPPED về retry như thế nào?

### 20. Shared QA dùng PostgreSQL/Render/Brevo/S3 thế nào?

- **Trả lời 30–60 giây:** Render chạy CAP Node service; PostgreSQL giữ business data và metadata; S3 giữ attachment binary; Brevo là kênh email. Secret nằm trong private environment, không commit vào repo.
- **Giải thích sâu:** Deploy Shared QA dùng migration có kiểm soát, không broad seed reload. Health/auth/OData, persistence, attachment và email được test riêng.
- **Mở đối chiếu:** `render.yaml`; `package.json`; `docs/pm/evidence/idts-100/`; `docs/pm/evidence/idts-100/shared-qa-email-brevo-20260724.md`.
- **Không được nói sai:** Không gọi Render QA là production hoặc SAP BTP deployment.
- **Mentor có thể hỏi tiếp:** Thành phần nào sẽ phải thay nếu chuyển sang SAP BTP/HANA?

### 21. Local SQLite khác Shared QA PostgreSQL ở đâu?

- **Trả lời 30–60 giây:** SQLite là database file/in-memory thuận tiện cho local dev; PostgreSQL là database dùng chung trên cloud, dữ liệu tồn tại độc lập với process Render. Contract CDS chung nhưng migration, kiểu dữ liệu và concurrency cần test trên PostgreSQL.
- **Giải thích sâu:** `cds deploy` local có thể nạp seed, còn Shared QA không chạy broad deploy tùy tiện vì có thể làm thay đổi identity/seed. Attachment binary Shared QA nằm S3, không phụ thuộc filesystem Render.
- **Mở đối chiếu:** `package.json` profiles; `render.yaml`; `docs/pm/evidence/idts-100/`.
- **Không được nói sai:** Không nói test SQLite đủ chứng minh PostgreSQL production behavior.
- **Mentor có thể hỏi tiếp:** Vì sao chạy seed deploy trên Shared QA là rủi ro?

### 22. AI hiện hỗ trợ gì và không được phép tự làm gì?

- **Trả lời 30–60 giây:** AI hỗ trợ tìm bug tương tự, gợi ý classification, tóm tắt handoff và giải thích smart assignment. Kết quả là suggestion để người dùng review; AI không tự assign, tự đổi lifecycle hoặc tự ghi classification cuối cùng nếu chưa có action apply được kiểm quyền/validation.
- **Giải thích sâu:** Suggestion có audit/review state; các action accept/reject/ignore tách khỏi apply. Duplicate confirmation và metrics cũng có authorization riêng.
- **Mở đối chiếu:** `srv/ai/`; `srv/service.cds::suggestSimilarBugs/applyClassificationSuggestion/confirmDuplicateSuggestion`; `app/bug-management-ui/webapp/ext/actions/ClassificationReview.js`; `app/bug-management-ui/webapp/ext/actions/DuplicateReview.js`; `app/bug-management-ui/webapp/ext/actions/HandoffSummaryReview.js`; `app/bug-management-ui/webapp/ext/ai/AiSuggestionReview.js`.
- **Không được nói sai:** Không nói hệ thống đã có AI tự động quyết định hoặc live OpenAI accepted.
- **Mentor có thể hỏi tiếp:** Accept suggestion khác Apply classification thế nào?

### 23. Mock/fallback AI PASS khác live-provider acceptance thế nào?

- **Trả lời 30–60 giây:** Mock/fallback PASS chứng minh schema, mapping, error handling, security và no-mutation trong điều kiện kiểm soát. Live-provider acceptance phải có provider/model cấu hình thật, latency/response evidence và chất lượng đầu ra thật. Hiện OpenAI live vẫn disabled và NOT ACCEPTED.
- **Giải thích sâu:** Không được dùng deterministic fallback để tuyên bố chất lượng model. Provider unavailable phải trả fallback/safe error mà không làm workflow mutate.
- **Mở đối chiếu:** `srv/ai/provider.js`; `scripts/qa/test-idts71-ai-security-review.js`; `scripts/qa/test-idts71-render-ai-smoke.js`.
- **Không được nói sai:** Không nói 25/25 fallback smoke là live OpenAI PASS.
- **Mentor có thể hỏi tiếp:** Điều kiện tối thiểu để bật live provider là gì?

### 24. Hệ thống bảo vệ secret, token và raw error ra sao?

- **Trả lời 30–60 giây:** Secret chỉ ở private environment/config; auth trả raw token một lần rồi DB lưu `tokenHash`; UI nhận message đã sanitize; logs/evidence không in password, bearer, SMTP/AWS/OpenAI key hoặc DB URL.
- **Giải thích sâu:** Anonymous OData bị chặn, session revoke/expiry được kiểm server-side. Internal error được map thành message generic, diagnostic cũng phải redact.
- **Mở đối chiếu:** `srv/auth.js`; `srv/auth/custom-auth.js`; `srv/auth/passwords.js`; `scripts/qa/secret-scan.js` hoặc package script `qa:secret-scan`.
- **Không được nói sai:** Không nói mã hóa/hashing là cùng một việc hoặc token hash có thể dùng trực tiếp để login.
- **Mentor có thể hỏi tiếp:** Vì sao không lưu raw bearer token trong database?

### 25. Test nào đã PASS, UAT nào còn PREPARED?

- **Trả lời 30–60 giây:** Test catalog hiện ghi 21 case PASSED và 6 human UAT PREPARED. Ngoài ra có Shared QA lifecycle 40/40, AI disabled/fallback 25/25, S3 flow và Brevo SENT evidence. Sáu UAT chưa được gọi completed nếu chưa có người thực thi/sign-off đúng vai trò.
- **Giải thích sâu:** PASS programmatic không thay thế human acceptance. OpenAI live là NOT ACCEPTED vì disabled.
- **Mở đối chiếu:** `docs/sap490/generated/Test_Report_IDTS_SAP01_vi_v0.4.xlsx`; `docs/sap490/generated/UAT_IDTS_SAP01_vi_prepared_v0.2.xlsx`; `docs/pm/evidence/idts-100/`.
- **Không được nói sai:** Không đổi PREPARED thành PASS hoặc gộp mock với live.
- **Mentor có thể hỏi tiếp:** Sáu UAT cần ai thực thi và evidence gì?

### 26. Evidence nào chứng minh một test thật sự PASS?

- **Trả lời 30–60 giây:** Một PASS cần baseline commit/deploy, input/role, expected và actual result, exit/status, timestamp/executor, limitation và artifact mentor mở được. Chỉ tên script hoặc command không đủ.
- **Giải thích sâu:** Browser flow cần screenshot/network/console; API cần sanitized request-response; persistence cần readback; attachment cần hash; email cần delivery status và inbox confirmation khi claim live.
- **Mở đối chiếu:** `docs/sap490/generated/Integration_Evidence_Index_IDTS_SAP01_v0.1.xlsx`; `docs/pm/evidence/idts-100/`; `AGENTS.md` QA evidence rules.
- **Không được nói sai:** Không dùng local private path hoặc screenshot không có context làm bằng chứng duy nhất.
- **Mentor có thể hỏi tiếp:** Làm sao chứng minh test chạy đúng commit đang demo?

### 27. Nếu request lỗi, team debug UI → Network → CAP → DB theo thứ tự nào?

- **Trả lời 30–60 giây:** Tái hiện UI và xem console; mở Network lấy method/URL/status/payload; đặt breakpoint tại handler CAP tương ứng; step qua permission/validation/transaction; cuối cùng đọc DB/external side effect và response. Không đoán từ màn hình rồi sửa ngay.
- **Giải thích sâu:** Nếu request không xuất hiện, lỗi ở UI/binding. Có request 404 thì kiểm manifest/service path. Có 4xx thì kiểm rule; 5xx thì kiểm sanitized server diagnostic và transaction rollback.
- **Mở đối chiếu:** `docs/learning/debug-labs/`; `srv/service.js`; `srv/service.cds`; VS Code Run and Debug.
- **Không được nói sai:** Không bắt đầu bằng sửa database hoặc tắt validation.
- **Mentor có thể hỏi tiếp:** Breakpoint đầu tiên cho Create Bug đặt ở đâu?

### 28. Điểm yếu/rủi ro hiện tại của dự án là gì?

- **Trả lời 30–60 giây:** Shared QA chưa phải production; PostgreSQL/Render cần quyết định migration dài hạn; custom auth chưa phải XSUAA; live OpenAI chưa accepted; human UAT còn PREPARED; external email/S3 có eventual-consistency và recovery boundary cần vận hành.
- **Giải thích sâu:** Team đã ghi risk thay vì che giấu. Mục tiêu tiếp theo là close UAT, quyết định platform/identity và chỉ bật AI khi có acceptance metric/evidence.
- **Mở đối chiếu:** `docs/pm/risk-decision-log.md`; `docs/pm/current-status.md`; Jira `IDTS-45`, `IDTS-99`.
- **Không được nói sai:** Không gọi mọi limitation là bug P0 hoặc nói project production-ready.
- **Mentor có thể hỏi tiếp:** Rủi ro nào bắt buộc xử lý trước demo cuối?

### 29. Tài liệu SAP490 lấy source of truth từ đâu?

- **Trả lời 30–60 giây:** Repo là source of truth: canonical business docs, CDS/JS/UI source, Jira/PR và evidence đã sanitize. Generator đưa structured data vào official template; Drive là bản review/collaboration, không phải nơi chỉnh tay làm nguồn chính.
- **Giải thích sâu:** Version hiện hành nằm trong current tree; bản cũ được giữ qua tag `sap490-generated-archive-20260726` và manifest hash. Validator kiểm template fidelity, trace và test truth.
- **Mở đối chiếu:** `docs/sap490/generated-archive-manifest-20260726.md`; `scripts/sap490/`; `docs/sap490/templates/`.
- **Không được nói sai:** OfficeCLI schema PASS không tự chứng minh nội dung chính xác.
- **Mentor có thể hỏi tiếp:** Nếu Drive và repo khác nhau thì nguồn nào thắng và sync ra sao?

### 30. Thành viên nào sở hữu phần nào và có thể giải thích code đến đâu?

- **Trả lời 30–60 giây:** DonHV lead backend/integration/BA-PM; DatDT sở hữu shell/login/dashboard và UI chính; SangVN sở hữu Object Page, assignment/collaboration; NhanT sở hữu QA/release evidence. Ownership là trách nhiệm hiểu, debug, review và handoff, không chỉ chia FE/BE cứng nhắc.
- **Giải thích sâu:** Mỗi owner phải trace caller → handler → persistence, chạy debug lab và teach-back. Người khác vẫn có thể support nhưng không thay owner tự hiểu phần mình.
- **Mở đối chiếu:** `docs/learning/ownership-map.md`; `docs/learning/progress/`; `docs/pm/status/`.
- **Không được nói sai:** Không tuyên bố mọi thành viên đã PASS mọi flow nếu chưa có evidence.
- **Mentor có thể hỏi tiếp:** Mỗi người sẽ debug flow nào ngay tại buổi review?

## Phần B — Team nên hỏi mentor

Mỗi quyết định nhận được phải ghi vào Jira và `docs/pm/risk-decision-log.md`; không chỉ giữ trong ghi chú cá nhân.

| # | Câu hỏi với mentor | Vì sao cần hỏi | Quyết định cần ghi nhận |
| ---: | --- | --- | --- |
| 1 | Mentor kỳ vọng IDTS dừng ở Shared QA hay cần lộ trình production/BTP rõ hơn? | Tránh đầu tư deploy vượt scope hoặc thiếu kỳ vọng cuối kỳ. | Target environment cuối, mốc và acceptance. |
| 2 | PostgreSQL/Render có được chấp nhận cho demo cuối hay cần kế hoạch HANA/BTP? | Ảnh hưởng migration, chi phí và tài liệu kiến trúc. | Nền tảng được chấp nhận và follow-up bắt buộc. |
| 3 | Mức chi tiết nào của Technical Specification được xem là đủ? | Tránh tài liệu vừa sơ sài vừa nhồi trace quá mức. | Danh sách tab/flow/bảng bắt buộc và mức source symbol. |
| 4 | Khi xung đột, mentor ưu tiên official template fidelity hay trace code sâu hơn? | Template có vùng hẹp nhưng dự án có nhiều flow. | Quy tắc đặt summary trong template và evidence/detail phụ. |
| 5 | UAT cần mentor ký trực tiếp hay người dùng đại diện có thể sign-off? | Sáu UAT hiện mới PREPARED. | Người ký hợp lệ, evidence và thời hạn. |
| 6 | Evidence GitHub/Drive/Jira nào được mentor chấp nhận chính thức? | Một số link cần quyền và local path không dùng được. | Nguồn evidence chính, quyền truy cập và retention. |
| 7 | OpenAI live có bắt buộc cho acceptance hay disabled/fallback đủ trong scope? | Live provider cần key, chi phí, privacy và quality gate. | ACCEPTED/BLOCKED cùng điều kiện bật. |
| 8 | AI suggestion cần metric chất lượng tối thiểu nào? | Tránh gọi AI tốt chỉ vì API chạy. | Dataset, threshold và người duyệt. |
| 9 | Có cần retention policy chính thức cho attachment, history và notification không? | Dữ liệu audit/file/email có vòng đời và chi phí khác nhau. | Thời gian giữ, delete quyền và backup. |
| 10 | Có cần SAP Identity/XSUAA thay custom auth trong scope cuối không? | Ảnh hưởng kiến trúc bảo mật và BTP deployment. | Custom auth được chấp nhận cho demo hay phải migrate. |
| 11 | `Pending Assignment`, reject và reopen hiện đã đúng kỳ vọng nghiệp vụ chưa? | Đây là ba nhánh ảnh hưởng next processor và audit. | Transition/role/reason chính thức. |
| 12 | Sprint tiếp theo nên ưu tiên code quality, coverage, tài liệu hay deployment? | Nguồn lực team hạn chế và backlog còn nhiều loại việc. | Thứ tự ưu tiên cùng tiêu chí Done. |
| 13 | Comment beginner-first trong source có phù hợp hay đang quá nhiều? | Comment giúp học nhưng có thể làm code khó đọc nếu kể lại cú pháp. | Mức comment mong muốn và phạm vi mirror. |
| 14 | Mentor muốn mỗi thành viên demo/debug chính xác flow ownership nào? | Team cần chuẩn bị sâu thay vì học thuộc toàn hệ thống. | Flow, breakpoint và thời lượng của từng member. |
| 15 | Limitation nào được chấp nhận để kết thúc và limitation nào bắt buộc sửa? | Tránh che giấu rủi ro hoặc sửa lan man trước deadline. | Danh sách accepted limitation và blocker cuối. |

## Cách luyện nhanh trước review

1. Chọn ngẫu nhiên 10 câu ở Phần A.
2. Trả lời miệng tối đa 60 giây, sau đó mở đúng file/symbol trong 90 giây.
3. Nếu không mở được reference hoặc giải thích sai side effect, đánh dấu **learning gap**, không tự tính PASS.
4. Chọn ba câu Phần B quan trọng nhất để hỏi mentor và chuẩn bị người ghi quyết định.
