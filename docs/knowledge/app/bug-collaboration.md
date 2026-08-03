# Bug collaboration UI: comments and attachments

## English

IDTS keeps comment and attachment writes inside SAPUI5/CAP-managed OData flows.

- `Post Comment` binds the existing `BugService.addComment` operation through the OData V4 model. The operation uses the model update group, so UI5 can send the write through its normal batch and CSRF-token lifecycle. A direct `invoke("$direct")` is not used for this AppRouter-protected write.
- After a successful comment action, only the `idtsCommentsFeed` items binding is refreshed. If that read refresh fails, the action is still treated as committed and the user is asked to refresh the page; it is not reported as a failed post.
- Attachments use the single `@cap-js/attachments` Fiori Elements facet. Do not restore the retired custom uploader or manual `draftEdit` / binary upload / `draftActivate` chain.
- When HTML5 app content changes, keep the package and `sap.app.applicationVersion` versions aligned and incremented. Reusing the original version can leave an old manifest in the browser cache and make a retired custom section appear beside the generated facet.

Debug in this order: browser Network inner OData response → served manifest/metadata → CAP logs → HANA/S3 readback. Do not disable CSRF to make a write pass.

## Tiếng Việt

IDTS giữ thao tác ghi comment và attachment trong luồng OData do SAPUI5/CAP quản lý.

- `Post Comment` bind action `BugService.addComment` bằng OData V4 model và dùng update group mặc định. Nhờ vậy UI5 xử lý batch và CSRF token theo chuẩn. Không dùng `invoke("$direct")` cho write đi qua AppRouter có CSRF protection.
- Sau khi action comment thành công, chỉ refresh items binding của `idtsCommentsFeed`. Nếu refresh phần hiển thị thất bại thì comment vẫn được xem là đã commit; UI chỉ yêu cầu reload, không báo sai rằng post thất bại.
- Attachment dùng duy nhất facet Fiori Elements của `@cap-js/attachments`. Không khôi phục custom uploader hoặc chuỗi thủ công `draftEdit` / upload binary / `draftActivate`.
- Khi thay đổi HTML5 app content, version trong package và `sap.app.applicationVersion` phải đồng bộ và được tăng. Dùng lại version cũ có thể khiến browser giữ manifest cũ và hiển thị custom section đã bỏ cạnh facet mới.

Thứ tự debug: inner OData response trong Network → manifest/metadata thực tế → CAP log → readback HANA/S3. Không tắt CSRF để làm write chạy được.
