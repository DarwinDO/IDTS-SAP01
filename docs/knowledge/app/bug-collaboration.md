# Bug collaboration UI: comments and attachments

## English

IDTS keeps comment and attachment writes inside SAPUI5/CAP-managed OData flows.

- `Post Comment` binds the existing `BugService.addComment` operation through the OData V4 model. It invokes the action with the explicit `$auto` batch group, so UI5 owns the normal batch and CSRF-token lifecycle. Do not use `invoke("$direct")` for this AppRouter-protected write.
- After the action succeeds, refresh only the `idtsCommentsFeed` items binding with `requestRefresh("$direct")`. This API returns a Promise. If that read refresh fails, the comment is still treated as committed and the user is asked to refresh the page; the UI must not report a failed post.
- Attachments use the single `@cap-js/attachments` Fiori Elements facet. Do not restore the retired custom uploader or manual `draftEdit` / binary upload / `draftActivate` chain.
- When HTML5 content changes, keep the package and `sap.app.applicationVersion` versions aligned and incremented. AppRouter marks `index.html`, `manifest.json`, `Component.js` and `Component-preload.js` as no-store entry assets. Together these controls stop an older manifest from continuing to display a retired custom section beside the generated facet.

Debug in this order: browser Network inner OData response → served manifest/metadata → CAP logs → HANA/S3 readback. Do not disable CSRF to make a write pass.

## Tiếng Việt

IDTS giữ thao tác ghi comment và attachment trong luồng OData do SAPUI5/CAP quản lý.

- `Post Comment` bind action `BugService.addComment` bằng OData V4 model và gọi qua batch group `$auto`. Nhờ vậy UI5 quản lý batch và CSRF token theo chuẩn. Không dùng `invoke("$direct")` cho write đi qua AppRouter có CSRF protection.
- Sau khi action thành công, chỉ refresh items binding của `idtsCommentsFeed` bằng `requestRefresh("$direct")`. API này trả về Promise. Nếu refresh phần hiển thị thất bại thì comment vẫn được xem là đã commit; UI chỉ yêu cầu reload, không báo sai rằng post thất bại.
- Attachment dùng duy nhất facet Fiori Elements của `@cap-js/attachments`. Không khôi phục custom uploader hoặc chuỗi thủ công `draftEdit` / upload binary / `draftActivate`.
- Khi thay đổi HTML5 content, version trong package và `sap.app.applicationVersion` phải đồng bộ và được tăng. AppRouter đặt chính sách no-store cho `index.html`, `manifest.json`, `Component.js` và `Component-preload.js`, ngăn browser tiếp tục dùng manifest cũ và hiển thị custom section đã bỏ.

Thứ tự debug: inner OData response trong Network → manifest/metadata thực tế → CAP log → readback HANA/S3. Không tắt CSRF để làm write chạy được.
