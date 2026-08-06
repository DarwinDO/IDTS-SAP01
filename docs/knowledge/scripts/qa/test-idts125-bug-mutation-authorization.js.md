# `test-idts125-bug-mutation-authorization.js`

## Purpose / Mục đích

**English.** Focused regression for IDTS-125. It deploys an isolated in-memory SQLite model, proves unauthorized active Bug updates return 403 without persistence, checks the role/assignee capability matrix, checks attachment authorization, and verifies the Fiori annotations use the split controls.

**Tiếng Việt.** Regression tập trung cho IDTS-125. Script deploy model SQLite in-memory cô lập, chứng minh active Bug update trái quyền trả 403 và không persist, kiểm matrix capability theo role/assignee, kiểm quyền attachment và xác nhận Fiori annotation dùng capability đã tách.

Run: `npm run qa:idts125:programmatic`.

The impacted IDTS-122 regression now asserts attachment navigation against `canManageAttachments`; `canEdit` remains the standard Edit-shell visibility capability.

Regression IDTS-122 bị ảnh hưởng giờ assert navigation attachment theo `canManageAttachments`; `canEdit` tiếp tục là capability hiển thị standard Edit shell.

The focused matrix also rejects an authenticated-but-unmapped attachment actor, proving the affected collaboration write fails closed. / Matrix tập trung cũng reject actor attachment đã xác thực nhưng không map được, chứng minh collaboration write liên quan fail-closed.
